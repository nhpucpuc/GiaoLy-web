const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Grade Records in Database...');
  
  const totalGrades = await prisma.gradeRecord.count();
  console.log(`Total Grade Records in DB: ${totalGrades}`);

  const gradesWithScores = await prisma.gradeRecord.findMany({
    where: {
      OR: [
        { hk1_tx1: { not: null } },
        { hk1_tx2: { not: null } },
        { hk1_thi: { not: null } },
        { hk1_tb: { not: null } },
        { hk2_tx1: { not: null } },
        { hk2_tx2: { not: null } },
        { hk2_thi: { not: null } },
        { hk2_tb: { not: null } },
        { tb_cn: { not: null } },
      ],
    },
    include: {
      student: true,
      class: true,
    },
  });

  console.log(`\n📌 Number of records with entered scores: ${gradesWithScores.length}`);
  
  if (gradesWithScores.length > 0) {
    console.log('\nFound the following records with scores:');
    gradesWithScores.forEach((g) => {
      console.log(`- [${g.class?.name || 'Class'}] Student: ${g.student?.holyName} ${g.student?.fullName} (#${g.student?.code}) -> HK1: [${g.hk1_tx1}, ${g.hk1_tx2}, ${g.hk1_thi}, TB:${g.hk1_tb}], HK2: [${g.hk2_tx1}, ${g.hk2_tx2}, ${g.hk2_thi}, TB:${g.hk2_tb}], CN: ${g.tb_cn}`);
    });
  } else {
    console.log('✅ ALL GRADE COLUMNS ARE 100% NULL / EMPTY! Ready for a clean school year.');
  }

  // Check attendance
  const totalAttendance = await prisma.attendance.count();
  console.log(`\nTotal Attendance Records in DB: ${totalAttendance}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
