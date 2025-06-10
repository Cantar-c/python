from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

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