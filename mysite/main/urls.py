
from django.urls import path
from . import views

urlpatterns = [
    path('', views.product_list, name='product_list'),  # 首页就是商品列表
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('add/', views.add_product, name='add_product'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('add_to_cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart_view, name='cart'),
    path('cart/update/<int:product_id>/<str:action>/', views.update_cart, name='update_cart'),
    path('submit_order/', views.submit_order, name='submit_order'),
    path('profile/', views.profile, name='profile'),

]