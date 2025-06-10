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
            window.location.href = '/?search=' + encodeURIComponent(query);
        } else {
            // 如果搜索框为空，移除搜索参数并重新加载
            window.location.href = '/';
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

    $.ajax({
        url: '/api/videos',
        method: 'GET',
        dataType: 'json',
        data: ajaxParams,
        success: function (data) {
            console.log('成功获取视频数据:', data);

            if (Array.isArray(data.data)) {
                $('#videoGrid').empty();

                data.data.forEach(function (video, index) {
                    console.log(`渲染视频 ${index + 1}:`, video);

                    var videoDiv = $('<div>', {class: 'video', 'data-index': index});

                    var coverImageDiv = $('<div>', {class: 'cover_image'});
                    var image = $('<img>', {
                        class: 'image',
                        src: video.thumbnail,
                        alt: video.title
                    }).on('error', function () {
                        console.error(`图片加载失败: ${video.thumbnail}`);
                        $(this).attr('src', '/static/img/default-image.png');
                    });
                    var videoTimeDiv = $('<div>', {class: 'video_time', text: video.duration});

                    coverImageDiv.append(image).append(videoTimeDiv);

                    var verticalSecondDiv = $('<div>', {class: 'vertical_second'});

                    var uperDiv = $('<div>', {class: 'uper_div'});
                    var uperImg = $('<img>', {
                        class: 'uper_img',
                        src: video.uper_img || '/static/img/default-avatar.png',
                        alt: video.video_author_info || '作者'
                    }).on('error', function () {
                        console.error(`作者头像加载失败: ${video.uper_img}`);
                        $(this).attr('src', '/static/img/default-avatar.png');
                    });
                    uperDiv.append(uperImg);

                    var videoInfoDiv = $('<div>', {class: 'video_info'});
                    var videoTitleP = $('<p>', {
                        class: 'video_title_p',
                        text: video.title
                    });
                    var videoAuthorInfoP = $('<p>', {
                        class: 'video_author_info',
                        text: video.video_author_info || '未知作者'
                    });
                    var videoStatisP = $('<p>', {
                        class: 'video_statis',
                        text: video.video_statis
                    });

                    videoInfoDiv.append(videoTitleP)
                        .append(videoAuthorInfoP)
                        .append(videoStatisP);

                    verticalSecondDiv.append(uperDiv).append(videoInfoDiv);
                    videoDiv.append(coverImageDiv).append(verticalSecondDiv);

                    $('#videoGrid').append(videoDiv);

                    image.on('click', function () {
                        window.open('/video/' + video.id, '_blank');
                    });
                });

                if (data.data.length === 0) {
                    $('#videoGrid').append('<p>未找到相关视频。</p>');
                }
            } else {
                console.error('返回的数据格式不正确:', data);
                $('#videoGrid').append('<p>视频数据加载失败。</p>');
            }

            loading.style.display = 'none';
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('获取视频数据出错:', textStatus, errorThrown);
            $('#videoGrid').append('<p>无法加载视频数据。</p>');
            loading.style.display = 'none';
        }
    });

});
