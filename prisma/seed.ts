import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLINIC_SCHEDULE } from "../lib/clinics";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding clinic schedule...");
  for (const c of CLINIC_SCHEDULE) {
    const existing = await prisma.clinicTemplate.findFirst({
      where: { name: c.name, dayOfWeek: c.dayOfWeek, startTime: c.startTime },
    });
    if (existing) {
      await prisma.clinicTemplate.update({
        where: { id: existing.id },
        data: {
          endTime: c.endTime,
          ageMin: c.ageMin,
          ageMax: c.ageMax,
          capacity: c.capacity,
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
