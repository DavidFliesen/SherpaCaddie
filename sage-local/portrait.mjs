// Opening, spread, and visible teeth for the 720 × 900 Sage portrait.
const MOUTH = {
  closed: [0, 43, 0], small: [5, 37, .10], bite: [7, 39, .76],
  teeth: [9, 43, .73], wide: [15, 48, .52], round: [22, 31, .06], open: [25, 43, .25],
};

function cueIndexAt(cues, elapsedMs) {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (elapsedMs < cues[mid].startMs) high = mid - 1;
    else if (elapsedMs >= cues[mid].endMs) low = mid + 1;
    else return mid;
  }
  return -1;
}

export function cueAt(cues, elapsedMs) {
  return cues[cueIndexAt(cues, elapsedMs)]?.viseme || "closed";
}

function ease(fraction) {
  const t = Math.max(0, Math.min(1, fraction));
  return t * t * (3 - 2 * t);
}

function blendMouth(a, b, amount) {
  return a.map((value, index) => value + (b[index] - value) * amount);
}

export function mouthShapeAt(cues, elapsedMs) {
  const index = cueIndexAt(cues, elapsedMs);
  if (index < 0) return MOUTH.closed;
  const cue = cues[index];
  const before = cues[index - 1];
  const after = cues[index + 1];
  const shape = MOUTH[cue.viseme];
  const half = Math.min(48, (cue.endMs - cue.startMs) / 2);
  const elapsed = elapsedMs - cue.startMs;
  const remaining = cue.endMs - elapsedMs;
  if (before && elapsed < half) {
    const lead = Math.min(48, (before.endMs - before.startMs) / 2);
    return blendMouth(MOUTH[before.viseme], shape, ease((elapsed + lead) / (lead + half)));
  }
  if (after && remaining < half) {
    const follow = Math.min(48, (after.endMs - after.startMs) / 2);
    return blendMouth(shape, MOUTH[after.viseme], ease((half - remaining) / (half + follow)));
  }
  return shape;
}

export function portraitMotionAt({ durationMs, blinkMs, gestureMs }, elapsedMs, reduceMotion) {
  if (reduceMotion || elapsedMs <= 0 || elapsedMs >= durationMs) return { x: 0, y: 0, tilt: 0, scale: 1, blink: 0 };
  const weight = ease(elapsedMs / 280) * ease((durationMs - elapsedMs) / 320);
  const seconds = elapsedMs / 1000;
  const nod = gestureMs.reduce((sum, beat) => {
    const time = (elapsedMs - beat) / 290;
    return sum + Math.exp(-(time * time));
  }, 0);
  const blink = blinkMs.reduce((max, beat) => {
    const phase = (elapsedMs - beat + 85) / 180;
    return Math.max(max, phase > 0 && phase < 1 ? Math.sin(Math.PI * phase) ** 1.4 : 0);
  }, 0);
  return {
    x: weight * (3.7 * Math.sin(1.05 * seconds) + .9 * Math.sin(2.25 * seconds)),
    y: weight * (2.4 * Math.sin(1.32 * seconds) + 3.8 * nod),
    tilt: weight * (.012 * Math.sin(.89 * seconds) - .007 * nod),
    scale: 1 + .029 * weight,
    blink: blink * weight,
  };
}

export function createPortrait(poster, canvas, timing) {
  let ctx;
  let lastFrame;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function showNeutral() {
    canvas.hidden = true;
    lastFrame = undefined;
  }

  function drawMouth([opening, spread, teeth]) {
    if (opening < .7) return;
    const cavity = ctx.createLinearGradient(0, 370, 0, 394);
    cavity.addColorStop(0, "#301317");
    cavity.addColorStop(.58, "#421b23");
    cavity.addColorStop(1, "#77363c");
    const toothShade = ctx.createLinearGradient(0, 368, 0, 380);
    toothShade.addColorStop(0, "#9f7062");
    toothShade.addColorStop(.6, "#e4c5b2");
    toothShade.addColorStop(1, "#bc8d82");

    // Move the lip and lower-face texture with the opening, feathered across
    // the smile so the patch stays aligned at the corners and chin.
    for (let x = 322; x < 430; x += 2) {
      const dx = (x + 1 - 376) / 54;
      const seam = 370 + 4.6 * (1 - dx * dx) - 2.2 * dx;
      const gap = opening * Math.max(0, 1 - ((x + 1 - 376) / spread) ** 2) ** 1.55;
      if (gap < .6) continue;
      const upper = gap * .24;
      const lower = gap - upper;
      ctx.drawImage(poster, x, 349, 2, seam - 349, x, 349, 2, seam - 349 - upper);
      ctx.drawImage(poster, x, seam, 2, 451 - seam, x, seam + lower, 2, 451 - seam - lower);
      ctx.fillStyle = cavity;
      ctx.fillRect(x, seam - upper, 2.1, gap + .2);
      const band = Math.min(gap * .47, 7 * teeth * Math.max(0, 1 - (dx / .8) ** 2));
      if (band > .5) {
        ctx.fillStyle = toothShade;
        ctx.fillRect(x, seam - upper + .4, 2.1, band);
      }
    }
  }

  function drawBlink(blink) {
    if (blink < .02) return;
    for (const [left, right, centerY] of [[285, 353, 250], [405, 477, 247]]) {
      for (let x = left; x < right; x += 2) {
        const dx = (x - left) / (right - left) * 2 - 1;
        const amount = 13 * blink * (1 - dx * dx) ** 2;
        if (amount < .5) continue;
        const top = centerY - 30;
        ctx.drawImage(poster, x, top, 2, 30 - amount, x, top, 2, 30);
        ctx.drawImage(poster, x, centerY + amount, 2, 29 - amount, x, centerY, 2, 29);
      }
    }
  }

  return {
    async prepare(signal) {
      await poster.decode();
      signal.throwIfAborted();
      if (poster.naturalWidth !== 720 || poster.naturalHeight !== 900) throw new Error("Sage portrait size changed.");
      canvas.width = 720;
      canvas.height = 900;
      ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Portrait rendering unavailable.");
    },
    draw(cues, elapsedMs) {
      if (elapsedMs < 0 || elapsedMs >= timing.durationMs) {
        if (!canvas.hidden) showNeutral();
        return;
      }
      const reduce = reducedMotion.matches;
      const frame = Math.floor(elapsedMs / (1000 / 30));
      if (frame === lastFrame) return;
      lastFrame = frame;
      const shape = mouthShapeAt(cues, elapsedMs);
      const { x, y, tilt, scale, blink } = portraitMotionAt(timing, elapsedMs, reduce);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 720, 900);
      if (!reduce) {
        ctx.translate(360 + x, 450 + y);
        ctx.rotate(tilt);
        ctx.scale(scale, scale);
        ctx.translate(-360, -450);
        ctx.drawImage(poster, 0, 0);
      }
      drawMouth(shape);
      drawBlink(blink);
      canvas.hidden = reduce && shape[0] < .7;
    },
    showNeutral,
    release() {
      showNeutral();
      canvas.width = canvas.height = 0;
      ctx = undefined;
    },
  };
}
