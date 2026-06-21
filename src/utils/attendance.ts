import {
  AttendanceLogEntry,
  AttendanceSession,
  applyCourseScheduleToSession,
  Course,
  Language,
  Student
} from "../types";
import { Enrollment } from "../types";

export function applyCourseScheduleToSessions(
  sessions: AttendanceSession[],
  courses: Course[]
): AttendanceSession[] {
  const byId = new Map(courses.map((course) => [course.id, course]));
  return sessions.map((session) => {
    const course = byId.get(session.courseId);
    return course ? applyCourseScheduleToSession(session, course) : session;
  });
}

export function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}

export function computeAttendanceRate(logs: AttendanceLogEntry[]): number {
  if (logs.length === 0) return 0;
  const present = logs.filter((log) => log.status === "present").length;
  const late = logs.filter((log) => log.status === "late").length;
  return Math.round(((present + late * 0.5) / logs.length) * 100);
}

export function computeStudentOverallRate(
  enrolledCourses: Course[],
  logs: AttendanceLogEntry[],
  studentId: string
): number {
  if (enrolledCourses.length === 0) return 0;

  const totalRate = enrolledCourses.reduce((sum, course) => {
    const courseLogs = logs.filter(
      (log) => log.studentId === studentId && log.courseCode === course.code
    );
    return sum + computeAttendanceRate(courseLogs);
  }, 0);

  return Math.round(totalRate / enrolledCourses.length);
}

export function getAttendanceRating(rate: number, language: Language): string {
  if (rate >= 90) return language === "en" ? "Excellent" : "Xuất sắc";
  if (rate >= 75) return language === "en" ? "Good" : "Khá";
  if (rate >= 60) return language === "en" ? "Fair" : "Trung bình";
  if (rate > 0) return language === "en" ? "Needs improvement" : "Cần cải thiện";
  return language === "en" ? "No data yet" : "Chưa có dữ liệu";
}

export function getApprovedEnrollments(enrollments: Enrollment[]): Enrollment[] {
  return enrollments.filter((item) => item.status === "approved");
}

export function getPendingEnrollments(enrollments: Enrollment[]): Enrollment[] {
  return enrollments.filter((item) => item.status === "pending");
}

export function getEnrolledStudentIds(courseId: string, enrollments: Enrollment[]): string[] {
  return getApprovedEnrollments(enrollments)
    .filter((item) => item.courseId === courseId)
    .map((item) => item.studentId);
}

export function getEnrolledCourseIds(studentId: string, enrollments: Enrollment[]): string[] {
  return getApprovedEnrollments(enrollments)
    .filter((item) => item.studentId === studentId)
    .map((item) => item.courseId);
}

export function buildCoursesWithCounts(courses: Course[], enrollments: Enrollment[]): Course[] {
  const approved = getApprovedEnrollments(enrollments);
  return courses.map((course) => ({
    ...course,
    studentCount: approved.filter((item) => item.courseId === course.id).length
  }));
}

export function getTeacherCourses(courses: Course[], instructorName: string): Course[] {
  return courses.filter((course) => course.instructor === instructorName);
}

export function filterStudentsByCourse(students: Student[], courseId: string, enrollments: Enrollment[]): Student[] {
  const ids = new Set(getEnrolledStudentIds(courseId, enrollments));
  return students.filter((student) => ids.has(student.id));
}

export function buildMarkingTasks(
  courses: Course[],
  enrollments: Enrollment[],
  logs: AttendanceLogEntry[],
  date = todayStr()
) {
  const tasks: { studentId: string; courseId: string; status?: "present" | "late" | "absent" }[] = [];

  courses.forEach((course) => {
    getEnrolledStudentIds(course.id, enrollments).forEach((studentId) => {
      const todayLog = logs.find(
        (log) => log.studentId === studentId && log.courseCode === course.code && log.date === date
      );
      tasks.push({
        studentId,
        courseId: course.id,
        status: todayLog?.status
      });
    });
  });

  return tasks;
}

export function countOpenSessionsToday(sessions: AttendanceSession[], date = todayStr()) {
  return sessions.filter((session) => session.date === date && session.status === "open").length;
}

export function countEnrolledStudents(courses: Course[], enrollments: Enrollment[]) {
  const courseIds = new Set(courses.map((course) => course.id));
  const ids = new Set(
    getApprovedEnrollments(enrollments)
      .filter((item) => courseIds.has(item.courseId))
      .map((item) => item.studentId)
  );
  return ids.size;
}

export function getPendingEnrollmentsForTeacher(courses: Course[], enrollments: Enrollment[]): Enrollment[] {
  const courseIds = new Set(courses.map((course) => course.id));
  return getPendingEnrollments(enrollments).filter((item) => courseIds.has(item.courseId));
}

export function getTodayLogsForTeacher(courses: Course[], logs: AttendanceLogEntry[], date = todayStr()) {
  const codes = new Set(courses.map((course) => course.code));
  return logs.filter((log) => log.date === date && codes.has(log.courseCode));
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

export function buildCourseTodayStats(
  course: Course,
  enrollments: Enrollment[],
  logs: AttendanceLogEntry[],
  date = todayStr()
): CourseTodayStats {
  const studentIds = getEnrolledStudentIds(course.id, enrollments);
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;

  studentIds.forEach((studentId) => {
    const log = logs.find(
      (item) => item.studentId === studentId && item.courseCode === course.code && item.date === date
    );
    if (!log) unmarkedCount += 1;
    else if (log.status === "present") presentCount += 1;
    else if (log.status === "late") lateCount += 1;
    else absentCount += 1;
  });

  const enrolledCount = studentIds.length;
  const rate =
    enrolledCount === 0
      ? 0
      : Math.round(((presentCount + lateCount * 0.5) / enrolledCount) * 100);

  return {
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    enrolledCount,
    presentCount,
    lateCount,
    absentCount,
    unmarkedCount,
    rate
  };
}

export function buildTeacherCourseTodayStats(
  courses: Course[],
  enrollments: Enrollment[],
  logs: AttendanceLogEntry[],
  date = todayStr()
): CourseTodayStats[] {
  return courses.map((course) =>
    buildCourseTodayStats(course, enrollments, logs, date)
  );
}

export function computeOverallEnrollmentRate(stats: CourseTodayStats[]): number {
  const enrolledTotal = stats.reduce((sum, item) => sum + item.enrolledCount, 0);
  if (enrolledTotal === 0) return 0;
  const scoreTotal = stats.reduce(
    (sum, item) => sum + item.presentCount + item.lateCount * 0.5,
    0
  );
  return Math.round((scoreTotal / enrolledTotal) * 100);
}

export function getStudentTodayLog(
  studentId: string,
  courseCode: string,
  logs: AttendanceLogEntry[],
  date = todayStr()
): AttendanceLogEntry | undefined {
  return logs.find(
    (log) =>
      log.studentId === studentId &&
      log.courseCode === courseCode &&
      log.date === date &&
      (log.status === "present" || log.status === "late")
  );
}

export function hasStudentCheckedInToday(
  studentId: string,
  courseCode: string,
  logs: AttendanceLogEntry[],
  date = todayStr()
): boolean {
  return !!getStudentTodayLog(studentId, courseCode, logs, date);
}

export function getStudentEnrolledLogs(
  studentId: string,
  enrolledCourses: Course[],
  logs: AttendanceLogEntry[]
): AttendanceLogEntry[] {
  const codes = new Set(enrolledCourses.map((course) => course.code));
  return logs
    .filter((log) => log.studentId === studentId && codes.has(log.courseCode))
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      if (byDate !== 0) return byDate;
      return (b.timestamp || "").localeCompare(a.timestamp || "");
    });
}
