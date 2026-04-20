from __future__ import annotations


def test_create_app_includes_health_endpoint() -> None:
    from app.main import create_app

    app = create_app()
    routes = {path for route in app.router.routes if (path := getattr(route, "path", None))}

    assert "/healthz" in routes
    assert "/system/runtime" in routes
