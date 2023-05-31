from django.urls import path, re_path
# from django.conf.urls import url
from . import views


app_name='network'
urlpatterns = [
    re_path(r"^$", views.index, name='index'),
    re_path(r"^change_operator/$", views.change_operator, name='change_operator'),
]