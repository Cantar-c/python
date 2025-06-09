document.addEventListener("DOMContentLoaded", function() {
    const topButton = document.getElementById("Top_button");

    // 当页面滚动时显示或隐藏按钮
    function checkScroll() {
        if (document.documentElement.scrollTop > 1) {
            topButton.style.display = "block";
        } else {
            topButton.style.display = "none";
        }
    }

    window.addEventListener('scroll', checkScroll);

    // 点击按钮时的滚动行为
    function goToTop() {
        if (document.documentElement.scrollTop > 0) {
            window.scrollTo({
                top: 0,
                behavior: "smooth" // 平滑滚动效果
            });
        }
    }

    // 添加点击事件
    topButton.addEventListener('click', goToTop);
});
