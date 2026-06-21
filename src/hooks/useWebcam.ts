import { useCallback, useEffect, useRef, useState } from "react";

export type WebcamStatus = "requesting" | "live" | "denied";

export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>("requesting");
  const [errorDetail, setErrorDetail] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      node.muted = true;
      node.playsInline = true;
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("requesting");
      setErrorDetail("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          await video.play();
        }

        setStatus("live");
      } catch (err) {
        if (!cancelled) {
          setStatus("denied");
          setErrorDetail(err instanceof Error ? err.message : "Không mở được camera.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { videoRef: setVideoRef, status, errorDetail, retry };
}

export function captureFrame(video: HTMLVideoElement): string {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function captureFrameBlob(video: HTMLVideoElement, quality = 0.92): Promise<Blob> {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Không tạo được canvas"));
  }

  ctx.drawImage(video, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không tạo được ảnh từ camera"));
      },
      "image/jpeg",
      quality
    );
  });
}
