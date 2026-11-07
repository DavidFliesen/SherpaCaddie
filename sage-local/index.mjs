import { createMediaPlayback } from "./media-playback.mjs?v=0145";
import { DEMO } from "./demo.mjs?v=0145";
import { createPortrait } from "./portrait.mjs?v=0145";
import { SageSessionController } from "./session-controller.mjs?v=0145";
import { createAppTools } from "./tool-registry.mjs?v=0145";

const AUDIO_URL = new URL("../assets/sage-local/practice.mp3?v=0145", import.meta.url);
const TAB_PROMPT = "What tab am I on";

function normalize(question) {
  return question.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").toLowerCase();
}

function createPlayback(portrait, onFallback, initialVolume, preparePlayback, releasePlayback) {
  let current;
  let volume = initialVolume;

  function stop() {
    const audio = current;
    if (!audio) return;
    current = undefined;
    audio.cleanup?.();
    audio.context.close().catch(() => {});
    releasePlayback();
    portrait.release();
  }

  async function play(output, signal, started, animate) {
    const audio = current;
    const { context } = audio;
    await audio.ready;
    signal.throwIfAborted();
    if (context.state !== "running") throw new Error("Local audio could not start.");
    const buffer = await context.decodeAudioData(await output.audio.arrayBuffer());
    signal.throwIfAborted();
    if (Math.abs(buffer.duration * 1000 - output.durationMs) > 120) {
      throw new Error("Speech and timing assets do not match.");
    }

    await new Promise((resolve, reject) => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      audio.gain = gain;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(context.destination);
      let frame;
      let settled = false;
      const startTime = context.currentTime + .02;
      const latency = (context.baseLatency || 0) + (context.outputLatency || 0);

      function finish(error) {
        if (settled) return;
        settled = true;
        cancelAnimationFrame(frame);
        signal.removeEventListener("abort", abort);
        context.removeEventListener("statechange", stateChanged);
        source.onended = null;
        try { source.stop(); } catch (_) {}
        source.disconnect();
        gain.disconnect();
        portrait.showNeutral();
        if (error) reject(error);
        else resolve();
      }

      function abort() { finish(signal.reason); }
      function stateChanged() {
        if (context.state === "interrupted" || (context.state !== "running" && !audio.paused)) {
          finish(new Error("Local audio was interrupted."));
        }
      }
      function render() {
        frame = undefined;
        if (audio.paused || settled) return;
        try {
          portrait.draw(output.visemes, (context.currentTime - startTime - latency) * 1000);
        } catch (_) {
          animate = false;
          portrait.showNeutral();
          onFallback("AVATAR_UNAVAILABLE");
          return;
        }
        frame = requestAnimationFrame(render);
      }

      audio.pauseFrames = () => {
        cancelAnimationFrame(frame);
        frame = undefined;
        portrait.showNeutral();
      };
      audio.resumeFrames = () => {
        if (animate && !settled && frame === undefined) frame = requestAnimationFrame(render);
      };
      audio.cleanup = finish;
      signal.addEventListener("abort", abort, { once: true });
      context.addEventListener("statechange", stateChanged);
      source.onended = () => finish();
      try {
        source.start(startTime);
        started();
        audio.resumeFrames();
      } catch (error) {
        finish(error);
      }
    });
  }

  return {
    ...portrait,
    unlock(signal) {
      signal.throwIfAborted();
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error("Web Audio is unavailable.");
      const routeReady = preparePlayback(signal);
      let context;
      try {
        context = new Context({ latencyHint: "interactive" });
      } catch (error) {
        releasePlayback();
        throw error;
      }
      current = { context, signal, paused: false };
      const ready = Promise.all([context.resume(), routeReady]);
      current.ready = ready;
      ready.catch(() => {});
    },
    play: (output, signal, started) => play(output, signal, started, true),
    playVoice: (output, signal, started) => play(output, signal, started, false),
    async setPaused(paused) {
      const audio = current;
      if (!audio?.gain) return false;
      if (paused) {
        audio.paused = true;
        audio.pauseFrames();
        await audio.context.suspend();
      } else {
        await Promise.all([preparePlayback(audio.signal), audio.context.resume()]);
        audio.paused = false;
        audio.resumeFrames();
      }
      return current === audio;
    },
    setVolume(value) {
      volume = value;
      if (current?.gain) current.gain.gain.value = volume;
    },
    stop,
  };
}

export function createLocalSage(options) {
  const { poster, canvas, isAllowed, getRoute, onState, onAnswer, onFallback, onError, volume, practicePrompt, preparePlayback, releasePlayback, nativeMedia } = options;
  const practiceIntent = normalize(practicePrompt);
  const isPracticeQuestion = question => normalize(question) === practiceIntent;
  const portrait = createPortrait(poster, canvas);
  const avatar = nativeMedia
    ? createMediaPlayback(portrait, { url: AUDIO_URL.href, volume, preparePlayback, releasePlayback, onFallback })
    : createPlayback(portrait, onFallback, volume, preparePlayback, releasePlayback);
  const tools = createAppTools({ isAllowed, getRoute });
  const controller = new SageSessionController({
    behavior: "Phase 1 scripted demonstration.",
    retriever: {
      async search(query, limit, signal) {
        signal.throwIfAborted();
        return [];
      },
    },
    brain: {
      async decide({ question, toolResults }, signal) {
        signal.throwIfAborted();
        const prompt = normalize(question);
        if (prompt === practiceIntent) return { type: "answer", text: DEMO.text };
        if (prompt === normalize(TAB_PROMPT)) {
          const result = toolResults[0];
          if (!result) return { type: "tool", request: { name: "get_app_context", arguments: { field: "tab" } } };
          return {
            type: "answer",
            text: result.ok ? `The active tab is ${result.data.tab}.` : result.userMessage,
          };
        }
        return { type: "answer", text: `Tap Play ACA demo to hear the scripted practice tip. For other golf questions, use Text, Voice, or DCA.` };
      },
    },
    tools,
    speech: {
      async synthesize(text, signal) {
        if (text !== DEMO.text) throw new Error("No audio is bundled for this answer.");
        if (nativeMedia) return { durationMs: DEMO.durationMs, visemes: DEMO.visemes };
        const response = await fetch(AUDIO_URL, { signal });
        if (!response.ok) throw new Error("The demo audio is unavailable.");
        const audio = await response.blob();
        signal.throwIfAborted();
        return { audio, durationMs: DEMO.durationMs, visemes: DEMO.visemes };
      },
    },
    avatar, onState, onAnswer, onFallback, onError,
  });
  return {
    isPracticeQuestion,
    ask(question, speak) {
      const animate = speak && isPracticeQuestion(question);
      return controller.ask(question, animate ? "video" : "text");
    },
    cancel: () => controller.cancel(),
    setPaused: paused => avatar.setPaused(paused),
    setVolume: value => avatar.setVolume(value),
  };
}
