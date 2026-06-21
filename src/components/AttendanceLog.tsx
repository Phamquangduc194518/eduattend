import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, AttendanceLogEntry } from "../types";
import { Filter, Search, Edit2, Sliders, CheckCircle2, ChevronRight, CornerDownRight, Download, Users } from "lucide-react";

interface AttendanceLogProps {
  language: Language;
  courses: Course[];
  logs: AttendanceLogEntry[];
  onUpdateLogStatus: (logId: string, newStatus: "present" | "late" | "absent") => void;
}

export default function AttendanceLog({
  language,
  courses,
  logs,
  onUpdateLogStatus
}: AttendanceLogProps) {
  const t = TRANSLATIONS[language];

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Selection state for manual override modal
  const [editingLog, setEditingLog] = useState<AttendanceLogEntry | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"present" | "late" | "absent">("present");
  const [toastText, setToastText] = useState("");

  // Handle manual override save
  const handleSaveOverrideStatus = () => {
    if (editingLog) {
      onUpdateLogStatus(editingLog.id, overrideStatus);
      setEditingLog(null);
      setToastText(t.overrideSuccess);
      setTimeout(() => setToastText(""), 3000);
    }
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === "all" || log.courseCode === filterCourse;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesType = filterType === "all" || log.verificationMethod === filterType;

    return matchesSearch && matchesCourse && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[60vh]">
      {/* Toast Alert */}
      {toastText && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-emerald-400 font-semibold px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* Primary header widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900" id="admin-log-title">
            {t.adminLogTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === "en" ? "Academic record logs and raw biometric audit trail summaries." : "Bản ghi hoạt động điểm danh và thống kê sinh trắc học học phần."}
          </p>
        </div>

        {/* Report export */}
        <button
          onClick={() => {
            alert(language === "en" ? "Registry report exported as CSV!" : "Đã xuất báo cáo điểm danh CSV!");
          }}
          className="flex items-center space-x-2 text-slate-700 font-bold bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl shadow-sm text-xs transition active:scale-95 self-start sm:self-auto"
          id="export-csv-btn"
        >
          <Download className="h-4 w-4 text-indigo-500" />
          <span>{language === "en" ? "Export Sheet (.CSV)" : "Xuất báo cáo .CSV"}</span>
        </button>
      </div>

      {/* Navigation Filter board */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Search */}
        <div className="space-y-1.5Col">
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold flex items-center space-x-1">
            <Search className="h-3 w-3" />
            <span>{language === "en" ? "Quick Search" : "Tìm kiếm nhanh"}</span>
          </span>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-xs font-semibold"
            id="log-search-input"
          />
        </div>

        {/* Filter Course Code */}
        <div>
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold flex items-center space-x-1">
            <Filter className="h-3 w-3" />
            <span>{t.filterCourse}</span>
          </span>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            id="filter-course-select"
          >
            <option value="all">{language === "en" ? "All Modules" : "Tất cả Môn học"}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Attendance Status */}
        <div>
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold flex items-center space-x-1">
            <Sliders className="h-3 w-3" />
            <span>{t.filterStatus}</span>
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            id="filter-status-select"
          >
            <option value="all">{language === "en" ? "All Statuses" : "Tất cả trạng thái"}</option>
            <option value="present">{t.present}</option>
            <option value="late">{t.late}</option>
            <option value="absent">{t.absent}</option>
          </select>
        </div>

        {/* Filter Verification Type */}
        <div>
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-extrabold flex items-center space-x-1">
            <Sliders className="h-3 w-3" />
            <span>{t.filterType}</span>
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full mt-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            id="filter-type-select"
          >
            <option value="all">{language === "en" ? "All Methods" : "Tất cả phương pháp"}</option>
            <option value="face">{language === "en" ? "Face Recognition" : "Xác thực khuôn mặt"}</option>
            <option value="pin">{language === "en" ? "6-Digit PIN Code" : "Xác thực mã PIN"}</option>
            <option value="manual">{language === "en" ? "Faculty Manual Override" : "Chỉnh sửa của GV"}</option>
          </select>
        </div>
      </div>

      {/* Main Audit Listing Sheet */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xxs font-extrabold font-mono text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">{t.logStudentId}</th>
                <th className="py-4 px-6">{t.logStudentName}</th>
                <th className="py-4 px-6">{language === "en" ? "Class Code" : "Môn học"}</th>
                <th className="py-4 px-6 text-center">{t.logTimestamp}</th>
                <th className="py-4 px-6 text-center">{t.logVerificationStatus}</th>
                <th className="py-4 px-6 text-center">{t.logPhoto}</th>
                <th className="py-4 px-6 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-white">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isPresent = log.status === "present";
                  const isLate = log.status === "late";
                  const isAbsent = log.status === "absent";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors" id={`log-row-${log.id}`}>
                      {/* Student ID */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">{log.studentId}</td>

                      {/* Student Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center uppercase shadow-inner border border-slate-200">
                            {log.studentName.split(" ").map((w) => w[0]).join("")}
                          </div>
                          <span className="font-bold text-slate-800">{log.studentName}</span>
                        </div>
                      </td>

                      {/* Course item */}
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-black text-slate-800 font-mono text-xs block">{log.courseCode}</span>
                          <span className="text-xxs text-slate-400 block truncate max-w-[150px]">{log.courseName}</span>
                        </div>
                      </td>

                      {/* Timestamp check */}
                      <td className="py-4 px-6 text-center font-mono text-xs">{log.timestamp}</td>

                      {/* Verification type check */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center space-y-0.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                            isPresent
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : isLate
                              ? "bg-amber-50 border-amber-100 text-amber-700"
                              : "bg-rose-50 border-rose-100 text-rose-700"
                          }`}>
                            {log.status === "present" ? t.present : log.status === "late" ? t.late : t.absent}
                          </span>
                          <span className="text-xxs text-slate-400 font-mono uppercase font-bold">
                            {log.verificationMethod ? log.verificationMethod : "faculty"}
                          </span>
                        </div>
                      </td>

                      {/* Audit verification hover photo frame */}
                      <td className="py-4 px-6 text-center">
                        {log.verificationMethod === "face" && log.verificationPhoto ? (
                          <div className="relative group inline-block">
                            <img
                              src={log.verificationPhoto}
                              alt="Biometric verification audit thumbnail"
                              referrerPolicy="no-referrer"
                              className="h-8 w-8 rounded-lg object-cover border border-slate-200 cursor-pointer shadow-sm group-hover:scale-150 transition-all duration-200 hover:z-20 relative"
                            />
                            {log.verificationConfidence && (
                              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[8px] font-mono font-bold text-white px-1 py-0.2 rounded-full leading-none group-hover:opacity-100 opacity-60">
                                {Math.round(log.verificationConfidence * 100)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xxs font-mono">—</span>
                        )}
                      </td>

                      {/* Action buttons (Verify override) */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => {
                            setEditingLog(log);
                            setOverrideStatus(log.status);
                          }}
                          className="p-1 px-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-bold transition flex items-center space-x-1 mx-auto"
                          id={`override-trigger-${log.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>{t.verify}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override modal panel */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-up">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight" id="override-modal-title">
              {t.overrideConfirmTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t.overrideExplanation}</p>

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3.5 mb-6">
              <div className="h-9 w-9 bg-indigo-50 text-indigo-600 font-mono font-black text-xs rounded-full flex items-center justify-center border border-indigo-100">
                {editingLog.studentId}
              </div>
              <div className="space-y-0.5">
                <strong className="block text-slate-800 text-sm">{editingLog.studentName}</strong>
                <span className="block text-xxs text-slate-400 uppercase font-mono">{editingLog.courseCode} • {editingLog.courseName}</span>
              </div>
            </div>

            {/* Selection switches */}
            <div className="space-y-4">
              <span className="block text-xxs uppercase tracking-wider text-slate-400 font-extrabold">Adjust verified status</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "present", label: t.present, color: "bg-emerald-600 border-emerald-600 text-white" },
                  { key: "late", label: t.late, color: "bg-amber-500 border-amber-500 text-white" },
                  { key: "absent", label: t.absent, color: "bg-rose-500 border-rose-500 text-white" }
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setOverrideStatus(st.key as any)}
                    className={`py-3.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      overrideStatus === st.key
                        ? st.color + " shadow-sm font-black"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                    id={`override-select-${st.key}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action drawers */}
            <div className="mt-8 flex items-center space-x-3">
              <button
                onClick={() => setEditingLog(null)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 py-3.5 rounded-2xl text-xs font-extrabold text-slate-500 transition-colors"
                id="close-override-modal-btn"
              >
                {t.cancel}
              </button>

              <button
                onClick={handleSaveOverrideStatus}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-xs font-bold transition-colors shadow-sm"
                id="save-override-modal-btn"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
