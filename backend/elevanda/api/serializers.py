import re
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_field

from users.models import User, DeviceVerification
from academics.models import Class, Subject, Grade, Attendance, Timetable, ClassEnrollment, TeacherAssignment
from fees.models import FeeAccount, FeeTransaction
from school.models import StudentProfile, TeacherProfile


class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password    = serializers.CharField(write_only=True)
    device_id   = serializers.CharField(write_only=True)
    device_name = serializers.CharField(write_only=True, required=False, default='')

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'role',
                  'password', 'device_id', 'device_name']

    def validate_role(self, value):
        if value == 'admin':
            raise ValidationError('Cannot self-register as admin.')
        return value

    def validate_password(self, value):
        if len(value) != 128 or not all(c in '0123456789abcdef' for c in value.lower()):
            raise ValidationError('Invalid password format. The client must send a SHA-512 hex digest.')
        return value

    def create(self, validated_data):
        device_id   = validated_data.pop('device_id')
        device_name = validated_data.pop('device_name', '')
        password    = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        DeviceVerification.objects.create(
            user=user,
            device_id=device_id,
            device_name=device_name,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True)
    device_id = serializers.CharField()


class DeviceVerificationSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model  = DeviceVerification
        fields = [
            'id', 'user', 'device_id', 'device_name',
            'ip_address', 'status', 'requested_at', 'verified_at',
        ]
        read_only_fields = ['id', 'user', 'requested_at', 'verified_at']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = ['id', 'name', 'code', 'school_class']


class ClassSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model  = Class
        fields = ['id', 'name', 'grade_level', 'academic_year', 'subjects']


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name',      read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    class_name   = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model  = Timetable
        fields = ['id', 'class_name', 'subject_name', 'teacher_name',
                  'day', 'start_time', 'end_time', 'room']


class GradeSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name',      read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    percentage   = serializers.FloatField(read_only=True)

    class Meta:
        model  = Grade
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'teacher', 'teacher_name', 'score', 'max_score', 'percentage',
            'term', 'exam_type', 'recorded_at',
        ]
        read_only_fields = ['id', 'recorded_at']


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    class_name   = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model  = Attendance
        fields = [
            'id', 'student', 'student_name', 'school_class', 'class_name',
            'date', 'status', 'notes', 'recorded_by', 'recorded_at',
        ]
        read_only_fields = ['id', 'recorded_at']


class FeeTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeeTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'status', 'description',
            'reference', 'created_at', 'processed_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'processed_at']

    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError('Amount must be greater than zero.')
        return value


class FeeAccountSerializer(serializers.ModelSerializer):
    student             = UserPublicSerializer(read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model  = FeeAccount
        fields = ['id', 'student', 'balance', 'updated_at', 'recent_transactions']

    @extend_schema_field(FeeTransactionSerializer(many=True))
    def get_recent_transactions(self, obj):
        qs = obj.transactions.all()[:10]
        return FeeTransactionSerializer(qs, many=True).data


class StudentProfileSerializer(serializers.ModelSerializer):
    user       = UserPublicSerializer(read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model  = StudentProfile
        fields = ['id', 'user', 'admission_number', 'date_of_birth', 'school_class', 'class_name']


class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model  = TeacherProfile
        fields = ['id', 'user', 'employee_number', 'department', 'qualification', 'joined_at']


class DashboardStatsSerializer(serializers.Serializer):
    total_students      = serializers.IntegerField()
    total_teachers      = serializers.IntegerField()
    total_classes       = serializers.IntegerField()
    total_fee_collected = serializers.DecimalField(max_digits=14, decimal_places=2)
    pending_devices     = serializers.IntegerField()
    attendance_rate     = serializers.FloatField()