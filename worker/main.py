"""
FastAPI application bootstrap + APScheduler startup.
"""
import logging
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from config import config
from db import startup_check
from scheduler import configure_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Disaster Platform Worker", version="1.0.0")

# Scheduler instance (initialized on startup)
_scheduler = None


@app.on_event("startup")
async def on_startup() -> None:
    global _scheduler

    # Validate config
    try:
        config.validate()
    except ValueError as e:
        logger.critical("Configuration error: %s", e)
        sys.exit(1)

    # Check DB schema integrity before starting scheduler
    logger.info("Running startup schema check...")
    try:
        startup_check()
    except SystemExit:
        logger.critical("Schema check failed. Exiting.")
        sys.exit(1)
    except Exception as e:
        logger.critical("Failed to connect to database: %s", e)
        sys.exit(1)

    # Start scheduler
    _scheduler = configure_scheduler()
    _scheduler.start()
    logger.info("Scheduler started. Worker is running.")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")


@app.get("/health")
async def health() -> JSONResponse:
    """Health check endpoint — returns scheduler status and job info."""
    global _scheduler
    if _scheduler is None:
        return JSONResponse({"status": "starting", "scheduler": "not_initialized"}, status_code=503)

    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
        })

    return JSONResponse({
        "status": "ok",
        "scheduler": "running" if _scheduler.running else "stopped",
        "jobs": jobs,
    })


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=config.WORKER_PORT,
        reload=False,
        log_level="info",
    )
