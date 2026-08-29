const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning and Resetting all Grade Records to 100% NULL...');

  const result = await prisma.gradeRecord.updateMany({
    data: {
      hk1_tx1: null,
      hk1_tx2: null,
      hk1_thi: null,
      hk1_tb: null,
      hk1_rank: null,
      hk2_tx1: null,
      hk2_tx2: null,
      hk2_thi: null,
      hk2_tb: null,
      hk2_rank: null,
      tb_cn: null,
      cn_rank: null,
      result: null,
    },
  });

  console.log(`✅ Successfully reset ${result.count} Grade Records to NULL!`);

  // Xóa dữ liệu điểm danh test
  const deletedAttendance = await prisma.attendance.deleteMany({});
  console.log(`✅ Cleared ${deletedAttendance.count} test attendance records.`);

  // Verify
  const check = await prisma.gradeRecord.count({
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
  });

  console.log(`\n🎉 Verification: Number of non-null score records remaining: ${check} (Expected: 0)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
