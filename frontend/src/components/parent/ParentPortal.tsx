import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  CalendarCheck,
  MessageSquareQuote,
  TrendingUp,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentTranscriptModal } from '../shared/StudentTranscriptModal';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { api } from '../../services/api';
import { GradeRecord } from '../../types';

export const ParentPortal: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    classes,
    catechists,
    selectedAcademicYear
  } = useApp();

  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code') || searchParams.get('id');

  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [classGrades, setClassGrades] = useState<GradeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Học sinh đang được hiển thị (Ưu tiên theo code trên URL -> theo selectedStudentId trong session)
  const currentStudent = useMemo(() => {
    if (students.length === 0) return null;

    if (codeParam) {
      const match = students.find(
        (s) =>
          (s.code && s.code.toLowerCase() === codeParam.toLowerCase()) ||
          s.id.toLowerCase() === codeParam.toLowerCase()
      );
      if (match) return match;
    }

    if (selectedStudentId) {
      const match = students.find((s) => s.id === selectedStudentId);
      if (match) return match;
    }

    return null;
  }, [students, codeParam, selectedStudentId]);

  // Đồng bộ lại selectedStudentId nếu tìm thấy qua URL
  useEffect(() => {
    if (currentStudent && currentStudent.id !== selectedStudentId) {
      setSelectedStudentId(currentStudent.id);
    }
  }, [currentStudent?.id]);
  const currentClass = currentStudent ? classes.find((c) => c.id === currentStudent.classId) : null;

  // Tải dữ liệu điểm & chuyên cần thật từ PostgreSQL Backend
  useEffect(() => {
    if (!currentStudent) return;

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      currentStudent.classId ? api.getGradesByClass(currentStudent.classId).catch(() => []) : Promise.resolve([]),
      api.getAttendanceByStudent(currentStudent.id).catch(() => []),
    ])
      .then(([gradesRes, attendanceRes]) => {
        if (!isMounted) return;
        setClassGrades(Array.isArray(gradesRes) ? gradesRes : []);
        setAttendanceRecords(Array.isArray(attendanceRes) ? attendanceRes : []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentStudent?.id, currentStudent?.classId]);

  // Tìm bảng điểm thực tế của học sinh này từ Database
  const studentGradeRecord = useMemo(() => {
    if (!currentStudent || classGrades.length === 0) return null;
    return classGrades.find((g) => g.studentId === currentStudent.id) || null;
  }, [currentStudent, classGrades]);

  // Tính xếp hạng thực tế trong lớp dựa trên dữ liệu thật
  const rankInfo = useMemo(() => {
    if (!studentGradeRecord || classGrades.length === 0) {
      return { hk1_rank: null, hk2_rank: null, cn_rank: null };
    }

    // Xếp hạng HK1
    const validHK1 = classGrades.filter((g) => g.hk1_tb != null).sort((a, b) => (b.hk1_tb || 0) - (a.hk1_tb || 0));
    const hk1Idx = validHK1.findIndex((g) => g.studentId === currentStudent?.id);
    const hk1_rank = studentGradeRecord.hk1_rank || (hk1Idx !== -1 ? hk1Idx + 1 : null);

    // Xếp hạng HK2
    const validHK2 = classGrades.filter((g) => g.hk2_tb != null).sort((a, b) => (b.hk2_tb || 0) - (a.hk2_tb || 0));
    const hk2Idx = validHK2.findIndex((g) => g.studentId === currentStudent?.id);
    const hk2_rank = studentGradeRecord.hk2_rank || (hk2Idx !== -1 ? hk2Idx + 1 : null);

    // Xếp hạng Cả Năm
    const validCN = classGrades.filter((g) => g.tb_cn != null).sort((a, b) => (b.tb_cn || 0) - (a.tb_cn || 0));
    const cnIdx = validCN.findIndex((g) => g.studentId === currentStudent?.id);
    const cn_rank = studentGradeRecord.cn_rank || (cnIdx !== -1 ? cnIdx + 1 : null);

    return { hk1_rank, hk2_rank, cn_rank };
  }, [studentGradeRecord, classGrades, currentStudent]);

  if (students.length === 0) {
    return (
      <div className="bg-surface rounded-3xl border border-outline-variant/30 p-12 text-center shadow-xs animate-fadeIn space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-on-surface font-sans">Đang tải dữ liệu học sinh...</h3>
          <p className="text-xs text-on-surface-variant">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="bg-surface rounded-3xl border border-outline-variant/30 p-12 text-center shadow-xs animate-fadeIn space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-on-surface font-sans">Không tìm thấy thông tin học sinh</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Vui lòng nhập lại Mã số học sinh trên Trang chủ để tra cứu.
          </p>
        </div>
      </div>
    );
  }

  // Format hiển thị điểm: Nếu chưa có điểm hiển thị "—"
  const fmtScore = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(1).replace(/\.0$/, '');
  };

  const tbCN = studentGradeRecord?.tb_cn != null ? fmtScore(studentGradeRecord.tb_cn) : '—';
  const resultText = studentGradeRecord?.result || (studentGradeRecord?.tb_cn != null ? (studentGradeRecord.tb_cn >= 5.0 ? 'Lên lớp' : 'Chưa đạt') : 'Đang học');

  return (
    <div className="space-y-6 pb-12 font-body max-w-6xl mx-auto">
      {/* Student Profile Banner */}
      <section className="bg-surface rounded-2xl border border-outline-variant/30 p-6 sm:p-7 relative overflow-hidden shadow-xs animate-fadeIn">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-container/20 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap justify-center sm:justify-start">
                {currentStudent.code && (
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-white font-mono text-xs font-extrabold shadow-2xs">
                    Mã: #{currentStudent.code}
                  </span>
                )}
                <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  Lớp {currentStudent.className || currentClass?.name}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">• Giới tính: <strong>{currentStudent.gender}</strong></span>
                <span className="text-xs text-outline">• Ngày sinh: {currentStudent.dob}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-primary font-sans">
                {currentStudent.holyName} {currentStudent.fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-body">
                <span className="font-semibold uppercase tracking-wider text-outline text-xs">Phụ huynh:</span>
                <span className="font-bold text-on-surface">{currentStudent.parentName || 'Gia đình'}</span>
                <span className="text-outline mx-1">•</span>
                <span className="font-semibold uppercase tracking-wider text-outline text-xs">SĐT:</span>
                <span className="font-bold text-on-surface">{currentStudent.parentPhone || 'Chưa cập nhật'}</span>
                {currentStudent.parishSubdivision && (
                  <>
                    <span className="text-outline mx-1">•</span>
                    <span className="font-semibold text-primary">Giáo khu: {currentStudent.parishSubdivision}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Nút Xem Học Bạ & Điểm Tổng Kết */}
          <div className="flex flex-col items-center sm:items-end justify-center gap-3 shrink-0">
            <button
              onClick={() => setIsTranscriptOpen(true)}
              className="px-5 py-2.5 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold text-xs shadow-sm hover:shadow hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
              title="Mở Sổ Học Bạ Điện Tử toàn khóa của học sinh"
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 Xem Sổ Học Bạ Điện Tử</span>
            </button>

            <div className="p-3 px-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center min-w-[150px] shadow-2xs">
              <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">ĐTB Cả Năm (TB CN)</div>
              <div className="text-3xl font-black text-primary mt-0.5">
                {tbCN}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grade Details & Conduct Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
        {/* Left: Detailed Scores */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
              <Award className="w-5 h-5 text-primary" />
              <span>Bảng Điểm Chi Tiết Các Cột Điểm</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Niên khóa {currentClass?.academicYear || selectedAcademicYear}</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span>Đang tải bảng điểm thực tế từ cơ sở dữ liệu...</span>
            </div>
          ) : (
            <>
              {/* 1. HỌC KỲ 1 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span>1. Điểm Học Kỳ 1</span>
                  </div>
                  {rankInfo.hk1_rank && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      Hạng {rankInfo.hk1_rank} trong lớp
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                    <div className="text-[11px] text-on-surface-variant font-medium">KT TX1</div>
                    <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentGradeRecord?.hk1_tx1)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                    <div className="text-[11px] text-on-surface-variant font-medium">KT TX2</div>
                    <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentGradeRecord?.hk1_tx2)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-primary-container/20 text-center border border-primary/30">
                    <div className="text-[11px] text-primary font-bold">Thi HK1</div>
                    <div className="text-xl font-extrabold text-primary mt-1">{fmtScore(studentGradeRecord?.hk1_thi)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-primary text-white text-center shadow-md shadow-primary/20">
                    <div className="text-[11px] text-primary-fixed font-bold">TB HK1</div>
                    <div className="text-2xl font-black mt-1">{fmtScore(studentGradeRecord?.hk1_tb)}</div>
                  </div>
                </div>
              </div>

              {/* 2. HỌC KỲ 2 */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span>2. Điểm Học Kỳ 2</span>
                  </div>
                  {rankInfo.hk2_rank && (
                    <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full border border-secondary/20">
                      Hạng {rankInfo.hk2_rank} trong lớp
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                    <div className="text-[11px] text-on-surface-variant font-medium">KT TX1</div>
                    <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentGradeRecord?.hk2_tx1)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                    <div className="text-[11px] text-on-surface-variant font-medium">KT TX2</div>
                    <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentGradeRecord?.hk2_tx2)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-secondary-container/20 text-center border border-secondary/30">
                    <div className="text-[11px] text-secondary font-bold">Thi HK2</div>
                    <div className="text-xl font-extrabold text-secondary mt-1">{fmtScore(studentGradeRecord?.hk2_thi)}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-secondary text-white text-center shadow-md shadow-secondary/20">
                    <div className="text-[11px] text-secondary-fixed font-bold">TB HK2</div>
                    <div className="text-2xl font-black mt-1">{fmtScore(studentGradeRecord?.hk2_tb)}</div>
                  </div>
                </div>
              </div>

              {/* 3. TỔNG KẾT CẢ NĂM */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                <div className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>3. Tổng Kết Cả Năm</span>
                  </div>
                  {rankInfo.cn_rank && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Xếp hạng Cả Năm: #{rankInfo.cn_rank}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                    <div className="text-[11px] text-on-surface-variant font-medium">ĐTB Cả Năm (TB CN)</div>
                    <div className="text-2xl font-black text-primary mt-1">{tbCN}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                    <div className="text-[11px] text-on-surface-variant font-medium">Kết Quả Đào Tạo</div>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                        resultText === 'Lên lớp'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : resultText === 'Chưa đạt'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-surface-container text-on-surface border border-outline-variant/40'
                      }`}>
                        {resultText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Catechist Comment */}
          <div className="p-4 rounded-xl bg-surface-container-low border-l-4 border-primary space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-primary">
              <MessageSquareQuote className="w-4 h-4" />
              <span>Lời Phê &amp; Nhận Xét Của Giáo Lý Viên:</span>
            </div>
            <p className="text-xs text-on-surface font-body italic leading-relaxed pt-1">
              &quot;{studentGradeRecord?.notes || currentStudent.notes || 'Em học tập chăm chỉ, siêng năng tham dự Thánh Lễ Chúa Nhật và lễ phép với mọi người.'}&quot;
            </p>
            <div className="text-[11px] text-on-surface-variant text-right font-medium">
              - GLV Phụ trách: {getFullCatechistNames(currentClass, catechists)}
            </div>
          </div>

          {/* Bí tích đã lãnh nhận */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Hồ Sơ Bí Tích Đã Lãnh Nhận</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">1</div>
                <div>
                  <div className="font-bold text-on-surface">Rửa Tội</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.baptismDate || 'Đã lãnh nhận'}</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">2</div>
                <div>
                  <div className="font-bold text-on-surface">Xưng Tội &amp; Rước Lễ</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.eucharistDate || 'Đang chuẩn bị'}</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">3</div>
                <div>
                  <div className="font-bold text-on-surface">Thêm Sức</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.confirmationDate || 'Chưa lãnh nhận'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Attendance History */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span>Chuyên Cần &amp; Ngày Nghỉ Giáo Lý</span>
              </h3>
            </div>
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant space-y-2">
                  <AlertCircle className="w-6 h-6 text-outline mx-auto" />
                  <p>Đang trong quá trình ghi nhận chuyên cần các buổi học.</p>
                </div>
              ) : (
                attendanceRecords.map((att) => {
                  const isPresent = att.status === 'CO_MAT' || att.status === 'Có mặt';
                  const isPermitted = att.status === 'VANG_CO_PHEP' || att.status === 'Vắng có phép';
                  const statusLabel = isPresent ? 'Có mặt' : isPermitted ? 'Vắng có phép' : 'Vắng không phép';
                  const statusBadgeClass = isPresent ? 'bg-emerald-100 text-emerald-800' : isPermitted ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

                  return (
                    <div key={att.id} className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-on-surface">Buổi học ngày {att.date}</div>
                        {att.notes && <div className="text-[11px] text-on-surface-variant italic mt-0.5">• {att.notes}</div>}
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-high/60 text-xs text-on-surface-variant font-body">
            <div className="font-bold text-on-surface mb-1">Công thức tính điểm chuẩn:</div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              • <strong>TB HK</strong> = ((KT TX1 + KT TX2) / 2 + Thi HK) / 2<br />
              • <strong>TB CN</strong> = (TB HK1 + TB HK2) / 2
            </p>
          </div>
        </div>
      </div>

      {/* SỔ HỌC BẠ ĐIỆN TỬ MODAL */}
      <StudentTranscriptModal
        student={currentStudent}
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
      />
    </div>
  );
};
