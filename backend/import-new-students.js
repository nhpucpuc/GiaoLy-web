const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const crypto = require('crypto');

const prisma = new PrismaClient();
const filePath = 'c:/Users/LENOVO/Documents/Github/GLY/DS HS MỚI ĐĂNG KÍ HỌC GIÁO LÝ ( NH 26-27).xlsx';
const wb = xlsx.readFile(filePath);

function excelDateToString(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return String(val).trim();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const str = String(val).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }
  return str;
}

function cleanStr(val) {
  if (!val) return null;
  const s = String(val).trim();
  return s === 'null' || s === 'undefined' || s === '' ? null : s;
}

function formatPhone(val) {
  if (!val) return null;
  let s = String(val).replace(/[^0-9]/g, '');
  if (!s) return null;
  if (s.length === 9) s = '0' + s;
  return s;
}

async function main() {
  console.log('🚀 BẮT ĐẦU NẠP DANH SÁCH 46 HỌC SINH MỚI VÀO CƠ SỞ DỮ LIỆU...\n');

  const classes = await prisma.classRoom.findMany();
  const classMap = new Map();
  classes.forEach(c => {
    classMap.set(c.name.toLowerCase().trim(), c);
  });

  const s2 = wb.Sheets['DS LL HS ĐK học-theo lớp(26-27)'];
  const r2 = xlsx.utils.sheet_to_json(s2, { header: 1, defval: '' });

  // Get current max code
  let highestCode = 10630;
  const highestStudent = await prisma.student.findFirst({
    orderBy: { code: 'desc' },
    select: { code: true }
  });
  if (highestStudent && highestStudent.code) {
    highestCode = parseInt(highestStudent.code, 10);
  }

  console.log(`📌 Mã học sinh bắt đầu từ: ${highestCode + 1}`);

  const femaleHolyNames = ['maria', 'anna', 'têrêsa', 'teresa', 'têresa', 'cecilia', 'catarina', 'matta', 'rosa', 'anne', 'mara'];

  const studentsToInsert = [];
  const gradesToInsert = [];

  for (let i = 6; i < r2.length; i++) {
    const row = r2[i];
    const stt = row[0];
    const fullName = cleanStr(row[2]);
    if (!fullName || fullName.length < 2) continue;
    if (typeof stt !== 'number' && isNaN(parseInt(stt))) continue;

    const holyName = cleanStr(row[1]) || 'Chưa cập nhật';
    
    // Gender detection
    let isFemale = false;
    if (row[3]) {
      const gStr = String(row[3]).toLowerCase().trim();
      if (gStr.includes('x') || gStr.includes('nữ') || gStr.includes('nu')) {
        isFemale = true;
      }
    }
    if (!isFemale && femaleHolyNames.some(fn => holyName.toLowerCase().startsWith(fn))) {
      isFemale = true;
    }
    const gender = isFemale ? 'Nữ' : 'Nam';

    const dob = excelDateToString(row[4]) || '2016-01-01';
    const pob = cleanStr(row[5]);
    const address = cleanStr(row[6]) || 'Giáo xứ Sơn Lộc';
    const parishSubdivision = cleanStr(row[7]);

    const baptismDate = excelDateToString(row[9]);
    const baptismPlace = cleanStr(row[10]);
    const eucharistDate = excelDateToString(row[11]);
    const eucharistPlace = cleanStr(row[12]);
    const confirmationDate = excelDateToString(row[13]);
    const confirmationPlace = cleanStr(row[14]);
    const solemnCommunionDate = excelDateToString(row[15]);
    const solemnCommunionPlace = cleanStr(row[16]);

    const fatherHolyName = cleanStr(row[17]);
    const fatherName = cleanStr(row[18]);
    const fatherPhone = formatPhone(row[19]);
    const motherHolyName = cleanStr(row[20]);
    const motherName = cleanStr(row[21]);
    const motherPhone = formatPhone(row[22]);
    const generalPhone = formatPhone(row[8]);

    const parentName = fatherName || motherName || 'Phụ huynh học sinh';
    const parentPhone = fatherPhone || motherPhone || generalPhone || '0900 000 000';

    const targetClassName = cleanStr(row[23]);
    const notes = cleanStr(row[24]);

    const matchedClass = classMap.get(targetClassName.toLowerCase().trim());
    if (!matchedClass) {
      throw new Error(`❌ Không tìm thấy lớp "${targetClassName}" cho học sinh: ${fullName}`);
    }

    highestCode++;
    const studentCode = String(highestCode).padStart(5, '0');
    const studentId = crypto.randomUUID();

    studentsToInsert.push({
      id: studentId,
      code: studentCode,
      holyName,
      fullName,
      gender,
      dob,
      pob,
      address,
      parishSubdivision,
      parentName,
      parentPhone,
      fatherHolyName,
      fatherName,
      fatherPhone,
      motherHolyName,
      motherName,
      motherPhone,
      baptismDate,
      baptismPlace,
      eucharistDate,
      eucharistPlace,
      confirmationDate,
      confirmationPlace,
      solemnCommunionDate,
      solemnCommunionPlace,
      classId: matchedClass.id,
      status: 'DANG_HOC',
      notes
    });

    gradesToInsert.push({
      id: crypto.randomUUID(),
      studentId: studentId,
      classId: matchedClass.id,
      academicYear: '2026 - 2027',
      hk1_tx1: null,
      hk1_tx2: null,
      hk1_thi: null,
      hk2_tx1: null,
      hk2_tx2: null,
      hk2_thi: null,
      tb_cn: null
    });

    console.log(`✔️ [${studentCode}] ${holyName} ${fullName} (${gender}, ${dob}) -> Lớp: ${matchedClass.name}`);
  }

  console.log(`\n⏳ Đang thực hiện Batch Insert vào database Supabase PostgreSQL...`);
  await prisma.student.createMany({ data: studentsToInsert });
  console.log(`✅ Đã nạp thành công ${studentsToInsert.length} học sinh mới.`);

  await prisma.gradeRecord.createMany({ data: gradesToInsert });
  console.log(`✅ Đã khởi tạo thành công ${gradesToInsert.length} bản ghi sổ điểm (GradeRecord) tương ứng.`);

  const finalTotalStudents = await prisma.student.count();
  const finalTotalGrades = await prisma.gradeRecord.count();
  console.log(`\n🎉 TỔNG KẾT SAU IMPORT:`);
  console.log(`   - Tổng số học sinh hiện tại: ${finalTotalStudents}`);
  console.log(`   - Tổng số sổ điểm: ${finalTotalGrades}`);
  console.log(`   - Dải mã học sinh mới: 10631 -> ${highestCode}`);
}

main()
  .catch(e => {
    console.error('❌ Lỗi Import:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
