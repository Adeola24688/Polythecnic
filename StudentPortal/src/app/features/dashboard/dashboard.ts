import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData } from '../../shared/models';

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

  downloadIDCard(): void {
    if (!this.dashboardData()?.hasBiodata) {
      alert('Please fill out your Biodata settings before downloading the ID card.');
      return;
    }

    // Generate a simple print-window mock ID card
    const s = this.student();
    if (!s) return;

    const idWindow = window.open('', '_blank', 'width=450,height=600');
    if (!idWindow) return;

    idWindow.document.write(`
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
            .card { width: 320px; height: 480px; background: white; border-radius: 16px; border: 2px solid #1e3a8a; box-shadow: 0 10px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
            .header { background: #1e3a8a; color: white; padding: 16px; text-align: center; font-weight: bold; }
            .content { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 24px; }
            .avatar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid #e2e8f0; object-fit: cover; margin-bottom: 16px; }
            .name { font-size: 1.15rem; font-weight: bold; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
            .matric { font-size: 0.95rem; color: #2563eb; font-weight: 600; margin-bottom: 24px; }
            .detail { font-size: 0.85rem; color: #475569; width: 100%; display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            .footer { background: #0f172a; color: #94a3b8; text-align: center; font-size: 0.75rem; padding: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">SAF POLYTECHNIC, ISEYIN</div>
            <div class="content">
              <img src="${s.profilePhoto || 'https://i.pravatar.cc/150?img=68'}" class="avatar">
              <div class="name">${s.lastName} ${s.firstName}</div>
              <div class="matric">${s.matricNumber}</div>
              <div class="detail"><span>DEPARTMENT</span> <strong>${s.department}</strong></div>
              <div class="detail"><span>LEVEL</span> <strong>${s.level} L</strong></div>
              <div class="detail"><span>SESSION</span> <strong>${s.session || '2024/2025'}</strong></div>
            </div>
            <div class="footer">VALID FOR EXAMINATIONS</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    idWindow.document.close();
  }
}
export default DashboardComponent;
