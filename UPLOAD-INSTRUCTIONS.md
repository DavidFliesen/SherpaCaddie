# Sherpa Caddie v0.13.5 — Playback-Synchronized Swing Tour

Extract this changed-files ZIP over the root of the existing Sherpa Caddie v0.13.4 source. Keep the directory structure. The archive contains complete replacement files and adds the ACA swing-tour clips, timing data, and browser tests. Keep the rest of the repository in place.

- Replace the files at the root and the updated files under `sage-local/` and `tests/`.
- Add the `assets/sage-local/swing-tour/` directory and its ten MP3 files.
- To preview locally, serve the repository root with `python3 -m http.server 8765` and open `http://localhost:8765/index.html?sageLocal=1`.
- Confirm **v0.13.5** in the footer, then select **Tour with Sage** on GUIDE. Selecting either camera during the tour should stop the audio and show that camera’s P1.
