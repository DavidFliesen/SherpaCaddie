
const CLUBS = [
  ["Driver", 220], ["3 Wood", 205], ["5 Wood", 190], ["4 Hybrid", 180],
  ["5 Iron", 170], ["6 Iron", 160], ["7 Iron", 150], ["8 Iron", 140],
  ["9 Iron", 125], ["Pitching Wedge", 110], ["Gap Wedge", 95],
  ["Sand Wedge", 75], ["Lob Wedge", 55], ["Putter", 10]
];

const COURSE_TEMPLATE = [
  { par: 4, yards: 365 }, { par: 4, yards: 330 }, { par: 3, yards: 155 },
  { par: 5, yards: 490 }, { par: 4, yards: 385 }, { par: 4, yards: 350 },
  { par: 3, yards: 145 }, { par: 5, yards: 510 }, { par: 4, yards: 375 },
  { par: 4, yards: 360 }, { par: 3, yards: 165 }, { par: 5, yards: 500 },
  { par: 4, yards: 340 }, { par: 4, yards: 395 }, { par: 3, yards: 150 },
  { par: 5, yards: 475 }, { par: 4, yards: 370 }, { par: 4, yards: 355 }
];

const STORAGE_KEYS = {
  clubs: "sherpaCaddie.clubDistances.v03",
  rounds: "sherpaCaddie.rounds.v03",
  currentRound: "sherpaCaddie.currentRound.v03"
};

const state = {
  clubs: {},
  rounds: [],
  currentRound: null,
  selectedClub: null,
  selectedDirection: "center",
  deferredPrompt: null
};

const screens = [...document.querySelectorAll(".screen")];
const drawer = document.getElementById("drawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerLinks = [...document.querySelectorAll(".drawer-link")];

function loadState() {
  state.clubs = JSON.parse(localStorage.getItem(STORAGE_KEYS.clubs) || "null") || Object.fromEntries(CLUBS);
  state.rounds = JSON.parse(localStorage.getItem(STORAGE_KEYS.rounds) || "[]");
  state.currentRound = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentRound) || "null");
}
function saveState() {
  localStorage.setItem(STORAGE_KEYS.clubs, JSON.stringify(state.clubs));
  localStorage.setItem(STORAGE_KEYS.rounds, JSON.stringify(state.rounds));
  localStorage.setItem(STORAGE_KEYS.currentRound, JSON.stringify(state.currentRound));
}
function showScreen(name) {
  screens.forEach(s => s.classList.toggle("active", s.id === `screen-${name}`));
  drawerLinks.forEach(btn => btn.classList.toggle("active", btn.dataset.screen === name));
  closeDrawer();
}
function openDrawer() {
  drawer.classList.add("open");
  drawerBackdrop.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  drawer.classList.remove("open");
  drawerBackdrop.hidden = true;
  drawer.setAttribute("aria-hidden", "true");
}
document.getElementById("menuToggle").addEventListener("click", openDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);
drawerLinks.forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.screen)));
document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.go)));

function renderClubSetup() {
  const grid = document.getElementById("clubGrid");
  grid.innerHTML = "";
  CLUBS.forEach(([name, dist]) => {
    const wrap = document.createElement("label");
    wrap.className = "club-field";
    wrap.innerHTML = `<span>${name}</span><input type="number" inputmode="numeric" min="0" value="${state.clubs[name] ?? dist}" data-club="${name}" />`;
    grid.appendChild(wrap);
  });
}
document.getElementById("saveClubsBtn").addEventListener("click", () => {
  document.querySelectorAll("#clubGrid input").forEach(input => state.clubs[input.dataset.club] = Number(input.value || 0));
  saveState();
  alert("Club distances saved on this device.");
});
document.getElementById("resetClubsBtn").addEventListener("click", () => {
  state.clubs = Object.fromEntries(CLUBS);
  renderClubSetup();
  saveState();
});

function adjustedDistance(distance, windType) {
  if (windType === "into") return Math.round(distance * 1.08);
  if (windType === "helping") return Math.round(distance * 0.94);
  return distance;
}
function getRecommendation(distance, windType) {
  const targetDistance = adjustedDistance(distance, windType);
  const clubEntries = Object.entries(state.clubs).filter(([name]) => name !== "Putter");
  // choose first club whose distance >= target; otherwise longest club
  let selected = clubEntries[0];
  for (const entry of clubEntries) {
    selected = entry;
    if (entry[1] >= targetDistance) break;
  }
  // Encourage one more club on marginal shots to align with user's feedback
  const sorted = clubEntries.sort((a,b)=>b[1]-a[1]);
  // create ascending for easier
  const asc = clubEntries.slice().sort((a,b)=>a[1]-b[1]);
  let idx = asc.findIndex(([n,d]) => d >= targetDistance);
  if (idx === -1) idx = asc.length - 1;
  const margin = asc[idx][1] - targetDistance;
  if (margin < 6 && idx < asc.length - 1) {
    // one more club than the closest fit
    selected = asc[idx + 1];
  } else {
    selected = asc[idx];
  }
  const reasonWind = windType === "into" ? "Take one more club into the wind." :
                     windType === "helping" ? "The helping wind lets you stay smooth." :
                     windType === "cross" ? "Favor the safe side and trust the club." :
                     "Use the club that carries comfortably to the target.";
  return { club: selected[0], carry: selected[1], targetDistance, reasonWind };
}
function targetAdvice(holeIndex, distance) {
  if (distance > 180) return {
    aim: "Aim at the widest part",
    why: "Play away from the main trouble and set up an easier next shot."
  };
  if (distance > 60) return {
    aim: "Aim left-center",
    why: "The center of the green is usually smarter than chasing the pin."
  };
  return {
    aim: "Favor the fat side",
    why: "Pick the simplest landing area and give yourself room to miss."
  };
}
function mentalCue(roundGoal, strokesOnHole) {
  if (strokesOnHole > 3) return "Bad holes happen. Breathe, pick a target, and start fresh.";
  if (roundGoal === "practice") return "Go back to the fundamentals: target, one rehearsal, commit.";
  if (roundGoal === "fun") return "Relax your shoulders and make an easy swing.";
  const cues = [
    "Pick the target and make a smooth, committed swing.",
    "One practice swing, then trust the club.",
    "Finish balanced and let the shot happen.",
    "The last thing you think should be what you want to do."
  ];
  return cues[strokesOnHole % cues.length];
}

function startRound() {
  const windType = document.getElementById("windType").value;
  const roundGoal = document.getElementById("roundGoal").value;
  const tee = document.getElementById("teeChoice").value;
  const course = document.getElementById("courseName").value.trim() || "Pine Forest Country Club";
  let teeAdjust = tee === "gold" ? -15 : tee === "red" ? -35 : 0;
  const holes = COURSE_TEMPLATE.map((h, i) => ({
    number: i + 1,
    par: h.par,
    yards: Math.max(85, h.yards + teeAdjust),
    strokes: 0,
    remaining: Math.max(85, h.yards + teeAdjust),
    finished: false,
    shots: []
  }));
  state.currentRound = {
    course,
    tee,
    windType,
    roundGoal,
    startedAt: new Date().toISOString(),
    currentHoleIndex: 0,
    holes,
    totals: { strokes: 0, scoreToPar: 0 }
  };
  saveState();
  document.getElementById("roundCard").hidden = false;
  renderRound();
}
document.getElementById("startRoundBtn").addEventListener("click", startRound);

function renderClubQuickRow(recommendedClub) {
  const row = document.getElementById("clubQuickRow");
  row.innerHTML = "";
  const likely = ["Driver","3 Wood","5 Wood","4 Hybrid","7 Iron","8 Iron","9 Iron","Pitching Wedge","Sand Wedge","Putter"];
  likely.forEach(club => {
    if (state.clubs[club] == null) return;
    const btn = document.createElement("button");
    btn.className = "club-chip" + ((state.selectedClub || recommendedClub) === club ? " selected" : "");
    btn.textContent = club;
    btn.addEventListener("click", () => {
      state.selectedClub = club;
      renderRound();
    });
    row.appendChild(btn);
  });
}
function renderRound() {
  const round = state.currentRound;
  if (!round) return;
  const hole = round.holes[round.currentHoleIndex];
  const rec = getRecommendation(hole.remaining, round.windType);
  const usedClub = state.selectedClub || rec.club;
  const target = targetAdvice(round.currentHoleIndex, hole.remaining);
  document.getElementById("roundCard").hidden = false;
  document.getElementById("holeEyebrow").textContent = `Hole ${hole.number}`;
  document.getElementById("holeTitle").textContent = `Par ${hole.par} • ${hole.yards} yards`;
  document.getElementById("distanceLabel").textContent = `${Math.max(0, Math.round(hole.remaining))} yds`;
  document.getElementById("lieLabel").textContent = hole.strokes === 0 ? "Tee" : hole.remaining <= 25 ? "Around green" : hole.remaining <= 60 ? "Approach" : "Fairway / rough";
  document.getElementById("windLabel").textContent = round.windType.charAt(0).toUpperCase() + round.windType.slice(1);
  document.getElementById("scorePill").textContent = `Strokes: ${hole.strokes}`;
  document.getElementById("clubRecommend").textContent = usedClub;
  document.getElementById("clubWhy").textContent = `${rec.reasonWind} ${hole.remaining > 145 ? "Do not come up short if the safe target asks for one more club." : ""}`;
  document.getElementById("targetRecommend").textContent = target.aim;
  document.getElementById("targetWhy").textContent = target.why;
  document.getElementById("mentalCue").textContent = mentalCue(round.roundGoal, hole.strokes);
  renderClubQuickRow(rec.club);
  document.getElementById("nextHoleBtn").disabled = !hole.finished;
  renderRoundList();
}
function qualityCarryFactor(quality) {
  return quality === "good" ? 1.0 : quality === "okay" ? 0.82 : 0.62;
}
function directionAdjustment(direction) {
  if (direction === "short") return -12;
  if (direction === "long") return 8;
  return 0;
}
document.querySelectorAll(".quality-button").forEach(btn => btn.addEventListener("click", () => recordShot(btn.dataset.quality)));
document.querySelectorAll(".chip-button").forEach(btn => btn.addEventListener("click", () => {
  state.selectedDirection = btn.dataset.direction;
  document.querySelectorAll(".chip-button").forEach(c => c.classList.toggle("selected", c === btn));
}));

function recordShot(quality) {
  const round = state.currentRound;
  if (!round) return;
  const hole = round.holes[round.currentHoleIndex];
  const club = state.selectedClub || getRecommendation(hole.remaining, round.windType).club;
  const baseDist = state.clubs[club] || 0;
  const traveled = Math.max(4, Math.round(baseDist * qualityCarryFactor(quality) + directionAdjustment(state.selectedDirection)));
  hole.strokes += 1;
  round.totals.strokes += 1;
  hole.remaining = Math.max(0, hole.remaining - traveled);
  hole.shots.push({ club, quality, direction: state.selectedDirection, traveled, at: new Date().toISOString() });

  const resetMessage = document.getElementById("resetMessage");
  if (quality === "poor") {
    resetMessage.textContent = "Leave that one behind. The next shot is a new start.";
  } else if (hole.remaining <= 12) {
    resetMessage.textContent = "Good. Finish the hole with a simple, committed stroke.";
  } else {
    resetMessage.textContent = "Good reset. Focus only on the shot you are on.";
  }

  state.selectedClub = null;
  state.selectedDirection = "center";
  saveState();
  renderRound();
}

document.getElementById("puttedInBtn").addEventListener("click", finishCurrentHole);
function finishCurrentHole() {
  const round = state.currentRound;
  if (!round) return;
  const hole = round.holes[round.currentHoleIndex];
  if (!hole.finished) {
    if (hole.remaining > 0) {
      hole.strokes += 1; // assume a simple finishing stroke if user ends hole before 0
      round.totals.strokes += 1;
    }
    hole.remaining = 0;
    hole.finished = true;
    round.totals.scoreToPar = round.holes.reduce((sum,h)=> sum + (h.finished ? (h.strokes - h.par) : 0), 0);
    document.getElementById("resetMessage").textContent = `Hole complete. ${hole.strokes - hole.par > 0 ? "Bad holes happen. Leave it there." : "Nicely done."} The next tee is a fresh start.`;
    saveState();
    renderRound();
  }
}
document.getElementById("nextHoleBtn").addEventListener("click", nextHole);
function nextHole() {
  const round = state.currentRound;
  if (!round) return;
  const hole = round.holes[round.currentHoleIndex];
  if (!hole.finished) return;
  if (round.currentHoleIndex < round.holes.length - 1) {
    round.currentHoleIndex += 1;
    saveState();
    renderRound();
  } else {
    round.finishedAt = new Date().toISOString();
    state.rounds.unshift(round);
    state.currentRound = null;
    saveState();
    renderRoundList();
    showScreen("rounds");
    alert("Round saved. Review your three-item summary.");
    document.getElementById("roundCard").hidden = true;
  }
}

function renderRoundList() {
  const list = document.getElementById("roundList");
  list.innerHTML = "";
  const rounds = state.rounds;
  if (!rounds.length) {
    list.innerHTML = `<div class="round-item"><h3>No saved rounds yet</h3><p class="muted">When you finish a round, it will appear here and stay on this device unless you export it.</p></div>`;
    return;
  }
  rounds.forEach((round, idx) => {
    const strokes = round.totals?.strokes ?? round.holes.reduce((sum,h)=>sum+h.strokes,0);
    const par = round.holes.reduce((sum,h)=>sum+h.par,0);
    const scoreToPar = strokes - par;
    const poorCount = round.holes.flatMap(h => h.shots).filter(s => s.quality === "poor").length;
    const item = document.createElement("article");
    item.className = "round-item";
    item.innerHTML = `
      <h3>${round.course}</h3>
      <div class="round-meta">
        <span>${new Date(round.startedAt).toLocaleDateString()}</span>
        <span>${round.tee[0].toUpperCase() + round.tee.slice(1)} tees</span>
        <span>${strokes} strokes</span>
        <span>${scoreToPar > 0 ? "+"+scoreToPar : scoreToPar} to par</span>
      </div>
      <p class="muted">Most poor shots: ${poorCount ? poorCount : 0}. ${poorCount ? "Most poor shots happened when you selected too little club." : "You avoided major trouble well."}</p>
    `;
    list.appendChild(item);
  });
}

document.getElementById("exportRoundsBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ rounds: state.rounds, clubs: state.clubs }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sherpa-caddie-rounds-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importRoundsInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.rounds) state.rounds = data.rounds;
    if (data.clubs) state.clubs = data.clubs;
    saveState();
    renderClubSetup();
    renderRoundList();
    alert("Import complete.");
  } catch (err) {
    alert("That file could not be imported.");
  }
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
  document.getElementById("installBtn").hidden = false;
});
document.getElementById("installBtn").addEventListener("click", async () => {
  if (!state.deferredPrompt) return;
  state.deferredPrompt.prompt();
  await state.deferredPrompt.userChoice;
  state.deferredPrompt = null;
  document.getElementById("installBtn").hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}

loadState();
renderClubSetup();
renderRoundList();
if (state.currentRound) {
  document.getElementById("roundCard").hidden = false;
  renderRound();
}
showScreen("home");
