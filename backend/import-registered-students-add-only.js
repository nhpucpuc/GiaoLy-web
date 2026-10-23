const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const databaseUrl = new URL(process.env.DATABASE_URL);
databaseUrl.searchParams.set('sslaccept', 'accept_invalid_certs');
databaseUrl.searchParams.set('connection_limit', '1');
databaseUrl.searchParams.set('connect_timeout', '20');
process.env.DATABASE_URL = databaseUrl.toString();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const SOURCE_FILE = path.resolve(
  __dirname,
  '..',
  'chính thức- DS HS MỚI- ĐĂNG KÍ HỌC GIÁO LÝ ( NH 26-27) (1).xlsx',
);
const ACADEMIC_YEAR = '2026 - 2027';

function cleanString(value) {
  if (value === null || value === undefined) return null;
  const result = String(value).normalize('NFC').replace(/\s+/g, ' ').trim();
  return result || null;
}

function normalizeText(value) {
  return (cleanString(value) || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi');
}

function formatPhone(value) {
  if (value === null || value === undefined || value === '') return null;
  let digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 9) digits = `0${digits}`;
  if (digits === '0900000000' || /^0+$/.test(digits)) return null;
  return digits;
}

function formatDate(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${String(parsed.d).padStart(2, '0')}-${String(parsed.m).padStart(2, '0')}-${parsed.y}`;
  }

  const text = String(value).trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
  if (!text) return null;

  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    return `${match[3].padStart(2, '0')}-${match[2].padStart(2, '0')}-${match[1]}`;
  }

  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}-${match[3]}`;
  }

  if (/^\d{4}$/.test(text)) return `01-01-${text}`;
  return null;
}

function identityKey(student) {
  return `${normalizeText(student.fullName)}|${formatDate(student.dob) || ''}`;
}

function filledFieldCount(student) {
  return Object.values(student).filter((value) => value !== null && value !== '').length;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function nameSimilarity(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
}

function contactValues(student) {
  return new Set(
    [student.parentPhone, student.fatherPhone, student.motherPhone]
      .map(formatPhone)
      .filter(Boolean),
  );
}

function hasContactOverlap(a, b) {
  const left = contactValues(a);
  const right = contactValues(b);
  return [...left].some((phone) => right.has(phone));
}

function hasParentOverlap(a, b) {
  const placeholderNames = new Set(['phu huynh hoc sinh', 'chua cap nhat']);
  const left = new Set(
    [a.fatherName, a.motherName]
      .map(normalizeText)
      .filter((name) => name && !placeholderNames.has(name)),
  );
  const right = new Set(
    [b.fatherName, b.motherName]
      .map(normalizeText)
      .filter((name) => name && !placeholderNames.has(name)),
  );
  return [...left].some((name) => right.has(name));
}

function findExistingStudent(sourceStudent, databaseStudents) {
  const sourceDate = formatDate(sourceStudent.dob);
  const exactNameCandidates = databaseStudents.filter(
    (student) => normalizeText(student.fullName) === normalizeText(sourceStudent.fullName),
  );
  const exact = exactNameCandidates.find((student) => {
    const databaseDate = formatDate(student.dob);
    const sameDate = databaseDate === sourceDate;
    const sameContact = hasContactOverlap(student, sourceStudent);
    const sameParent = hasParentOverlap(student, sourceStudent);
    const sameYearForYearOnlySource =
      sourceStudent.sourceDobYearOnly &&
      databaseDate?.slice(-4) === sourceDate?.slice(-4);
    return sameDate || sameContact || sameParent || sameYearForYearOnlySource;
  });
  if (exact) return { student: exact, reason: 'same identity details' };

  const closeMatch = databaseStudents.find((student) => {
    const similarity = nameSimilarity(student.fullName, sourceStudent.fullName);
    if (similarity < 0.9) return false;
    const sameDate = formatDate(student.dob) === sourceDate;
    const sameContact = hasContactOverlap(student, sourceStudent);
    const sameParent = hasParentOverlap(student, sourceStudent);
    return (sameDate && (sameContact || sameParent)) || (sameContact && sameParent);
  });

  return closeMatch
    ? { student: closeMatch, reason: 'matching personal details' }
    : null;
}

function parseSourceStudents() {
  const workbook = xlsx.readFile(SOURCE_FILE);
  const sheetName = workbook.SheetNames.find((name) =>
    normalizeText(name).includes('theo lop'),
  );
  if (!sheetName) throw new Error('Could not find the class-sorted student sheet.');

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
  });
  const headerIndex = rows.findIndex(
    (row) => normalizeText(row[0]) === 'stt' && normalizeText(row[2]).includes('ho va ten'),
  );
  if (headerIndex < 0) throw new Error('Could not find the student header row.');

  return rows
    .slice(headerIndex + 2)
    .map((row, offset) => {
      const fullName = cleanString(row[2]);
      const rowNumber = headerIndex + 3 + offset;
      if (!fullName || !Number.isFinite(Number(row[0]))) return null;

      const generalPhone = formatPhone(row[8]);
      const fatherPhone = formatPhone(row[19]);
      const motherPhone = formatPhone(row[22]);
      const fatherName = cleanString(row[18]);
      const motherName = cleanString(row[21]);
      const femaleMarker = normalizeText(row[3]);
      const rawDob = cleanString(row[4]);

      return {
        sourceRow: rowNumber,
        sourceClassName: cleanString(row[23]),
        holyName: cleanString(row[1]) || 'Chưa cập nhật',
        fullName,
        gender: femaleMarker.includes('x') || femaleMarker.includes('nu') ? 'Nữ' : 'Nam',
        dob: formatDate(row[4]),
        sourceDobYearOnly: /^\d{4}$/.test(rawDob || ''),
        pob: cleanString(row[5]),
        address: cleanString(row[6]) || 'Chưa cập nhật',
        parishSubdivision: cleanString(row[7]),
        parentName: fatherName || motherName || 'Chưa cập nhật',
        parentPhone: generalPhone || fatherPhone || motherPhone || '',
        fatherHolyName: cleanString(row[17]),
        fatherName,
        fatherPhone,
        motherHolyName: cleanString(row[20]),
        motherName,
        motherPhone,
        baptismDate: formatDate(row[9]),
        baptismPlace: cleanString(row[10]),
        eucharistDate: formatDate(row[11]),
        eucharistPlace: cleanString(row[12]),
        confirmationDate: formatDate(row[13]),
        confirmationPlace: cleanString(row[14]),
        solemnCommunionDate: formatDate(row[15]),
        solemnCommunionPlace: cleanString(row[16]),
        notes: cleanString(row[24]),
        status: 'DANG_HOC',
      };
    })
    .filter(Boolean);
}

function deduplicateSource(students) {
  const groups = new Map();
  for (const student of students) {
    const key = identityKey(student);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(student);
  }

  return [...groups.values()].map((group) => ({
    student: [...group].sort((a, b) => filledFieldCount(b) - filledFieldCount(a))[0],
    rows: group.map((student) => student.sourceRow),
    classNames: [...new Set(group.map((student) => normalizeText(student.sourceClassName)))],
  }));
}

function sanitizeForInsert(student, classId, code, id) {
  const {
    sourceRow,
    sourceClassName,
    sourceDobYearOnly,
    ...studentFields
  } = student;

  return {
    id,
    code,
    ...studentFields,
    classId,
    isDeleted: false,
    deletedAt: null,
  };
}

async function buildPlan() {
  const sourceRows = parseSourceStudents();
  const sourceGroups = deduplicateSource(sourceRows);
  const databaseStudents = await prisma.student.findMany({
    select: {
      id: true,
      code: true,
      fullName: true,
      dob: true,
      parentPhone: true,
      fatherName: true,
      fatherPhone: true,
      motherName: true,
      motherPhone: true,
    },
  });
  const classes = await prisma.classRoom.findMany({
    select: { id: true, name: true },
  });
  const classMap = new Map(classes.map((item) => [normalizeText(item.name), item]));

  const existing = [];
  const unresolved = [];
  const ready = [];

  for (const group of sourceGroups) {
    const sourceStudent = group.student;
    const databaseMatch = findExistingStudent(sourceStudent, databaseStudents);
    if (databaseMatch) {
      existing.push({
        row: group.rows.join(', '),
        name: sourceStudent.fullName,
        dob: sourceStudent.dob,
        reason: databaseMatch.reason,
        existingCode: databaseMatch.student.code,
      });
      continue;
    }

    if (!sourceStudent.dob) {
      unresolved.push({ row: group.rows.join(', '), name: sourceStudent.fullName, reason: 'missing date of birth' });
      continue;
    }

    if (group.classNames.length > 1) {
      unresolved.push({
        row: group.rows.join(', '),
        name: sourceStudent.fullName,
        reason: 'same student is assigned to multiple classes in the workbook',
      });
      continue;
    }

    const targetClass = classMap.get(normalizeText(sourceStudent.sourceClassName));
    if (!targetClass) {
      unresolved.push({
        row: group.rows.join(', '),
        name: sourceStudent.fullName,
        reason: sourceStudent.sourceClassName
          ? `class not found: ${sourceStudent.sourceClassName}`
          : 'missing class',
      });
      continue;
    }

    ready.push({ student: sourceStudent, targetClass });
  }

  return { sourceRows, sourceGroups, databaseStudents, existing, unresolved, ready };
}

async function applyPlan(plan) {
  if (!plan.ready.length) return [];

  return prisma.$transaction(async (transaction) => {
    const currentStudents = await transaction.student.findMany({
      select: {
        id: true,
        code: true,
        fullName: true,
        dob: true,
        parentPhone: true,
        fatherName: true,
        fatherPhone: true,
        motherName: true,
        motherPhone: true,
      },
    });

    const candidates = plan.ready.filter(
      ({ student }) => !findExistingStudent(student, currentStudents),
    );
    const highestCode = currentStudents.reduce((highest, student) => {
      const numericCode = Number.parseInt(student.code || '', 10);
      return Number.isFinite(numericCode) ? Math.max(highest, numericCode) : highest;
    }, 10000);

    const studentRows = [];
    const gradeRows = [];
    candidates.forEach(({ student, targetClass }, index) => {
      const id = crypto.randomUUID();
      const code = String(highestCode + index + 1).padStart(5, '0');
      studentRows.push(sanitizeForInsert(student, targetClass.id, code, id));
      gradeRows.push({
        id: crypto.randomUUID(),
        studentId: id,
        classId: targetClass.id,
        academicYear: ACADEMIC_YEAR,
      });
    });

    if (studentRows.length) {
      await transaction.student.createMany({ data: studentRows });
      await transaction.gradeRecord.createMany({ data: gradeRows });
    }

    return studentRows.map((student) => ({
      code: student.code,
      name: student.fullName,
      dob: student.dob,
    }));
  }, { isolationLevel: 'Serializable', timeout: 60000 });
}

async function main() {
  const beforeStudentCount = await prisma.student.count();
  const beforeGradeCount = await prisma.gradeRecord.count();
  const plan = await buildPlan();
  const possibleMatches = plan.ready.map(({ student }) => ({
    source: { name: student.fullName, dob: student.dob },
    candidates: plan.databaseStudents
      .map((candidate) => ({
        code: candidate.code,
        name: candidate.fullName,
        dob: candidate.dob,
        similarity: nameSimilarity(candidate.fullName, student.fullName),
        sameContact: hasContactOverlap(candidate, student),
        sameParent: hasParentOverlap(candidate, student),
      }))
      .filter((candidate) =>
        candidate.similarity >= 0.75 ||
        candidate.sameContact ||
        candidate.sameParent,
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3),
  }));

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    sourceRows: plan.sourceRows.length,
    uniqueSourceStudents: plan.sourceGroups.length,
    existingStudentsSkipped: plan.existing.length,
    readyToInsert: plan.ready.length,
    unresolved: plan.unresolved,
    ready: plan.ready.map(({ student, targetClass }) => ({
      row: student.sourceRow,
      name: student.fullName,
      dob: student.dob,
      className: targetClass.name,
    })),
    possibleMatches,
  }, null, 2));

  if (!APPLY) return;

  const inserted = await applyPlan(plan);
  const afterStudentCount = await prisma.student.count();
  const afterGradeCount = await prisma.gradeRecord.count();

  if (afterStudentCount - beforeStudentCount !== inserted.length) {
    throw new Error('Student count verification failed after insert.');
  }
  if (afterGradeCount - beforeGradeCount !== inserted.length) {
    throw new Error('Grade record count verification failed after insert.');
  }

  console.log(JSON.stringify({
    insertedStudents: inserted.length,
    studentCountBefore: beforeStudentCount,
    studentCountAfter: afterStudentCount,
    gradeCountBefore: beforeGradeCount,
    gradeCountAfter: afterGradeCount,
    inserted,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
