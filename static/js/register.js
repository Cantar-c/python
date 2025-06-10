const form = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    messageDiv.textContent = ''; // 清空消息

    const formData = new FormData(form); // 自动收集表单数据

    fetch('/api/register', {
        method: 'POST',
        body: formData // 直接传 FormData，不要设置 Content-Type，浏览器会自动处理
    }).then(response => response.json())
        .then(result => {
            if (result.code !== 200) {
                messageDiv.style.color = '#ff6666';
                messageDiv.textContent = '注册失败: ' + result.msg;
            } else {
                messageDiv.style.color = '#66ff66';
                messageDiv.textContent = '注册成功！即将跳转...';
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        }).catch(err => {
            messageDiv.style.color = '#ff6666';
            messageDiv.textContent = '请求失败，请稍后重试。';
        });
});
