import { Router } from 'express';
import { db } from './db.js';
import { generateToken, verifyPassword, hashPassword, authenticateToken, requireRole, AuthRequest } from './auth.js';
import { QuestionLevel } from '../src/types.js';
import { parseUploadedDocument } from './documentParser.js';

export const apiRouter = Router();

// --- Auth Routes ---
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      className: user.className,
      createdAt: user.createdAt
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        className: user.className
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Đã có lỗi xảy ra khi đăng nhập.' });
  }
});

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { username, password, fullName, className, role } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const existing = db.findUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống.' });
    }

    const passwordHash = hashPassword(password);
    const assignedRole = role === 'teacher' ? 'teacher' : 'student';

    const newUser = db.createUser({
      username,
      passwordHash,
      role: assignedRole,
      fullName,
      className: className || (assignedRole === 'student' ? '12A' : 'Tổ Toán')
    });

    const token = generateToken(newUser);

    return res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        fullName: newUser.fullName,
        className: newUser.className
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Đã có lỗi xảy ra khi đăng ký.' });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

// --- Question Bank Routes ---
apiRouter.get('/questions', (req, res) => {
  const { topic, level, search } = req.query;
  const list = db.getQuestions({
    topic: topic as string,
    level: level as QuestionLevel,
    search: search as string
  });
  return res.json({ questions: list, total: list.length });
});

apiRouter.get('/questions/:id', (req, res) => {
  const q = db.getQuestionById(Number(req.params.id));
  if (!q) return res.status(404).json({ error: 'Câu hỏi không tồn tại.' });
  return res.json({ question: q });
});

apiRouter.post('/questions', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { topic, level, content, optionA, optionB, optionC, optionD, correctOption, explanation } = req.body;
    if (!topic || !level || !content || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin câu hỏi và 4 đáp án.' });
    }

    const newQ = db.createQuestion({
      topic,
      level,
      content,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: explanation || ''
    });

    return res.json({ question: newQ, message: 'Thêm câu hỏi thành công.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Parse Word (.docx), PDF or raw text to extract questions
apiRouter.post('/questions/import-document', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { base64, mimeType, fileName, rawText, defaultTopic } = req.body;
    if (!base64 && (!rawText || rawText.trim().length === 0)) {
      return res.status(400).json({ error: 'Vui lòng cung cấp file Word/PDF hoặc dán nội dung văn bản.' });
    }

    const result = await parseUploadedDocument({
      base64,
      mimeType,
      fileName,
      rawText,
      defaultTopic
    });

    return res.json({
      success: true,
      questions: result.questions,
      parserUsed: result.parserUsed,
      total: result.questions.length,
      rawExtractedText: result.rawExtractedText
    });
  } catch (e: any) {
    console.error('Import document error:', e);
    return res.status(500).json({ error: e.message || 'Lỗi xử lý file tài liệu.' });
  }
});

// Bulk insert approved questions into bank
apiRouter.post('/questions/bulk', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Danh sách câu hỏi không hợp lệ hoặc đang trống.' });
    }

    const validQuestions = questions.map(q => ({
      topic: q.topic || 'Hàm số & Đồ thị',
      level: q.level || 'nhan_biet',
      content: q.content,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption || 'A',
      explanation: q.explanation || ''
    }));

    const created = db.createQuestionsBulk(validQuestions);
    return res.json({
      success: true,
      createdCount: created.length,
      questions: created,
      message: `Đã lưu thành công ${created.length} câu hỏi vào ngân hàng!`
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Lỗi lưu hàng loạt câu hỏi.' });
  }
});

apiRouter.put('/questions/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = db.updateQuestion(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Câu hỏi không tồn tại.' });
    return res.json({ question: updated, message: 'Cập nhật câu hỏi thành công.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

apiRouter.delete('/questions/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const id = Number(req.params.id);
  const success = db.deleteQuestion(id);
  if (!success) return res.status(404).json({ error: 'Câu hỏi không tồn tại.' });
  return res.json({ success: true, message: 'Đã xóa câu hỏi thành công.' });
});

// --- Exams & Matrix Auto Generation Routes ---
apiRouter.get('/exams', (req, res) => {
  const exams = db.getExams();
  return res.json({ exams });
});

apiRouter.get('/exams/:id', (req, res) => {
  const exam = db.getExamById(Number(req.params.id));
  if (!exam) return res.status(404).json({ error: 'Đề thi không tồn tại.' });
  return res.json({ exam });
});

apiRouter.post('/exams/generate-matrix', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { title, description, code, durationMinutes, shuffleOptions, shuffleQuestions, startTime, endTime, matrix } = req.body;
    if (!title || !code || !matrix) {
      return res.status(400).json({ error: 'Vui lòng điền tên đề thi, mã đề và cấu hình ma trận.' });
    }

    const totalRequested = (matrix.nhanBiet || 0) + (matrix.thongHieu || 0) + (matrix.vanDung || 0) + (matrix.vanDungCao || 0);
    if (totalRequested <= 0) {
      return res.status(400).json({ error: 'Tổng số câu hỏi trong ma trận phải lớn hơn 0.' });
    }

    const result = db.generateExamFromMatrix({
      title,
      description,
      code,
      durationMinutes: Number(durationMinutes) || 45,
      shuffleOptions: !!shuffleOptions,
      shuffleQuestions: !!shuffleQuestions,
      startTime,
      endTime,
      matrix
    });

    return res.json({
      message: `Tạo đề thi thành công với ${result.questions.length} câu hỏi theo ma trận.`,
      exam: result.exam,
      questionsCount: result.questions.length
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || 'Lỗi khi sinh đề theo ma trận.' });
  }
});

apiRouter.delete('/exams/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteExam(id);
  if (!ok) return res.status(404).json({ error: 'Đề thi không tồn tại.' });
  return res.json({ success: true, message: 'Đã xóa đề thi.' });
});

// --- Online Examination Routes ---
apiRouter.post('/exams/:id/start-session', authenticateToken, (req: AuthRequest, res) => {
  try {
    const examId = Number(req.params.id);
    const studentId = req.user!.id;
    const session = db.createExamSession(examId, studentId);
    const exam = db.getExamById(examId);

    // If student, remove correctOption from questions for fair exam!
    const questionsForExam = exam?.questions?.map(q => ({
      id: q.id,
      topic: q.topic,
      level: q.level,
      content: q.content,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD
    })) || [];

    return res.json({
      session,
      exam: {
        ...exam,
        questions: questionsForExam
      }
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/exam-sessions/:id/submit', authenticateToken, (req: AuthRequest, res) => {
  try {
    const sessionId = Number(req.params.id);
    const { studentAnswers } = req.body;
    const result = db.submitExamSession(sessionId, studentAnswers || {});
    return res.json({
      message: 'Nộp bài thành công!',
      result
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/exam-sessions', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  // If student, only see their own sessions; if teacher, can see all or filtered
  const filters: { studentId?: number; examId?: number } = {};
  if (user.role === 'student') {
    filters.studentId = user.id;
  } else if (req.query.studentId) {
    filters.studentId = Number(req.query.studentId);
  }
  if (req.query.examId) {
    filters.examId = Number(req.query.examId);
  }

  const sessions = db.getExamSessions(filters);
  return res.json({ sessions });
});

apiRouter.get('/exam-sessions/:id', authenticateToken, (req: AuthRequest, res) => {
  const sessionId = Number(req.params.id);
  const session = db.getSessionById(sessionId);
  if (!session) return res.status(404).json({ error: 'Lượt thi không tồn tại.' });

  // Students can only view their own
  if (req.user!.role === 'student' && session.studentId !== req.user!.id) {
    return res.status(403).json({ error: 'Bạn không có quyền xem kết quả này.' });
  }

  return res.json({ session });
});

// --- Teacher Dashboard Stats & Students ---
apiRouter.get('/stats/overview', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const stats = db.getTeacherStats();
  return res.json({ stats });
});

apiRouter.get('/students', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  const students = db.getAllStudents();
  return res.json({ students });
});

apiRouter.post('/students', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { username, fullName, className, password } = req.body;
    if (!username || !fullName) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ họ tên và tên đăng nhập.' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
    }

    const student = db.createStudent({
      username,
      fullName,
      className,
      password: password || '123456'
    });

    return res.status(201).json({
      success: true,
      message: `Đã tạo thành công tài khoản học sinh "${student.fullName}"!`,
      student
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Lỗi khi tạo tài khoản học sinh.' });
  }
});

apiRouter.post('/students/bulk', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Danh sách học sinh không hợp lệ.' });
    }

    const result = db.createStudentsBulk(students);
    return res.json({
      success: true,
      created: result.created,
      errors: result.errors,
      totalCreated: result.totalCreated,
      message: `Đã tạo thành công ${result.totalCreated} tài khoản học sinh.`
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Lỗi khi tạo danh sách học sinh.' });
  }
});

apiRouter.put('/students/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { fullName, className, password, username } = req.body;
    const updated = db.updateStudent(studentId, {
      fullName,
      className,
      password,
      username
    });
    return res.json({
      success: true,
      message: 'Cập nhật tài khoản học sinh thành công.',
      student: updated
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Lỗi khi cập nhật tài khoản học sinh.' });
  }
});

apiRouter.delete('/students/:id', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  try {
    const studentId = Number(req.params.id);
    db.deleteStudent(studentId);
    return res.json({
      success: true,
      message: 'Đã xóa tài khoản học sinh thành công.'
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Lỗi khi xóa tài khoản học sinh.' });
  }
});

// --- Reset / Re-seed sample data ---
apiRouter.post('/reset-data', authenticateToken, requireRole('teacher', 'admin'), (req, res) => {
  db.initializeDefaultData();
  return res.json({ message: 'Đã khôi phục dữ liệu mẫu thành công.' });
});
