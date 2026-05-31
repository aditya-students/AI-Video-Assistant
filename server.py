"""
FastAPI backend for AI Video Assistant.
Wraps the existing pipeline (main.py) with REST endpoints.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uuid
import threading

load_dotenv()

# ── Import existing pipeline modules ──
from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarize import summarize, generate_title
from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.rag_engine import build_rag_chain, ask_question
import time

app = FastAPI(title="AI Video Assistant API", version="1.0.0")

# ── CORS (allow React dev server) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory job store ──
jobs = {}  # job_id -> { status, step, step_name, total, results, rag_chain, error }

PIPELINE_STEPS = [
    "Downloading audio",
    "Transcribing",
    "Generating summary",
    "Extracting insights",
    "Building RAG index",
]


# ── Request / Response models ──
class AnalyzeRequest(BaseModel):
    source: str
    language: str = "english"


class ChatRequest(BaseModel):
    job_id: str
    question: str


# ── Pipeline worker (runs in background thread) ──
def run_pipeline_worker(job_id: str, source: str, language: str):
    job = jobs[job_id]

    try:
        # Step 0: Download audio
        job["step"] = 0
        job["step_name"] = PIPELINE_STEPS[0]
        chunks = process_input(source)

        # Step 1: Transcribe
        job["step"] = 1
        job["step_name"] = PIPELINE_STEPS[1]
        transcript = transcribe_all(chunks, language=language)

        # Step 2: Generate summary + title
        job["step"] = 2
        job["step_name"] = PIPELINE_STEPS[2]
        title = generate_title(transcript)
        time.sleep(1)
        summary_text = summarize(transcript)
        time.sleep(1)

        # Step 3: Extract insights
        job["step"] = 3
        job["step_name"] = PIPELINE_STEPS[3]
        action_items = extract_action_items(transcript)
        time.sleep(1)
        key_decisions = extract_key_decisions(transcript)
        time.sleep(1)
        open_questions = extract_questions(transcript)

        # Step 4: Build RAG index
        job["step"] = 4
        job["step_name"] = PIPELINE_STEPS[4]
        rag_chain = build_rag_chain(transcript)

        # Done
        job["step"] = 5
        job["step_name"] = "Complete"
        job["status"] = "done"
        job["results"] = {
            "title": title,
            "transcript": transcript,
            "summary": summary_text,
            "action_items": action_items,
            "key_decisions": key_decisions,
            "open_questions": open_questions,
        }
        job["rag_chain"] = rag_chain

    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)
        print(f"Pipeline error for job {job_id}: {e}")


# ── Endpoints ──

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Start a new video analysis job."""
    job_id = str(uuid.uuid4())[:8]

    jobs[job_id] = {
        "status": "running",
        "step": 0,
        "step_name": PIPELINE_STEPS[0],
        "total": len(PIPELINE_STEPS),
        "results": None,
        "rag_chain": None,
        "error": None,
    }

    # Run pipeline in background thread
    thread = threading.Thread(
        target=run_pipeline_worker,
        args=(job_id, req.source, req.language),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Poll pipeline progress."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    result = {
        "step": job["step"],
        "total": job["total"],
        "step_name": job["step_name"],
        "status": job["status"],
    }

    if job["status"] == "error":
        result["error"] = job["error"]

    return result


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """Fetch completed pipeline results."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]
    if job["status"] != "done":
        raise HTTPException(status_code=400, detail="Job not complete yet")

    return job["results"]


@app.post("/chat")
async def chat(req: ChatRequest):
    """Ask a question via RAG chain."""
    if req.job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[req.job_id]
    if job["status"] != "done" or job["rag_chain"] is None:
        raise HTTPException(status_code=400, detail="Video not yet analyzed")

    try:
        answer = ask_question(job["rag_chain"], req.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
