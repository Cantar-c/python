$(document).ready(function () {
    $("#index_site").click(function () {
        // 指定跳转的 URL
        const targetUrl = "/index.html";
        // 跳转到目标网站
        window.location.href = targetUrl;
    });

    $("#official_site").click(function () {
        // 指定跳转的 URL
        const targetUrl = "https://www.baiyunu.edu.cn/";
        // 跳转到目标网站
        window.location.href = targetUrl;
    });

    $("#library").click(function () {
        // 指定跳转的 URL
        const targetUrl = "https://lib.baiyunu.edu.cn/";
        // 跳转到目标网站
        window.location.href = targetUrl;
    });

    $("#selfInfo").click(function () {
        // 指定跳转的 URL
        const targetUrl = "/infos.html";
        // 跳转到目标网站
        window.location.href = targetUrl;
    });
});