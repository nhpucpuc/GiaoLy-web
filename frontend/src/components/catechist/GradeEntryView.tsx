import React, { useState, useMemo, useEffect } from 'react';
import { FileSpreadsheet, Save, CheckCircle2, ArrowDownAZ, Filter, BookOpen, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { RankBadge } from '../shared/RankBadge';
import { StudentTranscriptModal } from '../shared/StudentTranscriptModal';
import { Student } from '../../types';

interface SemesterGradeRecord {
  studentId: string;
  hk1_tx1: number | string;
  hk1_tx2: number | string;
  hk1_thi: number | string;
  hk2_tx1: number | string;
  hk2_tx2: number | string;
  hk2_thi: number | string;
}

const EDITABLE_COLUMNS = ['hk1_tx1', 'hk1_tx2', 'hk1_thi', 'hk2_tx1', 'hk2_tx2', 'hk2_thi'] as const;

interface GradeEntryViewProps {
  isReadOnly?: boolean;
}

export const GradeEntryView: React.FC<GradeEntryViewProps> = ({ isReadOnly = false }) => {
  const { classes, selectedClassId, students, grades, catechists, saveAllGrades, currentRole, currentUser } = useApp();
  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState<Student | null>(null);

  // Giáo lý viên bắt buộc chỉ xem và nhập điểm cho đúng lớp được Admin phân công
  const targetClassId = currentRole === 'catechist' && currentUser?.assignedClassId
    ? currentUser.assignedClassId
    : selectedClassId;

  const currentClass = classes.find((c) => c.id === targetClassId) || classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = currentClass ? students.filter((s) => s.classId === currentClass.id) : [];

  // Chế độ Lọc danh sách: 'ALL' (A-Z), 'TOP_4' (Top 4 điểm cao nhất), 'NOT_PASSED' (Chưa đạt < 5.0)
  const [filterMode, setFilterMode] = useState<'ALL' | 'TOP_4' | 'NOT_PASSED'>('ALL');

  // Load from database grades
  const [gradeState, setGradeState] = useState<Record<string, SemesterGradeRecord>>({});

  useEffect(() => {
    const map: Record<string, SemesterGradeRecord> = {};
    classStudents.forEach((s) => {
      const dbGrade = grades.find((g) => g.studentId === s.id);
      map[s.id] = {
        studentId: s.id,
        hk1_tx1: (dbGrade as any)?.hk1_tx1 ?? '',
        hk1_tx2: (dbGrade as any)?.hk1_tx2 ?? '',
        hk1_thi: (dbGrade as any)?.hk1_thi ?? '',
        hk2_tx1: (dbGrade as any)?.hk2_tx1 ?? '',
        hk2_tx2: (dbGrade as any)?.hk2_tx2 ?? '',
        hk2_thi: (dbGrade as any)?.hk2_thi ?? ''
      };
    });
    setGradeState(map);
  }, [classStudents.length, grades]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (
    studentId: string,
    key: keyof Omit<SemesterGradeRecord, 'studentId'>,
    val: string
  ) => {
    setGradeState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: val === '' ? '' : Math.min(10, Math.max(0, parseFloat(val) || 0))
      }
    }));
  };

  // Helper hàm tính điểm trung bình cho 1 học sinh
  const getStudentScoreStats = (sId: string, state: Record<string, SemesterGradeRecord>) => {
    const g = state[sId] || {
      studentId: sId,
      hk1_tx1: '',
      hk1_tx2: '',
      hk1_thi: '',
      hk2_tx1: '',
      hk2_tx2: '',
      hk2_thi: ''
    };

    const n = (v: number | string) => (typeof v === 'number' ? v : parseFloat(v as string) || 0);

    let hk1_tb: number | null = null;
    if (g.hk1_tx1 !== '' && g.hk1_tx2 !== '' && g.hk1_thi !== '') {
      const tb_tx1 = (n(g.hk1_tx1) + n(g.hk1_tx2)) / 2;
      hk1_tb = Number(((tb_tx1 + n(g.hk1_thi)) / 2).toFixed(1));
    }

    let hk2_tb: number | null = null;
    if (g.hk2_tx1 !== '' && g.hk2_tx2 !== '' && g.hk2_thi !== '') {
      const tb_tx2 = (n(g.hk2_tx2) + n(g.hk2_tx2)) / 2;
      hk2_tb = Number(((tb_tx2 + n(g.hk2_thi)) / 2).toFixed(1));
    }

    let tb_cn: number | null = null;
    if (hk1_tb !== null && hk2_tb !== null) {
      tb_cn = Number(((hk1_tb + hk2_tb) / 2).toFixed(1));
    } else if (hk1_tb !== null) {
      tb_cn = hk1_tb;
    }

    return { g, hk1_tb, hk2_tb, tb_cn };
  };

  // Tính toán số liệu học tập và thứ hạng cho TẤT CẢ học sinh trong lớp
  const allCalculatedData = useMemo(() => {
    const baseList = classStudents.map((s) => {
      const { g, hk1_tb, hk2_tb, tb_cn } = getStudentScoreStats(s.id, gradeState);

      let result = '—';
      if (tb_cn !== null) {
        result = tb_cn >= 5.0 ? 'Lên lớp' : 'Chưa đạt';
      }

      return {
        student: s,
        grades: g,
        hk1_tb,
        hk2_tb,
        tb_cn,
        result
      };
    });

    // Tính xếp hạng Cả Năm (theo điểm giảm dần)
    const distinctScores = Array.from(
      new Set(
        baseList
          .filter((item) => item.tb_cn !== null)
          .map((item) => item.tb_cn as number)
      )
    ).sort((a, b) => b - a);

    const cnRankMap = new Map<string, number>();
    baseList.forEach((item) => {
      if (item.tb_cn !== null) {
        const rank = distinctScores.indexOf(item.tb_cn) + 1;
        cnRankMap.set(item.student.id, rank);
      }
    });

    return baseList.map((item) => ({
      ...item,
      cn_rank: cnRankMap.get(item.student.id) || null
    }));
  }, [classStudents, gradeState]);

  // Tìm 4 con điểm cao nhất khác nhau (Unique Top 4 Scores)
  const top4DistinctScores = useMemo(() => {
    const validScores = allCalculatedData
      .map((row) => (row.tb_cn !== null ? row.tb_cn : row.hk1_tb))
      .filter((val): val is number => val !== null && val !== undefined);

    const uniqueSorted = Array.from(new Set(validScores)).sort((a, b) => b - a);
    return uniqueSorted.slice(0, 4);
  }, [allCalculatedData]);

  // Đếm số lượng học sinh chưa đạt (Điểm TB < 5.0)
  const notPassedCount = useMemo(() => {
    return allCalculatedData.filter((row) => {
      const score = row.tb_cn !== null ? row.tb_cn : row.hk1_tb;
      return score !== null && score < 5.0;
    }).length;
  }, [allCalculatedData]);

  // Danh sách hiển thị theo bộ lọc
  const displayedData = useMemo(() => {
    if (filterMode === 'TOP_4') {
      if (top4DistinctScores.length === 0) {
        return allCalculatedData;
      }
      return allCalculatedData
        .filter((row) => {
          const score = row.tb_cn !== null ? row.tb_cn : row.hk1_tb;
          return score !== null && top4DistinctScores.includes(score);
        })
        .sort((a, b) => {
          const scoreA = a.tb_cn !== null ? a.tb_cn : a.hk1_tb ?? -1;
          const scoreB = b.tb_cn !== null ? b.tb_cn : b.hk1_tb ?? -1;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return a.student.fullName.localeCompare(b.student.fullName);
        });
    }

    if (filterMode === 'NOT_PASSED') {
      return allCalculatedData
        .filter((row) => {
          const score = row.tb_cn !== null ? row.tb_cn : row.hk1_tb;
          return score !== null && score < 5.0;
        })
        .sort((a, b) => {
          const scoreA = a.tb_cn !== null ? a.tb_cn : a.hk1_tb ?? 0;
          const scoreB = b.tb_cn !== null ? b.tb_cn : b.hk1_tb ?? 0;
          if (scoreA !== scoreB) return scoreA - scoreB;
          return a.student.fullName.localeCompare(b.student.fullName);
        });
    }

    // Default 'ALL': Sắp xếp theo tên A-Z
    return [...allCalculatedData].sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
  }, [allCalculatedData, filterMode, top4DistinctScores]);

  // Điều hướng phím Enter chuẩn Excel
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    const totalRows = displayedData.length;
    const totalCols = EDITABLE_COLUMNS.length;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.shiftKey) {
        // Nhấn Enter: Xuống học sinh kế tiếp
        if (rowIndex < totalRows - 1) {
          const nextInput = document.getElementById(`grade-input-${rowIndex + 1}-${colIndex}`);
          nextInput?.focus();
          (nextInput as HTMLInputElement)?.select?.();
        } else {
          // Khi hết danh sách học sinh: Nhảy sang học sinh đầu tiên của cột kế tiếp
          if (colIndex < totalCols - 1) {
            const nextColInput = document.getElementById(`grade-input-0-${colIndex + 1}`);
            nextColInput?.focus();
            (nextColInput as HTMLInputElement)?.select?.();
          }
        }
      } else {
        // Shift + Enter: Đi lên học sinh trước đó
        if (rowIndex > 0) {
          const prevInput = document.getElementById(`grade-input-${rowIndex - 1}-${colIndex}`);
          prevInput?.focus();
          (prevInput as HTMLInputElement)?.select?.();
        } else if (rowIndex === 0 && colIndex > 0) {
          const prevColInput = document.getElementById(`grade-input-${totalRows - 1}-${colIndex - 1}`);
          prevColInput?.focus();
          (prevColInput as HTMLInputElement)?.select?.();
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < totalRows - 1) {
        const nextInput = document.getElementById(`grade-input-${rowIndex + 1}-${colIndex}`);
        nextInput?.focus();
        (nextInput as HTMLInputElement)?.select?.();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevInput = document.getElementById(`grade-input-${rowIndex - 1}-${colIndex}`);
        prevInput?.focus();
        (prevInput as HTMLInputElement)?.select?.();
      }
    }
  };

  const handleSave = async () => {
    if (!currentClass) return;
    setIsSaving(true);
    try {
      const gradesToSave = Object.values(gradeState).map((g) => ({
        studentId: g.studentId,
        hk1_tx1: typeof g.hk1_tx1 === 'number' ? g.hk1_tx1 : parseFloat(g.hk1_tx1 as string) || 0,
        hk1_tx2: typeof g.hk1_tx2 === 'number' ? g.hk1_tx2 : parseFloat(g.hk1_tx2 as string) || 0,
        hk1_thi: typeof g.hk1_thi === 'number' ? g.hk1_thi : parseFloat(g.hk1_thi as string) || 0,
        hk2_tx1: typeof g.hk2_tx1 === 'number' ? g.hk2_tx1 : parseFloat(g.hk2_tx1 as string) || 0,
        hk2_tx2: typeof g.hk2_tx2 === 'number' ? g.hk2_tx2 : parseFloat(g.hk2_tx2 as string) || 0,
        hk2_thi: typeof g.hk2_thi === 'number' ? g.hk2_thi : parseFloat(g.hk2_thi as string) || 0,
      }));

      await saveAllGrades(currentClass.id, gradesToSave);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      alert('Không thể lưu điểm số lên cơ sở dữ liệu!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!currentClass) return;

    // 1. Dòng tiêu đề và thông tin chung
    const titleRows = [
      ['BAN GIÁO LÝ GIÁO XỨ SƠN LỘC'],
      [`BẢNG ĐIỂM TỔNG KẾT NĂM HỌC ${currentClass.academicYear || '2026 - 2027'}`],
      [`Lớp: ${currentClass.name}`, `Phòng học: ${currentClass.roomNumber || 'Chưa xếp phòng'}`, `Thời gian: ${currentClass.schedule || ''}`],
      [`Giáo lý viên phụ trách: ${getFullCatechistNames(currentClass, catechists)}`],
      [], // Dòng trống ngăn cách
      [
        'STT',
        'Tên Thánh',
        'Họ và Tên',
        'KT TX1 (HK1)',
        'KT TX2 (HK1)',
        'Thi HK1',
        'TB HK1',
        'KT TX1 (HK2)',
        'KT TX2 (HK2)',
        'Thi HK2',
        'TB HK2',
        'TB Cả Năm',
        'Xếp Hạng',
        'Kết Quả'
      ]
    ];

    // 2. Dữ liệu điểm chi tiết của tất cả học sinh
    const dataRows = allCalculatedData.map((row, idx) => {
      const s = row.student;
      const g = row.grades;
      return [
        idx + 1,
        s.holyName || '',
        s.fullName || '',
        g.hk1_tx1 !== '' ? g.hk1_tx1 : '',
        g.hk1_tx2 !== '' ? g.hk1_tx2 : '',
        g.hk1_thi !== '' ? g.hk1_thi : '',
        row.hk1_tb !== null ? row.hk1_tb : '',
        g.hk2_tx1 !== '' ? g.hk2_tx1 : '',
        g.hk2_tx2 !== '' ? g.hk2_tx2 : '',
        g.hk2_thi !== '' ? g.hk2_thi : '',
        row.hk2_tb !== null ? row.hk2_tb : '',
        row.tb_cn !== null ? row.tb_cn : '',
        row.cn_rank !== null ? `Hạng ${row.cn_rank}` : '',
        row.result !== '—' ? row.result : ''
      ];
    });

    const fullSheetData = [...titleRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

    // Định dạng độ rộng cột (Column Widths)
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 16 }, // Tên Thánh
      { wch: 26 }, // Họ và Tên
      { wch: 14 }, // KT TX1
      { wch: 14 }, // KT TX2
      { wch: 12 }, // Thi HK1
      { wch: 12 }, // TB HK1
      { wch: 14 }, // KT TX1 (HK2)
      { wch: 14 }, // KT TX2 (HK2)
      { wch: 12 }, // Thi HK2
      { wch: 12 }, // TB HK2
      { wch: 14 }, // TB CN
      { wch: 14 }, // Xếp Hạng
      { wch: 16 }  // Kết Quả
    ];

    const wb = XLSX.utils.book_new();
    const safeSheetName = currentClass.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

    const cleanClassName = currentClass.name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const fileName = `Bang_Diem_${cleanClassName}_NH26-27.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (!currentClass) {
    return (
      <div className="p-12 text-center bg-surface rounded-2xl border border-outline-variant/30 text-on-surface-variant font-body">
        <h3 className="text-lg font-bold text-on-surface mb-2 font-sans">Chưa có lớp học nào</h3>
        <p className="text-xs">Vui lòng tạo lớp học trên trang Quản trị Admin để bắt đầu nhập điểm.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-12 font-body">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans mb-1">
            Nhập điểm - Lớp {currentClass.name}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Năm học {currentClass.academicYear || '2026 - 2027'} | Giáo lý viên phụ trách:{' '}
            <span className="font-semibold text-on-surface">{getFullCatechistNames(currentClass, catechists)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-600/70 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow hover:-translate-y-0.5"
            title="Xuất toàn bộ bảng điểm tổng kết lớp ra file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Xuất file Excel</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-full font-bold text-xs shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Đang lưu...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Đã lưu điểm!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu điểm</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter / Sắp xếp Toolbar (Theo Tên vs Lọc Top 4 Điểm Cao Nhất vs Lọc Chưa Đạt) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-bold text-on-surface">Lọc danh sách:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'ALL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
              }`}
            >
              <ArrowDownAZ className="w-4 h-4" />
              <span>Theo Tên (A → Z)</span>
            </button>

            <button
              onClick={() => setFilterMode('TOP_4')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'TOP_4'
                  ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
              }`}
            >
              <span>Lọc Top 4 điểm cao nhất</span>
            </button>

            <button
              onClick={() => setFilterMode('NOT_PASSED')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'NOT_PASSED'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                  : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className={`w-4 h-4 ${filterMode === 'NOT_PASSED' ? 'text-white' : 'text-rose-600'}`} />
              <span>Học sinh chưa đạt ({notPassedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Active Filter Notification Banner */}
      {filterMode === 'TOP_4' && (
        <div className="mb-4 p-3 bg-primary-container/20 text-on-surface border border-primary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium animate-fadeIn shadow-2xs">
          <div className="flex items-center gap-2">
            <span>
              Đang lọc danh sách theo <strong>4 con điểm cao nhất</strong>:{' '}
              {top4DistinctScores.length > 0 ? (
                <span className="font-extrabold text-primary bg-primary-container/40 px-2 py-0.5 rounded-md">
                  {top4DistinctScores.join(' đ, ')} đ
                </span>
              ) : (
                <em>(Chưa có học sinh nào được nhập điểm)</em>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-on-surface-variant text-[11px] font-bold">
              Hiển thị: <strong className="text-primary">{displayedData.length}</strong> / {classStudents.length} học sinh
            </span>
            <button
              onClick={() => setFilterMode('ALL')}
              className="text-primary hover:underline font-bold cursor-pointer text-xs"
            >
              Bỏ lọc
            </button>
          </div>
        </div>
      )}

      {/* Not Passed Active Filter Notification Banner */}
      {filterMode === 'NOT_PASSED' && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-950 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium animate-fadeIn shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Đang lọc danh sách <strong>học sinh chưa đạt (Điểm TB &lt; 5.0)</strong>:{' '}
              {notPassedCount > 0 ? (
                <span>
                  Tìm thấy <strong className="text-rose-700 font-black">{notPassedCount}</strong> học sinh cần bồi dưỡng thêm.
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Tất cả học sinh trong lớp đều đạt điểm từ 5.0 trở lên! 🎉</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-rose-800 text-[11px] font-bold">
              Hiển thị: <strong className="text-rose-700">{displayedData.length}</strong> / {classStudents.length} học sinh
            </span>
            <button
              onClick={() => setFilterMode('ALL')}
              className="text-primary hover:underline font-bold cursor-pointer text-xs"
            >
              Bỏ lọc (Xem tất cả)
            </button>
          </div>
        </div>
      )}

      {/* Save Notification Toast */}
      {savedSuccess && (
        <div className="mb-4 p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tất cả điểm kiểm tra học sinh đã được cập nhật thành công vào sổ lưu điểm!</span>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-surface border border-tertiary-container rounded-2xl shadow-[0_20px_30px_-15px_rgba(135,213,232,0.1)] flex flex-col overflow-hidden relative">
        {/* Memphis accent subtle background */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none rounded-tr-2xl"
          style={{
            backgroundImage: 'radial-gradient(#87d5e8 2px, transparent 2px)',
            backgroundSize: '16px 16px'
          }}
        ></div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[950px] text-xs">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-surface-container-low border-b-2 border-outline-variant font-semibold text-on-surface">
                <th
                  className="p-3.5 w-14 text-center sticky left-0 bg-surface-container-low z-20 border-r border-outline-variant"
                  rowSpan={2}
                >
                  STT
                </th>
                <th
                  className="p-3.5 sticky left-[56px] bg-surface-container-low z-20 border-r border-outline-variant w-48"
                  rowSpan={2}
                >
                  Tên Thánh, Họ và Tên
                </th>
                <th
                  className="p-2.5 text-center border-b border-r border-outline-variant bg-surface-container font-bold text-primary"
                  colSpan={4}
                >
                  Học Kỳ 1
                </th>
                <th
                  className="p-2.5 text-center border-b border-r border-outline-variant bg-surface-variant/40 font-bold text-secondary"
                  colSpan={4}
                >
                  Học Kỳ 2
                </th>
                <th
                  className="p-2.5 text-center border-b border-outline-variant bg-primary-container/25 text-on-primary-container font-extrabold"
                  colSpan={filterMode === 'TOP_4' ? 4 : 3}
                >
                  Cả Năm
                </th>
              </tr>

              {/* Header Row 2 (Columns) */}
              <tr className="bg-surface-container-lowest font-medium text-on-surface-variant border-b border-outline-variant text-[11px]">
                {/* HK1 Columns (4 cột) */}
                <th className="p-2 text-center border-r border-outline-variant w-14">KT TX1</th>
                <th className="p-2 text-center border-r border-outline-variant w-14">KT TX2</th>
                <th className="p-2 text-center border-r border-outline-variant font-bold text-primary w-16 bg-primary-container/10">
                  Thi HK1
                </th>
                <th className="p-2 text-center border-r border-outline-variant font-bold text-primary w-16 bg-primary-container/20">
                  TB HK1
                </th>

                {/* HK2 Columns (4 cột) */}
                <th className="p-2 text-center border-r border-outline-variant w-14 bg-surface/50">KT TX1</th>
                <th className="p-2 text-center border-r border-outline-variant w-14 bg-surface/50">KT TX2</th>
                <th className="p-2 text-center border-r border-outline-variant font-bold text-secondary w-16 bg-secondary-container/15">
                  Thi HK2
                </th>
                <th className="p-2 text-center border-r border-outline-variant font-bold text-secondary w-16 bg-secondary-container/25">
                  TB HK2
                </th>

                {/* Cả Năm Columns */}
                <th className="p-2 text-center border-r border-outline-variant font-black text-primary bg-primary-container/25 w-20">
                  TB CN
                </th>
                {filterMode === 'TOP_4' && (
                  <th className="p-2 text-center border-r border-outline-variant font-bold bg-amber-50 text-amber-900 w-24">
                    Hạng
                  </th>
                )}
                <th className="p-2 text-center border-r border-outline-variant font-semibold bg-surface/50 w-28">
                  Kết quả
                </th>
                <th className="p-2 text-center font-bold text-primary bg-primary/10 w-24">
                  Học bạ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/40 font-body">
              {displayedData.length === 0 ? (
                <tr>
                  <td colSpan={filterMode === 'TOP_4' ? 13 : 12} className="p-8 text-center text-on-surface-variant">
                    {filterMode === 'NOT_PASSED' ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span>Không có học sinh nào chưa đạt trong lớp. Tất cả học sinh đều đạt điểm &ge; 5.0!</span>
                      </div>
                    ) : (
                      'Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.'
                    )}
                  </td>
                </tr>
              ) : (
                displayedData.map((row, index) => {
                  const s = row.student;
                  const g = row.grades;

                  return (
                    <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      {/* STT */}
                      <td className="p-3 text-center sticky left-0 bg-surface group-hover:bg-surface-container-low/50 z-10 border-r border-outline-variant/40 font-semibold text-outline">
                        {index + 1}
                      </td>

                      {/* Tên Thánh & Họ Tên */}
                      <td className="p-3 sticky left-[56px] bg-surface group-hover:bg-surface-container-low/50 z-10 border-r border-outline-variant/40">
                        <div className="font-bold text-primary">{s.holyName}</div>
                        <div className="text-xs text-on-surface font-medium">{s.fullName}</div>
                      </td>

                      {/* HK1: KT TX1 (colIndex: 0) */}
                      <td className="p-2 text-center border-r border-outline-variant/40">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-surface-container-low rounded border border-outline-variant/30 text-on-surface">
                            {g.hk1_tx1 !== '' ? g.hk1_tx1 : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-0`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk1_tx1}
                            onChange={(e) => handleScoreChange(s.id, 'hk1_tx1', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-surface-bright border border-outline-variant/60 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none font-semibold text-xs transition-all"
                          />
                        )}
                      </td>

                      {/* HK1: KT TX2 (colIndex: 1) */}
                      <td className="p-2 text-center border-r border-outline-variant/40">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-surface-container-low rounded border border-outline-variant/30 text-on-surface">
                            {g.hk1_tx2 !== '' ? g.hk1_tx2 : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-1`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk1_tx2}
                            onChange={(e) => handleScoreChange(s.id, 'hk1_tx2', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 1)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-surface-bright border border-outline-variant/60 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none font-semibold text-xs transition-all"
                          />
                        )}
                      </td>

                      {/* HK1: Thi HK1 (colIndex: 2) */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-primary-container/10">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-white text-primary rounded border border-primary/30 shadow-2xs">
                            {g.hk1_thi !== '' ? g.hk1_thi : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-2`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk1_thi}
                            onChange={(e) => handleScoreChange(s.id, 'hk1_thi', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 2)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-white border border-primary/50 text-primary font-bold rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs transition-all shadow-sm"
                          />
                        )}
                      </td>

                      {/* HK1: TB HK1 */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-primary-container/20">
                        <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-surface-container-lowest shadow-2xs">
                          {row.hk1_tb !== null ? row.hk1_tb : '—'}
                        </span>
                      </td>

                      {/* HK2: KT TX1 (colIndex: 3) */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-surface/50">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-surface-container-low rounded border border-outline-variant/30 text-on-surface">
                            {g.hk2_tx1 !== '' ? g.hk2_tx1 : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-3`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk2_tx1}
                            onChange={(e) => handleScoreChange(s.id, 'hk2_tx1', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 3)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-surface-bright border border-outline-variant/60 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none font-semibold text-xs transition-all"
                          />
                        )}
                      </td>

                      {/* HK2: KT TX2 (colIndex: 4) */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-surface/50">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-surface-container-low rounded border border-outline-variant/30 text-on-surface">
                            {g.hk2_tx2 !== '' ? g.hk2_tx2 : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-4`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk2_tx2}
                            onChange={(e) => handleScoreChange(s.id, 'hk2_tx2', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 4)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-surface-bright border border-outline-variant/60 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none font-semibold text-xs transition-all"
                          />
                        )}
                      </td>

                      {/* HK2: Thi HK2 (colIndex: 5) */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-secondary-container/15">
                        {isReadOnly ? (
                          <span className="inline-block w-12 py-1 text-center font-bold text-xs bg-white text-secondary rounded border border-secondary/30 shadow-2xs">
                            {g.hk2_thi !== '' ? g.hk2_thi : '—'}
                          </span>
                        ) : (
                          <input
                            id={`grade-input-${index}-5`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={g.hk2_thi}
                            onChange={(e) => handleScoreChange(s.id, 'hk2_thi', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 5)}
                            onFocus={(e) => e.target.select()}
                            className="w-12 text-center py-1 bg-white border border-secondary/50 text-secondary font-bold rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-xs transition-all shadow-sm"
                          />
                        )}
                      </td>

                      {/* HK2: TB HK2 */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-secondary-container/25">
                        <span className="font-bold text-secondary px-1.5 py-0.5 rounded bg-surface-container-lowest shadow-2xs">
                          {row.hk2_tb !== null ? row.hk2_tb : '—'}
                        </span>
                      </td>

                      {/* Cả Năm: TB CN */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-primary-container/25 font-bold text-on-primary-container">
                        <span className="px-2 py-0.5 rounded bg-surface-container-lowest font-black text-primary shadow-xs">
                          {row.tb_cn !== null ? row.tb_cn : '—'}
                        </span>
                      </td>

                      {/* Cả Năm: Hạng (Chỉ hiển thị khi Lọc Top 4) */}
                      {filterMode === 'TOP_4' && (
                        <td className="p-2 text-center border-r border-outline-variant/40 bg-amber-50/40">
                          <RankBadge
                            rank={
                              (() => {
                                const score = row.tb_cn !== null ? row.tb_cn : row.hk1_tb;
                                if (score !== null && top4DistinctScores.includes(score)) {
                                  return top4DistinctScores.indexOf(score) + 1;
                                }
                                return row.cn_rank;
                              })()
                            }
                          />
                        </td>
                      )}

                      {/* Cả Năm: Kết quả */}
                      <td className="p-2 text-center border-r border-outline-variant/40 bg-surface/50">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block ${
                            row.result.includes('Lên lớp')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : row.result === 'Chưa đạt'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'text-outline'
                          }`}
                        >
                          {row.result}
                        </span>
                      </td>

                      {/* Cả Năm: Học bạ */}
                      <td className="p-2 text-center bg-surface/50">
                        <button
                          onClick={() => setSelectedTranscriptStudent(s)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer border border-primary/20 hover:scale-105 shadow-2xs"
                          title="Xem sổ học bạ điện tử các năm học"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Học bạ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-center text-xs text-on-surface-variant gap-2">
          <span>
            {filterMode === 'TOP_4' ? (
              <>
                Đang hiển thị <strong className="text-primary font-bold">{displayedData.length}</strong> học sinh thuộc{' '}
                <strong>Top 4 con điểm cao nhất</strong> / Tổng số {classStudents.length} học sinh
              </>
            ) : filterMode === 'NOT_PASSED' ? (
              <>
                Đang hiển thị <strong className="text-rose-700 font-bold">{displayedData.length}</strong> học sinh{' '}
                <strong>chưa đạt (Điểm TB &lt; 5.0)</strong> / Tổng số {classStudents.length} học sinh
              </>
            ) : (
              <>
                Hiển thị đầy đủ <strong className="text-on-surface">{displayedData.length}</strong> học sinh trong lớp{' '}
                <strong className="text-primary">{currentClass.name}</strong>
              </>
            )}
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span>TB HK = ((KT TX1 + KT TX2) / 2 + Thi HK) / 2</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span>TB CN = (TB HK1 + TB HK2) / 2</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sổ Học Bạ Điện Tử Modal */}
      <StudentTranscriptModal
        student={selectedTranscriptStudent}
        isOpen={!!selectedTranscriptStudent}
        onClose={() => setSelectedTranscriptStudent(null)}
      />
    </div>
  );
};
