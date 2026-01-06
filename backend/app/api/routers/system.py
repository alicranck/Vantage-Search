from fastapi import APIRouter, Depends
from app.db.models import User
from app.api.routers.auth import get_current_user

router = APIRouter()


@router.delete("/reset")
async def reset_db(current_user: User = Depends(get_current_user)):
    return {"status": "reset_disabled_for_multiuser"}
