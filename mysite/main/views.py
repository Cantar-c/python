from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.contrib import messages
from .models import Product, Order, OrderItem
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
    if not request.user.is_staff:
        return HttpResponse("你没有权限访问", status=403)
    if request.method == 'POST':
        name = request.POST['name']
        price = request.POST['price']
        stock = request.POST['stock']
        description = request.POST['description']
        image = request.FILES.get('image')

        #校验
        if not name or not price or not stock:
            return render(request,'add_prdouct.html',{'error':'请填写完整'})

        (
            Product.objects.create
            (
            name=name,
            price=price,
            stock=stock,
            description=description,
            image=image
            )
        )
        return redirect('product_list')

    return render(request,'add_product.html')

#添加商品详情视图
def product_detail(request, product_id):
    if not request.user.is_staff:
        return HttpResponse("你没有权限访问", status=403)
    product = get_object_or_404(Product, id=product_id)
    return render(request,'product_detail.html', {'product': product})

#购物车结构（基于session）
def add_to_cart(request, product_id):
    cart = request.session.get('cart', {})
    cart[str(product_id)] = cart.get(str(product_id), 0) + 1
    request.session['cart'] = cart
    return redirect('cart')

#购物车视图和模板
@login_required
def cart_view(request):
    cart =request.session.get('cart', {})
    cart_items = cart.values()
    total = 0

    for product_id, quantity in cart.items():
        product = get_object_or_404(Product, id=product_id)
        subtotal = product.price * quantity
        cart_items.append({'product': product, 'quantity': quantity, 'subtotal': subtotal})
        total += subtotal

    return render(request, 'cart.html', {'cart_items': cart_items, 'total': total})

#修改购物车
def update_cart(request, product_id, action):
    cart = request.session.get('cart', {})

    if action == 'add':
        cart[str(product_id)] = cart.get(str(product_id), 0) + 1
    elif action == 'remove':
        if str(product_id) in cart:
            cart[str(product_id)] -= 1
            if cart[str(product_id)] <= 0:
                del cart[str(product_id)]
    elif action == 'delete':
        cart.pop(str(product_id), None)

    request.session['cart'] = cart
    return redirect('cart')

#提交订单

@login_required
def submit_order(request):
    cart = request.session.get('cart', {})
    if not cart:
        return redirect('cart')

    order = Order.objects.create(user=request.user)
    for product_id, quantity in cart.items():
        product = get_object_or_404(Product, id=product_id)
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            price=product.price
        )
    request.session['cart'] = {}
    return render(request, 'order_success.html', {'order': order})
#用户中心
@login_required
def profile(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'profile.html', {'orders': orders})





