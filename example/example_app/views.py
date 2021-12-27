from django.http import HttpResponse
from http import HTTPStatus


def hello_world(request):
    return HttpResponse(content='Hello world!', status_code=HTTPStatus.OK)