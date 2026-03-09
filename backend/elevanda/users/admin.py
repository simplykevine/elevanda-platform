from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from .models import User, DeviceVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'role', 'is_verified', 'is_active', 'created_at')
    list_filter = ('role', 'is_verified', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    list_editable = ('is_verified',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(DeviceVerification)
class DeviceVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_id', 'device_name', 'status', 'requested_at', 'verified_at', 'verified_by')
    list_filter = ('status',)
    search_fields = ('user__email', 'device_id')
    ordering = ('-requested_at',)
    readonly_fields = ('requested_at', 'verified_at', 'verified_by')
    actions = ['approve_devices', 'reject_devices']

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            if obj.status == 'approved':
                obj.verified_at = timezone.now()
                obj.verified_by = request.user
                super().save_model(request, obj, form, change)
                obj.user.is_verified = True
                obj.user.save(update_fields=['is_verified'])
                return
            elif obj.status == 'rejected':
                obj.verified_at = timezone.now()
                obj.verified_by = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description='Approve selected devices')
    def approve_devices(self, request, queryset):
        count = 0
        for device in queryset:
            if device.status != 'approved':
                device.status = 'approved'
                device.verified_at = timezone.now()
                device.verified_by = request.user
                device.save()
                device.user.is_verified = True
                device.user.save(update_fields=['is_verified'])
                count += 1
        self.message_user(request, f'{count} device(s) approved successfully.')

    @admin.action(description='Reject selected devices')
    def reject_devices(self, request, queryset):
        count = 0
        for device in queryset:
            if device.status != 'rejected':
                device.status = 'rejected'
                device.verified_at = timezone.now()
                device.verified_by = request.user
                device.save()
                count += 1
        self.message_user(request, f'{count} device(s) rejected.')