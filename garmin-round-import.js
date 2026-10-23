(function(global){
  "use strict";

  const SCHEMA_VERSION=1;
  const safeNumber=value=>{const n=Number(value);return Number.isFinite(n)?n:null};
  const clean=value=>String(value??"").trim();
  const isoDate=value=>{if(!value)return"";const d=new Date(value);return Number.isNaN(d.getTime())?clean(value).slice(0,10):d.toISOString().slice(0,10)};

  function parseCsv(text){
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;continue}
      if(ch==='"'){quoted=!quoted;continue}
      if(ch===','&&!quoted){row.push(cell);cell="";continue}
      if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>clean(v)))rows.push(row);row=[];cell="";continue}
      cell+=ch;
    }
    row.push(cell);if(row.some(v=>clean(v)))rows.push(row);
    if(rows.length<2)throw new Error("The CSV does not contain round data.");
    const headers=rows.shift().map(h=>clean(h).toLowerCase().replace(/[^a-z0-9]+/g,"_"));
    return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,clean(values[i])])));
  }

  function allObjects(value,out=[]){
    if(!value||typeof value!=="object")return out;
    if(Array.isArray(value)){value.forEach(v=>allObjects(v,out));return out}
    out.push(value);Object.values(value).forEach(v=>allObjects(v,out));return out;
  }
  function first(objects,names){
    for(const o of objects)for(const name of names)if(o[name]!==undefined&&o[name]!==null&&clean(o[name])!=="")return o[name];
    return null;
  }
  function holeRows(objects){
    return objects.filter(o=>safeNumber(o.hole??o.hole_number??o.holeNumber??o.hole_index??o.holeIndex)!==null)
      .map(o=>({
        hole:safeNumber(o.hole??o.hole_number??o.holeNumber??o.hole_index??o.holeIndex),
        par:safeNumber(o.par??o.hole_par??o.holePar),
        strokes:safeNumber(o.strokes??o.score??o.gross_score??o.grossScore),
        putts:safeNumber(o.putts??o.num_putts??o.numPutts),
        fairway:clean(o.fairway??o.fairway_hit??o.fairwayHit),
        greenInRegulation:clean(o.green_in_regulation??o.greenInRegulation??o.gir)
      })).filter(h=>h.hole&&h.hole<=36).sort((a,b)=>a.hole-b.hole);
  }
  function normalize(raw,sourceFormat,fileName){
    const objects=allObjects(raw),perHole=holeRows(objects);
    const totalFromHoles=perHole.length&&perHole.every(h=>h.strokes)?perHole.reduce((n,h)=>n+h.strokes,0):null;
    const holesPlayed=safeNumber(first(objects,["holesPlayed","holes_played","numberOfHoles","number_of_holes"]))||perHole.length||null;
    return{
      schemaVersion:SCHEMA_VERSION,source:"garmin_file",sourceFormat,fileName,importedAt:new Date().toISOString(),
      roundDate:isoDate(first(objects,["roundDate","round_date","startTime","start_time","date","timestamp"])),
      courseName:clean(first(objects,["courseName","course_name","course","activityName","activity_name","name"])),
      holesPlayed,totalScore:safeNumber(first(objects,["totalScore","total_score","grossScore","gross_score","score","totalStrokes","total_strokes"]))||totalFromHoles,
      totalPar:safeNumber(first(objects,["totalPar","total_par","par"])),
      durationSeconds:safeNumber(first(objects,["totalTimerTime","total_timer_time","durationSeconds","duration_seconds","duration"])),
      distanceWalkedMeters:safeNumber(first(objects,["totalDistance","total_distance","distanceMeters","distance_meters"])),
      calories:safeNumber(first(objects,["totalCalories","total_calories","calories"])),
      avgHeartRate:safeNumber(first(objects,["avgHeartRate","avg_heart_rate","averageHeartRate","average_heart_rate"])),
      perHole,
      completeness:{scorecard:Boolean(holesPlayed&&totalFromHoles),perHole:perHole.length>0,putts:perHole.some(h=>h.putts!==null),fitness:Boolean(first(objects,["avgHeartRate","avg_heart_rate","calories","totalCalories","total_distance"]))}
    };
  }
  async function parseFit(file){
    let sdk;
    try{sdk=await import("https://cdn.jsdelivr.net/npm/@garmin/fitsdk/+esm")}catch(_){throw new Error("FIT reading needs an internet connection the first time. You can also export CSV or JSON from Garmin Connect.")}
    const buffer=await file.arrayBuffer(),stream=sdk.Stream.fromArrayBuffer(buffer),decoder=new sdk.Decoder(stream),result=decoder.read();
    if(result.errors?.length&&!result.messages)throw new Error("Garmin reported that this FIT file could not be read.");
    return result.messages||result;
  }
  async function parseFile(file){
    const ext=(file.name.split(".").pop()||"").toLowerCase();let raw;
    if(ext==="fit")raw=await parseFit(file);
    else if(ext==="csv")raw=parseCsv(await file.text());
    else if(ext==="json")raw=JSON.parse(await file.text());
    else throw new Error("Choose a Garmin FIT, CSV, or JSON file.");
    const round=normalize(raw,ext,file.name);
    if(!round.courseName&&!round.roundDate&&!round.totalScore&&!round.perHole.length)throw new Error("The file opened, but no recognizable golf-round information was found.");
    return round;
  }
  global.SHERPA_GARMIN={SCHEMA_VERSION,parseFile,normalize};
})(window);
