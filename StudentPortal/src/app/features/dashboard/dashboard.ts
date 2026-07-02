import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;
  readonly dashboardData = signal<DashboardData | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.studentService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private generateQRCanvas(text: string): string {
    const size = 120;
    const cells = 21;
    const cellSize = Math.floor(size / cells);

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    const drawFinder = (x: number, y: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);

    let seed = Math.abs(hash);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
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

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    return canvas.toDataURL('image/png');
  }

  downloadIDCard(): void {
    if (!this.dashboardData()?.hasBiodata) {
      alert('Please fill out your Biodata before downloading the ID card.');
      return;
    }

    const s = this.student();
    if (!s) return;

    const fullName = `${s.lastName} ${s.firstName} ${s.middleName || ''}`.toUpperCase().trim();
    const faculty = s.faculty || 'Sciences';
    const sessionYear = s.session
      ? s.session.toLowerCase().includes('session')
        ? s.session
        : `${s.session} Session`
      : '2025/2026 Session';

    const currentDate = new Date().toLocaleDateString('en-GB');

    const photoSrc = s.profilePhoto
      ? s.profilePhoto.startsWith('http')
        ? s.profilePhoto
        : `${environment.baseUrl}${s.profilePhoto}`
      : '';

    const qrText = `SAF-POLY-ID|${s.matricNumber}|${s.department}|${s.session}`;
    const qrDataUrl = this.generateQRCanvas(qrText);

    const idWindow = window.open('', '_blank', 'width=900,height=700');
    if (!idWindow) return;

    idWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; padding: 40px 80px; color: #222; }

            .header {
              position: relative;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 15px;
              min-height: 100px;
            }

            .school-logo { height: 90px; object-fit: contain; }

            .student-photo {
              position: absolute;
              top: 0;
              right: 0;
              width: 90px;
              height: 100px;
              object-fit: cover;
              border: 1px solid #ccc;
            }

            .school-address {
              text-align: center;
              font-size: 1.35rem;
              font-weight: bold;
              color: #222;
              margin-bottom: 10px;
            }

            .date-row {
              text-align: right;
              font-size: 0.95rem;
              margin: 15px 0 35px 0;
              color: #222;
            }

            .doc-title {
              text-align: center;
              font-size: 1.3rem;
              font-weight: bold;
              margin-bottom: 40px;
            }

            .info-table {
              width: 100%;
              margin-bottom: 60px;
              border-collapse: collapse;
            }

            .info-table tr td {
              padding: 8px 0;
              font-size: 1.05rem;
              vertical-align: top;
            }

            .info-table .label {
              width: 180px;
              font-weight: normal;
              color: #555;
            }

            .info-table .label.highlight {
              color: #c0392b;
              font-weight: 600;
            }

            .info-table .value { color: #222; }

            .footer-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 50px;
            }

            .signature-section {}

            .signature-line {
              width: 250px;
              border-bottom: 1.5px solid #222;
              margin-bottom: 8px;
            }

            .signature-label { font-size: 0.95rem; color: #222; }

            .qr-code { width: 120px; height: 120px; }

            @media print { body { padding: 20px 40px; } }
          </style>
        </head>
        <body>

          <!-- Header -->
          <div class="header">
            <img src="/pasted.png" alt="School Logo" class="school-logo" />
            ${photoSrc ? `<img src="${photoSrc}" alt="Student Photo" class="student-photo" />` : ''}
          </div>

          <!-- School address -->
          <div class="school-address">SAF Polytechnic,Km 7,Oyo-Iseyin Road, Idi-Oori Iseyin.</div>

          <!-- Date -->
          <div class="date-row">Date:${currentDate}</div>

          <!-- Title -->
          <div class="doc-title">IDENTITY CARD DATA.</div>

          <!-- Info table -->
          <table class="info-table">
            <tr>
              <td class="label highlight">Full Name:</td>
              <td class="value">${fullName}</td>
            </tr>
            <tr>
              <td class="label">Matric Number:</td>
              <td class="value">${s.matricNumber}</td>
            </tr>
            <tr>
              <td class="label">Faculty:</td>
              <td class="value">${faculty}</td>
            </tr>
            <tr>
              <td class="label">Department:</td>
              <td class="value">${s.department}</td>
            </tr>
            <tr>
              <td class="label">Session:</td>
              <td class="value">${sessionYear}</td>
            </tr>
          </table>

          <!-- Footer: signature left, QR right -->
          <div class="footer-row">
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Signature and Date</div>
            </div>
            <img src="${qrDataUrl}" alt="QR Code" class="qr-code" />
          </div>

          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    idWindow.document.close();
  }
}
export default DashboardComponent;
