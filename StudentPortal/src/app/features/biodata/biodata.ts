import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-biodata',
  standalone: true,
  templateUrl: './biodata.html',
  styleUrl: './biodata.css',
})
export class BiodataComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  readonly fullName = computed(() => {
    const s = this.student();
    return s ? `${s.lastName} ${s.firstName} ${s.middleName || ''}`.trim() : '';
  });

  readonly phone = signal('');
  readonly gender = signal('');
  readonly dob = signal('');
  readonly stateOfOrigin = signal('');
  readonly lga = signal('');
  readonly address = signal('');
  readonly profilePhotoUrl = signal('');

  readonly formattedDob = computed(() => {
    const d = this.dob();
    if (!d) return '';
    if (d.includes('T')) {
      return d.split('T')[0];
    }
    return d;
  });

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  ngOnInit(): void {
    const s = this.student();
    if (s) {
      this.phone.set(s.phone || '');
      this.gender.set(s.gender || '');
      this.dob.set(s.dateOfBirth || '');
      this.stateOfOrigin.set(s.stateOfOrigin || '');
      this.lga.set(s.lga || '');
      this.address.set(s.address || '');
      this.profilePhotoUrl.set(s.profilePhoto || '');
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Prepare date
    let dobValue: string | undefined = undefined;
    if (this.dob()) {
      dobValue = new Date(this.dob()).toISOString();
    }

    this.authService
      .updateProfile({
        phone: this.phone(),
        gender: this.gender(),
        dateOfBirth: dobValue,
        stateOfOrigin: this.stateOfOrigin(),
        lga: this.lga(),
        address: this.address(),
        profilePhoto: this.profilePhotoUrl(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.successMessage.set('Biodata details saved successfully!');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to save details.');
        },
      });
  }
}
export default BiodataComponent;
