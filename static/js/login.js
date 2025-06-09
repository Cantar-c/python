const form = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

// 从查询字符串中提取 'redirect' 参数
const urlParams = new URLSearchParams(window.location.search);
const redirectUrl = urlParams.get('redirect');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    messageDiv.textContent = ''; // 清空消息

    const formData = new FormData(form);
    const data = {
        username: formData.get('username'), password: formData.get('password')
    };

    fetch('/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                messageDiv.style.color = '#ff6666';
                messageDiv.textContent = '登录失败: ' + result.error;
            } else {
                messageDiv.style.color = '#66ff66';
                messageDiv.textContent = '登录成功！即将跳转...';
                setTimeout(() => {
                    if (redirectUrl) {
                        const decodedRedirect = decodeURIComponent(redirectUrl);

                        if (decodedRedirect.startsWith('/')) {
                            window.location.href = decodedRedirect;
                        } else {
                            window.location.href = '/index.html';
                        }
                    } else {
                        window.location.href = '/index.html';
                    }
                }, 1000);
            }
        })
        .catch(err => {
            console.error('登录请求出错:', err);
            messageDiv.style.color = '#ff6666';
            messageDiv.textContent = '请求失败，请稍后重试。';
        });
});
