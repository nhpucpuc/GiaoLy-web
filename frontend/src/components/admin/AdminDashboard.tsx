import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, User, Users, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassRoom } from '../../types';
import { getFullCatechistNames, getFullCatechistNamesList } from '../../utils/catechistHelper';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { classes, catechists, setSelectedClassId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'Sáng' | 'Tối'>('ALL');

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    navigate(`/admin/class-detail?classId=${classId}`);
  };

  const isMorning = (c: ClassRoom) => {
    if (c.session === 'Sáng') return true;
    if (c.session === 'Tối') return false;
    const sched = (c.schedule || '').toLowerCase();
    return !sched.includes('tối') && !sched.includes('18:') && !sched.includes('19:') && !sched.includes('20:');
  };

  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getFullCatechistNames(c, catechists).toLowerCase().includes(searchTerm.toLowerCase());

    const morning = isMorning(c);
    const matchSession =
      sessionFilter === 'ALL' ||
      (sessionFilter === 'Sáng' && morning) ||
      (sessionFilter === 'Tối' && !morning);

    return matchSearch && matchSession;
  });

  return (
    <div className="space-y-6 pb-12 relative font-body">
      {/* Memphis dots background decor */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 -z-10"
        style={{
          backgroundImage: 'radial-gradient(#87d5e8 2px, transparent 2px)',
          backgroundSize: '16px 16px'
        }}
      ></div>

      {/* Header with Search filter & Session Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary font-sans">Tổng quan lớp học</h2>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Danh sách các lớp giáo lý niên khóa 2026 - 2027 (Phân ca học Buổi Sáng & Buổi Tối)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Filter Buổi Sáng / Buổi Tối */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-full border border-outline-variant/40 text-xs">
            <button
              onClick={() => setSessionFilter('ALL')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                sessionFilter === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSessionFilter('Sáng')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sessionFilter === 'Sáng'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Buổi Sáng</span>
            </button>
            <button
              onClick={() => setSessionFilter('Tối')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                sessionFilter === 'Tối'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
              <span>Buổi Tối</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tên lớp, GLV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-full text-xs text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-on-surface-variant text-xs">
            Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredClasses.map((c) => {
            const morning = isMorning(c);

            return (
              <div
                key={c.id}
                onClick={() => handleSelectClass(c.id)}
                className="bg-surface rounded-2xl border border-tertiary-fixed shadow-[0_8px_30px_rgba(135,213,232,0.1)] p-6 flex flex-col hover:shadow-[0_12px_40px_rgba(135,213,232,0.2)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                {/* Corner icon for Morning (Sun) vs Evening (Moon) */}
                <div
                  className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-125 flex items-end justify-start p-2.5 ${
                    morning ? 'bg-amber-100/90 text-amber-500' : 'bg-indigo-100/90 text-indigo-600'
                  }`}
                ></div>
                <div
                  className="absolute top-4 right-4 transition-transform group-hover:rotate-12"
                  title={morning ? 'Lớp học buổi Sáng' : 'Lớp học buổi Tối'}
                >
                  {morning ? (
                    <Sun className="w-5 h-5 text-amber-500 stroke-[2.2]" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
                  )}
                </div>

                {/* Class Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-block px-3 py-1 rounded-full bg-surface-container-high text-primary font-bold text-[11px]">
                      {c.category} • Sơn Lộc
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        morning
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {morning ? 'Buổi Sáng' : 'Buổi Tối'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-on-surface leading-tight group-hover:text-primary transition-colors font-sans">
                    {c.name}
                  </h3>
                </div>

                {/* Footer info */}
                <div className="mt-auto pt-4 border-t border-surface-variant flex flex-col gap-2.5 font-body text-xs text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1 text-on-surface font-medium text-xs flex-1">
                      {getFullCatechistNamesList(c, catechists).length > 0 ? (
                        getFullCatechistNamesList(c, catechists).map((name, idx) => (
                          <div key={idx} className="leading-snug flex items-baseline gap-1.5">
                            <span className="text-[11px] font-semibold text-primary shrink-0">
                              {idx === 0 ? 'GLV:' : '•'}
                            </span>
                            <span className="font-semibold text-on-surface">{name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="font-medium text-on-surface-variant">GLV: Chưa phân công</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-dashed border-outline-variant/30">
                    <Users className="w-4 h-4 text-secondary shrink-0" />
                    <span className="font-semibold text-primary">{c.studentCount} Học sinh</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
