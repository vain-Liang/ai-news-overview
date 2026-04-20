from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status  # noqa: TC002
from fastapi_users import exceptions
from fastapi_users.router.common import ErrorCode, ErrorModel
from fastapi_users.router.reset import RESET_PASSWORD_RESPONSES
from pydantic import EmailStr  # noqa: TC002

from app.auth.backend import bearer_backend, cookie_backend
from app.auth.dependencies import get_user_manager
from app.auth.fastapi_users import fastapi_users
from app.auth.manager import UserManager  # noqa: TC001
from app.schemas.user import UserCreate, UserRead
from app.services.rate_limit import get_email_route_dependencies

auth_router = APIRouter(tags=["auth"])
email_route_dependencies = get_email_route_dependencies()
email_body = Body(..., embed=True)
token_embedded_body = Body(..., embed=True)
token_body = Body(...)
password_body = Body(...)

auth_router.include_router(
    fastapi_users.get_auth_router(cookie_backend),
    prefix="/auth/cookie",
)

auth_router.include_router(
    fastapi_users.get_auth_router(bearer_backend),
    prefix="/auth/jwt",
)

auth_router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
)


@auth_router.post(
    "/auth/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    name="reset:forgot_password",
    dependencies=email_route_dependencies,
)
async def forgot_password(
    request: Request,
    email: Annotated[EmailStr, email_body],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
):
    try:
        user = await user_manager.get_by_email(email)
    except exceptions.UserNotExists:
        return None

    try:
        await user_manager.forgot_password(user, request)
    except exceptions.UserInactive:
        pass

    return None


@auth_router.post(
    "/auth/reset-password",
    name="reset:reset_password",
    responses=RESET_PASSWORD_RESPONSES,
)
async def reset_password(
    request: Request,
    token: Annotated[str, token_body],
    password: Annotated[str, password_body],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
):
    try:
        await user_manager.reset_password(token, password, request)
    except (
        exceptions.InvalidResetPasswordToken,
        exceptions.UserNotExists,
        exceptions.UserInactive,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.RESET_PASSWORD_BAD_TOKEN,
        ) from None
    except exceptions.InvalidPasswordException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": ErrorCode.RESET_PASSWORD_INVALID_PASSWORD,
                "reason": exc.reason,
            },
        ) from None

    return None


@auth_router.post(
    "/auth/request-verify-token",
    status_code=status.HTTP_202_ACCEPTED,
    name="verify:request-token",
    dependencies=email_route_dependencies,
)
async def request_verify_token(
    request: Request,
    email: Annotated[EmailStr, email_body],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
):
    try:
        user = await user_manager.get_by_email(email)
        await user_manager.request_verify(user, request)
    except (
        exceptions.UserNotExists,
        exceptions.UserInactive,
        exceptions.UserAlreadyVerified,
    ):
        pass

    return None


@auth_router.post(
    "/auth/verify",
    response_model=UserRead,
    name="verify:verify",
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "model": ErrorModel,
            "content": {
                "application/json": {
                    "examples": {
                        ErrorCode.VERIFY_USER_BAD_TOKEN: {
                            "summary": "Bad token or user mismatch.",
                            "value": {"detail": ErrorCode.VERIFY_USER_BAD_TOKEN},
                        },
                        ErrorCode.VERIFY_USER_ALREADY_VERIFIED: {
                            "summary": "The user is already verified.",
                            "value": {"detail": ErrorCode.VERIFY_USER_ALREADY_VERIFIED},
                        },
                    }
                }
            },
        }
    },
)
async def verify_account(
    request: Request,
    token: Annotated[str, token_embedded_body],
    user_manager: Annotated[UserManager, Depends(get_user_manager)],
):
    try:
        user = await user_manager.verify(token, request)
        return UserRead.model_validate(user)
    except (exceptions.InvalidVerifyToken, exceptions.UserNotExists):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.VERIFY_USER_BAD_TOKEN,
        ) from None
    except exceptions.UserAlreadyVerified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorCode.VERIFY_USER_ALREADY_VERIFIED,
        ) from None
