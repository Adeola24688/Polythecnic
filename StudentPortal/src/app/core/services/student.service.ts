import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardData,
  Course,
  CourseRegistration,
  ResultSummary,
  Payment,
  Clearance,
} from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Dashboard
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`);
  }

  // Course Registration
  getAvailableCourses(department: string, level: string, semester: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.baseUrl}/course/available`, {
      params: { department, level, semester },
    });
  }

  getRegisteredCourses(session?: string, semester?: string): Observable<CourseRegistration[]> {
    const params: any = {};
    if (session) params.session = session;
    if (semester) params.semester = semester;
    return this.http.get<CourseRegistration[]>(`${this.baseUrl}/course/registered`, { params });
  }

  registerCourses(courseIds: number[], session: string, semester: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/course/register`, { courseIds, session, semester });
  }

  unregisterCourse(registrationId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/course/unregister/${registrationId}`);
  }

  // Results
  getResultSummary(session: string, semester: string): Observable<ResultSummary> {
    return this.http.get<ResultSummary>(`${this.baseUrl}/result/summary`, {
      params: { session, semester },
    });
  }

  // Payments
  getPayments(session?: string): Observable<Payment[]> {
    const params: any = {};
    if (session) params.session = session;
    return this.http.get<Payment[]>(`${this.baseUrl}/payment`, { params });
  }

  makePayment(amount: number, purpose: string, session: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payment`, { amount, purpose, session });
  }

  // Exam Clearance
  getClearance(session?: string, semester?: string): Observable<Clearance[]> {
    const params: any = {};
    if (session) params.session = session;
    if (semester) params.semester = semester;
    return this.http.get<Clearance[]>(`${this.baseUrl}/clearance`, { params });
  }

  requestClearance(session: string, semester: string): Observable<Clearance> {
    return this.http.post<Clearance>(`${this.baseUrl}/clearance/request`, null, {
      params: { session, semester },
    });
  }
}
