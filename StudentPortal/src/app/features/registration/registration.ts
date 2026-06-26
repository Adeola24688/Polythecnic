import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Course, CourseRegistration } from '../../shared/models';

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

  // States
  readonly availableCourses = signal<Course[]>([]);
  readonly registeredRegistrations = signal<CourseRegistration[]>([]);
  readonly selectedCourseIds = signal<number[]>([]);
  readonly selectedCredits = signal(0);

  readonly loadingAvailable = signal(true);
  readonly loadingRegistered = signal(true);
  readonly registering = signal(false);

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly totalRegisteredCredits = computed(() => {
    return this.registeredRegistrations().reduce((acc, curr) => acc + curr.creditUnit, 0);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const s = this.student();
    if (!s) return;

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

    this.loadingAvailable.set(true);
    this.studentService.getAvailableCourses(s.department, s.level, semester).subscribe({
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
    const currentSelected = [...this.selectedCourseIds()];
    const index = currentSelected.indexOf(course.id);

    if (index > -1) {
      currentSelected.splice(index, 1);
      this.selectedCredits.set(this.selectedCredits() - course.creditUnit);
    } else {
      currentSelected.push(course.id);
      this.selectedCredits.set(this.selectedCredits() + course.creditUnit);
    }

    this.selectedCourseIds.set(currentSelected);
  }

  registerSelectedCourses(): void {
    const s = this.student();
    if (!s) return;

    this.registering.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const session = s.session || '2024/2025';
    const semester = s.semester || 'Second';

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
}
export default CourseRegistrationComponent;
