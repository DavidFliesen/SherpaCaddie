# Sherpa Caddie — Ladybug activation

Sherpa Caddie v0.12.4 contains the same ARTEZIQ Ladybug feedback experience used by Angler's Navigator:

- tester sign-in inside the report panel;
- bug, suggestion, question, and other report types;
- severity selection and written details;
- user-initiated screenshot capture with preview, retake, and removal;
- optional Tester Mode diagnostics;
- clear sent/failed/offline messages;
- privacy masks for course/location, review comments, and Sage conversation text.

## One-time activation

1. In the ARTEZIQ Feedback dashboard, add or open **Sherpa Caddie**.
2. Use the slug **`sherpa-caddie`**.
3. Use the launch URL **`https://davidfliesen.github.io/SherpaCaddie/`**.
4. Use the allowed web origin **`https://davidfliesen.github.io`** without a trailing slash.
5. Copy the dashboard's **Supabase publishable key** and Sherpa Caddie's **Public ingest key**.
6. Open `ladybug/ladybug-config.js` and replace only these two placeholders:
   - `REPLACE_WITH_SUPABASE_PUBLISHABLE_KEY`
   - `REPLACE_WITH_SHERPA_CADDIE_PUBLIC_INGEST_KEY`
7. Upload the complete `ladybug` folder. Do not omit `assets` or `vendor`.

The Ladybug stays hidden when either public value is missing, so an incomplete configuration cannot interfere with Sherpa Caddie.

## Quick test

1. Reload Sherpa Caddie and confirm the Ladybug appears at the lower-right without covering the footer.
2. Open it, sign in with an authorized ARTEZIQ tester account, and send a report titled **`TEST: Ladybug integration — Sherpa Caddie`**.
3. Capture a screenshot and confirm course/location and Sage conversation fields are blanked for privacy.
4. Confirm the success window displays a report ID beginning with **`SC-`**.
5. In Tester Mode, visit GUIDE, LEARN, PLAN, CLUBS, and REVIEW and verify only non-identifying workflow events appear.

Add `?ladybug=debug` to the app URL if the launcher does not appear. A small diagnostic label will identify a missing or failed Ladybug file.
