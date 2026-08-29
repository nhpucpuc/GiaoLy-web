import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  User,
  ClassRoom,
  Student,
  GradeRecord,
  AttendanceRecord,
  Announcement,
  ConductType
} from '../types';
import { api } from '../services/api';

interface AppContextType {
  currentRole: UserRole;
  currentUser: User | null;
  activeTab: string;
  selectedClassId: string;
  selectedStudentId: string;
  selectedAcademicYear: string;
  availableAcademicYears: string[];
  classes: ClassRoom[];
  students: Student[];
  grades: GradeRecord[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  catechists: any[];
  switchRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  logout: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedClassId: (classId: string) => void;
  setSelectedStudentId: (studentId: string) => void;
  setSelectedAcademicYear: (year: string) => void;
  promoteToNewAcademicYear: (fromYear: string, toYear: string) => Promise<any>;
  getStudentTranscript: (studentId: string) => Promise<any>;
  addClass: (newClass: Omit<ClassRoom, 'id' | 'studentCount'>) => Promise<any>;
  updateClass: (id: string, updateData: Partial<ClassRoom>) => Promise<any>;
  deleteClass: (id: string) => Promise<any>;
  addStudent: (newStudent: Omit<Student, 'id'>) => Promise<any>;
  updateStudent: (student: Student) => Promise<any>;
  deleteStudent: (id: string) => Promise<any>;
  updateStudentNote: (studentId: string, notes: string) => Promise<any>;
  updateGrade: (grade: GradeRecord) => Promise<any>;
  saveAllGrades: (classId: string, gradesData: any[]) => Promise<any>;
  assignCatechistClass: (catechistId: string, classId: string | null) => Promise<any>;
  createCatechist: (data: any) => Promise<any>;
  deleteCatechist: (id: string) => Promise<any>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
  createAnnouncement: (data: any) => Promise<any>;
  calculateFinalGrade: (
    oral: number,
    t15: number,
    t45: number,
    sem: number,
    att: number
  ) => { finalScore: number; conduct: ConductType };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isBackendConnected: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    // Clear legacy localStorage once to avoid old cross-tab state leakage
    try {
      localStorage.removeItem('gx_role');
      localStorage.removeItem('gx_user_profile');
      localStorage.removeItem('gx_token');
    } catch {}

    const saved = sessionStorage.getItem('gx_role');
    return (saved as UserRole) || 'public';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('gx_user_profile');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {}
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentIdState] = useState<string>(() => {
    return sessionStorage.getItem('gx_selected_student_id') || '';
  });

  const setSelectedStudentId = (id: string) => {
    setSelectedStudentIdState(id);
    if (id) {
      sessionStorage.setItem('gx_selected_student_id', id);
    } else {
      sessionStorage.removeItem('gx_selected_student_id');
    }
  };
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026 - 2027');
  const [availableAcademicYears, setAvailableAcademicYears] = useState<string[]>(['2026 - 2027']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 100% Real Database State (Khởi tạo rỗng, nạp từ Backend API)
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [catechists, setCatechists] = useState<any[]>([]);

  // Tải dữ liệu toàn bộ từ Database Supabase qua Backend
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resClasses, resStudents, resAnnouncements, resCatechists, resYears] = await Promise.all([
        api.getClasses(undefined, selectedAcademicYear).catch(() => []),
        api.getStudents().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getCatechists().catch(() => []),
        api.getAcademicYears().catch(() => ['2026 - 2027']),
      ]);

      setClasses(resClasses || []);
      setStudents(resStudents || []);
      setAnnouncements(resAnnouncements || []);
      setCatechists(resCatechists || []);
      if (Array.isArray(resYears) && resYears.length > 0) {
        setAvailableAcademicYears(resYears);
      }
      setIsBackendConnected(true);

      // Cập nhật thông tin profile mới nhất từ DB nếu đã đăng nhập
      if (api.getToken()) {
        try {
          const freshUser = await api.getProfile();
          if (freshUser) {
            let mappedRole: UserRole = 'public';
            if (freshUser.role === 'ADMIN') mappedRole = 'admin';
            else if (freshUser.role === 'CATECHIST') mappedRole = 'catechist';
            else if (freshUser.role === 'PARENT') mappedRole = 'parent';

            const profile: User = {
              id: freshUser.id,
              email: freshUser.email,
              name: freshUser.fullName || freshUser.name || '',
              holyName: freshUser.holyName || '',
              role: mappedRole,
              phone: freshUser.phone,
              assignedClassId: freshUser.assignedClassId
            };
            setCurrentUser(profile);
            sessionStorage.setItem('gx_user_profile', JSON.stringify(profile));
          }
        } catch {}
      }

      // Tự động chọn lớp phụ trách nếu là Giáo Lý Viên
      if (resClasses && resClasses.length > 0) {
        setSelectedClassId((prev) => {
          if (currentRole === 'catechist' && currentUser?.assignedClassId) {
            return currentUser.assignedClassId;
          }
          const stillExists = resClasses.some((c) => c.id === prev);
          return stillExists ? prev : resClasses[0].id;
        });
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, currentUser?.assignedClassId, selectedAcademicYear]);

  const promoteToNewAcademicYear = async (fromYear: string, toYear: string) => {
    const result = await api.promoteAcademicYear(fromYear, toYear);
    setSelectedAcademicYear(toYear);
    await refreshData();
    return result;
  };

  const getStudentTranscript = async (studentId: string) => {
    return api.getStudentTranscript(studentId);
  };

  // Khóa cứng lớp phụ trách đối với role Giáo Lý Viên
  useEffect(() => {
    if (currentRole === 'catechist' && currentUser?.assignedClassId) {
      setSelectedClassId(currentUser.assignedClassId);
    }
  }, [currentRole, currentUser?.assignedClassId]);

  // Bộ điều hướng chọn lớp an toàn theo phân quyền
  const handleSetSelectedClassId = (classId: string) => {
    if (currentRole === 'catechist' && currentUser?.assignedClassId) {
      setSelectedClassId(currentUser.assignedClassId);
      return;
    }
    setSelectedClassId(classId);
  };

  // Tải điểm khi chọn lớp
  useEffect(() => {
    if (selectedClassId) {
      api.getGradesByClass(selectedClassId)
        .then((res) => {
          if (Array.isArray(res)) setGrades(res);
        })
        .catch(() => {});
    }
  }, [selectedClassId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    sessionStorage.setItem('gx_role', currentRole);
  }, [currentRole]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    try {
      const res = await api.login(email, password);
      if (res && res.user) {
        let mappedRole: UserRole = 'public';
        if (res.user.role === 'ADMIN') mappedRole = 'admin';
        else if (res.user.role === 'CATECHIST') mappedRole = 'catechist';
        else if (res.user.role === 'PARENT') mappedRole = 'parent';

        const profile: User = {
          id: res.user.id,
          email: res.user.email,
          name: res.user.fullName || res.user.name || '',
          holyName: res.user.holyName || '',
          role: mappedRole,
          phone: res.user.phone,
          assignedClassId: res.user.assignedClassId
        };

        setCurrentUser(profile);
        setCurrentRole(mappedRole);
        sessionStorage.setItem('gx_user_profile', JSON.stringify(profile));
        sessionStorage.setItem('gx_role', mappedRole);

        if (mappedRole === 'admin') {
          setActiveTab('dashboard');
        } else if (mappedRole === 'catechist') {
          setActiveTab('class-overview');
          if (profile.assignedClassId) {
            setSelectedClassId(profile.assignedClassId);
          }
        } else if (mappedRole === 'parent') {
          setActiveTab('parent-portal');
        }

        await refreshData();
        return { success: true, role: mappedRole };
      }
      return { success: false, message: 'Đăng nhập không thành công!' };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Tài khoản hoặc mật khẩu không chính xác!'
      };
    }
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentRole('public');
    sessionStorage.removeItem('gx_user_profile');
    sessionStorage.setItem('gx_role', 'public');
    try {
      localStorage.removeItem('gx_user_profile');
      localStorage.removeItem('gx_role');
      localStorage.removeItem('gx_token');
    } catch {}
    setActiveTab('home');
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'public') {
      logout();
    }
  };

  const calculateFinalGrade = (
    oral: number,
    t15: number,
    t45: number,
    sem: number,
    att: number
  ): { finalScore: number; conduct: ConductType } => {
    const total = (oral * 1) + (t15 * 1) + (t45 * 2) + (sem * 3) + (att * 1);
    const finalScore = parseFloat((total / 8).toFixed(1));

    let conduct: ConductType = 'Trung bình';
    if (finalScore >= 9.0 && att >= 9.0) {
      conduct = 'Xuất sắc';
    } else if (finalScore >= 8.0 && att >= 8.0) {
      conduct = 'Giỏi';
    } else if (finalScore >= 6.5 && att >= 7.0) {
      conduct = 'Khá';
    } else if (finalScore >= 5.0) {
      conduct = 'Trung bình';
    } else {
      conduct = 'Cần cố gắng';
    }

    return { finalScore, conduct };
  };

  // --- CRUD Lớp Học (Ghi vào DB) ---
  const addClass = async (newClassData: Omit<ClassRoom, 'id' | 'studentCount'>) => {
    const result = await api.createClass(newClassData);
    await refreshData();
    return result;
  };

  const updateClass = async (id: string, updateData: Partial<ClassRoom>) => {
    const result = await api.updateClass(id, updateData);
    await refreshData();
    return result;
  };

  const deleteClass = async (id: string) => {
    const result = await api.deleteClass(id);
    await refreshData();
    return result;
  };

  // --- CRUD Học Sinh & Bí Tích (Ghi vào DB) ---
  const addStudent = async (newStudentData: Omit<Student, 'id'>) => {
    const result = await api.createStudent(newStudentData);
    await refreshData();
    return result;
  };

  const updateStudent = async (updatedStudent: Student) => {
    const result = await api.updateStudent(updatedStudent.id, updatedStudent);
    await refreshData();
    return result;
  };

  const deleteStudent = async (id: string) => {
    const result = await api.deleteStudent(id);
    await refreshData();
    return result;
  };

  const updateStudentNote = async (studentId: string, notes: string) => {
    const result = await api.updateStudent(studentId, { notes });
    await refreshData();
    return result;
  };

  // --- CRUD Điểm Số (Ghi vào DB) ---
  const updateGrade = async (updatedGrade: GradeRecord) => {
    const result = await api.batchUpdateGrades(updatedGrade.classId, [
      {
        studentId: updatedGrade.studentId,
        notes: updatedGrade.notes,
      },
    ]);
    if (selectedClassId) {
      const freshGrades = await api.getGradesByClass(selectedClassId);
      setGrades(freshGrades);
    }
    return result;
  };

  const saveAllGrades = async (classId: string, gradesData: any[]) => {
    const result = await api.batchUpdateGrades(classId, gradesData);
    const freshGrades = await api.getGradesByClass(classId);
    setGrades(freshGrades);
    return result;
  };

  // --- CRUD Thông Báo (Ghi vào DB) ---
  const createAnnouncement = async (data: any) => {
    const result = await api.createAnnouncement(data);
    await refreshData();
    return result;
  };

  // --- Phân Công Giáo Lý Viên ---
  const assignCatechistClass = async (catechistId: string, classId: string | null) => {
    const result = await api.assignCatechistClass(catechistId, classId);
    await refreshData();
    return result;
  };

  const createCatechist = async (data: any) => {
    const result = await api.createCatechist(data);
    await refreshData();
    return result;
  };

  const deleteCatechist = async (id: string) => {
    const result = await api.deleteCatechist(id);
    await refreshData();
    return result;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const result = await api.changePassword(oldPassword, newPassword);
    await refreshData();
    return result;
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        activeTab,
        selectedClassId,
        selectedStudentId,
        selectedAcademicYear,
        availableAcademicYears,
        classes,
        students,
        grades,
        attendance,
        announcements,
        catechists,
        switchRole,
        login,
        logout,
        setActiveTab,
        setSelectedClassId: handleSetSelectedClassId,
        setSelectedStudentId,
        setSelectedAcademicYear,
        promoteToNewAcademicYear,
        getStudentTranscript,
        addClass,
        updateClass,
        deleteClass,
        addStudent,
        updateStudent,
        deleteStudent,
        updateStudentNote,
        updateGrade,
        saveAllGrades,
        assignCatechistClass,
        createCatechist,
        deleteCatechist,
        changePassword,
        createAnnouncement,
        calculateFinalGrade,
        searchQuery,
        setSearchQuery,
        isBackendConnected,
        isLoading,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
