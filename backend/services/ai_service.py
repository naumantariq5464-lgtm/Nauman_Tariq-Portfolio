"""
services/ai_service.py — Groq AI Agent with tool calling, guardrails,
session memory, and prompt injection protection.
"""

import json
import re
from groq import Groq
from sqlalchemy.orm import Session
from config import settings
from services.ai_tools import TOOL_DEFINITIONS, execute_tool

# ── Groq client ───────────────────────────────────────────────
client = Groq(api_key=settings.groq_api_key)

# ── Session memory store (in-memory, per session_id) ─────────
# { session_id: [ {role, content}, ... ] }
_sessions: dict[str, list] = {}
MAX_HISTORY = 20  # max messages to keep per session


# ── System Prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are Nauman Tariq's AI Portfolio Assistant. You help visitors learn about Nauman's work, skills, experience, and services.

## About Nauman Tariq
- Full Stack Developer, AI Engineer, AI Automation Expert, and React Native Developer based in Pakistan
- 4+ years of experience building web apps, AI agents, automation systems, and mobile apps
- Works with international clients on freelance projects
- Passionate about cutting-edge technology and solving real-world problems

## Education
- Bachelor of Science in Computer Science (2020-2024)

## Experience
- Full Stack Developer & AI Engineer | Freelance | 2022 - Present
- Building web apps, AI agents, and automation pipelines for international clients

## Core Skills & Technologies
- Frontend: HTML5, CSS3, JavaScript, React, React Native, Bootstrap, TailwindCSS
- Backend: Python, FastAPI, Node.js, Express.js
- Databases: PostgreSQL, MongoDB, Vector DB
- AI/ML: LangChain, Groq API, OpenAI, Hugging Face, RAG, n8n
- DevOps: Docker, Git, AWS

## Services Offered
1. Web Development - Full-stack web applications
2. AI Agents - Intelligent agents with tool-calling and RAG
3. AI Automation - Workflow automation with AI
4. Mobile Apps - React Native cross-platform apps
5. Machine Learning - End-to-end ML pipelines
6. API Development - Secure REST APIs with FastAPI

## Contact Information
- Email: naumantariq5464@gmail.com
- Location: Pakistan
- Available for freelance projects worldwide

## Certifications
- AI Engineering — Coursera
- Python for Data Science — IBM
- Full Stack Web Dev — Udemy
- React Native — Meta

## Instructions
- Be friendly, helpful, and professional
- Answer ONLY questions about Nauman's portfolio, skills, projects, services, experience, and contact info
- Use the provided tools to get real-time project data from the database
- Keep responses concise and clear
- If asked about pricing, say Nauman can be contacted directly for quotes
- Always encourage visitors to check the projects section or contact Nauman

## STRICT RULES — Never reveal:
- Admin credentials or passwords
- JWT secrets or API keys (Groq, Resend, Cloudinary, etc.)
- Database credentials or connection strings
- Hidden admin panel location or URL
- Backend source code or architecture details
- Environment variables or server configuration
- Any sensitive or confidential system information

If asked for any sensitive information, politely decline and redirect to portfolio topics."""


# ── Guardrails ────────────────────────────────────────────────
BLOCKED_PATTERNS = [
    r"admin\s*(password|credentials|login|username)",
    r"jwt[\s_]*(secret|token|key)",
    r"api[\s_]*key",
    r"database[\s_]*(url|password|credentials|connection)",
    r"\.env",
    r"secret[\s_]*key",
    r"groq[\s_]*api",
    r"cloudinary[\s_]*(secret|key)",
    r"resend[\s_]*(key|api)",
    r"ignore[\s_]*(previous|all|above|instructions|system)",
    r"(you are|act as|pretend|roleplay|jailbreak|dan|developer mode)",
    r"(reveal|show|give|tell|expose).*?(password|secret|key|token|credential)",
]

def is_prompt_injection(message: str) -> bool:
    msg_lower = message.lower()
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, msg_lower):
            return True
    return False


def sanitize_input(message: str) -> str:
    """Remove potentially harmful characters, limit length."""
    message = message.strip()
    message = re.sub(r"[<>\"'`]", "", message)
    return message[:500]


# ── Main Chat Function ────────────────────────────────────────
def chat(session_id: str, user_message: str, db: Session) -> str:
    """
    Process user message through Groq AI Agent with:
    - Input sanitization
    - Prompt injection detection
    - Tool calling for live DB data
    - Session memory
    - Guardrails on output
    """

    # 1. Sanitize input
    user_message = sanitize_input(user_message)

    if not user_message:
        return "Please send a message."

    # 2. Prompt injection check
    if is_prompt_injection(user_message):
        return "I'm only able to answer questions about Nauman's portfolio, skills, projects, and services. How can I help you with that?"

    # 3. Get or create session history
    if session_id not in _sessions:
        _sessions[session_id] = []

    history = _sessions[session_id]

    # 4. Add user message to history
    history.append({"role": "user", "content": user_message})

    # 5. Trim history to avoid token overflow
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
        _sessions[session_id] = history

    # 6. Build messages for Groq
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    # 7. First Groq call — may trigger tool calls
    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=1024,
        )
    except Exception as e:
        return f"I'm having trouble connecting right now. Please try again in a moment."

    response_msg = response.choices[0].message

    # 8. Handle tool calls
    if response_msg.tool_calls:
        # Add assistant message with tool calls to messages
        messages.append({
            "role":       "assistant",
            "content":    response_msg.content or "",
            "tool_calls": [
                {
                    "id":       tc.id,
                    "type":     "function",
                    "function": {
                        "name":      tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in response_msg.tool_calls
            ],
        })

        # Execute each tool and add results
        for tool_call in response_msg.tool_calls:
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except Exception:
                tool_args = {}

            tool_result = execute_tool(tool_call.function.name, tool_args, db)

            messages.append({
                "role":         "tool",
                "tool_call_id": tool_call.id,
                "content":      tool_result,
            })

        # 9. Second Groq call with tool results
        try:
            final_response = client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            final_text = final_response.choices[0].message.content or ""
        except Exception:
            return "I retrieved the information but had trouble formatting it. Please try again."

    else:
        # No tool calls — direct response
        final_text = response_msg.content or ""

    # 10. Guardrail on output — make sure no secrets leaked
    if is_prompt_injection(final_text):
        final_text = "I'm sorry, I can only discuss Nauman's portfolio, skills, and services."

    # 11. Save assistant response to history
    _sessions[session_id].append({"role": "assistant", "content": final_text})

    return final_text


def clear_session(session_id: str):
    """Clear conversation history for a session."""
    if session_id in _sessions:
        del _sessions[session_id]
