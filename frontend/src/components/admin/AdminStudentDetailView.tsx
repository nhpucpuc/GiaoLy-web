import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  CalendarCheck,
  MessageSquareQuote,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  UserCog,
  X,
  Save,
  CheckCircle2,
  MapPin,
  Heart,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, GradeRecord } from '../../types';
import { RankBadge } from '../shared/RankBadge';
import { GenderAvatar } from '../shared/GenderAvatar';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { formatToDDMMYYYY } from '../../utils/dateUtils';
import { api } from '../../services/api';

export const AdminStudentDetailView: React.FC = () => {
  const navigate = useNavigate();
  const {
    students,
    grades,
    attendance,
    selectedStudentId,
    classes,
    catechists,
    updateStudent,
    deleteStudent,
    getStudentTranscript
  } = useApp();

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentClass = classes.find((c) => c.id === currentStudent?.classId);
  const studentAttendance = attendance.filter((a) => a.studentId === currentStudent?.id);

  const [classGrades, setClassGrades] = useState<GradeRecord[]>([]);

  useEffect(() => {
    if (currentStudent?.classId) {
      api.getGradesByClass(currentStudent.classId)
        .then((res) => {
          if (Array.isArray(res)) setClassGrades(res);
        })
        .catch(() => {});
    }
  }, [currentStudent?.classId]);

  // Lịch sử học bạ qua các năm học
  const [transcriptList, setTranscriptList] = useState<any[]>([]);

  useEffect(() => {
    if (currentStudent?.id && getStudentTranscript) {
      getStudentTranscript(currentStudent.id)
        .then((res: any) => {
          if (res && Array.isArray(res.transcript)) {
            setTranscriptList(res.transcript);
          }
        })
        .catch(() => {});
    }
  }, [currentStudent?.id]);

  // Bảng điểm thật từ database
  const studentGradeRecord = useMemo(() => {
    if (!currentStudent) return null;
    return classGrades.find((g) => g.studentId === currentStudent.id) || grades.find((g) => g.studentId === currentStudent.id) || null;
  }, [currentStudent, classGrades, grades]);

  // Tính xếp hạng thực tế
  const studentCalculations = useMemo(() => {
    if (!studentGradeRecord) {
      return {
        hk1_tx1: null,
        hk1_tx2: null,
        hk1_thi: null,
        hk1_tb: null,
        hk2_tx1: null,
        hk2_tx2: null,
        hk2_thi: null,
        hk2_tb: null,
        tb_cn: null,
        hk1_rank: null,
        hk2_rank: null,
        cn_rank: null,
        result: 'Đang học',
        notes: currentStudent?.notes || null,
      };
    }

    const validHK1 = classGrades.filter((g) => g.hk1_tb != null).sort((a, b) => (b.hk1_tb || 0) - (a.hk1_tb || 0));
    const hk1Idx = validHK1.findIndex((g) => g.studentId === currentStudent?.id);
    const hk1_rank = studentGradeRecord.hk1_rank || (hk1Idx !== -1 ? hk1Idx + 1 : null);

    const validHK2 = classGrades.filter((g) => g.hk2_tb != null).sort((a, b) => (b.hk2_tb || 0) - (a.hk2_tb || 0));
    const hk2Idx = validHK2.findIndex((g) => g.studentId === currentStudent?.id);
    const hk2_rank = studentGradeRecord.hk2_rank || (hk2Idx !== -1 ? hk2Idx + 1 : null);

    const validCN = classGrades.filter((g) => g.tb_cn != null).sort((a, b) => (b.tb_cn || 0) - (a.tb_cn || 0));
    const cnIdx = validCN.findIndex((g) => g.studentId === currentStudent?.id);
    const cn_rank = studentGradeRecord.cn_rank || (cnIdx !== -1 ? cnIdx + 1 : null);

    return {
      hk1_tx1: studentGradeRecord.hk1_tx1,
      hk1_tx2: studentGradeRecord.hk1_tx2,
      hk1_thi: studentGradeRecord.hk1_thi,
      hk1_tb: studentGradeRecord.hk1_tb,
      hk2_tx1: studentGradeRecord.hk2_tx1,
      hk2_tx2: studentGradeRecord.hk2_tx2,
      hk2_thi: studentGradeRecord.hk2_thi,
      hk2_tb: studentGradeRecord.hk2_tb,
      tb_cn: studentGradeRecord.tb_cn,
      hk1_rank,
      hk2_rank,
      cn_rank,
      result: studentGradeRecord.result || (studentGradeRecord.tb_cn != null ? (studentGradeRecord.tb_cn >= 5.0 ? 'Lên lớp' : 'Chưa đạt') : 'Đang học'),
      notes: studentGradeRecord.notes || currentStudent?.notes || null,
    };
  }, [studentGradeRecord, classGrades, currentStudent]);

  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState<Partial<Student>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEditModal = () => {
    setStudentFormData({ ...currentStudent });
    setIsEditingModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Student = {
      ...currentStudent,
      ...studentFormData,
      fullName: studentFormData.fullName || currentStudent.fullName,
      holyName: studentFormData.holyName || currentStudent.holyName,
      gender: (studentFormData.gender as 'Nam' | 'Nữ') || currentStudent.gender,
      dob: formatToDDMMYYYY(studentFormData.dob) || currentStudent.dob,
      baptismDate: formatToDDMMYYYY(studentFormData.baptismDate),
      eucharistDate: formatToDDMMYYYY(studentFormData.eucharistDate),
      confirmationDate: formatToDDMMYYYY(studentFormData.confirmationDate),
      solemnCommunionDate: formatToDDMMYYYY(studentFormData.solemnCommunionDate),
    };

    updateStudent(updated);
    setIsEditingModalOpen(false);
    showToast(`Đã cập nhật hồ sơ em ${updated.holyName} ${updated.fullName} thành công!`);
  };

  // Xóa học sinh
  const handleDeleteStudent = async () => {
    if (!currentStudent) return;
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa học sinh "${currentStudent.holyName} ${currentStudent.fullName}" không? Dữ liệu điểm và chuyên cần liên quan cũng sẽ bị xóa vĩnh viễn.`
    );
    if (!isConfirmed) return;

    try {
      await deleteStudent(currentStudent.id);
      setIsEditingModalOpen(false);
      navigate(-1);
    } catch (err: any) {
      alert('Lỗi khi xóa học sinh: ' + (err.message || 'Không thể thực hiện!'));
    }
  };

  // Format hiển thị điểm: Nếu chưa có điểm hiển thị "—"
  const fmtScore = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return Number(val).toFixed(1).replace(/\.0$/, '');
  };

  return (
    <div className="space-y-6 pb-12 font-body">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/class-detail')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-primary hover:underline bg-surface-container-high px-3.5 py-2 rounded-xl border border-outline-variant/30 transition-all hover:bg-surface-container-highest cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lớp {currentClass?.name}</span>
        </button>

        <button
          onClick={handleOpenEditModal}
          className="px-4 py-2 bg-primary text-white hover:bg-primary-dark font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <UserCog className="w-4 h-4" />
          <span>Chỉnh sửa hồ sơ em này</span>
        </button>
      </div>

      {/* Student Profile Banner (Clean Light Style as in Image 3) */}
      <section className="bg-surface rounded-2xl border border-tertiary-fixed-dim p-6 sm:p-8 relative overflow-hidden shadow-sm">
        {/* Memphis subtle decor */}
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-primary-container/20 blur-xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            <GenderAvatar
              gender={currentStudent.gender}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-primary-container/30 shadow-md"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1 flex-wrap justify-center sm:justify-start">
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-primary font-bold text-xs">
                  {currentStudent.className}
                </span>
                <span className="text-xs text-on-surface-variant">• Giới tính: <strong>{currentStudent.gender}</strong></span>
                <span className="text-xs text-outline">• Ngày sinh: {currentStudent.dob}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
                {currentStudent.holyName} {currentStudent.fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-on-surface-variant font-body">
                <span className="font-semibold uppercase tracking-wider text-outline text-xs">
                  Phụ huynh:
                </span>
                <span className="font-bold text-on-surface">{currentStudent.parentName}</span>
                <span className="text-outline mx-1">•</span>
                <span className="font-semibold uppercase tracking-wider text-outline text-xs">
                  SĐT:
                </span>
                <span className="font-bold text-on-surface">{currentStudent.parentPhone}</span>
              </div>
            </div>
          </div>

          {/* Big Overall Grade Badge */}
          <div className="flex sm:flex-row md:flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center min-w-[150px] shadow-xs">
              <div className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">ĐTB Cả Năm (TB CN)</div>
              <div className="text-3xl sm:text-4xl font-black text-primary mt-0.5">
                {studentCalculations.tb_cn}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1">
                <RankBadge rank={studentCalculations.cn_rank} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grade Details & Conduct Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detailed Scores (ĐỒNG BỘ 100% VỚI CÁC CỘT ĐIỂM GLV) */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
              <Award className="w-5 h-5 text-primary" />
              <span>Bảng Điểm Chi Tiết Các Cột Điểm</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-medium">Hồ sơ Quản Trị Giáo Lý</span>
          </div>

          {/* ================= 1. HỌC KỲ 1 BREAKDOWN ================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>1. Điểm Học Kỳ 1</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-on-surface-variant">Xếp hạng HK1:</span>
                <RankBadge rank={studentCalculations.hk1_rank} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                <div className="text-[11px] text-on-surface-variant font-medium">KT TX1</div>
                <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentCalculations.hk1_tx1)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                <div className="text-[11px] text-on-surface-variant font-medium">KT TX2</div>
                <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentCalculations.hk1_tx2)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-primary-container/20 text-center border border-primary/30">
                <div className="text-[11px] text-primary font-bold">Thi HK1</div>
                <div className="text-xl font-extrabold text-primary mt-1">{fmtScore(studentCalculations.hk1_thi)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-primary text-white text-center shadow-md shadow-primary/20">
                <div className="text-[11px] text-primary-fixed font-bold">TB HK1</div>
                <div className="text-2xl font-black mt-1">{fmtScore(studentCalculations.hk1_tb)}</div>
              </div>
            </div>
          </div>

          {/* ================= 2. HỌC KỲ 2 BREAKDOWN ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>2. Điểm Học Kỳ 2</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-on-surface-variant">Xếp hạng HK2:</span>
                <RankBadge rank={studentCalculations.hk2_rank} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                <div className="text-[11px] text-on-surface-variant font-medium">KT TX1</div>
                <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentCalculations.hk2_tx1)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low text-center border border-outline-variant/25">
                <div className="text-[11px] text-on-surface-variant font-medium">KT TX2</div>
                <div className="text-xl font-bold text-on-surface mt-1">{fmtScore(studentCalculations.hk2_tx2)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary-container/20 text-center border border-secondary/30">
                <div className="text-[11px] text-secondary font-bold">Thi HK2</div>
                <div className="text-xl font-extrabold text-secondary mt-1">{fmtScore(studentCalculations.hk2_thi)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary text-white text-center shadow-md shadow-secondary/20">
                <div className="text-[11px] text-secondary-fixed font-bold">TB HK2</div>
                <div className="text-2xl font-black mt-1">{fmtScore(studentCalculations.hk2_tb)}</div>
              </div>
            </div>
          </div>

          {/* ================= 3. TỔNG KẾT CẢ NĂM ================= */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-3">
            <div className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>3. Tổng Kết Cả Năm</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[11px] text-on-surface-variant font-medium">ĐTB Cả Năm (TB CN)</div>
                <div className="text-2xl font-black text-primary mt-1">{fmtScore(studentCalculations.tb_cn)}</div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col items-center justify-center">
                <div className="text-[11px] text-on-surface-variant font-medium mb-1">Xếp Hạng Cả Năm (XH CN)</div>
                <RankBadge rank={studentCalculations.cn_rank} />
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[11px] text-on-surface-variant font-medium">Kết Quả Đào Tạo</div>
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                    {studentCalculations.result}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Catechist Comment */}
          <div className="p-4 rounded-xl bg-surface-container-low border-l-4 border-primary space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-primary">
              <MessageSquareQuote className="w-4 h-4" />
              <span>Lời Phê & Nhận Xét Của Giáo Lý Viên:</span>
            </div>
            <p className="text-xs text-on-surface font-body italic leading-relaxed pt-1">
              "{studentCalculations.notes || 'Em học tập rất chăm chỉ, siêng năng tham dự Thánh Lễ Chúa Nhật và lễ phép với mọi người.'}"
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <div className="font-bold text-on-surface">Rửa Tội</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.baptismDate || 'Đã lãnh nhận'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <div className="font-bold text-on-surface">Xưng Tội & Rước Lễ</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.eucharistDate || 'Đang chuẩn bị'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <div className="font-bold text-on-surface">Thêm Sức</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.confirmationDate || 'Chưa lãnh nhận'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <div className="font-bold text-on-surface">Tuyên Hứa Bao Đồng</div>
                  <div className="text-[11px] text-on-surface-variant">{currentStudent.solemnCommunionDate || 'Chưa lãnh nhận'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Attendance History */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 font-sans">
                <CalendarCheck className="w-4 h-4 text-primary" />
                <span>Chuyên Cần Đi Lễ & Học Giáo Lý</span>
              </h3>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto">
              {studentAttendance.length === 0 ? (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  Chưa có dữ liệu chuyên cần
                </div>
              ) : (
                studentAttendance.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-on-surface">{att.type}</div>
                      <div className="text-[11px] text-outline">{att.date}</div>
                    </div>
                    <div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          att.status === 'Có mặt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))
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

      {/* ================= HỌC BẠ ĐIỆN TỬ LỊCH SỬ NHIỀU NĂM (MULTI-YEAR TRANSCRIPT) ================= */}
      <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
          <div>
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2 font-sans">
              <Award className="w-5 h-5 text-primary" />
              <span>Học Bạ Điện Tử - Lịch Sử Đào Tạo Qua Các Niên Khóa</span>
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Hành trình học tập và kết quả điểm số qua từng năm học của em {currentStudent.holyName} {currentStudent.fullName}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 self-start sm:self-auto">
            {transcriptList.length > 0 ? `${transcriptList.length} năm học` : 'Niên khóa 2026 - 2027'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface font-semibold">
                <th className="p-3 text-center w-12">STT</th>
                <th className="p-3">Niên Khóa</th>
                <th className="p-3">Lớp Học</th>
                <th className="p-3 text-center">TB HK1</th>
                <th className="p-3 text-center">TB HK2</th>
                <th className="p-3 text-center font-bold text-primary">TB Cả Năm</th>
                <th className="p-3 text-center">Xếp Hạng</th>
                <th className="p-3 text-center">Kết Quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {transcriptList.length === 0 ? (
                <tr>
                  <td className="p-3 text-center font-medium text-outline">1</td>
                  <td className="p-3 font-bold text-primary">2026 - 2027</td>
                  <td className="p-3 font-semibold text-on-surface">{currentClass?.name || '—'}</td>
                  <td className="p-3 text-center font-semibold">{fmtScore(studentGradeRecord?.hk1_tb)}</td>
                  <td className="p-3 text-center font-semibold">{fmtScore(studentGradeRecord?.hk2_tb)}</td>
                  <td className="p-3 text-center font-black text-primary text-sm">{fmtScore(studentGradeRecord?.tb_cn)}</td>
                  <td className="p-3 text-center"><RankBadge rank={studentCalculations.cn_rank} /></td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {studentCalculations.result || 'Đang theo học'}
                    </span>
                  </td>
                </tr>
              ) : (
                transcriptList.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-3 text-center font-medium text-outline">{idx + 1}</td>
                    <td className="p-3 font-bold text-primary">{item.academicYear}</td>
                    <td className="p-3 font-semibold text-on-surface">{item.className}</td>
                    <td className="p-3 text-center font-semibold">{item.hk1_tb !== null ? item.hk1_tb : '—'}</td>
                    <td className="p-3 text-center font-semibold">{item.hk2_tb !== null ? item.hk2_tb : '—'}</td>
                    <td className="p-3 text-center font-black text-primary text-sm">{item.tb_cn !== null ? item.tb_cn : '—'}</td>
                    <td className="p-3 text-center"><RankBadge rank={item.cn_rank} /></td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.result === 'Lên lớp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.result === 'Chưa đạt'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {item.result || 'Đang theo học'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL CHỈNH SỬA HỒ SƠ HỌC SINH ================= */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-fadeIn my-8">
            <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-container p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-sans">Chỉnh Sửa Hồ Sơ Học Sinh (Ban Giáo Lý)</h3>
                  <p className="text-xs text-primary-fixed">
                    {currentStudent.holyName} {currentStudent.fullName} ({currentStudent.className})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Tên Thánh</label>
                  <input
                    type="text"
                    value={studentFormData.holyName || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, holyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-semibold text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="VD: Maria, Giuse..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Họ và Tên</label>
                  <input
                    type="text"
                    value={studentFormData.fullName || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-semibold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Họ và tên học sinh"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Giới Tính</label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-on-surface">
                      <input
                        type="radio"
                        name="gender"
                        value="Nam"
                        checked={studentFormData.gender === 'Nam'}
                        onChange={() => setStudentFormData({ ...studentFormData, gender: 'Nam' })}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Nam</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-on-surface">
                      <input
                        type="radio"
                        name="gender"
                        value="Nữ"
                        checked={studentFormData.gender === 'Nữ'}
                        onChange={() => setStudentFormData({ ...studentFormData, gender: 'Nữ' })}
                        className="text-primary focus:ring-primary"
                      />
                      <span>Nữ</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Ngày Sinh (dd-mm-yyyy)</label>
                  <input
                    type="text"
                    placeholder="dd-mm-yyyy (VD: 15-04-2019)"
                    value={studentFormData.dob || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dob: e.target.value })}
                    onBlur={(e) => setStudentFormData({ ...studentFormData, dob: formatToDDMMYYYY(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Họ Tên Phụ Huynh</label>
                  <input
                    type="text"
                    value={studentFormData.parentName || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={studentFormData.parentPhone || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-on-surface mb-1">Địa Chỉ Gia Đình</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentFormData.address || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Số nhà, đường, thôn/xóm..."
                  />
                  <MapPin className="w-4 h-4 text-outline absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/30">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Hồ Sơ Các Bí Tích</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Ngày Rửa Tội (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      value={studentFormData.baptismDate || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, baptismDate: e.target.value })}
                      onBlur={(e) => setStudentFormData({ ...studentFormData, baptismDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Xưng Tội &amp; Rước Lễ (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      value={studentFormData.eucharistDate || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, eucharistDate: e.target.value })}
                      onBlur={(e) => setStudentFormData({ ...studentFormData, eucharistDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-on-surface-variant mb-1">Ngày Thêm Sức (dd-mm-yyyy)</label>
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      value={studentFormData.confirmationDate || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, confirmationDate: e.target.value })}
                      onBlur={(e) => setStudentFormData({ ...studentFormData, confirmationDate: formatToDDMMYYYY(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  className="px-4 py-2.5 rounded-full text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-red-200 dark:border-red-800/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa học sinh</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
