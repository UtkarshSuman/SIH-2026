"""
FEATURE: Retrieve relevant chunks, then stream an answer from Groq's
free-tier LLM API, grounded in them.
INSTALLATION: pip install langchain-groq
"""
from collections.abc import AsyncIterator
from langchain_groq import ChatGroq
from app.core.config import settings
from app.rag.retriever import get_retriever

SYSTEM_PROMPT = (
    "You are a helpful assistant for this platform. Answer using the "
    "provided context when relevant. If the context doesn't contain the "
    "answer, say so plainly instead of guessing."
)


async def stream_rag_answer(question: str) -> AsyncIterator[str]:
    retriever = get_retriever()
    docs = await retriever.ainvoke(question)
    context = "\n\n".join(d.page_content for d in docs)

    llm = ChatGroq(model=settings.llm_model, api_key=settings.groq_api_key, streaming=True)
    prompt = f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"

    async for chunk in llm.astream(prompt):
        if chunk.content:
            yield chunk.content