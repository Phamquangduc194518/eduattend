export type Language = "en" | "vi";
export type UserRole = "teacher" | "student";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  redirectTo: "teacher_dash" | "student_dash";
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getLoginRoleLabels(language: Language) {
  return {
    enterAsTeacher: language === "en" ? "Faculty (Teacher)" : "Giảng viên",
    enterAsStudent: language === "en" ? "Student" : "Sinh viên"
  };
}

export function getTeacherGreeting(language: Language, teacherName: string) {
  return language === "en" ? `Good Morning, ${teacherName}` : `Xin chào, ${teacherName}`;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatarGradient: string;
  initials: string;
}

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  instructorId?: string;
  room: string;
  scheduleDays: Weekday[];
  startTime: string;
  endTime: string;
  studentCount: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  studentName?: string;
  studentEmail?: string;
  courseCode?: string;
  courseName?: string;
}

export function normalizeEnrollments(items: Enrollment[]): Enrollment[] {
  return items.map((item, index) => ({
    id: item.id || `ENR-SEED-${index}`,
    studentId: item.studentId,
    courseId: item.courseId,
    status: item.status || "approved",
    requestedAt: item.requestedAt || new Date().toISOString(),
    studentName: item.studentName,
    studentEmail: item.studentEmail,
    courseCode: item.courseCode,
    courseName: item.courseName
  }));
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "late" | "absent" | "pending";
  timestamp?: string;
  notes?: string;
  verificationMethod?: "pin" | "face" | "manual";
  verificationConfidence?: number; // e.g. 0.98 for face
  verificationPhoto?: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  date: string;
  pinCode: string;
  status: "open" | "closed";
  openedAt: string;
  expiresAt: string;
}

function sessionDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
}

export function getSessionClassWindow(
  session: AttendanceSession,
  course: Pick<Course, "startTime" | "endTime">
): { start: Date; end: Date } {
  return {
    start: sessionDateTime(session.date, course.startTime),
    end: sessionDateTime(session.date, course.endTime)
  };
}

/** Gán openedAt = đầu buổi, expiresAt = cuối buổi theo lịch học phần. */
export function applyCourseScheduleToSession(
  session: AttendanceSession,
  course: Pick<Course, "startTime" | "endTime">
): AttendanceSession {
  const { start, end } = getSessionClassWindow(session, course);
  return {
    ...session,
    openedAt: start.toISOString(),
    expiresAt: end.toISOString()
  };
}

export function isSessionActive(
  session: AttendanceSession,
  course?: Pick<Course, "startTime" | "endTime">
): boolean {
  if (session.status !== "open") return false;

  const now = new Date();
  if (course?.startTime && course?.endTime) {
    const { start, end } = getSessionClassWindow(session, course);
    return now >= start && now <= end;
  }

  if (session.openedAt) {
    return now >= new Date(session.openedAt) && now <= new Date(session.expiresAt);
  }

  return new Date(session.expiresAt) > now;
}

export interface AttendanceLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  courseId?: string;
  courseCode: string;
  courseName: string;
  sessionId?: string;
  date: string;
  timestamp: string;
  status: "present" | "late" | "absent";
  verificationMethod: "pin" | "face" | "manual";
  verificationConfidence?: number;
  verificationPhoto?: string;
}

export const TRANSLATIONS = {
  en: {
    // Nav & System
    appName: "EduAttend",
    tagline: "Smart Attendance System",
    languageLabel: "Language / Ngôn ngữ",
    switchRole: "View Screen / Role:",
    roleTeacherDash: "Teacher: Overview",
    roleTeacherMarking: "Teacher: Session Marking",
    roleStudentDash: "Student: Dashboard",
    roleStudentPin: "Student: PIN Check-In",
    roleStudentFace: "Student: Face Check-In",
    roleAdminLog: "Admin: Logs & Audit",
    themeToggle: "Theme Toggle",
    searchPlaceholder: "Search students by name or ID...",
    noResults: "No records found matching current criteria.",
    notifications: "Notifications",

    // Common Buttons
    present: "Present",
    late: "Late",
    absent: "Absent",
    pending: "Pending",
    pShort: "P",
    lShort: "L",
    aShort: "A",
    submit: "Submit Attendance",
    submitting: "Submitting...",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    verify: "Verify",
    actions: "Actions",
    filter: "Filters",
    close: "Close",

    // Dashboard Stats
    classesToday: "Classes Today",
    totalStudents: "Total students",
    avgAttendance: "Avg Attendance",
    attendanceByClass: "Today's attendance by class",
    attendanceMarkedSummary: "{{present}} present · {{late}} late · {{absent}} absent · {{unmarked}} pending",
    pendingMarking: "Pending Quick Actions",
    scheduleToday: "Today's Schedule",
    courseCode: "Course Code",
    room: "Room",
    time: "Time",
    instructor: "Instructor",

    // Attendance Marking View
    activeSession: "Active Check-In Session",
    date: "Date",
    sessionSummary: "Session Summary",
    statusRate: "Status Distribution",
    unmarkedHint: "Select student status, then click 'Submit' to log results.",
    markingProgress: "Marking Progress",
    generatePin: "Pin Check-In Code",
    pinInstruction: "Instruct students to input this code on their device:",
    pinActive: "Active PIN Code",
    pinGenerateBtn: "Regenerate Dynamic PIN",

    // Student Dashboard
    studentWelcome: "Welcome Back",
    overviewScore: "Your Attendance Rate",
    overviewLabel: "Average attendance rate across each enrolled module (0% if no check-ins yet).",
    classesEnrolled: "Enrolled Modules",
    recentActivity: "Recent Attendance Logs",
    countdownTitle: "Next Scheduled Session",
    countdownMinutes: "minutes remaining",
    countdownLocked: "Wait for instructor to open check-in",
    sessionOpen: "Check-in session is open",
    openCheckInSessions: "Open check-in sessions",
    noOpenCheckInSessions: "No class has an open check-in session. Wait for your instructor.",
    sessionClosed: "No active check-in session",
    sessionExpired: "Session expired — ask your instructor",
    sessionNotStarted: "Check-in has not started yet — wait until class time",
    startCheckInBtn: "Start Check-In (PIN + Face)",
    checkInStepPin: "Step 1 of 2 — Enter PIN",
    checkInStepFace: "Step 2 of 2 — Face verification",
    checkInTwoStepHint: "Two-step verification: enter the class PIN, then capture your face.",
    quickCheckIn: "Secure Check-In",
    faceBiometricBtn: "Face Recognition",
    pinCodeBtn: "6-Digit PIN Entry",
    attendanceRate: "Attendance Rate",

    // Student PIN Screen
    pinScreenTitle: "Dynamic PIN Validation",
    pinInstructions: "Enter the 6-digit PIN your instructor created for this class session. You must complete face verification next.",
    pinResultVerifying: "Verifying credentials, please hold...",
    pinResultSuccess: "PIN verified",
    pinResultSuccessDesc: "Proceed to face verification to complete your check-in.",
    pinContinueToFace: "Continue to Face Verification",
    pinSessionClosed: "This check-in session is closed. Ask your instructor to open a new session.",
    pinSessionExpired: "This session has expired. Ask your instructor for a new PIN.",
    pinResultError: "Invalid PIN Code Entered",
    pinResultErrorDesc: "The passcode entered does not match the active session PIN. Please verify with your instructor.",
    deleteKey: "DEL",

    // Student Face Screen
    faceScreenTitle: "Face Check-In Node",
    faceScanning: "Face Detected: Analyzing Biometrics...",
    faceReady: "Align face inside scanning bounds",
    cameraLoading: "Requesting camera access...",
    cameraRetry: "Allow camera & retry",
    cameraDenied: "Camera access denied. Click the button below to try again or allow camera in browser settings.",
    faceMatched: "Face Match Found: ",
    confidenceLabel: "AI Confidence Score",
    faceCaptureBtn: "Take Photo & Check-In",
    faceSuccessTitle: "Verification Complete",
    faceSuccessDesc: "Your facial details match the verified biometric profile on record. Check-in registered with ",
    checkInCompleteDesc: "PIN and face verification completed. Your attendance has been recorded.",
    alreadyCheckedIn: "You have already checked in for this class today.",
    alreadyCheckedInBtn: "Already checked in",
    backToDashboardBtn: "Back to Dashboard",
    faceNotDetected: "No face detected. Please align your face inside the frame and try again.",
    faceCaptureError: "Could not capture photo. Please try again.",
    faceUploading: "Uploading photo to cloud...",
    faceCheckingIn: "Submitting check-in...",
    faceSaving: "Processing...",
    faceSaveError: "Could not complete check-in. Please try again.",
    photoUrlRequired: "Check-in photo is missing. Please capture again.",
    invalidPhotoUrl: "Invalid photo URL. Please try again.",
    firebaseNotConfigured:
      "Chưa cấu hình Firebase. Tạo file .env từ .env.example và điền VITE_FIREBASE_* (file .env không được commit).",
    teacherFacePhotos: "Face Check-In Photos",
    teacherFacePhotosHint: "Click a record or photo to view the full check-in image.",
    teacherPhotoPreviewTitle: "Face Check-In Photo",
    teacherPhotoPreviewHint: "Verify the student's identity at check-in time.",
    viewPhotoBtn: "View photo",

    // Course catalog & enrollment
    browseCourses: "Browse & Enroll",
    browseCoursesHint: "Search modules and request enrollment. Your instructor must approve before you can check in.",
    enrollBtn: "Request enrollment",
    enrolledBtn: "Enrolled",
    pendingEnrollment: "Awaiting approval",
    rejectedEnrollment: "Rejected",
    enrollmentRequested: "Enrollment request sent. Waiting for instructor approval.",
    enrollmentAlreadyPending: "You already have a pending request for this module.",
    enrollmentAlreadyApproved: "You are already enrolled in this module.",
    noCoursesFound: "No modules match your search.",

    // Teacher course management
    manageCourses: "Manage Classes",
    addCourseBtn: "Add class",
    editCourseBtn: "Edit",
    deleteCourseBtn: "Delete",
    saveCourseBtn: "Save",
    cancelCourseBtn: "Cancel",
    courseCodeLabel: "Course code",
    courseNameLabel: "Course name",
    courseRoomLabel: "Room",
    courseDaysLabel: "Days of week",
    courseStartLabel: "Start time",
    courseEndLabel: "End time",
    courseTimeLabel: "Schedule",
    deleteCourseTitle: "Delete this class?",
    deleteCourseDesc: "This will remove the class and all related enrollment requests.",
    pendingEnrollments: "Enrollment Requests",
    pendingEnrollmentsHint: "Approve or reject student requests to join your classes.",
    approveEnrollment: "Approve",
    rejectEnrollment: "Reject",
    noPendingEnrollments: "No pending enrollment requests.",
    courseSaved: "Class saved successfully.",
    courseDeleted: "Class deleted.",
    cameraError: "Unable to load webcam. Showing high-fidelity system simulation...",
    recentScanLogs: "Recent Biometric Logs",
    simulatedCamera: "Camera Node Simulated Stream",

    // Admin Log / Audit Screen
    adminLogTitle: "Attendance Registry & Audting Logs",
    filterCourse: "Module Course",
    filterStatus: "Attendance Status",
    filterType: "Verification Type",
    logStudentId: "Student ID",
    logStudentName: "Student Name",
    logTimestamp: "Timestamp",
    logVerificationStatus: "Verification Log",
    logPhoto: "Audit Capture",
    verifiedState: "Verified",
    overrideConfirmTitle: "Manual Override Authentication",
    overrideSuccess: "Log edited successfully.",
    overrideExplanation: "Manually adjust student's verified attendance log. Audited updates are logged.",

    // Login/Welcome Intro
    roleSelectTitle: "EduAttend Gatekeeper System",
    roleSelectSubtitle: "Select a role and sign in to access the corresponding dashboard.",
    logout: "Log Out Profile",
    loginTitle: "Sign In to Continue",
    loginSubtitleTeacher: "Faculty portal — verify your credentials to access teaching tools.",
    loginSubtitleStudent: "Student portal — verify your credentials to access your dashboard.",
    emailLabel: "Email Address",
    emailPlaceholder: "name@hust.edu.vn",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Sign In",
    loginBack: "Back to role selection",
    loginError: "Invalid email or password. Please try again.",
    loginRoleTeacher: "Faculty Access",
    loginRoleStudent: "Student Access",
    showPassword: "Show",
    hidePassword: "Hide",
    loginNoAccount: "Don't have an account?",
    loginGoRegister: "Create account",
    registerTitle: "Create Your Account",
    registerSubtitle: "Choose your role and register with your @hust.edu.vn email.",
    registerAsTeacher: "Register as Faculty",
    registerAsStudent: "Register as Student",
    registerTeacherHint: "Manage classes and attendance sessions",
    registerStudentHint: "Check in and track your attendance",
    registerFormTitle: "Account Details",
    registerFormSubtitle: "Use your official @hust.edu.vn email address.",
    registerNameLabel: "Full Name",
    registerNamePlaceholder: "Nguyen Van A",
    registerEmailPlaceholder: "name@hust.edu.vn",
    registerEmailHint: "Email must end with @hust.edu.vn",
    registerPasswordPlaceholder: "At least 6 characters",
    registerConfirmLabel: "Confirm Password",
    registerConfirmPlaceholder: "Re-enter your password",
    registerButton: "Create Account",
    registerSubmitting: "Creating account...",
    registerBack: "Back to role selection",
    registerHasAccount: "Already have an account?",
    registerGoLogin: "Sign in",
    registerErrorName: "Please enter your full name.",
    registerErrorEmail: "Email must use the @hust.edu.vn domain.",
    registerErrorPassword: "Password must be at least 6 characters.",
    registerErrorConfirm: "Passwords do not match.",
    registerErrorTaken: "This email is already registered.",
    registerErrorGeneric: "Could not create account. Please try again."
  },
  vi: {
    // Nav & System
    appName: "EduAttend",
    tagline: "Hệ thống Điểm danh Thông minh",
    languageLabel: "Language / Ngôn ngữ",
    switchRole: "Xem Phân hệ / Màn hình:",
    roleTeacherDash: "Giảng viên: Tổng quan",
    roleTeacherMarking: "Giảng viên: Điểm danh Lớp",
    roleStudentDash: "Sinh viên: Bảng điều khiển",
    roleStudentPin: "Sinh viên: Điểm danh qua PIN",
    roleStudentFace: "Sinh viên: Điểm danh Khuôn mặt",
    roleAdminLog: "Quản trị: Lịch sử & Kiểm tra",
    themeToggle: "Đổi Giao diện",
    searchPlaceholder: "Tìm bằng tên hoặc MSSV...",
    noResults: "Không tìm thấy dữ liệu phù hợp.",
    notifications: "Thông báo",

    // Common Buttons
    present: "Có mặt",
    late: "Đi muộn",
    absent: "Vắng mặt",
    pending: "Chờ điểm danh",
    pShort: "Có",
    lShort: "Muộn",
    aShort: "Vắng",
    submit: "Xác nhận Điểm danh",
    submitting: "Đang lưu...",
    save: "Lưu",
    cancel: "Hủy bỏ",
    confirm: "Xác nhận",
    verify: "Duyệt ảnh",
    actions: "Thao tác",
    filter: "Bộ lọc",
    close: "Đóng",

    // Dashboard Stats
    classesToday: "Số lớp Hôm nay",
    totalStudents: "Tổng số Học viên",
    avgAttendance: "Tỷ lệ Điểm danh",
    attendanceByClass: "Điểm danh hôm nay theo lớp",
    attendanceMarkedSummary: "{{present}} có mặt · {{late}} muộn · {{absent}} vắng · {{unmarked}} chưa điểm danh",
    pendingMarking: "Xác nhận nhanh còn trống",
    scheduleToday: "Lịch giảng dạy Hôm nay",
    courseCode: "Mã môn",
    room: "Phòng",
    time: "Thời gian",
    instructor: "Giảng viên",

    // Attendance Marking View
    activeSession: "Phiên Điểm danh Đang mở",
    date: "Ngày học",
    sessionSummary: "Báo cáo Phiên điểm danh",
    statusRate: "Phân bổ Trạng thái",
    unmarkedHint: "Chọn trạng thái cho học viên, sau đó nhấn 'Xác nhận' để gửi kết quả.",
    markingProgress: "Tiến độ Điểm danh",
    generatePin: "Mã PIN Điểm danh",
    pinInstruction: "Yêu cầu sinh viên nhập mã này trên thiết bị cá nhân:",
    pinActive: "Mã PIN đang hoạt động",
    pinGenerateBtn: "Tạo mới Mã PIN",

    // Student Dashboard
    studentWelcome: "Chào mừng trở lại",
    overviewScore: "Tỷ lệ chuyên cần của bạn",
    overviewLabel: "Trung bình tỷ lệ điểm danh từng học phần đã đăng ký (chưa điểm danh = 0%).",
    classesEnrolled: "Các Học phần đã Đăng ký",
    recentActivity: "Lịch sử điểm danh Gần đây",
    countdownTitle: "Tiết học Tiếp theo",
    countdownMinutes: "phút nữa bắt đầu",
    countdownLocked: "Chờ giảng viên kích hoạt điểm danh",
    sessionOpen: "Phiên điểm danh đang mở",
    openCheckInSessions: "Phiên điểm danh đang mở",
    noOpenCheckInSessions: "Chưa có lớp nào mở phiên điểm danh. Hãy chờ giảng viên.",
    sessionClosed: "Chưa có phiên điểm danh",
    sessionExpired: "Phiên đã hết hạn — hỏi giảng viên",
    sessionNotStarted: "Chưa tới giờ điểm danh — vui lòng đợi đến giờ học",
    startCheckInBtn: "Bắt đầu điểm danh (PIN + Khuôn mặt)",
    checkInStepPin: "Bước 1/2 — Nhập mã PIN",
    checkInStepFace: "Bước 2/2 — Xác thực khuôn mặt",
    checkInTwoStepHint: "Xác thực 2 lớp: nhập PIN lớp học, sau đó chụp ảnh khuôn mặt.",
    quickCheckIn: "Điểm danh bảo mật",
    faceBiometricBtn: "Xác thực Khuôn mặt",
    pinCodeBtn: "Nhập mã PIN 6 số",
    attendanceRate: "Tỷ lệ Chuyên cần",

    // Student PIN Screen
    pinScreenTitle: "Xác thực Mã PIN Động",
    pinInstructions: "Nhập mã PIN 6 chữ số do giảng viên tạo cho buổi học này. Sau đó bạn phải chụp ảnh khuôn mặt.",
    pinResultVerifying: "Đang kiểm tra thông tin, vui lòng chờ...",
    pinResultSuccess: "Xác thực PIN thành công",
    pinResultSuccessDesc: "Tiếp tục bước xác thực khuôn mặt để hoàn tất điểm danh.",
    pinContinueToFace: "Tiếp tục chụp ảnh khuôn mặt",
    pinSessionClosed: "Phiên điểm danh đã đóng. Hãy yêu cầu giảng viên mở phiên mới.",
    pinSessionExpired: "Phiên đã hết hạn. Hãy hỏi giảng viên lấy mã PIN mới.",
    pinResultError: "Mã PIN không chính xác",
    pinResultErrorDesc: "Mã vừa nhập không khớp với phiên học hiện hành. Vui lòng xác nhận lại với giảng viên.",
    deleteKey: "XÓA",

    // Student Face Screen
    faceScreenTitle: "Điểm danh Sinh trắc học",
    faceScanning: "Đã phát hiện khuôn mặt: Đang phân tích...",
    faceReady: "Căn chỉnh khuôn mặt vào giữa khung quét",
    cameraLoading: "Đang yêu cầu quyền truy cập camera...",
    cameraRetry: "Cho phép camera & thử lại",
    cameraDenied: "Không truy cập được camera. Nhấn nút bên dưới để thử lại hoặc bật quyền camera trong trình duyệt.",
    faceMatched: "Đã khớp khuôn mặt: ",
    confidenceLabel: "Mức độ tin cậy AI",
    faceCaptureBtn: "Chụp ảnh & Điểm danh",
    faceSuccessTitle: "Xác thực thành công",
    faceSuccessDesc: "Đặc điểm khuôn mặt khớp với hồ sơ lưu trữ. Điểm danh thành công với độ chính xác ",
    checkInCompleteDesc: "Bạn đã hoàn tất xác thực PIN và khuôn mặt. Điểm danh đã được ghi nhận.",
    alreadyCheckedIn: "Bạn đã điểm danh môn này hôm nay rồi.",
    alreadyCheckedInBtn: "Đã điểm danh",
    backToDashboardBtn: "Về trang chính",
    faceNotDetected: "Không phát hiện khuôn mặt. Vui lòng căn mặt vào giữa khung hình và thử lại.",
    faceCaptureError: "Không chụp được ảnh. Vui lòng thử lại.",
    faceUploading: "Đang tải ảnh lên cloud...",
    faceCheckingIn: "Đang gửi điểm danh...",
    faceSaving: "Đang xử lý...",
    faceSaveError: "Không hoàn tất được điểm danh. Vui lòng thử lại.",
    photoUrlRequired: "Chưa có ảnh điểm danh. Vui lòng chụp lại.",
    invalidPhotoUrl: "URL ảnh không hợp lệ. Vui lòng thử lại.",
    firebaseNotConfigured:
      "Chưa cấu hình Firebase. Tạo file .env từ .env.example và điền VITE_FIREBASE_* (file .env không được commit).",
    teacherFacePhotos: "Ảnh Điểm danh Khuôn mặt",
    teacherFacePhotosHint: "Bấm vào bản ghi hoặc ảnh để xem ảnh điểm danh phóng to.",
    teacherPhotoPreviewTitle: "Ảnh điểm danh khuôn mặt",
    teacherPhotoPreviewHint: "Giảng viên đối chiếu ảnh để xác minh sinh viên tại thời điểm điểm danh.",
    viewPhotoBtn: "Xem ảnh",

    browseCourses: "Tìm & Đăng ký học phần",
    browseCoursesHint: "Tìm học phần và gửi yêu cầu đăng ký. Giảng viên phải duyệt trước khi bạn điểm danh.",
    enrollBtn: "Đăng ký học phần",
    enrolledBtn: "Đã đăng ký",
    pendingEnrollment: "Chờ duyệt",
    rejectedEnrollment: "Từ chối",
    enrollmentRequested: "Đã gửi yêu cầu đăng ký. Đang chờ giảng viên duyệt.",
    enrollmentAlreadyPending: "Bạn đã có yêu cầu đang chờ duyệt cho học phần này.",
    enrollmentAlreadyApproved: "Bạn đã đăng ký học phần này rồi.",
    noCoursesFound: "Không tìm thấy học phần phù hợp.",

    manageCourses: "Quản lý lớp học",
    addCourseBtn: "Thêm lớp",
    editCourseBtn: "Sửa",
    deleteCourseBtn: "Xóa",
    saveCourseBtn: "Lưu",
    cancelCourseBtn: "Hủy",
    courseCodeLabel: "Mã học phần",
    courseNameLabel: "Tên học phần",
    courseRoomLabel: "Phòng học",
    courseDaysLabel: "Thứ trong tuần",
    courseStartLabel: "Giờ bắt đầu",
    courseEndLabel: "Giờ kết thúc",
    courseTimeLabel: "Lịch học",
    deleteCourseTitle: "Xóa lớp học này?",
    deleteCourseDesc: "Lớp học và các yêu cầu đăng ký liên quan sẽ bị xóa.",
    pendingEnrollments: "Yêu cầu đăng ký",
    pendingEnrollmentsHint: "Duyệt hoặc từ chối sinh viên vào lớp của bạn.",
    approveEnrollment: "Duyệt",
    rejectEnrollment: "Từ chối",
    noPendingEnrollments: "Không có yêu cầu đăng ký nào.",
    courseSaved: "Đã lưu lớp học.",
    courseDeleted: "Đã xóa lớp học.",
    cameraError: "Không thể kết nối camera. Hệ thống đang mô phỏng dòng quét độ nét cao...",
    recentScanLogs: "Lịch sử Quét mặt Gần đây",
    simulatedCamera: "Nguồn Camera Mô phỏng",

    // Admin Log / Audit Screen
    adminLogTitle: "Sổ Nhật ký & Kiểm tra Điểm danh",
    filterCourse: "Học phần",
    filterStatus: "Trạng thái",
    filterType: "Hình thức điểm danh",
    logStudentId: "MSSV",
    logStudentName: "Họ và Tên",
    logTimestamp: "Giờ đi học",
    logVerificationStatus: "Phương thức Xác thực",
    logPhoto: "Ảnh Kiểm tra",
    verifiedState: "Đã xác minh",
    overrideConfirmTitle: "Chỉnh sửa Điểm danh Thủ công",
    overrideSuccess: "Thay đổi trạng thái thành công.",
    overrideExplanation: "Cập nhật thủ công cho sinh viên này. Mọi thay đổi sẽ được lưu vào nhật ký hệ thống.",

    // Login/Welcome Intro
    roleSelectTitle: "Hệ thống Cổng EduAttend",
    roleSelectSubtitle: "Chọn phân hệ và đăng nhập để truy cập bảng điều khiển tương ứng.",
    logout: "Đăng xuất tài khoản",
    loginTitle: "Đăng nhập để tiếp tục",
    loginSubtitleTeacher: "Cổng giảng viên — xác thực thông tin để truy cập công cụ giảng dạy.",
    loginSubtitleStudent: "Cổng sinh viên — xác thực thông tin để truy cập bảng điều khiển.",
    emailLabel: "Địa chỉ Email",
    emailPlaceholder: "ten@hust.edu.vn",
    passwordLabel: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu của bạn",
    rememberMe: "Ghi nhớ đăng nhập",
    forgotPassword: "Quên mật khẩu?",
    loginButton: "Đăng nhập",
    loginBack: "Quay lại chọn phân hệ",
    loginError: "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
    loginRoleTeacher: "Phân hệ Giảng viên",
    loginRoleStudent: "Phân hệ Sinh viên",
    showPassword: "Hiện",
    hidePassword: "Ẩn",
    loginNoAccount: "Chưa có tài khoản?",
    loginGoRegister: "Đăng ký ngay",
    registerTitle: "Tạo tài khoản mới",
    registerSubtitle: "Chọn phân hệ và đăng ký bằng email @hust.edu.vn.",
    registerAsTeacher: "Đăng ký Giảng viên",
    registerAsStudent: "Đăng ký Sinh viên",
    registerTeacherHint: "Quản lý lớp học và phiên điểm danh",
    registerStudentHint: "Điểm danh và theo dõi chuyên cần",
    registerFormTitle: "Thông tin tài khoản",
    registerFormSubtitle: "Sử dụng email chính thức có đuôi @hust.edu.vn.",
    registerNameLabel: "Họ và tên",
    registerNamePlaceholder: "Nguyễn Văn A",
    registerEmailPlaceholder: "ten@hust.edu.vn",
    registerEmailHint: "Email bắt buộc có đuôi @hust.edu.vn",
    registerPasswordPlaceholder: "Tối thiểu 6 ký tự",
    registerConfirmLabel: "Xác nhận mật khẩu",
    registerConfirmPlaceholder: "Nhập lại mật khẩu",
    registerButton: "Tạo tài khoản",
    registerSubmitting: "Đang tạo tài khoản...",
    registerBack: "Quay lại chọn phân hệ",
    registerHasAccount: "Đã có tài khoản?",
    registerGoLogin: "Đăng nhập",
    registerErrorName: "Vui lòng nhập họ và tên.",
    registerErrorEmail: "Email phải có đuôi @hust.edu.vn.",
    registerErrorPassword: "Mật khẩu phải có ít nhất 6 ký tự.",
    registerErrorConfirm: "Mật khẩu xác nhận không khớp.",
    registerErrorTaken: "Email này đã được đăng ký.",
    registerErrorGeneric: "Không tạo được tài khoản. Vui lòng thử lại."
  }
};
