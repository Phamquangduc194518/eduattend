import React from "react";
import { X, Camera, Clock, User } from "lucide-react";
import { Language, TRANSLATIONS } from "../types";

export interface PhotoPreviewData {
  photoPath: string;
  studentName: string;
  studentId: string;
  date?: string;
  timestamp?: string;
  confidence?: number;
  status?: "present" | "late" | "absent";
}

interface TeacherPhotoPreviewModalProps {
  language: Language;
  preview: PhotoPreviewData | null;
  onClose: () => void;
}

export default function TeacherPhotoPreviewModal({
  language,
  preview,
  onClose
}: TeacherPhotoPreviewModalProps) {
  const t = TRANSLATIONS[language];

  if (!preview) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={onClose}
      id="teacher-photo-preview-modal"
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t.teacherPhotoPreviewTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.teacherPhotoPreviewHint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
            aria-label={language === "en" ? "Close" : "Đóng"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{preview.studentName}</p>
              <p className="text-xs font-mono text-slate-400">{preview.studentId}</p>
            </div>
            {preview.status && (
              <span
                className={`ml-auto px-2.5 py-0.5 rounded-full text-xxs font-mono font-black ${
                  preview.status === "present"
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : preview.status === "late"
                    ? "bg-amber-50 border border-amber-100 text-amber-700"
                    : "bg-rose-50 border border-rose-100 text-rose-700"
                }`}
              >
                {preview.status === "present" ? t.present : preview.status === "late" ? t.late : t.absent}
              </span>
            )}
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <img
              src={preview.photoPath}
              alt={`${preview.studentName} — ${t.teacherPhotoPreviewTitle}`}
              className="w-full max-h-[420px] object-contain bg-slate-900"
            />
            {preview.confidence !== undefined && (
              <span className="absolute top-3 right-3 bg-emerald-600 text-xs font-mono font-bold text-white px-2.5 py-1 rounded-full shadow">
                {Math.round(preview.confidence * 100)}%
              </span>
            )}
          </div>

          {(preview.date || preview.timestamp) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {preview.date}
                {preview.timestamp ? ` • ${preview.timestamp}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
