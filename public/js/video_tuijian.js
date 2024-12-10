// 获取推荐视频接口的数据
async function fetchRecommendationVideos() {
    try {
        const response = await fetch('/videos');
        const videos = await response.json();

        const recommendationList = document.getElementById('recommendation-list');

        // 清空列表（如果有默认内容）
        recommendationList.innerHTML = '';

        videos.forEach(video => {
            // 创建视频列表项
            const listItem = document.createElement('li');
            listItem.classList.add('recommended-video-item');

            // HTML 结构
            listItem.innerHTML = `
                    <div class="thumbnail">
                        <img src="${video.image}" alt="${video.video_name}">
                        <span class="video-duration">${video.video_time}</span>
                    </div>
                    <div class="details">
                        <h4>${video.video_name}</h4>
                        <div class="author-info">
                            <img src="${video.uper_img}" alt="UP主头像">
                            <span>${video.video_author_info}</span>
                        </div>
                        <div class="stats">
                            <span>${video.video_statis}</span>
                        </div>
                    </div>
                `;

            // 新增：为每个推荐视频添加点击事件
            listItem.style.cursor = 'pointer'; // 更改鼠标悬停时的指针样式
            listItem.addEventListener('click', () => {
                // 假设 video.video_path 包含视频的路径
                window.location.href = `/video.html?name=${encodeURIComponent(video.video_path)}`;
            });

            // 插入到推荐列表中
            recommendationList.appendChild(listItem);
        });
    } catch (error) {
        console.error('加载推荐视频失败:', error);
    }
}

// 加载推荐视频
fetchRecommendationVideos();