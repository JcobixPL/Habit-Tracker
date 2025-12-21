import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@demo.pl";
  const pass = "demo123";
  const password = await bcrypt.hash(pass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password }
  });

  await prisma.habit.createMany({
    data: [
      { userId: user.id, name: "Woda 2L", targetPerDay: 1 },
      { userId: user.id, name: "Stretching 10 min", targetPerDay: 1 },
      { userId: user.id, name: "Nauka 30 min", targetPerDay: 1 }
    ],
    skipDuplicates: true
  });

  console.log("Seed OK:", { email, pass });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
