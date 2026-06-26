import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Clearance } from '../../shared/models';

@Component({
  selector: 'app-clearance',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './clearance.html',
  styleUrl: './clearance.css',
})
export class ClearanceComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  // States
  readonly clearanceRecord = signal<Clearance | null>(null);
  readonly loading = signal(true);
  readonly requesting = signal(false);

  readonly prereqFeesPaid = signal(false);
  readonly prereqCoursesRegistered = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly canRequestClearance = computed(() => {
    return this.prereqFeesPaid() && this.prereqCoursesRegistered() && !this.clearanceRecord();
  });

  ngOnInit(): void {
    this.loadClearance();
    this.checkPrerequisites();
  }

  loadClearance(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

    this.loading.set(true);
    this.studentService.getClearance(session, semester).subscribe({
      next: (records) => {
        if (records && records.length > 0) {
          this.clearanceRecord.set(records[0]);
        } else {
          this.clearanceRecord.set(null);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  checkPrerequisites(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

    // Check payments
    this.studentService.getPayments(session).subscribe({
      next: (payments) => {
        const hasPaid = payments.some(
          (p) => p.purpose.toLowerCase().includes('fees') && p.status === 'Completed',
        );
        this.prereqFeesPaid.set(hasPaid);
      },
    });

    // Check courses registered
    this.studentService.getRegisteredCourses(session, semester).subscribe({
      next: (regs) => {
        this.prereqCoursesRegistered.set(regs.length > 0);
      },
    });
  }

  requestClearance(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

    this.requesting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.studentService.requestClearance(session, semester).subscribe({
      next: (record) => {
        this.clearanceRecord.set(record);
        this.requesting.set(false);
        this.successMessage.set('Clearance request submitted and approved successfully!');
      },
      error: (err) => {
        this.requesting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit clearance request.');
      },
    });
  }

  printClearanceSlip(): void {
    const s = this.student();
    const cl = this.clearanceRecord();
    if (!s || !cl) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Examination Clearance Card</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #e2e8f0; }
            .card { width: 480px; background: white; border: 3px solid #059669; border-radius: 16px; padding: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); box-sizing: border-box; }
            .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
            .school-logo { width: 70px; }
            .school-name { font-size: 1.35rem; font-weight: bold; color: #1e3a8a; margin-top: 8px; }
            .clearance-title { font-size: 1.1rem; font-weight: 800; color: #059669; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem; margin-bottom: 25px; }
            .info-label { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
            .info-value { color: #0f172a; font-weight: bold; margin-top: 2px; }
            .stamp-box { border: 2px dashed #059669; border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #059669; font-weight: bold; }
            .stamp-date { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <img src="https://student.safpoly.org/images/logo.png" class="school-logo">
              <div class="school-name">SAF POLYTECHNIC, ISEYIN</div>
              <div class="clearance-title">EXAMINATION CLEARANCE CARD</div>
            </div>
            
            <div class="info-grid">
              <div>
                <div class="info-label">Student Name</div>
                <div class="info-value">${s.lastName} ${s.firstName}</div>
              </div>
              <div>
                <div class="info-label">Matric Number</div>
                <div class="info-value">${s.matricNumber}</div>
              </div>
              <div>
                <div class="info-label">Department</div>
                <div class="info-value">${s.department}</div>
              </div>
              <div>
                <div class="info-label">Semester / Session</div>
                <div class="info-value">${cl.semester} Sem (${cl.session})</div>
              </div>
            </div>

            <div class="stamp-box">
              <span>APPROVED & CLEARED</span>
              <span class="stamp-date">Date: ${new Date(cl.clearedAt!).toLocaleDateString()}</span>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
export default ClearanceComponent;
