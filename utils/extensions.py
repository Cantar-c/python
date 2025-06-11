from datetime import datetime
from functools import wraps

from flask import session, url_for, redirect
from flask_sqlalchemy import SQLAlchemy

from utils.response import error_response

db = SQLAlchemy()


def time_ago(dt):
    delta = datetime.now() - dt
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return f"{seconds}秒前"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes}分钟前"
    elif seconds < 86400:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}小时{minutes}分钟前"
    elif seconds < 2592000:
        days = seconds // 86400
        return f"{days}天前"
    else:
        return dt.strftime('%Y-%m-%d')


def check_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return error_response('未登录或登录已过期', 401)
        return f(*args, **kwargs)

    return decorated_function


def check_page(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('page.login'))
        return f(*args, **kwargs)

    return decorated_function


def check_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or session.get('user').get('id') != 0:
            return redirect(url_for('page.no_permission'))
        return f(*args, **kwargs)

    return decorated_function
