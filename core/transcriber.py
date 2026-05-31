import whisper
import os
import requests
import time
from pydub import AudioSegment

# Sarvam's sync STT-translate API rejects audio longer than 30s.
# We slice each chunk into 25s pieces (with a 5s safety margin) before sending.
SARVAM_PIECE_SECONDS = 25


WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small").strip()


SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "").strip() or None
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_STT_TRANSLATE_URL = "https://api.sarvam.ai/speech-to-text-translate"
SARVAM_MODEL = os.getenv("SARVAM_STT_MODEL", "saaras:v2.5").strip()

_model = None


def load_model():

    global _model  

    if _model is None: 
        print(f"Loading Whisper model: {WHISPER_MODEL} ...")
        try:
            _model = whisper.load_model(WHISPER_MODEL) 
        except Exception as e:
            err_msg = str(e).lower()
            if "connection" in err_msg or "disconnected" in err_msg or "timeout" in err_msg or "urllib" in err_msg:
                raise RuntimeError(
                    f"Failed to download/load Whisper model '{WHISPER_MODEL}' due to a network connection error. "
                    f"On the first run, Whisper must download this model (~140MB for 'base', ~460MB for 'small') from OpenAI's servers. "
                    f"Please verify your internet connection, check if a firewall/proxy is blocking 'openaipublic.azureedge.net', and try again."
                ) from e
            raise e
        print("Whisper model loaded.")
    return _model 


def transcribe_chunk_whisper(chunk_path: str) -> str:

    model = load_model()  

    result = model.transcribe(chunk_path, task="transcribe")  
    return result["text"]  


def _send_to_sarvam(piece_path: str, translate: bool = False) -> str:
    """Send one ≤30s WAV file to Sarvam and return the transcript (verbatim or translated)."""
    headers = {"api-subscription-key": SARVAM_API_KEY}
    url = SARVAM_STT_TRANSLATE_URL if translate else SARVAM_STT_URL

    for attempt in range(6):  # Up to 6 attempts
        try:
            with open(piece_path, "rb") as f:
                files = {"file": (os.path.basename(piece_path), f, "audio/wav")}
                data = {"model": SARVAM_MODEL, "with_diarization": "false"}
                if "v3" in SARVAM_MODEL.lower():
                    data["mode"] = "translate" if translate else "codemix"

                response = requests.post(
                    url,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=120,
                )

            if response.status_code == 429:
                wait_time = 2 ** attempt * 2  # 2, 4, 8, 16, 32s
                print(f"\n⚠️ Sarvam rate limited (429). Retrying in {wait_time}s... (Attempt {attempt + 1}/6)")
                time.sleep(wait_time)
                continue

            if not response.ok:
                print(f"\n❌ Sarvam returned {response.status_code}")
                print(f"Response body: {response.text}\n")
                response.raise_for_status()

            return response.json().get("transcript", "")

        except Exception as e:
            if attempt == 5:
                raise e
            wait_time = 2 ** attempt * 2
            print(f"\n⚠️ Connection error or failure with Sarvam: {e}. Retrying in {wait_time}s... (Attempt {attempt + 1}/6)")
            time.sleep(wait_time)

    raise RuntimeError("Failed to transcribe with Sarvam AI after multiple attempts due to rate limiting or connection errors.")


def transcribe_chunk_sarvam(chunk_path: str, translate: bool = False) -> str:
    """
    Sarvam sync API only accepts ≤30s audio. We split this chunk into
    25-second pieces, send each separately, and join the transcripts.
    """
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not set in environment / .env")

    audio = AudioSegment.from_wav(chunk_path)
    piece_ms = SARVAM_PIECE_SECONDS * 1000

    full_text = ""
    total_pieces = (len(audio) + piece_ms - 1) // piece_ms

    for i, start in enumerate(range(0, len(audio), piece_ms)):
        piece = audio[start: start + piece_ms]
        piece_path = f"{chunk_path}_sv_{i}.wav"
        piece.export(piece_path, format="wav")

        try:
            print(f"  → Sarvam piece {i + 1}/{total_pieces} (translate={translate}) ...")
            full_text += _send_to_sarvam(piece_path, translate=translate) + " "
            if i < total_pieces - 1:
                time.sleep(1.5)  # Proactive delay to be polite to the API rate limiter
        finally:
            if os.path.exists(piece_path):
                os.remove(piece_path)

    return full_text.strip()


def transcribe_chunk(chunk_path: str, language: str = "english") -> str:
    """
    Route one chunk to Whisper or Sarvam depending on language choice.
    - english            → Whisper (local model)
    - hinglish           → Sarvam verbatim transcription (Hinglish text)
    - hinglish_translated → Sarvam translation (translated to English text)
    """
    lang_lower = language.lower()
    if lang_lower == "hinglish":
        return transcribe_chunk_sarvam(chunk_path, translate=False)
    elif lang_lower == "hinglish_translated" or lang_lower == "hinglish_translate":
        return transcribe_chunk_sarvam(chunk_path, translate=True)
    return transcribe_chunk_whisper(chunk_path)


def transcribe_all(chunks: list, language: str = "english") -> str:
    full_transcript = "" 

    lang_lower = language.lower()
    if lang_lower == "hinglish":
        engine = "Sarvam AI (Hinglish Verbatim)"
    elif lang_lower == "hinglish_translated" or lang_lower == "hinglish_translate":
        engine = "Sarvam AI (Hinglish Translated to English)"
    else:
        engine = "Whisper"
        
    print(f"Using {engine} for transcription.")

    for i, chunk in enumerate(chunks):  
        print(f"Transcribing chunk {i + 1}/{len(chunks)}...")
        text = transcribe_chunk(chunk, language=language)  
        full_transcript += text + " "  

    print("Transcription complete.")
    return full_transcript.strip()