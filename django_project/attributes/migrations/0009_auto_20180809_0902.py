# -*- coding: utf-8 -*-
# Generated by Django 1.11.15 on 2018-08-09 07:02
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attributes', '0008_auto_20180602_1341'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attribute',
            name='result_type',
            field=models.CharField(choices=[('Integer', 'Integer'), ('Decimal', 'Decimal'), ('Text', 'Text'), ('DropDown', 'DropDown')], max_length=16),
        ),
    ]