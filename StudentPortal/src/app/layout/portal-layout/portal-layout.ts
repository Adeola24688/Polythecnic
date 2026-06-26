import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-layout.html',
  styleUrl: './portal-layout.css',
})
export class PortalLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);
  readonly student = this.authService.currentUser;

  constructor() {
    // Lock body scroll when sidebar is open on mobile
    effect(() => {
      if (typeof window !== 'undefined') {
        if (this.sidebarOpen() && window.innerWidth <= 991) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  readonly photoUrl = computed<string | null>(() => {
    const photo = this.student()?.profilePhoto;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${environment.baseUrl}${photo}`;
  });

  closeSidebarOnMobile(): void {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth <= 991) {
      this.sidebarOpen.set(false);
    }
  }

  onLogout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
export default PortalLayoutComponent;
