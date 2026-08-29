import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mail, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthLoginModal } from '../auth/AuthLoginModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, students, setSelectedStudentId } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [loginModalState, setLoginModalState] = useState<{
    isOpen: boolean;
    role: 'admin' | 'catechist';
  }>({
    isOpen: false,
    role: 'catechist'
  });

  const handleOpenLogin = (role: 'admin' | 'catechist') => {
    setLoginModalState({
      isOpen: true,
      role
    });
  };

  const [searchError, setSearchError] = useState<string | null>(null);

  const handleParentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const cleanCode = searchTerm.trim().replace(/^#/, '').toLowerCase();
    if (!cleanCode) {
      setSearchError('Vui lòng nhập Mã số học sinh để tra cứu kết quả và học bạ!');
      return;
    }

    // Chỉ cho phép tra cứu đúng mã số học sinh
    const found = students.find(
      (s) => (s.code && s.code.toLowerCase() === cleanCode) || s.id.toLowerCase() === cleanCode
    );

    if (found) {
      setSelectedStudentId(found.id);
      switchRole('parent');
      navigate(`/phu-huynh?code=${encodeURIComponent(found.code || found.id)}`);
    } else {
      setSearchError(`Không tìm thấy học sinh với mã "${searchTerm}". Vui lòng kiểm tra lại chính xác Mã số học sinh do Giáo lý viên cung cấp!`);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <header className="bg-surface shadow-sm sticky top-0 z-40 border-b border-outline-variant/20">
        <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-[1536px] mx-auto h-20">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img
              alt="Logo Ban Giáo Lý Giáo Xứ Sơn Lộc"
              className="h-12 w-12 rounded-full object-cover shadow-md border-2 border-primary/20 hover:scale-105 transition-transform"
              src="/logo.png"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Giáo Xứ Sơn Lộc</span>
              <span className="text-lg md:text-xl font-extrabold text-on-surface font-sans leading-tight">
                Ban Giáo Lý
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="text-primary font-bold border-b-2 border-primary pb-1 text-sm md:text-base transition-colors duration-200 hover:text-secondary"
            >
              Trang chủ
            </button>
            <a
              className="text-on-surface-variant text-sm md:text-base transition-colors duration-200 hover:text-secondary"
              href="#tra-cuu"
            >
              Tra cứu phụ huynh
            </a>
            <a
              className="text-on-surface-variant text-sm md:text-base transition-colors duration-200 hover:text-secondary"
              href="#gioi-thieu"
            >
              Giới thiệu
            </a>
          </nav>

          {/* Mobile Right Quick Login */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => handleOpenLogin('catechist')}
              className="bg-primary text-white text-xs px-3 py-1.5 rounded-full font-semibold"
            >
              GLV
            </button>
            <button
              onClick={() => handleOpenLogin('admin')}
              className="bg-surface-container-high text-primary text-xs px-3 py-1.5 rounded-full font-semibold border border-primary/20"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-[#87d5e8] overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-20">
          {/* Memphis Pattern Decor */}
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              backgroundColor: '#87d5e8',
              backgroundImage:
                'radial-gradient(#ffffff 2px, transparent 2px), radial-gradient(#ffffff 2px, transparent 2px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          ></div>

          <div className="relative z-10 px-4 md:px-10 max-w-[1536px] mx-auto flex flex-col lg:flex-row items-center gap-12">
            {/* Text Content */}
            <div className="w-full lg:w-1/2 flex flex-col text-center lg:text-left gap-4">
              <h1 className="font-extrabold text-[#005d6c] text-3xl sm:text-4xl lg:text-5xl leading-tight font-sans">
                Nơi kết nối phụ huynh và các em với giáo lý viên
              </h1>
              <p className="text-base sm:text-lg text-[#005d6c]/85 max-w-2xl mx-auto lg:mx-0 bg-white/60 p-4 rounded-xl backdrop-blur-sm shadow-sm font-body">
                Nền tảng quản trị thông tin học sinh, sổ điểm và kết nối phụ huynh Ban Giáo Lý Giáo Xứ Sơn Lộc.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-4">
                <button
                  onClick={() => handleOpenLogin('catechist')}
                  className="bg-primary text-white font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-95 active:scale-90 transition-all shadow-lg shadow-primary/25 w-full sm:w-auto text-center cursor-pointer"
                >
                  Đăng nhập Giáo Lý Viên
                </button>
                <button
                  onClick={() => handleOpenLogin('admin')}
                  className="bg-white text-primary border border-primary/30 font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-95 active:scale-90 hover:bg-surface-container transition-all shadow-sm w-full sm:w-auto text-center cursor-pointer"
                >
                  Đăng nhập Ban Quản Trị (Admin)
                </button>
              </div>
            </div>

            {/* Original Banner Illustration */}
            <div className="w-full lg:w-1/2 flex justify-center relative">
              <div className="absolute inset-0 bg-[#ffddb5]/40 rounded-[3rem] -rotate-3 scale-105 pointer-events-none blur-3xl"></div>
              <img
                alt="Banner Giáo Lý Sơn Lộc"
                className="relative z-10 w-full rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,104,120,0.25)] border border-white/60 max-w-sm sm:max-w-md object-cover"
                src="/banner.jpg"
              />
            </div>
          </div>
        </section>

        {/* Tra cứu dành cho phụ huynh Section */}
        <section id="tra-cuu" className="bg-surface py-16 px-4 md:px-10">
          <div className="max-w-[1536px] mx-auto flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2 font-sans">
                Tra cứu Sổ Học Bạ & Điểm Số Dành Cho Phụ Huynh
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant font-body">
                Nhập chính xác <strong>Mã số học sinh</strong> (do Giáo lý viên cung cấp) để tra cứu học bạ điện tử và bảng điểm của các em.
              </p>
            </div>

            <form onSubmit={handleParentSearch} className="w-full max-w-2xl flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    className="w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant bg-white focus:outline-none focus:border-primary transition-colors text-sm sm:text-base shadow-sm font-medium text-on-surface"
                    placeholder="Nhập mã số học sinh..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#87d5e8] text-[#005d6c] font-bold text-sm px-8 py-3 rounded-full hover:scale-95 transition-transform shadow-sm whitespace-nowrap cursor-pointer"
                >
                  Tra cứu ngay
                </button>
              </div>

              {searchError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold text-center animate-fadeIn shadow-2xs">
                  {searchError}
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="gioi-thieu" className="bg-[#b9cdd2] text-[#45575c]">
        <div className="w-full py-16 px-4 md:px-10 max-w-[1536px] mx-auto flex flex-col md:flex-row justify-between gap-12">
          {/* Brand & Copyright */}
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <img
                alt="Logo Ban Giáo Lý Giáo Xứ Sơn Lộc"
                className="h-10 w-10 rounded-full object-cover shadow-sm border border-white/60"
                src="/logo.png"
              />
              <span className="font-bold text-lg text-[#45575c] font-sans">
                Ban Giáo Lý Giáo Xứ Sơn Lộc
              </span>
            </div>
            <p className="text-sm text-[#45575c]/80 font-body">
              © 2026 Ban Giáo Lý Giáo Xứ Sơn Lộc. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
            <div className="flex flex-col gap-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#45575c]">
                Thông tin
              </span>
              <a className="text-sm text-[#45575c]/80 hover:text-primary transition-colors" href="#">
                Liên hệ
              </a>
              <a className="text-sm text-[#45575c]/80 hover:text-primary transition-colors" href="#">
                Chính sách bảo mật
              </a>
              <a className="text-sm text-[#45575c]/80 hover:text-primary transition-colors" href="#">
                Điều khoản sử dụng
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#45575c]">
                Mạng xã hội
              </span>
              <div className="flex gap-4">
                <a className="text-[#45575c]/80 hover:text-primary transition-colors p-2 bg-white/30 rounded-full" href="#">
                  <QrCode className="w-5 h-5" />
                </a>
                <a className="text-[#45575c]/80 hover:text-primary transition-colors p-2 bg-white/30 rounded-full" href="#">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Popup Login Modal */}
      <AuthLoginModal
        isOpen={loginModalState.isOpen}
        onClose={() => setLoginModalState((prev) => ({ ...prev, isOpen: false }))}
        targetRole={loginModalState.role}
      />
    </div>
  );
};
