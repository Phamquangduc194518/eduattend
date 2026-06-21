import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, AttendanceLogEntry, AttendanceSession, Enrollment, isSessionActive } from "../types";
import { computeAttendanceRate, getAttendanceRating, getStudentEnrolledLogs, computeStudentOverallRate } from "../utils/attendance";
import { getStudentEnrollmentState, formatCourseSchedule } from "../utils/courses";
import { Sparkles, Calendar, Clock, MapPin, ShieldCheck, Activity, Search, BookOpen } from "lucide-react";

export interface StudentOpenCheckInOption {
  course: Course;
  session: AttendanceSession;
  alreadyCheckedIn: boolean;
}

interface StudentDashboardProps {
  language: Language;
  courses: Course[];
  allCourses: Course[];
  enrollments: Enrollment[];
  logs: AttendanceLogEntry[];
  studentName: string;
  studentId: string;
  openCheckInOptions: StudentOpenCheckInOption[];
  onRequestEnrollment: (courseId: string) => boolean;
  onStartCheckIn: (courseId: string) => void;
}

export default function StudentDashboard({
  language,
  courses,
  allCourses,
  enrollments,
  logs,
  studentName,
  studentId,
  openCheckInOptions,
  onRequestEnrollment,
  onStartCheckIn
}: StudentDashboardProps) {
  const t = TRANSLATIONS[language];
  const [catalogSearch, setCatalogSearch] = useState("");
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  const pendingCourses = React.useMemo(() => {
    const pendingIds = new Set(
      enrollments.filter((item) => item.status === "pending").map((item) => item.courseId)
    );
    return allCourses.filter((course) => pendingIds.has(course.id));
  }, [allCourses, enrollments]);

  // Logs for enrolled courses only, newest first
  const studentLogs = React.useMemo(() => {
    return getStudentEnrolledLogs(studentId, courses, logs);
  }, [logs, studentId, courses]);

  // Derive individual attendance stats
  const stats = React.useMemo(() => {
    const total = studentLogs.length;
    const present = studentLogs.filter((l) => l.status === "present").length;
    const late = studentLogs.filter((l) => l.status === "late").length;
    const absent = studentLogs.filter((l) => l.status === "absent").length;
    const rate = computeStudentOverallRate(courses, logs, studentId);
    return { present, late, absent, rate, total };
  }, [studentLogs, courses, logs, studentId]);

  const catalogCourses = React.useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return allCourses.filter((course) => {
      if (!query) return true;
      return (
        course.code.toLowerCase().includes(query) ||
        course.name.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query)
      );
    });
  }, [allCourses, catalogSearch]);

  const handleEnrollClick = (courseId: string) => {
    const state = getStudentEnrollmentState(studentId, courseId, enrollments);
    if (state?.status === "approved") {
      setEnrollMessage(t.enrollmentAlreadyApproved);
    } else if (state?.status === "pending") {
      setEnrollMessage(t.enrollmentAlreadyPending);
    } else {
      const ok = onRequestEnrollment(courseId);
      setEnrollMessage(ok ? t.enrollmentRequested : t.enrollmentAlreadyPending);
    }
    setTimeout(() => setEnrollMessage(null), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greetings Portal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-teal-400 via-transparent to-transparent pointer-events-none" />
        
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-teal-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{language === "en" ? "Student Node Active" : "Kết nối Sinh viên"}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" id="student-dash-welcome">
            {t.studentWelcome}, {studentName}
          </h1>
          <p className="text-xs text-teal-200 mt-1 font-mono tracking-wide uppercase">
            ID: {studentId} • term: Fall 2026
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm self-start md:self-auto">
          <Calendar className="h-5 w-5 text-teal-400" />
          <div className="text-left font-mono">
            <span className="block text-xs uppercase text-slate-400 tracking-wider">Academic Feed</span>
            <span className="text-sm font-bold text-slate-100">
              {courses.length} {language === "en" ? "Enrolled Modules" : "Học phần đăng ký"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats, Score & Term Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SCORE DISPLAY - 4 wide */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between" id="attendance-score-card">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase font-mono tracking-wider">
              {t.overviewScore}
            </h2>
            <p className="text-xs text-slate-500 leading-snug">
              {t.overviewLabel}
            </p>
          </div>

          {/* Radial Score graphic with progress animation */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative h-40 w-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#10b981" // teal emerald accent for student dashboard
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - stats.rate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-4xl font-black text-slate-800 font-mono tracking-tighter" id="score-percentage-value">
                  {stats.rate}%
                </span>
                <span className="block text-xxs font-extrabold uppercase text-emerald-600 font-mono tracking-wider mt-0.5">
                  {getAttendanceRating(stats.rate, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid summary stats inside */}
          <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-4">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-slate-400 text-xxs uppercase font-extrabold tracking-wider">{t.pShort}</span>
              <span className="text-sm font-black text-slate-800 font-mono">{stats.present}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-slate-400 text-xxs uppercase font-extrabold tracking-wider">{t.lShort}</span>
              <span className="text-sm font-black text-slate-800 font-mono">{stats.late}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-slate-400 text-xxs uppercase font-extrabold tracking-wider">{t.aShort}</span>
              <span className="text-sm font-black text-slate-800 font-mono">{stats.absent}</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE CONTROLS COLUMN - 8 wide */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{t.openCheckInSessions}</span>
              {openCheckInOptions.length > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xxs font-bold">
                  {openCheckInOptions.length}
                </span>
              )}
            </h3>

            {openCheckInOptions.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 text-center text-sm text-slate-500 font-medium">
                {t.noOpenCheckInSessions}
              </div>
            ) : (
              openCheckInOptions.map(({ course, session, alreadyCheckedIn }) => {
                const sessionReady = isSessionActive(session, course);
                const canCheckIn = sessionReady && !alreadyCheckedIn;
                const sessionLabel = sessionReady
                  ? t.sessionOpen
                  : session.status === "closed"
                  ? t.sessionClosed
                  : t.sessionExpired;

                return (
                  <div
                    key={course.id}
                    className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
                    id={`countdown-card-${course.code}`}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-emerald-600 to-transparent pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200/50 rounded-md font-mono text-xxs font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          <span>{alreadyCheckedIn ? t.alreadyCheckedInBtn : sessionLabel}</span>
                        </span>

                        <h3 className="text-lg font-black text-slate-800 leading-tight">
                          {course.code} - {course.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-teal-600" />
                            <span>{course.room}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                            <span>{formatCourseSchedule(course, language)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right min-w-[120px]">
                        <span className="block text-xxs uppercase font-extrabold font-mono text-slate-400">
                          {t.countdownTitle}
                        </span>
                        <span className="block text-sm font-bold text-slate-600 font-mono mt-0.5 tracking-tight">
                          {sessionReady ? formatCourseSchedule(course, language) : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-emerald-100/60 mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <span className="text-xs text-emerald-800 font-semibold text-center sm:text-left">
                        {alreadyCheckedIn
                          ? t.alreadyCheckedIn
                          : sessionReady
                          ? t.checkInTwoStepHint
                          : t.countdownLocked}
                      </span>

                      <button
                        onClick={() => onStartCheckIn(course.id)}
                        disabled={!canCheckIn}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold px-6 py-3 rounded-xl text-sm transition duration-200 active:scale-95 shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
                        id={`trigger-checkin-btn-${course.code}`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{alreadyCheckedIn ? t.alreadyCheckedInBtn : t.startCheckInBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Enrolled Modules Progress Block */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{t.classesEnrolled}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.length === 0 ? (
                <div className="col-span-full text-slate-400 text-sm font-semibold p-4 text-center border border-dashed border-slate-200 rounded-2xl">
                  {language === "en" ? "No enrolled modules found." : "Chưa có học phần đăng ký."}
                </div>
              ) : (
                courses.map((course) => {
                  const courseLogs = studentLogs.filter((log) => log.courseCode === course.code);
                  const progressRate = computeAttendanceRate(courseLogs);

                  return (
                  <div
                    key={course.id}
                    className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition duration-200"
                    id={`student-enrolled-course-${course.code}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xxxs font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                          {course.code}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1.5 leading-tight truncate max-w-[140px]" title={course.name}>
                          {course.name}
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-black text-slate-700">{progressRate}%</span>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden border border-slate-100">
                        <div
                          className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressRate}%` }}
                        />
                      </div>
                      <span className="text-xxs text-slate-400 block mt-1.5">{t.room}: {course.room} • {t.instructor}</span>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Browse & enroll */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <span>{t.browseCourses}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t.browseCoursesHint}</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {enrollMessage && (
          <div className="px-4 py-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-sm font-semibold">
            {enrollMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogCourses.length === 0 ? (
            <div className="col-span-full text-slate-400 text-sm font-semibold p-4 text-center">
              {t.noCoursesFound}
            </div>
          ) : (
            catalogCourses.map((course) => {
              const enrollment = getStudentEnrollmentState(studentId, course.id, enrollments);
              const isApproved = enrollment?.status === "approved";
              const isPending = enrollment?.status === "pending";
              const isRejected = enrollment?.status === "rejected";

              return (
                <div
                  key={course.id}
                  className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="font-mono text-xxxs font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                        {course.code}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5">{course.name}</h4>
                      <p className="text-xxs text-slate-400 mt-1">
                        {course.instructor} • {course.room} • {formatCourseSchedule(course, language)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEnrollClick(course.id)}
                      disabled={isApproved || isPending}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : isRejected
                          ? "bg-white hover:bg-teal-50 text-teal-700 border border-slate-200"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}
                    >
                      {isApproved
                        ? t.enrolledBtn
                        : isPending
                        ? t.pendingEnrollment
                        : isRejected
                        ? t.enrollBtn
                        : t.enrollBtn}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {pendingCourses.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800">{t.pendingEnrollment}</p>
          <p className="text-xs text-amber-700 mt-1">
            {pendingCourses.map((c) => c.code).join(", ")}
          </p>
        </div>
      )}

      {/* RECENT FEED LOGS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-2">
          <Activity className="h-4 w-4 text-teal-600" />
          <span>{t.recentActivity}</span>
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
          {studentLogs.length === 0 ? (
            <div className="text-slate-400 text-sm font-semibold p-4 text-center">
              {language === "en"
                ? "No check-ins recorded for your enrolled modules yet."
                : "Chưa có điểm danh nào cho học phần bạn đăng ký."}
            </div>
          ) : (
            studentLogs.map((log) => {
              const matchesPresent = log.status === "present";
              const matchesLate = log.status === "late";
              
              return (
                <div key={log.id} className="relative group text-sm" id={`log-node-item-${log.id}`}>
                  {/* Bullet node */}
                  <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                    matchesPresent ? "bg-emerald-500" : matchesLate ? "bg-amber-400" : "bg-rose-500"
                  }`} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="font-extrabold text-slate-800">{log.courseCode} - {log.courseName}</span>
                      <div className="flex items-center space-x-2 text-slate-400 text-xxs mt-0.5">
                        <span>{log.date}</span>
                        <span>•</span>
                        <span>{log.timestamp !== "--" ? `${t.logTimestamp}: ${log.timestamp}` : t.absent}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xxs font-mono font-black ${
                        matchesPresent
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                          : matchesLate
                          ? "bg-amber-50 border border-amber-100 text-amber-700"
                          : "bg-rose-50 border border-rose-100 text-rose-700"
                      }`}>
                        {log.status === "present" ? t.present : log.status === "late" ? t.late : t.absent}
                      </span>

                      <span className="text-xxs font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        {log.verificationMethod ? `${t.logVerificationStatus}: ${log.verificationMethod.toUpperCase()}` : "MANUAL"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
