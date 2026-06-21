import React, { useEffect, useState } from "react";
import { TRANSLATIONS, Language, Weekday } from "../types";
import {
  CourseInput,
  EMPTY_COURSE_INPUT,
  WEEKDAY_ORDER,
  WEEKDAY_LABELS,
  isValidCourseInput
} from "../utils/courses";
import { X } from "lucide-react";

interface CourseFormModalProps {
  language: Language;
  open: boolean;
  initial?: CourseInput;
  title: string;
  onClose: () => void;
  onSave: (input: CourseInput) => void;
}

export default function CourseFormModal({
  language,
  open,
  initial,
  title,
  onClose,
  onSave
}: CourseFormModalProps) {
  const t = TRANSLATIONS[language];
  const [form, setForm] = useState<CourseInput>(EMPTY_COURSE_INPUT);

  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_COURSE_INPUT);
    }
  }, [open, initial]);

  if (!open) return null;

  const canSave = isValidCourseInput(form);

  const toggleDay = (day: Weekday) => {
    setForm((prev) => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((item) => item !== day)
        : [...prev.scheduleDays, day]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t.courseCodeLabel}
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t.courseNameLabel}
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t.courseRoomLabel}
            <input
              value={form.room}
              onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </label>

          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t.courseDaysLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.map((day) => {
                const active = form.scheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
                    }`}
                  >
                    {WEEKDAY_LABELS[language][day]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.courseStartLabel}
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono"
              />
            </label>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.courseEndLabel}
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm"
          >
            {t.cancelCourseBtn}
          </button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-sm"
          >
            {t.saveCourseBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
