import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra xem app đã chạy ở chế độ standalone (đã cài) chưa
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // 2. Nhận diện thiết bị iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Kiểm tra xem người dùng đã bấm tắt thông báo trong phiên này chưa
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) return;

    // 4. Lắng nghe event beforeinstallprompt (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Nếu là iOS và chưa cài đặt, hiển thị banner nhắc nhở sau 2 giây
    if (isIosDevice && !isAppStandalone) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android / Chrome: Gọi popup native
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS: Mở modal hướng dẫn chi tiết
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // Nếu đã cài đặt hoặc không có lý do để hiện, return null
  if (isStandalone || (!isOpen && !showGuideModal)) return null;

  return (
    <>
      {/* Floating Mini Banner ở góc dưới */}
      {isOpen && !showGuideModal && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-bounce-in">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <img src="/pwa-192x192.png" alt="Logo" className="w-9 h-9 object-contain rounded-lg" onError={(e) => {
                // Fallback nếu ảnh chưa load
                (e.target as HTMLElement).style.display = 'none';
              }} />
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white tracking-wide truncate">
                Cài đặt App Giáo Lý
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {isIOS ? 'Thêm vào màn hình chính iPhone' : 'Trải nghiệm mượt mà, dùng như app'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Cài đặt
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hướng Dẫn Cài Đặt Cho iOS (iPhone / iPad) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-slide-up sm:animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Cài đặt trên iPhone / iPad</h3>
                  <p className="text-xs text-slate-500">Chỉ 2 bước đơn giản qua Safari</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Bước 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Bấm vào biểu tượng <strong className="inline-flex items-center gap-1 font-semibold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200/60 mx-1"><Share className="w-3.5 h-3.5 inline" /> Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng của trình duyệt <strong>Safari</strong>.
                </div>
              </div>

              {/* Bước 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Cuộn xuống và chọn <strong className="inline-flex items-center gap-1 font-semibold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200/60 mx-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính (Add to Home Screen)</strong>.
                </div>
              </div>

              {/* Bước 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Bấm <strong className="text-blue-600 font-semibold">"Thêm" (Add)</strong> ở góc trên bên phải. Biểu tượng Giáo Lý sẽ xuất hiện ngay trên màn hình chính!
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
