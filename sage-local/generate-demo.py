"""Render ACA practice or swing-tour clips with the Kokoro v1.0 ONNX release."""
import argparse
import json
from pathlib import Path
import re
import subprocess
from tempfile import TemporaryDirectory
import wave

import numpy as np
import onnx

PHRASES = [
    ("Try this on the range.", 0.88, 360),
    ("Pick a target you can see clearly, and give yourself one thing to work on.", 0.90, 410),
    ("Take a smooth practice swing, then step in and hit the ball with that same rhythm.", 0.88, 420),
    ("Afterward, ask yourself what felt different.", 0.87, 320),
    ("Let that guide the next swing.", 0.87, 240),
]
PHONES = {
    "closed": "pbm",
    "bite": "fv",
    "teeth": "szʃʒθð",
    "wide": "iɪeɛæj",
    "round": "wʊuoɔɒəʌ",
    "open": "aɑɐ",
    "small": "tdkɡgnŋlɹɾɚɝhʔ",
}
RATE = 24000
DURATION_NODE = "/encoder/Gather_output_0"
DIRECTORY = Path(__file__).resolve().parent
ROOT = DIRECTORY.parent


def phonemes_for_phrases(phrases):
    # Retain the authored punctuation as its own model tokens.
    js = """
const { phonemize } = require("phonemizer");
(async () => {
  const input = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const result = await Promise.all(input.map(async phrase => {
    const parts = phrase.split(/(\\s*[,.;!?]+\\s*)/);
    const phones = await Promise.all(parts.map(async (part, i) =>
      i % 2 || !part.trim() ? part : (await phonemize(part, "en-us")).join(" ")));
    return phones.join("").replace(/ʲ/g, "j").replace(/r/g, "ɹ").replace(/x/g, "k");
  }));
  process.stdout.write(JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    result = subprocess.run(["node", "-e", js], input=json.dumps([p[0] for p in phrases]),
                            cwd=ROOT, text=True, check=True, capture_output=True)
    return json.loads(result.stdout)


def render_phrases(source, scratch, token_rows):
    model = onnx.load(source / "model.onnx")
    # Expose the frame counts that the decoder uses to align its phonemes.
    model.graph.output.append(onnx.helper.make_tensor_value_info(
        DURATION_NODE, onnx.TensorProto.INT64, ["sequence_length"]))
    aligned_model = scratch / "aligned.onnx"
    onnx.save(model, aligned_model)
    del model
    js = """
const fs = require("fs");
const path = require("path");
globalThis.fetch = () => { throw new Error("Demo rendering uses local files only."); };
const ort = require("onnxruntime-web");
ort.env.wasm.numThreads = 1;
(async () => {
  const task = JSON.parse(fs.readFileSync(0, "utf8"));
  const session = await ort.InferenceSession.create(new Uint8Array(fs.readFileSync(task.model)), {
    executionProviders: ["wasm"],
  });
  const voiceFile = fs.readFileSync(task.voice);
  const voice = new Float32Array(voiceFile.buffer, voiceFile.byteOffset, voiceFile.byteLength / 4);
  const frames = [];
  for (const [i, { ids, speed }] of task.rows.entries()) {
    const index = (ids.length - 2) * 256;
    const result = await session.run({
      input_ids: new ort.Tensor("int64", BigInt64Array.from(ids, BigInt), [1, ids.length]),
      style: new ort.Tensor("float32", voice.slice(index, index + 256), [1, 256]),
      speed: new ort.Tensor("float32", [speed], [1]),
    });
    const data = result.waveform.data;
    fs.writeFileSync(path.join(task.scratch, `phrase-${i}.f32`), Buffer.from(data.buffer, data.byteOffset, data.byteLength));
    frames.push(Array.from(result[task.durationNode].data, Number));
  }
  await session.release();
  process.stdout.write(JSON.stringify(frames));
})().catch(error => { console.error(error); process.exitCode = 1; });
"""
    result = subprocess.run(["node", "-e", js], cwd=ROOT, text=True, capture_output=True,
                            input=json.dumps({"model": str(aligned_model), "voice": str(source / "af_heart.bin"),
                                              "rows": token_rows, "scratch": str(scratch), "durationNode": DURATION_NODE}))
    if result.returncode:
        raise RuntimeError(result.stderr)
    return [(np.fromfile(scratch / f"phrase-{i}.f32", dtype="<f4"), np.array(frames))
            for i, frames in enumerate(json.loads(result.stdout))]


def generate(rendered, token_rows, phrases):
    lookup = {char: pose for pose, chars in PHONES.items() for char in chars}
    audio_parts = []
    cues = []
    gestures, blinks = [], []
    offset = 0

    def milliseconds(samples):
        return round(samples * 1000 / RATE)

    def add_cue(start, end, pose):
        start_ms, end_ms = milliseconds(start), milliseconds(end)
        if end_ms <= start_ms:
            return
        if cues and cues[-1]["viseme"] == pose and cues[-1]["endMs"] == start_ms:
            cues[-1]["endMs"] = end_ms
        else:
            cues.append({"startMs": start_ms, "endMs": end_ms, "viseme": pose})

    for (data, frames), row, (_, _, pause_ms) in zip(rendered, token_rows, phrases, strict=True):
        tokens = row["tokens"]
        if len(frames) != len(tokens) or np.any(frames < 1):
            raise RuntimeError("The model returned invalid alignment frame counts.")
        frame_samples = 600
        if abs(len(data) - sum(frames) * frame_samples) > frame_samples:
            raise RuntimeError("Model timing does not match the waveform.")

        # Remove the voice model's variable padding while leaving room
        # for quiet consonants, then place the authored sentence pause.
        boundaries = np.minimum(np.r_[0, np.cumsum(frames) * frame_samples], len(data))
        block = 240
        peaks = np.max(np.abs(data[:len(data) // block * block].reshape(-1, block)), axis=1)
        voiced = np.flatnonzero(peaks > np.max(peaks) * .007)
        first = max(0, int(voiced[0]) * block - 1200)
        end = min(len(data), (int(voiced[-1]) + 1) * block + 1440)
        clipped = data[first:end].copy()
        clipped[:120] *= np.linspace(0, 1, 120)
        clipped[-120:] *= np.linspace(1, 0, 120)
        length = end - first
        gestures.append(milliseconds(offset) + 200)
        for token, start, stop in zip(tokens, boundaries[:-1], boundaries[1:]):
            if start >= end:
                break
            if stop <= first:
                continue
            # Emphasis and joiner tokens carry the preceding mouth position.
            pose = lookup.get(token)
            if token in "ˈˌːʰʲ" and cues:
                pose = cues[-1]["viseme"]
            add_cue(offset + max(first, start) - first, offset + min(stop, end) - first, pose or "closed")

        pause = round(RATE * pause_ms / 1000)
        blinks.append(milliseconds(offset + length) + 85)
        add_cue(offset + length, offset + length + pause, "closed")
        audio_parts.extend([clipped, np.zeros(pause, dtype=np.float32)])
        offset += length + pause

    duration = milliseconds(offset)
    audio = np.concatenate(audio_parts)
    peak = np.max(np.abs(audio))
    if peak <= 0 or cues[-1]["endMs"] != duration:
        raise RuntimeError("The generated audio or cue track is empty or incomplete.")
    return audio * (0.82 / peak), {
        "text": " ".join(p[0] for p in PHRASES),
        "durationMs": duration,
        "gestureMs": gestures,
        "blinkMs": blinks[:-1],
        "visemes": cues,
    }


def swing_tour_groups():
    script = (ROOT / "swing-viewer.js").read_text(encoding="utf-8")
    beats = [json.loads(line) for line in re.findall(r'^ +speech: (".*"),$', script, re.MULTILINE)]
    if len(beats) != 10:
        raise ValueError("The swing viewer must have exactly ten scripted positions.")
    return [
        [(sentence, .93, 170 if index == 0 else 225)
         for index, sentence in enumerate(re.split(r"(?<=[.!?]) +", beat))]
        for beat in beats
    ]


def encode_clip(audio, scratch, output):
    wav_path = scratch / "render.wav"
    with wave.open(str(wav_path), "wb") as file:
        file.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        file.writeframes(np.round(audio * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav_path),
                    "-codec:a", "libmp3lame", "-b:a", "64k", str(output)], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model_directory", type=Path, help="Directory with model.onnx, tokenizer.json and af_heart.bin")
    parser.add_argument("--swing-tour", action="store_true", help="Render the ten clips from swing-viewer.js")
    args = parser.parse_args()
    source = args.model_directory.resolve()
    groups = swing_tour_groups() if args.swing_tour else [PHRASES]
    phrases = [phrase for group in groups for phrase in group]
    vocab = json.loads((source / "tokenizer.json").read_text())["model"]["vocab"]
    token_rows = []
    for phrase, (_, speed, _) in zip(phonemes_for_phrases(phrases), phrases, strict=True):
        tokens = ["$", *(c for c in phrase if c in vocab), "$"]
        token_rows.append({"tokens": tokens, "ids": [vocab[c] for c in tokens], "speed": speed})

    asset_dir = ROOT / "assets" / "sage-local"
    with TemporaryDirectory() as temporary:
        scratch = Path(temporary)
        rendered = render_phrases(source, scratch, token_rows)
        tracks = []
        cursor = 0
        for position, group in enumerate(groups, start=1):
            stop = cursor + len(group)
            audio, track = generate(rendered[cursor:stop], token_rows[cursor:stop], group)
            cursor = stop
            output = asset_dir / "swing-tour" / f"p{position}.mp3" if args.swing_tour else asset_dir / "practice.mp3"
            output.parent.mkdir(exist_ok=True)
            encode_clip(audio, scratch, output)
            tracks.append(track)
            print(f"Rendered {output.name}: {track['durationMs']} ms with {len(track['visemes'])} cues.")

    header = "// Generated by generate-demo.py from Kokoro audio and alignment frame counts.\n"
    if args.swing_tour:
        # The viewer owns the script. Keep the cue rows compact for review and serving.
        rows = []
        for track in tracks:
            del track["text"]
            rows.append("  " + json.dumps(track, separators=(",", ":")))
        (DIRECTORY / "swing-tour-cues.mjs").write_text(
            header + "export const SWING_CUES = [\n" + ",\n".join(rows) + "\n];\n", encoding="utf-8")
    else:
        (DIRECTORY / "demo.mjs").write_text(
            header + f"export const DEMO = {json.dumps(tracks[0], indent=2)};\n", encoding="utf-8")


if __name__ == "__main__":
    main()
