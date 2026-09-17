// Usage: npm run coach:add -- "Coach Name" coach@email.com "a-strong-password"
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Usage: npm run coach:add -- "Coach Name" coach@email.com "password"');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const coach = await prisma.coach.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { name, passwordHash },
    create: { name, email: email.toLowerCase().trim(), passwordHash },
  });
  console.log(`Coach account ready: ${coach.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
