from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],  # your admin.html / subscriber.html origin
    allow_methods=["*"],
    allow_headers=["*"],
)

from alert_routes import router as alert_router
app.include_router(alert_router)