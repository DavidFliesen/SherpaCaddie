# ACA demo voice provenance

| Component | Source and role |
| --- | --- |
| Script | Five original coaching sentences written for Sherpa Caddie's practice-tip demo. |
| Test voice | Kokoro v1.0 `af_heart`, selected as a distinct US English voice. The model card lists Apache 2.0 for the weights. [Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) · [Voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) |
| Model export | Full precision ONNX Community export at revision `1939ad2a8e416c0acfeecc08a694d14ef25f2231`. [Pinned model export](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/1939ad2a8e416c0acfeecc08a694d14ef25f2231) |
| Build | eSpeak NG phonemization and ONNX Runtime Web WASM inference run locally during asset generation. The script exposes the model's phoneme frame counts and adjusts the cue track when trimming and joining the five phrases. |
| Browser playback | `assets/sage-local/practice.mp3` is a 16.17-second mono, 24 kHz clip. `sage-local/demo.mjs` contains the text, phoneme-derived mouth cues, and phrase gestures. Playback uses the bundled files offline. |
| Portrait | Existing 720 × 900 Sherpa Caddie WebP, animated with a local 2D rig. |

The DCA recording served as a reference for pacing and movement. The ACA audio uses the Kokoro test voice and an original script. Production voice and portrait rights review are separate release decisions.

## Regenerate the demo

Place `onnx/model.onnx`, `tokenizer.json`, and `voices/af_heart.bin` from the pinned export in one directory, with the basenames below. Install FFmpeg and the build-only packages, then run the generator from the Sherpa Caddie source root.

```sh
python3 -m pip install numpy onnx
npm install --no-save phonemizer@1.2.1 onnxruntime-web@1.22.0-dev.20250409-89f8206ba4
python3 sage-local/generate-demo.py /path/to/kokoro-assets
node --test tests/sage-local.test.mjs
```

| File | SHA-256 |
| --- | --- |
| `model.onnx` | `8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb` |
| `tokenizer.json` | `77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34` |
| `af_heart.bin` | `d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b` |
| Published `practice.mp3` | `7c34c492d810b76a4aa6eb0e1330d332c31a640010a83c0b9fbfea5019c13276` |
