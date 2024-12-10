$(document).ready(function () {
    // 清空 user_section 除了 upload_video 图标
    $('#user_section').children().not('#upload_video').remove();

    // 请求 /user 接口以获取用户信息
    $.ajax({
        url: '/user', method: 'GET', dataType: 'json', success: function (response) {
            if (response.user && response.user.username) {
                // 用户已登录，使用后端返回的 avatar URL
                var avatarUrl = response.user.avatar;

                console.log("Avatar URL:", avatarUrl);

                // 创建头像img元素，并包裹在链接中
                var avatarLink = $('<a>', {
                    href: '/user.html', title: '查看个人信息'
                });

                var avatarImg = $('<img>', {
                    src: avatarUrl, alt: '头像', class: 'avatar'
                });

                avatarLink.append(avatarImg);
                $('#user_section').append(avatarLink);
            } else {
                // 用户未登录，显示登录按钮
                createLoginButton();
            }
        }, error: function () {
            // 请求失败时，显示登录按钮
            createLoginButton();
        }
    });

    // 函数：创建登录按钮
    function createLoginButton() {
        var loginButton = $('<button>', {
            text: '登录', class: 'login_button', click: function () {
                window.location.href = '/login.html';
            }
        });

        // 添加样式类，而不是使用内联样式
        $('#user_section').append(loginButton);
    }
});
