$('#uploadForm').on('submit', function (event) {
    event.preventDefault(); // 阻止默认提交

    var formData = new FormData(this);

    // 编码文件名
    var videoFile = $('#video')[0].files[0];
    if (videoFile) {
        formData.set('video', videoFile, encodeURIComponent(videoFile.name));
    }

    // 显示上传状态和进度条
    $('#uploadStatus').html('上传中...');
    $('#uploadProgress').show();
    $('#progressBar').css('width', '0%').text('0%');

    $.ajax({
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = ((evt.loaded / evt.total) * 100).toFixed(2);
                    $('#progressBar').css('width', percentComplete + '%');
                    $('#progressBar').text(percentComplete + '%');
                }
            }, false);
            return xhr;
        }, url: '/upload', // 后端上传端点
        type: 'POST', data: formData, contentType: false, // 不设置内容类型
        processData: false, // 不处理数据
        success: function (response) {
            $('#uploadStatus').html('<span style="color: green;">上传成功！</span>');
            $('#uploadProgress').hide();
            $('#uploadForm')[0].reset();
            $('#videoPreview').hide();
        }, error: function (xhr, status, error) {
            var errMsg = '上传失败：';
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errMsg += xhr.responseJSON.error;
            } else {
                errMsg += error;
            }
            $('#uploadStatus').html('<span style="color: red;">' + errMsg + '</span>');
            $('#uploadProgress').hide();
        }
    });
});
