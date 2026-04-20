"""Task Queue & Worker Interface."""

import asyncio
from typing import Callable, Any
from concurrent.futures import ProcessPoolExecutor

class TaskQueue:
    """
    Abstracted Task Queue to handle long-running jobs (Report Gen, Exports).
    Scaffolded to use asyncio.create_task for now, but designed to bridge 
    to BullMQ (Redis) or Celery.
    """

    def __init__(self):
        self.active_jobs = {}

    async def enqueue(self, job_name: str, task_fn: Callable, *args, **kwargs) -> str:
        """
        Enqueue a task and return a job_id.
        """
        job_id = f"job_{job_name}_{id(task_fn)}"
        print(f"[QUEUE] Enqueuing job {job_id}: {job_name}")
        
        # In a real setup, this sends to Redis
        # We'll simulate with an async task for the MVP foundation
        asyncio.create_task(self._run_task(job_id, task_fn, *args, **kwargs))
        
        return job_id

    async def _run_task(self, job_id: str, task_fn: Callable, *args, **kwargs):
        """Internal task runner execution."""
        try:
            self.active_jobs[job_id] = "running"
            await task_fn(*args, **kwargs)
            self.active_jobs[job_id] = "completed"
        except Exception as e:
            print(f"[QUEUE] Job {job_id} failed: {e}")
            self.active_jobs[job_id] = "failed"

# Global task queue
task_queue = TaskQueue()
