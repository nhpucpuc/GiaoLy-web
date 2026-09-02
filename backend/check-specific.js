const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecific() {
  const dan = await prisma.student.findMany({
    where: {
      fullName: { contains: 'Trần Duy Đan', mode: 'insensitive' }
    },
    include: { class: true }
  });
  console.log('Search Trần Duy Đan:', dan);

  const an1b = await prisma.student.findMany({
    where: {
      fullName: { contains: 'Bình An', mode: 'insensitive' }
    },
    include: { class: true }
  });
  console.log('Search Bình An:', an1b);
}

checkSpecific().finally(() => prisma.$disconnect());
