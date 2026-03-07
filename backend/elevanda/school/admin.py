from django.contrib import admin
from .models import StudentProfile, TeacherProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'admission_number', 'school_class', 'parent')
    search_fields = ('user__email', 'admission_number')
    list_filter = ('school_class',)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_number', 'department')
    search_fields = ('user__email', 'employee_number')