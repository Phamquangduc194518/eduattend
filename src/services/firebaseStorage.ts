import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "../utils/firebase";

export class FirebaseStorageError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const CHECK_IN_FOLDER = "nhac_giang_sinh";

/** Upload ảnh điểm danh lên Firebase Storage, trả về public download URL. */
export async function uploadCheckInPhoto(blob: Blob, studentId: string): Promise<string> {
  const safeId = studentId.replace(/[^\w-]/g, "_");
  const objectPath = `${CHECK_IN_FOLDER}/${Date.now()}_${safeId}.jpg`;
  const storageRef = ref(getFirebaseStorage(), objectPath);

  try {
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    const downloadUrl = await getDownloadURL(storageRef);

    if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
      throw new FirebaseStorageError("invalidPhotoUrl", "Firebase trả về URL không hợp lệ.");
    }

    return downloadUrl;
  } catch (error) {
    if (error instanceof FirebaseStorageError) throw error;
    if (error instanceof Error && error.message.includes("Thiếu cấu hình Firebase")) {
      throw new FirebaseStorageError("firebaseNotConfigured", error.message);
    }
    const message = error instanceof Error ? error.message : "Upload Firebase thất bại.";
    throw new FirebaseStorageError("firebaseUploadFailed", message);
  }
}
