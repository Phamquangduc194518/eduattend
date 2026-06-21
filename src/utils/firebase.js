import { getApp, getApps, initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const REQUIRED_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_APP_ID"
];

function readFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  const missing = REQUIRED_ENV_KEYS.filter((key) => !import.meta.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Thiếu cấu hình Firebase trong .env: ${missing.join(", ")}. ` +
        "Sao chép .env.example thành .env và điền giá trị từ Firebase Console."
    );
  }

  return config;
}

export function isFirebaseConfigured() {
  return REQUIRED_ENV_KEYS.every((key) => Boolean(import.meta.env[key]?.trim()));
}

let storageInstance = null;

/** Khởi tạo lazy — chỉ gọi khi cần upload ảnh. */
export function getFirebaseStorage() {
  if (storageInstance) return storageInstance;

  const app = getApps().length > 0 ? getApp() : initializeApp(readFirebaseConfig());
  storageInstance = getStorage(app);
  return storageInstance;
}
