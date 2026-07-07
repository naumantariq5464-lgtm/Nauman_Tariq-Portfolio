from .auth import router as auth_router
from .categories import router as categories_router
from .projects import router as projects_router
from .contact import router as contact_router

__all__ = ["auth_router", "categories_router", "projects_router", "contact_router"]
