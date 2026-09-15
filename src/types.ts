export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  fullName: string;
  className?: string;
  createdAt?: string;
}

export type QuestionLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';

export interface Question {
  id: number;
  topic: string;
  level: QuestionLevel;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  createdAt?: string;
}

export interface MatrixConfig {
  totalQuestions: number;
  nhanBiet: number;
  thongHieu: number;
  vanDung: number;
  vanDungCao: number;
  topics?: string[];
}

export interface Exam {
  id: number;
  title: string;
  description?: string;
  code: string;
  durationMinutes: number;
  shuffleOptions: boolean;
  shuffleQuestions: boolean;
  startTime?: string;
  endTime?: string;
  matrixConfig?: MatrixConfig;
  questions?: Question[];
  totalQuestions?: number;
  createdAt?: string;
}

export interface ExamSession {
  id: number;
  examId: number;
  examTitle?: string;
  examCode?: string;
  studentId: number;
  studentName?: string;
  studentClass?: string;
  startTime: string;
  submitTime?: string;
  score?: number;
  totalCorrect?: number;
  totalQuestions: number;
  studentAnswers: Record<number, string>; // questionId -> chosen answer ('A' | 'B' | 'C' | 'D')
  status: 'in_progress' | 'completed' | 'timed_out';
  reviewQuestions?: Array<Question & { studentAnswer?: string; isCorrect?: boolean }>;
}

export interface TeacherStats {
  totalQuestions: number;
  totalExams: number;
  totalSessions: number;
  avgScore: number;
  levelCounts: Record<QuestionLevel, number>;
  topicCounts: Record<string, number>;
  recentSessions: ExamSession[];
}

export const LEVEL_LABELS: Record<QuestionLevel, { label: string; color: string; badge: string }> = {
  nhan_biet: { label: 'Nhận biết', color: 'text-sky-700 bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-800' },
  thong_hieu: { label: 'Thông hiểu', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  van_dung: { label: 'Vận dụng', color: 'text-amber-700 bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  van_dung_cao: { label: 'Vận dụng cao', color: 'text-rose-700 bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-800' },
};

export const COMMON_TOPICS = [
  'Hàm số & Đồ thị',
  'Mũ & Logarit',
  'Nguyên hàm & Tích phân',
  'Số phức',
  'Khối đa diện & Thể tích',
  'Mặt nón - Mặt trụ - Mặt cầu',
  'Hình học Oxyz trong không gian',
  'Lượng giác & Phương trình',
  'Tổ hợp & Xác suất',
  'Cấp số cộng & Cấp số nhân',
];
