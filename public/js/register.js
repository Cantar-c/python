const form = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    messageDiv.textContent = ''; // 清空消息

    const formData = new FormData(form);
    const data = {
        username: formData.get('username'), password: formData.get('password'), email: formData.get('email')
    };

    fetch('/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
    }).then(response => response.json())
        .then(result => {
            if (result.error) {
                messageDiv.style.color = '#ff6666';
                messageDiv.textContent = '注册失败: ' + result.error;
            } else {
                messageDiv.style.color = '#66ff66';
                messageDiv.textContent = '注册成功！即将跳转...';
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
            }
        }).catch(err => {
        messageDiv.style.color = '#ff6666';
        messageDiv.textContent = '请求失败，请稍后重试。';
    });
});