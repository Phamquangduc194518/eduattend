import React from "react";

interface TeacherPhotoThumbnailProps {
  photoPath: string;
  confidence?: number;
  alt?: string;
  onClick?: () => void;
}

export default function TeacherPhotoThumbnail({
  photoPath,
  confidence,
  alt = "Ảnh điểm danh khuôn mặt",
  onClick
}: TeacherPhotoThumbnailProps) {
  if (!photoPath) {
    return <span className="text-slate-300 text-xxs font-mono">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      title="Xem ảnh phóng to"
    >
      <img
        src={photoPath}
        alt={alt}
        className="h-12 w-12 rounded-lg object-cover border-2 border-indigo-100 cursor-pointer shadow-sm hover:border-indigo-400 transition-all duration-200"
      />
      {confidence !== undefined && (
        <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded-full leading-none">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </button>
  );
}
