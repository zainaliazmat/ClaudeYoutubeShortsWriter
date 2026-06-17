"""Thin I/O shell around Python `kokoro` / ffmpeg / aeneas. The pure timing
logic lives elsewhere; this is the ONLY module that imports the TTS engine."""
import os
import shutil
import subprocess
import tempfile


def _ensure_espeak_env():
    """Point phonemizer at the espeak-ng shared library. Prefer a system
    install; else fall back to the `espeakng_loader` wheel that misaki pulls in
    (it bundles libespeak-ng + data), so no apt/sudo is required. Idempotent."""
    if shutil.which("espeak-ng") or shutil.which("espeak"):
        return True
    try:
        import espeakng_loader
        os.environ.setdefault("PHONEMIZER_ESPEAK_LIBRARY",
                              espeakng_loader.get_library_path())
        os.environ.setdefault("ESPEAK_DATA_PATH",
                              espeakng_loader.get_data_path())
        return True
    except Exception:
        return False


def _is_word_token(tok):
    """A Kokoro token is a WORD (not punctuation/whitespace) iff its text holds at
    least one alphanumeric char. Kokoro emits '.'/',' etc. as their own timed
    tokens; those are dropped so the word stream aligns 1:1 with normalize's."""
    txt = getattr(tok, "text", None)
    return bool(txt) and any(c.isalnum() for c in txt)

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
    # soundfile + numpy are hard deps of the primary synth path (synth writes the
    # WAV with them); probe explicitly so a missing one fails preflight loudly
    # instead of crashing mid-synth as a misleading KokoroUnavailable.
    try:
        import soundfile  # noqa: F401
        import numpy  # noqa: F401
    except Exception:
        missing.append("soundfile/numpy not importable (pip install soundfile numpy)")
    if not _ensure_espeak_env():
        missing.append("espeak-ng unavailable: install the system pkg "
                       "(apt install espeak-ng) or `pip install espeakng-loader`")
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
    """Synthesize with Python Kokoro, collecting native per-WORD timestamps;
    write a silence-trimmed out_wav; return per-WORD (start_s, end_s) for the
    word tokens only (punctuation tokens are dropped so the result aligns 1:1
    with normalize's spoken tokens). Raises KokoroUnavailable if kokoro/soundfile
    aren't available or a word token lacks timing."""
    if not _ensure_espeak_env():
        raise KokoroUnavailable("espeak-ng unavailable (install espeakng-loader)")
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
        # Keep WORD tokens only; '.'/',' etc. are separate timed tokens we drop.
        for t in toks:
            if not _is_word_token(t):
                continue
            ts, te = getattr(t, "start_ts", None), getattr(t, "end_ts", None)
            if ts is None or te is None:
                raise KokoroUnavailable(
                    "kokoro word token %r missing start_ts/end_ts"
                    % getattr(t, "text", None))
            words.append((base + float(ts), base + float(te)))
        chunks.append(a)
        base += len(a) / float(sr)

    raw = out_wav + ".raw.wav"
    sf.write(raw, np.concatenate(chunks), sr)
    try:
        lead = _trim_silence(raw, out_wav)
    finally:
        if os.path.exists(raw):
            os.remove(raw)
    return [(s - lead, e - lead) for (s, e) in words]


def _parse_lead_silence(stderr_text, head_tol=0.05):
    """Pure parser for ffmpeg silencedetect stderr -> seconds of LEADING silence.

    Only a silence region that begins at (near) t=0 is leading silence. If the
    audio opens on speech, the first silence_end belongs to an INTERIOR pause
    between words, and subtracting it would shift every timestamp wrong -- so we
    return 0.0 unless the first detected region's silence_start <= head_tol."""
    pending_start = None
    for line in stderr_text.splitlines():
        if "silence_start:" in line:
            try:
                pending_start = float(
                    line.split("silence_start:")[1].split("|")[0].strip())
            except (ValueError, IndexError):
                pending_start = None
        elif "silence_end:" in line:
            try:
                end = float(line.split("silence_end:")[1].split("|")[0].strip())
            except (ValueError, IndexError):
                return 0.0
            # First region wins: it's leading silence iff it starts at the head.
            if pending_start is not None and pending_start <= head_tol:
                return end
            return 0.0
    return 0.0


def _trim_silence(in_wav, out_wav):
    """Trim ONLY the leading and trailing silence; return the seconds of leading
    silence removed (so word timestamps can be offset onto the trimmed wav).

    Interior silence (the inter-word pauses) is preserved — removing it would
    desync every word timestamp from the audio and collapse the wav far below the
    speech span. Both ends are trimmed with the standard `areverse` double-pass
    (silenceremove with start_periods=1 only trims the leading run, then passes
    the rest through; reversing turns the tail into a new lead and back).
    Forces PCM s16 so stdlib `wave` can read the result downstream."""
    probe = subprocess.run(
        ["ffmpeg", "-i", in_wav, "-af",
         "silencedetect=noise=-50dB:d=0.05", "-f", "null", "-"],
        stderr=subprocess.PIPE)
    lead = _parse_lead_silence(probe.stderr.decode("utf-8", "ignore"))
    trim_end = ("silenceremove=start_periods=1:start_silence=0.05:"
                "start_threshold=-50dB")
    res = subprocess.run(
        ["ffmpeg", "-y", "-i", in_wav, "-af",
         "%s,areverse,%s,areverse" % (trim_end, trim_end),
         "-c:a", "pcm_s16le", out_wav],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0 or not os.path.isfile(out_wav) \
            or os.path.getsize(out_wav) == 0:
        tail = res.stderr.decode("utf-8", "ignore")[-400:]
        raise RuntimeError("ffmpeg silence-trim failed (rc=%s): %s"
                           % (res.returncode, tail))
    return lead


def aeneas_align(spoken_text, wav_path):
    """Fallback: aeneas forced alignment of known text -> per-word (start,end)."""
    from aeneas.executetask import ExecuteTask
    from aeneas.task import Task
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tf:
        tf.write("\n".join(spoken_text.split()))
        txt = tf.name
    cfg = "task_language=eng|is_text_type=plain|os_task_file_format=json"
    try:
        task = Task(config_string=cfg)
        task.audio_file_path_absolute = wav_path
        task.text_file_path_absolute = txt
        ExecuteTask(task).execute()
        out = []
        for frag in task.sync_map_leaves():
            if frag.is_regular:
                out.append((float(frag.begin), float(frag.end)))
        return out
    finally:
        if os.path.exists(txt):
            os.unlink(txt)
