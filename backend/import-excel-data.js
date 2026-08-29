const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dir = 'c:/Users/LENOVO/Documents/Github/GLY/Mới-DS LỚP GIÁO LÝ ( nh 26-27)';

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
  return str;
}

function cleanStr(val) {
  if (!val) return null;
  const s = String(val).trim();
  return s === 'null' || s === 'undefined' || s === '' ? null : s;
}

function determineCategory(name) {
  const upper = name.toUpperCase();
  if (upper.includes('XƯNG TỘI') || upper.includes('XUNG TOI')) return 'XUNG_TOI';
  if (upper.includes('RƯỚC LỄ') || upper.includes('RUOC LE')) return 'RUOC_LE';
  if (upper.includes('THÊM SỨC') || upper.includes('THEM SUC')) return 'THEM_SUC';
  if (upper.includes('BAO ĐỒNG') || upper.includes('BAO DONG')) return 'BAO_DONG';
  if (upper.includes('VÀO ĐỜI') || upper.includes('VAO DOI')) return 'VAO_DOI';
  return 'KHAI_TAM';
}

function determineSession(name) {
  const upper = name.toUpperCase();
  if (upper.includes('BAO ĐỒNG') || upper.includes('BAO DONG') || upper.includes('VÀO ĐỜI') || upper.includes('VAO DOI')) {
    return 'TOI';
  }
  return 'SANG';
}

async function main() {
  console.log('🚀 BẮT ĐẦU SIÊU TỐC IMPORT DỮ LIỆU TỪ 18 FILE EXCEL VÀO SUPABASE POSTGRESQL...\n');

  // 1. Cấu hình tài khoản Admin & GLV
  console.log('--- 1. Thiết lập tài khoản Ban Quản Trị & GLV ---');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const glvPassword = await bcrypt.hash('glv123', 10);

  await prisma.user.upsert({
    where: { email: 'admin.giaoly@gxsonloc.vn' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin.giaoly@gxsonloc.vn',
      password: adminPassword,
      fullName: 'Trần Thị Diễm Nga',
      holyName: 'Maria',
      role: 'ADMIN',
      phone: '0901 234 567',
    },
  });

  const glvUser = await prisma.user.upsert({
    where: { email: 'tuyetmai.glv@gxsonloc.vn' },
    update: { password: glvPassword, role: 'CATECHIST' },
    create: {
      email: 'tuyetmai.glv@gxsonloc.vn',
      password: glvPassword,
      fullName: 'Nguyễn Thị Tuyết Mai',
      holyName: 'Maria',
      role: 'CATECHIST',
      phone: '0912 345 678',
    },
  });
  console.log('✅ Tài khoản Admin và GLV đã sẵn sàng.');

  // 2. Làm sạch dữ liệu học sinh & lớp cũ
  console.log('\n--- 2. Làm sạch dữ liệu cũ ---');
  await prisma.attendance.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classRoom.deleteMany();
  console.log('✅ Đã dọn sạch database.');

  // 3. Đọc và chuẩn bị dữ liệu hàng loạt từ 18 file
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  console.log(`\n--- 3. Đọc và phân tích ${files.length} file Excel ---`);

  const allClassesData = [];
  const allStudentsData = [];
  const allGradesData = [];
  let currentCodeNumber = 10001;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const wb = xlsx.readFile(fullPath);

    const sheetName = wb.SheetNames.find(s => 
      s.toLowerCase().includes('lý lịch') || 
      s.toLowerCase().includes('ly lich') || 
      s.toLowerCase().includes('thông tin')
    ) || wb.SheetNames[0];

    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let rawClassName = file.replace(/^[0-9.]+\s*-\s*/, '').replace(/\s*-\s*Sổ Điểm danh.*/i, '').trim();
    const category = determineCategory(rawClassName);
    const session = determineSession(rawClassName);

    let catechistLeader = 'Chưa phân công';
    let catechistAssists = [];

    for (let r = 2; r < 7; r++) {
      const rowStr = (rows[r] || []).filter(Boolean).join(' ');
      if (rowStr.includes('1-') || rowStr.includes('1 -') || rowStr.includes('1.')) {
        const match1 = rowStr.match(/1[-.]\s*([^-–\d\n\r]+)(?:[-–\s]+([\d'\s]+))?/);
        if (match1) {
          catechistLeader = match1[1].trim();
        } else {
          const parts = rowStr.split(/1[-.]/);
          if (parts[1]) catechistLeader = parts[1].split(/2[-.]/)[0].trim();
        }
      }
      if (rowStr.includes('2-') || rowStr.includes('2 -') || rowStr.includes('2.')) {
        const parts = rowStr.split(/2[-.]/);
        if (parts[1] && parts[1].trim() && parts[1].trim() !== '…..............................................................................') {
          catechistAssists.push(parts[1].trim());
        }
      }
    }

    if (catechistLeader === 'Chưa phân công' || !catechistLeader) {
      catechistLeader = 'GLV Ban Giáo Lý';
    }

    const classId = crypto.randomUUID();

    allClassesData.push({
      id: classId,
      name: rawClassName,
      category,
      catechistLeader,
      catechistAssists,
      roomNumber: 'Nhà Mục Vụ GX Sơn Lộc',
      academicYear: '2026 - 2027',
      schedule: session === 'SANG' ? 'Chúa Nhật | 07:30 - 08:45' : 'Chúa Nhật | 19:00 - 20:15',
      session,
      description: `Lớp Giáo Lý ${rawClassName} niên khóa 2026 - 2027.`,
    });

    // Header row
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const row = rows[i] || [];
      if (row.some(cell => String(cell).includes('STT') || String(cell).includes('Tên thánh'))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) continue;

    let countInClass = 0;

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const stt = row[0];
      const holyName = cleanStr(row[1]) || 'Chưa cập nhật';
      const fullName = cleanStr(row[2]);

      if (!fullName || fullName.length < 2) continue;
      if (typeof stt !== 'number' && isNaN(parseInt(stt))) continue;

      const isFemale = row[3] && String(row[3]).toLowerCase().includes('x');
      const gender = isFemale ? 'Nữ' : 'Nam';
      const dob = excelDateToString(row[4]) || '2016-01-01';
      const pob = cleanStr(row[5]);
      const address = cleanStr(row[6]) || 'Giáo xứ Sơn Lộc';
      const parishSubdivision = cleanStr(row[7]);
      const phone = cleanStr(row[8]) || '0900 000 000';

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
      const fatherPhone = cleanStr(row[19]);
      const motherHolyName = cleanStr(row[20]);
      const motherName = cleanStr(row[21]);
      const motherPhone = cleanStr(row[22]);
      const notes = cleanStr(row[23]);

      const parentName = fatherName || motherName || 'Phụ huynh học sinh';
      const parentPhone = fatherPhone || motherPhone || phone;

      const studentId = crypto.randomUUID();
      const studentCode = String(currentCodeNumber).padStart(5, '0');
      currentCodeNumber++;

      allStudentsData.push({
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
        classId: classId,
        status: 'DANG_HOC',
        notes,
      });

      allGradesData.push({
        id: crypto.randomUUID(),
        studentId: studentId,
        classId: classId,
        academicYear: '2026 - 2027',
        hk1_tx1: null,
        hk1_tx2: null,
        hk1_thi: null,
        hk2_tx1: null,
        hk2_tx2: null,
        hk2_thi: null,
        tb_cn: null,
      });

      countInClass++;
    }

    console.log(`📋 Đã đọc: ${rawClassName} (${countInClass} học sinh - GLV: ${catechistLeader})`);
  }

  // 4. Batch Insert vào PostgreSQL Supabase
  console.log('\n--- 4. Nạp hàng loạt vào Supabase qua Batch Insert ---');
  await prisma.classRoom.createMany({ data: allClassesData });
  console.log(`✅ Đã nạp thành công ${allClassesData.length} lớp học.`);

  await prisma.student.createMany({ data: allStudentsData });
  console.log(`✅ Đã nạp thành công ${allStudentsData.length} học sinh với mã từ 10001 đến ${currentCodeNumber - 1}.`);

  await prisma.gradeRecord.createMany({ data: allGradesData });
  console.log(`✅ Đã khởi tạo thành công ${allGradesData.length} bản ghi sổ điểm.`);

  // Gán lớp Xưng Tội 1A cho GLV Tuyết Mai
  const xt1a = allClassesData.find(c => c.name.includes('XƯNG TỘI 1A'));
  if (xt1a) {
    await prisma.user.update({
      where: { id: glvUser.id },
      data: { assignedClassId: xt1a.id },
    });
  }

  console.log('\n🎉 ================================================================');
  console.log(`🎉 IMPORT HOÀN TẤT THÀNH CÔNG RỰC RỠ 100%:`);
  console.log(`   - Tổng số lớp học: ${allClassesData.length} lớp`);
  console.log(`   - Tổng số học sinh: ${allStudentsData.length} học sinh`);
  console.log(`   - Dải mã học sinh: 10001 → ${currentCodeNumber - 1}`);
  console.log('🎉 ================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Import:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
