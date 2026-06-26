import { Component, inject, signal, OnInit } from '@angular/core';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Result, ResultSummary } from '../../shared/models';

// Valid PINs — in a real app this would be verified by the backend
const VALID_PINS = ['1234', '0000', 'SAFPOLY', 'RESULT'];

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class ResultComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  // PIN gate
  readonly pinInput = signal('');
  readonly pinVerified = signal(false);
  readonly pinError = signal<string | null>(null);
  readonly verifying = signal(false);

  // Filters
  readonly selectedSession = signal('2024/2025');
  readonly selectedSemester = signal('Second');

  // Data
  readonly resultsList = signal<Result[]>([]);
  readonly summaryData = signal<ResultSummary | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const s = this.student();
    if (s) {
      this.selectedSession.set(s.session || '2024/2025');
      this.selectedSemester.set(s.semester || 'Second');
    }
  }

  verifyPin(): void {
    const pin = this.pinInput().trim().toUpperCase();
    if (!pin) {
      this.pinError.set('Please enter a PIN.');
      return;
    }

    this.verifying.set(true);
    this.pinError.set(null);

    // Simulate a small delay for UX
    setTimeout(() => {
      if (VALID_PINS.includes(pin) || pin.length >= 4) {
        this.pinVerified.set(true);
        this.verifying.set(false);
        this.loadResults();
      } else {
        this.pinError.set('Invalid PIN. Please try again.');
        this.verifying.set(false);
      }
    }, 600);
  }

  resetPin(): void {
    this.pinVerified.set(false);
    this.pinInput.set('');
    this.pinError.set(null);
    this.resultsList.set([]);
    this.summaryData.set(null);
  }

  loadResults(): void {
    this.loading.set(true);
    this.studentService
      .getResultSummary(this.selectedSession(), this.selectedSemester())
      .subscribe({
        next: (summary) => {
          this.summaryData.set(summary);
          this.resultsList.set(summary.results);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  onFilterChange(session: string, semester: string): void {
    this.selectedSession.set(session);
    this.selectedSemester.set(semester);
    this.loadResults();
  }

  printSlip(): void {
    const s = this.student();
    const sum = this.summaryData();
    if (!s || !sum) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    let rowsHtml = '';
    sum.results.forEach((r) => {
      rowsHtml += `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #ddd">${r.courseCode}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd">${r.courseTitle}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd">${r.creditUnit}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd">${r.score}%</td>
          <td style="padding:10px;border-bottom:1px solid #ddd"><strong>${r.grade}</strong></td>
          <td style="padding:10px;border-bottom:1px solid #ddd">${r.gradePoint}</td>
        </tr>`;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Result Slip</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .school-logo { width: 80px; }
            .school-title { font-size: 1.5rem; font-weight: bold; margin-top: 10px; }
            .student-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #1e3a8a; color: white; text-align: left; padding: 10px; }
            .summary { display: flex; justify-content: space-between; background: #e2e8f0; padding: 15px; border-radius: 8px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/pasted.png" class="school-logo">
            <div class="school-title">SAF POLYTECHNIC, ISEYIN</div>
            <div>Official Semester Result Slip</div>
          </div>
          <div class="student-info">
            <div><strong>NAME:</strong> ${s.lastName} ${s.firstName}</div>
            <div><strong>MATRIC NO:</strong> ${s.matricNumber}</div>
            <div><strong>DEPARTMENT:</strong> ${s.department}</div>
            <div><strong>SEMESTER:</strong> ${sum.semester} (${sum.session})</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Course Code</th><th>Course Title</th><th>Credit Unit</th>
                <th>Score</th><th>Grade</th><th>Grade Point</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="summary">
            <span>SEMESTER GPA: ${sum.gpa}</span>
            <span>CUMULATIVE CGPA: ${sum.cgpa}</span>
            <span>TOTAL CREDITS: ${sum.totalCreditUnits}</span>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
export default ResultComponent;