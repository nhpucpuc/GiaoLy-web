const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const kt1a = await prisma.student.findMany({
    where: { class: { name: { contains: 'Khai Tâm 1' } } },
    include: { class: true }
  });
  console.log(`Khai Tâm 1 students count: ${kt1a.length}`);
  kt1a.forEach(s => console.log(`- [${s.class.name}] ${s.holyName} ${s.fullName} (${s.dob})`));
}

check().finally(() => prisma.$disconnect());
