from ast import operator
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import SBMMatrix
import json

sbm = None

# Create your views here.
@ensure_csrf_cookie
def index(request):
    if request.method == 'GET':
        context = dict()
        # context['hello'] = 'Hello World!'
        return render(request, 'network/spectral.html', context)
    elif request.method == 'POST':
        data = request.POST
        print(data)
        blockSize = int(data['blockSize'])
        blockNumber = int(data['blockNumber'])
        cin = float(data['cin'])
        cout = float(data['cout'])
        n = blockSize * blockNumber
        sizes = [blockSize] * blockNumber
        ps = [[cin if i == j else cout for j in range(blockNumber)] for i in range(blockNumber)]
        global sbm
        sbm = SBMMatrix(n, sizes=sizes, ps=ps)
        w, v = sbm.get_eigen()
        print(n, sizes, ps)
        return JsonResponse({'adj': sbm.A.tolist(), 'eigenValue': w.tolist(), 'eigenVector':v.tolist()})

@ensure_csrf_cookie
def change_operator(request):
    if request.method == 'POST':
        data = request.POST
        print(data)
        operator = str(data['operator'])
        if 'r' in data.keys():
            r = float(data['r'])
        else:
            r = 0
        global sbm
        if sbm is not None:
            sbm.change_operator(operator, r=r)
            w, v = sbm.get_eigen()
        else:
            w, v = [], []
        return JsonResponse({'eigenValue': w.tolist(), 'eigenVector':v.tolist()})
