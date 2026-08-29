import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  TableProperties,
  Search,
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
  UserPlus,
  School,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { GradeEntryView } from '../catechist/GradeEntryView';
import { StudentTranscriptModal } from '../shared/StudentTranscriptModal';
import { exportClassRosterToExcel } from '../../utils/excelExport';

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

export const ClassDetailView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId') || searchParams.get('id');

  const {
    classes,
    selectedClassId,
    setSelectedClassId,
    students,
    grades,
    catechists,
    updateStudent,
    deleteStudent,
    updateStudentNote
  } = useApp();

  // Tab active: 'PROFILE' (Lý Lịch) | 'GRADES' (Bảng Điểm)
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'GRADES'>('PROFILE');

  // Lấy lớp hiện tại theo Query Param -> selectedClassId -> lớp đầu tiên
  const currentClass = useMemo(() => {
    if (classes.length === 0) return null;
    if (classIdParam) {
      const match = classes.find((c) => c.id === classIdParam);
      if (match) return match;
    }
    if (selectedClassId) {
      const match = classes.find((c) => c.id === selectedClassId);
      if (match) return match;
    }
    return classes[0] || null;
  }, [classes, classIdParam, selectedClassId]);

  // Đồng bộ URL query param & Context state khi lớp thay đổi
  useEffect(() => {
    if (currentClass) {
      if (currentClass.id !== selectedClassId) {
        setSelectedClassId(currentClass.id);
      }
      if (classIdParam !== currentClass.id) {
        setSearchParams({ classId: currentClass.id }, { replace: true });
      }
    }
  }, [currentClass?.id]);

  const classStudents = currentClass
    ? students.filter((s) => s.classId === currentClass.id)
    : [];

  // Tìm kiếm nhanh trong tab Lý Lịch
  const [searchTerm, setSearchTerm] = useState('');

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
      gender: (formData.gender as 'Nam' | 'Nữ') || editingStudent.gender
    };

    updateStudent(updated);
    if (editField === 'NOTE' && formData.notes !== undefined) {
      updateStudentNote(editingStudent.id, formData.notes);
    }

    setEditingStudent(null);
    showToast(`Đã cập nhật thông tin em ${updated.holyName} ${updated.fullName} thành công!`);
  };

  // Xóa học sinh
  const handleDeleteStudent = async () => {
    if (!editingStudent) return;
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa học sinh "${editingStudent.holyName} ${editingStudent.fullName}" không? Dữ liệu điểm và chuyên cần liên quan cũng sẽ bị xóa vĩnh viễn.`
    );
    if (!isConfirmed) return;

    try {
      await deleteStudent(editingStudent.id);
      setEditingStudent(null);
      showToast(`Đã xóa học sinh ${editingStudent.holyName} ${editingStudent.fullName} thành công!`);
    } catch (err: any) {
      alert('Lỗi khi xóa học sinh: ' + (err.message || 'Không thể thực hiện!'));
    }
  };

  // Lọc học sinh theo từ khóa
  const filteredStudents = classStudents.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(term) ||
      s.holyName.toLowerCase().includes(term) ||
      (s.parishSubdivision && s.parishSubdivision.toLowerCase().includes(term)) ||
      (s.parentPhone && s.parentPhone.includes(term)) ||
      (s.code && s.code.includes(term))
    );
  });

  if (!currentClass) {
    return (
      <div className="p-12 text-center bg-surface rounded-2xl border border-outline-variant/30 text-on-surface-variant font-body">
        <h3 className="text-lg font-bold text-on-surface mb-2 font-sans">Chưa có lớp học nào</h3>
        <p className="text-xs">Vui lòng chọn lớp học từ danh sách quản trị.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-95px)] space-y-3 font-body overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md animate-fadeIn shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMPACT INTEGRATED HEADER CARD */}
      <section className="bg-surface rounded-2xl border border-outline-variant/30 px-5 py-3 shadow-xs shrink-0 flex flex-col gap-2.5">
        {/* Row 1: Thông tin Lớp & 2 Nút Thao Tác Cố Định 100% */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-primary font-sans flex items-center gap-2 shrink-0">
                <School className="w-5 h-5 text-primary shrink-0" />
                <span>Lớp {currentClass.name}</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] border border-primary/20 shrink-0">
                Khối {currentClass.category}
              </span>
              <span className="text-on-surface-variant font-medium text-[11px] truncate">
                {currentClass.roomNumber ? (currentClass.roomNumber.toLowerCase().startsWith('phòng') || currentClass.roomNumber.toLowerCase().startsWith('p.') ? currentClass.roomNumber : `Phòng ${currentClass.roomNumber}`) : 'P.01'} • {currentClass.schedule || 'Sáng CN'} • Niên khóa {currentClass.academicYear || '2026 - 2027'}
              </span>
            </div>

            <div className="text-[11px] text-outline font-semibold truncate">
              GLV: <strong className="text-on-surface font-bold">{getFullCatechistNames(currentClass, catechists)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportClassRosterToExcel(currentClass, classStudents, getFullCatechistNames(currentClass, catechists))}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              title="Xuất toàn bộ sơ yếu lý lịch học sinh lớp ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => navigate('/admin/add-student')}
              className="bg-primary text-white hover:bg-primary/90 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Thiếu Nhi</span>
            </button>
          </div>
        </div>

        {/* Row 2: Sub-tabs Switcher + Tìm kiếm nhanh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-outline-variant/20">
          {/* Sub-Tabs Switcher */}
          <div className="flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 gap-1 shadow-2xs w-fit">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PROFILE'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lý Lịch Học Sinh ({classStudents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('GRADES')}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'GRADES'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Bảng Điểm Lớp Học</span>
            </button>
          </div>

          {/* Tìm kiếm nhanh (khi ở Tab Lý Lịch) */}
          {activeTab === 'PROFILE' && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-outline hidden md:inline">
                (Bấm ✏️ ở ô nào để sửa đúng ô đó)
              </span>
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên, tên thánh, giáo khu..."
                  className="w-full pl-8 pr-3 py-1 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-medium"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TAB 1: SƠ YẾU LÝ LỊCH HỌC SINH (BẢNG CUỘN 2 CHIỀU VỪA VẶN MÀN HÌNH) */}
      {activeTab === 'PROFILE' && (
        <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col overflow-hidden animate-fadeIn">
          {/* VÙNG BẢNG CUỘN TỰ DO NGANG VÀ DỌC TRONG KHUNG */}
          <div className="flex-1 overflow-auto bg-surface relative select-text">
            <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-[1750px]">
              {/* Table Header (Sticky Top) */}
              <thead className="sticky top-0 z-30 bg-surface-container text-on-surface uppercase text-[11px] font-bold shadow-xs">
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

                  {/* 5. CHỖ Ở HIỆN TẠI */}
                  <th className="py-2.5 px-3 min-w-[220px] border-b border-outline-variant/30">Chỗ Ở Hiện Tại</th>

                  {/* 6. GIÁO KHU / GIÁO HỌ */}
                  <th className="py-2.5 px-3 min-w-[130px] border-b border-outline-variant/30">Giáo Khu</th>

                  {/* 7. SỐ ĐIỆN THOẠI */}
                  <th className="py-2.5 px-3 min-w-[130px] border-b border-outline-variant/30">SĐT Liên Lạc</th>

                  {/* 8. RỬA TỘI */}
                  <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Rửa Tội</th>

                  {/* 9. RƯỚC LỄ LẦN ĐẦU */}
                  <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Lần Đầu</th>

                  {/* 10. THÊM SỨC */}
                  <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Thêm Sức</th>

                  {/* 11. BAO ĐỒNG */}
                  <th className="py-2.5 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Bao Đồng</th>

                  {/* 12. THÔNG TIN CHA */}
                  <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Cha</th>

                  {/* 13. THÔNG TIN MẸ */}
                  <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Mẹ</th>

                  {/* 14. ĐIỂM TB */}
                  <th className="py-2.5 px-3 min-w-[85px] text-center border-b border-outline-variant/30">Điểm TB</th>

                  {/* 15. GHI CHÚ GLV */}
                  <th className="py-2.5 px-3 min-w-[180px] border-b border-outline-variant/30">Ghi Chú GLV</th>

                  {/* 16. HỌC BẠ */}
                  <th className="py-2.5 px-3 min-w-[95px] text-center border-b border-outline-variant/30">Học Bạ</th>
                </tr>
              </thead>

              <tbody className="font-body">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center text-on-surface-variant text-xs">
                      Không tìm thấy học sinh nào trong lớp {currentClass.name}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => {
                    const grade = grades.find((g) => g.studentId === s.id);
                    const currentNote = grade?.notes || s.notes || 'Bình thường';

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

                        {/* 5. CHỖ Ở HIỆN TẠI */}
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

                        {/* 6. GIÁO KHU / GIÁO HỌ */}
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

                        {/* 7. SỐ ĐIỆN THOẠI */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            {s.parentPhone ? (
                              <a
                                href={`tel:${s.parentPhone}`}
                                className="font-semibold text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                              >
                                <Phone className="w-3 h-3 text-secondary shrink-0" />
                                <span>{s.parentPhone}</span>
                              </a>
                            ) : (
                              <span className="text-outline italic text-[11px]">Chưa có SĐT</span>
                            )}
                            <button
                              onClick={() => handleOpenEdit(s, 'PHONE')}
                              className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                              title="Chỉnh sửa Số điện thoại"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 8. RỬA TỘI */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-semibold text-on-surface">{s.baptismDate || '—'}</div>
                              {s.baptismPlace && (
                                <div className="text-[10px] text-outline truncate max-w-[120px]">{s.baptismPlace}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenEdit(s, 'BAPTISM')}
                              className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                              title="Chỉnh sửa Bí Tích Rửa Tội"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 9. RƯỚC LỄ LẦN ĐẦU */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-semibold text-on-surface">{s.eucharistDate || '—'}</div>
                              {s.eucharistPlace && (
                                <div className="text-[10px] text-outline truncate max-w-[120px]">{s.eucharistPlace}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenEdit(s, 'EUCHARIST')}
                              className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                              title="Chỉnh sửa Xưng Tội & Rước Lễ Lần Đầu"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 10. THÊM SỨC */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-semibold text-on-surface">{s.confirmationDate || '—'}</div>
                              {s.confirmationPlace && (
                                <div className="text-[10px] text-outline truncate max-w-[120px]">{s.confirmationPlace}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenEdit(s, 'CONFIRMATION')}
                              className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                              title="Chỉnh sửa Bí Tích Thêm Sức"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 11. BAO ĐỒNG */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-semibold text-on-surface">{s.solemnCommunionDate || '—'}</div>
                              {s.solemnCommunionPlace && (
                                <div className="text-[10px] text-outline truncate max-w-[120px]">{s.solemnCommunionPlace}</div>
                              )}
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

                        {/* 12. THÔNG TIN CHA */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-medium text-on-surface">
                                {s.fatherHolyName ? `[${s.fatherHolyName}] ` : ''}
                                {s.fatherName || s.parentName || '—'}
                              </div>
                              {(s.fatherPhone || s.parentPhone) && (
                                <div className="text-[10px] text-outline">{s.fatherPhone || s.parentPhone}</div>
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

                        {/* 13. THÔNG TIN MẸ */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="text-[11px]">
                              <div className="font-medium text-on-surface">
                                {s.motherHolyName ? `[${s.motherHolyName}] ` : ''}
                                {s.motherName || '—'}
                              </div>
                              {s.motherPhone && <div className="text-[10px] text-outline">{s.motherPhone}</div>}
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

                        {/* 14. ĐIỂM TB */}
                        <td className="py-2.5 px-3 text-center border-b border-outline-variant/20">
                          <span className="font-bold text-on-surface px-2.5 py-0.5 rounded bg-surface-container-high">
                            {grade?.finalScore ?? '-'}
                          </span>
                        </td>

                        {/* 15. GHI CHÚ GLV */}
                        <td className="py-2.5 px-3 border-b border-outline-variant/20">
                          <div className="flex items-center justify-between gap-1.5 p-1 rounded-lg hover:bg-surface-container-high/50 transition-all">
                            <span className="text-on-surface-variant text-[11px] truncate max-w-[150px]" title={currentNote}>
                              {currentNote}
                            </span>
                            <button
                              onClick={() => handleOpenEdit(s, 'NOTE')}
                              className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-60 group-hover:opacity-100 shrink-0"
                              title="Chỉnh sửa Ghi chú GLV"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 16. HỌC BẠ */}
                        <td className="py-2.5 px-3 text-center border-b border-outline-variant/20">
                          <button
                            onClick={() => setSelectedTranscriptStudent(s)}
                            className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer border border-primary/20 hover:scale-105 shadow-2xs"
                            title="Xem sổ học bạ điện tử của học sinh"
                          >
                            <BookOpen className="w-3 h-3" />
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
        </div>
      )}

      {/* TAB 2: BẢNG ĐIỂM LỚP HỌC (Admin chỉ xem, có nút Xem Học Bạ) */}
      {activeTab === 'GRADES' && (
        <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-xs overflow-auto animate-fadeIn">
          <GradeEntryView isReadOnly={true} />
        </div>
      )}

      {/* ================= POP-UP MODAL CHỈNH SỬA ĐÚNG DUY NHẤT 1 TRƯỜNG ĐƯỢC CHỌN ================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block">
                  Cập Nhật Thông Tin Học Sinh
                </span>
                <h3 className="text-base font-bold font-sans">
                  {editingStudent.holyName} {editingStudent.fullName}
                </h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form - Render đúng duy nhất trường được bấm */}
            <form onSubmit={handleSave} className="p-6 space-y-4 font-body text-xs">
              {/* 1. NAME: Tên Thánh, Họ và Tên, Giới Tính */}
              {editField === 'NAME' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <User className="w-4 h-4" />
                    <span>Tên Thánh, Họ Tên & Giới Tính</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tên Thánh</label>
                    <input
                      type="text"
                      value={formData.holyName || ''}
                      onChange={(e) => setFormData({ ...formData, holyName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-primary outline-none focus:border-primary"
                      placeholder="VD: Maria, Giuse..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Họ và Tên</label>
                    <input
                      type="text"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-on-surface outline-none focus:border-primary"
                      placeholder="Họ và tên học sinh"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Giới Tính</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-on-surface">
                        <input
                          type="radio"
                          name="gender"
                          value="Nam"
                          checked={formData.gender === 'Nam'}
                          onChange={() => setFormData({ ...formData, gender: 'Nam' })}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Nam</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-on-surface">
                        <input
                          type="radio"
                          name="gender"
                          value="Nữ"
                          checked={formData.gender === 'Nữ'}
                          onChange={() => setFormData({ ...formData, gender: 'Nữ' })}
                          className="text-primary focus:ring-primary"
                        />
                        <span>Nữ</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DOB_POB: Ngày sinh & Nơi sinh */}
              {editField === 'DOB_POB' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Ngày Sinh & Nơi Sinh</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Sinh (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formData.dob || ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 23/06/2018"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Nơi Sinh</label>
                    <input
                      type="text"
                      value={formData.pob || ''}
                      onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="Bệnh viện, Tỉnh/TP..."
                    />
                  </div>
                </div>
              )}

              {/* 3. ADDRESS: Chỗ ở hiện tại */}
              {editField === 'ADDRESS' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Chỗ Ở Hiện Tại</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Địa chỉ gia đình</label>
                    <textarea
                      rows={3}
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="Số nhà, tên đường, thôn/ấp, xã/phường..."
                    />
                  </div>
                </div>
              )}

              {/* 4. PARISH_SUB: Giáo khu / Giáo họ */}
              {editField === 'PARISH_SUB' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Giáo Khu / Giáo Họ</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tên Giáo Khu / Giáo Họ</label>
                    <input
                      type="text"
                      value={formData.parishSubdivision || ''}
                      onChange={(e) => setFormData({ ...formData, parishSubdivision: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-primary outline-none focus:border-primary"
                      placeholder="VD: Mẹ Thiên Chúa, Đức Mẹ Lên Trời..."
                    />
                  </div>
                </div>
              )}

              {/* 5. PHONE: Số điện thoại liên lạc */}
              {editField === 'PHONE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Số Điện Thoại Liên Lạc</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Số Điện Thoại</label>
                    <input
                      type="tel"
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-primary outline-none focus:border-primary"
                      placeholder="09xx xxx xxx"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Người Đại Diện Liên Lạc</label>
                    <input
                      type="text"
                      value={formData.parentName || ''}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: Bố Bùi Quốc Dũng"
                    />
                  </div>
                </div>
              )}

              {/* 6. BAPTISM: Bí Tích Rửa Tội */}
              {editField === 'BAPTISM' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Bí Tích Rửa Tội</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Rửa Tội (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formData.baptismDate || ''}
                      onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 15/08/2018"
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

              {/* 7. EUCHARIST: Xưng Tội & Rước Lễ Lần Đầu */}
              {editField === 'EUCHARIST' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Xưng Tội & Rước Lễ Lần Đầu</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày RLLĐ (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formData.eucharistDate || ''}
                      onChange={(e) => setFormData({ ...formData, eucharistDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 07/06/2026"
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

              {/* 8. CONFIRMATION: Bí Tích Thêm Sức */}
              {editField === 'CONFIRMATION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Flame className="w-4 h-4" />
                    <span>Bí Tích Thêm Sức</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Thêm Sức (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formData.confirmationDate || ''}
                      onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 25/07/2027"
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

              {/* 9. SOLEMN: Rước Lễ Bao Đồng / Tuyên Hứa */}
              {editField === 'SOLEMN' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rước Lễ Bao Đồng / Tuyên Hứa</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Bao Đồng (DD/MM/YYYY)</label>
                    <input
                      type="text"
                      value={formData.solemnCommunionDate || ''}
                      onChange={(e) => setFormData({ ...formData, solemnCommunionDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="VD: 30/05/2028"
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

              {/* 12. NOTE: Ghi Chú */}
              {editField === 'NOTE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <Edit2 className="w-4 h-4" />
                    <span>Ghi Chú Về Học Sinh</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Nội dung ghi chú</label>
                    <textarea
                      rows={4}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="Ghi chú về học tập, hoàn cảnh, sự tích cực..."
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Học Sinh</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl font-semibold transition-all cursor-pointer text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Thay Đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sổ Học Bạ Điện Tử Modal (Dùng chung cho cả Tab Lý Lịch & Bảng Điểm) */}
      <StudentTranscriptModal
        student={selectedTranscriptStudent}
        isOpen={!!selectedTranscriptStudent}
        onClose={() => setSelectedTranscriptStudent(null)}
      />
    </div>
  );
};
