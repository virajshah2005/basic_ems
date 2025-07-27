import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse, 
  Employee, 
  EmployeeListResponse, 
  EmployeeStats,
  User,
  UserListResponse,
  AdminStats,
  AuditLogResponse,
  ApiResponse,
  Task,
  TaskListResponse,
  TaskStats,
  Attendance,
  AttendanceListResponse,
  AttendanceStats,
  Payroll,
  PayrollListResponse,
  PayrollStats
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  async changePassword(passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.put('/auth/change-password', passwords);
    return response.data;
  }

  // Employee endpoints
  async getEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: string;
  }): Promise<EmployeeListResponse> {
    const response: AxiosResponse<EmployeeListResponse> = await this.api.get('/employees', { params });
    return response.data;
  }

  async getEmployee(id: number): Promise<{ employee: Employee }> {
    const response: AxiosResponse<{ employee: Employee }> = await this.api.get(`/employees/${id}`);
    return response.data;
  }

  async createEmployee(employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department: string;
    position: string;
    salary: number;
    hireDate: string;
  }): Promise<{ message: string; employee: Employee }> {
    const response: AxiosResponse<{ message: string; employee: Employee }> = await this.api.post('/employees', employeeData);
    return response.data;
  }

  async updateEmployee(id: number, employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department: string;
    position: string;
    salary: number;
    hireDate: string;
    status: string;
  }): Promise<{ message: string; employee: Employee }> {
    const response: AxiosResponse<{ message: string; employee: Employee }> = await this.api.put(`/employees/${id}`, employeeData);
    return response.data;
  }

  async deleteEmployee(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/employees/${id}`);
    return response.data;
  }

  async getEmployeeStats(): Promise<EmployeeStats> {
    const response: AxiosResponse<EmployeeStats> = await this.api.get('/employees/stats/overview');
    return response.data;
  }

  // Admin endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UserListResponse> {
    const response: AxiosResponse<UserListResponse> = await this.api.get('/admin/users', { params });
    return response.data;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.post('/admin/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }): Promise<{ message: string; user: User }> {
    const response: AxiosResponse<{ message: string; user: User }> = await this.api.put(`/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/admin/users/${id}`);
    return response.data;
  }

  async getAdminStats(): Promise<AdminStats> {
    const response: AxiosResponse<AdminStats> = await this.api.get('/admin/stats');
    return response.data;
  }

  async getAuditLog(params?: {
    page?: number;
    limit?: number;
  }): Promise<AuditLogResponse> {
    const response: AxiosResponse<AuditLogResponse> = await this.api.get('/admin/audit-log', { params });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    const response: AxiosResponse<{ status: string; message: string; timestamp: string }> = await this.api.get('/health');
    return response.data;
  }

  // Task Management
  async getTasks(params?: { page?: number; limit?: number; search?: string; status?: string; assigned_to?: number }): Promise<TaskListResponse> {
    const response = await this.api.get('/tasks', { params });
    return response.data;
  }

  async getTask(id: number): Promise<ApiResponse<Task>> {
    const response = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    const response = await this.api.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    const response = await this.api.put(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/tasks/${id}`);
    return response.data;
  }

  async getTaskStats(): Promise<ApiResponse<TaskStats>> {
    const response = await this.api.get('/tasks/stats/overview');
    return response.data;
  }

  // Attendance Management
  async getAttendance(params?: { page?: number; limit?: number; employee_id?: number; date?: string; status?: string }): Promise<AttendanceListResponse> {
    const response = await this.api.get('/attendance', { params });
    return response.data;
  }

  async getAttendanceRecord(id: number): Promise<ApiResponse<Attendance>> {
    const response = await this.api.get(`/attendance/${id}`);
    return response.data;
  }

  async createAttendanceRecord(attendanceData: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    const response = await this.api.post('/attendance', attendanceData);
    return response.data;
  }

  async updateAttendanceRecord(id: number, attendanceData: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    const response = await this.api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  }

  async deleteAttendanceRecord(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/attendance/${id}`);
    return response.data;
  }

  async getAttendanceStats(employeeId?: number): Promise<ApiResponse<AttendanceStats>> {
    const response = await this.api.get('/attendance/stats/overview', { params: { employee_id: employeeId } });
    return response.data;
  }

  // Payroll Management
  async getPayroll(params?: { page?: number; limit?: number; employee_id?: number; month?: string; status?: string }): Promise<PayrollListResponse> {
    const response = await this.api.get('/payroll', { params });
    return response.data;
  }

  async getPayrollRecord(id: number): Promise<ApiResponse<Payroll>> {
    const response = await this.api.get(`/payroll/${id}`);
    return response.data;
  }

  async createPayrollRecord(payrollData: Partial<Payroll>): Promise<ApiResponse<Payroll>> {
    const response = await this.api.post('/payroll', payrollData);
    return response.data;
  }

  async updatePayrollRecord(id: number, payrollData: Partial<Payroll>): Promise<ApiResponse<Payroll>> {
    const response = await this.api.put(`/payroll/${id}`, payrollData);
    return response.data;
  }

  async deletePayrollRecord(id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/payroll/${id}`);
    return response.data;
  }

  async processPayroll(month: string): Promise<ApiResponse<void>> {
    const response = await this.api.post('/payroll/process', { month });
    return response.data;
  }

  async getPayrollStats(): Promise<ApiResponse<PayrollStats>> {
    const response = await this.api.get('/payroll/stats/overview');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 