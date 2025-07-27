export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'hr_manager' | 'employee';
  firstName: string;
  lastName: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  managerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  managerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  departmentStats: Array<{ department: string; count: number }>;
  salaryStats: {
    average: string;
    minimum: string;
    maximum: string;
  };
  recentHires: number;
}

export interface AdminStats {
  userStats: Array<{ role: string; count: number }>;
  employeeStats: Array<{ status: string; count: number }>;
  departmentStats: Array<{ department: string; count: number }>;
  recentActivity: number;
}

export interface AuditLogEntry {
  id: number;
  userId?: number;
  action: string;
  tableName: string;
  recordId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

export interface EmployeeListResponse {
  employees: Employee[];
  pagination: PaginationInfo;
  filters: {
    departments: string[];
    search: string;
    department: string;
    status: string;
  };
}

export interface UserListResponse {
  users: User[];
  pagination: PaginationInfo;
  filters: {
    search: string;
    role: string;
  };
}

export interface AuditLogResponse {
  auditLog: AuditLogEntry[];
  pagination: PaginationInfo;
}

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  user: User | null;
  token: string | null;
  theme: ThemeMode;
  isLoading: boolean;
  error: string | null;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_by: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'late';
  check_in?: string;
  check_out?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

export interface Payroll {
  id: number;
  employee_id: number;
  month: string; // Format: YYYY-MM
  base_salary: number;
  bonus: number;
  deduction: number;
  net_salary: number;
  status: 'pending' | 'paid';
  processed_at?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
}

export interface TaskListResponse extends ApiResponse<{ tasks: Task[]; pagination: PaginationInfo }> {
  data: { tasks: Task[]; pagination: PaginationInfo };
}

export interface AttendanceListResponse extends ApiResponse<{ attendance: Attendance[]; pagination: PaginationInfo }> {
  data: { attendance: Attendance[]; pagination: PaginationInfo };
}

export interface PayrollListResponse extends ApiResponse<{ payroll: Payroll[]; pagination: PaginationInfo }> {
  data: { payroll: Payroll[]; pagination: PaginationInfo };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  late_days: number;
  attendance_rate: number;
}

export interface PayrollStats {
  total_employees: number;
  total_paid: number;
  total_pending: number;
  total_amount: number;
  average_salary: number;
} 