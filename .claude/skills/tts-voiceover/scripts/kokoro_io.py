"""Thin I/O shell around Python `kokoro` / ffmpeg / aeneas. The pure timing
logic lives elsewhere; this is the ONLY module that imports the TTS engine."""
import os
import shutil
import subprocess
import tempfile

# Kokoro-82M v1.0 bundled English voices (subset we use; full list in HF VOICES.md).
KNOWN_VOICES = {
    "af_heart", "af_bella", "af_nicole", "af_sarah", "af_sky", "af_alloy",
    "af_aoede", "af_jessica", "af_kore", "af_nova", "af_river",
    "am_michael", "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam",
    "am_onyx", "am_puck", "am_santa",
    "bf_emma", "bf_alice", "bf_isabella", "bf_lily",
    "bm_george", "bm_daniel", "bm_fable", "bm_lewis",
}


class KokoroUnavailable(Exception):
    pass


def preflight(voice, need_aligner):
    missing = []
    try:
        import kokoro  # noqa: F401
    except Exception:
        missing.append("kokoro not importable (pip install kokoro misaki)")
    if shutil.which("espeak-ng") is None and shutil.which("espeak") is None:
        missing.append("espeak-ng not on PATH (phonemizer)")
    if voice not in KNOWN_VOICES:
        missing.append("unknown voice: %s" % voice)
    if shutil.which("ffmpeg") is None:
        missing.append("ffmpeg not on PATH")
    if need_aligner:
        try:
            import aeneas  # noqa: F401
        except Exception:
            missing.append("aeneas not importable (fallback aligner)")
    return {"ok": len(missing) == 0, "missing": missing}


def synth_and_durations(spoken_text, voice, speed, out_wav):
    """Synthesize with Python Kokoro, collecting native per-token timestamps;
    write a silence-trimmed out_wav; return per-WORD (start_s, end_s).
    Raises KokoroUnavailable if kokoro/soundfile/timestamps aren't available."""
    try:
        from kokoro import KPipeline
        import soundfile as sf
        import numpy as np
    except Exception as e:
        raise KokoroUnavailable("kokoro/soundfile unavailable: %s" % e)

    lang = voice[0]   # 'a' = American, 'b' = British English (Kokoro convention)
    pipeline = KPipeline(lang_code=lang)
    sr = 24000
    chunks, words, base = [], [], 0.0
    for result in pipeline(spoken_text, voice=voice, speed=speed):
        audio = getattr(result, "audio", None)
        toks = getattr(result, "tokens", None)
        if audio is None or not toks:
            raise KokoroUnavailable("kokoro returned no audio+token timing")
        a = audio.detach().cpu().numpy() if hasattr(audio, "detach") \
            else np.asarray(audio)
        for t in toks:
            ts, te = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            if ts is None or te is None:
                raise KokoroUnavailable("kokoro token missing start_ts/end_ts")
            words.append((base + float(ts), base + float(te)))
        chunks.append(a)
        base += len(a) / float(sr)

    raw = out_wav + ".raw.wav"
    sf.write(raw, np.concatenate(chunks), sr)
    lead = _trim_silence(raw, out_wav)
    if os.path.exists(raw):
        os.remove(raw)
    return [(s - lead, e - lead) for (s, e) in words]


def _trim_silence(in_wav, out_wav):
    """Trim leading/trailing silence with ffmpeg silenceremove; return the
    seconds of leading silence removed (so timestamps can be offset)."""
    # Measure leading silence first.
    probe = subprocess.run(
        ["ffmpeg", "-i", in_wav, "-af",
         "silencedetect=noise=-50dB:d=0.05", "-f", "null", "-"],
        stderr=subprocess.PIPE)
    lead = 0.0
    for line in probe.stderr.decode("utf-8", "ignore").splitlines():
        if "silence_end" in line:
            try:
                lead = float(line.split("silence_end:")[1].split("|")[0].strip())
                break
            except (ValueError, IndexError):
                lead = 0.0
                continue
    subprocess.run(
        ["ffmpeg", "-y", "-i", in_wav, "-af",
         "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB:"
         "stop_periods=1:stop_silence=0.1:stop_threshold=-50dB", out_wav],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return lead


def aeneas_align(spoken_text, wav_path):
    """Fallback: aeneas forced alignment of known text -> per-word (start,end)."""
    from aeneas.executetask import ExecuteTask
    from aeneas.task import Task
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tf:
        tf.write("\n".join(spoken_text.split()))
        txt = tf.name
    cfg = "task_language=eng|is_text_type=plain|os_task_file_format=json"
    task = Task(config_string=cfg)
    task.audio_file_path_absolute = wav_path
    task.text_file_path_absolute = txt
    ExecuteTask(task).execute()
    out = []
    for frag in task.sync_map_leaves():
        if frag.is_regular:
            out.append((float(frag.begin), float(frag.end)))
    os.unlink(txt)
    return out
