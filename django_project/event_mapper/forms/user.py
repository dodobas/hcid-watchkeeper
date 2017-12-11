# coding=utf-8
"""Docstring for this file."""
from django import forms
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.crypto import get_random_string
from collections import OrderedDict
from event_mapper.models.user import User
from event_mapper.models.country import Country
from event_mapper.utilities.commons import get_verbose_name, get_help_text

__author__ = 'ismailsunni'
__project_name = 'watchkeeper'
__filename = 'user'
__date__ = '4/28/15'
__copyright__ = 'imajimatika@gmail.com'
__doc__ = ''


class UserCreationForm(forms.ModelForm):
    """A form for creating new users. Includes all the required
    fields, plus a repeated password."""

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone_number',
                  'notified', 'countries_notified', 'north', 'east', 'south',
                  'west')

    email = forms.EmailField(
        label=get_verbose_name(User, 'email'),
        help_text=get_help_text(User, 'email'),
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'john@doe.com'})
    )

    first_name = forms.CharField(
        label=get_verbose_name(User, 'first_name'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'John'})
    )

    last_name = forms.CharField(
        label=get_verbose_name(User, 'last_name'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Doe'})
    )

    phone_number = forms.CharField(
        label=get_verbose_name(User, 'phone_number'),
        help_text=get_help_text(User, 'phone_number'),
        widget=forms.TextInput(
            attrs={
                'class': 'form-control',
                'placeholder': '+6281234567890'})
    )

    notified = forms.BooleanField(
        label=get_verbose_name(User, 'notified'),
        help_text=get_help_text(User, 'notified'),
        widget=forms.CheckboxInput(
            attrs={'class': 'form-'}),
        required=False,
    )

    countries_notified = forms.ModelMultipleChoiceField(
        label=get_verbose_name(User, 'countries_notified'),
        help_text=get_help_text(User, 'countries_notified'),
        widget=forms.SelectMultiple(
            attrs={'class': 'form-control normal_case'}),
        required=False,
        queryset=Country.objects.order_by(),
    )

    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Your s3cr3T password'})
    )

    password2 = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Your s3cr3T password'})
    )

    north = forms.FloatField(
        widget=forms.HiddenInput,
        required=False
    )

    east = forms.FloatField(
        widget=forms.HiddenInput,
        required=False
    )

    south = forms.FloatField(
        widget=forms.HiddenInput,
        required=False
    )

    west = forms.FloatField(
        widget=forms.HiddenInput,
        required=False
    )

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def clean_north(self):
        north = self.cleaned_data.get("north")
        if north is None:
            north = 40
        return north

    def clean_east(self):
        east = self.cleaned_data.get("east")
        if east is None:
            east = 55
        return east

    def clean_south(self):
        south = self.cleaned_data.get("south")
        if south is None:
            south = 24
        return south

    def clean_west(self):
        west = self.cleaned_data.get("west")
        if west is None:
            west = 28
        return west

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super(UserCreationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        user.key = get_random_string()
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """A form for updating users. Includes all the fields on
    the user, but replaces the password field with admin's
    password hash display field.
    """
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name',
                  'phone_number', 'notified', 'countries_notified',
                  'is_active', 'is_admin', 'is_staff')

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]


class ProfileForm(forms.ModelForm):
    """A form for profile."""

    class Meta:
        model = User
        fields = (
            'email', 'first_name', 'last_name', 'phone_number', 'notified',
            'countries_notified', 'north', 'east', 'south', 'west')

    email = forms.EmailField(
        label=get_verbose_name(User, 'email'),
        help_text=get_help_text(User, 'email'),
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control',
                'readonly': 'readonly',
                'placeholder': 'john@doe.com'})
    )

    first_name = forms.CharField(
        label=get_verbose_name(User, 'first_name'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    last_name = forms.CharField(
        label=get_verbose_name(User, 'last_name'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    phone_number = forms.CharField(
        label=get_verbose_name(User, 'phone_number'),
        help_text=get_help_text(User, 'phone_number'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'}),
        required=False
    )

    notified = forms.BooleanField(
        label=get_verbose_name(User, 'notified'),
        help_text=get_help_text(User, 'notified'),
        widget=forms.CheckboxInput(
            attrs={'class': ''}),
        required=False
    )

    countries_notified = forms.ModelMultipleChoiceField(
        label=get_verbose_name(User, 'countries_notified'),
        help_text=get_help_text(User, 'countries_notified'),
        widget=forms.SelectMultiple(
            attrs={'class': 'form-control normal_case'}),
        required=False,
        queryset=Country.objects.order_by('name'),
    )

    north = forms.FloatField(
        label=get_verbose_name(User, 'north'),
        help_text=get_help_text(User, 'north'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    east = forms.FloatField(
        label=get_verbose_name(User, 'east'),
        help_text=get_help_text(User, 'east'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    south = forms.FloatField(
        label=get_verbose_name(User, 'south'),
        help_text=get_help_text(User, 'south'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    west = forms.FloatField(
        label=get_verbose_name(User, 'west'),
        help_text=get_help_text(User, 'west'),
        widget=forms.TextInput(
            attrs={'class': 'form-control'})
    )

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super(ProfileForm, self).__init__(*args, **kwargs)


class LoginForm(forms.Form):
    """Form for user to log in."""

    class Meta:
        """Meta of the form."""
        fields = ['email', 'password']

    email = forms.EmailField(
        label=get_verbose_name(User, 'email'),
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'john@doe.com'})
    )
    password = forms.CharField(
        label=get_verbose_name(User, 'password'),
        widget=forms.PasswordInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Your s3cr3T password'})
    )


class CustomPasswordChangeForm(PasswordChangeForm):
    """Form for changing user's password"""

    class Meta:
        """Meta of the form."""
        fields = ['old_password', 'new_password1', 'new_password2']

    old_password = forms.CharField(
        label="Old password",
        widget=forms.PasswordInput(
            attrs={'class': 'form-control'})
    )

    new_password1 = forms.CharField(
        label="New password",
        widget=forms.PasswordInput(
            attrs={'class': 'form-control'})
    )
    new_password2 = forms.CharField(
        label="New password confirmation",
        widget=forms.PasswordInput(
            attrs={'class': 'form-control'})
    )


CustomPasswordChangeForm.base_fields = OrderedDict(
    (k, CustomPasswordChangeForm.base_fields[k])
    for k in ['old_password', 'new_password1', 'new_password2']
)


class ForgotPasswordForm(forms.Form):
    """Form for report forgot password"""

    class Meta:
        """Meta of the form."""
        fields = ['email', ]

    email = forms.EmailField(
        label=get_verbose_name(User, 'email'),
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'john@doe.com'})
    )
