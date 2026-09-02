import React, { useState } from 'react';
import {
  Phone,
  Edit2,
  X,
  Save,
  CheckCircle2,
  Calendar,
  User,
  Users,
  MessageSquare,
  Search,
  Heart,
  MapPin,
  Flame,
  BookOpen,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { exportClassRosterToExcel } from '../../utils/excelExport';
import { formatToDDMMYYYY } from '../../utils/dateUtils';

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

export const CatechistClassOverview: React.FC = () => {
  const {
    classes,
    selectedClassId,
    students,
    grades,
    catechists,
    updateStudent,
    deleteStudent,
    updateStudentNote,
    currentRole,
    currentUser
  } = useApp();

  // Giáo lý viên bắt buộc chỉ xem đúng lớp được Admin phân công
  const targetClassId =
    currentRole === 'catechist' && currentUser?.assignedClassId
      ? currentUser.assignedClassId
      : selectedClassId;

  const currentClass =
    classes.find((c) => c.id === targetClassId) ||
    classes.find((c) => c.id === selectedClassId) ||
    classes[0];

  const classStudents = currentClass
    ? students.filter((s) => s.classId === currentClass.id)
    : [];

  // Tìm kiếm nhanh trong lớp
  const [searchTerm, setSearchTerm] = useState('');

  // State Modal chỉnh sửa chính xác từng trường đơn lẻ
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editField, setEditField] = useState<EditFieldType>('NAME');
  const [formData, setFormData] = useState<Partial<Student>>({});

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

  // Lưu thay đổi
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
        <p className="text-xs">Vui lòng liên hệ Ban Giáo Lý để được phân công lớp phụ trách.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. KHU VỰC ẢNH 2: CLASS BANNER (CỐ ĐỊNH NGOÀI VÙNG CUỘN) ================= */}
      <section className="bg-surface rounded-2xl border border-tertiary-fixed-dim p-6 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-primary-container/20 blur-xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                Khối {currentClass.category}
              </span>
              <span className="text-xs text-on-surface-variant font-semibold">• {currentClass.roomNumber || 'Chưa xếp phòng'}</span>
              <span className="text-xs text-outline">• {currentClass.schedule}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
              Lớp {currentClass.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-body mt-1.5">
              <span className="font-bold uppercase tracking-wider text-outline text-[11px]">
                GIÁO LÝ VIÊN PHỤ TRÁCH:
              </span>
              <span className="font-extrabold text-on-surface">
                {getFullCatechistNames(currentClass, catechists)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-center shadow-2xs">
              <span className="text-[11px] text-on-surface-variant block font-semibold uppercase tracking-wider">
                Sĩ số lớp
              </span>
              <span className="text-xl font-black text-primary">{classStudents.length} Học sinh</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. KHU VỰC ẢNH 1: BẢNG LÝ LỊCH ĐẦY ĐỦ CÓ THANH TRƯỢT ================= */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-xs p-5 space-y-3">
        {/* Table Header Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="text-base font-bold text-on-surface font-sans">Danh Sách Học Sinh Phụ Trách</h2>
            <p className="text-xs text-on-surface-variant">
              Quản lý hồ sơ lý lịch học sinh lớp {currentClass.name} (Bấm biểu tượng ✏️ ở ô nào để chỉnh sửa đúng thông tin ô đó)
            </p>
          </div>

          {/* Actions: Export Excel & Search Box */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => exportClassRosterToExcel(currentClass, classStudents, getFullCatechistNames(currentClass, catechists))}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              title="Xuất toàn bộ sơ yếu lý lịch học sinh lớp ra file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, tên thánh, giáo khu..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface font-medium"
              />
            </div>
          </div>
        </div>

        {/* BẢNG CUỘN 2 CHIỀU: DỌC & NGANG, CỘT STT & HỌ TÊN CỐ ĐỊNH HOÀN TOÀN BẰNG NỀN ĐẶC KHÔNG LỘ CHỮ */}
        <div className="max-h-[580px] overflow-y-auto overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface relative select-text shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-0 min-w-[1750px]">
            {/* Table Header (Sticky Top) */}
            <thead className="sticky top-0 z-30 bg-surface-container text-on-surface uppercase text-[11px] font-bold shadow-xs">
              <tr>
                {/* 1. STT (Cố định trái: left 0, width 52px, nền đặc) */}
                <th
                  style={{ width: '52px', minWidth: '52px', maxWidth: '52px', left: 0 }}
                  className="py-3 px-2 text-center sticky z-40 bg-surface-container border-b border-r border-outline-variant/40"
                >
                  STT
                </th>

                {/* 2. TÊN THÁNH & HỌ VÀ TÊN (Cố định trái: left 52px, width 230px, nền đặc, đổ bóng bên phải) */}
                <th
                  style={{ width: '230px', minWidth: '230px', maxWidth: '230px', left: '52px' }}
                  className="py-3 px-3.5 sticky z-40 bg-surface-container border-b border-r-2 border-outline-variant/60 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]"
                >
                  Tên Thánh & Họ và Tên
                </th>

                {/* 3. NỮ (X) / GIỚI TÍNH */}
                <th className="py-3 px-3 min-w-[85px] text-center border-b border-outline-variant/30">Giới Tính</th>

                {/* 4. NGÀY SINH & NƠI SINH */}
                <th className="py-3 px-3 min-w-[150px] border-b border-outline-variant/30">Ngày & Nơi Sinh</th>

                {/* 5. CHỖ Ở HIỆN TẠI */}
                <th className="py-3 px-3 min-w-[220px] border-b border-outline-variant/30">Chỗ Ở Hiện Tại</th>

                {/* 6. GIÁO KHU / GIÁO HỌ */}
                <th className="py-3 px-3 min-w-[130px] border-b border-outline-variant/30">Giáo Khu</th>

                {/* 7. SỐ ĐIỆN THOẠI */}
                <th className="py-3 px-3 min-w-[130px] border-b border-outline-variant/30">SĐT Liên Lạc</th>

                {/* 8. RỬA TỘI */}
                <th className="py-3 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Rửa Tội</th>

                {/* 9. RƯỚC LỄ LẦN ĐẦU */}
                <th className="py-3 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Lần Đầu</th>

                {/* 10. THÊM SỨC */}
                <th className="py-3 px-3 min-w-[170px] border-b border-outline-variant/30">Bí Tích Thêm Sức</th>

                {/* 11. BAO ĐỒNG */}
                <th className="py-3 px-3 min-w-[170px] border-b border-outline-variant/30">Rước Lễ Bao Đồng</th>

                {/* 12. THÔNG TIN CHA */}
                <th className="py-3 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Cha</th>

                {/* 13. THÔNG TIN MẸ */}
                <th className="py-3 px-3 min-w-[180px] border-b border-outline-variant/30">Thông Tin Mẹ</th>

                {/* 14. ĐIỂM TB */}
                <th className="py-3 px-3 min-w-[85px] text-center border-b border-outline-variant/30">Điểm TB</th>

                {/* 15. GHI CHÚ GLV */}
                <th className="py-3 px-3 min-w-[200px] border-b border-outline-variant/30">Ghi Chú GLV</th>
              </tr>
            </thead>

            <tbody className="font-body">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-on-surface-variant text-xs">
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
                      {/* 1. STT (Sticky Left 0, 100% Solid White/Dark Background) */}
                      <td
                        style={{ width: '52px', minWidth: '52px', maxWidth: '52px', left: 0 }}
                        className="py-3 px-2 text-center font-bold text-outline sticky z-20 bg-surface group-hover:bg-surface-container-low border-b border-r border-outline-variant/30"
                      >
                        {index + 1}
                      </td>

                      {/* 2. TÊN THÁNH & HỌ VÀ TÊN (Sticky Left 52px, 100% Solid Background + Shadow) */}
                      <td
                        style={{ width: '230px', minWidth: '230px', maxWidth: '230px', left: '52px' }}
                        className="py-3 px-3.5 sticky z-20 bg-surface group-hover:bg-surface-container-low border-b border-r-2 border-outline-variant/60 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]"
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
                      <td className="py-3 px-3 text-center border-b border-outline-variant/20">
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

                      {/* 4. NGÀY & NƠI SINH + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 5. CHỖ Ở HIỆN TẠI + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 6. GIÁO KHU + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-medium text-on-surface">{s.parishSubdivision || '—'}</span>
                          <button
                            onClick={() => handleOpenEdit(s, 'PARISH_SUB')}
                            className="p-1 text-outline hover:text-primary hover:bg-primary-container/30 rounded transition-all cursor-pointer opacity-40 group-hover:opacity-100 shrink-0"
                            title="Chỉnh sửa Giáo khu"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 7. SỐ ĐIỆN THOẠI LIÊN LẠC + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
                        <div className="flex items-center justify-between gap-1.5">
                          {s.parentPhone ? (
                            <a
                              href={`tel:${s.parentPhone}`}
                              className="text-primary font-semibold hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-primary" />
                              <span>{s.parentPhone}</span>
                            </a>
                          ) : (
                            <span className="text-outline">—</span>
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

                      {/* 8. RỬA TỘI + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 9. RƯỚC LỄ LẦN ĐẦU + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 10. THÊM SỨC + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 11. BAO ĐỒNG + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 12. THÔNG TIN CHA + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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

                      {/* 13. THÔNG TIN MẸ + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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
                      <td className="py-3 px-3 text-center border-b border-outline-variant/20">
                        <span className="font-bold text-on-surface px-2.5 py-0.5 rounded bg-surface-container-high">
                          {grade?.finalScore ?? '-'}
                        </span>
                      </td>

                      {/* 15. GHI CHÚ GLV + Mini Edit Icon */}
                      <td className="py-3 px-3 border-b border-outline-variant/20">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 3. POP-UP MODAL CHỈNH SỬA ĐÚNG DUY NHẤT 1 TRƯỜNG ĐƯỢC CHỌN ================= */}
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
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Ngày Sinh & Nơi Sinh</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày Sinh (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.dob || ''}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, dob: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: 23-06-2018"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Nơi Sinh</label>
                    <input
                      type="text"
                      value={formData.pob || ''}
                      onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="Bệnh viện, Tỉnh/TP..."
                    />
                  </div>
                </div>
              )}

              {/* 3. ADDRESS: Chỗ ở hiện tại */}
              {editField === 'ADDRESS' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Chỗ Ở Hiện Tại</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Địa chỉ gia đình</label>
                    <textarea
                      rows={3}
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="Số nhà, tên đường, thôn/ấp, xã/phường..."
                    />
                  </div>
                </div>
              )}

              {/* 4. PARISH_SUB: Giáo khu / Giáo họ */}
              {editField === 'PARISH_SUB' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Giáo Khu / Giáo Họ</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tên Giáo Khu / Giáo Họ</label>
                    <input
                      type="text"
                      value={formData.parishSubdivision || ''}
                      onChange={(e) => setFormData({ ...formData, parishSubdivision: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-secondary outline-none focus:border-secondary"
                      placeholder="VD: Mẹ Thiên Chúa, Đức Mẹ Lên Trời..."
                    />
                  </div>
                </div>
              )}

              {/* 5. PHONE: Số điện thoại liên lạc */}
              {editField === 'PHONE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Số Điện Thoại Liên Lạc</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Số Điện Thoại</label>
                    <input
                      type="tel"
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-secondary outline-none focus:border-secondary"
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
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: Bố Bùi Quốc Dũng"
                    />
                  </div>
                </div>
              )}

              {/* 6. BAPTISM: Bí Tích Rửa Tội */}
              {editField === 'BAPTISM' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
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
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: 15-08-2018"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.baptismPlace || ''}
                      onChange={(e) => setFormData({ ...formData, baptismPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 7. EUCHARIST: Xưng Tội & Rước Lễ Lần Đầu */}
              {editField === 'EUCHARIST' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>Xưng Tội & Rước Lễ Lần Đầu</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Ngày RLLĐ (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      value={formData.eucharistDate || ''}
                      onChange={(e) => setFormData({ ...formData, eucharistDate: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, eucharistDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: 07-06-2026"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">Tại Giáo Xứ</label>
                    <input
                      type="text"
                      value={formData.eucharistPlace || ''}
                      onChange={(e) => setFormData({ ...formData, eucharistPlace: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
                      placeholder="VD: Giáo xứ Sơn Lộc"
                    />
                  </div>
                </div>
              )}

              {/* 8. CONFIRMATION: Bí Tích Thêm Sức */}
              {editField === 'CONFIRMATION' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-secondary font-bold text-sm">
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
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-secondary"
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
                    <Users className="w-4 h-4" />
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
                    <Users className="w-4 h-4" />
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

              {/* 12. NOTE: Ghi chú GLV */}
              {editField === 'NOTE' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-outline-variant/30 text-primary font-bold text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>Ghi Chú & Nhận Xét Của GLV</span>
                  </div>

                  <div>
                    <label className="block font-bold text-on-surface mb-1">
                      Nhận xét quá trình học tập & rèn luyện
                    </label>
                    <textarea
                      rows={4}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary"
                      placeholder="Ghi chú về hạnh kiểm, chuyên cần, sức khỏe..."
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  className="px-3.5 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-red-200 dark:border-red-800/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa học sinh</span>
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu cập nhật</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
