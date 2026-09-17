import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLINIC_SCHEDULE } from "../lib/clinics";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding clinic schedule...");

  // One-time fixup: the Friday "Clinic" (ages 8-10) became "Junior Clinic"
  // (ages 6-10). Since the match key below includes ageMin/ageMax, a plain
  // age-range change looks like a brand new slot rather than an edit to the
  // existing one — relocate it by its old identity first so the loop finds
  // and updates it in place instead of leaving it orphaned alongside a new
  // duplicate row. No-ops once this has run once against a given database.
  const staleFridayClinic = await prisma.clinicTemplate.findFirst({
    where: { dayOfWeek: 5, startTime: "15:30", ageMin: 8, ageMax: 10, name: "Clinic" },
  });
  if (staleFridayClinic) {
    await prisma.clinicTemplate.update({ where: { id: staleFridayClinic.id }, data: { ageMin: 6 } });
  }

  for (const c of CLINIC_SCHEDULE) {
    // Matched by day/time/age-range rather than name, so renaming a clinic
    // in CLINIC_SCHEDULE updates the existing row in place instead of
    // orphaning the old-named row and creating a duplicate.
    const existing = await prisma.clinicTemplate.findFirst({
      where: { dayOfWeek: c.dayOfWeek, startTime: c.startTime, ageMin: c.ageMin, ageMax: c.ageMax },
    });
    if (existing) {
      await prisma.clinicTemplate.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          endTime: c.endTime,
          capacity: c.capacity,
          minSignups: c.minSignups,
          sortOrder: c.sortOrder,
          active: true,
        },
      });
    } else {
      await prisma.clinicTemplate.create({ data: c });
    }
  }
  console.log(`Seeded ${CLINIC_SCHEDULE.length} clinic templates.`);

  const email = (process.env.SEED_COACH_EMAIL || "coach@example.com").toLowerCase().trim();
  const password = process.env.SEED_COACH_PASSWORD || "change-me-now";
  const name = process.env.SEED_COACH_NAME || "Head Pro";

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.coach.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });
  console.log(`Coach account ready: ${email} (password set from SEED_COACH_PASSWORD env var).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
