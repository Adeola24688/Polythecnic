import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Course, CourseRegistration } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registration',
  standalone: true,
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class CourseRegistrationComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly authService = inject(AuthService);

  readonly student = this.authService.currentUser;

  // Tabs
  readonly activeTab = signal<'register' | 'report'>('register');

  // Left panel selection
  readonly selectedLevel = signal<string>('ND I');
  readonly selectedSemester = signal<string>('First');

  // Computed display values
  readonly photoUrl = computed<string | null>(() => {
    const photo = this.student()?.profilePhoto;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${environment.baseUrl}${photo}`;
  });

  readonly fullName = computed(() => {
    const s = this.student();
    return s ? `${s.lastName} ${s.firstName} ${s.middleName || ''}`.trim() : '';
  });

  // Course data
  readonly availableCourses = signal<Course[]>([]);
  readonly registeredRegistrations = signal<CourseRegistration[]>([]);
  readonly selectedCourseIds = signal<number[]>([]);
  readonly selectedCredits = signal(0);

  // Loading / action states
  readonly loadingAvailable = signal(true);
  readonly loadingRegistered = signal(true);
  readonly registering = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly totalRegisteredCredits = computed(() =>
    this.registeredRegistrations().reduce((acc, r) => acc + r.creditUnit, 0)
  );

  ngOnInit(): void {
    const s = this.student();
    if (s) {
      const level = s.level || '100';
      this.selectedLevel.set(level === '100' ? 'ND I' : 'ND II');
      this.selectedSemester.set(s.semester || 'First');
    }
    this.loadData();
  }

  selectSemester(level: string, semester: string): void {
    this.selectedLevel.set(level);
    this.selectedSemester.set(semester);
    this.selectedCourseIds.set([]);
    this.selectedCredits.set(0);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.loadData();
  }

  isSelectedSemester(level: string, semester: string): boolean {
    return this.selectedLevel() === level && this.selectedSemester() === semester;
  }

  hasRegistrations(level: string, semester: string): boolean {
    return this.isSelectedSemester(level, semester) && this.registeredRegistrations().length > 0;
  }

  loadData(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = this.selectedSemester();
    const numericLevel = this.selectedLevel() === 'ND I' ? '100' : '200';

    this.loadingAvailable.set(true);
    this.studentService.getAvailableCourses(s.department, numericLevel, semester).subscribe({
      next: (courses) => {
        this.availableCourses.set(courses);
        this.loadingAvailable.set(false);
      },
      error: () => this.loadingAvailable.set(false),
    });

    this.loadingRegistered.set(true);
    this.studentService.getRegisteredCourses(session, semester).subscribe({
      next: (registrations) => {
        this.registeredRegistrations.set(registrations);
        this.loadingRegistered.set(false);
      },
      error: () => this.loadingRegistered.set(false),
    });
  }

  isCourseSelected(courseId: number): boolean {
    return this.selectedCourseIds().includes(courseId);
  }

  toggleCourseSelection(course: Course): void {
    const current = [...this.selectedCourseIds()];
    const index = current.indexOf(course.id);
    if (index > -1) {
      current.splice(index, 1);
      this.selectedCredits.set(this.selectedCredits() - course.creditUnit);
    } else {
      current.push(course.id);
      this.selectedCredits.set(this.selectedCredits() + course.creditUnit);
    }
    this.selectedCourseIds.set(current);
  }

  registerSelectedCourses(): void {
    const s = this.student();
    if (!s) return;

    this.registering.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const session = s.session || '2024/2025';
    const semester = this.selectedSemester();

    this.studentService.registerCourses(this.selectedCourseIds(), session, semester).subscribe({
      next: (res) => {
        this.registering.set(false);
        this.successMessage.set(res.message || 'Courses registered successfully.');
        this.selectedCourseIds.set([]);
        this.selectedCredits.set(0);
        this.loadData();
      },
      error: (err) => {
        this.registering.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to register courses.');
      },
    });
  }

  unregisterCourse(registrationId: number): void {
    if (!confirm('Are you sure you want to unregister this course?')) return;
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.studentService.unregisterCourse(registrationId).subscribe({
      next: () => {
        this.successMessage.set('Course unregistered successfully.');
        this.loadData();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to unregister course.');
      },
    });
  }

  printForm(): void {
    window.print();
  }
}
export default CourseRegistrationComponent;