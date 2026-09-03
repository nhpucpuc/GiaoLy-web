import React, { useState, useEffect } from 'react';
import { Award, X, BookOpen, GraduationCap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { RankBadge } from './RankBadge';

interface StudentTranscriptModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentTranscriptModal: React.FC<StudentTranscriptModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  const { getStudentTranscript, classes, grades } = useApp();
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const currentClass = classes.find((c) => c.id === student?.classId);
  const currentGrade = grades.find((g) => g.studentId === student?.id);

  useEffect(() => {
    if (isOpen && student) {
      setIsLoading(true);
      if (getStudentTranscript) {
        getStudentTranscript(student.id)
          .then((res: any) => {
            if (res && Array.isArray(res.transcript)) {
              setTranscriptData(res.transcript);
            } else {
              setTranscriptData([]);
            }
          })
          .catch(() => {
            setTranscriptData([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-body animate-fadeIn">
      <div className="bg-surface w-full max-w-3xl rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-container p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg font-sans">Sổ Học Bạ Điện Tử - Quá Trình Đào Tạo</h3>
              <p className="text-xs text-primary-fixed">
                Hồ sơ giáo lý chính thức của Ban Giáo Lý Giáo Xứ Sơn Lộc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Student Info Card */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {student.className || currentClass?.name || 'Lớp Giáo Lý'}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  Giới tính: <strong>{student.gender}</strong>
                </span>
                <span className="text-xs text-outline">• Ngày sinh: {student.dob || '—'}</span>
              </div>
              <h4 className="text-xl font-black text-primary font-sans">
                {student.holyName} {student.fullName}
              </h4>
              <div className="text-xs text-on-surface-variant flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
                <span>Phụ huynh: <strong className="text-on-surface">{student.parentName || '—'}</strong></span>
                <span>•</span>
                <span>SĐT: <strong className="text-on-surface">{student.parentPhone || '—'}</strong></span>
                <span>•</span>
                <span>Địa chỉ: <strong className="text-on-surface">{student.address || 'GX Sơn Lộc'}</strong></span>
              </div>
            </div>
          </div>

          {/* Bí Tích Đã Lãnh Nhận */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Hồ Sơ Các Bí Tích Đã Lãnh Nhận</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[10px] text-outline font-bold uppercase">1. Rửa Tội</div>
                <div className="font-bold text-on-surface mt-0.5">{student.baptismDate || 'Đã lãnh nhận'}</div>
                <div className="text-[10px] text-on-surface-variant">{student.baptismPlace || 'GX Sơn Lộc'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[10px] text-outline font-bold uppercase">2. Xưng Tội - Rước Lễ</div>
                <div className="font-bold text-on-surface mt-0.5">{student.eucharistDate || 'Đang theo học'}</div>
                <div className="text-[10px] text-on-surface-variant">{student.eucharistPlace || 'GX Sơn Lộc'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[10px] text-outline font-bold uppercase">3. Thêm Sức</div>
                <div className="font-bold text-on-surface mt-0.5">{student.confirmationDate || 'Chưa lãnh nhận'}</div>
                <div className="text-[10px] text-on-surface-variant">{student.confirmationPlace || '—'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
                <div className="text-[10px] text-outline font-bold uppercase">4. Tuyên Hứa Bao Đồng</div>
                <div className="font-bold text-on-surface mt-0.5">{student.solemnCommunionDate || 'Chưa lãnh nhận'}</div>
                <div className="text-[10px] text-on-surface-variant">{student.solemnCommunionPlace || '—'}</div>
              </div>
            </div>
          </div>

          {/* Multi-Year Transcript History Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Kết Quả Đào Tạo Qua Các Niên Khóa</span>
              </h5>
              <span className="text-[11px] font-semibold text-primary">
                {transcriptData.length > 0 ? `${transcriptData.length} năm học` : 'Niên khóa 2026 - 2027'}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/40 text-on-surface font-semibold">
                    <th className="p-2.5 text-center w-12">STT</th>
                    <th className="p-2.5">Niên Khóa</th>
                    <th className="p-2.5">Lớp Học</th>
                    <th className="p-2.5 text-center">TB HK1</th>
                    <th className="p-2.5 text-center">TB HK2</th>
                    <th className="p-2.5 text-center font-bold text-primary">TB Cả Năm</th>
                    <th className="p-2.5 text-center">Xếp Hạng</th>
                    <th className="p-2.5 text-center">Kết Quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-on-surface-variant">
                        Đang tải lịch sử học bạ...
                      </td>
                    </tr>
                  ) : transcriptData.length === 0 ? (
                    <tr>
                      <td className="p-2.5 text-center font-medium text-outline">1</td>
                      <td className="p-2.5 font-bold text-primary">2026 - 2027</td>
                      <td className="p-2.5 font-semibold text-on-surface">{student.className || currentClass?.name || '—'}</td>
                      <td className="p-2.5 text-center font-semibold">{currentGrade?.hk1_tb ?? '—'}</td>
                      <td className="p-2.5 text-center font-semibold">{currentGrade?.hk2_tb ?? '—'}</td>
                      <td className="p-2.5 text-center font-black text-primary text-sm">{currentGrade?.tb_cn ?? '—'}</td>
                      <td className="p-2.5 text-center"><RankBadge rank={currentGrade?.cn_rank} /></td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {currentGrade?.result || 'Đang theo học'}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    transcriptData.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-2.5 text-center font-medium text-outline">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-primary">{item.academicYear}</td>
                        <td className="p-2.5 font-semibold text-on-surface">{item.className}</td>
                        <td className="p-2.5 text-center font-semibold">{item.hk1_tb !== null ? item.hk1_tb : '—'}</td>
                        <td className="p-2.5 text-center font-semibold">{item.hk2_tb !== null ? item.hk2_tb : '—'}</td>
                        <td className="p-2.5 text-center font-black text-primary text-sm">{item.tb_cn !== null ? item.tb_cn : '—'}</td>
                        <td className="p-2.5 text-center"><RankBadge rank={item.cn_rank} /></td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              item.result === 'Lên lớp'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.result === 'Chưa đạt'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="text-xs text-on-surface-variant">
            Xác nhận bởi: <strong>Ban Giáo Lý Giáo Xứ Sơn Lộc</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
