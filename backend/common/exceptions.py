from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler to return a consistent error shape:
    { "error": { "code": "...", "message": "...", "detail": {...} } }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "error": {
                "code": _get_error_code(response.status_code),
                "message": _get_message(response.data),
                "detail": response.data,
            }
        }
        response.data = error_payload

    return response


def _get_error_code(status_code: int) -> str:
    codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        422: "unprocessable_entity",
        429: "too_many_requests",
        500: "server_error",
    }
    return codes.get(status_code, "error")


def _get_message(data) -> str:
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        # Return first field error message
        for key, val in data.items():
            if isinstance(val, list) and val:
                return f"{key}: {val[0]}"
    if isinstance(data, list) and data:
        return str(data[0])
    return str(data)
