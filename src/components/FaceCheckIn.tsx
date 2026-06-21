import React, { useState, useEffect, useRef } from "react";
import { TRANSLATIONS, Language, Course } from "../types";
import { ArrowLeft, Camera, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useWebcam, captureFrame, captureFrameBlob } from "../hooks/useWebcam";
import { ApiError } from "../services/apiClient";
import { FirebaseStorageError, uploadCheckInPhoto } from "../services/firebaseStorage";

interface FaceCheckInProps {
  language: Language;
  course: Course;
  studentName: string;
  studentId: string;
  stepLabel?: string;
  onBack: () => void;
  onCheckIn: (photoUrl: string) => Promise<void>;
  onExitAfterSuccess: () => void;
}

export default function FaceCheckIn({
  language,
  course,
  studentName,
  studentId,
  stepLabel,
  onBack,
  onCheckIn,
  onExitAfterSuccess
}: FaceCheckInProps) {
  const t = TRANSLATIONS[language];
  const { videoRef, status, errorDetail, retry } = useWebcam();
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [stepMessage, setStepMessage] = useState(
    language === "en" ? "Opening webcam..." : "Đang mở webcam..."
  );
  const [errorText, setErrorText] = useState("");
  const [successModal, setSuccessModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "requesting") {
      setStepMessage(t.cameraLoading);
    } else if (status === "denied") {
      setStepMessage(errorDetail || t.cameraDenied);
    } else if (status === "live") {
      setStepMessage(language === "en" ? "Camera ready — tap capture" : "Camera sẵn sàng — bấm chụp ảnh");
    }
  }, [status, errorDetail, t.cameraLoading, t.cameraDenied, language]);

  const resolveCheckInError = (error: unknown) => {
    if (error instanceof ApiError) {
      const map: Record<string, string> = {
        invalidPin: t.pinResultErrorDesc,
        sessionExpired: t.pinSessionExpired,
        sessionNotStarted: t.sessionNotStarted,
        sessionClosed: t.pinSessionClosed,
        notEnrolled: t.enrollmentAlreadyApproved,
        alreadyCheckedIn: t.alreadyCheckedIn,
        photoUrlRequired: t.photoUrlRequired,
        invalidPhotoUrl: t.invalidPhotoUrl
      };
      return map[error.code] ?? error.message;
    }

    if (error instanceof FirebaseStorageError) {
      const map: Record<string, string> = {
        firebaseNotConfigured: t.firebaseNotConfigured,
        firebaseUploadFailed: t.faceSaveError,
        invalidPhotoUrl: t.invalidPhotoUrl
      };
      return map[error.code] ?? error.message;
    }

    return error instanceof Error ? error.message : t.faceSaveError;
  };

  useEffect(() => {
    if (!successModal) return;
    const timer = window.setTimeout(() => {
      setSuccessModal(false);
      onExitAfterSuccess();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [successModal, onExitAfterSuccess]);

  const handleCapture = async () => {
    setErrorText("");
    const video = videoElRef.current;

    if (!video || status !== "live") {
      setErrorText(
        language === "en"
          ? "Camera not ready. Wait for LIVE or tap retry."
          : "Camera chưa sẵn sàng. Đợi thấy LIVE đỏ hoặc bấm Thử lại."
      );
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setErrorText(
        language === "en"
          ? "No video frame yet. Wait a moment and try again."
          : "Chưa có hình từ camera. Đợi vài giây rồi thử lại."
      );
      return;
    }

    setSaving(true);

    try {
      const preview = captureFrame(video);
      setPreviewUrl(preview);

      setStepMessage(t.faceUploading);
      const blob = await captureFrameBlob(video);
      const photoUrl = await uploadCheckInPhoto(blob, studentId);

      setStepMessage(t.faceCheckingIn);
      await onCheckIn(photoUrl);

      setStepMessage(language === "en" ? "Check-in complete!" : "Điểm danh thành công!");
      setSuccessModal(true);
    } catch (err) {
      console.error(err);
      setPreviewUrl(null);
      setErrorText(resolveCheckInError(err));
      setStepMessage(language === "en" ? "Could not complete check-in" : "Không hoàn tất được điểm danh");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in py-2">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition text-sm font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t.close}</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-3">
        {stepLabel && (
          <span className="text-xxs uppercase tracking-wider font-extrabold font-mono text-indigo-600">
            {stepLabel}
          </span>
        )}
        <h2 className="text-lg font-extrabold text-slate-900">
          {course.code} — {course.name}
        </h2>
        <p className="text-xs text-slate-500">{studentName} · {studentId}</p>
        <p className="text-sm text-slate-600">{stepMessage}</p>
      </div>

      <div className="relative mx-auto w-full max-h-[min(55vh,420px)] aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <video
          ref={(node) => {
            videoElRef.current = node;
            videoRef(node);
          }}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />
        {previewUrl && (
          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 -scale-x-100" />
        )}
        {status === "live" && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse">
            LIVE
          </div>
        )}
      </div>

      {errorText && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorText}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {status === "denied" && (
          <button
            onClick={retry}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            {t.cameraRetry}
          </button>
        )}
        <button
          onClick={handleCapture}
          disabled={saving || status !== "live"}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold py-3 rounded-2xl text-sm transition"
        >
          <Camera className="h-4 w-4" />
          {saving ? t.faceSaving : t.faceCaptureBtn}
        </button>
      </div>

      {successModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center">
            <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{t.faceSuccessTitle}</h3>
            <p className="text-sm text-slate-500 mt-2">{t.checkInCompleteDesc}</p>
            <button
              onClick={() => {
                setSuccessModal(false);
                onExitAfterSuccess();
              }}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-sm"
            >
              {t.backToDashboardBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
