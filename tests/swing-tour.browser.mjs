import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SAGE_TEST_ORIGIN || "http://127.0.0.1:8765";
const spellings = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const badge = "#scPositionBadge";
const tour = "#scTour";
const status = "#scTourStatus";
const camera = name => `[data-sc-swing-view="${name}"]`;

async function observeViewer(page) {
  await page.addInitScript(() => {
    window.swingEvents = [];
    document.addEventListener("sherpa:swing-bridge-ready", () => {
      document.querySelector("#swingPositionViewer").addEventListener("sherpa:swing-position-changed", event => {
        if (event.detail.source.endsWith("-tour")) {
          window.swingEvents.push({ type: "position", ...event.detail,
            src: document.querySelector("#scSwingImage").getAttribute("src") });
        }
      });
    });
  });
}

async function load(page) {
  await page.goto(`${origin}/index.html?sageLocal=1`);
  await page.locator("#splashScreen").waitFor({ state: "hidden" });
  assert.match(await page.locator(".footer").textContent(), /v0\.13\.5/);
}

test("Sage swing tour through the app's two avatar providers", async t => {

  async function scenario(name, callback) {
    await t.test(name, async () => {
      const browser = await chromium.launch({
        executablePath: process.env.SAGE_CHROMIUM || undefined,
        args: process.env.SAGE_HEADLESS_SHELL ? ["--single-process", "--no-zygote", "--disable-gpu"] : [],
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await context.route("**/*", route => new URL(route.request().url()).origin === origin
        ? route.continue() : route.abort());
      try {
        await observeViewer(page);
        await callback(page, context);
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }

  await scenario("DCA submits one script at a time and follows SDK START/STOP", async page => {
    await page.route("**/did-config.json?*", route => route.fulfill({
      json: { agentId: "test-agent", clientKey: "mock-client-key" },
    }));
    await page.route("https://cdn.jsdelivr.net/npm/@d-id/client-sdk@2.0.6/+esm", route => route.fulfill({
      contentType: "application/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: `
        window.didTour = { sessions: [], calls: [], closed: 0 };
        export async function createAgentManager(id, { callbacks }) {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 32;
          const ctx = canvas.getContext("2d");
          ctx.fillRect(0, 0, 32, 32);
          const stream = canvas.captureStream(15);
          const streamClock = setInterval(() => ctx.fillRect(0, 0, 32, 32), 60);
          window.didTour.sessions.push(callbacks);
          callbacks.onSrcObjectReady(stream);
          return {
            registerClientTool() {},
            async connect() { callbacks.onConnectionStateChange("connected"); },
            async speak(script) { window.didTour.calls.push(script); },
            async disconnect() { clearInterval(streamClock); window.didTour.closed++; },
          };
        }
      `,
    }));
    await load(page);
    await page.locator('[data-companion-mode="live"]').click();
    await page.waitForFunction(() => window.didTour?.sessions.length === 1);
    await page.locator('[data-sc-position="3"]').click();
    await page.locator("#companionQuestion").fill("Walk me through all 10 golf swing positions.");
    await page.locator("#companionSendBtn").click();
    const event = (value, session = 0) =>
      page.evaluate(([value, session]) => window.didTour.sessions[session].onVideoStateChange(value), [value, session]);
    const waitForCalls = count => page.waitForFunction(count => window.didTour.calls.length === count, count);

    for (const [index, spelling] of spellings.entries()) {
      await waitForCalls(index + 1);
      const script = await page.evaluate(index => window.didTour.calls[index], index);
      assert.equal(script.type, "text");
      assert.ok(script.input.startsWith(`Position ${spelling}. `));
      assert.equal(await page.locator(badge).textContent(), `P${index === 0 ? 4 : index}`);
      await event("STOP"); // A stop before this clip starts must not skip it.
      await event("START");
      await event("START"); // Duplicate start must not redisplay the same step.
      assert.equal(await page.locator(badge).textContent(), `P${index + 1}`);
      assert.equal(await page.evaluate(() => window.didTour.calls.length), index + 1);
      await event("STOP");
    }
    await page.waitForFunction(() => document.querySelector("#scTourStatus").textContent === "Swing tour complete");
    const updates = await page.evaluate(() => window.swingEvents);
    assert.deepEqual(updates.map(event => event.position), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.ok(updates.every(event => event.src.includes(`/front/p${event.position}.webp`)));

    await page.locator(tour).click();
    await waitForCalls(11);
    await event("START");
    await event("STOP");
    await waitForCalls(12);
    await event("START");
    assert.equal(await page.locator(badge).textContent(), "P2");
    await page.locator(camera("three-quarter")).click();
    await page.waitForFunction(() => window.didTour.closed === 1);
    await event("STOP");
    await event("START");
    assert.equal(await page.locator(badge).textContent(), "P1");
    assert.match(await page.locator("#scSwingImage").getAttribute("src"), /three-quarter\/p1\.webp/);
    assert.equal(await page.evaluate(() => window.didTour.calls.length), 12);

    await page.locator(tour).click();
    await waitForCalls(13);
    await event("START");
    await event("STOP");
    assert.equal(await page.locator(status).textContent(), "Preparing the swing tour…");
    await event("START", 1);
    await event("STOP", 1);
    await waitForCalls(14);
    await event("START", 1);
    await page.locator(camera("three-quarter")).click(); // Reselecting the active view resets it as well.
    assert.equal(await page.locator(badge).textContent(), "P1");
    assert.equal(await page.locator(status).textContent(), "Swing tour stopped");
  });

  await scenario("ACA plays all ten cached clips using native playing and ended events", async (page, context) => {
    await page.addInitScript(() => {
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        if (this.src.includes("/swing-tour/")) {
          this.playbackRate = 4;
          const position = Number(this.src.match(/\/p(\d+)\.mp3/)[1]);
          this.addEventListener("playing", () => window.swingEvents.push({ type: "playing", position }), { once: true });
          this.addEventListener("ended", () => window.swingEvents.push({ type: "ended", position }), { once: true });
        }
        return play.apply(this, args);
      };
    });
    await load(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const range = await page.evaluate(async () => {
      const response = await fetch("./assets/sage-local/swing-tour/p1.mp3?v=0153", {
        headers: { Range: "bytes=0-1" },
      });
      return [response.status, (await response.arrayBuffer()).byteLength];
    });
    assert.deepEqual(range, [206, 2]);
    await page.locator('[data-companion-mode="local"]').click();
    await page.locator(camera("three-quarter")).click();
    await context.setOffline(true);
    await page.locator(tour).click();
    await page.waitForFunction(() => document.querySelector("#scTourStatus").textContent === "Swing tour complete", null, { timeout: 60000 });
    const events = await page.evaluate(() => window.swingEvents);
    assert.equal(events.length, 30);
    for (let index = 0; index < 10; index += 1) {
      const [playing, shown, ended] = events.slice(index * 3, index * 3 + 3);
      // Both observers handle the same native event, with the viewer installed first.
      assert.deepEqual([playing.type, shown.type, ended.type].sort(), ["ended", "playing", "position"]);
      assert.equal(ended.type, "ended");
      assert.ok([playing, shown, ended].every(event => event.position === index + 1));
      const position = [playing, shown].find(event => event.type === "position");
      assert.ok(position.src.includes(`/three-quarter/p${index + 1}.webp`));
    }
    assert.match(await page.locator("#quickAnswer").textContent(), /Position Ten\./);

    await page.locator(tour).click();
    await page.waitForFunction(() => document.querySelector("#scPositionBadge").textContent === "P2");
    await page.locator(camera("front")).click();
    assert.equal(await page.locator(status).textContent(), "Swing tour stopped");
    assert.equal(await page.locator(badge).textContent(), "P1");
    assert.match(await page.locator("#scSwingImage").getAttribute("src"), /front\/p1\.webp/);
    assert.equal(await page.evaluate(() => window.swingEvents.filter(event => event.type === "position").length), 12);
  });
});
