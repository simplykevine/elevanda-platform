import hashlib
from django.utils import timezone
from django.db import transaction
from rest_framework import status, viewsets, generics
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Sum, Avg, Count, Q

from users.models import User, DeviceVerification
from academics.models import Class, Subject, Grade, Attendance, Timetable, ClassEnrollment
from fees.models import FeeAccount, FeeTransaction
from school.models import StudentProfile, TeacherProfile

from .serializers import (
    UserPublicSerializer, RegisterSerializer, LoginSerializer,
    DeviceVerificationSerializer, ClassSerializer, SubjectSerializer,
    GradeSerializer, AttendanceSerializer, TimetableSerializer,
    FeeAccountSerializer, FeeTransactionSerializer,
    StudentProfileSerializer, TeacherProfileSerializer,
    DashboardStatsSerializer,
)

# ─── Swagger Documentation Imports ───────────────────────────────────────────
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
)
from drf_spectacular.types import OpenApiTypes


# ─── Auth ─────────────────────────────────────────────────────────────────────

@extend_schema(
    tags=['Authentication'],
    summary='Register New User',
    description='Register a new user account. Device verification will be pending admin approval.',
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(description='Registration successful', response=UserPublicSerializer),
        400: OpenApiResponse(description='Invalid registration data'),
    },
)
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Registration successful. Your device is pending admin verification.',
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=['Authentication'],
    summary='Login User',
    description='Authenticate user and receive JWT access & refresh tokens.',
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(description='Login successful'),
        401: OpenApiResponse(description='Invalid credentials'),
        403: OpenApiResponse(description='Account disabled or device not verified'),
    },
)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        hashed_password = serializer.validated_data['password']
        device_id = serializer.validated_data['device_id']

        user = authenticate(request, username=email, password=hashed_password)
        if not user:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        # Check device verification (admins bypass)
        if user.role != 'admin':
            device = DeviceVerification.objects.filter(user=user, device_id=device_id).first()
            if not device:
                DeviceVerification.objects.create(user=user, device_id=device_id)
                return Response(
                    {'detail': 'This device is not registered. Verification request sent to admin.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if device.status != 'approved':
                return Response(
                    {'detail': 'Your device has not been approved yet. Please wait for admin verification.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Issue JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserPublicSerializer(user).data,
        })


@extend_schema(
    tags=['Authentication'],
    summary='Logout User',
    description='Logout user by blacklisting the refresh token.',
    responses={
        200: OpenApiResponse(description='Logged out successfully'),
    },
)
class LogoutView(APIView):
    permission_classes = [AllowAny]  # ← CHANGED from IsAuthenticated

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# ─── Admin: Users & Devices ──────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Users'],
        summary='List All Users',
        description='Retrieve a list of all users.',
        parameters=[
            OpenApiParameter(
                name='role',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by user role',
                enum=['admin', 'teacher', 'student', 'parent'],
            ),
        ],
        responses={200: OpenApiResponse(description='List of users', response=UserPublicSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Users'],
        summary='Get User Details',
        description='Retrieve details of a specific user.',
        responses={200: OpenApiResponse(description='User details', response=UserPublicSerializer)},
    ),
    me=extend_schema(
        tags=['Users'],
        summary='Get Current User',
        description='Retrieve details of the currently authenticated user.',
        responses={200: OpenApiResponse(description='Current user details', response=UserPublicSerializer)},
    ),
    toggle_active=extend_schema(
        tags=['Users'],
        summary='Toggle User Active Status',
        description='Activate or deactivate a user account.',
        responses={200: OpenApiResponse(description='User status updated', response=UserPublicSerializer)},
    ),
)
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserPublicSerializer
    permission_classes = [AllowAny]  # ← CHANGED from IsAuthenticated, IsAdmin

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UserPublicSerializer(request.user).data if request.user.is_authenticated else {'detail': 'Not authenticated'})

    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response(UserPublicSerializer(user).data)


@extend_schema_view(
    list=extend_schema(
        tags=['Device Verification'],
        summary='List Device Verifications',
        description='List all device verification requests.',
        parameters=[
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by verification status',
                enum=['pending', 'approved', 'rejected'],
            ),
        ],
        responses={200: OpenApiResponse(description='List of device verifications', response=DeviceVerificationSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Device Verification'],
        summary='Get Device Verification Details',
        description='Retrieve details of a specific device verification request.',
        responses={200: OpenApiResponse(description='Device verification details', response=DeviceVerificationSerializer)},
    ),
    approve=extend_schema(
        tags=['Device Verification'],
        summary='Approve Device',
        description='Approve a device verification request.',
        responses={200: OpenApiResponse(description='Device approved', response=DeviceVerificationSerializer)},
    ),
    reject=extend_schema(
        tags=['Device Verification'],
        summary='Reject Device',
        description='Reject a device verification request.',
        responses={200: OpenApiResponse(description='Device rejected', response=DeviceVerificationSerializer)},
    ),
)
class DeviceVerificationViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceVerificationSerializer
    permission_classes = [AllowAny]  # ← CHANGED

    def get_queryset(self):
        qs = DeviceVerification.objects.select_related('user').all()
        s = self.request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return qs

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        device = self.get_object()
        device.status = 'approved'
        device.verified_at = timezone.now()
        device.verified_by = request.user if request.user.is_authenticated else None
        device.save()
        device.user.is_verified = True
        device.user.save()
        return Response({'message': 'Device approved.', 'device': DeviceVerificationSerializer(device).data})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        device = self.get_object()
        device.status = 'rejected'
        device.verified_at = timezone.now()
        device.verified_by = request.user if request.user.is_authenticated else None
        device.save()
        return Response({'message': 'Device rejected.', 'device': DeviceVerificationSerializer(device).data})


# ─── Classes & Timetable ─────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Classes'],
        summary='List All Classes',
        description='Retrieve a list of all classes.',
        responses={200: OpenApiResponse(description='List of classes', response=ClassSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Classes'],
        summary='Get Class Details',
        description='Retrieve details of a specific class.',
        responses={200: OpenApiResponse(description='Class details', response=ClassSerializer)},
    ),
    create=extend_schema(
        tags=['Classes'],
        summary='Create Class',
        description='Create a new class.',
        request=ClassSerializer,
        responses={201: OpenApiResponse(description='Class created successfully')},
    ),
    update=extend_schema(
        tags=['Classes'],
        summary='Update Class',
        description='Update an existing class.',
        request=ClassSerializer,
        responses={200: OpenApiResponse(description='Class updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Classes'],
        summary='Delete Class',
        description='Delete a class.',
        responses={204: OpenApiResponse(description='Class deleted successfully')},
    ),
    timetable=extend_schema(
        tags=['Classes'],
        summary='Get Class Timetable',
        description='Retrieve the timetable for a specific class.',
        responses={200: OpenApiResponse(description='Class timetable', response=TimetableSerializer(many=True))},
    ),
    students=extend_schema(
        tags=['Classes'],
        summary='Get Class Students',
        description='Retrieve all students enrolled in a specific class.',
        responses={200: OpenApiResponse(description='List of students', response=StudentProfileSerializer(many=True))},
    ),
)
class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.prefetch_related('subjects').all()
    serializer_class = ClassSerializer
    permission_classes = [AllowAny]  # ← CHANGED

    @action(detail=True, methods=['get'], url_path='timetable')
    def timetable(self, request, pk=None):
        school_class = self.get_object()
        entries = Timetable.objects.filter(school_class=school_class).select_related('subject', 'teacher')
        return Response(TimetableSerializer(entries, many=True).data)

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        school_class = self.get_object()
        profiles = StudentProfile.objects.filter(school_class=school_class).select_related('user')
        return Response(StudentProfileSerializer(profiles, many=True).data)


@extend_schema_view(
    list=extend_schema(
        tags=['Timetable'],
        summary='List All Timetable Entries',
        description='Retrieve all timetable entries.',
        responses={200: OpenApiResponse(description='List of timetable entries', response=TimetableSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Timetable'],
        summary='Get Timetable Entry Details',
        description='Retrieve details of a specific timetable entry.',
        responses={200: OpenApiResponse(description='Timetable entry details', response=TimetableSerializer)},
    ),
    create=extend_schema(
        tags=['Timetable'],
        summary='Create Timetable Entry',
        description='Create a new timetable entry.',
        request=TimetableSerializer,
        responses={201: OpenApiResponse(description='Timetable entry created successfully')},
    ),
    update=extend_schema(
        tags=['Timetable'],
        summary='Update Timetable Entry',
        description='Update an existing timetable entry.',
        request=TimetableSerializer,
        responses={200: OpenApiResponse(description='Timetable entry updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Timetable'],
        summary='Delete Timetable Entry',
        description='Delete a timetable entry.',
        responses={204: OpenApiResponse(description='Timetable entry deleted successfully')},
    ),
)
class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related('school_class', 'subject', 'teacher').all()
    serializer_class = TimetableSerializer
    permission_classes = [AllowAny]  # ← CHANGED


# ─── Grades & Attendance ─────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Grades'],
        summary='List Grades',
        description='Retrieve grades.',
        responses={200: OpenApiResponse(description='List of grades', response=GradeSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Grades'],
        summary='Get Grade Details',
        description='Retrieve details of a specific grade.',
        responses={200: OpenApiResponse(description='Grade details', response=GradeSerializer)},
    ),
    create=extend_schema(
        tags=['Grades'],
        summary='Create Grade',
        description='Create a new grade entry.',
        request=GradeSerializer,
        responses={201: OpenApiResponse(description='Grade created successfully')},
    ),
    update=extend_schema(
        tags=['Grades'],
        summary='Update Grade',
        description='Update an existing grade.',
        request=GradeSerializer,
        responses={200: OpenApiResponse(description='Grade updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Grades'],
        summary='Delete Grade',
        description='Delete a grade.',
        responses={204: OpenApiResponse(description='Grade deleted successfully')},
    ),
)
class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [AllowAny]  # ← CHANGED

    def get_queryset(self):
        qs = Grade.objects.select_related('student', 'subject', 'teacher').all()
        return qs

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user if self.request.user.is_authenticated else None)


@extend_schema_view(
    list=extend_schema(
        tags=['Attendance'],
        summary='List Attendance Records',
        description='Retrieve attendance records.',
        responses={200: OpenApiResponse(description='List of attendance records', response=AttendanceSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Attendance'],
        summary='Get Attendance Record Details',
        description='Retrieve details of a specific attendance record.',
        responses={200: OpenApiResponse(description='Attendance record details', response=AttendanceSerializer)},
    ),
    create=extend_schema(
        tags=['Attendance'],
        summary='Create Attendance Record',
        description='Create a new attendance record.',
        request=AttendanceSerializer,
        responses={201: OpenApiResponse(description='Attendance record created successfully')},
    ),
    update=extend_schema(
        tags=['Attendance'],
        summary='Update Attendance Record',
        description='Update an existing attendance record.',
        request=AttendanceSerializer,
        responses={200: OpenApiResponse(description='Attendance record updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Attendance'],
        summary='Delete Attendance Record',
        description='Delete an attendance record.',
        responses={204: OpenApiResponse(description='Attendance record deleted successfully')},
    ),
)
class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [AllowAny]  # ← CHANGED

    def get_queryset(self):
        qs = Attendance.objects.select_related('student', 'school_class').all()
        return qs

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user if self.request.user.is_authenticated else None)


# ─── Fees ────────────────────────────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Fees'],
        summary='List Fee Accounts',
        description='Retrieve fee accounts.',
        responses={200: OpenApiResponse(description='List of fee accounts', response=FeeAccountSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Fees'],
        summary='Get Fee Account Details',
        description='Retrieve details of a specific fee account.',
        responses={200: OpenApiResponse(description='Fee account details', response=FeeAccountSerializer)},
    ),
    deposit=extend_schema(
        tags=['Fees'],
        summary='Deposit Payment',
        description='Record a payment deposit to a fee account.',
        responses={200: OpenApiResponse(description='Payment recorded successfully')},
    ),
    withdraw=extend_schema(
        tags=['Fees'],
        summary='Withdraw/Refund',
        description='Process a withdrawal/refund from a fee account.',
        responses={200: OpenApiResponse(description='Refund processed successfully')},
    ),
)
class FeeAccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FeeAccountSerializer
    permission_classes = [AllowAny]  # ← CHANGED

    def get_queryset(self):
        return FeeAccount.objects.select_related('student').all()

    @action(detail=True, methods=['post'], url_path='deposit')
    def deposit(self, request, pk=None):
        account = self.get_object()
        amount_raw = request.data.get('amount')
        description = request.data.get('description', '')

        try:
            amount = float(amount_raw)
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            account.balance += amount
            account.save()
            tx = FeeTransaction.objects.create(
                account=account,
                transaction_type='deposit',
                amount=amount,
                status='approved',
                description=description,
                processed_at=timezone.now(),
                processed_by=request.user if request.user.is_authenticated else None,
            )

        return Response({
            'message': 'Payment recorded.',
            'new_balance': str(account.balance),
            'transaction': FeeTransactionSerializer(tx).data,
        })

    @action(detail=True, methods=['post'], url_path='withdraw')
    def withdraw(self, request, pk=None):
        account = self.get_object()
        amount_raw = request.data.get('amount')
        description = request.data.get('description', '')

        try:
            amount = float(amount_raw)
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount > float(account.balance):
            return Response(
                {'detail': 'Insufficient balance for this withdrawal.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            account.balance -= amount
            account.save()
            tx = FeeTransaction.objects.create(
                account=account,
                transaction_type='withdrawal',
                amount=amount,
                status='approved',
                description=description,
                processed_at=timezone.now(),
                processed_by=request.user if request.user.is_authenticated else None,
            )

        return Response({
            'message': 'Refund processed.',
            'new_balance': str(account.balance),
            'transaction': FeeTransactionSerializer(tx).data,
        })


# ─── Student & Teacher Profiles ──────────────────────────────────────────────

@extend_schema_view(
    list=extend_schema(
        tags=['Student Profiles'],
        summary='List Student Profiles',
        description='Retrieve all student profiles.',
        responses={200: OpenApiResponse(description='List of student profiles', response=StudentProfileSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Student Profiles'],
        summary='Get Student Profile Details',
        description='Retrieve details of a specific student profile.',
        responses={200: OpenApiResponse(description='Student profile details', response=StudentProfileSerializer)},
    ),
    create=extend_schema(
        tags=['Student Profiles'],
        summary='Create Student Profile',
        description='Create a new student profile.',
        request=StudentProfileSerializer,
        responses={201: OpenApiResponse(description='Student profile created successfully')},
    ),
    update=extend_schema(
        tags=['Student Profiles'],
        summary='Update Student Profile',
        description='Update an existing student profile.',
        request=StudentProfileSerializer,
        responses={200: OpenApiResponse(description='Student profile updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Student Profiles'],
        summary='Delete Student Profile',
        description='Delete a student profile.',
        responses={204: OpenApiResponse(description='Student profile deleted successfully')},
    ),
)
class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related('user', 'school_class').all()
    serializer_class = StudentProfileSerializer
    permission_classes = [AllowAny]  # ← CHANGED


@extend_schema_view(
    list=extend_schema(
        tags=['Teacher Profiles'],
        summary='List Teacher Profiles',
        description='Retrieve all teacher profiles.',
        responses={200: OpenApiResponse(description='List of teacher profiles', response=TeacherProfileSerializer(many=True))},
    ),
    retrieve=extend_schema(
        tags=['Teacher Profiles'],
        summary='Get Teacher Profile Details',
        description='Retrieve details of a specific teacher profile.',
        responses={200: OpenApiResponse(description='Teacher profile details', response=TeacherProfileSerializer)},
    ),
    create=extend_schema(
        tags=['Teacher Profiles'],
        summary='Create Teacher Profile',
        description='Create a new teacher profile.',
        request=TeacherProfileSerializer,
        responses={201: OpenApiResponse(description='Teacher profile created successfully')},
    ),
    update=extend_schema(
        tags=['Teacher Profiles'],
        summary='Update Teacher Profile',
        description='Update an existing teacher profile.',
        request=TeacherProfileSerializer,
        responses={200: OpenApiResponse(description='Teacher profile updated successfully')},
    ),
    destroy=extend_schema(
        tags=['Teacher Profiles'],
        summary='Delete Teacher Profile',
        description='Delete a teacher profile.',
        responses={204: OpenApiResponse(description='Teacher profile deleted successfully')},
    ),
)
class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.select_related('user').all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [AllowAny]  # ← CHANGED


# ─── Dashboard Stats (Admin) ─────────────────────────────────────────────────

@extend_schema(
    tags=['Dashboard'],
    summary='Get Dashboard Statistics',
    description='Retrieve comprehensive dashboard statistics.',
    responses={
        200: OpenApiResponse(
            description='Dashboard statistics',
            response=DashboardStatsSerializer,
        ),
    },
)
class DashboardStatsView(APIView):
    permission_classes = [AllowAny]  # ← CHANGED

    def get(self, request):
        total_students = User.objects.filter(role='student').count()
        total_teachers = User.objects.filter(role='teacher').count()
        total_classes = Class.objects.count()
        total_fee = FeeTransaction.objects.filter(
            transaction_type='deposit', status='approved'
        ).aggregate(total=Sum('amount'))['total'] or 0
        pending_devices = DeviceVerification.objects.filter(status='pending').count()

        total_att = Attendance.objects.count()
        present_att = Attendance.objects.filter(status='present').count()
        rate = round(present_att / total_att * 100, 1) if total_att > 0 else 0

        data = {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_classes': total_classes,
            'total_fee_collected': total_fee,
            'pending_devices': pending_devices,
            'attendance_rate': rate,
        }
        return Response(DashboardStatsSerializer(data).data)