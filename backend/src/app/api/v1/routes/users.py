from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status  # noqa: TC002
from fastapi_users import exceptions

from app.auth.dependencies import get_user_manager
from app.auth.fastapi_users import current_active_user
from app.auth.manager import UserManager  # noqa: TC001
from app.models.user import User  # noqa: TC001
from app.schemas.user import UserRead, UserSelfUpdate, UserSelfUpdateResponse, UserUpdate  # noqa: TC001

users_router = APIRouter(tags=["users"])


@users_router.get("/users/me", response_model=UserRead)
async def read_current_user(user: Annotated[User, Depends(current_active_user)]):
    return UserRead.model_validate(user)


@users_router.patch("/users/me", response_model=UserSelfUpdateResponse)
async def update_current_user(
    request: Request,
    payload: UserSelfUpdate,
    user: Annotated[User, Depends(current_active_user)],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
):
    updated_user = user
    email_change_requested = False
    changes = payload.model_dump(exclude_unset=True)

    if "nickname" in changes:
        updated_user = await user_manager.update(
            UserUpdate(nickname=payload.nickname),
            updated_user,
            safe=True,
            request=request,
        )

    next_email = changes.get("email")
    if next_email and next_email != updated_user.email:
        try:
            updated_user = await user_manager.request_email_change(updated_user, next_email, request)
        except exceptions.UserAlreadyExists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists.",
            ) from None
        except exceptions.UserInactive:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive users cannot change their email.",
            ) from None
        email_change_requested = True

    return UserSelfUpdateResponse(
        user=UserRead.model_validate(updated_user),
        email_change_requested=email_change_requested,
    )
