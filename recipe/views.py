from django.shortcuts import render

# Create your views here.
def index(request):
    context = dict()
    return render(request, 'recipe/recipe.html', context)