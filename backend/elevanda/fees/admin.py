from django.contrib import admin
from .models import FeeAccount, FeeTransaction


@admin.register(FeeAccount)
class FeeAccountAdmin(admin.ModelAdmin):
    list_display = ('student', 'balance', 'updated_at')
    search_fields = ('student__email', 'student__first_name')


@admin.register(FeeTransaction)
class FeeTransactionAdmin(admin.ModelAdmin):
    list_display = ('account', 'transaction_type', 'amount', 'status', 'created_at')
    list_filter = ('transaction_type', 'status')
    search_fields = ('account__student__email',)