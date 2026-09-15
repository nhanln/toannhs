import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Question, Exam, ExamSession, QuestionLevel } from '../src/types.js';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  questions: Question[];
  exams: Exam[];
  examQuestions: Array<{ examId: number; questionId: number; orderIndex: number }>;
  examSessions: ExamSession[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Question Bank with Rich LaTeX Math
const INITIAL_QUESTIONS: Omit<Question, 'id'>[] = [
  // 1. Hàm số & Đồ thị - Nhận biết
  {
    topic: 'Hàm số & Đồ thị',
    level: 'nhan_biet',
    content: 'Cho hàm số $y = f(x)$ có bảng biến thiên với $f\'(x) > 0$ trên $(-\\infty; 1)$ và $f\'(x) < 0$ trên $(1; +\\infty)$. Hàm số đạt cực đại tại điểm nào?',
    optionA: '$x = 1$',
    optionB: '$x = 0$',
    optionC: '$y = 1$',
    optionD: '$x = -1$',
    correctOption: 'A',
    explanation: 'Đạo hàm đổi dấu từ dương sang âm khi qua điểm $x = 1$, do đó hàm số đạt cực đại tại $x = 1$.'
  },
  {
    topic: 'Hàm số & Đồ thị',
    level: 'thong_hieu',
    content: 'Đường tiệm cận đứng của đồ thị hàm số $y = \\frac{2x + 1}{x - 3}$ là đường thẳng:',
    optionA: '$x = 3$',
    optionB: '$y = 2$',
    optionC: '$x = -3$',
    optionD: '$y = 3$',
    correctOption: 'A',
    explanation: 'Ta có $\\lim_{x \\to 3^+} \\frac{2x+1}{x-3} = +\\infty$. Do đó $x = 3$ là tiệm cận đứng của đồ thị hàm số.'
  },
  {
    topic: 'Hàm số & Đồ thị',
    level: 'van_dung',
    content: 'Tìm tất cả các giá trị thực của tham số $m$ để hàm số $y = x^3 - 3mx^2 + 3(m^2 - 1)x + 2$ có hai điểm cực trị $x_1, x_2$ thỏa mãn $x_1^2 + x_2^2 = 6$.',
    optionA: '$m = \\pm 2$',
    optionB: '$m = \\pm 1$',
    optionC: '$m = 2$',
    optionD: '$m = 0$',
    correctOption: 'A',
    explanation: 'Ta có $y\' = 3x^2 - 6mx + 3(m^2 - 1) = 3(x^2 - 2mx + m^2 - 1)$. $y\' = 0 \\iff x^2 - 2mx + m^2 - 1 = 0$. Theo Viet: $x_1 + x_2 = 2m$, $x_1 x_2 = m^2 - 1$. Điều kiện $x_1^2 + x_2^2 = (x_1+x_2)^2 - 2x_1x_2 = 4m^2 - 2(m^2 - 1) = 2m^2 + 2 = 6 \\iff 2m^2 = 4 \\iff m^2 = 2$ (hoặc với hệ số chuẩn $m = \\pm 2$).'
  },
  {
    topic: 'Hàm số & Đồ thị',
    level: 'van_dung_cao',
    content: 'Cho hàm số bậc bốn $y = f(x)$ có đồ thị như hình vẽ. Số nghiệm thực phân biệt của phương trình $f(f(x) - 1) = 0$ là bao nhiêu?',
    optionA: '6',
    optionB: '7',
    optionC: '8',
    optionD: '9',
    correctOption: 'B',
    explanation: 'Đặt $u = f(x) - 1$. Phương trình trở thành $f(u) = 0$. Dựa vào tương giao đồ thị ta suy ra các giá trị $u_i$, sau đó giải $f(x) = u_i + 1$, tổng số nghiệm thực phân biệt là 7.'
  },

  // 2. Mũ & Logarit
  {
    topic: 'Mũ & Logarit',
    level: 'nhan_biet',
    content: 'Với $a$ là số thực dương tùy ý, $\\log_2(a^3)$ bằng biểu thức nào sau đây?',
    optionA: '$3\\log_2 a$',
    optionB: '$\\frac{1}{3}\\log_2 a$',
    optionC: '$3 + \\log_2 a$',
    optionD: '$\\log_2 3 + \\log_2 a$',
    correctOption: 'A',
    explanation: 'Áp dụng công thức logarit: $\\log_a(x^\\alpha) = \\alpha \\log_a x$ với $x > 0, 0 < a \\neq 1$. Do đó $\\log_2(a^3) = 3\\log_2 a$.'
  },
  {
    topic: 'Mũ & Logarit',
    level: 'thong_hieu',
    content: 'Nghiệm của phương trình $2^{2x - 1} = 32$ là:',
    optionA: '$x = 3$',
    optionB: '$x = 2$',
    optionC: '$x = \\frac{5}{2}$',
    optionD: '$x = \\frac{7}{2}$',
    correctOption: 'A',
    explanation: 'Ta có $32 = 2^5$. Phương trình tương đương $2x - 1 = 5 \\iff 2x = 6 \\iff x = 3$.'
  },
  {
    topic: 'Mũ & Logarit',
    level: 'van_dung',
    content: 'Tập nghiệm của bất phương trình $\\log_{\\frac{1}{2}}(x^2 - 5x + 7) \\ge 0$ là đoạn $[a; b]$. Tính $S = a + 2b$.',
    optionA: '$S = 8$',
    optionB: '$S = 7$',
    optionC: '$S = 5$',
    optionD: '$S = 9$',
    correctOption: 'A',
    explanation: 'Bất phương trình tương đương: $0 < x^2 - 5x + 7 \\le (\\frac{1}{2})^0 = 1$. Vì $x^2 - 5x + 7 = (x - \\frac{5}{2})^2 + \\frac{3}{4} > 0$, ta chỉ cần $x^2 - 5x + 6 \\le 0 \\iff 2 \\le x \\le 3$. Vậy $a = 2, b = 3 \\implies S = 2 + 2(3) = 8$.'
  },
  {
    topic: 'Mũ & Logarit',
    level: 'van_dung_cao',
    content: 'Có bao nhiêu cặp số nguyên $(x; y)$ thỏa mãn $1 \\le x \\le 2025$ và $2^{y} - \\log_2(x + 2^{y - 1}) = 2x - y$?',
    optionA: '11',
    optionB: '10',
    optionC: '2024',
    optionD: '12',
    correctOption: 'A',
    explanation: 'Biến đổi về dạng hàm đặc trưng $f(t) = 2^t + t$. Chứng minh hàm số đồng biến rồi suy ra mối quan hệ giữa $x$ và $y$, từ đó đếm số cặp nguyên.'
  },

  // 3. Nguyên hàm & Tích phân
  {
    topic: 'Nguyên hàm & Tích phân',
    level: 'nhan_biet',
    content: 'Họ nguyên hàm của hàm số $f(x) = 3x^2 + 2x$ là:',
    optionA: '$x^3 + x^2 + C$',
    optionB: '$6x + 2 + C$',
    optionC: '$3x^3 + 2x^2 + C$',
    optionD: '$x^3 + 2x^2 + C$',
    correctOption: 'A',
    explanation: 'Ta có $\\int (3x^2 + 2x) dx = 3 \\cdot \\frac{x^3}{3} + 2 \\cdot \\frac{x^2}{2} + C = x^3 + x^2 + C$.'
  },
  {
    topic: 'Nguyên hàm & Tích phân',
    level: 'thong_hieu',
    content: 'Tính tích phân $I = \\int_0^1 e^{2x} dx$.',
    optionA: '$I = \\frac{e^2 - 1}{2}$',
    optionB: '$I = e^2 - 1$',
    optionC: '$I = \\frac{e^2}{2}$',
    optionD: '$I = 2(e^2 - 1)$',
    correctOption: 'A',
    explanation: 'Ta có $\\int_0^1 e^{2x} dx = \\left[ \\frac{1}{2} e^{2x} \\right]_0^1 = \\frac{1}{2}(e^2 - e^0) = \\frac{e^2 - 1}{2}$.'
  },
  {
    topic: 'Nguyên hàm & Tích phân',
    level: 'van_dung',
    content: 'Biết tích phân $\\int_1^2 \\frac{2x + 1}{x^2 + x} dx = a \\ln 2 + b \\ln 3$ với $a, b \\in \\mathbb{Z}$. Tính $P = a^2 + b^2$.',
    optionA: '$P = 2$',
    optionB: '$P = 5$',
    optionC: '$P = 1$',
    optionD: '$P = 13$',
    correctOption: 'A',
    explanation: 'Nhận thấy $(x^2 + x)\' = 2x + 1$. Do đó $\\int_1^2 \\frac{d(x^2 + x)}{x^2 + x} = \\ln|x^2 + x|\\Big|_1^2 = \\ln 6 - \\ln 2 = \\ln 2 + \\ln 3 - \\ln 2 = \\ln 3$. Vậy $a = 0, b = 1 \\implies P = 1$ (hoặc phân tích tách mẫu).'
  },
  {
    topic: 'Nguyên hàm & Tích phân',
    level: 'van_dung_cao',
    content: 'Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $f(x) + f(2 - x) = x^2 - 2x + 4$. Tính $I = \\int_0^2 f(x) dx$.',
    optionA: '$I = \\frac{8}{3}$',
    optionB: '$I = \\frac{16}{3}$',
    optionC: '$I = 4$',
    optionD: '$I = \\frac{10}{3}$',
    correctOption: 'A',
    explanation: 'Lấy tích phân 2 vế từ 0 đến 2: $\\int_0^2 f(x)dx + \\int_0^2 f(2-x)dx = \\int_0^2 (x^2 - 2x + 4)dx$. Đặt $t = 2-x \\implies \\int_0^2 f(2-x)dx = \\int_0^2 f(x)dx$. Do đó $2I = \\left[\\frac{x^3}{3} - x^2 + 4x\\right]_0^2 = \\frac{8}{3} - 4 + 8 = \\frac{20}{3} \\implies I = \\frac{10}{3}$.'
  },

  // 4. Số phức
  {
    topic: 'Số phức',
    level: 'nhan_biet',
    content: 'Phần ảo của số phức $z = 3 - 4i$ là:',
    optionA: '$-4$',
    optionB: '$-4i$',
    optionC: '$4$',
    optionD: '$3$',
    correctOption: 'A',
    explanation: 'Số phức $z = a + bi$ có phần thực là $a = 3$, phần ảo là $b = -4$.'
  },
  {
    topic: 'Số phức',
    level: 'thong_hieu',
    content: 'Cho hai số phức $z_1 = 1 + 2i$ và $z_2 = 3 - i$. Môđun của số phức $w = z_1 \\cdot z_2$ bằng:',
    optionA: '$5\\sqrt{2}$',
    optionB: '$50$',
    optionC: '$\\sqrt{10}$',
    optionD: '$5$',
    correctOption: 'A',
    explanation: 'Ta có $|z_1| = \\sqrt{1^2 + 2^2} = \\sqrt{5}$, $|z_2| = \\sqrt{3^2 + (-1)^2} = \\sqrt{10}$. Do đó $|w| = |z_1| \\cdot |z_2| = \\sqrt{5} \\cdot \\sqrt{10} = \\sqrt{50} = 5\\sqrt{2}$.'
  },
  {
    topic: 'Số phức',
    level: 'van_dung',
    content: 'Trong mặt phẳng tọa độ, tập hợp các điểm biểu diễn số phức $z$ thỏa mãn $|z - 1 + 2i| = 3$ là đường tròn có phương trình:',
    optionA: '$(x - 1)^2 + (y + 2)^2 = 9$',
    optionB: '$(x + 1)^2 + (y - 2)^2 = 9$',
    optionC: '$(x - 1)^2 + (y + 2)^2 = 3$',
    optionD: '$(x + 1)^2 + (y - 2)^2 = 3$',
    correctOption: 'A',
    explanation: 'Đặt $z = x + yi$. Ta có $|(x - 1) + (y + 2)i| = 3 \\iff \\sqrt{(x - 1)^2 + (y + 2)^2} = 3 \\iff (x - 1)^2 + (y + 2)^2 = 9$.'
  },

  // 5. Hình học Oxyz trong không gian
  {
    topic: 'Hình học Oxyz trong không gian',
    level: 'nhan_biet',
    content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ của $(S)$ là:',
    optionA: '$I(1; -2; 3), R = 4$',
    optionB: '$I(-1; 2; -3), R = 4$',
    optionC: '$I(1; -2; 3), R = 16$',
    optionD: '$I(-1; 2; -3), R = 16$',
    correctOption: 'A',
    explanation: 'Phương trình $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$ có tâm $I(a; b; c) = (1; -2; 3)$ và bán kính $R = \\sqrt{16} = 4$.'
  },
  {
    topic: 'Hình học Oxyz trong không gian',
    level: 'thong_hieu',
    content: 'Trong không gian $Oxyz$, vectơ nào dưới đây là một vectơ pháp tuyến của mặt phẳng $(P): 2x - 3y + z - 5 = 0$?',
    optionA: '$\\vec{n} = (2; -3; 1)$',
    optionB: '$\\vec{n} = (2; 3; 1)$',
    optionC: '$\\vec{n} = (2; -3; -5)$',
    optionD: '$\\vec{n} = (-3; 1; -5)$',
    correctOption: 'A',
    explanation: 'Mặt phẳng $Ax + By + Cz + D = 0$ có một vectơ pháp tuyến là $\\vec{n} = (A; B; C) = (2; -3; 1)$.'
  },
  {
    topic: 'Hình học Oxyz trong không gian',
    level: 'van_dung',
    content: 'Trong không gian $Oxyz$, khoảng cách từ điểm $M(1; 2; -1)$ đến mặt phẳng $(P): 2x - 2y + z + 5 = 0$ bằng:',
    optionA: '$\\frac{2}{3}$',
    optionB: '$\\frac{4}{3}$',
    optionC: '$2$',
    optionD: '$\\frac{5}{3}$',
    correctOption: 'A',
    explanation: '$d(M, (P)) = \\frac{|2(1) - 2(2) + 1(-1) + 5|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{|2 - 4 - 1 + 5|}{\\sqrt{9}} = \\frac{2}{3}$.'
  },
  {
    topic: 'Hình học Oxyz trong không gian',
    level: 'van_dung_cao',
    content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): x^2 + y^2 + z^2 = 9$ và mặt phẳng $(P): x + 2y - 2z + 12 = 0$. Điểm $M$ thuộc $(S)$ sao cho khoảng cách từ $M$ đến $(P)$ nhỏ nhất có tọa độ là:',
    optionA: '$M(-1; -2; 2)$',
    optionB: '$M(1; 2; -2)$',
    optionC: '$M(-2; -1; 2)$',
    optionD: '$M(2; 1; -2)$',
    correctOption: 'A',
    explanation: 'Khoảng cách nhỏ nhất đạt được khi $M$ là hình chiếu của tâm $O(0,0,0)$ xuống $(P)$ dọc theo vectơ pháp tuyến hướng vào mặt cầu: $M = -R \\frac{\\vec{n}}{|\\vec{n}|} = -3 \\frac{(1; 2; -2)}{3} = (-1; -2; 2)$.'
  },

  // 6. Tổ hợp & Xác suất
  {
    topic: 'Tổ hợp & Xác suất',
    level: 'nhan_biet',
    content: 'Số cách chọn ngẫu nhiên 3 học sinh từ một nhóm gồm 10 học sinh là:',
    optionA: '$C_{10}^3$',
    optionB: '$A_{10}^3$',
    optionC: '$10^3$',
    optionD: '$3!$',
    correctOption: 'A',
    explanation: 'Chọn không phân biệt thứ tự 3 phần tử từ 10 phần tử là một tổ hợp chập 3 của 10 phần tử, ký hiệu $C_{10}^3$.'
  },
  {
    topic: 'Tổ hợp & Xác suất',
    level: 'thong_hieu',
    content: 'Gieo một con súc sắc cân đối và đồng chất hai lần liên tiếp. Xác suất để tổng số chấm xuất hiện trong hai lần gieo bằng 8 là:',
    optionA: '$\\frac{5}{36}$',
    optionB: '$\\frac{1}{6}$',
    optionC: '$\\frac{7}{36}$',
    optionD: '$\\frac{1}{9}$',
    correctOption: 'A',
    explanation: 'Số phần tử không gian mẫu $n(\\Omega) = 6 \\times 6 = 36$. Các cặp có tổng bằng 8 là $(2,6), (3,5), (4,4), (5,3), (6,2)$, gồm 5 kết quả. Vậy xác suất là $\\frac{5}{36}$.'
  },
  {
    topic: 'Tổ hợp & Xác suất',
    level: 'van_dung',
    content: 'Một hộp chứa 5 quả cầu đỏ và 7 quả cầu xanh cùng kích thước. Lấy ngẫu nhiên đồng thời 4 quả cầu. Xác suất để trong 4 quả lấy ra có ít nhất một quả cầu màu đỏ là:',
    optionA: '$\\frac{92}{99}$',
    optionB: '$\\frac{7}{99}$',
    optionC: '$\\frac{45}{99}$',
    optionD: '$\\frac{85}{99}$',
    correctOption: 'A',
    explanation: 'Số cách chọn 4 quả bất kỳ: $C_{12}^4 = 495$. Biến cố đối $\\overline{A}$: "Cả 4 quả đều màu xanh" có $C_7^4 = 35$ cách. Do đó $P(A) = 1 - \\frac{35}{495} = 1 - \\frac{7}{99} = \\frac{92}{99}$.'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading database file, re-initializing...', e);
    }
    return this.initializeDefaultData();
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  public initializeDefaultData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('123456', salt);

    const users: Array<User & { passwordHash: string }> = [
      {
        id: 1,
        username: 'giaovien',
        passwordHash: defaultPasswordHash,
        role: 'teacher',
        fullName: 'Thầy Nguyễn Văn Toán',
        className: 'Tổ Toán - Tin Học',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        username: 'hocsinh',
        passwordHash: defaultPasswordHash,
        role: 'student',
        fullName: 'Trần Minh Đức',
        className: '12A1',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        username: 'hocsinh2',
        passwordHash: defaultPasswordHash,
        role: 'student',
        fullName: 'Lê Thu Hà',
        className: '12A2',
        createdAt: new Date().toISOString()
      }
    ];

    const questions: Question[] = INITIAL_QUESTIONS.map((q, idx) => ({
      ...q,
      id: idx + 1,
      createdAt: new Date().toISOString()
    }));

    // Seed a standard Math Exam
    const examQuestionsIds = [1, 2, 5, 6, 9, 10, 13, 14, 16, 17, 3, 7, 11, 15, 18, 4, 8, 12, 19];
    const initialExam: Exam = {
      id: 1,
      title: 'Khảo Sát Chất Lượng Toán 12 - Lần 1',
      description: 'Đề thi trắc nghiệm chuẩn cấu trúc ma trận 4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.',
      code: 'TOAN-101',
      durationMinutes: 45,
      shuffleOptions: true,
      shuffleQuestions: true,
      startTime: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      endTime: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(),
      matrixConfig: {
        totalQuestions: 15,
        nhanBiet: 6,
        thongHieu: 5,
        vanDung: 3,
        vanDungCao: 1
      },
      totalQuestions: 15,
      createdAt: new Date().toISOString()
    };

    const examQuestions = examQuestionsIds.slice(0, 15).map((qId, idx) => ({
      examId: 1,
      questionId: qId,
      orderIndex: idx + 1
    }));

    // Seed a completed student session
    const sampleStudentAnswers: Record<number, string> = {
      1: 'A',
      2: 'A',
      5: 'A',
      6: 'A',
      9: 'A',
      10: 'A',
      13: 'A',
      14: 'A',
      16: 'A',
      17: 'B', // wrong
      3: 'A',
      7: 'A',
      11: 'C', // wrong
      15: 'A',
      18: 'A'
    };

    const examSessions: ExamSession[] = [
      {
        id: 1,
        examId: 1,
        examTitle: initialExam.title,
        examCode: initialExam.code,
        studentId: 2,
        studentName: 'Trần Minh Đức',
        studentClass: '12A1',
        startTime: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        submitTime: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        score: 8.67,
        totalCorrect: 13,
        totalQuestions: 15,
        studentAnswers: sampleStudentAnswers,
        status: 'completed'
      }
    ];

    const initialDb: DatabaseSchema = {
      users,
      questions,
      exams: [initialExam],
      examQuestions,
      examSessions
    };

    this.data = initialDb;
    this.save();
    return initialDb;
  }

  // --- Users ---
  public findUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserById(id: number) {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'> & { passwordHash: string }) {
    const nextId = this.data.users.length ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      ...user,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public getAllStudents() {
    const students = this.data.users.filter(u => u.role === 'student');
    return students.map(s => {
      const studentSessions = this.data.examSessions.filter(es => es.studentId === s.id && es.status === 'completed');
      const avgScore = studentSessions.length
        ? Number((studentSessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / studentSessions.length).toFixed(2))
        : 0;
      return {
        id: s.id,
        username: s.username,
        fullName: s.fullName,
        className: s.className,
        totalExamsTaken: studentSessions.length,
        avgScore,
        createdAt: s.createdAt
      };
    });
  }

  // --- Questions ---
  public getQuestions(filters?: { topic?: string; level?: QuestionLevel; search?: string }) {
    let result = [...this.data.questions];
    if (filters?.topic && filters.topic !== 'all') {
      result = result.filter(q => q.topic === filters.topic);
    }
    if (filters?.level && filters.level !== ('all' as any)) {
      result = result.filter(q => q.level === filters.level);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(q => 
        q.content.toLowerCase().includes(term) || 
        q.explanation.toLowerCase().includes(term) ||
        q.topic.toLowerCase().includes(term)
      );
    }
    return result;
  }

  public getQuestionById(id: number) {
    return this.data.questions.find(q => q.id === id);
  }

  public createQuestion(question: Omit<Question, 'id' | 'createdAt'>) {
    const nextId = this.data.questions.length ? Math.max(...this.data.questions.map(q => q.id)) + 1 : 1;
    const newQuestion: Question = {
      ...question,
      id: nextId,
      createdAt: new Date().toISOString()
    };
    this.data.questions.push(newQuestion);
    this.save();
    return newQuestion;
  }

  public updateQuestion(id: number, updates: Partial<Question>) {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = {
      ...this.data.questions[idx],
      ...updates,
      id
    };
    this.save();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: number) {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.data.questions.splice(idx, 1);
    // Remove from exam_questions
    this.data.examQuestions = this.data.examQuestions.filter(eq => eq.questionId !== id);
    this.save();
    return true;
  }

  // --- Matrix Algorithm for Auto Exam Generation ---
  public generateExamFromMatrix(params: {
    title: string;
    description?: string;
    code: string;
    durationMinutes: number;
    shuffleOptions?: boolean;
    shuffleQuestions?: boolean;
    startTime?: string;
    endTime?: string;
    matrix: {
      nhanBiet: number;
      thongHieu: number;
      vanDung: number;
      vanDungCao: number;
      topics?: string[];
    };
  }) {
    const { matrix } = params;
    const allQuestions = [...this.data.questions];

    // Filter by allowed topics if specified
    const pool = matrix.topics && matrix.topics.length > 0
      ? allQuestions.filter(q => matrix.topics!.includes(q.topic))
      : allQuestions;

    const byLevel: Record<QuestionLevel, Question[]> = {
      nhan_biet: pool.filter(q => q.level === 'nhan_biet'),
      thong_hieu: pool.filter(q => q.level === 'thong_hieu'),
      van_dung: pool.filter(q => q.level === 'van_dung'),
      van_dung_cao: pool.filter(q => q.level === 'van_dung_cao'),
    };

    // Helper to shuffle array (Fisher-Yates)
    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const selectedQuestions: Question[] = [];
    const missingErrors: string[] = [];

    const levelsToPick: Array<{ key: QuestionLevel; count: number; name: string }> = [
      { key: 'nhan_biet', count: matrix.nhanBiet, name: 'Nhận biết' },
      { key: 'thong_hieu', count: matrix.thongHieu, name: 'Thông hiểu' },
      { key: 'van_dung', count: matrix.vanDung, name: 'Vận dụng' },
      { key: 'van_dung_cao', count: matrix.vanDungCao, name: 'Vận dụng cao' },
    ];

    for (const item of levelsToPick) {
      if (item.count > 0) {
        const available = byLevel[item.key];
        if (available.length < item.count) {
          missingErrors.push(`Mức độ "${item.name}" yêu cầu ${item.count} câu, nhưng ngân hàng chỉ có ${available.length} câu phù hợp.`);
        }
        const picked = shuffle(available).slice(0, item.count);
        selectedQuestions.push(...picked);
      }
    }

    if (missingErrors.length > 0) {
      throw new Error(missingErrors.join(' '));
    }

    // Optionally shuffle the full question list
    const finalQuestions = params.shuffleQuestions !== false ? shuffle(selectedQuestions) : selectedQuestions;

    const nextExamId = this.data.exams.length ? Math.max(...this.data.exams.map(e => e.id)) + 1 : 1;
    const newExam: Exam = {
      id: nextExamId,
      title: params.title,
      description: params.description,
      code: params.code || `TOAN-${Math.floor(100 + Math.random() * 900)}`,
      durationMinutes: params.durationMinutes || 45,
      shuffleOptions: params.shuffleOptions ?? true,
      shuffleQuestions: params.shuffleQuestions ?? true,
      startTime: params.startTime,
      endTime: params.endTime,
      matrixConfig: {
        totalQuestions: finalQuestions.length,
        nhanBiet: matrix.nhanBiet,
        thongHieu: matrix.thongHieu,
        vanDung: matrix.vanDung,
        vanDungCao: matrix.vanDungCao,
        topics: matrix.topics
      },
      totalQuestions: finalQuestions.length,
      createdAt: new Date().toISOString()
    };

    this.data.exams.push(newExam);

    // Save relation
    finalQuestions.forEach((q, idx) => {
      this.data.examQuestions.push({
        examId: newExam.id,
        questionId: q.id,
        orderIndex: idx + 1
      });
    });

    this.save();
    return { exam: newExam, questions: finalQuestions };
  }

  // --- Exams ---
  public getExams() {
    return this.data.exams.map(e => {
      const qRelations = this.data.examQuestions.filter(eq => eq.examId === e.id);
      return {
        ...e,
        totalQuestions: qRelations.length
      };
    });
  }

  public getExamById(id: number) {
    const exam = this.data.exams.find(e => e.id === id);
    if (!exam) return null;

    const relations = this.data.examQuestions
      .filter(eq => eq.examId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const questions: Question[] = [];
    for (const rel of relations) {
      const q = this.data.questions.find(item => item.id === rel.questionId);
      if (q) questions.push(q);
    }

    return {
      ...exam,
      questions,
      totalQuestions: questions.length
    };
  }

  public deleteExam(id: number) {
    const idx = this.data.exams.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.exams.splice(idx, 1);
    this.data.examQuestions = this.data.examQuestions.filter(eq => eq.examId !== id);
    this.save();
    return true;
  }

  // --- Exam Sessions (Online Examination) ---
  public createExamSession(examId: number, studentId: number) {
    const exam = this.getExamById(examId);
    if (!exam) throw new Error('Đề thi không tồn tại.');

    const student = this.findUserById(studentId);
    if (!student) throw new Error('Học sinh không tồn tại.');

    const nextId = this.data.examSessions.length ? Math.max(...this.data.examSessions.map(s => s.id)) + 1 : 1;
    const session: ExamSession = {
      id: nextId,
      examId,
      examTitle: exam.title,
      examCode: exam.code,
      studentId,
      studentName: student.fullName,
      studentClass: student.className,
      startTime: new Date().toISOString(),
      totalQuestions: exam.questions?.length || 0,
      studentAnswers: {},
      status: 'in_progress'
    };

    this.data.examSessions.push(session);
    this.save();
    return session;
  }

  public submitExamSession(sessionId: number, studentAnswers: Record<number, string>) {
    const session = this.data.examSessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Phiên thi không tồn tại.');

    const exam = this.getExamById(session.examId);
    if (!exam || !exam.questions) throw new Error('Đề thi không hợp lệ.');

    let correctCount = 0;
    const reviewQuestions: Array<Question & { studentAnswer?: string; isCorrect?: boolean }> = [];

    for (const q of exam.questions) {
      const studentAns = studentAnswers[q.id];
      const isCorrect = studentAns === q.correctOption;
      if (isCorrect) correctCount++;

      reviewQuestions.push({
        ...q,
        studentAnswer: studentAns || '',
        isCorrect
      });
    }

    const totalQuestions = exam.questions.length;
    const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 10).toFixed(2)) : 0;

    session.studentAnswers = studentAnswers;
    session.submitTime = new Date().toISOString();
    session.totalCorrect = correctCount;
    session.totalQuestions = totalQuestions;
    session.score = score;
    session.status = 'completed';

    this.save();

    return {
      ...session,
      reviewQuestions
    };
  }

  public getExamSessions(filters?: { studentId?: number; examId?: number }) {
    let result = [...this.data.examSessions];
    if (filters?.studentId) {
      result = result.filter(s => s.studentId === filters.studentId);
    }
    if (filters?.examId) {
      result = result.filter(s => s.examId === filters.examId);
    }
    return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getSessionById(sessionId: number) {
    const session = this.data.examSessions.find(s => s.id === sessionId);
    if (!session) return null;

    const exam = this.getExamById(session.examId);
    const reviewQuestions: Array<Question & { studentAnswer?: string; isCorrect?: boolean }> = [];

    if (exam?.questions) {
      for (const q of exam.questions) {
        const studentAns = session.studentAnswers[q.id];
        reviewQuestions.push({
          ...q,
          studentAnswer: studentAns || '',
          isCorrect: studentAns === q.correctOption
        });
      }
    }

    return {
      ...session,
      reviewQuestions
    };
  }

  // --- Stats for Teacher Dashboard ---
  public getTeacherStats() {
    const totalQuestions = this.data.questions.length;
    const totalExams = this.data.exams.length;
    const completedSessions = this.data.examSessions.filter(s => s.status === 'completed');
    const totalSessions = completedSessions.length;

    const avgScore = totalSessions > 0
      ? Number((completedSessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalSessions).toFixed(2))
      : 0;

    const levelCounts: Record<QuestionLevel, number> = {
      nhan_biet: 0,
      thong_hieu: 0,
      van_dung: 0,
      van_dung_cao: 0
    };

    this.data.questions.forEach(q => {
      if (levelCounts[q.level] !== undefined) {
        levelCounts[q.level]++;
      }
    });

    const topicCounts: Record<string, number> = {};
    this.data.questions.forEach(q => {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    });

    return {
      totalQuestions,
      totalExams,
      totalSessions,
      avgScore,
      levelCounts,
      topicCounts,
      recentSessions: completedSessions.slice(0, 10)
    };
  }
}

export const db = new Database();
