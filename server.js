const express = require('express');
const session = require('express-session');
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
db.run(`CREATE TABLE IF NOT EXISTS users
        (
            id
            INTEGER
            PRIMARY
            KEY
            AUTOINCREMENT,
            username
            TEXT
            NOT
            NULL
            UNIQUE,
            password
            TEXT
            NOT
            NULL,
            email
            TEXT
            NOT
            NULL
            UNIQUE
        )`, (err) => {
    if (err) {
        console.error("表创建失败: " + err.message);
    }
});

// 创建 Express 应用
const app = express();
app.use(bodyParser.json());
app.use(session({
    secret: 'bitMWT5zxHb6Gp6w',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

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

// 工具函数：获取文件真实创建时间
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
    const searchQuery = req.query.search ? req.query.search.trim().toLowerCase() : null;

    // fack_jsondata = [
    //     {
    //         "video_path": "/video/飞云传媒_广东白云学院飞云传媒【第十六届校园十大歌手决赛】宣传片.mp4",
    //         "video_name": "广东白云学院飞云传媒【第十六届校园十大歌手决赛】宣传片",
    //         "image": "/video_img/飞云传媒_广东白云学院飞云传媒【第十六届校园十大歌手决赛】宣传片.png",
    //         "video_time": "06:44",
    //         "uper_img": "/uper_img/飞云传媒.png",
    //         "video_author_info": "飞云传媒",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:07.161Z"
    //     },
    //     {
    //         "video_path": "/video/欧哥_美丽的大学-广东白云学院.mp4",
    //         "video_name": "美丽的大学-广东白云学院",
    //         "image": "/video_img/欧哥_美丽的大学-广东白云学院.png",
    //         "video_time": "01:38",
    //         "uper_img": "/uper_img/欧哥.png",
    //         "video_author_info": "欧哥",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:07.107Z"
    //     },
    //     {
    //         "video_path": "/video/是77鸭_军训浅放个炮.mp4",
    //         "video_name": "军训浅放个炮",
    //         "image": "/video_img/是77鸭_军训浅放个炮.png",
    //         "video_time": "00:37",
    //         "uper_img": "/uper_img/是77鸭.png",
    //         "video_author_info": "是77鸭",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:07.089Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院龙狮团_广东白云学院一直致力于广东醒狮的传承和发展.mp4",
    //         "video_name": "广东白云学院一直致力于广东醒狮的传承和发展",
    //         "image": "/video_img/广东白云学院龙狮团_广东白云学院一直致力于广东醒狮的传承和发展.png",
    //         "video_time": "00:48",
    //         "uper_img": "/uper_img/广东白云学院龙狮团.png",
    //         "video_author_info": "广东白云学院龙狮团",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:07.060Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院_时尚校园，都市学府——广东白云学院2024宣传片首发！.mp4",
    //         "video_name": "时尚校园，都市学府——广东白云学院2024宣传片首发！",
    //         "image": "/video_img/广东白云学院_时尚校园，都市学府——广东白云学院2024宣传片首发！.png",
    //         "video_time": "02:16",
    //         "uper_img": "/uper_img/广东白云学院.png",
    //         "video_author_info": "广东白云学院",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:07.003Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院_微电影《内 卷 王》.mp4",
    //         "video_name": "微电影《内 卷 王》",
    //         "image": "/video_img/广东白云学院_微电影《内 卷 王》.png",
    //         "video_time": "05:18",
    //         "uper_img": "/uper_img/广东白云学院.png",
    //         "video_author_info": "广东白云学院",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.890Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院_广东白云学院西校区食堂、超市焕然升级！.mp4",
    //         "video_name": "广东白云学院西校区食堂、超市焕然升级！",
    //         "image": "/video_img/广东白云学院_广东白云学院西校区食堂、超市焕然升级！.png",
    //         "video_time": "01:26",
    //         "uper_img": "/uper_img/广东白云学院.png",
    //         "video_author_info": "广东白云学院",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.849Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院_广东白云学院宣传片.mp4",
    //         "video_name": "广东白云学院宣传片",
    //         "image": "/video_img/广东白云学院_广东白云学院宣传片.png",
    //         "video_time": "02:46",
    //         "uper_img": "/uper_img/广东白云学院.png",
    //         "video_author_info": "广东白云学院",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.801Z"
    //     },
    //     {
    //         "video_path": "/video/广东白云学院_少年披甲气如虹，军装在身胆气雄.mp4",
    //         "video_name": "少年披甲气如虹，军装在身胆气雄",
    //         "image": "/video_img/广东白云学院_少年披甲气如虹，军装在身胆气雄.png",
    //         "video_time": "00:59",
    //         "uper_img": "/uper_img/广东白云学院.png",
    //         "video_author_info": "广东白云学院",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.769Z"
    //     },
    //     {
    //         "video_path": "/video/吃肉都廋的小明_那些你很冒险的梦~我陪你去疯.mp4",
    //         "video_name": "那些你很冒险的梦~我陪你去疯",
    //         "image": "/video_img/吃肉都廋的小明_那些你很冒险的梦~我陪你去疯.png",
    //         "video_time": "00:43",
    //         "uper_img": "/uper_img/吃肉都廋的小明.png",
    //         "video_author_info": "吃肉都廋的小明",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.747Z"
    //     },
    //     {
    //         "video_path": "/video/Sam哥_时光飞逝岁月如梭.mp4",
    //         "video_name": "时光飞逝岁月如梭",
    //         "image": "/video_img/Sam哥_时光飞逝岁月如梭.png",
    //         "video_time": "04:17",
    //         "uper_img": "/uper_img/Sam哥.png",
    //         "video_author_info": "Sam哥",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.614Z"
    //     },
    //     {
    //         "video_path": "/video/Regi嘟嘟_说是全校最猴看的男孩子不过分吧.mp4",
    //         "video_name": "说是全校最猴看的男孩子不过分吧",
    //         "image": "/video_img/Regi嘟嘟_说是全校最猴看的男孩子不过分吧.png",
    //         "video_time": "00:06",
    //         "uper_img": "/uper_img/Regi嘟嘟.png",
    //         "video_author_info": "Regi嘟嘟",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.608Z"
    //     },
    //     {
    //         "video_path": "/video/CAMillia_迎新晚会.mp4",
    //         "video_name": "迎新晚会",
    //         "image": "/video_img/CAMillia_迎新晚会.png",
    //         "video_time": "03:20",
    //         "uper_img": "/uper_img/CAMillia.png",
    //         "video_author_info": "CAMillia",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.503Z"
    //     },
    //     {
    //         "video_path": "/video/CAMillia_大一新生晚会.mp4",
    //         "video_name": "大一新生晚会",
    //         "image": "/video_img/CAMillia_大一新生晚会.png",
    //         "video_time": "05:57",
    //         "uper_img": "/uper_img/CAMillia.png",
    //         "video_author_info": "CAMillia",
    //         "video_statis": "an hour ago",
    //         "real_create_time": "2024-12-10T00:21:06.376Z"
    //     }
    // ]
    //
    // return res.status(200).json(fack_jsondata);

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
            const videoName = baseName.includes('_') ? baseName.split('_').slice(1).join('_') : '未知视频名称';

            const thumbnailPath = path.join(imageFolder, `${baseName}.png`);
            const videoCreationTime = getFileCreationTime(videoPath);
            const realCreateTime = GetRealCreateTime(videoPath);

            try {
                const videoTime = await getVideoDuration(videoPath);

                // 如果缩略图不存在，则生成
                if (!fs.existsSync(thumbnailPath)) {
                    await getVideoThumbnail(videoPath, thumbnailPath);
                }

                const videoData = {
                    video_path: `/video/${file}`,
                    video_name: videoName,
                    image: `/video_img/${baseName}.png`,
                    video_time: videoTime,
                    uper_img: `/uper_img/${authorName}.png`,
                    video_author_info: authorName,
                    video_statis: videoCreationTime,
                    real_create_time: realCreateTime
                };

                // 如果存在搜索参数，则进行过滤
                if (searchQuery) {
                    const nameMatch = videoName.toLowerCase().includes(searchQuery);
                    const authorMatch = authorName.toLowerCase().includes(searchQuery);
                    if (nameMatch || authorMatch) {
                        results.push(videoData);
                    }
                } else {
                    results.push(videoData);
                }
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
            req.session.userId = row.id;
            req.session.username = row.username;
            req.session.email = row.email;
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