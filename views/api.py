import os
import subprocess
import tempfile
import uuid
from functools import wraps
from urllib.parse import unquote

from flask import Blueprint, request, session

from utils.bucket import s3, S3_BUCKET, S3_URL
from utils.extensions import db, time_ago, check_token
from utils.ffmpeg import try_encode_with_gpu, encode_fallback
from utils.models import Video, User
from utils.response import error_response, success_response

api = Blueprint('api', __name__)


@api.route('/upload', methods=['POST'])
@check_token
def upload():
    user_id = session.get('user', {}).get('id')

    if 'video' not in request.files:
        return error_response('没有文件上传', 400)

    file = request.files['video']
    filename = unquote(file.filename)

    if filename == '':
        return error_response('没有选择文件', 400)

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ['.mp4', '.avi', '.mov', '.mkv']:
        return error_response('不支持的文件格式', 400)

    id = uuid.uuid4()
    video_key = f'videos/{id}{ext}'
    image_key = f'videos_img/{id}.png'

    try:
        # 保存原始视频到临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as orig_video:
            orig_video_path = orig_video.name
            file.save(orig_video_path)

        # 准备转码输出路径
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as trans_video:
            trans_video_path = trans_video.name

        if not try_encode_with_gpu(orig_video_path, trans_video_path):
            encode_fallback(orig_video_path, trans_video_path)

        # 生成缩略图
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_img:
            temp_img_path = temp_img.name

        subprocess.run([
            'ffmpeg', '-i', trans_video_path,
            '-ss', '00:00:01.000', '-vframes', '1', '-y',
            temp_img_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        # 获取时长
        result = subprocess.run([
            'ffprobe', '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            trans_video_path
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        duration = round(float(result.stdout.strip()), 2)

        # 上传到 S3
        with open(trans_video_path, 'rb') as f:
            s3.put_object(Bucket=S3_BUCKET, Key=video_key, Body=f)

        with open(temp_img_path, 'rb') as f:
            s3.put_object(Bucket=S3_BUCKET, Key=image_key, Body=f)

        # 删除临时文件
        os.remove(orig_video_path)
        os.remove(trans_video_path)
        os.remove(temp_img_path)

        # 保存记录到数据库
        video = Video(
            title=filename.replace(ext, ''),
            video_path=f'{S3_URL}/{video_key}',
            thumbnail=f'{S3_URL}/{image_key}',
            duration=duration,
            user_id=user_id
        )
        db.session.add(video)
        db.session.commit()

        return success_response('文件上传成功')
    except Exception as e:
        return error_response(f'文件上传失败: {str(e)}', 500)


# 获取用户视频
@api.route('/user_videos', methods=['GET'])
@check_token
def user_videos():
    user_id = session.get('user', {}).get('id')
    videos = Video.query.filter_by(user_id=user_id).all()
    if not videos:
        return success_response([])
    video_list = [{
        'id': video.id,
        'title': video.title,
        'video_path': video.video_path,
        'thumbnail': video.thumbnail,
        'duration': video.duration,
        'video_statis': time_ago(video.created_at),
        'created_at': video.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'video_author_info': video.uploader.username if video.uploader else '未知作者',
        'uper_img': video.uploader.avatar if video.uploader else '/static/img/default-avatar.png'
    } for video in videos]
    return success_response(video_list)


# 获取用户信息
@api.route('/user_info', methods=['GET'])
@check_token
def user_info():
    user = session.get('user').get('id')
    if user is None:
        return error_response('未登录或登录已过期', 401)
    user_infos = User.query.filter_by(id=user).first()
    return success_response({
        'id': user_infos.id,
        'username': user_infos.username,
        'avatar': user_infos.avatar
    })


# 用户登录
@api.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    if not username or not password:
        return error_response('用户名或密码不能为空', 400)
    user = User.query.filter_by(username=username, password=password).first()
    if not user:
        return error_response('用户名或密码错误', 401)
    session['user'] = {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar or '/static/img/default-avatar.png'
    }
    return success_response(session['user'])


# 用户登出
@api.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return success_response('登出成功')


# 用户注册
@api.route('/register', methods=['POST'])
def register():
    username = request.form.get('username')
    password = request.form.get('password')
    if not username or not password:
        return error_response('用户名或密码不能为空', 400)
    if User.query.filter_by(username=username).first():
        return error_response('用户名已存在', 400)
    new_user = User(username=username, password=password, avatar='/static/img/default-avatar.png')
    db.session.add(new_user)
    db.session.commit()
    session['user'] = {
        'id': new_user.id,
        'username': new_user.username,
        'avatar': '/static/img/default-avatar.png'
    }
    return success_response(session['user'])


# 获取视频列表
@api.route('/videos', methods=['GET'])
def videos():
    search = request.args.get('search', '').strip()
    if search:
        videos = Video.query.filter(Video.title.contains(search)).all()
    else:
        videos = Video.query.all()
    if not videos:
        return success_response([])

    video_list = [{
        'id': video.id,
        'title': video.title,
        'video_path': video.video_path,
        'thumbnail': video.thumbnail,
        'duration': video.duration,
        'video_statis': time_ago(video.created_at),
        'created_at': video.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'video_author_info': video.uploader.username if video.uploader else '未知作者',
        'uper_img': video.uploader.avatar if video.uploader else '/static/img/default-avatar.png'
    } for video in videos]

    return success_response(video_list)


# ------------------- User APIs -------------------
@api.route('/user', methods=['GET'])
def list_users():
    users = User.query.all()
    return success_response([{
        'id': u.id,
        'username': u.username,
        'avatar': u.avatar
    } for u in users])


@api.route('/user', methods=['POST'])
def create_user():
    data = request.json
    user = User(username=data['username'], password=data['password'], avatar=data.get('avatar'))
    db.session.add(user)
    db.session.commit()
    return success_response()


@api.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.avatar = data.get('avatar', user.avatar)
    db.session.commit()
    return success_response()


@api.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    videos = Video.query.filter_by(user_id=user_id).all()
    for video in videos:
        db.session.delete(video)
        db.session.commit()
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return success_response()


# ------------------- Video APIs -------------------
@api.route('/video', methods=['GET'])
def list_videos():
    videos = Video.query.all()
    return success_response([{
        'id': v.id,
        'title': v.title,
        'video_path': v.video_path,
        'thumbnail': v.thumbnail,
        'duration': v.duration,
        'created_at': v.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'user_id': v.user_id
    } for v in videos])


@api.route('/video', methods=['POST'])
def create_video():
    data = request.json
    video = Video(
        title=data['title'],
        video_path=data['video_path'],
        thumbnail=data.get('thumbnail'),
        duration=data.get('duration'),
        user_id=data['user_id']
    )
    db.session.add(video)
    db.session.commit()
    return success_response()


@api.route('/video/<int:video_id>', methods=['PUT'])
def update_video(video_id):
    video = Video.query.get_or_404(video_id)
    data = request.json
    video.title = data.get('title', video.title)
    video.thumbnail = data.get('thumbnail', video.thumbnail)
    video.duration = data.get('duration', video.duration)
    db.session.commit()
    return success_response()


@api.route('/video/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    video = Video.query.get_or_404(video_id)
    db.session.delete(video)
    db.session.commit()
    return success_response()
