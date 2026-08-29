import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'admin' | 'catechist';
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  targetRole
}) => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when opening modal
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, [targetRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu!');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      onClose();
      // Navigate with react-router
      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.role === 'catechist') {
        navigate('/glyvien/tong-quan');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  const roleTitle = targetRole === 'admin' ? 'Ban Quản Trị Giáo Lý (Admin)' : 'Thầy Cô Giáo Lý Viên';
  const roleSubtitle =
    targetRole === 'admin'
      ? 'Đăng nhập vào hệ thống quản lý toàn diện giáo xứ'
      : 'Đăng nhập vào lớp giảng huấn và sổ điểm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-outline-variant/30 transform transition-all">
        {/* Header */}
        <div className="p-6 text-white relative bg-gradient-to-r from-primary to-primary-dark">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3.5">
            <img
              alt="Logo Ban Giáo Lý"
              className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white/80 shrink-0"
              src="/logo.png"
            />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/80 font-extrabold">
                GX Sơn Lộc • Giáo Lý Viên
              </span>
              <h3 className="text-lg font-bold font-sans">{roleTitle}</h3>
            </div>
          </div>
          <p className="text-xs text-white/85 mt-2 font-body">{roleSubtitle}</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-body text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-customError-container/60 border border-customError/40 text-customError flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Username */}
          <div>
            <label className="block font-semibold text-on-surface mb-1.5 text-xs">
              Tài khoản / Email đăng nhập:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Nhập email hoặc tên tài khoản..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-on-surface mb-1.5 text-xs">
              Mật khẩu:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 bg-primary hover:bg-primary-dark shadow-primary/20 cursor-pointer"
          >
            {isLoading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng Nhập Vào Hệ Thống</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/20 flex justify-between items-center text-[11px] text-on-surface-variant">
          <span>Giáo xứ Sơn Lộc • Giáo phận Phú Cường</span>
          <button onClick={onClose} className="text-primary font-semibold hover:underline">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};
