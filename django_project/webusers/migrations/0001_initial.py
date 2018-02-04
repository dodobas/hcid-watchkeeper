# -*- coding: utf-8 -*-
# Generated by Django 1.11.8 on 2017-12-20 15:58
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='WebUser',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('email', models.EmailField(help_text='Please enter your email address. This will also be your login name.', max_length=254, unique=True, verbose_name='Email')),
                ('full_name', models.CharField(help_text='Your full name.', max_length=100, verbose_name='Full name')),
                ('is_active', models.BooleanField(default=True, help_text="Uncheck this to disable this user's account without deleting it.", verbose_name='Active')),
                ('is_staff', models.BooleanField(default=False, help_text='Staff can access wk-admin page.', verbose_name='Staff'))
            ],
            options={
                'abstract': False,
            },
        ),
    ]
