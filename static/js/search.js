$(document).ready(function () {

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

});
