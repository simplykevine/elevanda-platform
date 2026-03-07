from django.db import models
from users.models import User


class Class(models.Model):
    name = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=20)
    academic_year = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'classes'
        unique_together = ['name', 'academic_year']
        ordering = ['grade_level', 'name']

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='subjects')

    def __str__(self):
        return f"{self.code} — {self.name}"


class ClassEnrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'school_class']

    def __str__(self):
        return f"{self.student.full_name} in {self.school_class.name}"


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='teacher_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['teacher', 'subject', 'school_class']

    def __str__(self):
        return f"{self.teacher.full_name} → {self.subject.name} ({self.school_class.name})"


class Timetable(models.Model):
    DAY_CHOICES = [
        ('monday', 'Monday'), ('tuesday', 'Tuesday'), ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'), ('friday', 'Friday'),
    ]
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='timetable')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timetable')
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.school_class.name} — {self.subject.name} — {self.day}"


class Grade(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='grades')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades_given')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    term = models.CharField(max_length=30)
    exam_type = models.CharField(max_length=50, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.student.full_name} — {self.subject.name}: {self.score}"

    @property
    def percentage(self):
        if self.max_score > 0:
            return round(float(self.score) / float(self.max_score) * 100, 1)
        return 0


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance')
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='attendance_recorded'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'school_class', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.full_name} — {self.date} — {self.status}"