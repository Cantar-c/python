from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.shortcuts import render,redirect
from django.http import HttpResponse
from django.contrib import messages
from .models import Product
from django.contrib.auth import authenticate, logout,login


# Create your views here.
def index(request):
    return HttpResponse("Hello Django!.")

def product_list(request):
    products = Product.objects.all()
    paginator = Paginator(products, 6)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, 'product_list.html', {'page_obj': page_obj})


#创建注册视图函数
def register(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']

        if User.objects.filter(username=username).exists():
            messages.error(request,'用户名已存在')
            return redirect('register')

        User.objects.create_user(username=username,password=password)#自动加密
        messages.success(request,'注册成功')
        return redirect('login')
    return render(request,'register.html')

#登录
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        #判断是否为空
        if user is not None:
            login(request, user)
            return redirect('product_list')
        else:
            messages.error(request, "用户名或密码错误")
            return redirect('login')
     #登录后自动跳回
    next_url = request.GET.get('next')
    if next_url:
        return redirect(next_url)
    return render(request, 'login.html')

#退出登录
def logout_view(request):
    if request.user.is_authenticated:#判断是否登录
        logout(request)#清session
        return redirect('login')

#添加商品
@login_required
def add_product(request):
    if request.method == 'POST':
        name = request.POST['name']
        price = request.POST['price']
        stock = request.POST['stock']
        description = request.POST['description']

        #校验
        if not name or not price or not stock:
            return render(request,'add_prdouct.html',{'error':'请填写完整'})

        (
            Product.objects.create
            (
            name=name,
            price=price,
            stock=stock,
            description=description
            )
        )
        return redirect('product_list')

    return render(request,'add_product.html')