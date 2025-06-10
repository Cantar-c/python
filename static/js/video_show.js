document.addEventListener('DOMContentLoaded', function () {
    const videoPlayer = document.getElementById('video_player');
    const videoTitle = document.getElementById('video_title');
    const errorMessage = document.getElementById('error-message');
    const recommendation = document.getElementById('recommendation');

    // 从隐藏 input 中获取 video_path
    const videoPath = document.getElementById('video_path')?.value;
    if (videoPath) {
        const videoElement = document.createElement('video');
        videoElement.setAttribute('controls', 'true');
        videoElement.setAttribute('width', '100%');
        videoElement.src = videoPath;

        videoElement.onerror = () => {
            videoPlayer.style.display = 'none';
            errorMessage.style.display = 'block';
            recommendation.style.display = 'none';
            videoTitle.style.display = 'none';
        };

        videoElement.oncanplay = () => {
            videoPlayer.style.display = 'block';
            errorMessage.style.display = 'none';
            recommendation.style.display = 'block';
            videoTitle.style.display = 'block';
        };

        videoPlayer.appendChild(videoElement);
    } else {
        videoPlayer.style.display = 'none';
        errorMessage.style.display = 'block';
        recommendation.style.display = 'none';
        videoTitle.style.display = 'none';
    }
});
