# Sherpa Caddie — Ladybug activation

Sherpa Caddie v0.12.5 contains the same ARTEZIQ Ladybug feedback experience used by Angler's Navigator:

- tester sign-in inside the report panel;
- bug, suggestion, question, and other report types;
- severity selection and written details;
- user-initiated screenshot capture with preview, retake, and removal;
- optional Tester Mode diagnostics;
- clear sent/failed/offline messages;
- privacy masks for course/location, review comments, and Sage conversation text.

## Configuration included

The release already contains the browser-safe public values required to display the Ladybug:

- slug: **`sherpa-caddie`**;
- report prefix: **`SC`** (configured in the Feedback dashboard);
- public ingest key: **`1c95828f-b883-4cd8-9486-d7a16ff50b2b`**;
- allowed origin: **`https://davidfliesen.github.io`**;
- launch URL: **`https://davidfliesen.github.io/SherpaCaddie/`**.

Upload the complete `ladybug` folder with the four root replacement files. Do not omit `assets` or `vendor`.

The Ladybug will now mount automatically. The configuration guard still keeps it hidden if a future edit removes or damages either public value.

## Quick test

1. Reload Sherpa Caddie and confirm the Ladybug appears at the lower-right without covering the footer.
2. Open it, sign in with an authorized ARTEZIQ tester account, and send a report titled **`TEST: Ladybug integration — Sherpa Caddie`**.
3. Capture a screenshot and confirm course/location and Sage conversation fields are blanked for privacy.
4. Confirm the success window displays a report ID beginning with **`SC-`**.
5. In Tester Mode, visit GUIDE, LEARN, PLAN, CLUBS, and REVIEW and verify only non-identifying workflow events appear.

Add `?ladybug=debug` to the app URL if the launcher does not appear. A small diagnostic label will identify a missing or failed Ladybug file.
