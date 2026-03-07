from django.db import models
from users.models import User


class FeeAccount(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='fee_account')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.full_name} — Balance: {self.balance}"


class FeeTransaction(models.Model):
    TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    account = models.ForeignKey(FeeAccount, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='processed_transactions'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account.student.full_name} — {self.transaction_type}: {self.amount}"