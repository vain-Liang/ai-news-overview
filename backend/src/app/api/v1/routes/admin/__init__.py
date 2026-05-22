from __future__ import annotations

from app.api.v1.routes.admin.router import admin_router
from app.api.v1.routes.admin.workflows import admin_workflow_router

__all__ = ["admin_router", "admin_workflow_router"]
