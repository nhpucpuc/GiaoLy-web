import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AcademicYearManager: React.FC = () => {
  const {
    classes,
    students,
    grades,
    selectedAcademicYear,
    setSelectedAcademicYear,
    availableAcademicYears,
    promoteToNewAcademicYear
  } = useApp();

  // Tính toán niên khóa kế tiếp mặc định (VD: 2026 - 2027 -> 2027 - 2028)
  const getNextYearSuggestion = (currentYearStr: string) => {
    const parts = currentYearStr.split('-').map((p) => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return `${parts[0] + 1} - ${parts[1] + 1}`;
    }
    return '2027 - 2028';
  };

  const [fromYear, setFromYear] = useState<string>(selectedAcademicYear || '2026 - 2027');
  const [toYear, setToYear] = useState<string>(() => getNextYearSuggestion(selectedAcademicYear || '2026 - 2027'));
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Thống kê của niên khóa nguồn đang chọn
  const sourceStats = useMemo(() => {
    const totalStudents = students.length;
    const gradedStudents = grades.filter((g) => typeof g.tb_cn === 'number').length;
    const passedStudents = grades.filter((g) => g.result === 'Lên lớp' || (typeof g.tb_cn === 'number' && g.tb_cn >= 5.0)).length;
    const failedStudents = grades.filter((g) => g.result === 'Chưa đạt' || (typeof g.tb_cn === 'number' && g.tb_cn < 5.0)).length;

    return {
      totalClasses: classes.length,
      totalStudents,
      gradedStudents,
      passedStudents,
      failedStudents
    };
  }, [classes.length, students.length, grades]);

  const handlePromote = async () => {
    setIsProcessing(true);
    try {
      const res = await promoteToNewAcademicYear(fromYear, toYear);
      setResultMessage(res);
      setShowConfirmModal(false);
    } catch (err: any) {
      alert(`Lỗi khi chuyển niên khóa: ${err.message || 'Không thể kết nối máy chủ'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const STAGES = [
    { name: 'Khai Tâm', levels: '1 ➔ 2', color: 'from-amber-400 to-orange-400', desc: 'Làm quen đức tin' },
    { name: 'Xưng Tội & Rước Lễ', levels: '1 ➔ 2', color: 'from-blue-400 to-indigo-500', desc: 'Bí tích Giao Hòa & Thánh Thể' },
    { name: 'Thêm Sức', levels: '1 ➔ 2 ➔ 3', color: 'from-rose-400 to-pink-500', desc: 'Bí tích Thêm Sức' },
    { name: 'Bao Đồng', levels: '1 ➔ 2 ➔ 3', color: 'from-emerald-400 to-teal-500', desc: 'Tuyên hứa Bao Đồng' },
    { name: 'Vào Đời', levels: '1 ➔ 2', color: 'from-purple-400 to-indigo-600', desc: 'Trưởng thành Kitô hữu' },
    { name: 'Tốt Nghiệp', levels: 'Đã Hoàn Thành', color: 'from-amber-500 to-yellow-600', desc: 'Đồng hành Giáo xứ' },
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-12 font-body">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-primary via-primary-container/80 to-tertiary-container/30 rounded-3xl p-6 sm:p-8 text-on-primary-container relative overflow-hidden shadow-lg border border-primary/20">
        <div
          className="absolute -right-10 -bottom-10 w-64 h-64 opacity-15 pointer-events-none rounded-full"
          style={{
            backgroundImage: 'radial-gradient(#87d5e8 3px, transparent 3px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Thống Quản Trị Đa Niên Khóa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight mb-2">
            Quản Lý Niên Khóa & Xét Lên Lớp Tự Động
          </h2>
          <p className="text-xs sm:text-sm text-on-primary-container/80 leading-relaxed font-medium">
            Khởi tạo năm học mới với một nút bấm. Hệ thống tự động phân loại học sinh đủ điều kiện lên lớp tiếp theo, giữ nguyên 100% học bạ và điểm số lịch sử các năm cũ.
          </p>
        </div>
      </div>

      {/* Result Notification Toast */}
      {resultMessage && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-extrabold text-emerald-900 font-sans">{resultMessage.message}</h4>
              <p className="text-xs text-emerald-800 mt-1">
                Đã phân bổ <strong>{resultMessage.promotedCount}</strong> học sinh lên lớp mới,{' '}
                <strong>{resultMessage.graduatedCount}</strong> học sinh tốt nghiệp Vào Đời 2,{' '}
                và tạo mới <strong>{resultMessage.newClassesCreated}</strong> lớp học cho niên khóa <strong>{resultMessage.toYear}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResultMessage(null)}
            className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer shadow-xs shrink-0"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Grid: Current Year Status & Multi-Year Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Promotion Engine Card */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-5">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span>Xét Lên Lớp & Bắt Đầu Niên Khóa Mới</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Tự động hóa 100%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Source Year */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <label className="text-xs font-bold text-on-surface-variant block mb-1.5">
                  1. Niên khóa hiện tại (Nguồn):
                </label>
                <select
                  value={fromYear}
                  onChange={(e) => {
                    setFromYear(e.target.value);
                    setToYear(getNextYearSuggestion(e.target.value));
                  }}
                  className="w-full p-2.5 bg-white border border-outline-variant/60 rounded-lg text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-2xs"
                >
                  {availableAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Niên khóa {yr}
                    </option>
                  ))}
                </select>
                <div className="mt-3 text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>Sĩ số: <strong>{sourceStats.totalStudents}</strong> em</span>
                  <span>Đã có điểm: <strong>{sourceStats.gradedStudents}</strong></span>
                </div>
              </div>

              {/* Target Year */}
              <div className="p-4 bg-primary-container/15 rounded-xl border border-primary/30">
                <label className="text-xs font-bold text-primary block mb-1.5">
                  2. Niên khóa kế tiếp (Đích):
                </label>
                <input
                  type="text"
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  placeholder="VD: 2027 - 2028"
                  className="w-full p-2.5 bg-white border border-primary/40 rounded-lg text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                />
                <div className="mt-3 text-[11px] text-primary/80 font-medium">
                  Học sinh "Lên lớp" sẽ được chuyển lên cấp tiếp theo.
                </div>
              </div>
            </div>

            {/* Quy tắc chuyển lớp chi tiết */}
            <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 mb-6">
              <h4 className="text-xs font-bold text-on-surface mb-2 font-sans">
                📌 Quy chế tự động hóa khi kích hoạt:
              </h4>
              <ul className="text-xs text-on-surface-variant space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Sao chép 23 lớp học</strong> sang năm mới {toYear} giữ nguyên phân phòng và ca học.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Chuyển lớp học sinh</strong>: Khai Tâm 1 ➔ 2 ➔ Xưng Tội 1 ➔ 2 ➔ Thêm Sức 1 ➔ 2 ➔ 3 ➔ Bao Đồng 1 ➔ 2 ➔ 3 ➔ Vào Đời 1 ➔ 2.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Học sinh lớp Vào Đời 2</strong>: Đổi trạng thái tốt nghiệp / hoàn tất chương trình.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Bảo toàn dữ liệu cũ</strong>: Bảng điểm năm {fromYear} được lưu trữ vĩnh viễn trong sổ học bạ.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isProcessing || !fromYear || !toYear}
              className="px-6 py-2.5 bg-primary text-white hover:bg-primary/90 font-bold rounded-full text-xs transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Khởi tạo Niên Khóa & Xét Lên Lớp</span>
            </button>
          </div>
        </div>

        {/* Right Col: Historical Academic Years & Quick Switcher */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
                <History className="w-5 h-5 text-secondary" />
                <span>Danh Sách Niên Khóa</span>
              </h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {availableAcademicYears.length} năm học
              </span>
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              Nhấp vào một năm học bên dưới để chuyển toàn bộ giao diện xem dữ liệu và bảng điểm về năm học đó:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {availableAcademicYears.map((yr) => {
                const isSelected = selectedAcademicYear === yr;
                return (
                  <div
                    key={yr}
                    onClick={() => setSelectedAcademicYear(yr)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-xs'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                          Niên khóa {yr}
                        </div>
                        <div className="text-[10px] text-on-surface-variant">
                          {isSelected ? 'Đang kích hoạt xem' : 'Nhấp để xem'}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-extrabold">
                        Hiện tại
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 mt-4 text-[11px] text-on-surface-variant text-center">
            Mọi dữ liệu trên hệ thống sẽ tự động cập nhật theo niên khóa đang chọn.
          </div>
        </div>
      </div>

      {/* Multi-Year Progression Map Visualizer */}
      <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs">
        <h3 className="text-base font-bold text-on-surface mb-2 font-sans flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span>Sơ Đồ Hành Trình Giáo Lý 10 Cấp Bậc</span>
        </h3>
        <p className="text-xs text-on-surface-variant mb-6">
          Lộ trình đào tạo xuyên suốt từ Khai Tâm đến Trưởng Thành tại Giáo xứ Sơn Lộc:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage, idx) => (
            <div
              key={stage.name}
              className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className={`w-full h-1.5 bg-gradient-to-r ${stage.color} rounded-full mb-3`}
              ></div>
              <div>
                <span className="text-[10px] font-bold text-outline">BẬC {idx + 1}</span>
                <h4 className="text-xs font-extrabold text-on-surface mt-0.5 line-clamp-1">{stage.name}</h4>
                <div className="text-[11px] font-bold text-primary mt-1">{stage.levels}</div>
                <p className="text-[10px] text-on-surface-variant mt-1.5">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-on-surface font-sans">
                Xác nhận chuyển niên khóa?
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Bạn có chắc chắn muốn khởi tạo niên khóa mới <strong>{toYear}</strong> từ niên khóa <strong>{fromYear}</strong>?
              Học sinh đạt điều kiện sẽ được tự động phân bổ lên lớp mới tương ứng.
            </p>

            <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1 text-on-surface-variant border border-outline-variant/20">
              <div>• Niên khóa nguồn: <strong className="text-primary">{fromYear}</strong></div>
              <div>• Niên khóa đích: <strong className="text-primary">{toYear}</strong></div>
              <div>• Số lượng học sinh xử lý: <strong>{students.length}</strong> em</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-surface-container text-on-surface-variant hover:text-on-surface font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handlePromote}
                disabled={isProcessing}
                className="px-5 py-2 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isProcessing ? <span>Đang xử lý...</span> : <span>Xác nhận thực hiện</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
