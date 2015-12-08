from django.conf.urls import patterns, url

import views

urlpatterns = patterns('',
    url(r'^$', views.workbook_list, name='workbooks'),
    url(r'^samples$', views.workbook_samples, name='workbook_samples'),
    url(r'^(?P<workbook_id>\d+)/$', views.workbook, name='workbook_detail')
)
