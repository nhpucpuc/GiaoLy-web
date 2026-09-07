import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Church,
  User,
  Calendar,
  Droplets,
  School,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  HeartHandshake,
  Flame,
  Cross,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getFullCatechistNames } from '../../utils/catechistHelper';
import { formatToDDMMYYYY, parseDateParts } from '../../utils/dateUtils';
import { GenderAvatar } from '../shared/GenderAvatar';

export const AddStudentView: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole, currentUser, classes, catechists, addStudent, setSelectedClassId } = useApp();

  // Xác định lớp của GLV (nếu là role catechist)
  const catechistAssignedClass = classes.find(
    (c) => c.id === currentUser?.assignedClassId
  ) || classes[0];

  const defaultClassId = currentRole === 'catechist'
    ? (catechistAssignedClass?.id || '')
    : (classes[0]?.id || '');

  const [formData, setFormData] = useState({
    // 1. Cá nhân
    holyName: 'Giuse',
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '01-01-2016',
    pob: '',
    parishSubdivision: 'Mẹ Lên Trời',
    address: '',
    
    // 2. Lớp
    classId: defaultClassId,

    // 3. Bí tích
    baptismDate: '',
    baptismPlace: 'Giáo xứ Sơn Lộc',
    eucharistDate: '',
    eucharistPlace: 'Giáo xứ Sơn Lộc',
    confirmationDate: '',
    confirmationPlace: 'Giáo xứ Sơn Lộc',
    solemnCommunionDate: '',
    solemnCommunionPlace: 'Giáo xứ Sơn Lộc',

    // 4. Gia đình & Phụ huynh
    fatherHolyName: 'Giuse',
    fatherName: '',
    fatherPhone: '',
    motherHolyName: 'Maria',
    motherName: '',
    motherPhone: '',
    parentName: '',
    parentPhone: '',
    notes: ''
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudentCode, setCreatedStudentCode] = useState('');

  // Trạng thái kiểm tra trùng lặp
  const [duplicateStudents, setDuplicateStudents] = useState<any[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Tự động gán lớp cho GLV hoặc chọn lớp đầu tiên cho Admin
  useEffect(() => {
    if (currentRole === 'catechist' && catechistAssignedClass) {
      setFormData((prev) => ({ ...prev, classId: catechistAssignedClass.id }));
    } else if (currentRole === 'admin' && classes.length > 0 && !formData.classId) {
      setFormData((prev) => ({ ...prev, classId: classes[0].id }));
    }
  }, [currentRole, currentUser, classes]);

  // Tự động điền phụ huynh đại diện khi nhập cha hoặc mẹ nếu chưa có
  const handleFatherNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      fatherName: val,
      parentName: prev.parentName ? prev.parentName : val
    }));
  };

  const handleFatherPhoneChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      fatherPhone: val,
      parentPhone: prev.parentPhone ? prev.parentPhone : val
    }));
  };

  const handleMotherNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      motherName: val,
      parentName: prev.parentName ? prev.parentName : val
    }));
  };

  const handleMotherPhoneChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      motherPhone: val,
      parentPhone: prev.parentPhone ? prev.parentPhone : val
    }));
  };

  // Hàm thực thi tạo học sinh vào CSDL
  const executeAddStudent = async () => {
    setIsDuplicateModalOpen(false);
    const selectedCls = classes.find((c) => c.id === formData.classId);
    const finalParentName = formData.parentName.trim() || formData.fatherName.trim() || formData.motherName.trim() || 'Phụ huynh học sinh';
    const finalParentPhone = formData.parentPhone.trim() || formData.fatherPhone.trim() || formData.motherPhone.trim() || '0900 000 000';
    const finalAddress = formData.address.trim() || 'Giáo xứ Sơn Lộc';

    const newStudent: Omit<Student, 'id'> = {
      ...formData,
      parentName: finalParentName,
      parentPhone: finalParentPhone,
      address: finalAddress,
      className: selectedCls?.name || 'Chưa phân lớp',
      status: 'Đang học'
    };

    const res = await addStudent(newStudent);
    if (res && res.code) {
      setCreatedStudentCode(res.code);
    }
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      if (currentRole === 'catechist') {
        navigate('/glyvien/tong-quan');
      } else {
        setSelectedClassId(formData.classId);
        navigate('/admin/class-detail');
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Vui lòng điền đầy đủ Họ và tên học sinh!');
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      // 1. Quét tìm các học sinh có cùng tên trong hệ thống (API tìm kiếm)
      const existingStudents = await api.getStudents(undefined, formData.fullName.trim());
      const inputDobParts = parseDateParts(formData.dob);
      const normalizedInputName = formData.fullName.trim().toLowerCase().replace(/\s+/g, ' ');

      // 2. So khớp chính xác: Cùng Họ Tên & Cùng Ngày sinh
      const duplicates = (existingStudents || []).filter((s: any) => {
        if (!s.fullName) return false;
        const sName = s.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
        if (sName !== normalizedInputName) return false;

        const sDobParts = parseDateParts(s.dob);
        if (inputDobParts && sDobParts) {
          return (
            inputDobParts.day === sDobParts.day &&
            inputDobParts.month === sDobParts.month &&
            inputDobParts.year === sDobParts.year
          );
        }
        return s.dob === formData.dob;
      });

      // 3. Nếu phát hiện có học sinh trùng lặp -> Mở popup cảnh báo
      if (duplicates.length > 0) {
        setDuplicateStudents(duplicates);
        setIsDuplicateModalOpen(true);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra trùng lặp học sinh:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }

    // Nếu không trùng, tiến hành lưu ngay
    await executeAddStudent();
  };

  const selectedClassInfo = classes.find((c) => c.id === formData.classId);

  return (
    <div className="pb-16 max-w-5xl mx-auto font-body">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-primary-container text-primary font-bold text-xs">
              {currentRole === 'admin' ? 'Quyền Quản Trị Viên' : 'Quyền Giáo Lý Viên'}
            </span>
            <span className="text-xs text-on-surface-variant">• Năm học 2026 - 2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
            Thêm Học Sinh Mới
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Điền đầy đủ thông tin lý lịch cá nhân, hồ sơ các Bí tích và gia đình học viên.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(currentRole === 'catechist' ? '/glyvien/tong-quan' : '/admin/dashboard')}
          className="self-start sm:self-auto px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl border border-outline-variant/30 transition-all cursor-pointer"
        >
          Quay lại
        </button>
      </div>

      {/* Main Form Container */}
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background gradient accents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none"></div>

        {isSuccess ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface font-sans">Tiếp Nhận Học Sinh Thành Công!</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Học sinh <span className="font-bold text-primary">{formData.holyName} {formData.fullName}</span> đã được lưu vào hệ thống{' '}
              {createdStudentCode && (
                <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary font-mono font-bold rounded-md">
                  Mã số: #{createdStudentCode}
                </span>
              )}
            </p>
            <p className="text-xs text-outline">Đang chuyển hướng về trang danh sách lớp...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8 text-xs">
            
            {/* ========================================================================= */}
            {/* KHỐI 1: LỚP GIÁO LÝ PHỤ TRÁCH (Phân quyền Admin vs GLV) */}
            {/* ========================================================================= */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <School className="w-5 h-5 text-primary" />
                <span>1. Lớp Giáo Lý Tiếp Nhận</span>
              </div>

              {currentRole === 'catechist' ? (
                // Role Giáo lý viên: Khóa cứng lớp phụ trách, không cho chọn lớp khác
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-primary text-white rounded-xl shadow-sm shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                          Lớp Phụ Trách Của Bạn
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-primary-container text-primary font-bold text-[10px]">
                          Khóa cố định
                        </span>
                      </div>
                      <h4 className="text-lg font-extrabold text-on-surface">
                        {selectedClassInfo?.name || catechistAssignedClass?.name || 'Chưa phân lớp'}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        GLV: <span className="font-semibold text-on-surface">{getFullCatechistNames(selectedClassInfo || catechistAssignedClass, catechists)}</span> • {selectedClassInfo?.schedule}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-outline italic self-end sm:self-center">
                    (Giáo lý viên tự động thêm học sinh vào đúng lớp mình giảng huấn)
                  </div>
                </div>
              ) : (
                // Role Admin: Cho phép chọn lớp tùy ý từ danh sách tất cả các lớp
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Chọn lớp tiếp nhận học sinh (*):
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                      <select
                        required
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary font-bold text-xs text-on-surface transition-all cursor-pointer shadow-2xs"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} — {cls.session === 'Tối' ? 'Ca Tối' : 'Ca Sáng'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedClassInfo && (
                    <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/20 text-xs">
                      <div className="font-bold text-primary">{selectedClassInfo.name}</div>
                      <div className="text-on-surface-variant text-[11px]">
                        GLV: {getFullCatechistNames(selectedClassInfo, catechists)} • {selectedClassInfo.schedule}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* KHỐI 2: THÔNG TIN CÁ NHÂN HỌC SINH */}
            {/* ========================================================================= */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <User className="w-5 h-5 text-primary" />
                <span>2. Thông Tin Cá Nhân Học Sinh</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tên thánh */}
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Tên thánh (*)</label>
                  <div className="relative">
                    <Church className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Giuse, Maria, Phêrô..."
                      value={formData.holyName}
                      onChange={(e) => setFormData({ ...formData, holyName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Họ và tên (*)</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn An"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Giới tính (*)</label>
                  <div className="grid grid-cols-2 gap-2 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nam' })}
                      className={`rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        formData.gender === 'Nam'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nữ' })}
                      className={`rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        formData.gender === 'Nữ'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Ngày sinh (*) (dd-mm-yyyy)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="dd-mm-yyyy (VD: 15-04-2019)"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, dob: formatToDDMMYYYY(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Nơi sinh */}
                <div>
                  <label className="block font-semibold text-on-surface mb-1">Nơi sinh</label>
                  <input
                    type="text"
                    placeholder="VD: Củ Chi, TP.HCM, Nghệ An..."
                    value={formData.pob}
                    onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs"
                  />
                </div>

                  {/* Giáo khu */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">Giáo khu</label>
                    <select
                      value={formData.parishSubdivision}
                      onChange={(e) => setFormData({ ...formData, parishSubdivision: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs cursor-pointer"
                    >
                      <option value="Mẹ Lên Trời">Giáo khu Mẹ Lên Trời</option>
                      <option value="Mẹ Thiên Chúa">Giáo khu Mẹ Thiên Chúa</option>
                      <option value="Mẹ Mân Côi">Giáo khu Mẹ Mân Côi</option>
                      <option value="Mẹ Fatima">Giáo khu Mẹ Fatima</option>
                    </select>
                  </div>

                {/* Chỗ ở hiện tại */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block font-semibold text-on-surface mb-1">Chỗ ở hiện tại (*)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="VD: 15A Đường 74A, Ấp Đình, xã Tân Phú Trung, Củ Chi, TP.HCM"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* KHỐI 3: HỒ SƠ CÁC BÍ TÍCH KHAI TÂM */}
            {/* ========================================================================= */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>3. Hồ Sơ Các Bí Tích Khai Tâm</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Bí tích Rửa Tội */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <span>Bí tích Rửa Tội</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Ngày Rửa tội (dd-mm-yyyy):</label>
                      <input
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formData.baptismDate}
                        onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, baptismDate: formatToDDMMYYYY(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Tại giáo xứ:</label>
                      <input
                        type="text"
                        placeholder="VD: Giáo xứ Sơn Lộc"
                        value={formData.baptismPlace}
                        onChange={(e) => setFormData({ ...formData, baptismPlace: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Bí tích Rước Lễ Lần Đầu */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Cross className="w-4 h-4 text-amber-600" />
                    <span>Bí tích Rước Lễ Lần Đầu</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Ngày RLLĐ (dd-mm-yyyy):</label>
                      <input
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formData.eucharistDate}
                        onChange={(e) => setFormData({ ...formData, eucharistDate: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, eucharistDate: formatToDDMMYYYY(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Tại giáo xứ:</label>
                      <input
                        type="text"
                        placeholder="VD: Giáo xứ Sơn Lộc"
                        value={formData.eucharistPlace}
                        onChange={(e) => setFormData({ ...formData, eucharistPlace: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Bí tích Thêm Sức */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Bí tích Thêm Sức</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Ngày Thêm sức (dd-mm-yyyy):</label>
                      <input
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formData.confirmationDate}
                        onChange={(e) => setFormData({ ...formData, confirmationDate: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, confirmationDate: formatToDDMMYYYY(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Tại giáo xứ:</label>
                      <input
                        type="text"
                        placeholder="VD: Giáo xứ Sơn Lộc"
                        value={formData.confirmationPlace}
                        onChange={(e) => setFormData({ ...formData, confirmationPlace: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Rước Lễ Bao Đồng */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>Rước Lễ Bao Đồng</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Ngày Bao đồng (dd-mm-yyyy):</label>
                      <input
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formData.solemnCommunionDate}
                        onChange={(e) => setFormData({ ...formData, solemnCommunionDate: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, solemnCommunionDate: formatToDDMMYYYY(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-1">Tại giáo xứ:</label>
                      <input
                        type="text"
                        placeholder="VD: Giáo xứ Sơn Lộc"
                        value={formData.solemnCommunionPlace}
                        onChange={(e) => setFormData({ ...formData, solemnCommunionPlace: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* KHỐI 4: THÔNG TIN GIA ĐÌNH & PHỤ HUYNH */}
            {/* ========================================================================= */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <HeartHandshake className="w-5 h-5 text-primary" />
                <span>4. Thông Tin Gia Đình & Phụ Huynh Liên Lạc</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Thông tin Cha */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    <span>Thông tin Người Cha</span>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] text-outline mb-0.5">Tên thánh:</label>
                        <input
                          type="text"
                          placeholder="Giuse"
                          value={formData.fatherHolyName}
                          onChange={(e) => setFormData({ ...formData, fatherHolyName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-outline mb-0.5">Họ và tên cha:</label>
                        <input
                          type="text"
                          placeholder="Họ tên cha"
                          value={formData.fatherName}
                          onChange={(e) => handleFatherNameChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-0.5">SĐT Cha:</label>
                      <input
                        type="tel"
                        placeholder="VD: 0912 345 678"
                        value={formData.fatherPhone}
                        onChange={(e) => handleFatherPhoneChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Thông tin Mẹ */}
                <div className="p-4 rounded-xl bg-white border border-outline-variant/30 space-y-3">
                  <div className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    <span>Thông tin Người Mẹ</span>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] text-outline mb-0.5">Tên thánh:</label>
                        <input
                          type="text"
                          placeholder="Maria"
                          value={formData.motherHolyName}
                          onChange={(e) => setFormData({ ...formData, motherHolyName: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-outline mb-0.5">Họ và tên mẹ:</label>
                        <input
                          type="text"
                          placeholder="Họ tên mẹ"
                          value={formData.motherName}
                          onChange={(e) => handleMotherNameChange(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-outline mb-0.5">SĐT Mẹ:</label>
                      <input
                        type="tel"
                        placeholder="VD: 0987 654 321"
                        value={formData.motherPhone}
                        onChange={(e) => handleMotherPhoneChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin đại diện & SĐT liên lạc chính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Họ tên Phụ huynh đại diện liên lạc (*):
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      required
                      placeholder="VD: Giuse Nguyễn Văn B"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Số điện thoại liên lạc chính (*):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0912 345 678"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-on-surface mb-1">Ghi chú thêm:</label>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú về sức khỏe, hoàn cảnh gia đình, tiếp nhận vào lớp..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BUTTON SUBMIT */}
            {/* ========================================================================= */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => navigate(currentRole === 'catechist' ? '/glyvien/tong-quan' : '/admin/dashboard')}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isCheckingDuplicate}
                className="bg-primary hover:bg-primary-dark text-white font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
              >
                {isCheckingDuplicate ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isCheckingDuplicate ? 'Đang kiểm tra...' : 'Lưu & Tạo Hồ Sơ Học Sinh'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL POPUP CẢNH BÁO TRÙNG LẶP HỌC SINH */}
      {isDuplicateModalOpen && duplicateStudents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 pb-3 border-b border-outline-variant/30">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 font-sans">
                  Cảnh báo trùng lặp thông tin!
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Đã có học sinh cùng <strong>Họ tên</strong> và <strong>Ngày sinh</strong> trong hệ thống.
                </p>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách học sinh trùng trong CSDL */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-on-surface">
                Hồ sơ đã tồn tại trong CSDL ({duplicateStudents.length} học sinh):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {duplicateStudents.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-start space-x-3 text-xs"
                  >
                    <GenderAvatar
                      gender={st.gender}
                      className="w-10 h-10 rounded-full shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-bold text-primary">{st.holyName}</span>
                        <span className="font-bold text-on-surface">{st.fullName}</span>
                        {st.code && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-surface-container-high rounded text-on-surface-variant">
                            #{st.code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-1 space-y-0.5">
                        <p>
                          📅 Ngày sinh: <strong>{st.dob}</strong> ({st.gender})
                        </p>
                        <p>
                          🏫 Lớp học: <strong>{st.class?.name || st.className || 'Chưa phân lớp'}</strong>
                          {st.class?.category ? ` (${st.class.category})` : ''}
                        </p>
                        {st.parentName && (
                          <p>
                            👨‍👩‍👧 Phụ huynh: {st.parentName} {st.parentPhone ? `(${st.parentPhone})` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hộp thoại xác nhận */}
            <div className="p-3.5 bg-surface-container rounded-2xl text-xs text-on-surface-variant leading-relaxed">
              💡 Bạn có chắc chắn học sinh mới này là một học sinh khác vô tình trùng tên & ngày sinh không?
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDuplicateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                Hủy bỏ & Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={executeAddStudent}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Vẫn tiếp tục tạo mới</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
