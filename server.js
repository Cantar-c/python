const express = require('express');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const moment = require('moment');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

// 创建数据库文件并打开
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error("数据库连接失败: " + err.message);
    } else {
        console.log("数据库连接成功");
    }
});

// 创建用户表
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
)`, (err) => {
    if (err) {
        console.error("表创建失败: " + err.message);
    }
});

// 创建 Express 应用
const app = express();
app.use(bodyParser.json());

// 定义视频文件夹路径
const videoFolder = path.join(__dirname, 'videos');
const imageFolder = path.join(__dirname, 'video_images'); // 存储第一帧图片的文件夹
const uperImageFolder = path.join(__dirname, 'uper_images'); // 存储作者头像的文件夹

// 确保图片文件夹存在
if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder);
}

// 工具函数：获取文件创建时间
function getFileCreationTime(filePath) {
    const stats = fs.statSync(filePath);
    const createdAt = moment(stats.birthtime);
    const now = moment();
    return createdAt.from(now); // 返回类似 "1 months ago"
}

function GetRealCreateTime(filePath) {
    const stats = fs.statSync(filePath);
    return stats.birthtime;
}

// 工具函数：解析视频时长
function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);

            const duration = metadata.format.duration; // 时长（秒）

            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = Math.floor(duration % 60);

            // 如果没有小时部分，则忽略小时位
            const formattedHours = hours > 0 ? hours.toString().padStart(2, '0') : '';
            const formattedMinutes = minutes.toString().padStart(2, '0');
            const formattedSeconds = seconds.toString().padStart(2, '0');

            // 返回时长格式
            const time = formattedHours ? `${formattedHours}:${formattedMinutes}:${formattedSeconds}` : `${formattedMinutes}:${formattedSeconds}`;
            resolve(time);
        });
    });
}

// 获取视频的第一帧
function getVideoThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: [0], // 提取第一帧
                filename: path.basename(thumbnailPath), // 保存的图片文件名
                folder: imageFolder // 保存的目录
            })
            .on('end', () => resolve(thumbnailPath))
            .on('error', err => reject(err));
    });
}

// 获取视频文件路径
app.get('/videos', async (req, res) => {
    fs.readdir(videoFolder, async (err, files) => {
        if (err) {
            console.error('读取文件夹出错:', err);
            return res.json([]);
        }

        const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv'];

        const results = [];
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();

            // 检查是否为视频文件
            if (!videoExtensions.includes(ext)) continue;

            const videoPath = path.join(videoFolder, file);
            const baseName = path.basename(file, ext);

            // 提取作者名（作者名在下划线前）
            const authorName = baseName.split('_')[0] || '未知作者';

            // 提取视频名称（下划线后面的部分）
            const videoName = baseName.includes('_') ? baseName.split('_')[1] : '未知视频名称';

            const thumbnailPath = path.join(imageFolder, `${baseName}.png`);
            const videoCreationTime = getFileCreationTime(videoPath);

            const realCreateTime = GetRealCreateTime(videoPath);

            try {
                const videoTime = await getVideoDuration(videoPath);

                // 如果缩略图不存在，则生成
                if (!fs.existsSync(thumbnailPath)) {
                    await getVideoThumbnail(videoPath, thumbnailPath);
                }

                results.push({
                    video_path: `/video/${file}`,
                    video_name: videoName,
                    image: `/video_img/${baseName}.png`,
                    video_time: videoTime,
                    uper_img: `/uper_img/${authorName}.png`,
                    video_author_info: authorName,
                    video_statis: videoCreationTime,
                    real_create_time: realCreateTime
                });
            } catch (error) {
                console.error('处理视频时出错:', error);
            }
        }

        // 按照 video_statis（创建时间）进行排序，新的在前面，旧的在后面
        results.sort((a, b) => new Date(b.real_create_time) - new Date(a.real_create_time));

        res.json(results);
    });
});

// 用户注册路由
app.post('/register', (req, res) => {
    const {username, password, email} = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({error: '用户名、密码和邮箱不能为空'});
    }

    const stmt = db.prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
    stmt.run(username, password, email, function (err) {
        if (err) {
            return res.status(500).json({error: '插入用户数据失败'});
        }
        res.status(201).json({message: '用户注册成功', userId: this.lastID});
    });
});

// 用户登录路由
app.post('/login', (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({error: '用户名和密码不能为空'});
    }

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({error: '查询用户数据失败'});
        }
        if (row) {
            res.status(200).json({message: '登录成功', user: row});
        } else {
            res.status(400).json({error: '用户名或密码错误'});
        }
    });
});

// 静态文件服务（提供视频和图片访问）
app.use('/video', express.static(videoFolder));
app.use('/video_img', express.static(imageFolder));
app.use('/uper_img', express.static(uperImageFolder));

// 静态文件服务（提供前端页面访问）
app.use(express.static(path.join(__dirname, 'public')));

app.listen(8888, () => {
    console.log('Server is running on port http://127.0.0.1:8888');
});