export interface Student {
  id: number;
  matricNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  department: string;
  faculty?: string;
  level: string;
  session?: string;
  semester?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  stateOfOrigin?: string;
  lga?: string;
  address?: string;
  profilePhoto?: string;
}

export interface UpdateBiodataDto {
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  stateOfOrigin?: string;
  lga?: string;
  address?: string;
  profilePhoto?: string;
}

export interface AuthResponse {
  token: string;
  student: Student;
}

export interface Course {
  id: number;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  department: string;
  level: string;
  semester: string;
}

export interface CourseRegistration {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  session: string;
  semester: string;
  registeredAt: string;
}

export interface Result {
  id: number;
  courseCode: string;
  courseTitle: string;
  creditUnit: number;
  score: number;
  grade: string;
  gradePoint: number;
  session: string;
  semester: string;
}

export interface ResultSummary {
  session: string;
  semester: string;
  results: Result[];
  gpa: number;
  cgpa: number;
  totalCreditUnits: number;
  totalCreditPoints: number;
}

export interface Payment {
  id: number;
  amount: number;
  purpose: string;
  reference?: string;
  status: string;
  session: string;
  paidAt?: string;
  createdAt: string;
}

export interface Clearance {
  id: number;
  session: string;
  semester: string;
  status: string;
  feesPaid: boolean;
  coursesRegistered: boolean;
  clearedAt?: string;
  // Display fields (populated client-side for table view)
  channel?: string;
  level?: string;
  sessionYear?: string;
}

export interface DashboardData {
  student: Student;
  hasBiodata: boolean;
  hasRegisteredCourses: boolean;
  hasResults: boolean;
  clearanceStatus?: string;
  latestPaymentStatus?: string;
  notices: string[];
}

export interface LoginDto {
  email: string;
  passwordHash?: string;
  password?: string;
}

export interface RegisterDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  matricNumber: string;
  department: string;
  faculty?: string;
  level: string;
  phone?: string;
  gender?: string;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}