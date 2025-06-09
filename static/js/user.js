$(document).ready(function () {
    // 定义需要登录保护的页面
    var protectedPages = ['user.html', 'upload.html'];

    // 获取当前页面的文件名
    var currentPage = window.location.pathname.split('/').pop();

    // 检查当前页面是否需要登录
    var isProtectedPage = protectedPages.includes(currentPage);

    // 请求 /user 接口以获取用户信息
    $.ajax({
        url: '/user', method: 'GET', dataType: 'json', success: function (response) {
            if (response.user && response.user.username) {
                // 用户已登录，处理用户界面
                handleUserLoggedIn(response.user);
            } else {
                // 用户未登录
                if (isProtectedPage) {
                    // 如果当前页面需要登录，则重定向到登录页面
                    redirectToLogin(currentPage);
                } else {
                    // 否则，显示登录按钮
                    createLoginButton();
                }
            }
        }, error: function () {
            // 请求失败时，假设用户未登录
            if (isProtectedPage) {
                redirectToLogin(currentPage);
            } else {
                createLoginButton();
            }
        }
    });

    // 函数：处理用户已登录的情况
    function handleUserLoggedIn(user) {
        // 清空 #user_section 除了 upload_video 图标
        $('#user_section').children().not('#upload_video').remove();

        // 使用后端返回的 avatar URL
        var avatarUrl = user.avatar;

        // 创建头像 img 元素，并包裹在链接中
        var avatarLink = $('<a>', {
            href: '/user.html', title: '查看个人信息'
        });

        var avatarImg = $('<img>', {
            src: avatarUrl, alt: '头像', class: 'avatar'
        });

        avatarLink.append(avatarImg);

        // 创建注销按钮
        var logoutButton = $('<button>', {
            text: '退出', class: 'logout_button', click: function () {
                $.ajax({
                    url: '/logout', method: 'GET', success: function () {
                        // 注销成功后，重新加载当前页面
                        window.location.reload();
                    }, error: function () {
                        alert('注销失败，请重试。');
                    }
                });
            }
        });

        // 将头像链接和注销按钮添加到 #user_section
        $('#user_section').append(avatarLink, logoutButton);
    }

    // 函数：创建登录按钮
    function createLoginButton() {
        var loginButton = $('<button>', {
            text: '登录', class: 'login_button', click: function () {
                window.location.href = '/login';
            }
        });

        // 添加样式类，而不是使用内联样式
        $('#user_section').append(loginButton);
    }

    // 函数：重定向到登录页面，并附加 redirect 参数
    function redirectToLogin(redirectPage) {
        var loginUrl = '/login?redirect=/' + encodeURIComponent(redirectPage);
        window.location.href = loginUrl;
    }
});
