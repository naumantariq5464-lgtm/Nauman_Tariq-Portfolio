"""
services/ai_service.py — Groq AI Agent
- Portfolio-only scope (strict guardrails)
- Tool calling for live DB data
- Session memory
- Friendly responses for greetings/thanks
- Blocks definitions, general knowledge, off-topic
"""

import json
import re
from groq import Groq
from sqlalchemy.orm import Session
from config import settings
from services.ai_tools import TOOL_DEFINITIONS, execute_tool

# ── Groq client ───────────────────────────────────────────────
client = Groq(api_key=settings.groq_api_key)

# ── Session memory ────────────────────────────────────────────
_sessions: dict[str, list] = {}
MAX_HISTORY = 20


# ── System Prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are the AI assistant on Nauman Tariq's personal portfolio website. Your ONLY job is to help visitors learn about Nauman — his projects, skills, services, experience, and how to contact or hire him.

## About Nauman Tariq
- Full Stack Developer, AI Engineer, AI Automation Expert, React Native Developer — based in Pakistan
- 4+ years experience building web apps, AI agents, automation systems, mobile apps
- Works with international clients on freelance projects

## Education
- BS Computer Science (2020–2024)

## Experience
- Full Stack Developer & AI Engineer | Freelance | 2022–Present

## Skills & Technologies
- Frontend: HTML5, CSS3, JavaScript, React, React Native, Bootstrap, TailwindCSS
- Backend: Python, FastAPI, Node.js, Express.js
- Databases: PostgreSQL, MongoDB, Vector DB
- AI/ML: LangChain, Groq, OpenAI, Hugging Face, RAG, n8n
- DevOps: Docker, Git, AWS

## Services
1. Web Development
2. AI Agents (tool-calling, RAG, memory)
3. AI Automation (n8n, Python)
4. Mobile Apps (React Native)
5. Machine Learning
6. API Development (FastAPI)

## Contact
- Email: naumantariq5464@gmail.com
- Location: Pakistan
- Available for freelance worldwide

## Certifications
- AI Engineering — Coursera
- Python for Data Science — IBM
- Full Stack Web Dev — Udemy
- React Native — Meta

---

## RESPONSE RULES — READ CAREFULLY:

### GREETINGS & SMALL TALK:
- If user says: hi, hello, hey, salam, assalam o alaikum, good morning, good evening, how are you, thanks, thank you, ok, alright, great, nice, sure, got it, understood — respond in a warm, friendly, conversational way. Introduce yourself briefly if it's the first message.

### PROJECTS — IMPORTANT:
- Always use the get_latest_projects tool to check if projects exist.
- If the tool returns empty/no projects: say "Nauman hasn't uploaded any projects yet, but stay tuned! New work is being added soon. You can contact him at naumantariq5464@gmail.com to see his work directly. 😊"
- If projects exist: describe them clearly and helpfully.

### WHAT YOU CAN ANSWER:
✅ Nauman's skills, technologies, experience, education, certifications
✅ Nauman's projects (use tools to get live data)
✅ Nauman's services and what he can build for clients
✅ How to contact or hire Nauman
✅ Pricing questions → say contact Nauman directly for a quote
✅ Greetings, thank you, small talk → respond warmly

### WHAT YOU MUST REFUSE — STRICTLY:
❌ Definitions of any technology (e.g. "What is React?", "Define Python", "Explain AI")
❌ General knowledge (history, science, math, geography, politics, religion, sports, news)
❌ Writing essays, stories, poems, jokes, code tutorials
❌ Questions about other people, companies, celebrities
❌ Any topic not about Nauman's portfolio

For anything you must refuse, respond with:
"I'm here specifically to help you learn about Nauman's work and portfolio. I can't help with that, but feel free to ask me about his projects, skills, or services! 😊"

### NEVER REVEAL:
- Admin credentials, passwords, JWT secrets
- Any API keys (Groq, Resend, Cloudinary)
- Database credentials or connection strings
- Hidden admin panel or its location
- Backend source code or architecture
- Environment variables or server details

For sensitive info requests, say:
"That's confidential information I'm not able to share. Can I help you with something about Nauman's work instead? 😊"
"""


# ── Greeting detection ────────────────────────────────────────
GREETING_PATTERNS = [
    r"^\s*(hi|hello|hey|salam|helo|hii|helo|howdy|yo)\s*[!.,]?\s*$",
    r"^\s*(good (morning|evening|afternoon|night))\s*$",
    r"^\s*(how are you|how r u|how do you do)\s*[?]?\s*$",
    r"^\s*(thanks|thank you|thankyou|thx|ty|jazakallah)\s*[!.]?\s*$",
    r"^\s*(ok|okay|alright|sure|got it|understood|noted|nice|great|cool|perfect)\s*[!.]?\s*$",
    r"^\s*(assalam|assalamu|walaikum)\w*\s*$",
]

GREETING_REPLY = """Hello! 👋 I'm Nauman's AI portfolio assistant. I'm here to help you learn about his work, skills, projects, and services.

Feel free to ask me things like:
• "What projects has Nauman built?"
• "What services does he offer?"
• "How can I contact or hire him?"

What would you like to know? 😊"""

THANKS_REPLY = "You're welcome! 😊 Feel free to ask if you have any more questions about Nauman's work or how to reach him."

OK_REPLY = "Got it! 😊 Let me know if you'd like to know more about Nauman's projects, skills, or services."


def is_greeting(message: str) -> tuple[bool, str]:
    """Returns (is_greeting, reply_type)"""
    msg = message.strip().lower()
    for pattern in GREETING_PATTERNS:
        if re.match(pattern, msg):
            if any(w in msg for w in ["thanks", "thank", "thx", "ty", "jazak"]):
                return True, "thanks"
            if any(w in msg for w in ["ok", "okay", "alright", "sure", "got it",
                                       "understood", "noted", "nice", "great", "cool", "perfect"]):
                return True, "ok"
            return True, "greeting"
    return False, ""


# ── Definition / off-topic detection ─────────────────────────
DEFINITION_PATTERNS = [
    r"\b(define|definition of|what is|what are|explain|describe|tell me about|meaning of|difference between)\b.{0,30}\b(react|python|javascript|html|css|node|api|sql|database|ai|machine learning|docker|git|bootstrap|tailwind|mongodb|postgresql|fastapi|llm|rag|vector|algorithm|framework|library|programming|software|cloud|devops|aws)\b",
    r"\b(what is|what are|define|explain)\b.{0,20}\b(a |an )?(computer|internet|website|app|mobile|web|frontend|backend|fullstack|data science|deep learning|neural network)\b",
    r"\b(how does|how do).{0,30}work\b",
    r"\b(tutorial|guide|teach me|learn|course|how to (code|program|build|create|make|develop))\b",
]

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

OFF_TOPIC_PATTERNS = [
    r"\b(weather|news|politics|religion|cricket|football|sport|recipe|cook|movie|film|song|music|celebrity|actor|actress)\b",
    r"\b(capital of|president of|history of|when was|where is|how many people)\b",
    r"\b(write (a|an|me|the)|generate).*(essay|poem|story|joke|letter)\b",
    r"\b(solve|calculate|math|algebra|equation|physics|chemistry|biology)\b",
    r"\b(translate|synonym)\b",
    r"\b(stock|crypto|bitcoin|price of|investment|forex)\b",
]

RESTRICT_REPLY = "I'm here specifically to help you learn about Nauman's work and portfolio. I can't help with that, but feel free to ask me about his projects, skills, or services! 😊"
OFF_TOPIC_REPLY = "I'm here specifically to help you learn about Nauman's work and portfolio. I can't help with that, but feel free to ask me about his projects, skills, or services! 😊"


def is_prompt_injection(msg: str) -> bool:
    m = msg.lower()
    return any(re.search(p, m) for p in BLOCKED_PATTERNS)


def is_definition_request(msg: str) -> bool:
    m = msg.lower()
    return any(re.search(p, m) for p in DEFINITION_PATTERNS)


def is_off_topic(msg: str) -> bool:
    m = msg.lower()
    return any(re.search(p, m) for p in OFF_TOPIC_PATTERNS)


def sanitize_input(message: str) -> str:
    message = message.strip()
    message = re.sub(r"[<>\"'`]", "", message)
    return message[:500]


# ── Main Chat Function ────────────────────────────────────────
def chat(session_id: str, user_message: str, db: Session) -> str:

    # 1. Sanitize
    user_message = sanitize_input(user_message)
    if not user_message:
        return "Please send a message."

    # 2. Greeting check — handle before everything else
    greet, greet_type = is_greeting(user_message)
    if greet:
        if greet_type == "thanks":
            return THANKS_REPLY
        if greet_type == "ok":
            return OK_REPLY
        return GREETING_REPLY

    # 3. Prompt injection block
    if is_prompt_injection(user_message):
        return "That's confidential information I'm not able to share. Can I help you with something about Nauman's work instead? 😊"

    # 4. Definition/tutorial request block
    if is_definition_request(user_message):
        return RESTRICT_REPLY

    # 5. Off-topic block
    if is_off_topic(user_message):
        return OFF_TOPIC_REPLY

    # 6. Session history
    if session_id not in _sessions:
        _sessions[session_id] = []
    history = _sessions[session_id]
    history.append({"role": "user", "content": user_message})
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
        _sessions[session_id] = history

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    # 7. First Groq call
    try:
        response = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=1024,
        )
    except Exception:
        return "I'm having trouble connecting right now. Please try again in a moment."

    response_msg = response.choices[0].message

    # 8. Tool calls
    if response_msg.tool_calls:
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

        try:
            final_response = client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            final_text = final_response.choices[0].message.content or ""
        except Exception:
            return "I retrieved the data but had trouble formatting it. Please try again."
    else:
        final_text = response_msg.content or ""

    # 9. Output guardrail
    if is_prompt_injection(final_text):
        final_text = "I'm sorry, I can only discuss Nauman's portfolio, skills, and services."

    # 10. Save to history
    _sessions[session_id].append({"role": "assistant", "content": final_text})
    return final_text


def clear_session(session_id: str):
    if session_id in _sessions:
        del _sessions[session_id]
