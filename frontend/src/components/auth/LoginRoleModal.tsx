import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, GraduationCap, Users, X, ChevronRight, Church } from 'lucide-react';

interface LoginRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginRoleModal: React.FC<LoginRoleModalProps> = ({ isOpen, onClose }) => {
  const { switchRole } = useApp();

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-outline-variant/30 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-on-primary relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-md">
              <Church className="w-7 h-7 text-primary-fixed" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-sans">Đăng Nhập Cổng Giáo Lý</h3>
              <p className="text-xs text-primary-light mt-0.5">Giáo xứ Sơn Lộc • Giáo phận Phú Cường</p>
            </div>
          </div>
        </div>

        {/* Body: 3 Roles */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant text-center font-body">
            Vui lòng chọn tư cách truy cập để tiếp tục vào không gian làm việc tương ứng:
          </p>

          {/* Role 1: Ban Giáo Lý */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="w-full text-left p-4 rounded-xl border border-outline-variant/50 hover:border-primary hover:bg-surface-container-low transition-all group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                    Ban Giáo Lý
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    Quản trị viên
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 font-body">
                  Quản lý tổng quan toàn xứ đoàn, tạo lớp, duyệt học sinh, thống kê
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>

          {/* Role 2: Giáo Lý Viên */}
          <button
            onClick={() => handleSelectRole('catechist')}
            className="w-full text-left p-4 rounded-xl border border-outline-variant/50 hover:border-secondary hover:bg-surface-container-low transition-all group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-on-surface text-base group-hover:text-secondary transition-colors">
                    Giáo Lý Viên
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-secondary/15 text-secondary rounded-full font-medium">
                    Giảng huấn
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 font-body">
                  Quản lý lớp phụ trách, nhập điểm số, điểm danh, nhận xét học viên
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline group-hover:text-secondary group-hover:translate-x-1 transition-all" />
          </button>

          {/* Role 3: Phụ Huynh */}
          <button
            onClick={() => handleSelectRole('parent')}
            className="w-full text-left p-4 rounded-xl border border-outline-variant/50 hover:border-primary hover:bg-surface-container-low transition-all group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/40 text-primary-dark flex items-center justify-center group-hover:bg-primary-dark group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                    Phụ Huynh & Học Sinh
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-surface-container-high text-on-surface-variant rounded-full font-medium">
                    Tra cứu
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 font-body">
                  Tra cứu sổ liên lạc điện tử, bảng điểm, tình hình chuyên cần của con
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/30 flex justify-between items-center text-xs text-on-surface-variant">
          <span>* Chế độ xem thử nghiệm (Demo Mock Access)</span>
          <button
            onClick={onClose}
            className="text-primary hover:underline font-medium"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
