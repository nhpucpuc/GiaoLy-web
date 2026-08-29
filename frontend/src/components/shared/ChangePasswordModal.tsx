import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, changePassword } = useApp();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Vui lòng điền đầy đủ tất cả các trường mật khẩu!');
      return;
    }

    if (newPassword.trim().length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại!');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(oldPassword.trim(), newPassword.trim());
      setSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-2xl w-full max-w-md overflow-hidden relative font-body">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-secondary to-secondary-dark text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm shadow-inner">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans">Đổi Mật Khẩu Tài Khoản</h3>
              <p className="text-[11px] text-white/80">
                {currentUser?.holyName ? `${currentUser.holyName} ` : ''}{currentUser?.name || currentUser?.email || 'Giáo Lý Viên'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Thông báo thành công */}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">{success}</span>
            </div>
          )}

          {/* Thông báo lỗi */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 shadow-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs">{error}</span>
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div>
            <label className="block font-bold text-on-surface mb-1">
              Mật khẩu hiện tại (*)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type={showOldPassword ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu hiện tại..."
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-secondary text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block font-bold text-on-surface mb-1">
              Mật khẩu mới (*) <span className="text-[10px] text-outline font-normal">(Tối thiểu 6 ký tự)</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-secondary text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block font-bold text-on-surface mb-1">
              Xác nhận mật khẩu mới (*)
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-secondary text-xs text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
