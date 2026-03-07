from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('teacher', 'admin')


class IsStudentOrParent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('student', 'parent')


class IsVerifiedDevice(BasePermission):
    """User must have at least one approved device."""
    message = 'Your device has not been verified by an administrator yet.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        return request.user.is_verified