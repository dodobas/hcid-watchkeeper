# coding=utf-8
__author__ = 'Christian Christelis <christian@kartoza.com>'
__date__ = '21/04/16'

import datetime
from django.contrib.gis.db import models
from event_mapper.models.user import User
from healthsites.models.healthsite import Healthsite

RESULTOPTIONS = (
    ('DropDown', 'DropDown'),
    ('Integer', 'Integer'),
    ('Decimal', 'Decimal'),
    ('MultipleChoice', 'MultipleChoice')
)


# default to 1 day from now
def get_overall_assessment_random():
    import random
    return random.randint(1, 5)


class HealthsiteAssessment(models.Model):
    healthsite = models.ForeignKey(Healthsite)
    current = models.BooleanField(default=True)
    reference_url = models.URLField(max_length=200, blank=True)
    reference_file = models.FileField(blank=True)
    created_date = models.DateTimeField(default=datetime.datetime.now)
    data_captor = models.ForeignKey(User, default=None)

    overall_assessment = models.IntegerField(max_length=1)

    def get_dict(self, getting_healthsite_info=False):
        output = {}
        # dropdown
        for entry in HealthsiteAssessmentEntryDropDown.objects.filter(healthsite_assessment=self):
            key = entry.assessment_criteria.assessment_group.name + "/" + entry.assessment_criteria.name
            if entry.selected_option == 'null':
                output[key] = {'value': '', 'option': '', 'description': ''}
                pass
            else:
                temp = []
                desc = []
                options = entry.selected_option.split(",")
                for option in options:
                    try:
                        id = int(option)
                        result_option = ResultOption.objects.get(id=id)
                        temp.append(result_option.option)
                        desc.append(result_option.description)
                    except:
                        pass
                output[key] = {'value': entry.selected_option, 'option': ','.join(temp), 'description': ','.join(desc)}

        # integer
        for entry in HealthsiteAssessmentEntryInteger.objects.filter(healthsite_assessment=self):
            output[
                entry.assessment_criteria.assessment_group.name + "/" + entry.assessment_criteria.name] \
                = {'value': entry.selected_option, 'option': '', 'description': ''}
        # decimal
        for entry in HealthsiteAssessmentEntryReal.objects.filter(healthsite_assessment=self):
            output[
                entry.assessment_criteria.assessment_group.name + "/" + entry.assessment_criteria.name] \
                = {'value': entry.selected_option, 'option': '', 'description': ''}

        result = {}
        if getting_healthsite_info:
            # merge healthsites output
            result['healthsite'] = self.healthsite.get_dict()
        result['assessment'] = output
        result['id'] = self.id
        result['created_date'] = self.created_date
        result['data_captor'] = self.data_captor.email
        result['overall_assessment'] = self.overall_assessment
        return result

    def get_context_data(self):
        context = {}
        for option in HealthsiteAssessmentEntryDropDown.objects.filter(
                healthsite_assessment=self.id):
            key = option.assessment_criteria.placeholder
            option_id = option.selected_option
            value = ResultOption.objects.get(id=option_id).value
            context[key] = value
        return context

    def __unicode__(self):
        return u"%s - %s" % (self.healthsite, self.created_date)

    class Meta:
        app_label = 'healthsites'


class AssessmentGroup(models.Model):
    name = models.CharField(
        help_text='The assessment group.',
        max_length=128,
        null=False,
        blank=False,
        unique=True)
    order = models.IntegerField()

    def __unicode__(self):
        return self.name

    class Meta:
        app_label = 'healthsites'


class AssessmentCriteria(models.Model):
    name = models.CharField(
        help_text='The assessment names',
        max_length=128,
        null=False,
        blank=False)
    assessment_group = models.ForeignKey(AssessmentGroup)
    result_type = models.CharField(
        max_length=128,
        choices=RESULTOPTIONS,
        null=False,
        blank=False)
    placeholder = models.CharField(
        max_length=20,
        null=True,
        blank=True,
    )

    def __unicode__(self):
        return u"%s - %s" % (self.assessment_group, self.name)

    class Meta:
        app_label = 'healthsites'


class ResultOption(models.Model):
    assessment_criteria = models.ForeignKey(
        AssessmentCriteria,
        limit_choices_to={
            'result_type__in': ['DropDown', 'MultipleChoice']
        })
    option = models.CharField(max_length=512)
    value = models.IntegerField()
    order = models.IntegerField()
    description = models.TextField()

    def __unicode__(self):
        return self.option

    class Meta:
        app_label = 'healthsites'


class HealthsiteAssessmentEntry(models.Model):
    healthsite_assessment = models.ForeignKey(HealthsiteAssessment)
    assessment_criteria = models.ForeignKey(AssessmentCriteria)

    class Meta:
        app_label = 'healthsites'
        abstract = True


class HealthsiteAssessmentEntryDropDown(HealthsiteAssessmentEntry):
    selected_option = models.CharField(max_length=32)

    class Meta:
        app_label = 'healthsites'


class HealthsiteAssessmentEntryInteger(HealthsiteAssessmentEntry):
    selected_option = models.IntegerField()

    class Meta:
        app_label = 'healthsites'


class HealthsiteAssessmentEntryReal(HealthsiteAssessmentEntry):
    selected_option = models.DecimalField(decimal_places=2, max_digits=9)

    class Meta:
        app_label = 'healthsites'
