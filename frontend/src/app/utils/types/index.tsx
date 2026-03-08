export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  phone: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_id: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'parent';
  phone?: string;
  device_id: string;
}

export interface DeviceVerification {
  id: number;
  device_id: string;
  device_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

export interface FeeTransaction {
  id: number;
  transaction_type: 'deposit' | 'withdrawal';
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  reference: string;
  created_at: string;
  processed_at: string | null;
}

export interface FeeAccount {
  id: number;
  student: User;
  balance: string;
  updated_at: string;
  recent_transactions: FeeTransaction[];
}

export interface Grade {
  id: number;
  student: number;
  student_name: string;
  subject: number;
  subject_name: string;
  teacher_name: string;
  score: number;
  max_score: number;
  percentage: number;
  term: string;
  exam_type: string;
  recorded_at: string;
}

export interface AttendanceRecord {
  id: number;
  student: number;
  student_name: string;
  school_class: number;
  class_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
  recorded_at: string;
}

export interface TimetableEntry {
  id: number;
  class_name: string;
  subject_name: string;
  teacher_name: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}