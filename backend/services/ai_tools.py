"""
services/ai_tools.py — Read-only DB tools for the AI Agent.
The AI can ONLY call these functions — no write access, no raw SQL.
5 tools: get_latest_projects, get_project_by_name,
         get_projects_by_category, get_all_skills, get_services
"""

from sqlalchemy.orm import Session
from models.project import Project
from models.category import Category
from typing import Optional
import json


# ── Tool Schemas (sent to Groq for tool calling) ──────────────
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_latest_projects",
            "description": "Get the latest projects from Nauman's portfolio. Use this when the user asks about recent work, latest projects, or what Nauman has built.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of projects to return (default 5, max 10)",
                        "default": 5,
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_project_by_name",
            "description": "Search for a specific project by name or keyword. Use when the user asks about a specific project.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Project name or keyword to search for",
                    }
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_projects_by_category",
            "description": "Get all projects in a specific category. Use when user asks about a type of project like 'AI projects', 'web projects', 'mobile apps' etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Category name or slug (e.g. 'ai-agents', 'website', 'machine-learning', 'mobile-apps', 'python', 'ai-automation')",
                    }
                },
                "required": ["category"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_skills",
            "description": "Get all categories/types of projects Nauman has worked on. Use when user asks about skills, technologies, or expertise areas.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_services",
            "description": "Get the list of services Nauman offers. Use when user asks what services are available, what Nauman can build, or hiring/freelance questions.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]


# ── Tool Executor ─────────────────────────────────────────────
def execute_tool(tool_name: str, tool_args: dict, db: Session) -> str:
    """Execute a tool and return result as JSON string."""
    try:
        if tool_name == "get_latest_projects":
            return _get_latest_projects(db, tool_args.get("limit", 5))
        elif tool_name == "get_project_by_name":
            return _get_project_by_name(db, tool_args.get("name", ""))
        elif tool_name == "get_projects_by_category":
            return _get_projects_by_category(db, tool_args.get("category", ""))
        elif tool_name == "get_all_skills":
            return _get_all_skills(db)
        elif tool_name == "get_services":
            return _get_services()
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
    except Exception as e:
        return json.dumps({"error": f"Tool execution failed: {str(e)}"})


# ── Individual Tool Functions ─────────────────────────────────
def _get_latest_projects(db: Session, limit: int = 5) -> str:
    limit = min(int(limit), 10)
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .limit(limit)
        .all()
    )
    if not projects:
        return json.dumps({"message": "No projects found yet.", "projects": []})

    result = []
    for p in projects:
        result.append({
            "title":       p.title,
            "description": p.description[:200] + "..." if len(p.description) > 200 else p.description,
            "category":    p.category.name if p.category else "General",
            "skills":      p.skills_tags or "",
            "github":      p.github_link or "",
            "demo":        p.demo_link or "",
            "featured":    p.is_featured,
        })
    return json.dumps({"projects": result, "count": len(result)})


def _get_project_by_name(db: Session, name: str) -> str:
    if not name:
        return json.dumps({"error": "No project name provided."})

    # Search by title (case-insensitive)
    projects = db.query(Project).all()
    name_lower = name.lower()
    matches = [p for p in projects if name_lower in p.title.lower() or
               (p.skills_tags and name_lower in p.skills_tags.lower()) or
               name_lower in p.description.lower()]

    if not matches:
        return json.dumps({"message": f"No project found matching '{name}'."})

    p = matches[0]
    return json.dumps({
        "title":       p.title,
        "description": p.description,
        "category":    p.category.name if p.category else "General",
        "skills":      p.skills_tags or "",
        "github":      p.github_link or "",
        "linkedin":    p.linkedin_link or "",
        "demo":        p.demo_link or "",
        "featured":    p.is_featured,
    })


def _get_projects_by_category(db: Session, category: str) -> str:
    if not category:
        return json.dumps({"error": "No category provided."})

    cat_lower = category.lower()
    categories = db.query(Category).all()

    # Find matching category
    matched_cat = None
    for c in categories:
        if cat_lower in c.name.lower() or cat_lower in c.slug.lower():
            matched_cat = c
            break

    if not matched_cat:
        all_cats = [c.name for c in categories]
        return json.dumps({
            "message": f"No category found matching '{category}'.",
            "available_categories": all_cats,
        })

    projects = db.query(Project).filter(
        Project.category_id == matched_cat.id
    ).order_by(Project.display_order.asc()).all()

    if not projects:
        return json.dumps({
            "message": f"No projects in '{matched_cat.name}' category yet.",
            "category": matched_cat.name,
        })

    result = [{
        "title":    p.title,
        "skills":   p.skills_tags or "",
        "github":   p.github_link or "",
        "demo":     p.demo_link or "",
        "featured": p.is_featured,
    } for p in projects]

    return json.dumps({
        "category": matched_cat.name,
        "projects": result,
        "count":    len(result),
    })


def _get_all_skills(db: Session) -> str:
    categories = db.query(Category).all()
    projects   = db.query(Project).all()

    # Collect all unique skill tags from projects
    all_tags = set()
    for p in projects:
        if p.skills_tags:
            for tag in p.skills_tags.split(","):
                all_tags.add(tag.strip())

    return json.dumps({
        "project_categories": [c.name for c in categories],
        "technologies_used":  sorted(list(all_tags)),
        "total_projects":     len(projects),
    })


def _get_services() -> str:
    services = [
        {
            "name":        "Web Development",
            "description": "Full-stack web applications built with modern frameworks — fast, responsive, and production-ready.",
            "technologies": ["HTML", "CSS", "JavaScript", "React", "FastAPI", "Node.js"],
        },
        {
            "name":        "AI Agents",
            "description": "Intelligent AI agents with tool-calling, RAG, memory, and guardrails — powered by the latest LLMs.",
            "technologies": ["LangChain", "Groq", "OpenAI", "RAG", "Vector DB"],
        },
        {
            "name":        "AI Automation",
            "description": "Workflow automation powered by AI — save time, reduce errors, and scale operations effortlessly.",
            "technologies": ["n8n", "Python", "FastAPI", "LLMs"],
        },
        {
            "name":        "Mobile Apps",
            "description": "Cross-platform mobile applications with React Native — iOS & Android from a single codebase.",
            "technologies": ["React Native", "Expo", "Firebase"],
        },
        {
            "name":        "Machine Learning",
            "description": "End-to-end ML pipelines — data preprocessing, model training, deployment, and monitoring.",
            "technologies": ["Python", "scikit-learn", "TensorFlow", "FastAPI"],
        },
        {
            "name":        "API Development",
            "description": "Secure, scalable REST APIs with FastAPI — JWT auth, rate limiting, and clean documentation.",
            "technologies": ["FastAPI", "PostgreSQL", "SQLAlchemy", "JWT"],
        },
    ]
    return json.dumps({"services": services, "count": len(services)})
