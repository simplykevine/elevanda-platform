from django.contrib import admin
from .models import Class, Subject, ClassEnrollment, TeacherAssignment, Timetable, Grade, Attendance


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade_level', 'academic_year')
    search_fields = ('name', 'academic_year')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'school_class')
    search_fields = ('name', 'code')


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'score', 'max_score', 'term', 'recorded_at')
    list_filter = ('term',)
    search_fields = ('student__email', 'subject__name')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'school_class', 'date', 'status')
    list_filter = ('status', 'date')
    search_fields = ('student__email',)


admin.site.register(ClassEnrollment)
admin.site.register(TeacherAssignment)
admin.site.register(Timetable)