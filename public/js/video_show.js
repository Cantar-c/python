// 获取 URL 中的视频名称
const urlParams = new URLSearchParams(window.location.search);
const videoName = urlParams.get('name');

const videoPlayer = document.getElementById('video_player');
const videoTitle = document.getElementById('video_title');
const errorMessage = document.getElementById('error-message');

if (videoName) {
    // 从文件名中提取视频标题
    const videoTitleText = decodeURIComponent(videoName.split('/').pop().replace(/\.mp4$/, '').replace(/_/g, ' '));
    videoTitle.textContent = videoTitleText;

    // 检查视频是否存在
    const videoPath = videoName; // 视频存储的路径

    const videoElement = document.createElement('video');
    videoElement.setAttribute('controls', 'true');
    videoElement.setAttribute('width', '100%');

    // 尝试加载视频
    videoElement.src = videoPath;

    videoElement.onerror = () => {
        // 如果视频加载失败，显示错误消息
        videoPlayer.style.display = 'none';
        errorMessage.style.display = 'block';
    };

    // 视频开始加载时显示视频播放器，隐藏错误消息
    videoElement.oncanplay = () => {
        videoPlayer.style.display = 'block';
        errorMessage.style.display = 'none';
    };

    // 将视频播放器添加到容器中
    videoPlayer.appendChild(videoElement);
} else {
    // 如果未提供视频名称，显示错误消息
    videoPlayer.style.display = 'none';
    errorMessage.style.display = 'block';
}