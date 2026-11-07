// Browser-native adaptation of the kickoff's BrainProvider, Retriever,
// SpeechProvider, AvatarDriver and ToolGateway contracts.
export class SageSessionController {
  #current;
  #history = [];

  constructor(options) {
    this.options = options;
  }

  async ask(question, mode) {
    this.cancel();
    const run = new AbortController();
    this.#current = run;
    const { signal } = run;
    const { brain, retriever, tools, speech, avatar, onState, onAnswer, onFallback, onError } = this.options;
    // The input gesture is still active here. Begin audio unlock before any await.
    let audioError;
    if (mode !== "text") {
      try { avatar.unlock(signal); } catch (error) { audioError = error; }
    }
    let answered = false;
    let timeout = setTimeout(() => {
      if (this.#current !== run) return;
      this.cancel();
      onError("SAGE_PREPARATION_TIMEOUT", answered ? "Audio took too long to start." : "The demo took too long to answer.");
    }, 6000);
    try {
      onState("retrieving");
      const passages = await retriever.search(question, 5, signal);
      signal.throwIfAborted();
      const toolResults = [];
      for (let step = 0; step <= 4; step += 1) {
        onState("deciding");
        const decision = await brain.decide({
          behavior: this.options.behavior, question, history: this.#history.slice(),
          passages, toolResults, availableTools: tools.descriptors(),
        }, signal);
        signal.throwIfAborted();
        if (decision.type === "tool") {
          if (step === 4) throw new Error("Sage exceeded its tool limit.");
          onState("executing_tool");
          toolResults.push(await tools.execute(decision.request, signal));
          signal.throwIfAborted();
          continue;
        }

        onState("composing");
        const text = decision.text.trim();
        if (!text) throw new Error("Sage returned an empty reply.");
        onAnswer(text);
        answered = true;
        const createdAt = new Date().toISOString();
        this.#history = [...this.#history, { role: "user", text: question, createdAt },
          { role: "assistant", text, createdAt }].slice(-8);
        if (mode !== "text") {
          if (audioError) throw audioError;
          onState("synthesizing");
          const output = await speech.synthesize(text, signal);
          signal.throwIfAborted();
          let animate = mode === "video";
          if (animate) {
            try {
              await avatar.prepare(signal);
            } catch (error) {
              signal.throwIfAborted();
              avatar.showNeutral();
              onFallback("AVATAR_UNAVAILABLE");
              animate = false;
            }
          }
          signal.throwIfAborted();
          const started = () => {
            clearTimeout(timeout);
            timeout = null;
            onState("speaking");
          };
          await (animate ? avatar.play(output, signal, started) : avatar.playVoice(output, signal, started));
          signal.throwIfAborted();
        }
        onState("idle");
        return;
      }
    } catch (error) {
      if (!signal.aborted) {
        avatar.showNeutral();
        onState("error");
        onError(answered ? "SAGE_AUDIO_UNAVAILABLE" : "SAGE_REQUEST_FAILED",
          answered ? "Local Sage audio is unavailable. Your answer is below." : "Local Sage could not answer. Try Text.");
      }
    } finally {
      clearTimeout(timeout);
      if (this.#current === run) {
        this.#current = undefined;
        avatar.stop();
        avatar.showNeutral();
      }
    }
  }

  cancel() {
    const run = this.#current;
    if (!run) return;
    this.#current = undefined;
    run.abort();
    this.options.avatar.stop();
    this.options.avatar.showNeutral();
    this.options.onState("cancelled");
  }
}
