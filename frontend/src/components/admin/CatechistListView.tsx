import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  School,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  RefreshCw,
  UserPlus,
  X,
  Lock,
  Save,
  Trash2,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';

export const CatechistListView: React.FC = () => {
  const navigate = useNavigate();
  const { catechists, classes, assignCatechistClass, createCatechist, deleteCatechist, refreshData, setSelectedClassId } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [updatingGlvId, setUpdatingGlvId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State Thêm GLV
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGlvData, setNewGlvData] = useState({
    holyName: 'Giuse',
    fullName: '',
    phone: '',
    email: '',
    password: 'glv123',
    assignedClassId: ''
  });

  // Modal State Xóa GLV
  const [glvToDelete, setGlvToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tự động gợi ý email khi nhập tên
  const handleFullNameChange = (val: string) => {
    const normalized = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    setNewGlvData((prev) => ({
      ...prev,
      fullName: val,
      email: normalized ? `${normalized}.glv@gxsonloc.vn` : ''
    }));
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = catechists.length;
    const assigned = catechists.filter((g) => g.assignedClassId).length;
    const unassigned = total - assigned;
    return { total, assigned, unassigned };
  }, [catechists]);

  // Bộ lọc tìm kiếm
  const filteredCatechists = useMemo(() => {
    return catechists.filter((g) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        g.fullName?.toLowerCase().includes(term) ||
        g.holyName?.toLowerCase().includes(term) ||
        g.phone?.includes(term) ||
        g.email?.toLowerCase().includes(term) ||
        g.assignedClass?.name?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (filterCategory === 'ASSIGNED') return !!g.assignedClassId;
      if (filterCategory === 'UNASSIGNED') return !g.assignedClassId;
      return true;
    });
  }, [catechists, searchTerm, filterCategory]);

  // Xử lý thay đổi phân công lớp
  const handleClassChange = async (catechistId: string, catechistName: string, newClassId: string) => {
    setUpdatingGlvId(catechistId);
    try {
      const targetClassId = newClassId === 'NONE' ? null : newClassId;
      await assignCatechistClass(catechistId, targetClassId);

      const targetClassName = classes.find((c) => c.id === targetClassId)?.name || 'Chưa phân công';
      setSuccessMessage(`Đã phân công GLV ${catechistName} phụ trách lớp: ${targetClassName}! Tên GLV đã được đồng bộ lên Dashboard.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Lỗi khi phân công lớp: ' + (err.message || 'Không thể cập nhật!'));
    } finally {
      setUpdatingGlvId(null);
    }
  };

  // Xử lý thêm mới GLV
  const handleCreateCatechist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlvData.fullName.trim()) {
      alert('Vui lòng nhập Họ và Tên Giáo Lý Viên!');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCatechist({
        holyName: newGlvData.holyName.trim() || 'Giáo Lý Viên',
        fullName: newGlvData.fullName.trim(),
        phone: newGlvData.phone.trim() || '0900 000 000',
        email: newGlvData.email.trim(),
        password: newGlvData.password.trim() || 'glv123',
        assignedClassId: newGlvData.assignedClassId || null,
      });

      setIsAddModalOpen(false);
      setNewGlvData({
        holyName: 'Giuse',
        fullName: '',
        phone: '',
        email: '',
        password: 'glv123',
        assignedClassId: ''
      });

      setSuccessMessage(`Thêm mới Giáo Lý Viên ${newGlvData.holyName} ${newGlvData.fullName} thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Lỗi khi tạo Giáo Lý Viên: ' + (err.message || 'Không thể lưu!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa GLV
  const handleConfirmDelete = async () => {
    if (!glvToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCatechist(glvToDelete.id);
      setSuccessMessage(`Đã xóa Giáo Lý Viên ${glvToDelete.holyName} ${glvToDelete.fullName} khỏi hệ thống!`);
      setGlvToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Lỗi khi xóa Giáo Lý Viên: ' + (err.message || 'Không thể thực hiện!'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getHolyNameColor = (holyName: string) => {
    if (!holyName) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (holyName.includes('Maria') || holyName.includes('Têrêsa') || holyName.includes('Rosa')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (holyName.includes('Giuse') || holyName.includes('Phêrô') || holyName.includes('Gioan')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  // Xử lý xuất danh sách Giáo Lý Viên ra file Excel
  const handleExportExcel = () => {
    // 1. Tiêu đề và thông tin chung
    const titleRows = [
      ['BAN GIÁO LÝ GIÁO XỨ SƠN LỘC'],
      ['DANH SÁCH GIÁO LÝ VIÊN VÀ PHÂN CÔNG GIẢNG HUẤN'],
      [`Niên khóa: 2026 - 2027 | Tổng số: ${catechists.length} Giáo Lý Viên (${stats.assigned} đã phân công, ${stats.unassigned} chưa phân công)`],
      [], // Dòng trống ngăn cách
      [
        'STT',
        'Tên Thánh',
        'Họ và Tên',
        'Số Điện Thoại',
        'Email / Tài Khoản',
        'Lớp Phụ Trách',
        'Khối Giáo Lý',
        'Phòng Học',
        'Thời Gian Học',
        'Trạng Thái'
      ]
    ];

    // 2. Dữ liệu chi tiết từng GLV
    const dataRows = filteredCatechists.map((g, idx) => {
      const assignedClass = classes.find((c) => c.id === g.assignedClassId) || g.assignedClass;
      return [
        idx + 1,
        g.holyName || '',
        g.fullName || '',
        g.phone || 'Chưa cập nhật',
        g.email || '',
        assignedClass ? assignedClass.name : 'Chưa phân công',
        assignedClass ? assignedClass.category : '—',
        assignedClass ? (assignedClass.roomNumber || '—') : '—',
        assignedClass ? (assignedClass.schedule || '—') : '—',
        assignedClass ? 'Đã phân công' : 'Chưa phân công'
      ];
    });

    const fullSheetData = [...titleRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

    // Định dạng độ rộng cột (Column Widths)
    ws['!cols'] = [
      { wch: 6 },  // STT
      { wch: 18 }, // Tên Thánh
      { wch: 28 }, // Họ và Tên
      { wch: 16 }, // SĐT
      { wch: 32 }, // Email
      { wch: 22 }, // Lớp Phụ Trách
      { wch: 18 }, // Khối Giáo Lý
      { wch: 14 }, // Phòng Học
      { wch: 24 }, // Thời Gian Học
      { wch: 20 }  // Trạng Thái
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DS_GiaoLyVien');
    XLSX.writeFile(wb, 'Danh_Sach_Giao_Ly_Vien_GX_Son_Loc.xlsx');
  };

  return (
    <div className="pb-16 max-w-7xl mx-auto font-body space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface rounded-2xl p-6 border border-outline-variant/30 shadow-xs relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-white font-extrabold text-[10px] uppercase tracking-wider">
              Ban Điều Hành Giáo Lý
            </span>
            <span className="text-xs text-on-surface-variant">• Niên khóa 2026 - 2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-primary shrink-0" />
            <span>Danh Sách Giáo Lý Viên Giáo Xứ</span>
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Quản lý thông tin liên lạc và trực tiếp phân công lớp giáo lý giảng huấn cho từng Giáo lý viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* NÚT XUẤT EXCEL */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-600/70 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow hover:-translate-y-0.5"
            title="Xuất toàn bộ danh sách Giáo Lý Viên ra file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Xuất file Excel</span>
          </button>

          {/* NÚT THÊM GIÁO LÝ VIÊN MỚI */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Giáo Lý Viên</span>
          </button>

          <button
            onClick={() => refreshData()}
            className="px-3.5 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl border border-outline-variant/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo cập nhật thành công */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total GLV */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Tổng số Giáo Lý Viên
            </div>
            <div className="text-3xl font-extrabold text-primary font-sans mt-1">{stats.total}</div>
            <div className="text-[11px] text-outline mt-0.5">Giáo xứ Sơn Lộc</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Đã Phân Công Lớp
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 font-sans mt-1">{stats.assigned}</div>
            <div className="text-[11px] text-outline mt-0.5">Đang trực tiếp đứng lớp</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Unassigned / Standby */}
        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Chưa Phân Lớp / Dự Bị
            </div>
            <div className="text-3xl font-extrabold text-amber-600 font-sans mt-1">{stats.unassigned}</div>
            <div className="text-[11px] text-outline mt-0.5">Sẵn sàng điều phối</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Tìm theo tên GLV, tên Thánh, SĐT, lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary text-xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterCategory === 'ALL'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setFilterCategory('ASSIGNED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterCategory === 'ASSIGNED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Đã phân lớp ({stats.assigned})
          </button>
          <button
            onClick={() => setFilterCategory('UNASSIGNED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterCategory === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Chưa phân lớp ({stats.unassigned})
          </button>
        </div>
      </div>

      {/* Table of Catechists */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-4">Tên Thánh</th>
                <th className="py-3.5 px-4">Họ và Tên GLV</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4 min-w-[220px]">Tài Khoản & Mật Khẩu</th>
                <th className="py-3.5 px-4 min-w-[280px]">
                  <div className="flex items-center gap-1.5">
                    <School className="w-4 h-4 text-primary" />
                    <span>Lớp Giáo Lý Phụ Trách (Admin thay đổi tại đây)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center w-16">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body">
              {filteredCatechists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant text-xs">
                    Không tìm thấy Giáo lý viên nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCatechists.map((glv, index) => {
                  const isUpdating = updatingGlvId === glv.id;
                  const currentClass = classes.find((c) => c.id === glv.assignedClassId);

                  return (
                    <tr key={glv.id} className="hover:bg-surface-container-low/60 transition-colors">
                      {/* STT */}
                      <td className="py-3.5 px-4 text-center font-bold text-outline">{index + 1}</td>

                      {/* Tên thánh */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${getHolyNameColor(
                            glv.holyName
                          )}`}
                        >
                          {glv.holyName || 'GLV'}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3.5 px-4 font-bold text-on-surface text-xs">
                        <span>{glv.fullName}</span>
                      </td>

                      {/* Số điện thoại */}
                      <td className="py-3.5 px-4">
                        {glv.phone ? (
                          <a
                            href={`tel:${glv.phone}`}
                            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                          >
                            <Phone className="w-3 h-3 text-secondary" />
                            <span>{glv.phone}</span>
                          </a>
                        ) : (
                          <span className="text-outline italic">Chưa có SĐT</span>
                        )}
                      </td>

                      {/* Tài Khoản & Mật Khẩu Đăng Nhập */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface font-semibold">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="select-all">{glv.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-outline text-[10px]">Mật khẩu:</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] tracking-wider select-all">
                              {glv.rawPassword || 'glv123'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* LỚP GIÁO LÝ PHỤ TRÁCH (Interactive Dropdown Selector) */}
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <select
                            disabled={isUpdating}
                            value={glv.assignedClassId || 'NONE'}
                            onChange={(e) => handleClassChange(glv.id, `${glv.holyName} ${glv.fullName}`, e.target.value)}
                            className={`w-full py-2 pl-3 pr-8 rounded-xl border text-xs font-bold transition-all cursor-pointer outline-none ${
                              glv.assignedClassId
                                ? 'bg-primary-container/20 border-primary/40 text-primary hover:border-primary'
                                : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-outline'
                            }`}
                          >
                            <option value="NONE">-- Chưa phân công lớp --</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} — {cls.session === 'Tối' ? 'Ca Tối' : 'Ca Sáng'}
                              </option>
                            ))}
                          </select>

                          {isUpdating && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                            </div>
                          )}
                        </div>

                        {currentClass && (
                          <div className="mt-1 flex items-center justify-between text-[10px] text-outline px-1">
                            <span>Lịch: {currentClass.schedule}</span>
                            <button
                              onClick={() => {
                                setSelectedClassId(currentClass.id);
                                navigate('/admin/class-detail');
                              }}
                              className="text-primary hover:underline font-semibold cursor-pointer"
                            >
                              Xem lớp →
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3.5 px-4 text-center">
                        {glv.assignedClassId ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đang đứng lớp</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Dự bị</span>
                          </span>
                        )}
                      </td>

                      {/* Nút Xóa GLV */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setGlvToDelete(glv)}
                          title={`Xóa Giáo Lý Viên ${glv.holyName} ${glv.fullName}`}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent hover:border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN XÓA GIÁO LÝ VIÊN */}
      {/* ========================================================================= */}
      {glvToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface font-sans">Xác Nhận Xóa Giáo Lý Viên?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Bạn có chắc chắn muốn xóa tài khoản của Giáo lý viên{' '}
                  <span className="font-bold text-rose-600">
                    {glvToDelete.holyName} {glvToDelete.fullName}
                  </span>
                  ?
                </p>
                {glvToDelete.assignedClass && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-surface-container text-xs text-on-surface-variant border border-outline-variant/30 text-left">
                    <div>• <strong>Lớp đang phụ trách:</strong> {glvToDelete.assignedClass.name}</div>
                    <div>• <strong>Email:</strong> {glvToDelete.email}</div>
                  </div>
                )}
                <p className="text-[11px] text-outline mt-2 italic">
                  Thao tác này sẽ hủy quyền đăng nhập và xóa thông tin GLV khỏi hệ thống.
                </p>
              </div>

              <div className="flex justify-center items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setGlvToDelete(null)}
                  className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM GIÁO LÝ VIÊN MỚI */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-2xl w-full max-w-lg overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-primary text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-sans">Thêm Giáo Lý Viên Mới</h3>
                  <p className="text-[11px] text-primary-light">Khởi tạo tài khoản & phân công lớp giảng huấn</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateCatechist} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-on-surface mb-1">Tên Thánh (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Giuse"
                    value={newGlvData.holyName}
                    onChange={(e) => setNewGlvData({ ...newGlvData, holyName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary font-semibold text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-on-surface mb-1">Họ và Tên (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={newGlvData.fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Số Điện Thoại (*)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0912 345 678"
                    value={newGlvData.phone}
                    onChange={(e) => setNewGlvData({ ...newGlvData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Email Đăng Nhập</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="email"
                      placeholder="Tự sinh hoặc nhập email"
                      value={newGlvData.email}
                      onChange={(e) => setNewGlvData({ ...newGlvData, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Mật Khẩu Khởi Tạo</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      placeholder="glv123"
                      value={newGlvData.password}
                      onChange={(e) => setNewGlvData({ ...newGlvData, password: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Phân Công Lớp Ban Đầu</label>
                <div className="relative">
                  <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <select
                    value={newGlvData.assignedClassId}
                    onChange={(e) => setNewGlvData({ ...newGlvData, assignedClassId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-xs font-semibold cursor-pointer"
                  >
                    <option value="">-- Chưa phân công lớp (Dự bị) --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} — {cls.session === 'Tối' ? 'Ca Tối' : 'Ca Sáng'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang tạo...' : 'Lưu & Khởi Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
