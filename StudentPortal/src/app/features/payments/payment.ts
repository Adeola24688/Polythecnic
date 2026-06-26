import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../shared/models';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class PaymentComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  // States
  readonly paymentsList = signal<Payment[]>([]);
  readonly loading = signal(true);
  readonly paying = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly hasPaidSchoolFees = computed(() => {
    return this.paymentsList().some(
      (p) => p.purpose.toLowerCase().includes('fees') && p.status === 'Completed',
    );
  });

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    const s = this.student();
    if (!s) return;

    this.loading.set(true);
    this.studentService.getPayments(s.session).subscribe({
      next: (payments) => {
        this.paymentsList.set(payments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  payFees(): void {
    const s = this.student();
    if (!s) return;

    if (
      !confirm(
        'You are about to record a payment of ₦150,000 for Tuition Fees. Do you want to proceed?',
      )
    ) {
      return;
    }

    this.paying.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const session = s.session || '2024/2025';

    this.studentService.makePayment(150000, 'Tuition Fees', session).subscribe({
      next: (res) => {
        this.paying.set(false);
        this.successMessage.set('Payment successfully completed!');
        this.loadPayments();
      },
      error: (err) => {
        this.paying.set(false);
        this.errorMessage.set(err.error?.message || 'Payment processing failed.');
      },
    });
  }
}
export default PaymentComponent;
