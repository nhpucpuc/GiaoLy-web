const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classRoom.findMany({
    include: {
      _count: {
        select: { students: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total classes in DB: ${classes.length}`);
  classes.forEach(c => {
    console.log(`- [${c.id}] ${c.name} (${c.academicYear}): ${c._count.students} students`);
  });

  const totalStudents = await prisma.student.count();
  console.log(`\nTotal students in DB: ${totalStudents}`);

  // Check some sample dates in student table
  const sampleStudents = await prisma.student.findMany({
    take: 10,
    select: { id: true, fullName: true, dob: true, baptismDate: true, eucharistDate: true, confirmationDate: true, solemnCommunionDate: true }
  });
  console.log('\nSample student dates in DB:');
  console.table(sampleStudents);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
