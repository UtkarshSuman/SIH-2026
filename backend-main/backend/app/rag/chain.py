"""
app/rag/chain.py — The full RAG pipeline using Google Gemini 1.5 Flash.

Flow:
  1. Retrieve top-K relevant chunks from ChromaDB (vector similarity search)
  2. Build messages: system prompt (with doc context) + user question
  3. Non-streaming call with tools bound → LLM decides if live DB data needed
  4. If tool calls → execute real DB queries → append results to messages
  5. Stream the final answer token-by-token

Why Gemini 1.5 Flash:
  - Free tier: 15 requests/min, 1 million tokens/day
  - Full tool-calling support (function calling API)
  - No credit card required for Google AI Studio key

INSTALLATION: pip install langchain-google-genai google-generativeai
"""
from __future__ import annotations

from collections.abc import AsyncIterator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage, AIMessage

from app.core.config import settings
from app.rag.retriever import get_retriever
from app.rag.tools import AVAILABLE_TOOLS

# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a helpful disaster-management assistant for the Rescue Arc platform — a GIS-based hazard monitoring and relocation planning system for India.

You help NDRF officers, disaster management teams, and policymakers answer questions about:
- Hazard zone classifications (Red/Yellow/Green) for specific villages/habitations
- Real-time risk data for regions like Joshimath, Wayanad, Darjeeling, etc.
- Relocation plans for high-risk communities
- Technical explanations (slope class, AHP weighting, discharge rates, etc.)
- System capabilities and data sources

RULES:
1. For questions about CURRENT risk levels or live zone data for specific places → use the available database tools. Never guess current status from documents.
2. For conceptual questions (how does AHP work? what is slope class?) → use the document context provided.
3. If neither documents nor tools have the answer → say so plainly.
4. Be concise, factual, and use bullet points for lists of zones/habitations.
5. Always cite whether data comes from documents or live database.
"""
# ──────────────────────────────────────────────────────────────────────────────


def _get_llm(streaming: bool) -> ChatGoogleGenerativeAI:
    """Build a Gemini 1.5 Flash LLM instance."""
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        streaming=streaming,
        temperature=0.1,       # low temp = factual, deterministic answers
        max_tokens=2048,
    )


async def stream_rag_answer(question: str) -> AsyncIterator[str]:
    """
    Full RAG pipeline: retrieve → (optionally) tool-call → stream answer.

    Yields string tokens as they arrive from Gemini.
    """
    # ── Step 1: Retrieve relevant document chunks ──────────────────────────
    retriever = get_retriever()
    docs = await retriever.ainvoke(question)
    context = "\n\n---\n\n".join(d.page_content for d in docs) if docs else "(no matching documents found)"

    # ── Step 2: Build initial messages ────────────────────────────────────
    messages: list = [
        SystemMessage(content=f"{SYSTEM_PROMPT}\n\nDocument context:\n{context}"),
        HumanMessage(content=question),
    ]

    # Check if Gemini key is valid
    has_valid_gemini = bool(
        settings.gemini_api_key
        and settings.gemini_api_key != "your-gemini-api-key-here"
        and not settings.gemini_api_key.startswith("AIzaSyFake")
    )

    if not has_valid_gemini:
        # Fallback without calling Google API: execute tools directly & stream answer
        yield f"⚠️ *Note: GEMINI_API_KEY is not configured in backend .env. Operating in autonomous local RAG & DB Tool mode.*\n\n"
        # Check if question asks about zones or habitations
        tool_results = []
        for t in AVAILABLE_TOOLS:
            try:
                # If specific tool matches question keywords
                if t.name == "get_high_risk_habitations" and any(k in question.lower() for k in ["red", "high risk", "evacuate", "danger"]):
                    tool_results.append(t.invoke({}))
                elif t.name == "get_all_active_regions" and any(k in question.lower() for k in ["region", "cover", "monitored", "where"]):
                    tool_results.append(t.invoke({}))
                elif t.name == "get_zone_status":
                    # Check for place names
                    for place in ["joshimath", "wayanad", "darjeeling", "kalpetta", "chooralmala", "patna"]:
                        if place in question.lower():
                            tool_results.append(t.invoke({"zone_name": place}))
            except Exception as e:
                tool_results.append(f"Tool error: {e}")

        if tool_results:
            yield "### 📊 Live Database Query Results:\n"
            for r in tool_results:
                yield f"{r}\n\n"

        if docs:
            yield "### 📚 Retrieved Document Context:\n"
            for d in docs[:2]:
                yield f"• {d.page_content[:300]}...\n\n"

        if not tool_results and not docs:
            yield f"Rescue Arc RAG Assistant: I received your question: '{question}'. Please configure a valid GEMINI_API_KEY in .env for full conversational reasoning."
        return

    # ── Step 3: Non-streaming call with tools — LLM decides if DB needed ──
    tool_llm = _get_llm(streaming=False).bind_tools(AVAILABLE_TOOLS)
    first_response: AIMessage = await tool_llm.ainvoke(messages)

    # ── Step 4: Execute any tool calls the LLM requested ──────────────────
    if first_response.tool_calls:
        messages.append(first_response)
        tool_map = {t.name: t for t in AVAILABLE_TOOLS}
        for call in first_response.tool_calls:
            tool_fn = tool_map.get(call["name"])
            if tool_fn:
                try:
                    result = tool_fn.invoke(call["args"])
                except Exception as exc:
                    result = f"Tool execution error: {exc}"
            else:
                result = f"Tool '{call['name']}' not found."
            messages.append(
                ToolMessage(content=str(result), tool_call_id=call["id"])
            )

    # ── Step 5: Stream the final answer ───────────────────────────────────
    final_llm = _get_llm(streaming=True)
    async for chunk in final_llm.astream(messages):
        if chunk.content:
            yield chunk.content