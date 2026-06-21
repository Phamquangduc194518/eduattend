import {
  ApiErrorBody,
  AttendanceLogEntry,
  AttendanceRecord,
  AttendanceSession,
  AuthResponse,
  CheckInRequest,
  CheckInResponse,
  Course,
  CourseInput,
  CourseTodayStats,
  Enrollment,
  EnrollmentCreateRequest,
  LoginRequest,
  QuickMarkRequest,
  RegisterRequest,
  SessionSubmitRequest,
  StudentRosterItem,
  StudentStatsResponse,
  AttendanceLogsQuery
} from "./api-types.fe";
import { AuthUser } from "../types";
import { getApiBaseUrl, getApiOrigin } from "./apiConfig";

const BASE = getApiBaseUrl();
const TOKEN_KEY = "eduattend_token";

export { getApiBaseUrl, getApiOrigin };

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || body.code || "Request failed");
    this.status = status;
    this.code = body.code || body.message || "internalServerError";
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined)
  };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody);
  }

  return data as T;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  database: string;
}

/** GET /health — không cần token (kiểm tra BE + DB). */
export async function checkApiHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiOrigin()}/health`);
  const data = (await response.json().catch(() => ({}))) as HealthResponse;
  if (!response.ok) {
    throw new ApiError(response.status, {
      message: "Health check failed",
      code: "healthCheckFailed"
    });
  }
  return data;
}

export const authApi = {
  register: (body: RegisterRequest) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: LoginRequest) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => api<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  me: () => api<{ user: AuthUser }>("/auth/me")
};

export const courseApi = {
  list: () => api<{ courses: Course[] }>("/courses"),

  get: (courseId: string) => api<{ course: Course }>(`/courses/${courseId}`),

  create: (body: CourseInput) =>
    api<{ course: Course }>("/courses", { method: "POST", body: JSON.stringify(body) }),

  update: (courseId: string, body: CourseInput) =>
    api<{ course: Course }>(`/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  delete: (courseId: string) =>
    api<{ ok: boolean }>(`/courses/${courseId}`, { method: "DELETE" }),

  students: (courseId: string) =>
    api<{ students: StudentRosterItem[] }>(`/courses/${courseId}/students`)
};

export const enrollmentApi = {
  me: () => api<{ enrollments: Enrollment[] }>("/enrollments/me"),

  pending: () => api<{ enrollments: Enrollment[] }>("/enrollments/pending"),

  create: (body: EnrollmentCreateRequest) =>
    api<{ enrollment: Enrollment }>("/enrollments", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  approve: (enrollmentId: string) =>
    api<{ enrollment: Enrollment }>(`/enrollments/${enrollmentId}/approve`, { method: "PATCH" }),

  reject: (enrollmentId: string) =>
    api<{ enrollment: Enrollment }>(`/enrollments/${enrollmentId}/reject`, { method: "PATCH" })
};

export const sessionApi = {
  open: (courseId: string) =>
    api<{ session: AttendanceSession }>(`/courses/${courseId}/sessions`, { method: "POST" }),

  active: (courseId: string) =>
    api<{ session: AttendanceSession | null }>(`/sessions/active?courseId=${encodeURIComponent(courseId)}`),

  activeMe: () => api<{ sessions: AttendanceSession[] }>("/sessions/active/me"),

  regeneratePin: (sessionId: string) =>
    api<{ session: AttendanceSession }>(`/sessions/${sessionId}/regenerate-pin`, { method: "POST" }),

  close: (sessionId: string) =>
    api<{ session: AttendanceSession }>(`/sessions/${sessionId}/close`, { method: "PATCH" })
};

function logsQueryString(query: AttendanceLogsQuery): string {
  const params = new URLSearchParams();
  if (query.courseId) params.set("courseId", query.courseId);
  if (query.date) params.set("date", query.date);
  if (query.studentId) params.set("studentId", query.studentId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const attendanceApi = {
  logs: (query: AttendanceLogsQuery = {}) =>
    api<{ logs: AttendanceLogEntry[] }>(`/attendance/logs${logsQueryString(query)}`),

  checkIn: (body: CheckInRequest) =>
    api<CheckInResponse>("/attendance/check-in", { method: "POST", body: JSON.stringify(body) }),

  quickMark: (body: QuickMarkRequest) =>
    api<{ log: AttendanceLogEntry }>("/attendance/quick-mark", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  sessionSubmit: (body: SessionSubmitRequest) =>
    api<{ logs: AttendanceLogEntry[] }>("/attendance/session-submit", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  patchLog: (logId: string, status: "present" | "late" | "absent") =>
    api<{ log: AttendanceLogEntry }>(`/attendance/logs/${logId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
};

export const statsApi = {
  teacherToday: () => api<{ stats: CourseTodayStats[] }>("/stats/teacher/today"),

  studentMe: () => api<StudentStatsResponse>("/stats/student/me")
};

export async function loadTeacherDashboardData(today: string) {
  const [coursesRes, pendingRes, logsRes, statsRes] = await Promise.all([
    courseApi.list(),
    enrollmentApi.pending(),
    attendanceApi.logs({ date: today }),
    statsApi.teacherToday().catch(() => ({ stats: [] as CourseTodayStats[] }))
  ]);

  const rosterResults = await Promise.all(
    coursesRes.courses.map((course) =>
      courseApi.students(course.id).catch(() => ({ students: [] as StudentRosterItem[] }))
    )
  );

  const studentMap = new Map<string, StudentRosterItem>();
  const approvedEnrollments: Enrollment[] = [];

  coursesRes.courses.forEach((course, index) => {
    rosterResults[index].students.forEach((student) => {
      studentMap.set(student.id, student);
      approvedEnrollments.push({
        id: `ENR-${course.id}-${student.id}`,
        studentId: student.id,
        courseId: course.id,
        status: "approved",
        requestedAt: new Date(0).toISOString()
      });
    });
  });

  const pendingEnrollments = pendingRes.enrollments.map((item) => {
    const course = coursesRes.courses.find((entry) => entry.id === item.courseId);
    return {
      ...item,
      courseCode: item.courseCode ?? course?.code,
      courseName: item.courseName ?? course?.name
    };
  });

  return {
    courses: coursesRes.courses,
    enrollments: [...approvedEnrollments, ...pendingEnrollments],
    pendingEnrollments,
    logs: logsRes.logs,
    teacherStats: statsRes.stats,
    studentDirectory: studentMap
  };
}

export async function loadStudentDashboardData(today: string) {
  const [coursesRes, enrollmentsRes, sessionsRes, logsRes, statsRes] = await Promise.all([
    courseApi.list(),
    enrollmentApi.me(),
    sessionApi.activeMe(),
    attendanceApi.logs({ date: today }),
    statsApi.studentMe().catch(() => null)
  ]);

  return {
    courses: coursesRes.courses,
    enrollments: enrollmentsRes.enrollments,
    sessions: sessionsRes.sessions,
    logs: logsRes.logs,
    studentStats: statsRes
  };
}

export async function loadMarkingData(courseId: string, today: string) {
  const [studentsRes, logsRes, sessionRes] = await Promise.all([
    courseApi.students(courseId),
    attendanceApi.logs({ courseId, date: today }),
    sessionApi.active(courseId)
  ]);

  let session = sessionRes.session;
  if (!session) {
    const opened = await sessionApi.open(courseId);
    session = opened.session;
  }

  return {
    students: studentsRes.students,
    logs: logsRes.logs,
    session
  };
}
