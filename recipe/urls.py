from django.urls import path, re_path
# from django.conf.urls import url
from . import views


app_name='recipe'
urlpatterns = [
    re_path(r"^$", views.index, name='index'),
]