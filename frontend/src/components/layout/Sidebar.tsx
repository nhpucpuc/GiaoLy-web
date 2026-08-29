import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  School,
  UserPlus,
  FolderPlus,
  BookOpenCheck,
  FileSpreadsheet,
  CalendarCheck,
  LogOut,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChangePasswordModal } from '../shared/ChangePasswordModal';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole, switchRole } = useApp();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'admin':
        return { title: 'Ban Giáo Lý', subtitle: 'Quản Trị Viên (Admin)' };
      case 'catechist':
        return { title: 'Giáo Lý Viên', subtitle: 'Thầy Cô Giảng Huấn' };
      case 'parent':
        return { title: 'Phụ Huynh & Học Sinh', subtitle: 'Sổ Liên Lạc Điện Tử' };
      default:
        return { title: 'Khách', subtitle: 'Trang chủ' };
    }
  };

  const roleInfo = getRoleLabel();

  const handleLogout = () => {
    switchRole('public');
    navigate('/');
  };

  return (
    <>
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col h-full shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center space-x-3 bg-surface">
          <img
            src="/logo.png"
            alt="Logo Giáo Lý Viên Giáo Xứ Sơn Lộc"
            className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-primary/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary truncate block">GX Sơn Lộc</span>
            <h2 className="text-sm font-bold text-on-surface truncate font-sans">{roleInfo.title}</h2>
            <p className="text-[11px] text-on-surface-variant truncate">{roleInfo.subtitle}</p>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* ================= 1. ADMIN MENU ================= */}
          {currentRole === 'admin' && (
            <>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-outline">
                Menu Ban Giáo Lý
              </div>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Tổng quan lớp học</span>
              </NavLink>

              <NavLink
                to="/admin/giao-ly-vien"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <GraduationCap className="w-5 h-5" />
                <span>DS Giáo lý viên</span>
              </NavLink>

              <NavLink
                to="/admin/add-student"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <UserPlus className="w-5 h-5" />
                <span>Thêm học sinh</span>
              </NavLink>

              <NavLink
                to="/admin/add-class"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <FolderPlus className="w-5 h-5" />
                <span>Thêm lớp</span>
              </NavLink>

              <NavLink
                to="/admin/diem-danh"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Điểm danh</span>
              </NavLink>

              <NavLink
                to="/admin/nien-khoa"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Niên khóa & Lên lớp</span>
              </NavLink>
            </>
          )}

          {/* ================= 2. GLV MENU ================= */}
          {currentRole === 'catechist' && (
            <>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-outline">
                Menu Giáo Lý Viên
              </div>
              <NavLink
                to="/glyvien/tong-quan"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <School className="w-5 h-5" />
                <span>Tổng quan lớp học</span>
              </NavLink>

              <NavLink
                to="/glyvien/nhap-diem"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Nhập điểm</span>
              </NavLink>

              <NavLink
                to="/glyvien/diem-danh"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Điểm danh</span>
              </NavLink>

              <NavLink
                to="/glyvien/them-hoc-sinh"
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <UserPlus className="w-5 h-5" />
                <span>Thêm học sinh</span>
              </NavLink>

              {/* NÚT ĐỔI MẬT KHẨU CHO GIÁO LÝ VIÊN */}
              <div className="pt-2">
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-secondary/10 hover:text-secondary border border-transparent hover:border-secondary/30 transition-all cursor-pointer text-left"
                >
                  <KeyRound className="w-5 h-5 text-secondary shrink-0" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </>
          )}

          {/* ================= 3. PHỤ HUYNH MENU ================= */}
          {currentRole === 'parent' && (
            <>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-outline">
                Menu Phụ Huynh
              </div>
              <NavLink
                to="/phu-huynh"
                end
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <BookOpenCheck className="w-5 h-5" />
                <span>Học bạ & Bảng điểm</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Đăng xuất về Trang chủ */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-outline-variant/60 text-xs font-semibold text-on-surface-variant hover:bg-customError-container/30 hover:text-customError hover:border-customError transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất (Về Trang Chủ)</span>
          </button>
        </div>
      </aside>

      {/* Popup Đổi Mật Khẩu */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

