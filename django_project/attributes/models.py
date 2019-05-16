from django.db import models
from django.utils.text import slugify

from common.utils import random_string

from .constants import ATTRIBUTE_OPTIONS, CHOICE_ATTRIBUTE_OPTIONS, SIMPLE_ATTRIBUTE_OPTIONS, SYSTEM_KEYS


class AttributeGroup(models.Model):
    label = models.CharField(
        max_length=128,
        help_text='The attribute group',
        null=False, blank=False,
        unique=True
    )
    key = models.CharField(
        max_length=32,
        help_text='internal key of the attribute group',
        null=False, blank=False, unique=True
    )
    position = models.IntegerField(default=0)

    class Meta:
        ordering = ('position', )

    def __str__(self):
        return self.label

    def save(self, *args, **kwargs):
        # when creating a new AttributeGroup, auto generate key
        if self.pk is None:
            self.key = slugify(self.label)

        super().save(*args, **kwargs)


class BaseAttributeManager(models.Manager):
    def get_queryset(self):
        qs = super().get_queryset()

        return qs.filter(is_active=True)


class Attribute(models.Model):
    label = models.CharField(
        max_length=128,
        help_text='The attribute',
        null=False, blank=False
    )
    key = models.CharField(
        max_length=32,
        help_text='internal key of the attribute',
        null=False, blank=False, unique=True
    )
    attribute_group = models.ForeignKey('AttributeGroup', on_delete=models.PROTECT, related_name='attributes')
    result_type = models.CharField(
        max_length=16,
        choices=ATTRIBUTE_OPTIONS,
        null=False, blank=False
    )
    position = models.IntegerField(default=0)

    # validation
    required = models.BooleanField(default=False)
    max_length = models.PositiveIntegerField(null=True, blank=True, help_text='Maximum length')
    min_value = models.FloatField(null=True, blank=True, help_text='Minimum value')
    max_value = models.FloatField(null=True, blank=True, help_text='Maximum value')
    # TODO: regex_match

    # meta
    searchable = models.BooleanField(default=False)
    orderable = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ('attribute_group__position', 'position', )

    objects = BaseAttributeManager()

    def __str__(self):
        return '%s - %s' % (self.attribute_group, self.label)

    def save(self, *args, **kwargs):
        MAX_KEY_LEN = 32
        # when creating a new Attribute, auto generate key
        if self.pk is None:
            self.key = slugify(self.label).replace('-', '_')[:MAX_KEY_LEN]

            # https://stackoverflow.com/questions/29296108/how-to-get-one-field-from-model-in-django
            defined_keys = list(Attribute.objects.values_list('key', flat=True)) + SYSTEM_KEYS

            if self.key in defined_keys:
                suffix = f'_{random_string(5)}'

                trim_index = MAX_KEY_LEN - len(suffix) - len(self.key)
                if trim_index < 0:
                    self.key = f'{self.key[:trim_index]}{suffix}'
                else:
                    self.key = f'{self.key}{suffix}'
        super().save(*args, **kwargs)


class SimpleAttributeManager(BaseAttributeManager):
    def get_queryset(self):
        qs = super().get_queryset()

        return qs.filter(result_type__in=[name for name, _ in SIMPLE_ATTRIBUTE_OPTIONS])


class SimpleAttribute(Attribute):

    objects = SimpleAttributeManager()

    class Meta:
        proxy = True


class ChoiceAttributeManager(BaseAttributeManager):
    def get_queryset(self):
        qs = super().get_queryset()

        return qs.filter(result_type__in=[name for name, _ in CHOICE_ATTRIBUTE_OPTIONS])


class ChoiceAttribute(Attribute):

    objects = ChoiceAttributeManager()

    class Meta:
        proxy = True


class AttributeOption(models.Model):
    attribute = models.ForeignKey(
        'Attribute',
        models.DO_NOTHING,
        limit_choices_to={'result_type__in': [name for name, _ in CHOICE_ATTRIBUTE_OPTIONS]}
    )
    option = models.CharField(max_length=128)
    value = models.IntegerField()
    description = models.TextField(blank=True)
    position = models.IntegerField()

    class Meta:
        unique_together = ('attribute', 'option')

    def __str__(self):
        return '{}'.format(self.option)
