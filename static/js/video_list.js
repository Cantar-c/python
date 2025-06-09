$(document).ready(function () {
    console.log('页面加载完成，开始请求视频数据');

    var loading = document.getElementById('loading');

    console.log('loading:', loading);

    // 获取 URL 中的搜索参数
    function getQueryParam(param) {
        let urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // 填充搜索框（如果有搜索参数）
    let searchQuery = getQueryParam('search');
    if (searchQuery) {
        $('.search').val(searchQuery);
    }

    // 搜索按钮点击事件
    $('.search_button').on('click', function (e) {
        e.preventDefault(); // 防止表单默认提交行为
        let query = $('.search').val().trim();
        if (query) {
            // 更新 URL 并重新加载页面
            window.location.href = '/index.html?search=' + encodeURIComponent(query);
        } else {
            // 如果搜索框为空，移除搜索参数并重新加载
            window.location.href = '/index.html';
        }
    });

    // 处理回车键搜索
    $('.search').on('keypress', function (e) {
        if (e.which === 13) { // 回车键的键码是13
            e.preventDefault();
            $('.search_button').click();
        }
    });

    // 准备 AJAX 请求的参数
    let ajaxParams = {};
    if (searchQuery) {
        ajaxParams.search = searchQuery;
    }

    // 请求后端 API 获取视频数据
    $.ajax({
        url: '/videos', // 后端视频数据接口
        method: 'GET', dataType: 'json', data: ajaxParams, // 传递搜索参数
        success: function (data) {
            console.log('成功获取视频数据:', data);

            // 检查数据是否为数组
            if (Array.isArray(data)) {
                // 清空视频网格
                $('#videoGrid').empty();

                // 遍历每个视频对象并生成相应的 HTML
                data.forEach(function (video, index) {
                    console.log(`渲染视频 ${index + 1}:`, video);

                    // 创建视频容器
                    var videoDiv = $('<div>', {class: 'video', 'data-index': index}); // 使用 data-index 存储视频位置

                    // 创建封面图部分
                    var coverImageDiv = $('<div>', {class: 'cover_image'});
                    var image = $('<img>', {
                        class: 'image', src: video.image, alt: video.video_name
                    }).on('error', function () {
                        console.error(`图片加载失败: ${video.image}`);
                        $(this).attr('src', '/video_images/default-image.png'); // 替换为默认图片路径
                    });
                    var videoTimeDiv = $('<div>', {class: 'video_time', text: video.video_time});

                    coverImageDiv.append(image).append(videoTimeDiv);

                    // 创建视频信息部分
                    var verticalSecondDiv = $('<div>', {class: 'vertical_second'});

                    // 上部图片（作者头像）
                    var uperDiv = $('<div>', {class: 'uper_div'});
                    var uperImg = $('<img>', {
                        class: 'uper_img', src: video.uper_img, alt: video.video_author_info
                    }).on('error', function () {
                        console.error(`作者头像加载失败: ${video.uper_img}`);
                        $(this).attr('src', '/uper_img/default-avatar.png'); // 替换为默认头像路径
                    });
                    uperDiv.append(uperImg);

                    // 视频详细信息
                    var videoInfoDiv = $('<div>', {class: 'video_info'});
                    var videoTitleP = $('<p>', {
                        class: 'video_title_p', text: video.video_name
                    });
                    var videoAuthorInfoP = $('<p>', {
                        class: 'video_author_info', text: video.video_author_info
                    });
                    var videoStatisP = $('<p>', {
                        class: 'video_statis', text: video.video_statis
                    });

                    videoInfoDiv.append(videoTitleP)
                        .append(videoAuthorInfoP)
                        .append(videoStatisP);

                    verticalSecondDiv.append(uperDiv).append(videoInfoDiv);

                    // 组合所有部分
                    videoDiv.append(coverImageDiv).append(verticalSecondDiv);

                    // 将视频容器添加到视频网格中
                    $('#videoGrid').append(videoDiv);

                    console.log(`视频 ${index + 1} 渲染完成`);

                    // 为每个视频容器添加点击事件
                    image.on('click', function () {
                        var videoFilePath = video.video_path; // 获取视频文件路径
                        // 使用 window.open 在新标签页中打开视频
                        window.open('/video.html?name=' + encodeURIComponent(videoFilePath), '_blank');
                    });
                });

                // 如果没有视频显示提示信息
                if (data.length === 0) {
                    $('#videoGrid').append('<p>未找到相关视频。</p>');
                }
            } else {
                console.error('返回的数据格式不正确:', data);
                $('#videoGrid').append('<p>视频数据加载失败。</p>');
            }
            loading.style.display = 'none';
        }, error: function (jqXHR, textStatus, errorThrown) {
            console.error('获取视频数据出错:', textStatus, errorThrown);
            $('#videoGrid').append('<p>无法加载视频数据。</p>');
            loading.style.display = 'none';
        }
    });

});
