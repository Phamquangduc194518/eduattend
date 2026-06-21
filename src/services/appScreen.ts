import { Language } from "../types";

export type AppScreen =
  | "login"
  | "register"
  | "teacher_dash"
  | "teacher_marking"
  | "student_dash"
  | "student_checkin";

export interface AppPreferences {
  activeScreen?: AppScreen;
  selectedCourseId?: string;
  language?: Language;
}

const PREFS_KEY = "eduattend_prefs";

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as AppPreferences) : {};
  } catch {
    return {};
  }
}

export function saveAppPreferences(prefs: AppPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function clearAppPreferences(): void {
  localStorage.removeItem(PREFS_KEY);
}
