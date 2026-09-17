// The club's fixed weekly clinic schedule. This is the source of truth used
// by `prisma/seed.ts` to populate ClinicTemplate rows. To change the
// schedule going forward (new day, new age group, new time), edit this list
// and re-run `npm run db:seed` — it upserts by (name, dayOfWeek) so it's
// safe to run again after edits.

export type ClinicDefinition = {
  name: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // 24h "HH:MM"
  endTime: string;
  ageMin: number;
  ageMax: number;
  capacity: number;
  minSignups: number;
  sortOrder: number;
};

export const CLINIC_SCHEDULE: ClinicDefinition[] = [
  // Monday
  { name: "Junior Clinic", dayOfWeek: 1, startTime: "15:30", endTime: "16:30", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 1 },

  // Tuesday
  { name: "Super Stars", dayOfWeek: 2, startTime: "15:30", endTime: "16:30", ageMin: 3, ageMax: 6, capacity: 8, minSignups: 4, sortOrder: 1 },
  { name: "Junior Clinic", dayOfWeek: 2, startTime: "15:30", endTime: "16:30", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 2 },

  // Wednesday
  { name: "Super Stars", dayOfWeek: 3, startTime: "15:30", endTime: "16:30", ageMin: 3, ageMax: 6, capacity: 8, minSignups: 4, sortOrder: 1 },
  { name: "Junior Clinic", dayOfWeek: 3, startTime: "15:30", endTime: "16:30", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 2 },

  // Thursday
  { name: "Super Stars", dayOfWeek: 4, startTime: "15:30", endTime: "16:30", ageMin: 3, ageMax: 6, capacity: 8, minSignups: 4, sortOrder: 1 },
  { name: "Junior Clinic", dayOfWeek: 4, startTime: "15:30", endTime: "16:30", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 2 },
  { name: "Junior Clinic", dayOfWeek: 4, startTime: "15:30", endTime: "16:30", ageMin: 10, ageMax: 15, capacity: 8, minSignups: 4, sortOrder: 3 },

  // Friday
  { name: "Clinic", dayOfWeek: 5, startTime: "15:30", endTime: "16:30", ageMin: 8, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 1 },
  { name: "Junior Clinic", dayOfWeek: 5, startTime: "15:30", endTime: "16:30", ageMin: 10, ageMax: 15, capacity: 8, minSignups: 4, sortOrder: 2 },

  // Saturday
  { name: "Junior Clinic", dayOfWeek: 6, startTime: "13:00", endTime: "14:00", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 1 },

  // Sunday
  { name: "Junior Clinic", dayOfWeek: 0, startTime: "10:00", endTime: "11:00", ageMin: 6, ageMax: 10, capacity: 8, minSignups: 4, sortOrder: 1 },
  { name: "Junior Clinic", dayOfWeek: 0, startTime: "11:00", endTime: "12:00", ageMin: 10, ageMax: 15, capacity: 8, minSignups: 4, sortOrder: 2 },
];

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function formatTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}
