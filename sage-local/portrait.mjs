// The rig uses the existing 720 × 900 portrait's coordinate system.
const MOUTH = {
  closed: [0, 0], small: [4, 28], bite: [5, 25],
  teeth: [8, 38], wide: [11, 48], round: [18, 30], open: [21, 44],
};

export function cueAt(cues, elapsedMs) {
  return cues.find(cue => cue.startMs <= elapsedMs && elapsedMs < cue.endMs)?.viseme || "closed";
}

export function createPortrait(poster, canvas) {
  let ctx;
  let lastFrame;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function showNeutral() {
    canvas.hidden = true;
    lastFrame = undefined;
  }

  // Widen the seam along the photographed lips while keeping the outside edges
  // aligned with the still. Only this small transparent overlay is redrawn.
  function drawMouth(pose) {
    const [height, width] = MOUTH[pose];
    for (let x = 329; x < 431; x += 2) {
      const dx = (x + 1 - 380) / 51;
      const seam = Math.round(369 + 5 * (1 - dx * dx) - 2 * dx);
      const gap = Math.round(height * Math.max(0, 1 - ((x + 1 - 380) / width) ** 2) ** 2);
      if (!gap) continue;
      const upper = Math.floor(gap * .23);
      const lower = gap - upper;
      ctx.drawImage(poster, x, 352, 2, seam - 352, x, 352, 2, seam - 352 - upper);
      ctx.drawImage(poster, x, seam, 2, 411 - seam, x, seam + lower, 2, 411 - seam - lower);
      ctx.fillStyle = "#44211e";
      ctx.fillRect(x, seam - upper, 2, gap);
      if ((pose === "teeth" || pose === "wide") && gap >= 5) {
        ctx.fillStyle = "#d9bda5";
        ctx.fillRect(x, seam - upper, 2, Math.min(3, gap * .3));
      }
    }
  }

  function drawBlink() {
    for (const [left, right, centerY] of [[285, 353, 250], [405, 477, 247]]) {
      for (let x = left; x < right; x += 2) {
        const dx = (x - left) / (right - left) * 2 - 1;
        const amount = Math.round(12 * (1 - dx * dx) ** 2);
        if (!amount) continue;
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
      const pose = cueAt(cues, elapsedMs);
      const blink = !reducedMotion.matches && elapsedMs >= 2300 && elapsedMs < 2400;
      const frame = `${pose}:${blink}`;
      if (frame === lastFrame) return;
      if (pose === "closed" && !blink) {
        showNeutral();
      } else {
        ctx.clearRect(0, 220, 720, 195);
        if (pose !== "closed") drawMouth(pose);
        if (blink) drawBlink();
        canvas.hidden = false;
      }
      lastFrame = frame;
    },
    showNeutral,
    release() {
      showNeutral();
      canvas.width = canvas.height = 0;
      ctx = undefined;
    },
  };
}
