# Phase 1 voice provenance

| Component | Source and role |
| --- | --- |
| Script | One Sherpa Caddie practice tip authored for this prototype. |
| Test voice | CMU US SLT from Flite 2.2. The upstream project ships SLT as one of its included voices and documents its permissive distribution terms. [Flite and SLT](https://github.com/festvox/flite#using-flite) · [Flite license](https://github.com/festvox/flite/blob/master/COPYING) |
| Generation | Local build-time synthesis. `sage-local/generate-demo.py` extracts the utterance's timed Segment relation and encodes its mono 16 kHz audio as MP3 with FFmpeg and libmp3lame. |
| Browser asset | `assets/sage-local/practice.mp3`, 23,804 bytes. The PWA uses Web Audio for playback and `sage-local/demo.mjs` for text and viseme cues. |
| Portrait | Existing 720 × 900 Sherpa Caddie WebP of the supplied Sage portrait. The overlay rig uses the coordinates of that version. |

The clip uses a distinct test voice. A production Sage voice and portrait rights review are separate release decisions. The browser ships only the rendered audio and timing data from Flite.

Regenerate from the patched source root on a machine with Flite 2.2 shared libraries and FFmpeg:

```sh
python3 sage-local/generate-demo.py
node --test tests/sage-local.test.mjs
```

MP3 SHA-256 for this release is `16e016017e5ccd35fde7b95a5c3294373036cfa781f4772fe0b4cf12aa6fc530`.
