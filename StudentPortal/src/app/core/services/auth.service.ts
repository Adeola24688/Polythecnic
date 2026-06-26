import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  Student,
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  UpdateBiodataDto,
} from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  // Signals for reactive state
  readonly currentUser = signal<Student | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem('token'));

  get isAuthenticated(): boolean {
    return !!this.token();
  }

  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  register(studentData: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, studentData)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('student');
    this.token.set(null);
    this.currentUser.set(null);
  }

  updateProfile(biodata: UpdateBiodataDto): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/biodata`, biodata).pipe(
      tap((updatedStudent) => {
        localStorage.setItem('student', JSON.stringify(updatedStudent));
        this.currentUser.set(updatedStudent);
      }),
    );
  }

  changePassword(dto: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, dto);
  }

  refreshProfile(): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/profile`).pipe(
      tap((student) => {
        localStorage.setItem('student', JSON.stringify(student));
        this.currentUser.set(student);
      }),
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('student', JSON.stringify(response.student));
    this.token.set(response.token);
    this.currentUser.set(response.student);
  }

  private getStoredUser(): Student | null {
    const stored = localStorage.getItem('student');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
