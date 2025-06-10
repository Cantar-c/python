def json_response(code, msg, data):
    return {
        "code": code,
        "msg": msg,
        "data": data
    }


def success_response(data=None):
    return json_response(200, "success", data)


def error_response(msg="error", code=500, data=None):
    return json_response(code, msg, data)
