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

  // YYYY-MM-DD
  let match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const yyyy = match[1];
    const mm = match[2].padStart(2, '0');
    const dd = match[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  match = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    let p1 = parseInt(match[1], 10);
    let p2 = parseInt(match[2], 10);
    const yyyy = match[3];

    let dd, mm;
    if (p1 <= 12 && p2 > 12) {
      mm = String(p1).padStart(2, '0');
      dd = String(p2).padStart(2, '0');
    } else {
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

function cleanStr(val) {
  if (!val) return null;
  const s = String(val).normalize('NFC').replace(/\s+/g, ' ').trim();
  return s === 'null' || s === 'undefined' || s === '' ? null : s;
}

async function analyze() {
  const dbStudents = await prisma.student.findMany({
    include: { class: true }
  });
  console.log(`Total current students in DB: ${dbStudents.length}`);

  // Also collect all students from "THÔNG TIN LÝ LỊCH" sheets across all 20 files to have their full profile data
  const profileInfoMap = new Map(); // key: normalizeName(fullName) -> profile info

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
          const key = `${normalizeName(fullName)}_${dob || ''}`;
          const keyNameOnly = normalizeName(fullName);

          const info = {
            holyName: holyName || 'Chưa cập nhật',
            fullName,
            dob,
            address: cleanStr(row[4]),
            phone: cleanStr(row[5]),
            fatherHolyName: cleanStr(row[6]),
            fatherName: cleanStr(row[7]),
            fatherPhone: cleanStr(row[8]),
            motherHolyName: cleanStr(row[9]),
            motherName: cleanStr(row[10]),
            motherPhone: cleanStr(row[11]),
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

          profileInfoMap.set(key, info);
          if (!profileInfoMap.has(keyNameOnly)) {
            profileInfoMap.set(keyNameOnly, info);
          }
        }
      }
    }
  }

  console.log(`Loaded detailed profile info for ${profileInfoMap.size} keys from Lý Lịch sheets.`);

  // Now process each of the 20 files' DS DÁN
  let matchedInDb = 0;
  let notInDb = 0;
  const missingInDbList = [];

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

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i] || [];
      if (row.some(cell => String(cell).toUpperCase().includes('STT') || String(cell).toUpperCase().includes('HỌ VÀ TÊN'))) {
        headerRowIdx = i;
        break;
      }
    }

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const stt = row[0];
      const holyName = cleanStr(row[1]);
      const fullName = cleanStr(row[2]);
      const rawDob = row[3];
      if (!fullName || fullName.length < 2) continue;
      if (typeof stt !== 'number' && isNaN(parseInt(stt))) continue;

      const parsedDob = parseDateToDDMMYYYY(rawDob);
      const normName = normalizeName(fullName);

      // Try to find in DB: matching name AND matching dob (or if parsedDob is null, match name in same class/DB)
      let match = dbStudents.find(s => {
        const sNormName = normalizeName(s.fullName);
        if (sNormName !== normName) return false;
        if (parsedDob && s.dob) {
          const sDobFormatted = parseDateToDDMMYYYY(s.dob);
          return sDobFormatted === parsedDob;
        }
        return true;
      });

      if (match) {
        matchedInDb++;
      } else {
        notInDb++;
        missingInDbList.push({
          file,
          className,
          holyName,
          fullName,
          rawDob,
          parsedDob
        });
      }
    }
  }

  console.log(`\nMatching stats against DB:`);
  console.log(`- Matched existing in DB: ${matchedInDb}`);
  console.log(`- Not currently found in DB: ${notInDb}`);
  if (missingInDbList.length > 0) {
    console.log(`\nFirst 10 missing in DB:`);
    console.table(missingInDbList.slice(0, 10));
  }
}

analyze()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
