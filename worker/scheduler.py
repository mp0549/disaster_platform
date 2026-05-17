"""
APScheduler job definitions for all ingestors.
Jobs are registered in configure_scheduler() and started in main.py.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)


def run_ingestor(ingestor_class: type) -> None:
    """Wrapper to instantiate and run an ingestor, catching all exceptions."""
    try:
        ingestor = ingestor_class()
        ingestor.ingest()
    except Exception as e:
        logger.error("Unhandled error in ingestor %s: %s", ingestor_class.__name__, e)


def configure_scheduler() -> BackgroundScheduler:
    """Create and configure the APScheduler with all ingestion jobs."""
    # Import here to avoid circular imports at module load time
    from ingestors.usgs import USGSIngestorHourly, USGSIngestorDaily, USGSIngestorWeekly
    from ingestors.eonet import EONETIngestor
    from ingestors.gdacs import GDACSIngestor
    from ingestors.fema import FEMAIngestor
    from ingestors.firms import FIRMSIngestor
    from ingestors.noaa import NOAAIngestor
    from ingestors.reliefweb import ReliefWebIngestor

    scheduler = BackgroundScheduler(
        job_defaults={
            "coalesce": True,           # Combine missed runs into one
            "max_instances": 1,         # One instance per job at a time
            "misfire_grace_time": 60,   # Allow 60s grace window for misfires
        }
    )

    # USGS Earthquake — three feeds at different intervals
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=5),
        args=[USGSIngestorHourly],
        id="usgs_hourly",
        name="USGS Hourly Earthquakes",
    )
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=30),
        args=[USGSIngestorDaily],
        id="usgs_daily",
        name="USGS Daily Earthquakes",
    )
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(hours=6),
        args=[USGSIngestorWeekly],
        id="usgs_weekly",
        name="USGS Weekly Earthquakes",
    )

    # NASA EONET — every 15 minutes
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=15),
        args=[EONETIngestor],
        id="eonet",
        name="NASA EONET",
    )

    # GDACS GeoRSS — every 10 minutes
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=10),
        args=[GDACSIngestor],
        id="gdacs",
        name="GDACS GeoRSS",
    )

    # OpenFEMA — every 60 minutes
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=60),
        args=[FEMAIngestor],
        id="fema",
        name="OpenFEMA",
    )

    # NASA FIRMS — every 30 minutes (skips if MAP_KEY not set)
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=30),
        args=[FIRMSIngestor],
        id="firms",
        name="NASA FIRMS",
    )

    # NOAA/NWS Alerts — every 10 minutes
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=10),
        args=[NOAAIngestor],
        id="noaa",
        name="NOAA/NWS Alerts",
    )

    # ReliefWeb — every 60 minutes
    scheduler.add_job(
        run_ingestor,
        trigger=IntervalTrigger(minutes=60),
        args=[ReliefWebIngestor],
        id="reliefweb",
        name="ReliefWeb",
    )

    logger.info("Scheduler configured with %d jobs.", len(scheduler.get_jobs()))
    return scheduler
