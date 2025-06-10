from datetime import datetime

from utils.extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)  # 建议加密存储
    avatar = db.Column(db.String(255), nullable=True)  # 用户头像 URL

    # 反向引用：user.videos 可获取该用户上传的所有视频
    videos = db.relationship('Video', backref='uploader', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'


class Video(db.Model):
    __tablename__ = 'videos'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    video_path = db.Column(db.String(255), nullable=False)  # 视频文件路径
    thumbnail = db.Column(db.String(255), nullable=True)  # 缩略图路径
    duration = db.Column(db.String(10), nullable=True)  # 视频时长，格式如 "02:46"
    created_at = db.Column(db.DateTime, default=datetime.now)  # 上传时间
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # 上传者 ID

    def __repr__(self):
        return f'<Video {self.title}>'
