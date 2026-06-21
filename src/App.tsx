import React, { useState, useCallback } from "react";
import {
  Language,
  Course,
  Student,
  AttendanceLogEntry,
  AttendanceRecord,
  AuthUser,
  Enrollment,
  TRANSLATIONS,
  AttendanceSession,
  isSessionActive,
  UserRole,
  applyCourseScheduleToSession
} from "./types";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import TeacherDashboard from "./components/TeacherDashboard";
import AttendanceMarking from "./components/AttendanceMarking";
import StudentDashboard from "./components/StudentDashboard";
import StudentCheckIn from "./components/StudentCheckIn";
import { AppScreen, loadAppPreferences, saveAppPreferences } from "./services/appScreen";
import { RegisterInput, validateRegisterInput } from "./services/auth";
import {
  ApiError,
  attendanceApi,
  authApi,
  courseApi,
  enrollmentApi,
  loadMarkingData,
  loadStudentDashboardData,
  loadTeacherDashboardData,
  sessionApi,
  setToken
} from "./services/apiClient";
import { CourseTodayStats } from "./services/api-types.fe";
import { useAutoHideHeader } from "./hooks/useAutoHideHeader";
import { useAppHistory } from "./hooks/useAppHistory";
import {
  todayStr,
  getEnrolledCourseIds,
  filterStudentsByCourse,
  buildMarkingTasks,
  countOpenSessionsToday,
  countEnrolledStudents,
  hasStudentCheckedInToday,
  buildCoursesWithCounts,
  buildTeacherCourseTodayStats,
  computeOverallEnrollmentRate,
  applyCourseScheduleToSessions
} from "./utils/attendance";
import { CourseInput } from "./utils/courses";
import { directoryToStudents, rosterToStudents } from "./utils/students";
import { Globe, LogOut, GraduationCap, User } from "lucide-react";

function upsertSession(sessions: AttendanceSession[], session: AttendanceSession): AttendanceSession[] {
  return [...sessions.filter((item) => item.id !== session.id), session];
}

export default function App() {
  const [language, setLanguage] = useState<Language>("vi");
  const [activeScreen, setActiveScreen] = useState<AppScreen>("login");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AttendanceLogEntry[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [teacherStats, setTeacherStats] = useState<CourseTodayStats[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [activePinCode, setActivePinCode] = useState("");
  const [markingSession, setMarkingSession] = useState<AttendanceSession | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [studentCheckInCourseId, setStudentCheckInCourseId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = todayStr();
  const t = TRANSLATIONS[language];

  const displayCourses = React.useMemo(() => {
    if (currentUser?.role === "teacher") return courses;
    return buildCoursesWithCounts(courses, enrollments);
  }, [courses, enrollments, currentUser]);

  const teacherCourses = React.useMemo(
    () => (currentUser?.role === "teacher" ? courses : []),
    [courses, currentUser]
  );

  const studentEnrolledCourses = React.useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    const ids = getEnrolledCourseIds(currentUser.id, enrollments);
    return displayCourses.filter((course) => ids.includes(course.id));
  }, [displayCourses, currentUser, enrollments]);

  const getActiveSessionForCourse = useCallback(
    (courseId: string): AttendanceSession | null => {
      const course = displayCourses.find((item) => item.id === courseId);
      const session = sessions.find(
        (item) => item.courseId === courseId && item.date === today && item.status === "open"
      );
      return session && isSessionActive(session, course) ? session : null;
    },
    [sessions, today, displayCourses]
  );

  const studentOpenCheckInOptions = React.useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    return studentEnrolledCourses
      .map((course) => {
        const session = getActiveSessionForCourse(course.id);
        if (!session) return null;
        return {
          course,
          session,
          alreadyCheckedIn: hasStudentCheckedInToday(currentUser.id, course.code, logs, today)
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [studentEnrolledCourses, currentUser, logs, today, getActiveSessionForCourse]);

  const studentCheckInCourse =
    (studentCheckInCourseId
      ? studentEnrolledCourses.find((course) => course.id === studentCheckInCourseId)
      : null) ||
    studentOpenCheckInOptions.find((item) => !item.alreadyCheckedIn)?.course ||
    studentOpenCheckInOptions[0]?.course ||
    null;

  const studentActiveSession = studentCheckInCourse
    ? getActiveSessionForCourse(studentCheckInCourse.id)
    : null;

  const studentAlreadyCheckedIn =
    !!currentUser &&
    currentUser.role === "student" &&
    !!studentCheckInCourse &&
    hasStudentCheckedInToday(currentUser.id, studentCheckInCourse.code, logs, today);

  const markingTasks = React.useMemo(
    () => buildMarkingTasks(teacherCourses, enrollments, logs, today),
    [teacherCourses, enrollments, logs, today]
  );

  const markingStudents = React.useMemo(
    () => filterStudentsByCourse(students, selectedCourseId, enrollments),
    [students, selectedCourseId, enrollments]
  );

  const enrolledStudentCount = React.useMemo(
    () => countEnrolledStudents(teacherCourses, enrollments),
    [teacherCourses, enrollments]
  );

  const pendingEnrollments = React.useMemo(
    () => enrollments.filter((item) => item.status === "pending"),
    [enrollments]
  );

  const openSessionsToday = React.useMemo(
    () => countOpenSessionsToday(sessions, today),
    [sessions, today]
  );

  const teacherCourseTodayStats = React.useMemo(() => {
    if (teacherStats.length > 0) return teacherStats;
    return buildTeacherCourseTodayStats(teacherCourses, enrollments, logs, today);
  }, [teacherStats, teacherCourses, enrollments, logs, today]);

  const averageAttendanceRate = React.useMemo(
    () => computeOverallEnrollmentRate(teacherCourseTodayStats),
    [teacherCourseTodayStats]
  );

  const selectedCourse =
    displayCourses.find((course) => course.id === selectedCourseId) || teacherCourses[0] || null;

  const { visible: headerVisible, height: headerHeight, headerRef, reset: resetHeader } =
    useAutoHideHeader(storeReady);

  useAppHistory(activeScreen, currentUser, storeReady, setActiveScreen);

  const refreshTeacherData = useCallback(async () => {
    const data = await loadTeacherDashboardData(today);
    setCourses(data.courses);
    setEnrollments(data.enrollments);
    setLogs(data.logs);
    setTeacherStats(data.teacherStats);
    setStudents(directoryToStudents(data.studentDirectory));
  }, [today]);

  const refreshStudentData = useCallback(async () => {
    const data = await loadStudentDashboardData(today);
    setCourses(data.courses);
    setEnrollments(data.enrollments);
    setLogs(data.logs);
    setSessions(applyCourseScheduleToSessions(data.sessions, data.courses));
  }, [today]);

  const refreshUserData = useCallback(
    async (user: AuthUser) => {
      if (user.role === "teacher") {
        await refreshTeacherData();
      } else {
        await refreshStudentData();
      }
    },
    [refreshTeacherData, refreshStudentData]
  );

  const flashActionError = (error: unknown) => {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
        ? error.message
        : "Request failed";
    setActionError(message);
    window.setTimeout(() => setActionError(null), 4000);
  };

  React.useEffect(() => {
    async function bootstrap() {
      const prefs = loadAppPreferences();
      if (prefs.language) setLanguage(prefs.language);

      try {
        const { user } = await authApi.me();
        setCurrentUser(user);

        let loadedCourses: Course[] = [];
        if (user.role === "teacher") {
          const data = await loadTeacherDashboardData(today);
          loadedCourses = data.courses;
          setCourses(data.courses);
          setEnrollments(data.enrollments);
          setLogs(data.logs);
          setTeacherStats(data.teacherStats);
          setStudents(directoryToStudents(data.studentDirectory));
        } else {
          const data = await loadStudentDashboardData(today);
          loadedCourses = data.courses;
          setCourses(data.courses);
          setEnrollments(data.enrollments);
          setLogs(data.logs);
          setSessions(applyCourseScheduleToSessions(data.sessions, data.courses));
        }

        const allowed: AppScreen[] =
          user.role === "teacher" ? ["teacher_dash", "teacher_marking"] : ["student_dash", "student_checkin"];

        if (prefs.activeScreen && allowed.includes(prefs.activeScreen)) {
          setActiveScreen(prefs.activeScreen);
        } else {
          setActiveScreen(user.redirectTo);
        }

        if (prefs.selectedCourseId) {
          setSelectedCourseId(prefs.selectedCourseId);
        } else if (user.role === "teacher") {
          setSelectedCourseId(loadedCourses[0]?.id ?? "");
        }
      } catch {
        setToken(null);
      } finally {
        setStoreReady(true);
      }
    }

    bootstrap();
  }, [today]);

  React.useEffect(() => {
    if (!storeReady) return;
    saveAppPreferences({
      activeScreen: currentUser ? activeScreen : undefined,
      selectedCourseId: currentUser?.role === "teacher" ? selectedCourseId : undefined,
      language
    });
  }, [storeReady, currentUser, activeScreen, selectedCourseId, language]);

  React.useEffect(() => {
    if (!storeReady) return;

    if (!currentUser && activeScreen !== "login" && activeScreen !== "register") {
      setActiveScreen("login");
      return;
    }

    if (currentUser) {
      const allowedScreens: AppScreen[] =
        currentUser.role === "teacher"
          ? ["teacher_dash", "teacher_marking"]
          : ["student_dash", "student_checkin"];

      if (!allowedScreens.includes(activeScreen)) {
        setActiveScreen(currentUser.redirectTo);
      }
    }
  }, [currentUser, activeScreen, storeReady]);

  React.useEffect(() => {
    resetHeader();
  }, [activeScreen, resetHeader]);

  const prevScreenRef = React.useRef<AppScreen | null>(null);

  React.useEffect(() => {
    if (!storeReady || !currentUser || currentUser.role !== "student") return;

    const enteringCheckIn =
      activeScreen === "student_checkin" && prevScreenRef.current !== "student_checkin";
    prevScreenRef.current = activeScreen;

    if (enteringCheckIn && studentAlreadyCheckedIn) {
      setActiveScreen("student_dash");
    }
  }, [storeReady, currentUser, activeScreen, studentAlreadyCheckedIn]);

  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    setActiveScreen(user.redirectTo);
    await refreshUserData(user);
    if (user.role === "teacher") {
      const teacherData = await loadTeacherDashboardData(today);
      setSelectedCourseId(teacherData.courses[0]?.id ?? "");
    }
  };

  const handleLoginAttempt = async (email: string, password: string, role: UserRole) => {
    const { user, token } = await authApi.login({
      email: email.trim().toLowerCase(),
      password,
      role
    });
    setToken(token);
    return user;
  };

  const handleRegisterAttempt = async (input: RegisterInput, confirmPassword: string) => {
    const validationError = validateRegisterInput(input, confirmPassword);
    if (validationError) {
      throw new ApiError(400, { message: validationError, code: validationError });
    }

    const { user, token } = await authApi.register({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      confirmPassword,
      role: input.role
    });
    setToken(token);
    return user;
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // stateless JWT — ignore network errors on logout
    }
    setToken(null);
    setCurrentUser(null);
    setCourses([]);
    setEnrollments([]);
    setStudents([]);
    setLogs([]);
    setSessions([]);
    setTeacherStats([]);
    setMarkingSession(null);
    setActivePinCode("");
    setActiveScreen("login");
  };

  const handleGoHome = () => {
    if (currentUser) {
      setActiveScreen(currentUser.redirectTo);
    } else {
      setActiveScreen("login");
    }
  };

  const handleNavigateToMarking = async (courseId: string) => {
    try {
      const data = await loadMarkingData(courseId, today);
      const course = courses.find((item) => item.id === courseId);
      const session = course ? applyCourseScheduleToSession(data.session, course) : data.session;
      setSelectedCourseId(courseId);
      setMarkingSession(session);
      setActivePinCode(session.pinCode);
      setSessions((prev) => upsertSession(prev, session));
      setStudents(rosterToStudents(data.students));
      setLogs((prev) => {
        const others = prev.filter((log) => log.courseId !== courseId || log.date !== today);
        return [...data.logs, ...others];
      });
      setActiveScreen("teacher_marking");
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleQuickMarkAction = async (
    studentId: string,
    courseId: string,
    status: "present" | "late" | "absent"
  ) => {
    try {
      const { log } = await attendanceApi.quickMark({ courseId, studentId, status, date: today });
      setLogs((prev) => [...prev.filter((item) => item.id !== log.id), log]);
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleSaveSessionRecords = async (
    courseId: string,
    pin: string,
    records: AttendanceRecord[]
  ) => {
    if (!markingSession) return;

    try {
      const { logs: submittedLogs } = await attendanceApi.sessionSubmit({
        courseId,
        sessionId: markingSession.id,
        pinCode: pin,
        records
      });

      setActivePinCode(pin);
      setLogs((prev) => {
        const others = prev.filter((log) => log.courseId !== courseId || log.date !== today);
        return [...submittedLogs, ...others];
      });
      setActiveScreen("teacher_dash");
      await refreshTeacherData();
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleSyncPinCode = async (courseId: string) => {
    if (!markingSession) return activePinCode;

    try {
      const { session } = await sessionApi.regeneratePin(markingSession.id);
      const course = courses.find((item) => item.id === session.courseId);
      const scheduled = course ? applyCourseScheduleToSession(session, course) : session;
      setMarkingSession(scheduled);
      setActivePinCode(scheduled.pinCode);
      setSessions((prev) => upsertSession(prev, scheduled));
      return session.pinCode;
    } catch (error) {
      flashActionError(error);
      return activePinCode;
    }
  };

  const handleCreateCourse = async (input: CourseInput) => {
    try {
      const { course } = await courseApi.create(input);
      setCourses((prev) => [...prev, course]);
      setSelectedCourseId((current) => current || course.id);
      await refreshTeacherData();
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleUpdateCourse = async (courseId: string, input: CourseInput) => {
    try {
      const { course } = await courseApi.update(courseId, input);
      setCourses((prev) => prev.map((item) => (item.id === courseId ? course : item)));
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await courseApi.delete(courseId);
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setSessions((prev) => prev.filter((session) => session.courseId !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
      }
      await refreshTeacherData();
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleRequestEnrollment = async (studentId: string, courseId: string) => {
    try {
      const { enrollment } = await enrollmentApi.create({ courseId });
      setEnrollments((prev) => {
        const existing = prev.find(
          (item) => item.studentId === studentId && item.courseId === courseId
        );
        if (existing) {
          return prev.map((item) => (item.id === existing.id ? enrollment : item));
        }
        return [...prev, enrollment];
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "enrollmentAlreadyApproved" || error.code === "enrollmentAlreadyPending") {
          return false;
        }
      }
      flashActionError(error);
      return false;
    }
  };

  const handleApproveEnrollment = async (enrollmentId: string) => {
    try {
      const { enrollment } = await enrollmentApi.approve(enrollmentId);
      setEnrollments((prev) => prev.map((item) => (item.id === enrollmentId ? enrollment : item)));
      await refreshTeacherData();
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleRejectEnrollment = async (enrollmentId: string) => {
    try {
      const { enrollment } = await enrollmentApi.reject(enrollmentId);
      setEnrollments((prev) => prev.map((item) => (item.id === enrollmentId ? enrollment : item)));
    } catch (error) {
      flashActionError(error);
    }
  };

  const handleStudentCheckIn = async (courseId: string, pinCode: string, photoUrl: string) => {
    if (!currentUser || !studentActiveSession) {
      throw new Error(language === "en" ? "Check-in session unavailable." : "Không tìm thấy phiên điểm danh.");
    }

    const { log } = await attendanceApi.checkIn({
      courseId,
      sessionId: studentActiveSession.id,
      pinCode,
      photoUrl,
      capturedAt: new Date().toISOString()
    });

    setLogs((prev) => [...prev.filter((item) => item.id !== log.id), log]);
    await refreshStudentData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {!storeReady ? (
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-sm font-medium text-slate-400">
            {language === "en" ? "Loading..." : "Đang tải..."}
          </span>
        </div>
      ) : (
        <>
          {actionError && (
            <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-800 shadow-xl">
              {actionError}
            </div>
          )}

          <header
            ref={headerRef}
            className={`fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur transition-transform duration-300 ease-in-out will-change-transform ${
              headerVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={handleGoHome}>
                <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
                  EA
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 tracking-tight text-base flex items-center space-x-1">
                    <span>{t.appName}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-mono uppercase font-black tracking-wide ml-1">
                      V2.6
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider block uppercase -mt-0.5">
                    {t.tagline}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {currentUser && (
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                        currentUser.role === "teacher"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {currentUser.role === "teacher" ? (
                        <GraduationCap className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-800 leading-tight">
                        {currentUser.name}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                        {currentUser.role === "teacher" ? t.loginRoleTeacher : t.loginRoleStudent}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setLanguage(language === "en" ? "vi" : "en")}
                  className="flex items-center space-x-1.5 p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl transition duration-200"
                  title={t.languageLabel}
                  id="top-language-toggle-btn"
                >
                  <Globe className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-600">
                    {language === "en" ? "VI" : "EN"}
                  </span>
                </button>

                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-200"
                    title={t.logout}
                    id="logout-btn"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <main
            className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10"
            style={{ paddingTop: headerHeight + 24, minHeight: "100dvh" }}
          >
            {activeScreen === "login" && (
              <LoginScreen
                language={language}
                setLanguage={setLanguage}
                onEnter={(user) => {
                  void handleAuthSuccess(user);
                }}
                onGoToRegister={() => setActiveScreen("register")}
                onLogin={handleLoginAttempt}
              />
            )}

            {activeScreen === "register" && (
              <RegisterScreen
                language={language}
                setLanguage={setLanguage}
                onRegister={handleRegisterAttempt}
                onSuccess={(user) => {
                  void handleAuthSuccess(user);
                }}
                onGoToLogin={() => setActiveScreen("login")}
              />
            )}

            {currentUser?.role === "teacher" && activeScreen === "teacher_dash" && (
              <TeacherDashboard
                language={language}
                teacherName={currentUser.name}
                courses={teacherCourses}
                students={students}
                quickTasks={markingTasks}
                onQuickAction={(studentId, courseId, status) => {
                  void handleQuickMarkAction(studentId, courseId, status);
                }}
                onNavigateToMarking={(courseId) => {
                  void handleNavigateToMarking(courseId);
                }}
                averageAttendanceRate={averageAttendanceRate}
                courseTodayStats={teacherCourseTodayStats}
                enrolledStudentCount={enrolledStudentCount}
                openSessionsToday={openSessionsToday}
                pendingEnrollments={pendingEnrollments}
                onCreateCourse={handleCreateCourse}
                onUpdateCourse={handleUpdateCourse}
                onDeleteCourse={(courseId) => {
                  void handleDeleteCourse(courseId);
                }}
                onApproveEnrollment={(enrollmentId) => {
                  void handleApproveEnrollment(enrollmentId);
                }}
                onRejectEnrollment={(enrollmentId) => {
                  void handleRejectEnrollment(enrollmentId);
                }}
              />
            )}

            {currentUser?.role === "teacher" && activeScreen === "teacher_marking" && selectedCourse && (
              <AttendanceMarking
                language={language}
                course={selectedCourse}
                students={markingStudents}
                logs={logs}
                initialActiveRecords={logs
                  .filter((log) => log.courseId === selectedCourse.id && log.date === today)
                  .map((log) => ({
                    studentId: log.studentId,
                    status: log.status,
                    timestamp: log.timestamp,
                    verificationMethod: log.verificationMethod,
                    verificationPhoto: log.verificationPhoto,
                    verificationConfidence: log.verificationConfidence
                  }))}
                onBack={() => setActiveScreen("teacher_dash")}
                onSubmitSession={(courseId, pin, records) => {
                  void handleSaveSessionRecords(courseId, pin, records);
                }}
                onGeneratePinInParent={(courseId) => handleSyncPinCode(courseId)}
                currentPin={activePinCode}
              />
            )}

            {currentUser?.role === "student" && activeScreen === "student_dash" && (
              <StudentDashboard
                language={language}
                courses={studentEnrolledCourses}
                allCourses={displayCourses}
                enrollments={enrollments.filter((item) => item.studentId === currentUser.id)}
                logs={logs}
                studentName={currentUser.name}
                studentId={currentUser.id}
                openCheckInOptions={studentOpenCheckInOptions}
                onRequestEnrollment={(courseId) => handleRequestEnrollment(currentUser.id, courseId)}
                onStartCheckIn={(courseId) => {
                  const option = studentOpenCheckInOptions.find((item) => item.course.id === courseId);
                  if (option && !option.alreadyCheckedIn) {
                    setStudentCheckInCourseId(courseId);
                    setActiveScreen("student_checkin");
                  }
                }}
              />
            )}

            {currentUser?.role === "student" &&
              activeScreen === "student_checkin" &&
              studentCheckInCourse &&
              studentActiveSession && (
                <StudentCheckIn
                  language={language}
                  course={studentCheckInCourse}
                  session={studentActiveSession}
                  studentName={currentUser.name}
                  studentId={currentUser.id}
                  onBack={() => setActiveScreen("student_dash")}
                  onCheckIn={async (pinCode, photoUrl) => {
                    await handleStudentCheckIn(studentCheckInCourse.id, pinCode, photoUrl);
                  }}
                  onExit={() => setActiveScreen("student_dash")}
                />
              )}
          </main>

          <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400 font-medium">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-500">EduAttend Academic Hub</span>
              </div>
              <div>
                <span>© 2026 EduAttend platform • Powered by DeepMind & Antigravity</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
