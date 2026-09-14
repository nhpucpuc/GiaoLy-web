import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  School,
  Phone,
  Edit2,
  X,
  Save,
  CheckCircle2,
  Calendar,
  Heart,
  MapPin,
  Flame,
  BookOpen,
  FileSpreadsheet,
  Trash2,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { StudentTranscriptModal } from '../shared/StudentTranscriptModal';
import { exportClassRosterToExcel } from '../../utils/excelExport';
import { formatToDDMMYYYY } from '../../utils/dateUtils';
import { sortStudentsByVietnameseName } from '../../utils/nameUtils';

type EditFieldType =
  | 'NAME'
  | 'DOB_POB'
  | 'ADDRESS'
  | 'PARISH_SUB'
  | 'PHONE'
  | 'BAPTISM'
  | 'EUCHARIST'
  | 'CONFIRMATION'
  | 'SOLEMN'
  | 'FATHER'
  | 'MOTHER'
  | 'NOTE';

export const GlobalStudentSearchView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const [localSearchInput, setLocalSearchInput] = useState(qParam);

  const {
    students,
    classes,
    grades,
    updateStudent,
    deleteStudent,
    updateStudentNote
  } = useApp();

  // Đồng bộ search input khi param thay đổi
  React.useEffect(() => {
    setLocalSearchInput(qParam);
  }, [qParam]);

  // Lọc học sinh theo từ khóa họ và tên trong toàn bộ database
  const searchResults = useMemo(() => {
    if (!qParam.trim()) return [];
    const term = qParam.toLowerCase().trim();

    const matched = students.filter((s) => {
      const full = (s.fullName || '').toLowerCase();
      const holy = (s.holyName || '').toLowerCase();
      const code = (s.code || '').toLowerCase();
      return full.includes(term) || holy.includes(term) || code.includes(term);
    });

    return sortStudentsByVietnameseName(matched);
  }, [students, qParam]);

  // State Modal chỉnh sửa học sinh
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editField, setEditField] = useState<EditFieldType>('NAME');
  const [formData, setFormData] = useState<Partial<Student>>({});

  // State Modal Xem Học Bạ
  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState<Student | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit form tìm kiếm tại chỗ
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchInput.trim()) {
      setSearchParams({ q: localSearchInput.trim() });
    }
  };

  // Mở modal chỉnh sửa đúng trường được chọn
  const handleOpenEdit = (s: Student, field: EditFieldType) => {
    setEditingStudent(s);
    setEditField(field);
    setFormData({ ...s });
  };

  // Lưu thay đổi học sinh
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updated: Student = {
      ...editingStudent,
      ...formData,
      fullName: formData.fullName || editingStudent.fullName,
      holyName: formData.holyName || editingStudent.holyName,
      gender: (formData.gender as 'Nam' | 'Nữ') || editingStudent.gender,
      dob: formatToDDMMYYYY(formData.dob) || editingStudent.dob,
      baptismDate: formatToDDMMYYYY(formData.baptismDate),
      eucharistDate: formatToDDMMYYYY(formData.eucharistDate),
      confirmationDate: formatToDDMMYYYY(formData.confirmationDate),
      solemnCommunionDate: formatToDDMMYYYY(formData.solemnCommunionDate),
    };

    updateStudent(updated);
    if (editField === 'NOTE' && formData.notes !== undefined) {
      updateStudentNote(editingStudent.id, formData.notes);
    }

    setEditingStudent(null);
    showToast(`Đã cập nhật thông tin em ${updated.holyName} ${updated.fullName} thành công!`);
  };

  // Xóa học sinh (Chuyển vào thùng rác)
  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn chuyển học sinh "${editingStudent.holyName} ${editingStudent.fullName}" vào thùng rác không? Toàn bộ điểm số & điểm danh vẫn được bảo lưu an toàn.`
    );
    if (!isConfirmed) return;

    try {
      await deleteStudent(editingStudent.id);
      setEditingStudent(null);
      showToast(`Đã chuyển học sinh ${editingStudent.holyName} ${editingStudent.fullName} vào thùng rác thành công!`);
    } catch (err: any) {
      alert('Lỗi khi xóa học sinh: ' + (err.message || 'Không thể thực hiện!'));
    }
  };

  return (
    <div className="space-y-6 pb-12 font-body max-w-[100vw] overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-lowest text-on-surface px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-2.5 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs border border-primary/20 flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                <span>Tìm kiếm toàn cơ sở dữ liệu</span>
              </span>
              <span className="text-xs text-outline">• Toàn bộ các lớp</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface font-sans flex items-center gap-2">
              <span>Kết Quả Tìm Kiếm Học Sinh</span>
            </h1>
            <p className="text-xs text-on-surface-variant">
              Từ khóa tìm kiếm: <strong className="text-primary font-bold">&quot;{qParam || '...'}&quot;</strong> — Tìm thấy{' '}
              <strong className="text-primary font-bold">{searchResults.length}</strong> học sinh phù hợp.
            </p>
          </div>

          {/* Search bar & Export */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <input
                type="text"
                value={localSearchInput}
                onChange={(e) => setLocalSearchInput(e.target.value)}
                placeholder="Nhập tên học sinh cần tìm..."
                className="w-full bg-surface-container-low pl-9 pr-8 py-2 rounded-xl text-xs border border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {localSearchInput && (
                <button
                  type="button"
                  onClick={() => setLocalSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              onClick={() =>
                exportClassRosterToExcel(
                  { name: `KetQuaTimKiem_${qParam || 'TatCa'}`, id: 'search', category: 'KHAI_TAM' as any, catechistLeader: 'Admin' } as any,
                  searchResults,
                  'Ban Giáo Lý'
                )
              }
              disabled={searchResults.length === 0}
              className="px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-low text-on-surface-variant text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Xuất kết quả tìm kiếm ra file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Table: Form Lý Lịch Học Sinh (Thêm Cột Lớp sau Cột Ngày Sinh) */}
      <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto relative max-h-[72vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-30 bg-surface-container text-on-surface uppercase text-[11px] font-bold shadow-xs select-none">
              <tr>
                {/* 1. STT */}
                <th
                  style={{ width: '52px', minWidth: '52px', maxWidth: '52px', left: 0 }}
                  className="py-2.5 px-2 text-center sticky z-40 bg-surface-container border-b border-r border-outline-variant/40"
                >
                  STT
                </th>

                {/* 2. TÊN THÁNH & HỌ VÀ TÊN */}
                <th
                  style={{ width: '230px', minWidth: '230px', maxWidth: '230px', left: '52px' }}
                  className="py-2.5 px-3.5 sticky z-40 bg-surface-container border-b border-r-2 border-outline-variant/60 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]"
                >
                  Tên Thánh & Họ và Tên
                </th>

                {/* 3. GIỚI TÍNH */}
                <th className="py-2.5 px-3 min-w-[85px] text-center border-b border-outline-variant/30">Giới Tính</th>

                {/* 4. NGÀY SINH & NƠI SINH */}
                <th className="py-2.5 px-3 min-w-[150px] border-b border-outline-variant/30">Ngày & Nơi Sinh</th>

                {/* 5. CỘT LỚP (MỚI: Thêm ngay sau cột Ngày & Nơi sinh để phân biệt học sinh thuộc lớp nào) */}
                <th className="py-2.5 px-3 min-w-[150px] text-center border-b border-outline-variant/30 bg-primary/5 text-primary">
                  Lớp Giáo Lý
                </th>

                {/* 6. CHỖ Ở HIỆN TẠI */}
                <th className="py-2.5 px-3 min-w-[220px] border-b border-outline-variant/30">Chỗ Ở Hiện Tại</th>

                {/* 7. GIÁO KHU / GIÁO HỌ */}
                <th className="py-2.5 px-3 min-w-[130px] border-b border-outline-variant/30">Giáo Khu</th>

                {/* 8. SỐ ĐIỆN THOẠI */}
                <th className="py-2.5 px-3 min-w-[130px] border-b border-outline-variant/30">SĐT Liên Lạc</th>

                {/* 9. RỬA TỘI */}
                <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Rửa Tội</th>

                {/* 10. RƯỚC LỄ LẦN ĐẦU */}
                <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Lần Đầu</th>

                {/* 11. THÊM SỨC */}
                <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Thêm Sức</th>

                {/* 12. BAO ĐỒNG */}
                <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Bao Đồng</th>

                {/* 13. THÔNG TIN CHA */}
                <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Cha</th>

                {/* 14. THÔNG TIN MẸ */}
                <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Mẹ</th>

                {/* 15. ĐIỂM TB */}
                <th className="py-2.5 px-3 min-w-[85px] text-center border-b border-outline-variant/30">Điểm TB</th>

                {/* 16. GHI CHÚ GLV */}
                <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Ghi Chú GLV</th>

                {/* 17. HỌC BẠ */}
                <th className="py-2.5 px-3 min-w-[95px] text-center border-b border-outline-variant/30">Học Bạ</th>
              </tr>
            </thead>

            <tbody className="font-body">
              {searchResults.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-16 text-center text-on-surface-variant text-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-sm text-on-surface">Không tìm thấy học sinh phù hợp</div>
                      <p className="text-outline text-xs">
                        Không có học sinh nào khớp với từ khóa &quot;{qParam}&quot;. Vui lòng thử tìm với từ khóa họ hoặc tên khác.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                searchResults.map((s, index) => {
                  const grade = grades.find((g) => g.studentId === s.id);
                  const currentNote = grade?.notes || s.notes || 'Bình thường';
                  const studentClass = classes.find((c) => c.id === s.classId);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-primary-container/10 transition-colors group"
                    >
                      {/* 1. STT */}
                      <td
                        style={{ width: '52px', minWidth: '52px', maxWidth: '52px', left: 0 }}
                        className="py-2.5 px-2 text-center font-bold text-outline sticky z-20 bg-surface group-hover:bg-surface-container-low border-b border-r border-outline-variant/30"
                      >
                        {index + 1}
                      </td>

                      {/* 2. TÊN THÁNH & HỌ VÀ TÊN */}
                      <td
                        style={{ width: '230px', minWidth: '230px', maxWidth: '230px', left: '52px' }}
                        className="py-2.5 px-3.5 sticky z-20 bg-surface group-hover:bg-surface-container-low border-b border-r-2 border-outline-variant/60 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-extrabold text-primary">{s.holyName}</span>
                              <span className="font-bold text-on-surface">{s.fullName}</span>
                            </div>
                            {s.code && (
                              <div className="mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[9px] font-extrabold border border-primary/20">
                                  #{s.code}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenEdit(s, 'NAME')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded-lg transition-all cursor-pointer opacity-70 group-hover:opacity-100 shrink-0"
                            title="Sửa Tên Thánh, Họ và Tên, Giới tính"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 3. GIỚI TÍNH */}
                      <td className="py-2.5 px-3 text-center border-b border-outline-variant/20">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.gender === 'Nam'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.gender || 'Nam'}
                        </span>
                      </td>

                      {/* 4. NGÀY & NƠI SINH */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">{s.dob || '—'}</div>
                            {s.pob && <div className="text-[10px] text-outline truncate max-w-[120px]">Nơi sinh: {s.pob}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'DOB_POB')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Ngày sinh & Nơi sinh"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 5. CỘT LỚP (MỚI: Thêm ngay sau cột Ngày sinh để phân biệt học sinh thuộc lớp nào) */}
                      <td className="py-2.5 px-3 text-center border-b border-outline-variant/20 bg-primary/5">
                        {studentClass ? (
                          <Link
                            to={`/admin/class-detail?classId=${studentClass.id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest hover:bg-primary/10 text-primary font-bold text-xs border border-primary/30 transition-all shadow-2xs"
                            title={`Nhấn để chuyển tới chi tiết lớp ${studentClass.name}`}
                          >
                            <School className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{studentClass.name}</span>
                          </Link>
                        ) : (
                          <span className="text-outline text-xs italic">Chưa xếp lớp</span>
                        )}
                      </td>

                      {/* 6. CHỖ Ở HIỆN TẠI */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-on-surface-variant text-[11px] truncate max-w-[180px]" title={s.address}>
                            {s.address || '—'}
                          </span>
                          <button
                            onClick={() => handleOpenEdit(s, 'ADDRESS')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Chỗ ở hiện tại"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 7. GIÁO KHU / GIÁO HỌ */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-semibold text-primary text-[11px] truncate max-w-[120px]">
                            {s.parishSubdivision || '—'}
                          </span>
                          <button
                            onClick={() => handleOpenEdit(s, 'PARISH_SUB')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Giáo Khu / Giáo Họ"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 8. SỐ ĐIỆN THOẠI */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            {s.parentPhone ? (
                              <a
                                href={`tel:${s.parentPhone}`}
                                className="font-bold text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-outline" />
                                {s.parentPhone}
                              </a>
                            ) : (
                              <span className="text-outline text-xs">—</span>
                            )}
                            {s.parentName && <div className="text-[10px] text-outline">PH: {s.parentName}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'PHONE')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Số điện thoại & Tên phụ huynh"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 9. RỬA TỘI */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">{s.baptismDate || '—'}</div>
                            {s.baptismPlace && <div className="text-[10px] text-outline truncate max-w-[140px]">{s.baptismPlace}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'BAPTISM')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Bí tích Rửa tội"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 10. RƯỚC LỄ LẦN ĐẦU */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">{s.eucharistDate || '—'}</div>
                            {s.eucharistPlace && <div className="text-[10px] text-outline truncate max-w-[140px]">{s.eucharistPlace}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'EUCHARIST')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Rước Lễ Lần Đầu"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 11. THÊM SỨC */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">{s.confirmationDate || '—'}</div>
                            {s.confirmationPlace && <div className="text-[10px] text-outline truncate max-w-[140px]">{s.confirmationPlace}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'CONFIRMATION')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Bí tích Thêm sức"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 12. BAO ĐỒNG */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">{s.solemnCommunionDate || '—'}</div>
                            {s.solemnCommunionPlace && <div className="text-[10px] text-outline truncate max-w-[140px]">{s.solemnCommunionPlace}</div>}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'SOLEMN')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Rước Lễ Bao Đồng"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 13. THÔNG TIN CHA */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">
                              {s.fatherHolyName && <span className="text-primary font-bold">{s.fatherHolyName} </span>}
                              {s.fatherName || '—'}
                            </div>
                            {s.fatherPhone && (
                              <a href={`tel:${s.fatherPhone}`} className="text-[10px] text-outline hover:text-primary">
                                {s.fatherPhone}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'FATHER')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Thông tin Cha"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 14. THÔNG TIN MẸ */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-medium text-on-surface">
                              {s.motherHolyName && <span className="text-primary font-bold">{s.motherHolyName} </span>}
                              {s.motherName || '—'}
                            </div>
                            {s.motherPhone && (
                              <a href={`tel:${s.motherPhone}`} className="text-[10px] text-outline hover:text-primary">
                                {s.motherPhone}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(s, 'MOTHER')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Thông tin Mẹ"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 15. ĐIỂM TB */}
                      <td className="py-2.5 px-3 text-center border-b border-outline-variant/20">
                        {grade?.tb_cn !== undefined && grade?.tb_cn !== null ? (
                          <span
                            className={`font-black px-2 py-0.5 rounded-md text-xs ${
                              grade.tb_cn >= 8.0
                                ? 'bg-emerald-50 text-emerald-700'
                                : grade.tb_cn >= 6.5
                                ? 'bg-blue-50 text-blue-700'
                                : grade.tb_cn >= 5.0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {grade.tb_cn.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-outline text-xs">—</span>
                        )}
                      </td>

                      {/* 16. GHI CHÚ GLV */}
                      <td className="py-2.5 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-on-surface-variant text-[11px] truncate max-w-[150px]" title={currentNote}>
                            {currentNote}
                          </span>
                          <button
                            onClick={() => handleOpenEdit(s, 'NOTE')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Lời phê / Ghi chú"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 17. HỌC BẠ */}
                      <td className="py-2.5 px-3 text-center border-b border-outline-variant/20">
                        <button
                          onClick={() => setSelectedTranscriptStudent(s)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-primary/10 text-primary font-bold text-xs border border-outline-variant/30 hover:border-primary/40 transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                          title="Xem sổ học bạ & quá trình học"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Chỉnh Sửa Học Sinh Từng Trường */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-2xl max-w-md w-full p-5 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Chỉnh Sửa Thông Tin Học Sinh</h3>
                <p className="text-xs text-primary font-bold">
                  {editingStudent.holyName} {editingStudent.fullName}
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* 1. NAME: Tên Thánh & Họ và Tên */}
              {editField === 'NAME' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <User className="w-4 h-4" />
                    <span>Họ Tên & Giới Tính</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tên Thánh</label>
                    <input
                      type="text"
                      value={formData.holyName || ''}
                      onChange={(e) => setFormData({ ...formData, holyName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-primary outline-none focus:border-primary"
                      placeholder="VD: Maria, Giuse, Phêrô..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Họ và Tên Học Sinh</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Nguyễn Văn An"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Giới Tính</label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="gender"
                          value="Nam"
                          checked={formData.gender !== 'Nữ'}
                          onChange={() => setFormData({ ...formData, gender: 'Nam' })}
                          className="accent-primary"
                        />
                        <span>Nam</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="gender"
                          value="Nữ"
                          checked={formData.gender === 'Nữ'}
                          onChange={() => setFormData({ ...formData, gender: 'Nữ' })}
                          className="accent-primary"
                        />
                        <span>Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DOB_POB: Ngày & Nơi Sinh */}
              {editField === 'DOB_POB' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Ngày Sinh & Nơi Sinh</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Sinh (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      required
                      value={formData.dob || ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, dob: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 15-05-2015"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Nơi Sinh (Bệnh viện / Tỉnh thành)</label>
                    <input
                      type="text"
                      value={formData.pob || ''}
                      onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Hà Nội"
                    />
                  </div>
                </div>
              )}

              {/* 3. ADDRESS: Chỗ Ở Hiện Tại */}
              {editField === 'ADDRESS' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Chỗ Ở Hiện Tại</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Địa chỉ cư trú</label>
                    <textarea
                      rows={3}
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Số 12, Ngõ 45, Đường Sơn Lộc, Sơn Tây, Hà Nội"
                    />
                  </div>
                </div>
              )}

              {/* 4. PARISH_SUB: Giáo Khu */}
              {editField === 'PARISH_SUB' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Giáo Khu / Giáo Họ Trực Thuộc</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tên Giáo Khu / Giáo Họ</label>
                    <input
                      type="text"
                      value={formData.parishSubdivision || ''}
                      onChange={(e) => setFormData({ ...formData, parishSubdivision: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Giáo khu Mẹ Vô Nhiễm"
                    />
                  </div>
                </div>
              )}

              {/* 5. PHONE: Số Điện Thoại & Tên Phụ Huynh */}
              {editField === 'PHONE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Liên Lạc Phụ Huynh</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Họ Tên Phụ Huynh Đại Diện</label>
                    <input
                      type="text"
                      value={formData.parentName || ''}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Nguyễn Văn Nam"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Số Điện Thoại Phụ Huynh</label>
                    <input
                      type="tel"
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 0987654321"
                    />
                  </div>
                </div>
              )}

              {/* 6. BAPTISM: Rửa Tội */}
              {editField === 'BAPTISM' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Bí Tích Rửa Tội</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Rửa Tội (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.baptismDate || ''}
                      onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, baptismDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 20-06-2015"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.baptismPlace || ''}
                      onChange={(e) => setFormData({ ...formData, baptismPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 7. EUCHARIST: Rước Lễ Lần Đầu */}
              {editField === 'EUCHARIST' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bí Tích Thánh Thể (Rước Lễ Lần Đầu)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Rước Lễ (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.eucharistDate || ''}
                      onChange={(e) => setFormData({ ...formData, eucharistDate: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, eucharistDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 10-06-2023"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.eucharistPlace || ''}
                      onChange={(e) => setFormData({ ...formData, eucharistPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 8. CONFIRMATION: Thêm Sức */}
              {editField === 'CONFIRMATION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Flame className="w-4 h-4" />
                    <span>Bí Tích Thêm Sức</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Thêm Sức (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.confirmationDate || ''}
                      onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, confirmationDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 15-08-2025"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.confirmationPlace || ''}
                      onChange={(e) => setFormData({ ...formData, confirmationPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 9. SOLEMN: Rước Lễ Bao Đồng */}
              {editField === 'SOLEMN' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rước Lễ Bao Đồng / Tuyên Hứa</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Bao Đồng (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.solemnCommunionDate || ''}
                      onChange={(e) => setFormData({ ...formData, solemnCommunionDate: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, solemnCommunionDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 30-05-2028"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.solemnCommunionPlace || ''}
                      onChange={(e) => setFormData({ ...formData, solemnCommunionPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 10. FATHER: Thông tin Cha */}
              {editField === 'FATHER' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <User className="w-4 h-4" />
                    <span>Thông Tin Người Cha</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-on-surface mb-1">Tên Thánh Cha</label>
                      <input
                        type="text"
                        value={formData.fatherHolyName || ''}
                        onChange={(e) => setFormData({ ...formData, fatherHolyName: e.target.value })}
                        placeholder="VD: Giuse"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-bold text-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-1">Họ và Tên Cha</label>
                      <input
                        type="text"
                        value={formData.fatherName || ''}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="Họ và tên Cha"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Số Điện Thoại Cha</label>
                    <input
                      type="tel"
                      value={formData.fatherPhone || ''}
                      onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                      placeholder="Số điện thoại Cha"
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 11. MOTHER: Thông tin Mẹ */}
              {editField === 'MOTHER' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <User className="w-4 h-4" />
                    <span>Thông Tin Người Mẹ</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-on-surface mb-1">Tên Thánh Mẹ</label>
                      <input
                        type="text"
                        value={formData.motherHolyName || ''}
                        onChange={(e) => setFormData({ ...formData, motherHolyName: e.target.value })}
                        placeholder="VD: Maria"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-bold text-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-1">Họ và Tên Mẹ</label>
                      <input
                        type="text"
                        value={formData.motherName || ''}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        placeholder="Họ và tên Mẹ"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Số Điện Thoại Mẹ</label>
                    <input
                      type="tel"
                      value={formData.motherPhone || ''}
                      onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                      placeholder="Số điện thoại Mẹ"
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* 12. NOTE: Lời Phê / Ghi Chú GLV */}
              {editField === 'NOTE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Edit2 className="w-4 h-4" />
                    <span>Ghi Chú & Lời Phê Của Giáo Lý Viên</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Nội dung ghi chú</label>
                    <textarea
                      rows={4}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Ngoan ngoãn, đi lễ chuyên cần, tích cực phát biểu..."
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa học sinh</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant font-semibold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Học Bạ Chi Tiết */}
      {selectedTranscriptStudent && (
        <StudentTranscriptModal
          student={selectedTranscriptStudent}
          isOpen={!!selectedTranscriptStudent}
          onClose={() => setSelectedTranscriptStudent(null)}
        />
      )}
    </div>
  );
};
