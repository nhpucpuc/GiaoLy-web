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
  UserX,
  Trash2,
  Plus,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GenderAvatar } from '../shared/GenderAvatar';
import { api } from '../../services/api';

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

// Lấy ngày hôm nay theo giờ địa phương YYYY-MM-DD
const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format ngày hiển thị tiếng Việt DD/MM/YYYY
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
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

  // Chế độ: 'TODAY' (Mặc định: Điểm danh nhanh hôm nay) hoặc 'MANUAL' (Điểm danh sau)
  const [viewMode, setViewMode] = useState<'TODAY' | 'MANUAL'>('TODAY');

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
          date: r.date || todayDateStr,
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
  // CÁC HÀM XỬ LÝ CHẾ ĐỘ "ĐIỂM DANH SAU" (THỦ CÔNG)
  // =========================================================================
  const handleAbsentCountChange = (studentId: string, count: number) => {
    const current = attendanceData[studentId];
    if (!current) return;

    const newCount = Math.max(0, Math.min(20, count));
    const currentLen = current.absences.length;

    if (newCount === currentLen) return;

    if (newCount < currentLen) {
      const willBeRemoved = current.absences.slice(newCount);
      const hasDetailedData = willBeRemoved.some(
        (a) => (a.notes && a.notes.trim() !== '') || a.status === 'VANG_KHONG_PHEP'
      );

      if (hasDetailedData || currentLen >= 2) {
        const isConfirmed = window.confirm(
          `Em ${current.holyName} ${current.fullName} đang có ${currentLen} ngày nghỉ chi tiết. Bạn có chắc chắn muốn giảm xuống còn ${newCount} ngày không? (${currentLen - newCount} ngày nghỉ phía sau sẽ bị bỏ).`
        );
        if (!isConfirmed) {
          return;
        }
      }
    }

    setAttendanceData((prev) => {
      const row = prev[studentId];
      if (!row) return prev;

      let newAbsences = [...row.absences];

      if (newCount > row.absences.length) {
        const diff = newCount - row.absences.length;
        for (let i = 0; i < diff; i++) {
          newAbsences.push({
            date: todayDateStr,
            status: 'VANG_CO_PHEP',
            notes: '',
          });
        }
      } else if (newCount < row.absences.length) {
        newAbsences = newAbsences.slice(0, newCount);
      }

      return {
        ...prev,
        [studentId]: {
          ...row,
          absentCount: newCount,
          absences: newAbsences,
          isDirty: true,
        },
      };
    });
  };

  const handleAbsenceDetailChange = (
    studentId: string,
    index: number,
    field: keyof AbsenceItem,
    value: any
  ) => {
    setAttendanceData((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const updatedAbsences = [...current.absences];
      if (!updatedAbsences[index]) return prev;

      updatedAbsences[index] = {
        ...updatedAbsences[index],
        [field]: value,
      };

      return {
        ...prev,
        [studentId]: {
          ...current,
          absences: updatedAbsences,
          isDirty: true,
        },
      };
    });
  };

  const handleRemoveAbsence = (studentId: string, index: number) => {
    setAttendanceData((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const updatedAbsences = current.absences.filter((_, i) => i !== index);

      return {
        ...prev,
        [studentId]: {
          ...current,
          absentCount: updatedAbsences.length,
          absences: updatedAbsences,
          isDirty: true,
        },
      };
    });
  };

  const handleAddAbsenceQuick = (studentId: string) => {
    setAttendanceData((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const updatedAbsences = [
        ...current.absences,
        {
          date: todayDateStr,
          status: 'VANG_CO_PHEP' as const,
          notes: '',
        },
      ];

      return {
        ...prev,
        [studentId]: {
          ...current,
          absentCount: updatedAbsences.length,
          absences: updatedAbsences,
          isDirty: true,
        },
      };
    });
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

  const handleSaveSingle = async (studentId: string) => {
    const row = attendanceData[studentId];
    if (!row || !activeClassId) return;

    try {
      await api.batchSyncAttendance(activeClassId, [
        {
          studentId: row.studentId,
          absences: row.absences.map((a) => ({
            date: a.date,
            status: a.status,
            notes: a.notes || '',
          })),
        },
      ]);

      setAttendanceData((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], isDirty: false },
      }));

      showToast(`Đã lưu điểm danh cho em ${row.holyName} ${row.fullName}!`);
    } catch (err: any) {
      showToast('Lỗi: ' + (err.message || ''), 'error');
    }
  };

  // Danh sách học sinh sau khi lọc tìm kiếm
  const filteredStudentRows = useMemo(() => {
    const list = Object.values(attendanceData);
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
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

  // Thống kê tổng quan cả năm (Dành cho chế độ Điểm danh sau)
  const fullYearStats = useMemo(() => {
    const all = Object.values(attendanceData);
    const totalStudents = all.length;
    const absentStudents = all.filter((r) => r.absentCount > 0).length;
    const fullAttendanceStudents = totalStudents - absentStudents;
    const totalAbsenceDays = all.reduce((sum, r) => sum + r.absentCount, 0);

    return { totalStudents, absentStudents, fullAttendanceStudents, totalAbsenceDays };
  }, [attendanceData]);

  const hasUnsavedChanges = Object.values(attendanceData).some((r) => r.isDirty);

  return (
    <div className="space-y-6 pb-12 font-body max-w-7xl mx-auto animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-lg text-xs font-semibold border ${
            toastMessage.type === 'success'
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
                    : 'Điểm danh sau (Thủ công theo ngày)'}
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
                : 'Xem và tự điền ngày nghỉ cụ thể cho các buổi học đã qua trong năm học.'}
            </p>
          </div>

          {/* Action Buttons & Switch Mode Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút Chuyển Đổi Chế Độ Điểm Danh */}
            {viewMode === 'TODAY' ? (
              <button
                onClick={() => setViewMode('MANUAL')}
                className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Tự điểm danh cho các ngày học trước"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Điểm danh sau</span>
              </button>
            ) : (
              <button
                onClick={() => setViewMode('TODAY')}
                className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Quay lại điểm danh ngày hôm nay"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về điểm danh hôm nay</span>
              </button>
            )}

            <button
              onClick={fetchClassAttendance}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Đang lưu...' : hasUnsavedChanges ? 'Lưu điểm danh' : 'Lưu điểm danh'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAT CARDS CHO CHẾ ĐỘ MẶC ĐỊNH (HÔM NAY) */}
        {/* ========================================================================= */}
        {viewMode === 'TODAY' ? (
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
        ) : (
          /* ========================================================================= */
          /* STAT CARDS CHO CHẾ ĐỘ ĐIỂM DANH SAU (CẢ NĂM) */
          /* ========================================================================= */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-outline-variant/20">
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center font-semibold shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Tổng sĩ số</div>
                <div className="text-base font-bold text-on-surface mt-0.5">{fullYearStats.totalStudents} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container text-emerald-700 flex items-center justify-center font-semibold shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Chuyên cần 100%</div>
                <div className="text-base font-bold text-emerald-800 mt-0.5">{fullYearStats.fullAttendanceStudents} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container text-amber-700 flex items-center justify-center font-semibold shrink-0">
                <UserX className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Có vắng mặt</div>
                <div className="text-base font-bold text-on-surface mt-0.5">{fullYearStats.absentStudents} <span className="text-xs font-normal text-outline">em</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center font-semibold shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-on-surface-variant font-medium">Tổng ngày vắng</div>
                <div className="text-base font-bold text-on-surface mt-0.5">{fullYearStats.totalAbsenceDays} <span className="text-xs font-normal text-outline">buổi</span></div>
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
              <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface font-semibold">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 sm:w-12 border-r border-outline-variant/20 text-[11px] sm:text-xs">
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

              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest">
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
                        className={`hover:bg-surface-container-low/40 transition-colors ${
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
                        <td className="py-2.5 px-2 text-center font-medium text-outline border-r border-outline-variant/20 text-[11px] sm:text-xs">
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
                                  : 'bg-white hover:bg-surface-container-low text-transparent border border-outline-variant/40 hover:border-primary/40'
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
      {/* 2. GIAO DIỆN "ĐIỂM DANH SAU": THỦ CÔNG ĐẦY ĐỦ TỪNG NGÀY & GHI CHÚ NHƯ CŨ */}
      {/* ========================================================================= */}
      {viewMode === 'MANUAL' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
          <div className="overflow-x-auto relative max-h-[72vh]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-30 bg-surface-container-low border-b border-outline-variant/30 text-on-surface font-semibold">
                <tr>
                  <th className="p-3 text-center w-12 sticky left-0 bg-surface-container-low z-40 border-r border-outline-variant/20">
                    STT
                  </th>
                  <th className="p-3 min-w-[220px] sticky left-12 bg-surface-container-low z-40 border-r border-outline-variant/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    TÊN THÁNH &amp; HỌ VÀ TÊN
                  </th>
                  <th className="p-3 text-center w-24">
                    GIỚI TÍNH
                  </th>
                  <th className="p-3 text-center w-36">
                    SỐ NGÀY NGHỈ
                  </th>
                  <th className="p-3 min-w-[360px]">
                    CHI TIẾT CÁC NGÀY NGHỈ (NGÀY, LOẠI PHÉP &amp; GHI CHÚ)
                  </th>
                  <th className="p-3 text-center w-24">
                    THAO TÁC
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/20 bg-surface-container-lowest">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải danh sách học sinh &amp; dữ liệu điểm danh...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudentRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-on-surface-variant text-xs">
                      Không tìm thấy học sinh nào phù hợp với từ khóa &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredStudentRows.map((row, idx) => {
                    const isFemale = row.gender === 'Nữ';

                    return (
                      <tr
                        key={row.studentId}
                        className={`hover:bg-surface-container-low/40 transition-colors ${
                          row.isDirty ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Column 1: STT */}
                        <td className="p-3 text-center font-medium text-outline sticky left-0 bg-surface-container-lowest group-hover:bg-surface-container-low/40 z-20 border-r border-outline-variant/20">
                          {idx + 1}
                        </td>

                        {/* Column 2: Tên Thánh & Họ Và Tên */}
                        <td className="p-3 sticky left-12 bg-surface-container-lowest group-hover:bg-surface-container-low/40 z-20 border-r border-outline-variant/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          <div className="flex items-center space-x-2.5">
                            <GenderAvatar
                              gender={row.gender}
                              className="w-8 h-8 rounded-full ring-1 ring-outline-variant/30 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-on-surface text-xs leading-snug">
                                <span className="text-primary font-bold">{row.holyName}</span> {row.fullName}
                              </div>
                              <div className="text-[10px] text-outline font-mono">
                                #{row.code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Giới tính */}
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              isFemale
                                ? 'bg-rose-50/70 text-rose-700 border-rose-200/60'
                                : 'bg-sky-50/70 text-sky-700 border-sky-200/60'
                            }`}
                          >
                            {row.gender}
                          </span>
                        </td>

                        {/* Column 4: Số ngày nghỉ */}
                        <td className="p-3 text-center">
                          <select
                            value={row.absentCount}
                            onChange={(e) => handleAbsentCountChange(row.studentId, parseInt(e.target.value, 10))}
                            aria-label={`Số ngày nghỉ của em ${row.holyName} ${row.fullName}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-low border border-outline-variant/30 text-on-surface outline-none cursor-pointer hover:border-primary/40 focus:border-primary transition-colors"
                          >
                            {[...Array(16)].map((_, i) => (
                              <option key={i} value={i}>
                                {i === 0 ? '0 ngày (Đi đủ)' : `${i} ngày nghỉ`}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Column 5: Chi tiết các ngày nghỉ */}
                        <td className="p-3">
                          {row.absentCount === 0 ? (
                            <div className="text-on-surface-variant text-xs py-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-emerald-700 font-medium">Đi học đầy đủ</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {row.absences.map((abs, absIdx) => (
                                <div
                                  key={absIdx}
                                  className="p-2 rounded-lg bg-surface-container-low/70 border border-outline-variant/25 flex flex-wrap items-center gap-2 text-xs"
                                >
                                  <span className="font-semibold text-outline text-[11px] w-5 text-center shrink-0">
                                    #{absIdx + 1}
                                  </span>

                                  {/* Ngày vắng */}
                                  <input
                                    type="date"
                                    value={abs.date}
                                    onChange={(e) =>
                                      handleAbsenceDetailChange(row.studentId, absIdx, 'date', e.target.value)
                                    }
                                    className="bg-surface-container-lowest px-2 py-1 rounded-md border border-outline-variant/30 text-xs text-on-surface outline-none focus:border-primary/60"
                                  />

                                  {/* Phân loại phép / không phép */}
                                  <select
                                    value={abs.status}
                                    onChange={(e) =>
                                      handleAbsenceDetailChange(row.studentId, absIdx, 'status', e.target.value)
                                    }
                                    className={`px-2 py-1 rounded-md text-xs font-medium border outline-none cursor-pointer ${
                                      abs.status === 'VANG_CO_PHEP'
                                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                                        : 'bg-rose-50 text-rose-900 border-rose-200'
                                    }`}
                                  >
                                    <option value="VANG_CO_PHEP">Có phép</option>
                                    <option value="VANG_KHONG_PHEP">Không phép</option>
                                  </select>

                                  {/* Ghi chú lý do */}
                                  <input
                                    type="text"
                                    value={abs.notes || ''}
                                    onChange={(e) =>
                                      handleAbsenceDetailChange(row.studentId, absIdx, 'notes', e.target.value)
                                    }
                                    placeholder="Lý do nghỉ..."
                                    className="flex-1 min-w-[130px] bg-surface-container-lowest px-2 py-1 rounded-md border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary/60"
                                  />

                                  {/* Nút xóa ngày nghỉ này */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAbsence(row.studentId, absIdx)}
                                    title="Xóa ngày nghỉ này"
                                    className="p-1 rounded text-outline hover:text-customError hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => handleAddAbsenceQuick(row.studentId)}
                                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Thêm ngày nghỉ</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Column 6: Thao tác / Lưu riêng */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSaveSingle(row.studentId)}
                            disabled={!row.isDirty}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              row.isDirty
                                ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-2xs'
                                : 'bg-surface-container-low text-outline cursor-default opacity-50'
                            }`}
                          >
                            {row.isDirty ? 'Lưu' : 'Đã lưu'}
                          </button>
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
    </div>
  );
};

