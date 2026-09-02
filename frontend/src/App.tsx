import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Toolbar } from './components/layout/Toolbar';
import { LandingPage } from './components/landing/LandingPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClassDetailView } from './components/admin/ClassDetailView';
import { AddStudentView } from './components/admin/AddStudentView';
import { AddClassView } from './components/admin/AddClassView';
import { AcademicYearManager } from './components/admin/AcademicYearManager';
import { AdminStudentDetailView } from './components/admin/AdminStudentDetailView';
import { CatechistListView } from './components/admin/CatechistListView';
import { CatechistClassOverview } from './components/catechist/CatechistClassOverview';
import { GradeEntryView } from './components/catechist/GradeEntryView';
import { AttendanceView } from './components/catechist/AttendanceView';
import { ParentPortal } from './components/parent/ParentPortal';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

import { UserRole } from './types';
import { useApp } from './context/AppContext';


// Layout chung cho các portal sau khi đăng nhập (chỉ có Sidebar và Toolbar)
function PortalLayout() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* 1. Sidebar quản lý routing */}
      <Sidebar />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2.1 Toolbar */}
        <Toolbar />

        {/* 2.2 Canvas / Content Area (Rendered via React Router Outlet) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// Route Guard bảo vệ theo vai trò truy cập
function RoleProtectedRoute({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { currentRole } = useApp();

  if (!allowedRoles.includes(currentRole)) {
    if (currentRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === 'catechist') {
      return <Navigate to="/glyvien/tong-quan" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route 1: Trang chủ (Landing Page) */}
        <Route path="/" element={<LandingPage />} />

        {/* Route 2: Cổng Ban Giáo Lý (Admin Routes) */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <PortalLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="giao-ly-vien" element={<CatechistListView />} />
          <Route path="catechists" element={<CatechistListView />} />
          <Route path="class-detail" element={<ClassDetailView />} />
          <Route path="profile" element={<AdminStudentDetailView />} />
          <Route path="add-student" element={<AddStudentView />} />
          <Route path="add-class" element={<AddClassView />} />
          <Route path="diem-danh" element={<AttendanceView />} />
          <Route path="nien-khoa" element={<AcademicYearManager />} />
        </Route>

        {/* Route 3: Cổng Giáo Lý Viên (GLV Routes) */}
        <Route
          path="/glyvien"
          element={
            <RoleProtectedRoute allowedRoles={['catechist']}>
              <PortalLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/glyvien/tong-quan" replace />} />
          <Route path="tong-quan" element={<CatechistClassOverview />} />
          <Route path="nhap-diem" element={<GradeEntryView />} />
          <Route path="diem-danh" element={<AttendanceView />} />
          <Route path="them-hoc-sinh" element={<AddStudentView />} />
        </Route>

        {/* Route 4: Cổng Phụ Huynh (Parent Routes) */}
        <Route path="/phu-huynh" element={<PortalLayout />}>
          <Route index element={<ParentPortal />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PWAInstallPrompt />
    </BrowserRouter>
  );
}
