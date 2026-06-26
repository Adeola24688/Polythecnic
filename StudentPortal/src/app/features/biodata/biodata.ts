import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface SponsorData {
  name: string; relationship: string; phone: string; occupation: string; address: string;
}
interface ParentsData {
  fatherName: string; fatherPhone: string; fatherOccupation: string;
  motherName: string; motherPhone: string; motherOccupation: string;
}
interface InstitutionData {
  name: string; state: string; from: string; to: string; certificate: string;
}
interface NdResultData { institution: string; grade: string; year: string; }
interface OlevelSubject { subject: string; grade: string; }
interface OlevelData { examType: string; year: string; regNumber: string; subjects: OlevelSubject[]; }
interface JambData { regNumber: string; year: string; score: string; course: string; institution: string; }

const EMPTY_SUBJECTS = (): OlevelSubject[] =>
  Array.from({ length: 9 }, () => ({ subject: '', grade: '' }));

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

  readonly photoUrl = computed<string | null>(() => {
    const photo = this.student()?.profilePhoto;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${environment.baseUrl}${photo}`;
  });

  readonly openSections = signal<Set<string>>(new Set(['personal']));
  readonly editingSection = signal<string | null>(null);

  // Personal form
  readonly phone = signal('');
  readonly gender = signal('');
  readonly dob = signal('');
  readonly stateOfOrigin = signal('');
  readonly lga = signal('');
  readonly address = signal('');

  readonly formattedDob = computed(() => {
    const d = this.dob();
    if (!d) return '';
    return d.includes('T') ? d.split('T')[0] : d;
  });

  readonly uploadingPhoto = signal(false);
  readonly uploadPhotoError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  // Extra sections
  readonly sponsorData = signal<SponsorData>({ name: '', relationship: '', phone: '', occupation: '', address: '' });
  readonly sponsorForm = signal<SponsorData>({ name: '', relationship: '', phone: '', occupation: '', address: '' });

  readonly parentsData = signal<ParentsData>({ fatherName: '', fatherPhone: '', fatherOccupation: '', motherName: '', motherPhone: '', motherOccupation: '' });
  readonly parentsForm = signal<ParentsData>({ fatherName: '', fatherPhone: '', fatherOccupation: '', motherName: '', motherPhone: '', motherOccupation: '' });

  readonly institutionData = signal<InstitutionData>({ name: '', state: '', from: '', to: '', certificate: '' });
  readonly institutionForm = signal<InstitutionData>({ name: '', state: '', from: '', to: '', certificate: '' });

  readonly ndData = signal<NdResultData>({ institution: '', grade: '', year: '' });
  readonly ndForm = signal<NdResultData>({ institution: '', grade: '', year: '' });

  readonly olevelData = signal<OlevelData>({ examType: '', year: '', regNumber: '', subjects: EMPTY_SUBJECTS() });
  readonly olevelForm = signal<OlevelData>({ examType: '', year: '', regNumber: '', subjects: EMPTY_SUBJECTS() });

  readonly jambData = signal<JambData>({ regNumber: '', year: '', score: '', course: '', institution: '' });
  readonly jambForm = signal<JambData>({ regNumber: '', year: '', score: '', course: '', institution: '' });

  ngOnInit(): void {
    this.loadStudentIntoForm();
    this.loadExtraData();
  }

  toggleSection(section: string): void {
    const current = new Set(this.openSections());
    if (current.has(section)) { current.delete(section); } else { current.add(section); }
    this.openSections.set(current);
  }

  isSectionOpen(section: string): boolean { return this.openSections().has(section); }
  isEditing(section: string): boolean { return this.editingSection() === section; }

  startEditing(section: string): void {
    this.editingSection.set(section);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    const current = new Set(this.openSections());
    current.add(section);
    this.openSections.set(current);
    if (section === 'personal') this.loadStudentIntoForm();
    if (section === 'sponsor') this.sponsorForm.set({ ...this.sponsorData() });
    if (section === 'parents') this.parentsForm.set({ ...this.parentsData() });
    if (section === 'institution') this.institutionForm.set({ ...this.institutionData() });
    if (section === 'nd') this.ndForm.set({ ...this.ndData() });
    if (section === 'olevel') this.olevelForm.set({ ...this.olevelData(), subjects: this.olevelData().subjects.map(s => ({ ...s })) });
    if (section === 'jamb') this.jambForm.set({ ...this.jambData() });
  }

  cancelEditing(): void {
    this.editingSection.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.uploadingPhoto.set(true);
    this.uploadPhotoError.set(null);
    this.authService.uploadPhoto(file).subscribe({
      next: () => this.uploadingPhoto.set(false),
      error: (err: any) => {
        this.uploadingPhoto.set(false);
        this.uploadPhotoError.set(err.error?.message || 'Photo upload failed.');
      },
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    let dobValue: string | undefined;
    if (this.dob()) dobValue = new Date(this.dob()).toISOString();
    this.authService.updateProfile({
      phone: this.phone(), gender: this.gender(), dateOfBirth: dobValue,
      stateOfOrigin: this.stateOfOrigin(), lga: this.lga(), address: this.address(),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set('Personal information saved successfully!');
        this.editingSection.set(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save details.');
      },
    });
  }

  saveSponsor(): void { this.sponsorData.set({ ...this.sponsorForm() }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set('Sponsor information saved!'); }
  saveParents(): void { this.parentsData.set({ ...this.parentsForm() }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set('Parents/Guardian information saved!'); }
  saveInstitution(): void { this.institutionData.set({ ...this.institutionForm() }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set('Institution information saved!'); }
  saveNd(): void { this.ndData.set({ ...this.ndForm() }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set('ND Result saved!'); }
  saveOlevel(): void { this.olevelData.set({ ...this.olevelForm(), subjects: this.olevelForm().subjects.map(s => ({ ...s })) }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set("O'Level result saved!"); }
  saveJamb(): void { this.jambData.set({ ...this.jambForm() }); this.saveExtraData(); this.editingSection.set(null); this.successMessage.set('JAMB information saved!'); }

  updateOlevelSubject(index: number, field: 'subject' | 'grade', value: string): void {
    const subjects = [...this.olevelForm().subjects];
    subjects[index] = { ...subjects[index], [field]: value };
    this.olevelForm.set({ ...this.olevelForm(), subjects });
  }

  hasData(data: Record<string, any>): boolean {
    return Object.values(data).some(v => typeof v === 'string' && v.trim().length > 0);
  }

  private storageKey(): string { return `biodata_extra_${this.student()?.id || 'unknown'}`; }

  private saveExtraData(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify({
      sponsor: this.sponsorData(), parents: this.parentsData(),
      institution: this.institutionData(), ndResult: this.ndData(),
      olevel: this.olevelData(), jamb: this.jambData(),
    }));
  }

  private loadExtraData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey());
      if (!stored) return;
      const data = JSON.parse(stored);
      if (data.sponsor) this.sponsorData.set(data.sponsor);
      if (data.parents) this.parentsData.set(data.parents);
      if (data.institution) this.institutionData.set(data.institution);
      if (data.ndResult) this.ndData.set(data.ndResult);
      if (data.olevel) this.olevelData.set(data.olevel);
      if (data.jamb) this.jambData.set(data.jamb);
    } catch { /* ignore */ }
  }

  private loadStudentIntoForm(): void {
    const s = this.student();
    if (s) {
      this.phone.set(s.phone || '');
      this.gender.set(s.gender || '');
      this.dob.set(s.dateOfBirth || '');
      this.stateOfOrigin.set(s.stateOfOrigin || '');
      this.lga.set(s.lga || '');
      this.address.set(s.address || '');
    }
  }
}
export default BiodataComponent;