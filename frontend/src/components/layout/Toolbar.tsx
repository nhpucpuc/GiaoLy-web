import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Filter,
  Calendar,
  LogOut,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GenderAvatar } from '../shared/GenderAvatar';

export const Toolbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentRole,
    currentUser,
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedAcademicYear,
    availableAcademicYears,
    setSelectedAcademicYear,
    announcements,
    switchRole
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'Tổng Quan Lớp Học';
    if (p.includes('/admin/class')) return 'Chi Tiết & Danh Sách Lớp Học';
    if (p.includes('/admin/add-student')) return 'Thêm Học Sinh Mới';
    if (p.includes('/admin/add-class')) return 'Thêm Lớp Giáo Lý Mới';
    if (p.includes('/admin/giao-ly-vien') || p.includes('/admin/catechists')) return 'Danh Sách Giáo Lý Viên';
    if (p.includes('/glyvien/tong-quan')) return 'Tổng Quan Lớp Phụ Trách';
    if (p.includes('/glyvien/nhap-diem')) return 'Bảng Điểm & Đánh Giá Hạnh Kiểm';
    if (p.includes('/diem-danh')) return 'Quản Lý Điểm Danh & Chuyên Cần';
    if (p.includes('/glyvien/them-hoc-sinh')) return 'Thêm Học Sinh Vào Lớp';
    if (p.includes('/phu-huynh/chuyen-can')) return 'Theo Dõi Chuyên Cần & Tham Dự Thánh Lễ';
    if (p.includes('/phu-huynh')) return 'Sổ Liên Lạc Điện Tử & Học Bạ';
    return 'Cổng Quản Lý Giáo Lý';
  };

  // Chỉ hiển thị bộ chọn lớp cho Admin ở trang chi tiết lớp
  const isAdminClassDetail = currentRole === 'admin' && (
    location.pathname.includes('/admin/class-detail') ||
    location.pathname.includes('/admin/grades')
  );

  // Lấy thông tin lớp phụ trách của Giáo Lý Viên
  const catechistAssignedClass = currentRole === 'catechist' && currentUser?.assignedClassId
    ? classes.find((c) => c.id === currentUser.assignedClassId)
    : null;

  const handleLogout = () => {
    switchRole('public');
    navigate('/');
  };

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/30 px-6 flex items-center justify-between sticky top-0 z-20 transition-all">
      {/* Left: Title & Quick class selector if needed */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-base font-bold text-on-surface leading-tight font-sans">
            {getPageTitle()}
          </h2>
          <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
            {/* Academic Year Selector (Dropdown cho Admin, Nhãn cố định cho Giáo Lý Viên / Phụ Huynh) */}
            {currentRole === 'admin' ? (
              <div className="flex items-center gap-1 bg-primary/10 border border-primary/25 px-2 py-0.5 rounded-lg text-primary font-bold shadow-2xs">
                <Calendar className="w-3 h-3 text-primary shrink-0" />
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="bg-transparent font-bold outline-none cursor-pointer text-xs"
                  title="Chọn niên khóa làm việc (Quản trị Admin)"
                >
                  {availableAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Niên khóa {yr}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/30 px-2 py-0.5 rounded-lg text-on-surface-variant font-semibold text-xs">
                <Calendar className="w-3 h-3 text-outline shrink-0" />
                <span>Niên khóa {selectedAcademicYear}</span>
              </div>
            )}
            <span>•</span>
            <span>Giáo xứ Sơn Lộc</span>
          </div>
        </div>

        {/* Admin: Quick Class Selector Dropdown */}
        {isAdminClassDetail && (
          <div className="hidden lg:flex items-center space-x-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/40">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
            <span className="text-xs text-on-surface-variant font-medium">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newClassId = e.target.value;
                setSelectedClassId(newClassId);
                if (location.pathname.includes('/admin/class-detail')) {
                  navigate(`/admin/class-detail?classId=${newClassId}`);
                }
              }}
              aria-label="Chọn lớp học"
              className="bg-transparent text-xs font-semibold text-primary outline-none cursor-pointer"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.session === 'Tối' ? 'Ca Tối' : 'Ca Sáng'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Giáo Lý Viên: Khóa cứng hiển thị lớp được phân công */}
        {catechistAssignedClass && (
          <div className="hidden sm:flex items-center space-x-2 bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-xl text-xs text-primary font-bold shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Lớp: {catechistAssignedClass.name}</span>
          </div>
        )}
      </div>

      {/* Right: Notifications + Profile & Logout */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant relative transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-customError rounded-full absolute top-1.5 right-1.5"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <span className="font-bold text-xs text-on-surface">Thông báo mới</span>
                <span className="text-[10px] text-primary font-medium">{announcements.length} tin tức</span>
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {announcements.map((anc) => (
                  <div key={anc.id} className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-center justify-between text-[11px] text-primary font-semibold">
                      <span>{anc.author}</span>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {anc.date}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-on-surface mt-1 line-clamp-1">{anc.title}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{anc.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center pl-2 border-l border-outline-variant/30 space-x-3">
          <div className="flex items-center space-x-2">
            <GenderAvatar
              gender={
                (currentUser?.holyName && /maria|têrêsa|anna|macta|lucia|cecilia|rosa|francesca/i.test(currentUser.holyName)) ||
                (currentUser?.name && /nga|diễm|mai|hương|hoa|lan|trang|nhiên|thục|hảo|khánh|thạnh|uyên|nguyệt|nhung|thủy|trâm|hà|hằng/i.test(currentUser.name))
                  ? 'Nữ'
                  : 'Nam'
              }
              className="w-8 h-8 rounded-full ring-2 ring-primary/20"
            />
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-on-surface line-clamp-1">
                {currentUser?.holyName ? `${currentUser.holyName} ` : ''}{currentUser?.name || 'Tài khoản'}
              </div>
              <div className="text-[10px] text-on-surface-variant capitalize font-semibold text-primary">
                {currentRole === 'admin' ? 'Ban Giáo Lý' : currentRole === 'catechist' ? 'Giáo Lý Viên' : 'Phụ Huynh'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất về trang chủ"
            className="p-2 rounded-xl hover:bg-customError-container/40 text-on-surface-variant hover:text-customError transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
