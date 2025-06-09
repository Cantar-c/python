function showTime() {
    var myDate=new Date();  //定义日期与时间变量
    var hour=myDate.getHours();
    var minutes=myDate.getMinutes();
    var seconds=myDate.getSeconds();
    if(hour<10) hour="0"+hour;
    if(minutes<10) minutes="0"+minutes;
    if(seconds<10) seconds="0"+seconds;
    document.getElementById("time").innerHTML="当前时间为："+hour+":"+minutes+":"+seconds;  //给id为time的标签赋值
    setTimeout(showTime,1000); //设置定时函数，1秒执行一次showTime函数，使用函数引用而不是字符串以提升性能
}
window.onload=showTime; //页面加载时调用showTime函数，正确的函数赋值方式