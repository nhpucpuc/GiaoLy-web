import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Calendar,
  Filter,
  Users,
  UserCheck,
  Plus,
  Clock,
  ArrowLeft,
  X,
  Pencil,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatToDDMMYYYY, compareDDMMYYYY, isValidDDMMYYYY } from '../../utils/dateUtils';
import { sortStudentsByVietnameseName } from '../../utils/nameUtils';
import { CustomDatePicker } from '../common/CustomDatePicker';

export interface AbsenceItem {
  id?: string;
  date: string;
  status: 'VANG_CO_PHEP' | 'VANG_KHONG_PHEP';
  notes?: string;
}

export interface StudentAttendanceRow {
  studentId: string;
  holyName: string;
  fullName: string;
  gender: string;
  code: string;
  absentCount: number;
  absences: AbsenceItem[];
  isDirty?: boolean;
}

// Lấy ngày hôm nay theo định dạng cố định DD/MM/YYYY
const getLocalDateString = (): string => {
  return formatToDDMMYYYY(new Date());
};

// Format ngày hiển thị tiếng Việt DD/MM/YYYY không phụ thuộc locale của máy
const formatDisplayDate = (dateStr: string): string => {
  return formatToDDMMYYYY(dateStr);
};

export const AttendanceView: React.FC = () => {
  const {
    students,
    classes,
    selectedClassId,
    setSelectedClassId,
    currentRole,
    currentUser
  } = useApp();

  // Chế độ: 'TODAY' (Điểm danh nhanh hôm nay) hoặc 'GENERAL' (Điểm danh tổng quát)
  const [viewMode, setViewMode] = useState<'TODAY' | 'GENERAL'>('TODAY');

  // Danh sách ngày được GLV thêm thủ công qua nút "Thêm ngày"
  const [manualAddedDates, setManualAddedDates] = useState<string[]>([]);
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState(false);
  const [modalDateInput, setModalDateInput] = useState(getLocalDateString());

  // Quản lý menu tùy chọn cột ngày (Chỉnh sửa / Xóa)
  const [dateMenuState, setDateMenuState] = useState<{
    dateStr: string;
    top: number;
    left: number;
  } | null>(null);

  // Modal Chỉnh sửa ngày
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [targetEditingDate, setTargetEditingDate] = useState<string>('');
  const [editDateInput, setEditDateInput] = useState<string>('');

  // Modal Xác nhận xóa ngày
  const [isDeleteDateModalOpen, setIsDeleteDateModalOpen] = useState(false);
  const [targetDeletingDate, setTargetDeletingDate] = useState<string>('');

  // Xác định lớp phụ trách
  const activeClassId = currentRole === 'catechist' && currentUser?.assignedClassId
    ? currentUser.assignedClassId
    : selectedClassId || (classes[0]?.id ?? '');

  const activeClass = classes.find((c) => c.id === activeClassId);

  const todayDateStr = useMemo(() => getLocalDateString(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceRow>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tải danh sách học sinh & lịch sử điểm danh của lớp
  const fetchClassAttendance = async () => {
    if (!activeClassId) return;
    setIsLoading(true);

    try {
      const records = await api.getAttendanceByClass(activeClassId).catch(() => []);
      const classStudents = students.filter((s) => s.classId === activeClassId);

      const rows: Record<string, StudentAttendanceRow> = {};

      classStudents.forEach((student) => {
        const studentRecords = Array.isArray(records)
          ? records.filter((r: any) => r.studentId === student.id)
          : [];

        const absences: AbsenceItem[] = studentRecords.map((r: any) => ({
          id: r.id,
          date: formatToDDMMYYYY(r.date) || todayDateStr,
          status: r.status === 'VANG_KHONG_PHEP' ? 'VANG_KHONG_PHEP' : 'VANG_CO_PHEP',
          notes: r.notes || '',
        }));

        rows[student.id] = {
          studentId: student.id,
          holyName: student.holyName,
          fullName: student.fullName,
          gender: student.gender,
          code: student.code || student.id,
          absentCount: absences.length,
          absences,
          isDirty: false,
        };
      });

      setAttendanceData(rows);
    } catch (err: any) {
      showToast('Lỗi khi tải dữ liệu điểm danh: ' + (err.message || ''), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAttendance();
  }, [activeClassId, students]);

  // =========================================================================
  // XỬ LÝ TICK ĐIỂM DANH NHANH HÔM NAY (3 TRẠNG THÁI XOAY VÒNG)
  // Tick 1 lần: Vắng không phép ("V" màu đỏ)
  // Tick 2 lần: Vắng có phép ("VP" màu xanh)
  // Tick 3 lần: Bỏ chọn (Trống / Đi học)
  // =========================================================================
  const getTodayStatus = (studentId: string): 'V' | 'VP' | '' => {
    const row = attendanceData[studentId];
    if (!row) return '';
    const todayAbsence = row.absences.find((a) => a.date === todayDateStr);
    if (!todayAbsence) return '';
    return todayAbsence.status === 'VANG_KHONG_PHEP' ? 'V' : 'VP';
  };

  const handleCycleTodayAttendance = (studentId: string) => {
    setAttendanceData((prev) => {
      const row = prev[studentId];
      if (!row) return prev;

      const currentStatus = getTodayStatus(studentId);
      let updatedAbsences = [...row.absences];
      const todayIndex = updatedAbsences.findIndex((a) => a.date === todayDateStr);

      if (currentStatus === '') {
        // Trạng thái 1: Vắng không phép ("V")
        if (todayIndex >= 0) {
          updatedAbsences[todayIndex] = {
            ...updatedAbsences[todayIndex],
            status: 'VANG_KHONG_PHEP',
          };
        } else {
          updatedAbsences.push({
            date: todayDateStr,
            status: 'VANG_KHONG_PHEP',
            notes: '',
          });
        }
      } else if (currentStatus === 'V') {
        // Trạng thái 2: Vắng có phép ("VP")
        if (todayIndex >= 0) {
          updatedAbsences[todayIndex] = {
            ...updatedAbsences[todayIndex],
            status: 'VANG_CO_PHEP',
          };
        } else {
          updatedAbsences.push({
            date: todayDateStr,
            status: 'VANG_CO_PHEP',
            notes: '',
          });
        }
      } else {
        // Trạng thái 3: Bỏ chọn -> Đi học (xóa bản ghi vắng của hôm nay)
        if (todayIndex >= 0) {
          updatedAbsences = updatedAbsences.filter((a) => a.date !== todayDateStr);
        }
      }

      return {
        ...prev,
        [studentId]: {
          ...row,
          absentCount: updatedAbsences.length,
          absences: updatedAbsences,
          isDirty: true,
        },
      };
    });
  };

  // =========================================================================
  // LOGIC CHẾ ĐỘ "ĐIỂM DANH TỔNG QUÁT" (LƯỚI EXCEL THEO TỪNG NGÀY)
  // =========================================================================

  // Danh sách các cột ngày: Tự sinh từ tất cả ngày vắng của lớp + ngày được thêm thủ công
  // Tự động sắp xếp theo thứ tự thời gian tăng dần (cũ -> mới)
  const attendanceDates = useMemo(() => {
    const dateSet = new Set<string>();

    // 1. Tự sinh từ dữ liệu vắng của học sinh trong lớp
    Object.values(attendanceData).forEach((row) => {
      row.absences.forEach((a) => {
        if (a.date && a.date.trim()) {
          dateSet.add(a.date.trim());
        }
      });
    });

    // 2. Thêm các ngày được GLV thêm thủ công qua nút "Thêm ngày"
    manualAddedDates.forEach((d) => {
      if (d && d.trim()) {
        dateSet.add(d.trim());
      }
    });

    // 3. Tự động sắp xếp ngày đúng thứ tự thời gian từ cũ đến mới
    return Array.from(dateSet).sort(compareDDMMYYYY);
  }, [attendanceData, manualAddedDates]);

  // Lấy trạng thái của học sinh tại 1 ngày cụ thể: 'V' | 'VP' | ''
  const getCellStatus = (studentId: string, dateStr: string): 'V' | 'VP' | '' => {
    const row = attendanceData[studentId];
    if (!row) return '';
    const abs = row.absences.find((a) => a.date === dateStr);
    if (!abs) return '';
    return abs.status === 'VANG_KHONG_PHEP' ? 'V' : 'VP';
  };

  // Click vào ô trên bảng Excel để cycle trạng thái:
  // Nhấn 1 lần: V (Vắng không phép)
  // Nhấn 2 lần: VP (Vắng có phép)
  // Nhấn 3 lần: Trả về nguyên trạng (Đi học)
  const handleCycleCellAttendance = (studentId: string, dateStr: string) => {
    setAttendanceData((prev) => {
      const row = prev[studentId];
      if (!row) return prev;

      const currentStatus = getCellStatus(studentId, dateStr);
      let updatedAbsences = [...row.absences];
      const index = updatedAbsences.findIndex((a) => a.date === dateStr);

      if (currentStatus === '') {
        // Trạng thái 1: Vắng không phép ("V")
        if (index >= 0) {
          updatedAbsences[index] = {
            ...updatedAbsences[index],
            status: 'VANG_KHONG_PHEP',
          };
        } else {
          updatedAbsences.push({
            date: dateStr,
            status: 'VANG_KHONG_PHEP',
            notes: '',
          });
        }
      } else if (currentStatus === 'V') {
        // Trạng thái 2: Vắng có phép ("VP")
        if (index >= 0) {
          updatedAbsences[index] = {
            ...updatedAbsences[index],
            status: 'VANG_CO_PHEP',
          };
        } else {
          updatedAbsences.push({
            date: dateStr,
            status: 'VANG_CO_PHEP',
            notes: '',
          });
        }
      } else {
        // Trạng thái 3: Trả về nguyên trạng (Đi học -> xóa khỏi danh sách vắng)
        if (index >= 0) {
          updatedAbsences = updatedAbsences.filter((a) => a.date !== dateStr);
        }
      }

      return {
        ...prev,
        [studentId]: {
          ...row,
          absentCount: updatedAbsences.length,
          absences: updatedAbsences,
          isDirty: true,
        },
      };
    });
  };

  // Mở popup Thêm ngày
  const handleOpenAddDateModal = () => {
    setModalDateInput(getLocalDateString());
    setIsAddDateModalOpen(true);
  };

  // Xác nhận tạo cột ngày mới từ popup
  const handleConfirmAddDate = () => {
    if (!modalDateInput || !isValidDDMMYYYY(modalDateInput)) {
      showToast('Vui lòng chọn ngày hợp lệ (định dạng dd/mm/yyyy)!', 'error');
      return;
    }

    const formatted = formatToDDMMYYYY(modalDateInput);
    if (attendanceDates.includes(formatted)) {
      showToast(`Ngày ${formatted} đã có trong danh sách bảng điểm danh!`, 'error');
      return;
    }

    setManualAddedDates((prev) => [...prev, formatted]);
    setIsAddDateModalOpen(false);
    showToast(`Đã thêm cột ngày ${formatted} thành công!`);
  };

  // Mở menu tùy chọn cột ngày (Chỉnh sửa / Xóa)
  const handleOpenDateActionMenu = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDateMenuState({
      dateStr,
      top: rect.bottom + 6,
      left: Math.max(10, Math.min(window.innerWidth - 180, rect.left - 50)),
    });
  };

  // Mở popup chỉnh sửa ngày
  const handleStartEditDate = (dateStr: string) => {
    setDateMenuState(null);
    setTargetEditingDate(dateStr);
    setEditDateInput(dateStr);
    setIsEditDateModalOpen(true);
  };

  // Xác nhận đổi ngày sang ngày mới
  const handleConfirmEditDate = () => {
    if (!editDateInput || !isValidDDMMYYYY(editDateInput)) {
      showToast('Vui lòng chọn ngày hợp lệ (định dạng dd/mm/yyyy)!', 'error');
      return;
    }

    const formattedNewDate = formatToDDMMYYYY(editDateInput);

    if (formattedNewDate === targetEditingDate) {
      setIsEditDateModalOpen(false);
      return;
    }

    if (attendanceDates.includes(formattedNewDate)) {
      showToast(`Ngày ${formattedNewDate} đã có trong danh sách bảng điểm danh!`, 'error');
      return;
    }

    // 1. Cập nhật dữ liệu điểm danh của học sinh
    setAttendanceData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const row = next[id];
        const hasAbsence = row.absences.some((a) => a.date === targetEditingDate);
        if (hasAbsence) {
          const updatedAbsences = row.absences.map((a) =>
            a.date === targetEditingDate ? { ...a, date: formattedNewDate } : a
          );
          next[id] = {
            ...row,
            absences: updatedAbsences,
            isDirty: true,
          };
        }
      });
      return next;
    });

    // 2. Cập nhật ngày trong danh sách thủ công nếu có
    setManualAddedDates((prev) => {
      const withoutOld = prev.filter((d) => d !== targetEditingDate);
      return [...withoutOld, formattedNewDate];
    });

    setIsEditDateModalOpen(false);
    showToast(`Đã đổi ngày ${targetEditingDate} thành ${formattedNewDate}! Nhấn "Lưu điểm danh" để lưu.`);
  };

  // Mở popup xác nhận xóa ngày
  const handleStartDeleteDate = (dateStr: string) => {
    setDateMenuState(null);
    setTargetDeletingDate(dateStr);
    setIsDeleteDateModalOpen(true);
  };

  // Xác nhận xóa ngày
  const handleConfirmDeleteDate = () => {
    if (!targetDeletingDate) return;

    // 1. Xóa các bản ghi vắng trong ngày này khỏi attendanceData
    setAttendanceData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const row = next[id];
        const hasAbsence = row.absences.some((a) => a.date === targetDeletingDate);
        if (hasAbsence) {
          const updatedAbsences = row.absences.filter((a) => a.date !== targetDeletingDate);
          next[id] = {
            ...row,
            absentCount: updatedAbsences.length,
            absences: updatedAbsences,
            isDirty: true,
          };
        }
      });
      return next;
    });

    // 2. Xóa khỏi danh sách ngày thêm thủ công
    setManualAddedDates((prev) => prev.filter((d) => d !== targetDeletingDate));

    setIsDeleteDateModalOpen(false);
    showToast(`Đã xóa ngày ${targetDeletingDate}! Nhấn "Lưu điểm danh" để cập nhật.`);
  };

  // =========================================================================
  // LƯU ĐIỂM DANH VÀO DATABASE
  // =========================================================================
  const handleSaveAll = async () => {
    if (!activeClassId) return;
    setIsSaving(true);

    try {
      const payload = Object.values(attendanceData).map((row) => ({
        studentId: row.studentId,
        absences: row.absences.map((a) => ({
          date: a.date,
          status: a.status,
          notes: a.notes || '',
        })),
      }));

      await api.batchSyncAttendance(activeClassId, payload);

      setAttendanceData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = { ...next[id], isDirty: false };
        });
        return next;
      });

      showToast('Đã lưu dữ liệu điểm danh vào hệ thống thành công!');
    } catch (err: any) {
      showToast('Lỗi khi lưu điểm danh: ' + (err.message || ''), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Danh sách học sinh sau khi lọc tìm kiếm và luôn sắp xếp theo Alphabet tính bằng tên
  const filteredStudentRows = useMemo(() => {
    const list = Object.values(attendanceData);
    const sorted = sortStudentsByVietnameseName(list);
    if (!searchQuery.trim()) return sorted;

    const query = searchQuery.toLowerCase().trim();
    return sorted.filter(
      (r) =>
        r.fullName.toLowerCase().includes(query) ||
        r.holyName.toLowerCase().includes(query) ||
        (r.code && r.code.toLowerCase().includes(query))
    );
  }, [attendanceData, searchQuery]);

  // Thống kê hôm nay
  const todayStats = useMemo(() => {
    const all = Object.values(attendanceData);
    const totalStudents = all.length;
    let absentWithoutPerm = 0; // V
    let absentWithPerm = 0;    // VP

    all.forEach((r) => {
      const todayAbs = r.absences.find((a) => a.date === todayDateStr);
      if (todayAbs) {
        if (todayAbs.status === 'VANG_KHONG_PHEP') {
          absentWithoutPerm += 1;
        } else {
          absentWithPerm += 1;
        }
      }
    });

    const totalAbsentToday = absentWithoutPerm + absentWithPerm;
    const presentToday = totalStudents - totalAbsentToday;

    return {
      totalStudents,
      presentToday,
      absentWithoutPerm,
      absentWithPerm,
      totalAbsentToday
    };
  }, [attendanceData, todayDateStr]);

  const hasUnsavedChanges = Object.values(attendanceData).some((r) => r.isDirty);

  return (
    <div className="space-y-6 pb-12 font-body max-w-7xl mx-auto animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg text-xs font-semibold border ${toastMessage.type === 'success'
              ? 'bg-surface-container-lowest text-emerald-800 border-emerald-300'
              : 'bg-surface-container-lowest text-rose-800 border-rose-300'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Controls Panel */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-medium text-xs border border-outline-variant/30 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                <span>
                  {viewMode === 'TODAY'
                    ? `Điểm danh hôm nay (${formatDisplayDate(todayDateStr)})`
                    : 'Điểm danh tổng quát'}
                </span>
              </span>
              <span className="text-xs text-outline">• Niên khóa {activeClass?.academicYear || '2026 - 2027'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface font-sans">
              Điểm danh lớp {activeClass?.name || 'Giáo Lý'}
            </h1>
            <p className="text-xs text-on-surface-variant">
              {viewMode === 'TODAY'
                ? 'Nhấn trực tiếp vào ô để chuyển đổi: Tick 1 lần (V - Vắng không phép), Tick 2 lần (VP - Vắng có phép), Tick 3 lần (Đi học).'
                : 'Bảng điểm danh tổng quát theo từng ngày. Nhấn trực tiếp vào ô để chuyển đổi: 1 lần (V), 2 lần (VP), 3 lần (Đi học). Bấm "Thêm ngày" nếu muốn điểm danh bổ sung.'}
            </p>
          </div>

          {/* Action Buttons & Switch Mode Button */}
          <div className="flex items-center gap-2.5 flex-nowrap shrink-0">

            {/* Nút Chuyển Đổi Chế Độ Điểm Danh */}
            {viewMode === 'TODAY' ? (
              <button
                onClick={() => setViewMode('GENERAL')}
                className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title="Xem bảng điểm danh tổng quát tất cả các ngày"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Điểm danh tổng quát</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('TODAY')}
                className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title="Quay lại điểm danh ngày hôm nay"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Về điểm danh hôm nay</span>
              </button>
            )}

            <button
              onClick={fetchClassAttendance}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="px-4 sm:px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <Save className={`w-4 h-4 shrink-0 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Đang lưu...' : hasUnsavedChanges ? 'Lưu điểm danh' : 'Lưu điểm danh'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAT CARDS CHO CHẾ ĐỘ MẶC ĐỊNH (HÔM NAY) */}
        {/* ========================================================================= */}
        {viewMode === 'TODAY' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-outline-variant/20">
            {/* Sĩ số */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center font-semibold shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Tổng sĩ số</div>
                <div className="text-base font-bold text-on-surface mt-0.5">{todayStats.totalStudents} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            {/* Có mặt */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-emerald-700 font-medium">Có mặt hôm nay</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">{todayStats.presentToday} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            {/* Vắng có phép (VP) */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                VP
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Vắng có phép</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5">{todayStats.absentWithPerm} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            {/* Vắng không phép (V) */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200">
                V
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Vắng không phép</div>
                <div className="text-base font-bold text-rose-600 mt-0.5">{todayStats.absentWithoutPerm} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {currentRole === 'admin' ? (
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl border border-outline-variant/30 w-full sm:w-auto shadow-2xs">
            <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
            <span className="text-xs font-medium text-on-surface-variant shrink-0">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent font-semibold text-xs text-primary outline-none cursor-pointer w-full sm:w-auto"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.studentCount} học sinh)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs text-on-surface-variant">
            Danh sách học sinh lớp <span className="font-semibold text-on-surface">{activeClass?.name}</span> ({todayStats.totalStudents} em)
          </div>
        )}

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, tên thánh, mã học sinh..."
            className="w-full pl-9 pr-7 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary/60 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-outline hover:text-on-surface"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GIAO DIỆN MẶC ĐỊNH: ĐIỂM DANH NHANH HÔM NAY (3 CỘT: STT, TÊN THÁNH HỌ VÀ TÊN, TICK) */}
      {/* ========================================================================= */}
      {viewMode === 'TODAY' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
          {/* Hướng dẫn ký hiệu nhỏ gọn */}
          <div className="p-2.5 sm:p-3 bg-surface-container-low/40 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-on-surface-variant">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <span className="font-semibold text-on-surface hidden xs:inline">Ký hiệu:</span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-rose-50 text-rose-600 font-bold border border-rose-300 text-[10px] sm:text-[11px]">V</span>
                <span>Vắng không phép</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold border border-emerald-300 text-[10px] sm:text-[11px]">VP</span>
                <span>Vắng có phép</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-white border border-outline-variant/40 text-[10px]"></span>
                <span>Ô trống = Đi học</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-outline italic">
              * Không tick tức là đi học
            </div>
          </div>

          {/* Bảng điểm danh tối ưu vừa khít cho Mobile */}
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low border-b-2 border-outline-variant/50 text-on-surface font-semibold">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 sm:w-12 border-r border-outline-variant/40 text-[11px] sm:text-xs">
                    STT
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs">
                    TÊN THÁNH, HỌ VÀ TÊN
                  </th>
                  <th className="py-2.5 px-2 text-center w-18 sm:w-24 text-[11px] sm:text-xs">
                    <span className="block leading-tight">ĐIỂM DANH</span>
                    <span className="text-[10px] font-normal text-outline block sm:inline">({formatDisplayDate(todayDateStr)})</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải danh sách học sinh...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudentRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-on-surface-variant text-xs">
                      Không tìm thấy học sinh nào phù hợp với từ khóa &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredStudentRows.map((row, idx) => {
                    const status = getTodayStatus(row.studentId);

                    return (
                      <tr
                        key={row.studentId}
                        className={`hover:bg-surface-container-low/60 transition-colors ${
                          status === 'V'
                            ? 'bg-rose-50/25'
                            : status === 'VP'
                            ? 'bg-emerald-50/25'
                            : row.isDirty
                            ? 'bg-amber-50/20'
                            : ''
                        }`}
                      >
                        {/* 1. STT */}
                        <td className="py-2.5 px-2 text-center font-bold text-outline border-r border-outline-variant/40 text-[11px] sm:text-xs">
                          {idx + 1}
                        </td>

                        {/* 2. Tên Thánh, Họ và Tên (Đã bỏ Avatar để tối ưu chiều ngang) */}
                        <td className="py-2.5 px-2.5 sm:px-3">
                          <div className="leading-tight">
                            <span className="text-primary font-bold text-xs sm:text-sm">{row.holyName}</span>{' '}
                            <span className="text-on-surface font-semibold text-xs sm:text-sm">{row.fullName}</span>
                          </div>
                          <div className="text-[10px] text-outline font-mono mt-0.5">
                            #{row.code}
                          </div>
                        </td>

                        {/* 3. Ô Tick Điểm Danh Thu Nhỏ Vừa Khít (Đi học thì để trống) */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleCycleTodayAttendance(row.studentId)}
                              title="Nhấn để đổi trạng thái: V (Vắng không phép) -> VP (Vắng có phép) -> Đi học"
                              className={`w-12 sm:w-16 h-7 sm:h-8 rounded-lg font-bold transition-all duration-150 flex items-center justify-center shadow-2xs select-none cursor-pointer active:scale-95 ${
                                status === 'V'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-400 hover:bg-rose-100 text-xs sm:text-sm'
                                  : status === 'VP'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-400 hover:bg-emerald-100 text-xs sm:text-sm'
                                  : 'bg-white hover:bg-surface-container-low text-transparent border border-outline-variant/50 hover:border-primary/50'
                              }`}
                            >
                              {status === 'V' ? (
                                <span className="font-extrabold tracking-wider">V</span>
                              ) : status === 'VP' ? (
                                <span className="font-extrabold tracking-wider">VP</span>
                              ) : null}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GIAO DIỆN "ĐIỂM DANH TỔNG QUÁT": CÁC CỘT DẠNG EXCEL TƯƠNG TÁC TỪNG NGÀY */}
      {/* ========================================================================= */}
      {viewMode === 'GENERAL' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden">
          {/* Hướng dẫn ký hiệu nhỏ gọn */}
          <div className="p-2.5 sm:p-3 bg-surface-container-low/40 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-on-surface-variant">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <span className="font-semibold text-on-surface hidden xs:inline">Ký hiệu trong ô:</span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-rose-50 text-rose-600 font-bold border border-rose-300 text-[10px] sm:text-[11px]">V</span>
                <span>Vắng không phép</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold border border-emerald-300 text-[10px] sm:text-[11px]">VP</span>
                <span>Vắng có phép</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center bg-white border border-outline-variant/40 text-[10px]"></span>
                <span>Ô trống = Đi học</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] sm:text-[11px] text-outline italic">
                * Nhấn trực tiếp vào ô: V ➔ VP ➔ Đi học
              </span>
              <button
                type="button"
                onClick={handleOpenAddDateModal}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border border-primary/20 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ngày</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto relative max-h-[75vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-30 bg-surface-container-low border-b-2 border-outline-variant/50 text-on-surface font-semibold select-none">
                <tr>
                  {/* Cột 1 cố định: STT */}
                  <th className="p-3 text-center w-12 min-w-[48px] max-w-[48px] sticky left-0 top-0 bg-surface-container-low z-40 border-r border-outline-variant/40">
                    STT
                  </th>

                  {/* Cột 2 cố định khung: Tên thánh & Họ và Tên */}
                  <th className="p-3 w-[240px] sm:w-[260px] min-w-[240px] sm:min-w-[260px] max-w-[240px] sm:max-w-[260px] sticky left-12 top-0 bg-surface-container-low z-40 border-r border-outline-variant/40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    TÊN THÁNH &amp; HỌ VÀ TÊN
                  </th>

                  {/* Các cột ngày tự sinh từ các buổi vắng + ngày thêm thủ công (ở giữa, trượt ngang được) */}
                  {attendanceDates.map((dateStr) => {
                    const absentOnDate = Object.values(attendanceData).filter((r) =>
                      r.absences.some((a) => a.date === dateStr)
                    ).length;

                    return (
                      <th
                        key={dateStr}
                        className="py-2 px-1 text-center w-24 sm:w-26 min-w-[92px] max-w-[105px] border-r border-outline-variant/35 bg-surface-container-low shrink-0 select-none group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[11px] sm:text-xs font-bold text-on-surface whitespace-nowrap">
                            {dateStr}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDateActionMenu(e, dateStr)}
                            title={`Tùy chọn ngày ${dateStr} (chỉnh sửa hoặc xóa)`}
                            className="p-1 rounded-md text-outline hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] font-normal text-outline mt-0.5 whitespace-nowrap">
                          {absentOnDate > 0 ? (
                            <span className="text-rose-600 font-semibold">{absentOnDate} vắng</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Đủ</span>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Cột đệm linh hoạt (spacer) giữa các ngày và cột Tổng vắng */}
                  <th className="p-0 border-none bg-surface-container-low min-w-0"></th>

                  {/* Cột 3 cố định bên phải: Tổng Vắng */}
                  <th className="p-3 text-center w-24 sm:w-28 min-w-[96px] max-w-[110px] sticky right-0 top-0 bg-surface-container-low z-40 border-l border-outline-variant/40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                    TỔNG VẮNG
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
                {isLoading ? (
                  <tr>
                    <td colSpan={4 + attendanceDates.length} className="p-10 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải danh sách học sinh &amp; dữ liệu điểm danh...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + attendanceDates.length} className="p-10 text-center text-on-surface-variant text-xs">
                      Không tìm thấy học sinh nào phù hợp với từ khóa &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredStudentRows.map((row, idx) => {
                    const stickyBg = row.isDirty
                      ? 'bg-amber-50/95 group-hover:bg-amber-100/90'
                      : 'bg-surface-container-lowest group-hover:bg-surface-container-low/90';

                    return (
                      <tr
                        key={row.studentId}
                        className={`group hover:bg-surface-container-low/60 transition-colors ${
                          row.isDirty ? 'bg-amber-50/25' : ''
                        }`}
                      >
                        {/* 1. STT (cố định bên trái) */}
                        <td
                          className={`p-3 text-center font-bold text-outline sticky left-0 z-20 border-r border-outline-variant/40 w-12 min-w-[48px] max-w-[48px] ${stickyBg}`}
                        >
                          {idx + 1}
                        </td>

                        {/* 2. Tên Thánh & Họ Và Tên (cố định khung 240px - 260px) */}
                        <td
                          className={`p-3 sticky left-12 z-20 border-r border-outline-variant/40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] w-[240px] sm:w-[260px] min-w-[240px] sm:min-w-[260px] max-w-[240px] sm:max-w-[260px] ${stickyBg}`}
                        >
                          <div className="truncate">
                            <div className="font-semibold text-on-surface text-xs leading-snug truncate">
                              <span className="text-primary font-bold">{row.holyName}</span> {row.fullName}
                            </div>
                            <div className="text-[10px] text-outline font-mono">
                              #{row.code}
                            </div>
                          </div>
                        </td>

                        {/* 3. Các ô Excel tương tác theo từng ngày (ở giữa) */}
                        {attendanceDates.map((dateStr) => {
                          const cellStatus = getCellStatus(row.studentId, dateStr);

                          return (
                            <td
                              key={dateStr}
                              className="p-1 text-center w-20 sm:w-22 min-w-[80px] max-w-[88px] border-r border-outline-variant/35 align-middle shrink-0"
                            >
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleCycleCellAttendance(row.studentId, dateStr)}
                                  title={`Em ${row.fullName} - Ngày ${dateStr}: Click để đổi (V -> VP -> Đi học)`}
                                  className={`w-11 sm:w-13 h-7 sm:h-8 rounded-lg font-bold transition-all duration-150 flex items-center justify-center select-none cursor-pointer active:scale-95 text-xs ${
                                    cellStatus === 'V'
                                      ? 'bg-rose-50 text-rose-600 border border-rose-400 hover:bg-rose-100 shadow-2xs font-extrabold'
                                      : cellStatus === 'VP'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-400 hover:bg-emerald-100 shadow-2xs font-extrabold'
                                      : 'bg-white hover:bg-surface-container border border-outline-variant/35 hover:border-primary/50 text-transparent'
                                  }`}
                                >
                                  {cellStatus === 'V' ? (
                                    <span className="font-extrabold tracking-wider">V</span>
                                  ) : cellStatus === 'VP' ? (
                                    <span className="font-extrabold tracking-wider">VP</span>
                                  ) : null}
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Cột đệm linh hoạt ở giữa */}
                        <td className="p-0 border-none min-w-0"></td>

                        {/* 4. Cột Tổng số ngày nghỉ (cố định bên phải) */}
                        <td
                          className={`p-2.5 text-center sticky right-0 z-20 border-l border-outline-variant/40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] align-middle w-24 sm:w-28 min-w-[96px] max-w-[110px] ${stickyBg}`}
                        >
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                              row.absences.length === 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {row.absences.length} buổi
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP / MODAL THÊM NGÀY ĐIỂM DANH MỚI */}
      {/* ========================================================================= */}
      {isAddDateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsAddDateModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xl max-w-sm w-full p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Thêm ngày điểm danh</h3>
                  <p className="text-[11px] text-outline">Điểm danh bổ sung cho ngày đã qua</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDateModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant block">
                Chọn ngày điểm danh:
              </label>
              <div className="w-full">
                <CustomDatePicker
                  value={modalDateInput}
                  onChange={(val) => setModalDateInput(val)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <p className="text-[11px] text-outline italic">
                * Sau khi tạo, cột ngày sẽ tự động được xếp đúng thứ tự thời gian trên bảng. Mặc định tất cả học sinh là có đi học.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsAddDateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAddDate}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo ngày</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu tùy chọn cho cột ngày (Chỉnh sửa / Xóa) */}
      {dateMenuState && (
        <div className="fixed inset-0 z-50 select-none" onClick={() => setDateMenuState(null)}>
          <div
            style={{
              position: 'fixed',
              top: `${dateMenuState.top}px`,
              left: `${dateMenuState.left}px`,
            }}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-xl py-1.5 min-w-[150px] z-50 animate-fadeIn text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
              <span>Ngày {dateMenuState.dateStr}</span>
            </div>
            <button
              type="button"
              onClick={() => handleStartEditDate(dateMenuState.dateStr)}
              className="w-full px-3 py-2 text-left hover:bg-primary/10 hover:text-primary text-on-surface flex items-center gap-2 transition-colors cursor-pointer font-medium"
            >
              <Pencil className="w-3.5 h-3.5 text-primary" />
              <span>Đổi ngày</span>
            </button>
            <button
              type="button"
              onClick={() => handleStartDeleteDate(dateMenuState.dateStr)}
              className="w-full px-3 py-2 text-left hover:bg-rose-50 hover:text-rose-600 text-rose-600 flex items-center gap-2 transition-colors cursor-pointer font-medium border-t border-outline-variant/20"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa ngày</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa ngày điểm danh */}
      {isEditDateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsEditDateModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xl max-w-sm w-full p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Chỉnh sửa ngày điểm danh</h3>
                  <p className="text-[11px] text-outline">Đang sửa ngày: {targetEditingDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditDateModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant block">
                Chọn ngày mới thay thế:
              </label>
              <div className="w-full">
                <CustomDatePicker
                  value={editDateInput}
                  onChange={(val) => setEditDateInput(val)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <p className="text-[11px] text-outline italic">
                * Dữ liệu điểm danh của ngày {targetEditingDate} sẽ chuyển sang ngày mới và cột sẽ tự động xếp lại thứ tự.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsEditDateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmEditDate}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa ngày điểm danh */}
      {isDeleteDateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setIsDeleteDateModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-rose-200 shadow-xl max-w-sm w-full p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Xóa ngày điểm danh</h3>
                  <p className="text-[11px] text-rose-600 font-semibold">Cảnh báo hành động</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteDateModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-on-surface">
              <p>
                Bạn có chắc chắn muốn xóa ngày <strong className="text-rose-600 font-bold">{targetDeletingDate}</strong> khỏi bảng điểm danh?
              </p>
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                Tất cả ghi nhận vắng (V, VP) của học sinh trong ngày này sẽ bị xóa khỏi bảng. Sau khi xóa, bạn cần bấm <strong>Lưu điểm danh</strong> để đồng bộ vào hệ thống.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsDeleteDateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

