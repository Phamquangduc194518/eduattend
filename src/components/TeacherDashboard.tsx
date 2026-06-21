import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, Student, Enrollment, getTeacherGreeting } from "../types";
import {
  Users,
  BookOpen,
  Clock,
  Calendar,
  Sparkles,
  Check,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  UserCheck
} from "lucide-react";
import CourseFormModal from "./CourseFormModal";
import { CourseInput, formatCourseSchedule, courseToInput, isCourseScheduledToday } from "../utils/courses";
import { CourseTodayStats } from "../utils/attendance";

interface TeacherDashboardProps {
  language: Language;
  teacherName: string;
  courses: Course[];
  students: Student[];
  quickTasks: { studentId: string; courseId: string; status?: "present" | "late" | "absent" }[];
  pendingEnrollments: Enrollment[];
  onQuickAction: (studentId: string, courseId: string, status: "present" | "late" | "absent") => void;
  onNavigateToMarking: (courseId: string) => void;
  onCreateCourse: (input: CourseInput) => void;
  onUpdateCourse: (courseId: string, input: CourseInput) => void;
  onDeleteCourse: (courseId: string) => void;
  onApproveEnrollment: (enrollmentId: string) => void;
  onRejectEnrollment: (enrollmentId: string) => void;
  averageAttendanceRate: number;
  courseTodayStats: CourseTodayStats[];
  enrolledStudentCount: number;
  openSessionsToday: number;
}

export default function TeacherDashboard({
  language,
  teacherName,
  courses,
  students,
  quickTasks,
  pendingEnrollments,
  onQuickAction,
  onNavigateToMarking,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onApproveEnrollment,
  onRejectEnrollment,
  averageAttendanceRate,
  courseTodayStats,
  enrolledStudentCount,
  openSessionsToday
}: TeacherDashboardProps) {
  const t = TRANSLATIONS[language];
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const flashMessage = (text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Derive students map for quick queries
  const studentMap = React.useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  const resolveEnrollmentStudent = (request: Enrollment) => {
    const student = studentMap.get(request.studentId);
    return {
      id: request.studentId,
      name: student?.name ?? request.studentName ?? request.studentId,
      email: student?.email ?? request.studentEmail
    };
  };

  const resolveEnrollmentCourse = (request: Enrollment) => {
    const course = courseMap.get(request.courseId);
    if (course) return course;
    if (request.courseCode || request.courseName) {
      return {
        id: request.courseId,
        code: request.courseCode ?? request.courseId,
        name: request.courseName ?? request.courseCode ?? request.courseId
      };
    }
    return null;
  };

  // Derive courses map
  const courseMap = React.useMemo(() => {
    return new Map(courses.map(c => [c.id, c]));
  }, [courses]);

  const classesScheduledToday = React.useMemo(
    () => courses.filter((course) => isCourseScheduledToday(course)).length,
    [courses]
  );

  return (
    <div className="space-y-8 animate-fade-in relative">
      {actionMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border bg-indigo-50 border-indigo-200 text-indigo-800">
          {actionMessage}
        </div>
      )}
      {/* Upper Brand Promo / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent pointer-events-none" />
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{t.tagline}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" id="teacher-dash-welcome">
            {getTeacherGreeting(language, teacherName)}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-lg">
            {language === "en" ? "Welcome back to your academic console. All your class structures and smart face validation gates are running normally." : "Chào mừng trở lại bảng điều khiển giảng viên. Tất cả hệ thống học phần và cổng quét thẻ sinh viên qua AI đang hoạt động bình thường."}
          </p>
        </div>
        <div className="flex flex-col gap-3 self-start md:self-auto">
          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <div className="text-left font-mono">
              <span className="block text-xs uppercase text-slate-400 tracking-wider">Date/Time</span>
              <span className="text-sm font-bold text-slate-100">
                {new Date().toLocaleDateString(language === "en" ? "en-US" : "vi-VN", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Classes Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{t.classesToday}</span>
            <p className="text-3xl font-bold tracking-tight text-slate-800" id="stat-classes-today">
              {classesScheduledToday}
            </p>
            <span className="text-xs text-indigo-600 font-medium block">
              {openSessionsToday > 0
                ? language === "en"
                  ? `${openSessionsToday} check-in session(s) open`
                  : `${openSessionsToday} phiên điểm danh đang mở`
                : language === "en"
                ? `${courses.length} course(s) assigned`
                : `${courses.length} học phần phụ trách`}
            </span>
          </div>
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 duration-300">
            <BookOpen className="h-7 w-7" />
          </div>
        </div>

        {/* Total Students Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{t.totalStudents}</span>
            <p className="text-3xl font-bold tracking-tight text-slate-800" id="stat-total-students">
              {enrolledStudentCount}
            </p>
            <span className="text-xs text-emerald-600 font-medium block">
              {language === "en" ? "Enrolled in your courses" : "Đăng ký học phần của bạn"}
            </span>
          </div>
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 duration-300">
            <Users className="h-7 w-7" />
          </div>
        </div>

        {/* Average Attendance Rate */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">{t.avgAttendance}</span>
            <p className="text-3xl font-bold tracking-tight text-slate-800" id="stat-avg-attendance">
              {averageAttendanceRate}%
            </p>
            <span className="text-xs text-indigo-600 font-medium block">
              {language === "en"
                ? "Across all enrolled students today"
                : "Trên tổng sinh viên đăng ký hôm nay"}
            </span>
          </div>
          {/* Circular mini stroke meter */}
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="#4f46e5"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - averageAttendanceRate / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xxs font-extrabold text-slate-700 font-mono">
              {averageAttendanceRate}%
            </span>
          </div>
        </div>
      </div>

      {courseTodayStats.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">{t.attendanceByClass}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {courseTodayStats.map((stat) => (
              <div
                key={stat.courseId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {stat.courseCode} — {stat.courseName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.attendanceMarkedSummary
                      .replace("{{present}}", String(stat.presentCount))
                      .replace("{{late}}", String(stat.lateCount))
                      .replace("{{absent}}", String(stat.absentCount))
                      .replace("{{unmarked}}", String(stat.unmarkedCount))}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-xxs text-slate-400 font-mono">
                    {stat.enrolledCount} {language === "en" ? "students" : "SV"}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black font-mono text-sm">
                    {stat.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending enrollment approvals */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              <span>{t.pendingEnrollments}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t.pendingEnrollmentsHint}</p>
          </div>
          {pendingEnrollments.length > 0 && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xxs font-bold">
              {pendingEnrollments.length}
            </span>
          )}
        </div>
        {pendingEnrollments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">{t.noPendingEnrollments}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingEnrollments.map((request) => {
              const student = resolveEnrollmentStudent(request);
              const course = resolveEnrollmentCourse(request);
              if (!course) return null;
              return (
                <div key={request.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                    <p className="text-xxs font-mono text-slate-400 mt-0.5">
                      {student.id}
                      {student.email ? ` • ${student.email}` : ""} • {course.code} — {course.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        onApproveEnrollment(request.id);
                        flashMessage(t.approveEnrollment);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                    >
                      {t.approveEnrollment}
                    </button>
                    <button
                      onClick={() => onRejectEnrollment(request.id)}
                      className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-bold rounded-xl"
                    >
                      {t.rejectEnrollment}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule and Marking Core Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SCHEDULE COLUMN - 5 wide */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span>{t.manageCourses}</span>
            </h2>
            <button
              onClick={() => {
                setEditingCourse(null);
                setShowCourseForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.addCourseBtn}</span>
            </button>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative group"
                id={`schedule-card-${course.code}`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md font-mono text-xxs font-extrabold">
                      {course.code}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1 group-hover:text-indigo-600 transition-colors">
                      {course.name}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex items-center space-x-1 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{formatCourseSchedule(course, language)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      {t.room}: <strong className="text-slate-700">{course.room}</strong>
                    </span>
                    <span>
                      {t.totalStudents.toLowerCase()}: <strong className="text-slate-700">{course.studentCount}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCourse(course);
                        setShowCourseForm(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"
                      title={t.editCourseBtn}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCourseId(course.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600"
                      title={t.deleteCourseBtn}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigateToMarking(course.id)}
                      className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center space-x-1"
                      id={`manage-course-btn-${course.code}`}
                    >
                      <span>{language === "en" ? "Mark" : "Điểm danh"}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK TASKS COLUMN - 7 wide */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-indigo-500" />
              <span>{t.pendingMarking}</span>
            </h2>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xxs font-bold">
              {quickTasks.filter(q => !q.status).length} {language === "en" ? "Remaining" : "Còn lại"}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {quickTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                No active task lists remaining. All synced!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {quickTasks.map((task) => {
                  const student = studentMap.get(task.studentId);
                  const course = courseMap.get(task.courseId);
                  if (!student || !course) return null;

                  return (
                    <div
                      key={`${task.studentId}-${task.courseId}`}
                      className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      id={`task-row-${student.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar Initials Gradient */}
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${student.avatarGradient} text-white font-extrabold text-xs flex items-center justify-center shadow-inner`}>
                          {student.initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <div className="flex flex-wrap gap-x-2 text-xxs text-slate-400">
                            <span className="font-mono text-slate-500">{student.id}</span>
                            <span>•</span>
                            <span className="font-bold text-indigo-600 font-mono">{course.code}</span>
                          </div>
                        </div>
                      </div>

                      {/* Marking controls */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => onQuickAction(student.id, course.id, "present")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 border ${
                            task.status === "present"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white hover:bg-emerald-50 text-emerald-600 border-slate-200 hover:border-emerald-200"
                          }`}
                          title={t.present}
                          id={`mark-${student.id}-present`}
                        >
                          {t.pShort}
                        </button>
                        <button
                          onClick={() => onQuickAction(student.id, course.id, "late")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 border ${
                            task.status === "late"
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                              : "bg-white hover:bg-amber-50 text-amber-500 border-slate-200 hover:border-amber-200"
                          }`}
                          title={t.late}
                          id={`mark-${student.id}-late`}
                        >
                          {t.lShort}
                        </button>
                        <button
                          onClick={() => onQuickAction(student.id, course.id, "absent")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 border ${
                            task.status === "absent"
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                              : "bg-white hover:bg-rose-50 text-rose-500 border-slate-200 hover:border-rose-200"
                          }`}
                          title={t.absent}
                          id={`mark-${student.id}-absent`}
                        >
                          {t.aShort}
                        </button>
                        
                        {task.status && (
                          <span className="ml-1 text-emerald-600 animate-pulse bg-emerald-50 p-1 rounded-full border border-emerald-100">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <CourseFormModal
        language={language}
        open={showCourseForm}
        initial={editingCourse ? courseToInput(editingCourse) : undefined}
        title={editingCourse ? t.editCourseBtn : t.addCourseBtn}
        onClose={() => {
          setShowCourseForm(false);
          setEditingCourse(null);
        }}
        onSave={(input) => {
          if (editingCourse) {
            onUpdateCourse(editingCourse.id, input);
          } else {
            onCreateCourse(input);
          }
          flashMessage(t.courseSaved);
          setShowCourseForm(false);
          setEditingCourse(null);
        }}
      />

      {deleteCourseId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-xl font-extrabold text-slate-900 text-center">{t.deleteCourseTitle}</h3>
            <p className="text-sm text-slate-500 mt-3 text-center">{t.deleteCourseDesc}</p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setDeleteCourseId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm"
              >
                {t.cancelCourseBtn}
              </button>
              <button
                onClick={() => {
                  onDeleteCourse(deleteCourseId);
                  flashMessage(t.courseDeleted);
                  setDeleteCourseId(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl text-sm"
              >
                {t.deleteCourseBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
