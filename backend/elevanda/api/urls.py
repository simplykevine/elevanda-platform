from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, LogoutView,
    UserViewSet, DeviceVerificationViewSet,
    ClassViewSet, TimetableViewSet,
    GradeViewSet, AttendanceViewSet,
    FeeAccountViewSet,
    StudentProfileViewSet, TeacherProfileViewSet,
    DashboardStatsView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'devices', DeviceVerificationViewSet, basename='devices')
router.register(r'classes', ClassViewSet, basename='classes')
router.register(r'timetable', TimetableViewSet, basename='timetable')
router.register(r'grades', GradeViewSet, basename='grades')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'fee-accounts', FeeAccountViewSet, basename='fee-accounts')
router.register(r'students', StudentProfileViewSet, basename='students')
router.register(r'teachers', TeacherProfileViewSet, basename='teachers')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]