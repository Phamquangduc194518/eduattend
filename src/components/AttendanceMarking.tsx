import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, Student, AttendanceRecord, AttendanceLogEntry } from "../types";
import { todayStr } from "../utils/attendance";
import { formatCourseSchedule } from "../utils/courses";
import { ArrowLeft, Search, RefreshCw, KeyRound, CheckCircle2, AlertCircle, Clock, Check, Camera, ImageIcon } from "lucide-react";
import TeacherPhotoPreviewModal, { PhotoPreviewData } from "./TeacherPhotoPreviewModal";

interface AttendanceMarkingProps {
  language: Language;
  course: Course;
  students: Student[];
  logs: AttendanceLogEntry[];
  initialActiveRecords: AttendanceRecord[];
  onBack: () => void;
  onSubmitSession: (courseId: string, pin: string, records: AttendanceRecord[]) => void;
  onGeneratePinInParent: (courseId: string) => Promise<string> | string;
  currentPin: string;
}

export default function AttendanceMarking({
  language,
  course,
  students,
  logs,
  initialActiveRecords,
  onBack,
  onSubmitSession,
  onGeneratePinInParent,
  currentPin
}: AttendanceMarkingProps) {
  const t = TRANSLATIONS[language];

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Keep a local draft records map for instant interactivity before submission
  const [draftRecords, setDraftRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const recordsMap: Record<string, AttendanceRecord> = {};
    // Populate with existing or defaults
    students.forEach((stu) => {
      const match = initialActiveRecords.find((r) => r.studentId === stu.id);
      recordsMap[stu.id] = match || { studentId: stu.id, status: "pending" };
    });
    return recordsMap;
  });

  const [activePin, setActivePin] = useState(currentPin || "");

  React.useEffect(() => {
    setActivePin(currentPin);
  }, [currentPin]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<PhotoPreviewData | null>(null);

  const openPhotoPreview = (data: PhotoPreviewData) => {
    setPhotoPreview(data);
  };

  // Generate a random PIN
  const handleRegeneratePin = async () => {
    const newPin = await onGeneratePinInParent(course.id);
    setActivePin(newPin);
  };

  // Toggle status for student
  const updateStatus = (studentId: string, status: "present" | "late" | "absent") => {
    setDraftRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        timestamp: status !== "absent" ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
        verificationMethod: "manual"
      }
    }));
  };

  // Bulk set all pending to present
  const markAllRemainingPresent = () => {
    setDraftRecords((prev) => {
      const updated = { ...prev };
      students.forEach((stu) => {
        if (updated[stu.id].status === "pending") {
          updated[stu.id] = {
            ...updated[stu.id],
            status: "present",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            verificationMethod: "manual"
          };
        }
      });
      return updated;
    });
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (stu) =>
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const recordsArray = Object.values(draftRecords) as AttendanceRecord[];
  const presentCount = recordsArray.filter((r) => r.status === "present").length;
  const lateCount = recordsArray.filter((r) => r.status === "late").length;
  const absentCount = recordsArray.filter((r) => r.status === "absent").length;
  const pendingCount = recordsArray.filter((r) => r.status === "pending").length;
  const totalCount = students.length;

  const markedCount = totalCount - pendingCount;
  const completionPercent = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0;

  const faceCheckInLogs = React.useMemo(() => {
    const today = todayStr();
    const seen = new Set<string>();
    return logs
      .filter(
        (log) =>
          log.courseCode === course.code &&
          log.date === today &&
          log.verificationMethod === "face" &&
          log.verificationPhoto &&
          (log.status === "present" || log.status === "late")
      )
      .filter((log) => {
        if (seen.has(log.studentId)) return false;
        seen.add(log.studentId);
        return true;
      });
  }, [logs, course.code]);

  const todayFaceLogsByStudent = React.useMemo(() => {
    const map = new Map<string, AttendanceLogEntry>();
    faceCheckInLogs.forEach((log) => {
      map.set(log.studentId, log);
    });
    return map;
  }, [faceCheckInLogs]);

  const handleFinalSubmit = () => {
    onSubmitSession(course.id, activePin, recordsArray);
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition duration-200 text-sm font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
          id="marking-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === "en" ? "Back to Dashboard" : "Về Trang Chủ"}</span>
        </button>

        <span className="text-xs font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
          <span>SESSION ACTIVE V2.0</span>
        </span>
      </div>

      {/* Classroom header card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-40 opacity-5 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-indigo-500 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md font-mono text-xs font-extrabold">
              {course.code}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900" id="marking-course-title">
              {course.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 font-medium">
              <span>{t.instructor}: <strong className="text-slate-800">{course.instructor}</strong></span>
              <span>•</span>
              <span>{t.room}: <strong className="text-slate-800">{course.room}</strong></span>
              <span>•</span>
              <span>{t.time}: <strong className="text-slate-800">{formatCourseSchedule(course, language)}</strong></span>
            </div>
          </div>
          
          {/* Dynamic PIN segment */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[200px]" id="pin-generation-section">
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold font-mono">{t.pinActive}</span>
            <div className="flex items-center space-x-3 mt-1.5">
              <span className="font-mono text-2xl font-black text-indigo-600 tracking-widest" id="active-pin-badge">
                {activePin.slice(0, 3)} {activePin.slice(3)}
              </span>
              <button
                onClick={handleRegeneratePin}
                className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                title={t.pinGenerateBtn}
                id="regenerate-pin-btn"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xxs text-center text-slate-400 mt-1 max-w-[170px] leading-tight">
              {language === "en"
                ? "Students must enter this PIN before face check-in."
                : "Sinh viên phải nhập PIN này trước khi chụp ảnh khuôn mặt."}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Counter & Fast actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Present card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center space-x-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
            {presentCount}
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold">{t.present}</span>
            <span className="block text-sm font-bold text-slate-700">{Math.round((presentCount / (totalCount || 1)) * 100)}% {t.totalStudents.toLowerCase()}</span>
          </div>
        </div>

        {/* Late card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center space-x-4">
          <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-black">
            {lateCount}
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold">{t.late}</span>
            <span className="block text-sm font-bold text-slate-700">{Math.round((lateCount / (totalCount || 1)) * 100)}% {t.totalStudents.toLowerCase()}</span>
          </div>
        </div>

        {/* Absent card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center space-x-4">
          <div className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center font-black">
            {absentCount}
          </div>
          <div>
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold">{t.absent}</span>
            <span className="block text-sm font-bold text-slate-700">{Math.round((absentCount / (totalCount || 1)) * 100)}% {t.totalStudents.toLowerCase()}</span>
          </div>
        </div>

        {/* Progress gauge card */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-center">
          <div className="flex justify-between items-center text-xxs uppercase tracking-wider text-slate-400 font-extrabold mb-1">
            <span>{t.markingProgress}</span>
            <span className="font-mono text-slate-600 font-bold">{completionPercent}% ({markedCount}/{totalCount})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student lists widget */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Table header operations */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              id="student-search-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            {pendingCount > 0 && (
              <button
                onClick={markAllRemainingPresent}
                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs transition duration-200"
                id="bulk-present-btn"
              >
                ✓ {language === "en" ? "Set Pending to Present" : "Gắn Chờ học thành Có mặt"}
              </button>
            )}
          </div>
        </div>

        {/* Student row listing */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">{t.noResults}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => {
              const record = draftRecords[student.id];
              const status = record?.status || "pending";
              const faceLog = todayFaceLogsByStudent.get(student.id);

              return (
                <div
                  key={student.id}
                  className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  id={`marking-row-${student.id}`}
                >
                  {/* Student details */}
                  <div className="flex items-center space-x-3.5">
                    <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${student.avatarGradient} text-white font-extrabold text-sm flex items-center justify-center shadow-inner`}>
                      {student.initials}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm leading-tight">{student.name}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-xxs text-slate-400">{student.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xxs text-slate-400 font-medium">{student.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status checklist buttons */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    {faceLog?.verificationPhoto && (
                      <button
                        type="button"
                        onClick={() =>
                          openPhotoPreview({
                            photoPath: faceLog.verificationPhoto!,
                            studentName: student.name,
                            studentId: student.id,
                            date: faceLog.date,
                            timestamp: faceLog.timestamp,
                            confidence: faceLog.verificationConfidence,
                            status: faceLog.status
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        id={`view-photo-btn-${student.id}`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{t.viewPhotoBtn}</span>
                      </button>
                    )}

                    {/* Present */}
                    <button
                      onClick={() => updateStatus(student.id, "present")}
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all duration-200 min-w-[76px] ${
                        status === "present"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                      id={`marking-btn-${student.id}-present`}
                    >
                      {t.present}
                    </button>

                    {/* Late */}
                    <button
                      onClick={() => updateStatus(student.id, "late")}
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all duration-200 min-w-[76px] ${
                        status === "late"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                      id={`marking-btn-${student.id}-late`}
                    >
                      {t.late}
                    </button>

                    {/* Absent */}
                    <button
                      onClick={() => updateStatus(student.id, "absent")}
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl border transition-all duration-200 min-w-[76px] ${
                        status === "absent"
                          ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                          : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                      id={`marking-btn-${student.id}-absent`}
                    >
                      {t.absent}
                    </button>

                    {/* Timestamp log indication for P/L */}
                    {record?.timestamp && (
                      <span className="ml-2 text-xxs text-slate-400 font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{record.timestamp}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {faceCheckInLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center space-x-2 mb-1">
              <Camera className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-extrabold text-slate-800">{t.teacherFacePhotos}</h3>
            </div>
            <p className="text-xs text-slate-400">{t.teacherFacePhotosHint}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {faceCheckInLogs.map((log) => (
              <div
                key={log.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  openPhotoPreview({
                    photoPath: log.verificationPhoto!,
                    studentName: log.studentName,
                    studentId: log.studentId,
                    date: log.date,
                    timestamp: log.timestamp,
                    confidence: log.verificationConfidence,
                    status: log.status
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPhotoPreview({
                      photoPath: log.verificationPhoto!,
                      studentName: log.studentName,
                      studentId: log.studentId,
                      date: log.date,
                      timestamp: log.timestamp,
                      confidence: log.verificationConfidence,
                      status: log.status
                    });
                  }
                }}
                className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-indigo-50/50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">{log.studentName}</p>
                  <p className="text-xxs font-mono text-slate-400 mt-0.5">
                    {log.studentId} • {log.date} • {log.timestamp}
                  </p>
                </div>
                <div className="flex items-center space-x-3 self-start sm:self-auto">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xxs font-mono font-black ${
                      log.status === "present"
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                        : "bg-amber-50 border border-amber-100 text-amber-700"
                    }`}
                  >
                    {log.status === "present" ? t.present : t.late}
                  </span>
                  {log.verificationPhoto && (
                    <div className="relative">
                      <img
                        src={log.verificationPhoto}
                        alt={`Ảnh điểm danh ${log.studentName}`}
                        className="h-12 w-12 rounded-lg object-cover border-2 border-indigo-100 shadow-sm"
                      />
                      {log.verificationConfidence !== undefined && (
                        <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded-full leading-none">
                          {Math.round(log.verificationConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating submit footer state */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="text-slate-500 text-xs font-medium">
          <AlertCircle className="h-4 w-4 inline-block -mt-0.5 mr-1.5 text-indigo-500" />
          <span>{t.unmarkedHint}</span>
        </div>
        <button
          onClick={handleFinalSubmit}
          className="bg-indigo-600 hover:bg-indigo-800 text-white font-extrabold px-6 py-3 rounded-2xl text-sm shadow-md hover:shadow-lg transition-all duration-200 self-end sm:self-auto"
          id="submit-attendance-session-btn"
        >
          {t.submit} ({markedCount}/{totalCount})
        </button>
      </div>

      {/* Submission Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-up">
            <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-5 scale-110 shadow-sm">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 text-center tracking-tight">
              {language === "en" ? "Attendance Submitted Successfully" : "Gửi dữ liệu Điểm danh Thành công"}
            </h3>
            <p className="text-sm text-slate-500 mt-2 text-center">
              {language === "en"
                ? `Saved status registry compiled for total ${markedCount} out of ${totalCount} students. Records can be reviewed and edited in the Admin Log panel.`
                : `Lịch sử chuyên cần cho ${markedCount} trên ${totalCount} sinh viên đã được cập nhật thành công. Dữ liệu đã lưu có thể chỉnh sửa thủ công tại trang Tổng hợp.`}
            </p>

            <div className="mt-8">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-sm"
                id="close-success-modal-btn"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      <TeacherPhotoPreviewModal
        language={language}
        preview={photoPreview}
        onClose={() => setPhotoPreview(null)}
      />
    </div>
  );
}
