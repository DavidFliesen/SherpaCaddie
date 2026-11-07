import test from "node:test";
import assert from "node:assert/strict";
import { SageSessionController } from "../sage-local/session-controller.mjs";
import { RegisteredToolGateway, createAppTools } from "../sage-local/tool-registry.mjs";
import { cueAt } from "../sage-local/portrait.mjs";
import { DEMO } from "../sage-local/demo.mjs";

const makeSignal = () => new AbortController().signal;
const result = { ok: true, tool: "read", data: {} };
const output = { audio: new Blob(["audio"]), durationMs: 20, visemes: [] };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

function harness(overrides = {}) {
  const states = [], answers = [], errors = [], fallbacks = [], played = [];
  const avatar = {
    unlock() {},
    async prepare() {},
    async play(value, signal, started) { started(); played.push("video"); },
    async playVoice(value, signal, started) { started(); played.push("voice"); },
    stop() {},
    showNeutral() {},
    ...overrides.avatar,
  };
  const controller = new SageSessionController({
    behavior: "test",
    retriever: { async search() { return []; } },
    brain: { async decide() { return { type: "answer", text: "Ready" }; } },
    speech: { async synthesize() { return output; } },
    tools: { descriptors() { return []; }, async execute() { return result; } },
    ...overrides,
    avatar,
    onState: state => states.push(state),
    onAnswer: answer => answers.push(answer),
    onError: code => errors.push(code),
    onFallback: code => fallbacks.push(code),
  });
  return { controller, states, answers, errors, fallbacks, played };
}

test("text answer follows the state sequence and never unlocks audio", async () => {
  const h = harness({ avatar: { unlock() { throw new Error("Unexpected audio"); } } });
  await h.controller.ask("Question", "text");
  assert.deepEqual(h.states, ["retrieving", "deciding", "composing", "idle"]);
  assert.deepEqual(h.answers, ["Ready"]);
  assert.deepEqual(h.played, []);
  assert.deepEqual(h.errors, []);
});

test("scripted video follows synthesis and speech through idle", async () => {
  const h = harness();
  await h.controller.ask("Question", "video");
  assert.deepEqual(h.states, ["retrieving", "deciding", "composing", "synthesizing", "speaking", "idle"]);
  assert.deepEqual(h.played, ["video"]);
});

test("voice mode plays the same speech output without avatar preparation", async () => {
  const h = harness({ avatar: { prepare() { throw new Error("Unexpected animation"); } } });
  await h.controller.ask("Question", "voice");
  assert.deepEqual(h.played, ["voice"]);
  assert.deepEqual(h.fallbacks, []);
});

test("audio unlock occurs synchronously inside the question gesture", async () => {
  let unlocked = false;
  const h = harness({ avatar: { unlock() { unlocked = true; } } });
  const ask = h.controller.ask("Question", "video");
  assert.equal(unlocked, true);
  await ask;
});

test("renderer failure falls back to voice and preserves the answer", async () => {
  const h = harness({ avatar: { async prepare() { throw new Error("Canvas failure"); } } });
  await h.controller.ask("Question", "video");
  assert.deepEqual(h.fallbacks, ["AVATAR_UNAVAILABLE"]);
  assert.deepEqual(h.played, ["voice"]);
  assert.deepEqual(h.answers, ["Ready"]);
  assert.equal(h.states.at(-1), "idle");
});

test("speech failure retains text and reports a usable fallback", async () => {
  const h = harness({ speech: { async synthesize() { throw new Error("Offline asset failure"); } } });
  await h.controller.ask("Question", "video");
  assert.deepEqual(h.answers, ["Ready"]);
  assert.deepEqual(h.errors, ["SAGE_AUDIO_UNAVAILABLE"]);
  assert.equal(h.states.at(-1), "error");
});

test("audio gesture failure falls back after writing the answer", async () => {
  const h = harness({ avatar: { unlock() { throw new Error("Autoplay denied"); } } });
  await h.controller.ask("Question", "video");
  assert.deepEqual(h.answers, ["Ready"]);
  assert.deepEqual(h.errors, ["SAGE_AUDIO_UNAVAILABLE"]);
});

test("failed retrieval reports error and never fabricates an answer", async () => {
  const h = harness({ retriever: { async search() { throw new Error("Failed retrieval"); } } });
  await h.controller.ask("Question", "video");
  assert.deepEqual(h.answers, []);
  assert.deepEqual(h.errors, ["SAGE_REQUEST_FAILED"]);
});

test("new question cancels an old provider that ignores abort", async () => {
  const gate = deferred();
  let calls = 0;
  const h = harness({ brain: {
    async decide() {
      if (++calls === 1) return gate.promise;
      return { type: "answer", text: "New answer" };
    },
  } });
  const first = h.controller.ask("Old", "text");
  await Promise.resolve();
  await h.controller.ask("New", "text");
  const states = h.states.slice();
  gate.resolve({ type: "answer", text: "Stale answer" });
  await first;
  assert.deepEqual(h.answers, ["New answer"]);
  assert.deepEqual(h.states, states);
  assert.equal(h.states.at(-1), "idle");
});

test("cancel during synthesis cannot start later audio", async () => {
  const gate = deferred();
  const h = harness({ speech: { async synthesize() { return gate.promise; } } });
  const ask = h.controller.ask("Question", "video");
  await Promise.resolve();
  await Promise.resolve();
  h.controller.cancel();
  const states = h.states.slice();
  gate.resolve(output);
  await ask;
  assert.deepEqual(h.played, []);
  assert.deepEqual(h.states, states);
  assert.equal(h.states.at(-1), "cancelled");
});

test("cancel during playback tears down without posting stale states", async () => {
  let stopped = 0;
  const h = harness({ avatar: {
    play(value, signal, started) {
      started();
      return new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    },
    stop() { stopped += 1; },
  } });
  const ask = h.controller.ask("Question", "video");
  for (let i = 0; i < 5; i++) await Promise.resolve();
  h.controller.cancel();
  await ask;
  assert.equal(h.states.at(-1), "cancelled");
  assert.equal(stopped, 1);
  assert.deepEqual(h.errors, []);
});

test("tool narration waits for the returned handler result", async () => {
  const gate = deferred();
  const h = harness({
    brain: {
      async decide(input) {
        return input.toolResults.length
          ? { type: "answer", text: input.toolResults[0].ok ? "Read succeeded" : "Read failed" }
          : { type: "tool", request: { name: "read", arguments: {} } };
      },
    },
    tools: { descriptors() { return []; }, async execute() { return gate.promise; } },
  });
  const ask = h.controller.ask("Read", "text");
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(h.answers, []);
  gate.resolve({ ok: false, tool: "read", code: "HANDLER_FAILED", userMessage: "Read failed", retryable: true });
  await ask;
  assert.deepEqual(h.answers, ["Read failed"]);
});

test("four tool calls are the hard maximum", async () => {
  let executed = 0;
  const h = harness({
    brain: { async decide() { return { type: "tool", request: { name: "read", arguments: {} } }; } },
    tools: { descriptors() { return []; }, async execute() { executed++; return result; } },
  });
  await h.controller.ask("Question", "text");
  assert.equal(executed, 4);
  assert.deepEqual(h.answers, []);
  assert.deepEqual(h.errors, ["SAGE_REQUEST_FAILED"]);
});

test("history stays bounded and keeps prior successful turns", async () => {
  let input;
  const h = harness({ brain: { async decide(value) { input = value; return { type: "answer", text: "Ready" }; } } });
  for (let i = 0; i < 7; i++) await h.controller.ask(`Question ${i}`, "text");
  assert.equal(input.history.length, 8);
  assert.equal(input.history.at(-2).text, "Question 5");
});

test("gateway rejects unknown tools including JavaScript property names", async () => {
  const gateway = createAppTools({ isAllowed: () => true, getRoute: () => "guide" });
  for (const name of ["eval", "__proto__", "constructor", "delete_all_reviews"]) {
    assert.equal((await gateway.execute({ name, arguments: {} }, makeSignal())).code, "UNKNOWN_TOOL");
  }
});

test("gateway rejects missing, extra, null, array and wrong-type arguments", async () => {
  const gateway = createAppTools({ isAllowed: () => true, getRoute: () => "guide" });
  for (const args of [null, [], undefined, {}, { field: 1 }, { field: "clubs" },
    { field: "tab", confirm: true }, { field: "tab", selector: "body" }, Object.create({ field: "tab" })]) {
    assert.equal((await gateway.execute({ name: "get_app_context", arguments: args }, makeSignal())).code, "INVALID_ARGUMENTS");
  }
});

test("gateway checks permission and valid app state and maps PLAN to play", async () => {
  let allowed = false, route = "play";
  const gateway = createAppTools({ isAllowed: () => allowed, getRoute: () => route });
  const request = { name: "get_app_context", arguments: { field: "tab" } };
  assert.equal((await gateway.execute(request, makeSignal())).code, "ACTION_NOT_ALLOWED");
  allowed = true;
  assert.equal((await gateway.execute(request, makeSignal())).data.tab, "PLAN");
  route = "injected";
  assert.equal((await gateway.execute(request, makeSignal())).code, "CONTEXT_UNAVAILABLE");
});

test("cancel during permission prevents handler execution", async () => {
  const gate = deferred();
  const abort = new AbortController();
  let ran = false;
  const gateway = new RegisteredToolGateway();
  gateway.register({
    descriptor: { name: "read", requiresConfirmation: false },
    validate: () => ({ ok: true, value: {} }),
    canExecute: () => gate.promise,
    run: () => { ran = true; return result; },
  });
  const call = gateway.execute({ name: "read", arguments: {} }, abort.signal);
  abort.abort();
  gate.resolve({ ok: true });
  assert.equal((await call).code, "CANCELLED");
  assert.equal(ran, false);
});

test("cancelled late handler results never report success", async () => {
  const gate = deferred();
  const abort = new AbortController();
  const gateway = new RegisteredToolGateway();
  gateway.register({
    descriptor: { name: "read", requiresConfirmation: false },
    validate: () => ({ ok: true, value: {} }),
    canExecute: () => ({ ok: true }),
    run: () => gate.promise,
  });
  const call = gateway.execute({ name: "read", arguments: {} }, abort.signal);
  await Promise.resolve();
  abort.abort();
  gate.resolve(result);
  assert.equal((await call).code, "CANCELLED");
});

test("confirmation-required commands cannot execute in Phase 1", async () => {
  const gateway = new RegisteredToolGateway();
  gateway.register({
    descriptor: { name: "delete_review", requiresConfirmation: true },
    validate: () => ({ ok: true, value: {} }),
    canExecute: () => { throw new Error("Must not be reached"); },
    run: () => { throw new Error("Must not run"); },
  });
  assert.equal((await gateway.execute({ name: "delete_review", arguments: {} }, makeSignal())).code, "CONFIRMATION_REQUIRED");
});

test("permission exceptions and malformed handler results fail closed", async () => {
  for (const canExecute of [() => { throw new Error("Denied"); }, () => ({ ok: true })]) {
    const gateway = new RegisteredToolGateway();
    gateway.register({
      descriptor: { name: "read", requiresConfirmation: false },
      validate: () => ({ ok: true, value: {} }),
      canExecute,
      run: () => ({ ok: true, tool: "other" }),
    });
    assert.equal((await gateway.execute({ name: "read", arguments: {} }, makeSignal())).code, "HANDLER_FAILED");
  }
});

test("duplicate registrations cannot replace an approved tool", () => {
  const gateway = new RegisteredToolGateway();
  const tool = { descriptor: { name: "read" } };
  gateway.register(tool);
  assert.throws(() => gateway.register(tool), /Duplicate/);
});

test("timed visemes cover the clip and return to neutral outside it", () => {
  const poses = new Set(["closed", "small", "bite", "teeth", "wide", "round", "open"]);
  assert.equal(cueAt(DEMO.visemes, -1), "closed");
  assert.equal(cueAt(DEMO.visemes, DEMO.durationMs), "closed");
  let end = 0;
  for (const cue of DEMO.visemes) {
    assert.equal(cue.startMs, end);
    assert.ok(cue.endMs > cue.startMs);
    assert.ok(poses.has(cue.viseme));
    assert.equal(cueAt(DEMO.visemes, cue.startMs), cue.viseme);
    end = cue.endMs;
  }
  assert.ok(Math.abs(end - DEMO.durationMs) < 60);
});
