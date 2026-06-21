import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, AttendanceSession, isSessionActive } from "../types";
import { ArrowLeft, KeyRound, ArrowRight, Delete, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface PinCheckInProps {
  language: Language;
  course: Course;
  session: AttendanceSession;
  onBack: () => void;
  onPinVerified: (pin: string) => void;
}

export default function PinCheckIn({
  language,
  course,
  session,
  onBack,
  onPinVerified
}: PinCheckInProps) {
  const t = TRANSLATIONS[language];

  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const sessionUnavailable = !isSessionActive(session, course);

  const handleKeyPress = (num: string) => {
    if (pinDigits.length < 6) {
      setPinDigits((prev) => [...prev, num]);
      setErrorText("");
    }
  };

  const handleDelete = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorText("");
  };

  const handleVerifySubmission = () => {
    if (session.status === "closed") {
      setErrorText(t.pinSessionClosed);
      return;
    }

    if (!isSessionActive(session, course)) {
      setErrorText(t.pinSessionExpired);
      return;
    }

    if (pinDigits.length < 6) {
      setErrorText(language === "en" ? "Please fill in all 6 digits" : "Vui lòng nhập đủ 6 chữ số");
      return;
    }

    const enteredPin = pinDigits.join("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (session.pinCode && enteredPin !== session.pinCode) {
        setErrorText(t.pinResultErrorDesc);
        setPinDigits([]);
        return;
      }
      setSuccess(true);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in py-4">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition text-sm font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
        id="pin-back-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t.close}</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />

        <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
          <KeyRound className="h-6 w-6" />
        </div>

        <div>
          <span className="text-xxs uppercase tracking-wider font-extrabold font-mono text-slate-400">
            {t.pinScreenTitle}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 mt-0.5 leading-snug">
            {course.code} - {course.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {course.instructor} • {t.room} {course.room}
          </p>
        </div>

        <p className="text-xs text-slate-500 px-4 border-t border-slate-100 pt-3">
          {t.pinInstructions}
        </p>
      </div>

      {sessionUnavailable && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold">
          {session.status === "closed" ? t.pinSessionClosed : t.pinSessionExpired}
        </div>
      )}

      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex justify-center items-center space-x-3.5 py-2">
          {Array.from({ length: 6 }).map((_, index) => {
            const digit = pinDigits[index];
            const isFilled = digit !== undefined;

            return (
              <div
                key={index}
                className={`h-12 w-12 rounded-2xl flex items-center justify-center font-mono text-xl font-black border transition-all duration-150 ${
                  isFilled
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 scale-105 shadow-inner"
                    : "border-slate-200 bg-slate-50 text-slate-300"
                }`}
                id={`pin-field-${index}`}
              >
                {isFilled ? digit : "•"}
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center space-x-2 text-indigo-600 text-xs font-semibold py-1 animate-pulse">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{t.pinResultVerifying}</span>
          </div>
        )}

        {errorText && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold select-none">
            <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={loading || success || sessionUnavailable}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xl py-4 rounded-2xl active:bg-slate-200 shadow-sm hover:shadow active:scale-95 transition-all duration-100 disabled:opacity-50"
              id={`keypad-${num}`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleDelete}
            disabled={loading || success || pinDigits.length === 0 || sessionUnavailable}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm flex items-center justify-center rounded-2xl active:scale-95 transition-all disabled:opacity-40"
            title={t.deleteKey}
            id="keypad-del"
          >
            <Delete className="h-5 w-5" />
          </button>

          <button
            onClick={() => handleKeyPress("0")}
            disabled={loading || success || sessionUnavailable}
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xl py-4 rounded-2xl active:bg-slate-200 shadow-sm active:scale-95 transition disabled:opacity-50"
            id="keypad-0"
          >
            0
          </button>

          <button
            onClick={handleVerifySubmission}
            disabled={loading || success || pinDigits.length < 6 || sessionUnavailable}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black text-sm flex items-center justify-center rounded-2xl active:scale-95 transition shadow-sm"
            id="keypad-enter"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {success && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative text-center animate-scale-up">
            <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-5 scale-110 shadow-sm">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t.pinResultSuccess}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t.pinResultSuccessDesc}
            </p>

            <div className="mt-8">
              <button
                onClick={() => {
                  setSuccess(false);
                  onPinVerified(pinDigits.join(""));
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs transition"
                id="continue-to-face-btn"
              >
                {t.pinContinueToFace}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
