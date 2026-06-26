import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Clearance } from '../../shared/models';

@Component({
  selector: 'app-clearance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './clearance.html',
  styleUrl: './clearance.css',
})
export class ClearanceComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  readonly allClearances = signal<Clearance[]>([]);
  readonly clearanceRecord = signal<Clearance | null>(null);
  readonly loading = signal(true);
  readonly requesting = signal(false);

  readonly prereqFeesPaid = signal(false);
  readonly prereqCoursesRegistered = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  pageSize = 10;

  readonly canRequestClearance = computed(
    () => this.prereqFeesPaid() && this.prereqCoursesRegistered() && !this.clearanceRecord(),
  );

  readonly fullName = computed(() => {
    const s = this.student();
    return s ? `${s.lastName} ${s.firstName} ${s.middleName || ''}`.trim() : '';
  });

  readonly levelDisplay = computed(() => {
    const s = this.student();
    return s?.level === '200' ? 'II' : 'I';
  });

  readonly sessionYear = computed(() => {
    const s = this.student();
    return s?.session?.split('/')[0] || '2024';
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
          this.allClearances.set(this.buildClearanceList(records[0]));
        } else {
          this.clearanceRecord.set(null);
          this.allClearances.set([]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildClearanceList(record: Clearance): Clearance[] {
    const rows = [
      { level: 'I', semester: 'First Semester', sessionYear: '2024' },
      { level: 'I', semester: 'Second Semester', sessionYear: '2024' },
      { level: 'II', semester: 'First Semester', sessionYear: '2025' },
      { level: 'II', semester: 'Second Semester', sessionYear: '2025' },
    ];

    return rows.map((row, i) => ({
      ...record,
      id: record.id * 10 + i,
      level: row.level,
      semester: row.semester,
      sessionYear: row.sessionYear,
      channel: 'POS',
      status: 'Downloaded',
    }));
  }

  checkPrerequisites(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

    this.studentService.getPayments(session).subscribe({
      next: (payments) => {
        const hasPaid = payments.some(
          (p) => p.purpose.toLowerCase().includes('fees') && p.status === 'Completed',
        );
        this.prereqFeesPaid.set(hasPaid);
      },
    });

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
        this.allClearances.set(this.buildClearanceList(record));
        this.requesting.set(false);
        this.successMessage.set('Clearance request submitted successfully!');
      },
      error: (err) => {
        this.requesting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to submit clearance request.');
      },
    });
  }

  // Generates a simple QR-like pattern on a canvas using a hash of the input text
  private generateQRCanvas(text: string): string {
    const size = 120;
    const cells = 21;
    const cellSize = Math.floor(size / cells);

    // Simple hash to get deterministic pattern from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#000000';

    // Draw finder patterns (3 corners — classic QR look)
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);

    // Fill data area with pseudo-random pattern based on hash
    let seed = Math.abs(hash);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        // Skip finder pattern areas
        const inTopLeft = row < 8 && col < 8;
        const inTopRight = row < 8 && col >= cells - 8;
        const inBottomLeft = row >= cells - 8 && col < 8;
        if (inTopLeft || inTopRight || inBottomLeft) continue;

        if (rand() > 0.5) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    return canvas.toDataURL('image/png');
  }

  printClearanceSlipFor(record: Clearance): void {
    const s = this.student();
    if (!s) return;

    const clearedDate = record.clearedAt
      ? new Date(record.clearedAt).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB');

    const qrText = `SAF-POLY|${s.matricNumber}|${record.semester}|${record.sessionYear || s.session}|CLEARED`;
    const qrDataUrl = this.generateQRCanvas(qrText);

    const photoSrc = s.profilePhoto
      ? s.profilePhoto.startsWith('http')
        ? s.profilePhoto
        : `http://localhost:5141${s.profilePhoto}`
      : '';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Examination Clearance</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; padding: 40px 60px; color: #222; }
            .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
            .school-logo { width: 90px; height: 90px; object-fit: contain; }
            .student-photo { width: 90px; height: 100px; object-fit: cover; border: 1px solid #ccc; }
            .school-address { text-align: center; font-size: 1rem; font-weight: bold; color: #222; flex: 1; padding: 0 1rem; }
            .date-row { text-align: right; font-size: 0.9rem; margin: 12px 0 20px 0; color: #333; }
            .doc-title { text-align: center; font-size: 1.2rem; font-weight: bold; text-decoration: underline; margin-bottom: 30px; }
            .info-table { width: 100%; margin-bottom: 60px; }
            .info-table tr td { padding: 6px 0; font-size: 0.95rem; }
            .info-table .label { width: 160px; color: #c0392b; font-weight: 600; }
            .info-table .colon { width: 20px; color: #555; }
            .info-table .value { color: #222; }
            .signature-section { margin-bottom: 40px; }
            .signature-line { width: 250px; border-bottom: 1.5px solid #333; margin-top: 30px; margin-bottom: 6px; }
            .signature-label { font-size: 0.88rem; color: #c0392b; }
            .qr-section { display: flex; justify-content: flex-end; }
            .qr-section img { width: 120px; height: 120px; }
            @media print { body { padding: 20px 40px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/pasted.png" alt="School Logo" class="school-logo" />
            <div class="school-address">SAF Polytechnic,Km 7,Oyo-Iseyin Road, Idi-Oori Iseyin.</div>
            ${photoSrc ? `<img src="${photoSrc}" alt="Student Photo" class="student-photo" />` : '<div style="width:90px"></div>'}
          </div>

          <div class="date-row">Date: ${clearedDate}</div>

          <div class="doc-title">Examination Clearance.</div>

          <table class="info-table">
            <tr>
              <td class="label">Full Name</td>
              <td class="colon">:</td>
              <td class="value">${s.lastName} ${s.firstName} ${s.middleName || ''}</td>
            </tr>
            <tr>
              <td class="label">Matric Number</td>
              <td class="colon">:</td>
              <td class="value">${s.matricNumber}</td>
            </tr>
            <tr>
              <td class="label">Department</td>
              <td class="colon">:</td>
              <td class="value">${s.department}</td>
            </tr>
            <tr>
              <td class="label">Session</td>
              <td class="colon">:</td>
              <td class="value">${record.sessionYear || s.session} Session</td>
            </tr>
            <tr>
              <td class="label">Semester</td>
              <td class="colon">:</td>
              <td class="value">${record.semester}</td>
            </tr>
          </table>

          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-label">Authorized Signature and Date</div>
          </div>

          <div class="qr-section">
            <img src="${qrDataUrl}" alt="QR Code" />
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  printClearanceSlip(): void {
    const cl = this.clearanceRecord();
    if (cl) this.printClearanceSlipFor(cl);
  }
}
export default ClearanceComponent;
