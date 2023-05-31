from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse
import platform
import os
import urllib, urllib.request
import json


def index(request):
    context = dict()
    # context['hello'] = 'Hello World!'
    return render(request, 'index.html', context)


@ensure_csrf_cookie
def music(request):
    if request.method == 'POST':
        if platform.system() == 'Windows':
            music_dir = os.getcwd() + "\\static\\music"
        else:
            music_dir = os.getcwd() + "/static/music"
        return HttpResponse(json.dumps(os.listdir(music_dir)), content_type="application/json")


@ensure_csrf_cookie
def talk(request):
    # 看板娘的聊天机器人暂时使用图灵机器人
    if request.method == 'POST':
        data = request.POST
        print(data)
        url = "http://openapi.tuling123.com/openapi/api/v2"
        post_data = {
            "perception": {
                "inputText": {
                    "text": data['info']
                }
            },
            "userInfo": {
                "apiKey": "233162b4566b4a9f9533c8fb8e1ed89f",
                "userId": "443412"
            }
        }
        print(post_data)
        req = urllib.request.Request(url, data=json.dumps(post_data).encode('utf-8'))
        req.add_header('Content-type', 'application/json')
        res = urllib.request.urlopen(req)
        res_str = res.read().decode()
        print(res_str)
        res_json = json.loads(res_str)
        if 'results' in res_json:
            results = res_json['results']
            return HttpResponse(results[0]['values']['text'])