from __future__ import absolute_import
from django.conf.urls import include, url
from django.contrib import admin
from . import views

admin.autodiscover()

urlpatterns = [
    #url(r'^', include('cohorts.urls')),
    #url(r'^(?P<cohort_id_1>\d+)/(?P<cohort_id_2>\d+)/$', views.compare_cohorts, name='compare')
    #url(r'^cohorts/$', views.compare_cohorts, name='compare')
    url(r'^cohorts/(?P<cohort_id_1>\d+)/(?P<cohort_id_2>\d+)/$', views.compare_cohorts, name='compare'),
    url(r'^validate_cohorts$', views.compare_validate_cohorts, name='compare_validate_cohorts')
]