from typing import Any

from pydantic import BaseModel, Field


class LayoutData(BaseModel):
    """react-grid-layout `layouts` (per breakpoint) + the widget instances."""

    layouts: dict[str, Any] = Field(default_factory=dict)
    widgets: list[dict[str, Any]] = Field(default_factory=list)
