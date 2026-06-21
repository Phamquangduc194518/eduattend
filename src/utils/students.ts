import { getInitials, Student } from "../types";
import { StudentRosterItem } from "./api-types.fe";

const AVATAR_GRADIENTS = [
  "from-amber-500 to-red-500",
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
  "from-yellow-500 to-orange-500",
  "from-violet-500 to-fuchsia-500",
  "from-lime-500 to-green-600"
];

export function pickAvatarGradient(id: string): string {
  const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

export function rosterToStudents(roster: StudentRosterItem[]): Student[] {
  return roster.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    initials: getInitials(item.name),
    avatarGradient: pickAvatarGradient(item.id)
  }));
}

export function mergeStudentDirectory(
  current: Map<string, StudentRosterItem>,
  roster: StudentRosterItem[]
): Map<string, StudentRosterItem> {
  const next = new Map(current);
  roster.forEach((item) => next.set(item.id, item));
  return next;
}

export function directoryToStudents(directory: Map<string, StudentRosterItem>): Student[] {
  return rosterToStudents(Array.from(directory.values()));
}
