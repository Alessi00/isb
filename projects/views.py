from copy import deepcopy
import re
from google.appengine.api import urlfetch
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.conf import settings
from django.http import JsonResponse
from django.conf import settings
from data_upload.models import UserUpload, UserUploadedFile
from projects.models import Project

import json
import requests

@login_required
def project_list(request):
    template = 'projects/project_list.html'
    context = {}
    return render(request, template, context)

@login_required
def project_detail(request, project_id=0):
    # """ if debug: print >> sys.stderr,'Called '+sys._getframe().f_code.co_name """
    template = 'projects/project_detail.html'
    context = {}
    return render(request, template, context)

@login_required
def project_upload(request):
    template = 'projects/project_upload.html'
    context = {}
    return render(request, template, context)

@login_required
def upload_files(request):
    return JsonResponse({'status':'success', 'redirect_url': '/projects/1/'})