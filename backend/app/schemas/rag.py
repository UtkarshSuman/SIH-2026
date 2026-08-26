from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class IngestRequest(BaseModel):
    title: str
    content: str