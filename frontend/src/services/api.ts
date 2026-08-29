const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = sessionStorage.getItem('gx_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('gx_token', token);
    } else {
      sessionStorage.removeItem('gx_token');
      try {
        localStorage.removeItem('gx_token');
      } catch {}
    }
  }

  getToken(): string | null {
    return this.token || sessionStorage.getItem('gx_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.message || `Lỗi yêu cầu: ${response.status} ${response.statusText}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return response.json();
  }

  // --- 1. Auth APIs ---
  async login(email: string, password: string) {
    const res = await this.request<{ message: string; accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.accessToken);
    return res;
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  logout() {
    this.setToken(null);
  }

  // --- 2. Classes APIs ---
  async getClasses(session?: 'SANG' | 'TOI', academicYear?: string) {
    const params = new URLSearchParams();
    if (session) params.append('session', session);
    if (academicYear) params.append('academicYear', academicYear);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/classes${query}`);
  }

  async getAcademicYears() {
    return this.request<string[]>('/classes/academic-years');
  }

  async promoteAcademicYear(fromYear: string, toYear: string) {
    return this.request<any>('/classes/promote-academic-year', {
      method: 'POST',
      body: JSON.stringify({ fromYear, toYear }),
    });
  }

  async getClassById(id: string) {
    return this.request<any>(`/classes/${id}`);
  }

  async createClass(data: any) {
    return this.request<any>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClass(id: string, data: any) {
    return this.request<any>(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClass(id: string) {
    return this.request<any>(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 3. Students APIs ---
  async getStudents(classId?: string, search?: string) {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/students${qs}`);
  }

  async getStudentById(id: string) {
    return this.request<any>(`/students/${id}`);
  }

  async createStudent(data: any) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: any) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request<any>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 4. Grades APIs ---
  async getGradesByClass(classId: string) {
    return this.request<any[]>(`/grades/class/${classId}`);
  }

  async getStudentTranscript(studentId: string) {
    return this.request<any>(`/grades/student/${studentId}/transcript`);
  }

  async batchUpdateGrades(classId: string, grades: any[]) {
    return this.request<any>('/grades/batch-update', {
      method: 'PUT',
      body: JSON.stringify({ classId, grades }),
    });
  }

  // --- 5. Attendance & Announcements ---
  async getAttendanceByStudent(studentId: string) {
    return this.request<any[]>(`/attendance/student/${studentId}`);
  }

  async getAttendanceByClass(classId: string) {
    return this.request<any[]>(`/attendance/class/${classId}`);
  }

  async batchSyncAttendance(classId: string, students: { studentId: string; absences: { date: string; type?: string; status: string; notes?: string }[] }[]) {
    return this.request<any>('/attendance/batch-sync', {
      method: 'PUT',
      body: JSON.stringify({ classId, students }),
    });
  }

  async getAnnouncements(audience?: string) {
    const query = audience ? `?audience=${audience}` : '';
    return this.request<any[]>(`/announcements${query}`);
  }

  async createAnnouncement(data: any) {
    return this.request<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- 6. Catechists Management APIs ---
  async getCatechists() {
    return this.request<any[]>('/auth/catechists');
  }

  async createCatechist(data: any) {
    return this.request<any>('/auth/catechists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignCatechistClass(catechistId: string, classId: string | null) {
    return this.request<any>(`/auth/catechists/${catechistId}/assign-class`, {
      method: 'PUT',
      body: JSON.stringify({ classId }),
    });
  }

  async deleteCatechist(id: string) {
    return this.request<any>(`/auth/catechists/${id}`, {
      method: 'DELETE',
    });
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request<any>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }
}

export const api = new ApiClient();


