import {
  ApiError,
  AttendanceLogEntry,
  AttendanceRecord,
  AttendanceSession,
  AuthUser,
  Course,
  Enrollment,
  Language,
  UserRole,
  Weekday
} from "../types";

export type { AuthUser, Course, Enrollment, AttendanceSession, AttendanceLogEntry, AttendanceRecord };

export interface ApiErrorBody {
  message: string;
  code?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface CourseInput {
  code: string;
  name: string;
  room: string;
  scheduleDays: Weekday[];
  startTime: string;
  endTime: string;
}

export interface StudentRosterItem {
  id: string;
  name: string;
  email: string;
}

export interface CourseTodayStats {
  courseId: string;
  courseCode: string;
  courseName: string;
  enrolledCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  unmarkedCount: number;
  rate: number;
}

export interface StudentStatsResponse {
  overallRate: number;
  courseRates: {
    courseId: string;
    courseCode: string;
    courseName: string;
    rate: number;
  }[];
}

export interface CheckInRequest {
  courseId: string;
  sessionId: string;
  pinCode: string;
  photoUrl: string;
  verificationPhoto?: string;
  capturedAt?: string;
}

export interface CheckInResponse {
  log: AttendanceLogEntry;
  photoUrl?: string;
}

export interface QuickMarkRequest {
  courseId: string;
  studentId: string;
  status: "present" | "late" | "absent";
  date: string;
}

export interface SessionSubmitRequest {
  courseId: string;
  sessionId: string;
  pinCode: string;
  records: AttendanceRecord[];
}

export interface EnrollmentCreateRequest {
  courseId: string;
}

export interface AttendanceLogsQuery {
  courseId?: string;
  date?: string;
  studentId?: string;
}

export interface SavedAppSession {
  userId: string;
  activeScreen: import("./appScreen").AppScreen;
  selectedCourseId: string;
  language: Language;
}
