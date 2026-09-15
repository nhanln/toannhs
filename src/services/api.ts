import { User, Question, Exam, ExamSession, TeacherStats, MatrixConfig, QuestionLevel } from '../types.js';

const TOKEN_KEY = 'mathexam_auth_token';
const USER_KEY = 'mathexam_auth_user';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setAuth: (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

const API_BASE = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Yêu cầu thất bại (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  register: (payload: { username: string; password: string; fullName: string; className?: string; role: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Questions
  getQuestions: (params?: { topic?: string; level?: QuestionLevel | 'all'; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.topic && params.topic !== 'all') query.set('topic', params.topic);
    if (params?.level && params.level !== 'all') query.set('level', params.level);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<{ questions: Question[]; total: number }>(`/questions${qs ? `?${qs}` : ''}`);
  },

  getQuestion: (id: number) => request<{ question: Question }>(`/questions/${id}`),

  createQuestion: (data: Omit<Question, 'id' | 'createdAt'>) =>
    request<{ question: Question; message: string }>('/questions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  createQuestionsBulk: (questions: Omit<Question, 'id' | 'createdAt'>[]) =>
    request<{ success: boolean; createdCount: number; questions: Question[]; message: string }>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions })
    }),

  importDocument: (payload: {
    base64?: string;
    mimeType?: string;
    fileName?: string;
    rawText?: string;
    defaultTopic?: string;
  }) =>
    request<{
      success: boolean;
      questions: Omit<Question, 'id' | 'createdAt'>[];
      parserUsed: 'gemini-ai' | 'rule-based';
      total: number;
      rawExtractedText?: string;
    }>('/questions/import-document', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateQuestion: (id: number, data: Partial<Question>) =>
    request<{ question: Question; message: string }>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteQuestion: (id: number) =>
    request<{ success: boolean; message: string }>(`/questions/${id}`, {
      method: 'DELETE'
    }),

  // Exams
  getExams: () => request<{ exams: Exam[] }>('/exams'),

  getExam: (id: number) => request<{ exam: Exam }>(`/exams/${id}`),

  generateExamFromMatrix: (payload: {
    title: string;
    description?: string;
    code: string;
    durationMinutes: number;
    shuffleOptions?: boolean;
    shuffleQuestions?: boolean;
    startTime?: string;
    endTime?: string;
    matrix: MatrixConfig;
  }) =>
    request<{ message: string; exam: Exam; questionsCount: number }>('/exams/generate-matrix', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteExam: (id: number) =>
    request<{ success: boolean; message: string }>(`/exams/${id}`, {
      method: 'DELETE'
    }),

  // Online Exam Sessions
  startSession: (examId: number) =>
    request<{ session: ExamSession; exam: Exam }>(`/exams/${examId}/start-session`, {
      method: 'POST'
    }),

  submitSession: (sessionId: number, studentAnswers: Record<number, string>) =>
    request<{ message: string; result: ExamSession }>('/exam-sessions/' + sessionId + '/submit', {
      method: 'POST',
      body: JSON.stringify({ studentAnswers })
    }),

  getSessions: (params?: { studentId?: number; examId?: number }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId.toString());
    if (params?.examId) query.set('examId', params.examId.toString());
    const qs = query.toString();
    return request<{ sessions: ExamSession[] }>(`/exam-sessions${qs ? `?${qs}` : ''}`);
  },

  getSession: (id: number) => request<{ session: ExamSession }>(`/exam-sessions/${id}`),

  // Teacher Stats & Students
  getTeacherStats: () => request<{ stats: TeacherStats }>('/stats/overview'),

  getStudents: () =>
    request<{
      students: Array<{
        id: number;
        username: string;
        fullName: string;
        className: string;
        totalExamsTaken: number;
        avgScore: number;
        createdAt: string;
      }>;
    }>('/students'),

  resetSampleData: () => request<{ message: string }>('/reset-data', { method: 'POST' })
};
