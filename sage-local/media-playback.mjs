// iPhone and iPad use native media playback for the bundled ACA clip.
// Start play() within the tap and drive the portrait from the media clock.
export function createMediaPlayback(portrait, { url, volume, preparePlayback, releasePlayback, onFallback }) {
  let current;

  function updateVolume(player) {
    player.muted = volume <= 0;
    player.volume = volume;
  }

  function stop() {
    const run = current;
    if (!run) return;
    current = undefined;
    run.finish?.();
    run.player.pause();
    run.player.removeAttribute("src");
    run.player.load();
    releasePlayback();
    portrait.release();
  }

  async function play(output, signal, started, animate) {
    const run = current;
    const { player } = run;
    await run.ready;
    signal.throwIfAborted();
    if (player.ended) return;
    if (player.error || player.paused) throw new Error("ACA demo audio could not play.");
    if (Number.isFinite(player.duration) && Math.abs(player.duration * 1000 - output.durationMs) > 350) {
      throw new Error("ACA demo audio and timing assets do not match.");
    }

    return new Promise((resolve, reject) => {
      let frame;
      let backupTimer;
      let visualMs = Math.max(0, player.currentTime * 1000);
      let lastSampleAt = performance.now();

      const elapsedAt = now => {
        const mediaMs = Math.max(0, player.currentTime * 1000);
        visualMs = Math.max(mediaMs, visualMs + Math.max(0, now - lastSampleAt));
        lastSampleAt = now;
        return Math.min(output.durationMs - 1, visualMs);
      };

      const drawFrame = () => {
        if (!animate || player.paused || player.ended) return;
        try {
          portrait.draw(output.visemes, elapsedAt(performance.now()));
        } catch (_) {
          portrait.showNeutral();
          onFallback("AVATAR_UNAVAILABLE");
          animate = false;
          clearInterval(backupTimer);
        }
      };
      const render = () => {
        frame = undefined;
        if (!animate || player.paused || player.ended) return;
        drawFrame();
        frame = requestAnimationFrame(render);
      };
      const mediaTick = () => drawFrame();
      const end = () => finish();
      const error = () => finish(new Error("ACA demo audio failed."));
      const abort = () => finish(signal.reason);
      const interrupted = () => {
        if (!run.paused && !player.ended) finish(new Error("ACA demo audio was interrupted."));
      };
      function finish(failure) {
        cancelAnimationFrame(frame);
        clearInterval(backupTimer);
        signal.removeEventListener("abort", abort);
        player.removeEventListener("ended", end);
        player.removeEventListener("error", error);
        player.removeEventListener("pause", interrupted);
        player.removeEventListener("timeupdate", mediaTick);
        player.removeEventListener("playing", mediaTick);
        run.finish = undefined;
        run.resumeFrames = undefined;
        run.pauseFrames = undefined;
        portrait.showNeutral();
        if (failure) reject(failure);
        else resolve();
      }

      run.finish = finish;
      run.pauseFrames = () => {
        cancelAnimationFrame(frame);
        clearInterval(backupTimer);
        frame = undefined;
        backupTimer = undefined;
        portrait.showNeutral();
      };
      run.resumeFrames = () => {
        if (!animate || frame !== undefined) return;
        visualMs = Math.max(0, player.currentTime * 1000);
        lastSampleAt = performance.now();
        drawFrame();
        frame = requestAnimationFrame(render);
        backupTimer = setInterval(drawFrame, 50);
      };
      signal.addEventListener("abort", abort, { once: true });
      player.addEventListener("ended", end);
      player.addEventListener("error", error);
      player.addEventListener("pause", interrupted);
      player.addEventListener("timeupdate", mediaTick);
      player.addEventListener("playing", mediaTick);
      started();
      run.resumeFrames();
    });
  }

  return {
    ...portrait,
    unlock(signal) {
      signal.throwIfAborted();
      const player = new Audio();
      player.crossOrigin = "anonymous";
      updateVolume(player);
      player.src = url;
      const run = { player, signal, paused: false };
      current = run;
      const routeReady = preparePlayback(signal);
      run.ready = Promise.all([player.play(), routeReady]);
      run.ready.catch(() => {});
    },
    play: (output, signal, started) => play(output, signal, started, true),
    playVoice: (output, signal, started) => play(output, signal, started, false),
    async setPaused(paused) {
      const run = current;
      if (!run?.pauseFrames) return false;
      if (paused) {
        run.paused = true;
        run.player.pause();
        run.pauseFrames();
      } else {
        await Promise.all([preparePlayback(run.signal), run.player.play()]);
        if (current !== run || !run.resumeFrames) return false;
        run.paused = false;
        run.resumeFrames();
      }
      return current === run;
    },
    setVolume(value) {
      volume = value;
      if (current) updateVolume(current.player);
    },
    stop,
  };
}
