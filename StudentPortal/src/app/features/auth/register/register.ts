import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly matricNumber = signal('');
  readonly department = signal('');
  readonly level = signal('100');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(event: Event): void {
    event.preventDefault();

    if (
      !this.firstName() ||
      !this.lastName() ||
      !this.email() ||
      !this.matricNumber() ||
      !this.department() ||
      !this.password()
    ) {
      this.errorMessage.set('All fields are required.');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({
        firstName: this.firstName(),
        lastName: this.lastName(),
        email: this.email(),
        matricNumber: this.matricNumber(),
        department: this.department(),
        level: this.level(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Registration failed. Please check your inputs.',
          );
        },
      });
  }
}
export default RegisterComponent;
