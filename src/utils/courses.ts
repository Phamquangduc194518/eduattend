import { Course, Enrollment, Language, Weekday } from "../types";

export type CourseInput = Pick<Course, "code" | "name" | "room" | "scheduleDays" | "startTime" | "endTime">;

export const WEEKDAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS: Record<Language, Record<Weekday, string>> = {
  en: {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun"
  },
  vi: {
    mon: "T2",
    tue: "T3",
    wed: "T4",
    thu: "T5",
    fri: "T6",
    sat: "T7",
    sun: "CN"
  }
};

type LegacyCourse = Course & { time?: string };

export function getTodayWeekday(): Weekday {
  const map: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[new Date().getDay()];
}

export function parseLegacyTime(time?: string): { startTime: string; endTime: string } {
  if (!time) return { startTime: "09:00", endTime: "10:30" };
  const match = time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (match) return { startTime: match[1], endTime: match[2] };
  return { startTime: "09:00", endTime: "10:30" };
}

export function normalizeCourse(course: LegacyCourse): Course {
  if (course.scheduleDays?.length && course.startTime && course.endTime) {
    return {
      ...course,
      scheduleDays: [...course.scheduleDays].sort(
        (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
      )
    };
  }

  const legacy = parseLegacyTime(course.time);
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    instructor: course.instructor,
    room: course.room,
    studentCount: course.studentCount ?? 0,
    scheduleDays: course.scheduleDays?.length ? course.scheduleDays : ["mon"],
    startTime: course.startTime ?? legacy.startTime,
    endTime: course.endTime ?? legacy.endTime
  };
}

export function normalizeCourses(courses: LegacyCourse[]): Course[] {
  return courses.map(normalizeCourse);
}

export function formatCourseSchedule(course: Course, language: Language): string {
  const days = course.scheduleDays
    .map((day) => WEEKDAY_LABELS[language][day])
    .join(", ");
  return `${days} • ${course.startTime} - ${course.endTime}`;
}

export function isCourseScheduledToday(course: Course, weekday = getTodayWeekday()): boolean {
  return course.scheduleDays.includes(weekday);
}

export function courseToInput(course: Course): CourseInput {
  return {
    code: course.code,
    name: course.name,
    room: course.room,
    scheduleDays: course.scheduleDays,
    startTime: course.startTime,
    endTime: course.endTime
  };
}

export function generateCourseId(courses: Course[]): string {
  const nums = courses
    .map((course) => parseInt(course.id.replace(/^CR/, ""), 10))
    .filter((value) => !Number.isNaN(value));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `CR${String(next).padStart(3, "0")}`;
}

export function generateEnrollmentId(): string {
  return `ENR-${Date.now()}`;
}

export function createCourseDraft(
  input: CourseInput,
  courses: Course[],
  instructorName: string
): Omit<Course, "studentCount"> {
  return {
    id: generateCourseId(courses),
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    instructor: instructorName,
    room: input.room.trim(),
    scheduleDays: [...input.scheduleDays].sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    ),
    startTime: input.startTime,
    endTime: input.endTime
  };
}

export function pruneEnrollments(courses: Course[], enrollments: Enrollment[]): Enrollment[] {
  const courseIds = new Set(courses.map((course) => course.id));
  return enrollments.filter((item) => courseIds.has(item.courseId));
}

export function getStudentEnrollmentState(
  studentId: string,
  courseId: string,
  enrollments: Enrollment[]
): Enrollment | undefined {
  return enrollments.find((item) => item.studentId === studentId && item.courseId === courseId);
}

export function isValidCourseInput(input: CourseInput): boolean {
  return (
    !!input.code.trim() &&
    !!input.name.trim() &&
    !!input.room.trim() &&
    input.scheduleDays.length > 0 &&
    !!input.startTime &&
    !!input.endTime &&
    input.startTime < input.endTime
  );
}

export const EMPTY_COURSE_INPUT: CourseInput = {
  code: "",
  name: "",
  room: "",
  scheduleDays: [],
  startTime: "09:00",
  endTime: "10:30"
};
