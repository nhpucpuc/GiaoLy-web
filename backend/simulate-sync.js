const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rootDir = 'c:/Users/LENOVO/Documents/Github/GLY';
const files = fs.readdirSync(rootDir).filter(f => /^3\.\d+/.test(f) && f.endsWith('.xlsx'));

files.sort((a, b) => {
  const numA = parseFloat(a.match(/^3\.(\d+)/)[1]);
  const numB = parseFloat(b.match(/^3\.(\d+)/)[1]);
  return numA - numB;
});

function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanStr(val) {
  if (!val) return null;
  const s = String(val).normalize('NFC').replace(/\s+/g, ' ').trim();
  return s === 'null' || s === 'undefined' || s === '' ? null : s;
}

function parseDateToDDMMYYYY(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return String(val).trim();
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  let str = String(val).trim();
  if (!str) return null;

  // Clean leading/trailing quotes or special characters: e.g. "'09/2/2019" -> "09/2/2019"
  str = str.replace(/^['"`\s]+/, '').replace(/['"`\s]+$/, '');

  // Check if phone number accidentally in date (e.g. 10 digits starting with 0)
  if (/^0\d{9}$/.test(str)) {
    return null;
  }

  // YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const yyyy = match[1];
    const mm = match[2].padStart(2, '0');
    const dd = match[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY or D/M/YYYY
  match = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    let p1 = parseInt(match[1], 10);
    let p2 = parseInt(match[2], 10);
    const yyyy = match[3];

    let dd, mm;
    if (p1 <= 12 && p2 > 12) {
      // MM/DD/YYYY format
      mm = String(p1).padStart(2, '0');
      dd = String(p2).padStart(2, '0');
    } else {
      // DD/MM/YYYY format
      dd = String(p1).padStart(2, '0');
      mm = String(p2).padStart(2, '0');
    }
    return `${dd}-${mm}-${yyyy}`;
  }

  if (/^\d{4}$/.test(str)) {
    return `01-01-${str}`;
  }

  return str;
}

function formatPhone(val) {
  if (!val) return null;
  let s = String(val).replace(/[^0-9]/g, '');
  if (!s) return null;
  if (s.length === 9) s = '0' + s;
  return s;
}

const femaleHolyNames = ['maria', 'anna', 'têrêsa', 'teresa', 'têresa', 'cecilia', 'catarina', 'matta', 'rosa', 'anne', 'mara', 'lucia', 'faustina', 'agatha', 'anê', 'ane', 'mônica', 'monica', 'marta', 'macta'];

async function simulate() {
  console.log('🔍 BẮT ĐẦU CHẠY THỬ NGHIỆM (SIMULATION) ĐỒNG BỘ DS DÁN VÀ CHUẨN HÓA NGÀY THÁNG...');

  const classes = await prisma.classRoom.findMany();
  const classMapByName = new Map();
  classes.forEach(c => {
    classMapByName.set(c.name.toLowerCase().trim(), c);
  });

  const dbStudents = await prisma.student.findMany({
    include: { class: true }
  });
  console.log(`📌 Hiện tại trong DB có: ${dbStudents.length} học sinh trên ${classes.length} lớp.`);

  // 1. Thu thập toàn bộ Lý Lịch từ 20 file Excel
  const lyLichMap = new Map(); // key: normName -> array of profiles
  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    const wb = xlsx.readFile(fullPath);

    const lyLichSheet = wb.SheetNames.find(s =>
      s.toLowerCase().includes('lý lịch') ||
      s.toLowerCase().includes('ly lich') ||
      s.toLowerCase().includes('thông tin')
    );

    if (lyLichSheet) {
      const sheet = wb.Sheets[lyLichSheet];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      let headerIdx = -1;
      for (let i = 0; i < Math.min(15, rows.length); i++) {
        const row = rows[i] || [];
        if (row.some(cell => String(cell).includes('STT') || String(cell).includes('Tên thánh') || String(cell).includes('Họ và tên'))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx !== -1) {
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i] || [];
          const stt = row[0];
          const holyName = cleanStr(row[1]);
          const fullName = cleanStr(row[2]);
          if (!fullName || fullName.length < 2) continue;
          if (typeof stt !== 'number' && isNaN(parseInt(stt))) continue;

          const dob = parseDateToDDMMYYYY(row[3]);
          const normName = normalizeName(fullName);

          const profile = {
            holyName: holyName || 'Chưa cập nhật',
            fullName,
            dob,
            address: cleanStr(row[4]),
            phone: formatPhone(row[5]),
            fatherHolyName: cleanStr(row[6]),
            fatherName: cleanStr(row[7]),
            fatherPhone: formatPhone(row[8]),
            motherHolyName: cleanStr(row[9]),
            motherName: cleanStr(row[10]),
            motherPhone: formatPhone(row[11]),
            baptismDate: parseDateToDDMMYYYY(row[12]),
            baptismPlace: cleanStr(row[13]),
            eucharistDate: parseDateToDDMMYYYY(row[14]),
            eucharistPlace: cleanStr(row[15]),
            confirmationDate: parseDateToDDMMYYYY(row[16]),
            confirmationPlace: cleanStr(row[17]),
            solemnCommunionDate: parseDateToDDMMYYYY(row[18]),
            solemnCommunionPlace: cleanStr(row[19]),
            notes: cleanStr(row[20])
          };

          if (!lyLichMap.has(normName)) {
            lyLichMap.set(normName, []);
          }
          lyLichMap.get(normName).push(profile);
        }
      }
    }
  }

  console.log(`📌 Đã nạp thông tin Lý Lịch chi tiết cho ${lyLichMap.size} tên học sinh khác nhau.`);

  // 2. Duyệt qua từng file trong 20 file theo sheet "DS DÁN"
  const keptDbStudentIds = new Set();
  const studentsToUpdate = [];
  const studentsToInsert = [];
  const targetClassStudentsCount = {};

  // Track assigned student IDs to ensure 1 student belongs to ONLY 1 class
  const assignedStudentIdToClass = new Map();

  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    const wb = xlsx.readFile(fullPath);

    const dsDanSheetName = wb.SheetNames.find(s => {
      const clean = s.trim().toUpperCase().replace(/\s+/g, ' ');
      return clean === 'DS DÁN' || clean === 'DS DAN' || clean.startsWith('DS DÁN') || clean.startsWith('DS DAN');
    });

    const sheet = wb.Sheets[dsDanSheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let className = file
      .replace(/^3\.\d+\s*[-–]\s*/, '')
      .replace(/\s*[-–]\s*Sổ Điểm danh.*/i, '')
      .trim();

    const targetClass = classMapByName.get(className.toLowerCase());
    if (!targetClass) {
      console.error(`❌ KHÔNG TÌM THẤY LỚP "${className}" TRONG DATABASE!`);
      continue;
    }

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i] || [];
      if (row.some(cell => String(cell).toUpperCase().includes('STT') || String(cell).toUpperCase().includes('HỌ VÀ TÊN'))) {
        headerRowIdx = i;
        break;
      }
    }

    let classCount = 0;

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const stt = row[0];
      const holyName = cleanStr(row[1]);
      const fullName = cleanStr(row[2]);
      const rawDob = row[3];
      const notes = cleanStr(row[4] || row[5] || '');

      if (!fullName || fullName.length < 2) continue;
      if (typeof stt !== 'number' && isNaN(parseInt(stt))) continue;

      let dob = parseDateToDDMMYYYY(rawDob);
      const normName = normalizeName(fullName);

      // Tra cứu Lý Lịch sheet để bổ sung nếu thiếu DOB hoặc chi tiết
      const lyLichCandidates = lyLichMap.get(normName) || [];
      let matchedLyLich = null;
      if (lyLichCandidates.length === 1) {
        matchedLyLich = lyLichCandidates[0];
      } else if (lyLichCandidates.length > 1 && dob) {
        matchedLyLich = lyLichCandidates.find(p => p.dob === dob) || lyLichCandidates[0];
      }
      if (!dob && matchedLyLich && matchedLyLich.dob) {
        dob = matchedLyLich.dob;
      }

      // Tìm trong DB:
      // Điều kiện: Trùng họ tên (normName) VÀ trùng ngày sinh (dob)
      let matchedDbStudent = null;
      const dbCandidates = dbStudents.filter(s => normalizeName(s.fullName) === normName);

      if (dbCandidates.length === 1) {
        matchedDbStudent = dbCandidates[0];
      } else if (dbCandidates.length > 1) {
        if (dob) {
          matchedDbStudent = dbCandidates.find(s => parseDateToDDMMYYYY(s.dob) === dob) || dbCandidates.find(s => s.classId === targetClass.id) || dbCandidates[0];
        } else {
          matchedDbStudent = dbCandidates.find(s => s.classId === targetClass.id) || dbCandidates[0];
        }
      }

      // Check if already assigned to a class in this run
      if (matchedDbStudent && assignedStudentIdToClass.has(matchedDbStudent.id)) {
        console.warn(`⚠️ Học sinh ${fullName} (${matchedDbStudent.id}) đã được gán vào lớp ${assignedStudentIdToClass.get(matchedDbStudent.id)}, giờ gặp lại ở ${targetClass.name}.`);
        matchedDbStudent = null; // will treat as separate insert if needed
      }

      classCount++;

      if (matchedDbStudent) {
        keptDbStudentIds.add(matchedDbStudent.id);
        assignedStudentIdToClass.set(matchedDbStudent.id, targetClass.name);

        const finalDob = dob || parseDateToDDMMYYYY(matchedDbStudent.dob) || '01-01-2016';
        const finalHolyName = (holyName && holyName !== 'Chưa cập nhật') ? holyName : (matchedDbStudent.holyName || matchedLyLich?.holyName || 'Chưa cập nhật');
        
        studentsToUpdate.push({
          id: matchedDbStudent.id,
          fullName: matchedDbStudent.fullName,
          holyName: finalHolyName,
          dob: finalDob,
          classId: targetClass.id,
          oldClass: matchedDbStudent.class?.name,
          newClass: targetClass.name,
          baptismDate: parseDateToDDMMYYYY(matchedLyLich?.baptismDate || matchedDbStudent.baptismDate),
          eucharistDate: parseDateToDDMMYYYY(matchedLyLich?.eucharistDate || matchedDbStudent.eucharistDate),
          confirmationDate: parseDateToDDMMYYYY(matchedLyLich?.confirmationDate || matchedDbStudent.confirmationDate),
          solemnCommunionDate: parseDateToDDMMYYYY(matchedLyLich?.solemnCommunionDate || matchedDbStudent.solemnCommunionDate),
          parentName: cleanStr(matchedLyLich?.fatherName || matchedLyLich?.motherName || matchedDbStudent.parentName) || 'Phụ huynh học sinh',
          parentPhone: formatPhone(matchedLyLich?.phone || matchedLyLich?.fatherPhone || matchedLyLich?.motherPhone || matchedDbStudent.parentPhone) || '0900 000 000',
          fatherHolyName: cleanStr(matchedLyLich?.fatherHolyName || matchedDbStudent.fatherHolyName),
          fatherName: cleanStr(matchedLyLich?.fatherName || matchedDbStudent.fatherName),
          fatherPhone: formatPhone(matchedLyLich?.fatherPhone || matchedDbStudent.fatherPhone),
          motherHolyName: cleanStr(matchedLyLich?.motherHolyName || matchedDbStudent.motherHolyName),
          motherName: cleanStr(matchedLyLich?.motherName || matchedDbStudent.motherName),
          motherPhone: formatPhone(matchedLyLich?.motherPhone || matchedDbStudent.motherPhone),
          address: cleanStr(matchedLyLich?.address || matchedDbStudent.address) || 'Giáo xứ Sơn Lộc',
          notes: cleanStr(notes || matchedLyLich?.notes || matchedDbStudent.notes)
        });
      } else {
        // New insert
        const finalHolyName = holyName || matchedLyLich?.holyName || 'Chưa cập nhật';
        let isFemale = false;
        if (femaleHolyNames.some(fn => finalHolyName.toLowerCase().startsWith(fn))) {
          isFemale = true;
        }
        const gender = isFemale ? 'Nữ' : 'Nam';
        const finalDob = dob || matchedLyLich?.dob || '01-01-2016';

        studentsToInsert.push({
          holyName: finalHolyName,
          fullName,
          gender,
          dob: finalDob,
          pob: matchedLyLich?.pob || null,
          address: matchedLyLich?.address || 'Giáo xứ Sơn Lộc',
          parishSubdivision: matchedLyLich?.parishSubdivision || null,
          parentName: matchedLyLich?.fatherName || matchedLyLich?.motherName || 'Phụ huynh học sinh',
          parentPhone: matchedLyLich?.phone || matchedLyLich?.fatherPhone || matchedLyLich?.motherPhone || '0900 000 000',
          fatherHolyName: matchedLyLich?.fatherHolyName || null,
          fatherName: matchedLyLich?.fatherName || null,
          fatherPhone: matchedLyLich?.fatherPhone || null,
          motherHolyName: matchedLyLich?.motherHolyName || null,
          motherName: matchedLyLich?.motherName || null,
          motherPhone: matchedLyLich?.motherPhone || null,
          baptismDate: parseDateToDDMMYYYY(matchedLyLich?.baptismDate),
          baptismPlace: matchedLyLich?.baptismPlace || null,
          eucharistDate: parseDateToDDMMYYYY(matchedLyLich?.eucharistDate),
          eucharistPlace: matchedLyLich?.eucharistPlace || null,
          confirmationDate: parseDateToDDMMYYYY(matchedLyLich?.confirmationDate),
          confirmationPlace: matchedLyLich?.confirmationPlace || null,
          solemnCommunionDate: parseDateToDDMMYYYY(matchedLyLich?.solemnCommunionDate),
          solemnCommunionPlace: matchedLyLich?.solemnCommunionPlace || null,
          classId: targetClass.id,
          targetClassName: targetClass.name,
          status: 'DANG_HOC',
          notes
        });
      }
    }

    targetClassStudentsCount[targetClass.name] = classCount;
  }

  // 3. Khai Tâm 1A và Khai Tâm 1B (giữ nguyên nhưng chuẩn hóa ngày tháng)
  const kt1Students = dbStudents.filter(s => s.class?.name?.includes('Khai Tâm 1'));
  kt1Students.forEach(s => {
    keptDbStudentIds.add(s.id);
  });

  // 4. Các học sinh trong DB không nằm trong DS DÁN của 20 lớp và không phải KT1 -> Xóa
  const studentsToDelete = dbStudents.filter(s => !keptDbStudentIds.has(s.id));

  console.log(`\n======================================================`);
  console.log(`📊 KẾT QUẢ TỔNG KẾT TÍNH TOÁN:`);
  console.log(`- Học sinh giữ lại / cập nhật lớp: ${studentsToUpdate.length}`);
  console.log(`- Học sinh mới cần thêm vào DB: ${studentsToInsert.length}`);
  console.log(`- Học sinh Khai Tâm 1 (giữ nguyên): ${kt1Students.length}`);
  console.log(`- Học sinh thừa không có trong DS DÁN cần xóa: ${studentsToDelete.length}`);
  console.log(`- Tổng sĩ số 20 lớp DS DÁN: ${Object.values(targetClassStudentsCount).reduce((a, b) => a + b, 0)}`);
  console.log(`- Tổng học sinh sau khi đồng bộ (bao gồm KT1): ${Object.values(targetClassStudentsCount).reduce((a, b) => a + b, 0) + kt1Students.length}`);

  console.log(`\nChi tiết sĩ số từng lớp theo DS DÁN:`);
  console.table(targetClassStudentsCount);

  if (studentsToDelete.length > 0) {
    console.log(`\nDanh sách 10 học sinh thừa sẽ bị xóa khỏi DB:`);
    console.table(studentsToDelete.slice(0, 10).map(s => ({
      id: s.id,
      code: s.code,
      name: `${s.holyName} ${s.fullName}`,
      dob: s.dob,
      class: s.class?.name
    })));
  }

  if (studentsToInsert.length > 0) {
    console.log(`\nDanh sách 10 học sinh mới sẽ được tạo:`);
    console.table(studentsToInsert.slice(0, 10).map(s => ({
      name: `${s.holyName} ${s.fullName}`,
      dob: s.dob,
      class: s.targetClassName
    })));
  }
}

simulate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
