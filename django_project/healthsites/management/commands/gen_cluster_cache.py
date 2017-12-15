# -*- coding: utf-8 -*-
from __future__ import absolute_import, division, print_function, unicode_literals

import json
import os
from optparse import make_option

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ...map_clustering import cluster
from ...models.healthsite import Healthsite


class Command(BaseCommand):
    default_size = [48, 46]
    args = '<icon_width> <icon_height>'
    help = 'Generate healthsites cluster cache. \n' \
           'icon_width and icon_height are the size that is used to make clustering \n' \
           'the method : overlap healthsites (by the icon size) will be clustered)\n' \
           'default size for hcid is %d,%d' % (default_size[0], default_size[1])

    option_list = BaseCommand.option_list + (
        make_option(
            '--tabs', action='store_true', dest='use_tabs', default=False,
            help='Use when input file is tab delimited'
        ),
    )

    def handle(self, *args, **options):

        if len(args) != 2:
            icon_size = self.default_size
        else:
            try:
                icon_size = [int(size) for size in args[0:2]]
            except Exception as e:
                raise CommandError(str(e))

        if any((size < 0 for size in icon_size)):
            # icon sizes should be positive
            raise CommandError('Icon sizes should be positive numbers')

        # check the folder
        if not os.path.exists(settings.CLUSTER_CACHE_DIR):
            os.makedirs(settings.CLUSTER_CACHE_DIR)

        # generate the cache
        for zoom in range(settings.CLUSTER_CACHE_MAX_ZOOM + 1):
            filename = os.path.join(
                settings.CLUSTER_CACHE_DIR,
                '{}_{}_{}_healthsites.json'.format(zoom, *icon_size)
            )

            healthsites = Healthsite.objects.filter(is_healthsites_io=True)
            object_list = cluster(healthsites, zoom, *icon_size)

            with open(filename, 'wb') as cache_file:
                json.dump(object_list, cache_file)

            self.stdout.write('Generated cluster cache for zoom: %s' % zoom)
