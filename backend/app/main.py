"""FastAPI application entrypoint for Agency OS."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .utils.db import init_db
from .routers import context, reports, ingestion, tenants, widgets, admin

def create_app() -> FastAPI:
    application = FastAPI(
        title="Marketing Intelligence OS Backend",
        description="Data Warehouse & Narrative Reporting Engine",
        version="1.0.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    print("🔌 Registering Routers...")
    application.include_router(tenants.router, prefix="/api/tenants", tags=["tenants"])
    application.include_router(context.router, prefix="/api/context", tags=["context"])
    application.include_router(reports.router, prefix="/api/reports", tags=["reports"])
    application.include_router(ingestion.router, prefix="/api/ingestion", tags=["ingestion / connections"])
    application.include_router(widgets.router, prefix="/api/widgets", tags=["widgets"])
    application.include_router(admin.router, prefix="/api/admin", tags=["admin"])

    @application.on_event("startup")
    async def startup_event():
        print("🏗️ Initializing Database...")
        try:
            init_db()
            print("✅ Database Ready.")
        except Exception as e:
            print(f"❌ Database Init Failed: {e}")

    return application

app = create_app()

@app.get("/")
def read_root():
    return {"status": "Marketing Intelligence OS Backend is LIVE"}
