import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Mail,
  Heart,
  ArrowLeft,
  School
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthLoginModal } from '../auth/AuthLoginModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchRole, students, setSelectedStudentId } = useApp();

  const [activeHeroTab, setActiveHeroTab] = useState<'home' | 'about'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [loginModalState, setLoginModalState] = useState<{
    isOpen: boolean;
    role: 'admin' | 'catechist';
  }>({
    isOpen: false,
    role: 'catechist'
  });

  // Tự động chuyển tab khi URL có hash #gioi-thieu
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#gioi-thieu') {
        setActiveHeroTab('about');
      } else {
        setActiveHeroTab('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchTab = (tab: 'home' | 'about') => {
    setActiveHeroTab(tab);
    if (tab === 'about') {
      window.location.hash = 'gioi-thieu';
    } else {
      window.history.pushState('', document.title, window.location.pathname);
    }
  };

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
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleSwitchTab('home')}
          >
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

          {/* Navigation Links (Right Aligned) */}
          <nav className="flex items-center gap-4 sm:gap-7">
            <button
              onClick={() => handleSwitchTab('home')}
              className={`font-bold text-xs sm:text-base pb-1 transition-all cursor-pointer ${activeHeroTab === 'home'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => handleSwitchTab('about')}
              className={`font-bold text-xs sm:text-base pb-1 transition-all cursor-pointer ${activeHeroTab === 'about'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
                }`}
            >
              Giới thiệu
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Dynamic Hero Section with Unified Background */}
        <section className="relative bg-[#87d5e8] overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-16 min-h-[500px] flex items-center">
          {/* Memphis Pattern Decor - Giữ nguyên cố định không tải lại */}
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

          <div className="relative z-10 px-4 md:px-10 max-w-[1536px] mx-auto w-full">
            <div className="grid grid-cols-1 items-center w-full">
              {/* ================= 1. GIAO DIỆN TRANG CHỦ (HERO VIEW) ================= */}
              <div
                className={`col-start-1 row-start-1 w-full transition-all duration-500 ease-in-out transform ${activeHeroTab === 'home'
                    ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                    : 'opacity-0 -translate-x-10 scale-[0.97] pointer-events-none'
                  }`}
              >
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  {/* Text Content */}
                  <div className="w-full lg:w-1/2 flex flex-col text-center lg:text-left gap-6 sm:gap-7 lg:gap-8">
                    <h1 className="font-extrabold text-[#005d6c] text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.85rem] font-sans flex flex-col gap-3.5 sm:gap-4 lg:gap-5 leading-normal">
                      <span>Nơi kết nối phụ huynh</span>
                      <span>và các em với giáo lý viên</span>
                    </h1>
                    <p className="text-base sm:text-lg text-[#005d6c]/90 max-w-2xl mx-auto lg:mx-0 bg-white/70 p-5 sm:p-6 rounded-2xl backdrop-blur-sm shadow-sm font-body leading-relaxed border border-white/60">
                      Nền tảng quản trị thông tin học sinh, sổ điểm, điểm danh và kết nối phụ huynh Ban Giáo Lý Giáo Xứ Sơn Lộc.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1 sm:pt-2">
                      <button
                        onClick={() => handleOpenLogin('catechist')}
                        className="bg-primary text-white font-bold text-sm px-8 py-3.5 rounded-full hover:scale-95 active:scale-90 transition-all shadow-md shadow-primary/25 w-full sm:w-auto text-center cursor-pointer"
                      >
                        Đăng nhập Giáo Lý Viên
                      </button>
                      <button
                        onClick={() => handleOpenLogin('admin')}
                        className="bg-white text-primary border border-primary/30 font-bold text-sm px-8 py-3.5 rounded-full hover:scale-95 active:scale-90 hover:bg-surface-container transition-all shadow-sm w-full sm:w-auto text-center cursor-pointer"
                      >
                        Đăng nhập Ban Quản Trị
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
              </div>

              {/* ================= 2. GIAO DIỆN GIỚI THIỆU (ABOUT VIEW) ================= */}
              <div
                className={`col-start-1 row-start-1 w-full transition-all duration-500 ease-in-out transform ${activeHeroTab === 'about'
                    ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                    : 'opacity-0 translate-x-10 scale-[0.97] pointer-events-none'
                  }`}
              >
                <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white/80 shadow-2xl space-y-6">
                  {/* Header Card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#005d6c] font-sans">
                        Cổng Thông Tin Ban Giáo Lý Giáo Xứ Sơn Lộc
                      </h2>
                    </div>

                    <button
                      onClick={() => handleSwitchTab('home')}
                      className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/40 shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại Trang Chủ</span>
                    </button>
                  </div>

                  {/* Đơn vị chủ quản */}
                  <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-2 shadow-2xs">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-outline">
                        Đơn Vị Chủ Quản &amp; Vận Hành
                      </div>
                      <div className="text-base font-extrabold text-on-surface mt-0.5">
                        Ban Giáo Lý Giáo Xứ Sơn Lộc
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Chịu trách nhiệm nội dung đào tạo đức tin, phân công Giáo Lý Viên, quản lý học bạ và kết nối quý Phụ Huynh trong Giáo xứ.
                    </p>
                  </div>

                  {/* Sứ mệnh & Mục đích */}
                  <div className="p-5 rounded-2xl bg-[#87d5e8]/20 border border-[#87d5e8]/50 space-y-2">
                    <h3 className="text-sm font-bold text-[#005d6c] flex items-center gap-2 font-sans">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>Mục Đích &amp; Ý Nghĩa Ứng Dụng</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#005d6c]/90 leading-relaxed font-body">
                      Hệ thống được xây dựng nhằm giúp các Thầy Cô Giáo Lý Viên quản lý sổ điểm, điểm danh chuyên cần các Chúa Nhật một cách nhanh chóng, chính xác. Đồng thời, giúp quý Phụ Huynh dễ dàng theo dõi sát sao kết quả học tập và rèn luyện đức tin của các em thiếu nhi một cách minh bạch, tiện lợi.
                    </p>
                  </div>

                  {/* Liên hệ bên trái & Phát triển & xây dựng bên phải (thay thế nút Gửi Góp Ý) */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-outline-variant/20">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span>Mọi ý kiến đóng góp &amp; hỗ trợ kỹ thuật:</span>
                      <a
                        href="mailto:nguyenphuc20050@gmail.com"
                        className="text-primary font-bold hover:underline"
                      >
                        nguyenphuc20050@gmail.com
                      </a>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-outline">
                        PHÁT TRIỂN &amp; XÂY DỰNG
                      </div>
                      <div className="text-sm font-extrabold text-on-surface">
                        GLV Giuse Antôn Nguyễn Huy Phúc
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tra cứu dành cho phụ huynh Section */}
        <section id="tra-cuu" className="bg-surface py-16 px-4 md:px-10">
          <div className="max-w-[1536px] mx-auto flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2 font-sans">
                Tra cứu Sổ Học Bạ &amp; Điểm Số Dành Cho Phụ Huynh
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
      <footer className="bg-[#b9cdd2] text-[#45575c]">
        <div className="w-full py-14 px-4 md:px-10 max-w-[1536px] mx-auto flex flex-col md:flex-row justify-between gap-10">
          {/* Brand & Copyright */}
          <div className="flex flex-col gap-3 max-w-sm">
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
            <p className="text-xs text-[#45575c]/80 font-body leading-relaxed">
              © 2026 Ban Giáo Lý Giáo Xứ Sơn Lộc. Hệ thống quản trị giáo lý và sổ liên lạc điện tử.
            </p>
          </div>

          {/* Links & Contact */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-14">
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-xs uppercase tracking-wider text-[#45575c]">
                Liên kết nhanh
              </span>
              <button
                onClick={() => handleSwitchTab('home')}
                className="text-left text-xs text-[#45575c]/80 hover:text-primary transition-colors cursor-pointer"
              >
                Trang chủ
              </button>
              <button
                onClick={() => handleSwitchTab('about')}
                className="text-left text-xs text-[#45575c]/80 hover:text-primary transition-colors cursor-pointer"
              >
                Giới thiệu dự án
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-xs uppercase tracking-wider text-[#45575c]">
                Hỗ trợ &amp; Liên hệ
              </span>
              <div className="flex items-center gap-2 text-xs text-[#45575c]/90">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>nguyenphuc20050@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#45575c]/90">
                <School className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Giáo xứ Sơn Lộc - Phú Cường</span>
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
