# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

from django.conf.urls import url

from features.views import FeatureByUUID

urlpatterns = (
    url(
        r'^feature-by-uuid/(?P<feature_uuid>[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
        FeatureByUUID.as_view(), name='update-feature'),
)