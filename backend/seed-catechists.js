const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dir = 'c:/Users/LENOVO/Documents/Github/GLY/Mới-DS LỚP GIÁO LÝ ( nh 26-27)';

function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function parseHolyAndFullName(raw) {
  const holyNames = [
    'Maria Madalena', 'Giuse Martino', 'Giuse Antôn', 'Rosa',
    'Têrêsa', 'Teresa', 'Maria', 'Giuse', 'Phêrô', 'Gioan',
    'Anna', 'Phaolô', 'Đaminh', 'Lucia', 'Monica', 'Cha Phó Giuse', 'Thầy Xứ', 'Sr'
  ];

  let holyName = '';
  let fullName = raw.trim();

  for (const h of holyNames) {
    if (fullName.startsWith(h)) {
      holyName = h;
      fullName = fullName.substring(h.length).trim();
      break;
    }
  }

  if (!holyName) {
    holyName = 'Giáo Lý Viên';
  }
  if (!fullName) {
    fullName = raw.trim();
  }

  return { holyName, fullName };
}

async function main() {
  console.log('🚀 BẮT ĐẦU ĐỒNG BỘ TOÀN BỘ DANH SÁCH GIÁO LÝ VIÊN TỪ EXCEL VÀO HỆ THỐNG...\n');

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));
  const defaultPassword = await bcrypt.hash('glv123', 10);
  const classes = await prisma.classRoom.findMany();

  const classMap = new Map();
  for (const c of classes) {
    classMap.set(c.name.trim().toUpperCase(), c.id);
  }

  let totalGlvs = 0;

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
    const rawClassName = file.replace(/^[0-9.]+\s*-\s*/, '').replace(/\s*-\s*Sổ Điểm danh.*/i, '').trim();
    const classId = classMap.get(rawClassName.toUpperCase()) || null;

    for (let r = 2; r < 7; r++) {
      const rowStr = (rows[r] || []).filter(Boolean).join(' ');
      
      let glvList = [];
      const match1 = rowStr.match(/1[-.]\s*([^-–\d\n\r]+)(?:[-–\s]+([\d'\s]+))?/);
      if (match1) {
        glvList.push({
          rawName: match1[1].trim(),
          phone: match1[2] ? match1[2].replace(/['\s]/g, '') : '',
          isLeader: true
        });
      }
      const match2 = rowStr.match(/2[-.]\s*([^-–\d\n\r]+)(?:[-–\s]+([\d'\s]+))?/);
      if (match2) {
        const name = match2[1].trim();
        if (name && !name.includes('…')) {
          glvList.push({
            rawName: name,
            phone: match2[2] ? match2[2].replace(/['\s]/g, '') : '',
            isLeader: false
          });
        }
      }

      for (const glv of glvList) {
        const { holyName, fullName } = parseHolyAndFullName(glv.rawName);
        if (fullName.length < 2) continue;

        const emailName = removeAccents(fullName);
        const email = `${emailName}.glv@gxsonloc.vn`;

        // Create or update GLV user
        await prisma.user.upsert({
          where: { email },
          update: {
            fullName,
            holyName,
            phone: glv.phone || undefined,
            assignedClassId: glv.isLeader && classId ? classId : undefined,
            role: 'CATECHIST',
          },
          create: {
            email,
            password: defaultPassword,
            fullName,
            holyName,
            phone: glv.phone || '0900 000 000',
            assignedClassId: glv.isLeader ? classId : null,
            role: 'CATECHIST',
          },
        });

        totalGlvs++;
        console.log(`✅ GLV: [${holyName}] ${fullName} | Email: ${email} | Lớp: ${rawClassName} (${glv.isLeader ? 'Trưởng lớp' : 'Phụ tá'})`);
      }
    }
  }

  console.log(`\n🎉 Đã nạp và đồng bộ xong ${totalGlvs} Giáo Lý Viên vào cơ sở dữ liệu Supabase.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seed GLV:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
