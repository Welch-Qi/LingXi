from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TrajectoryEvent:
    ts: float
    kind: str
    agent: str
    detail: dict[str, Any]


@dataclass
class TrajectoryRecorder:
    task_id: str
    events: list[TrajectoryEvent] = field(default_factory=list)
    token_usage: dict[str, int] = field(default_factory=lambda: {"prompt": 0, "completion": 0})

    def log(self, kind: str, agent: str, **detail: Any) -> None:
        self.events.append(TrajectoryEvent(time.time(), kind, agent, detail))

    def add_tokens(self, prompt: int = 0, completion: int = 0) -> None:
        self.token_usage["prompt"] += prompt
        self.token_usage["completion"] += completion

    def to_dict(self) -> dict[str, Any]:
        return {
            "taskId": self.task_id,
            "tokenUsage": self.token_usage,
            "events": [
                {"ts": e.ts, "kind": e.kind, "agent": e.agent, "detail": e.detail} for e in self.events
            ],
        }


def new_task_id() -> str:
    return "task_" + uuid.uuid4().hex[:16]
