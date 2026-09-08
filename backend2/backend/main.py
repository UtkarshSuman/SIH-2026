from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.habitations import router as habitations_router

from alert_routes import router as alert_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your actual frontend origin before production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habitations_router)
app.include_router(alert_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)