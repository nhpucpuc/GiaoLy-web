import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  School,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { GenderAvatar } from '../shared/GenderAvatar';

export const DeletedStudentsView: React.FC = () => {
  const { classes, refreshData } = useApp();

  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'HAS_GRADES' | 'NO_GRADES'>('ALL');

  // Modal States
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [restoringStudent, setRestoringStudent] = useState<Student | null>(null);
  const [permanentDeletingStudent, setPermanentDeletingStudent] = useState<Student | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch deleted students
  const fetchDeletedStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDeletedStudents();
      setDeletedStudents(data || []);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách học sinh đã xóa:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Không thể tải danh sách học sinh trong thùng rác.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedStudents();
  }, []);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return deletedStudents.filter((student) => {
      // 1. Search text
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        student.fullName?.toLowerCase().includes(term) ||
        student.holyName?.toLowerCase().includes(term) ||
        student.code?.toLowerCase().includes(term) ||
        student.parentPhone?.includes(term) ||
        student.parentName?.toLowerCase().includes(term);

      // 2. Filter class
      const matchClass =
        selectedClassFilter === 'ALL' || student.classId === selectedClassFilter;

      // 3. Filter grades
      const hasGrades =
        student.grades &&
        student.grades.some(
          (g: any) =>
            g.hk1_tx1 !== null ||
            g.hk1_tx2 !== null ||
            g.hk1_thi !== null ||
            g.hk2_tx1 !== null ||
            g.hk2_tx2 !== null ||
            g.hk2_thi !== null ||
            g.tb_cn !== null
        );

      const matchGrade =
        gradeFilter === 'ALL' ||
        (gradeFilter === 'HAS_GRADES' && hasGrades) ||
        (gradeFilter === 'NO_GRADES' && !hasGrades);

      return matchSearch && matchClass && matchGrade;
    });
  }, [deletedStudents, searchTerm, selectedClassFilter, gradeFilter]);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không xác định';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!restoringStudent) return;
    setIsActionLoading(true);
    try {
      await api.restoreStudent(restoringStudent.id);
      setNotification({
        type: 'success',
        message: `Đã khôi phục thành công học sinh ${restoringStudent.holyName} ${restoringStudent.fullName}! Toàn bộ điểm và điểm danh đã trở lại bình thường.`,
      });
      setRestoringStudent(null);
      await fetchDeletedStudents();
      await refreshData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi khôi phục học sinh.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeletingStudent) return;
    setIsActionLoading(true);
    try {
      await api.permanentDeleteStudent(permanentDeletingStudent.id);
      setNotification({
        type: 'success',
        message: `Đã xóa vĩnh viễn học sinh ${permanentDeletingStudent.holyName} ${permanentDeletingStudent.fullName} và toàn bộ dữ liệu khỏi CSDL.`,
      });
      setPermanentDeletingStudent(null);
      await fetchDeletedStudents();
      await refreshData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi xóa vĩnh viễn học sinh.',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner shrink-0">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-on-surface font-sans">
                  Thùng rác & Học sinh đã xóa
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full">
                  {deletedStudents.length} học sinh
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                Kiểm soát các học sinh đã bị xóa mềm. Tất cả bảng điểm & lịch sử điểm danh vẫn được bảo lưu an toàn.
              </p>
            </div>
          </div>

          <button
            onClick={fetchDeletedStudents}
            disabled={isLoading}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-all active:scale-95 shrink-0"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải lại dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Tìm theo Tên Thánh, Họ Tên, Mã HS, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-surface border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Lọc theo lớp */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
          >
            <option value="ALL">Tất cả lớp học</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.category})
              </option>
            ))}
          </select>

          {/* Lọc theo bảng điểm */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as any)}
            className="px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
          >
            <option value="ALL">Tất cả trạng thái điểm</option>
            <option value="HAS_GRADES">Đã có điểm số</option>
            <option value="NO_GRADES">Chưa có điểm</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-surface-container-low rounded-3xl p-12 border border-outline-variant/30 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant">
            Đang tải dữ liệu học sinh trong thùng rác...
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-surface-container-low rounded-3xl p-12 border border-outline-variant/30 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-on-surface">
            {deletedStudents.length === 0
              ? 'Thùng rác trống!'
              : 'Không tìm thấy học sinh nào phù hợp'}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md">
            {deletedStudents.length === 0
              ? 'Hiện tại không có học sinh nào bị xóa trong hệ thống.'
              : 'Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-3xl border border-outline-variant/30 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container/60 border-b border-outline-variant/30 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="py-4 px-4 sm:px-6">Học sinh & Mã số</th>
                  <th className="py-4 px-4">Lớp học</th>
                  <th className="py-4 px-4">Thời gian xóa</th>
                  <th className="py-4 px-4">Dữ liệu bảo lưu</th>
                  <th className="py-4 px-4">Phụ huynh</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredStudents.map((student) => {
                  const gradeRecord = student.grades?.[0];
                  const hasGrade =
                    gradeRecord &&
                    (gradeRecord.hk1_tx1 !== null ||
                      gradeRecord.hk1_thi !== null ||
                      gradeRecord.hk2_thi !== null ||
                      gradeRecord.tb_cn !== null);
                  const attendanceCount = student.attendance?.length || 0;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-surface-container/40 transition-colors"
                    >
                      {/* 1. Học sinh & Mã số */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <GenderAvatar
                            gender={student.gender}
                            className="w-10 h-10 rounded-full shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-primary text-xs">
                                {student.holyName}
                              </span>
                              <span className="font-bold text-on-surface">
                                {student.fullName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {student.code ? (
                                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 bg-surface-container-high rounded text-on-surface-variant">
                                  #{student.code}
                                </span>
                              ) : null}
                              <span className="text-[11px] text-on-surface-variant">
                                {student.gender} • {student.dob}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Lớp học */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1.5">
                          <School className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-semibold text-on-surface">
                            {student.class?.name || student.className || 'Chưa xếp lớp'}
                          </span>
                        </div>
                        {student.class?.category && (
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            Ngành: {student.class.category}
                          </span>
                        )}
                      </td>

                      {/* 3. Thời gian xóa */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-medium text-xs">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatDate(student.deletedAt)}</span>
                        </div>
                      </td>

                      {/* 4. Dữ liệu bảo lưu (Điểm & Điểm danh) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                hasGrade
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>
                                {hasGrade
                                  ? `Có điểm (ĐTB: ${gradeRecord?.tb_cn ?? 'Chưa tính'})`
                                  : 'Chưa có điểm'}
                              </span>
                            </span>
                          </div>

                          {attendanceCount > 0 && (
                            <span className="text-[11px] text-on-surface-variant">
                              • {attendanceCount} buổi ghi nhận điểm danh
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Phụ huynh */}
                      <td className="py-4 px-4">
                        <div className="text-xs">
                          <p className="font-medium text-on-surface">
                            {student.parentName || 'Không có tên PH'}
                          </p>
                          {student.parentPhone ? (
                            <a
                              href={`tel:${student.parentPhone}`}
                              className="text-primary hover:underline flex items-center space-x-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{student.parentPhone}</span>
                            </a>
                          ) : (
                            <span className="text-on-surface-variant/60">Chưa có SĐT</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Thao tác */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Nút xem chi tiết điểm / hồ sơ */}
                          <button
                            onClick={() => setSelectedStudentDetail(student)}
                            className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                            title="Xem chi tiết hồ sơ & bảng điểm"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Nút Khôi phục */}
                          <button
                            onClick={() => setRestoringStudent(student)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                            title="Khôi phục học sinh trở lại lớp"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Khôi phục</span>
                          </button>

                          {/* Nút Xóa vĩnh viễn */}
                          <button
                            onClick={() => setPermanentDeletingStudent(student)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
                            title="Xóa vĩnh viễn khỏi CSDL"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Xóa hẳn</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: XEM CHI TIẾT HỒ SƠ & BẢNG ĐIỂM BẢO LƯU */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-outline-variant/30 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <div className="flex items-center space-x-3">
                <GenderAvatar
                  gender={selectedStudentDetail.gender}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-lg font-bold text-on-surface font-sans flex items-center space-x-2">
                    <span className="text-primary">{selectedStudentDetail.holyName}</span>
                    <span>{selectedStudentDetail.fullName}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Mã HS: #{selectedStudentDetail.code || 'N/A'} • Lớp:{' '}
                    {selectedStudentDetail.class?.name || selectedStudentDetail.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin Bí tích & Gia đình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
              <div>
                <span className="text-xs text-on-surface-variant font-medium block">Ngày sinh:</span>
                <span className="font-semibold text-on-surface">{selectedStudentDetail.dob}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-medium block">Địa chỉ:</span>
                <span className="font-semibold text-on-surface">{selectedStudentDetail.address}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-medium block">Phụ huynh:</span>
                <span className="font-semibold text-on-surface">{selectedStudentDetail.parentName} ({selectedStudentDetail.parentPhone})</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-medium block">Giáo khu:</span>
                <span className="font-semibold text-on-surface">{selectedStudentDetail.parishSubdivision || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {/* Bảng điểm chi tiết được bảo lưu */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-on-surface flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Bảng điểm bảo lưu trong hệ thống:</span>
              </h4>

              {selectedStudentDetail.grades && selectedStudentDetail.grades.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
                  <table className="w-full text-xs text-center">
                    <thead className="bg-surface-container font-bold text-on-surface-variant uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Niên khóa</th>
                        <th className="py-2.5 px-2">HK1 TX1</th>
                        <th className="py-2.5 px-2">HK1 TX2</th>
                        <th className="py-2.5 px-2">HK1 Thi</th>
                        <th className="py-2.5 px-2">HK2 TX1</th>
                        <th className="py-2.5 px-2">HK2 TX2</th>
                        <th className="py-2.5 px-2">HK2 Thi</th>
                        <th className="py-2.5 px-3 font-extrabold text-primary">ĐTB Cả năm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 bg-surface">
                      {selectedStudentDetail.grades.map((g: any, idx: number) => (
                        <tr key={idx} className="font-semibold text-on-surface">
                          <td className="py-3 px-3 font-medium text-left">{g.academicYear || '2026 - 2027'}</td>
                          <td className="py-3 px-2">{g.hk1_tx1 ?? '-'}</td>
                          <td className="py-3 px-2">{g.hk1_tx2 ?? '-'}</td>
                          <td className="py-3 px-2 text-primary">{g.hk1_thi ?? '-'}</td>
                          <td className="py-3 px-2">{g.hk2_tx1 ?? '-'}</td>
                          <td className="py-3 px-2">{g.hk2_tx2 ?? '-'}</td>
                          <td className="py-3 px-2 text-primary">{g.hk2_thi ?? '-'}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                            {g.tb_cn ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic">Học sinh chưa có bản ghi điểm nào.</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant/30 space-x-3">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XÁC NHẬN KHÔI PHỤC (RESTORE) */}
      {restoringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-outline-variant/30 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-on-surface font-sans">
                Khôi phục học sinh?
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Bạn có chắc chắn muốn khôi phục học sinh{' '}
                <strong className="text-on-surface">
                  {restoringStudent.holyName} {restoringStudent.fullName}
                </strong>{' '}
                trở lại lớp{' '}
                <strong className="text-primary">
                  {restoringStudent.class?.name || restoringStudent.className}
                </strong>
                ? Toàn bộ điểm số & điểm danh sẽ được giữ nguyên 100%.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setRestoringStudent(null)}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors w-full cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-95 w-full flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Xác nhận</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CẢNH BÁO XÓA VĨNH VIỄN (PERMANENT DELETE) */}
      {permanentDeletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-rose-500/30 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 font-sans">
                XÓA VĨNH VIỄN KHỎI CSDL?
              </h3>
              <div className="p-3 bg-rose-500/10 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium text-left space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Cảnh báo nguy hiểm:</span>
                </p>
                <p>
                  Thao tác này sẽ xóa vĩnh viễn học sinh{' '}
                  <strong>
                    {permanentDeletingStudent.holyName} {permanentDeletingStudent.fullName}
                  </strong>{' '}
                  cùng toàn bộ <strong>Bảng điểm</strong> và <strong>Lịch sử điểm danh</strong> khỏi cơ sở dữ liệu.
                </p>
                <p className="font-bold text-rose-600 dark:text-rose-400 underline">
                  Hành động này KHÔNG THỂ HOÀN TÁC!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setPermanentDeletingStudent(null)}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors w-full cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all active:scale-95 w-full flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
