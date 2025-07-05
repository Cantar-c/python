
from django.urls import path
from . import views

urlpatterns = [
    path('', views.product_list, name='product_list'),  # 首页就是商品列表
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('add/', views.add_product, name='add_product'),
]