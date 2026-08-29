import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, User, Calendar, MapPin, Clock, FileText, Save, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassCategory, ClassRoom } from '../../types';

export const AddClassView: React.FC = () => {
  const navigate = useNavigate();
  const { addClass } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Khai Tâm' as ClassCategory,
    catechistLeader: '',
    catechistAssist: '',
    roomNumber: 'Phòng 103 - Nhà Mục Vụ',
    academicYear: '2026 - 2027',
    schedule: 'Chúa Nhật | 07:30 - 08:45',
    session: 'Sáng' as 'Sáng' | 'Tối',
    description: ''
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.catechistLeader.trim()) {
      alert('Vui lòng nhập Tên lớp và GLV Trưởng lớp phụ trách!');
      return;
    }

    const newClassData: Omit<ClassRoom, 'id' | 'studentCount'> = {
      name: formData.name,
      category: formData.category,
      catechistLeader: formData.catechistLeader,
      catechistAssists: formData.catechistAssist ? [formData.catechistAssist] : [],
      roomNumber: formData.roomNumber,
      academicYear: formData.academicYear,
      schedule: formData.schedule,
      session: formData.session,
      description: formData.description
    };

    addClass(newClassData);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      navigate('/admin/dashboard');
    }, 900);
  };

  return (
    <div className="pb-12 max-w-4xl mx-auto font-body">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-1 font-sans">
          Thêm lớp giáo lý mới
        </h1>
        <p className="text-sm text-on-surface-variant">
          Khởi tạo lớp học mới, phân công phòng học và Giáo Lý Viên phụ trách cho niên khóa.
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-surface rounded-2xl border border-outline-variant/40 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full opacity-20 blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary-container rounded-full opacity-10 blur-xl pointer-events-none"></div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface font-sans">Khởi Tạo Lớp Thành Công!</h4>
            <p className="text-sm text-on-surface-variant">Lớp giáo lý đã sẵn sàng để tiếp nhận học sinh.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Tên lớp */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Tên Lớp Học (*)</label>
              <div className="relative">
                <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  required
                  placeholder="VD: Khai Tâm 1B, Rước Lễ 3..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* Khối giáo lý */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Khối Giáo Lý (*)</label>
              <div className="relative">
                <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ClassCategory })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all text-xs cursor-pointer"
                >
                  <option value="Khai Tâm">Khai Tâm</option>
                  <option value="Rước Lễ">Rước Lễ</option>
                  <option value="Thêm Sức">Thêm Sức</option>
                  <option value="Bao Đồng">Bao Đồng</option>
                  <option value="Vào Đời">Vào Đời</option>
                </select>
              </div>
            </div>

            {/* GLV Trưởng lớp */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">GLV Trưởng Lớp Phụ Trách (*)</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  required
                  placeholder="VD: Maria Nguyễn Thị Mai"
                  value={formData.catechistLeader}
                  onChange={(e) => setFormData({ ...formData, catechistLeader: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* GLV Phụ tá */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">GLV Phụ Tá (nếu có)</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="VD: Giuse Trần Văn B"
                  value={formData.catechistAssist}
                  onChange={(e) => setFormData({ ...formData, catechistAssist: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* Phòng học */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Phòng Học (*)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* Niên khóa */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Niên Khóa</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* Ca học / Buổi học (Sáng / Tối) */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Ca Học / Buổi Học (*)</label>
              <div className="flex items-center gap-4 pt-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">
                  <input
                    type="radio"
                    name="session"
                    value="Sáng"
                    checked={formData.session === 'Sáng'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        session: 'Sáng',
                        schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)'
                      })
                    }
                    className="text-primary focus:ring-primary"
                  />
                  <span>Buổi Sáng ☀️</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs">
                  <input
                    type="radio"
                    name="session"
                    value="Tối"
                    checked={formData.session === 'Tối'}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        session: 'Tối',
                        schedule: 'Chúa Nhật | 18:30 - 19:45 (Tối)'
                      })
                    }
                    className="text-primary focus:ring-primary"
                  />
                  <span>Buổi Tối 🌙</span>
                </label>
              </div>
            </div>

            {/* Lịch học */}
            <div>
              <label className="block font-semibold text-on-surface mb-1">Lịch Học Định Kỳ</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-on-surface mb-1">Mô tả / Ghi chú chương trình</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-3 text-primary" />
                <textarea
                  rows={3}
                  placeholder="Mục tiêu đào tạo đức tin của lớp..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all text-xs"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 pt-4 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-full shadow-md shadow-primary/20 hover:scale-95 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Khởi tạo lớp học</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
