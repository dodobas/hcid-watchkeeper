# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

from .dev import *  # noqa

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'waterboard',
        'USER': 'knek',
        'PASSWORD': 'knek',
        'HOST': '127.0.0.1',
        'PORT': 5445
    }
}
ALLOWED_HOSTS = ['*']

# DEBUG = False
