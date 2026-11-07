# Sage Local Phase 1 testing

Sherpa Caddie **v0.12.12** · build **0143**

## Apply the update

Extract the changed-files ZIP into the root of the supplied v0.12.11 source. Allow replacement of the matching files and keep the supplied directory structure. This update runs as a static PWA. Serve it over HTTPS for Safari and installed-app checks.

## Compare ACA and DCA

1. On the iPhone 13 or iPad Pro, open the updated PWA in Safari. Check **v0.12.12** in the splash footer and at the bottom of the app.
2. Open **Settings** with the gear and turn on **Local Sage experiment**. The switch is off by default and stays set for that app installation. A browser test link can also use `?sageLocal=1` for one visit or `?sageLocal=0` to hide the experiment for one visit.
3. Choose **ACA · ARTEZIQ Conversational Avatar**. Settings closes and fills in *Give me a quick practice tip?* Tap **Ask Sage**. Confirm the written answer appears and the 4.63-second test voice plays. Watch the lips, blink and return to the still portrait. ACA uses the existing optimized Sage portrait and a bundled synthetic test clip.
4. Open Settings and choose **DCA · D-ID Conversational Avatar**. Tap **Ask Sage** with the prefilled question. Compare voice, mouth motion, startup delay and the answer. DCA uses the existing configured D-ID agent and needs a connection. Both modes are also accessible from the Sage header as **Local Sage (Experimental)** and **Video**.
5. ACA gives a fixed answer for this question. DCA can generate a different answer for the same wording. Compare latency and presentation with that distinction in mind.
6. With ACA active, ask *What tab am I on?* on GUIDE and again on CLUBS. Confirm each typed reply names the correct tab. Try a different question and confirm ACA explains the demo's limited scope. Use Text or Voice for the regular golf assistant.

## Run on each device

| Check | Procedure and expected result |
| --- | --- |
| Layout | Try portrait and landscape in Safari and from the installed Home Screen PWA. Use the app's full-screen control and verify the six tabs are reachable. |
| Pause and interruption | Tap Pause, wait two seconds, and tap Resume. Mouth motion follows playback and returns to neutral at the end. Tap Stop or ask a second question while speech is playing. The first clip stops immediately. |
| Mode and route changes | During ACA playback, switch to Text, Voice, Video, or another app tab. Check for immediate silence and a usable destination. Repeat from DCA while connecting. Verify that only the selected mode can play media or update the reply. |
| Background and device interruption | Lock the device, switch apps, or take a call during playback. Return and check that a fresh Ask starts cleanly. Repeat with the device speaker and, if applicable, AirPods. |
| Offline | Launch online once, play ACA, then wait for the app update to finish caching. Turn on airplane mode, ensure Wi-Fi is off, close and reopen or reload the app, then repeat the ACA practice tip. The cached reply should still play. |
| Audio fallback | Turn off **Spoken replies** in Settings. The practice answer remains readable. For a failure test on staging, block the MP3 with the browser inspector before it is cached. The written answer stays visible and Text becomes active. |
| Flag | Switch off **Local Sage experiment** in Settings. The comparison selector and Local Sage header button disappear. Text, Voice and Video are available. |

## Measure the device before the next phase

Use the same network, brightness and audio route for both avatars. Take three cold samples in fresh app sessions and five warm samples per device. Record the median and slowest result for tap to visible reply and tap to first audible speech. A second camera at 60 fps can capture the tap, screen and speaker together. Compare mouth closure and opening against the audio on several consonants and vowels. Record the phone speaker and AirPods as separate conditions.

Use Safari Web Inspector to record transferred bytes, page memory and rendering activity before playback, during playback and after Stop. Repeat the scripted answer every 30 seconds for 15 minutes at fixed brightness. Record battery change, heat and any crashes or forced reloads. Record whether the Home Screen build, airplane mode, call interruption and lock/unlock pass.

| Measure | iPhone 13 Safari / Home Screen | iPad Pro Safari / Home Screen |
| --- | --- | --- |
| Cold / warm tap to visible answer and audible speech | Pending physical run | Pending physical run |
| Mouth-to-audio drift and cancel-to-neutral time | Pending physical run | Pending physical run |
| Transfer size and peak / recovered memory | Pending physical run | Pending physical run |
| Battery, temperature observations and interruptions | Pending physical run | Pending physical run |
| Offline, rotation and full-screen checks | Pending physical run | Pending physical run |

Use 1.5 seconds as the Phase 1 target for first audible speech and 120 ms as the target for median lip-sync drift. An audible timing measurement needs the actual device and audio route.

## Reproduce the automated checks

From the patched source root, run:

```sh
node --test tests/sage-local.test.mjs
python3 -m http.server 8765
```

In a second terminal at the same root, with Playwright and its Chromium installed:

```sh
node --test tests/sage-local.browser.mjs
```

Set `SAGE_CHROMIUM` to use an existing Chromium executable, `SAGE_TEST_ORIGIN` to point at a different local origin, or `SAGE_TEST_SCREENSHOTS` to save internal viewport screenshots. The Chromium tests use the actual PWA, canvas, MP3, Web Audio and service worker. The DCA cases use a mock SDK and config so the checks can run independently of a live D-ID account.

## Actual results

- **23 unit tests passed.** They cover the state sequence, tool validation, permissions, cancellation, tool limits, renderer fallback, audio failure and cue boundaries.
- **9 browser scenarios passed in Chromium 153.** They cover both viewport sizes in both orientations, the full-screen REVIEW tab, Settings provider selection and the shared prompt, a mock D-ID conversation, cancellation and teardown, the neutral portrait, the text fallback, and cached ACA playback after an offline reload.
- **Asset checks passed.** The manifest and service worker agree on build 0143. All 30 named precache files resolve. Inline scripts and shipped JavaScript pass syntax checks.
- **ACA payload** is 44,645 bytes of additional runtime assets before transfer compression, including 23,804 bytes for the clip and 20,841 bytes for the five JavaScript modules. The updated HTML adds 13,101 raw bytes. The service worker precaches these assets for offline use. ACA downloads zero model weights.
- **Working buffers** include a 720 × 900 RGBA canvas of about 2.47 MiB and the decoded mono clip, about 0.85 MiB at a 48 kHz output rate. Those are buffer estimates. The renderer releases its canvas dimensions and closes its audio context on completion or cancellation. Safari page memory and GPU allocations require device measurement.

| Chromium viewport | Tap to Web Audio scheduling | Scheduled lead | Decoded audio duration |
| --- | --- | --- | --- |
| 390 × 844 phone portrait | 54 ms | 20 ms | 4,630 ms |
| 844 × 390 phone landscape | 27 ms | 20 ms | 4,630 ms |
| 1024 × 1366 tablet portrait | 41 ms | 20 ms | 4,630 ms |
| 1366 × 1024 tablet landscape | 28 ms | 20 ms | 4,630 ms |

The browser timing above measures the call to schedule playback. The file contains about 265 ms of leading low-level audio at a −37 dB detection threshold. Actual audible latency includes the playback device and route. Physical iPhone and iPad results remain pending.

## Reasoning deployment recommendation

Keep ACA's portrait, playback, tool validation and deterministic fallback on-device. For the conversational reasoning phase, plan for optional ARTEZIQ-hosted inference. Make an entirely on-device model an option if the iPhone 13 and iPad Pro meet the separate model size, first-token latency, memory, heat, battery and answer-quality targets. Phase 1 measures a scripted playback pipeline and cannot predict model performance.
