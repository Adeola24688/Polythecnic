import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private readonly authService = inject(AuthService);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  onChangePassword(event: Event): void {
    event.preventDefault();
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.newPassword().length < 6) {
      this.errorMessage.set('New password must be at least 6 characters long.');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('New passwords do not match.');
      return;
    }

    this.submitting.set(true);

    this.authService
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: (res: any) => {
          this.submitting.set(false);
          this.successMessage.set(res.message || 'Password updated successfully.');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmPassword.set('');
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update password.');
        },
      });
  }
}
export default SettingsComponent;
