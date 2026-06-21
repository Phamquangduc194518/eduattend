import React, { useState } from "react";
import { TRANSLATIONS, Language, Course, AttendanceSession } from "../types";
import PinCheckIn from "./PinCheckIn";
import FaceCheckIn from "./FaceCheckIn";
import { ShieldCheck } from "lucide-react";

interface StudentCheckInProps {
  language: Language;
  course: Course;
  session: AttendanceSession;
  studentName: string;
  studentId: string;
  onBack: () => void;
  onCheckIn: (pinCode: string, photoUrl: string) => Promise<void>;
  onExit: () => void;
}

type CheckInStep = "pin" | "face";

export default function StudentCheckIn({
  language,
  course,
  session,
  studentName,
  studentId,
  onBack,
  onCheckIn,
  onExit
}: StudentCheckInProps) {
  const t = TRANSLATIONS[language];
  const [step, setStep] = useState<CheckInStep>("pin");
  const [verifiedPin, setVerifiedPin] = useState("");

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {step === "pin" ? t.checkInStepPin : t.checkInStepFace}
          </p>
          <p className="text-sm text-slate-600">{t.checkInTwoStepHint}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${step === "pin" ? "bg-indigo-600" : "bg-emerald-500"}`}
          />
          <span className={`h-2.5 w-2.5 rounded-full ${step === "face" ? "bg-indigo-600" : "bg-slate-200"}`} />
        </div>
      </div>

      {step === "pin" ? (
        <PinCheckIn
          language={language}
          course={course}
          session={session}
          onBack={onBack}
          onPinVerified={(pin) => {
            setVerifiedPin(pin);
            setStep("face");
          }}
        />
      ) : (
        <FaceCheckIn
          language={language}
          course={course}
          studentName={studentName}
          studentId={studentId}
          stepLabel={t.checkInStepFace}
          onBack={() => setStep("pin")}
          onCheckIn={(photoUrl) => onCheckIn(verifiedPin, photoUrl)}
          onExitAfterSuccess={onExit}
        />
      )}
    </div>
  );
}
