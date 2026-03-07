from django.db import models
from users.models import User
from academics.models import Class


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    admission_number = models.CharField(max_length=50, unique=True)
    date_of_birth = models.DateField(null=True, blank=True)
    school_class = models.ForeignKey(
        Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='students'
    )
    parent = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} ({self.admission_number})"


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_number = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    joined_at = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.full_name} ({self.employee_number})"