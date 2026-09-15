import mammoth from 'mammoth';
// @ts-ignore
import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { QuestionLevel, COMMON_TOPICS } from '../src/types.js';

export interface ParsedQuestionItem {
  topic: string;
  level: QuestionLevel;
  content: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/**
 * Heuristic auto-detection for math topic based on content keywords
 */
export function detectTopic(text: string, defaultTopic: string = 'Hàm số & Đồ thị'): string {
  const lower = text.toLowerCase();
  if (lower.includes('hàm số') || lower.includes('đạo hàm') || lower.includes('tiệm cận') || lower.includes('cực trị') || lower.includes('biến thiên') || lower.includes('đồng biến') || lower.includes('nghịch biến')) {
    return 'Hàm số & Đồ thị';
  }
  if (lower.includes('logarit') || lower.includes('log_') || lower.includes('\\log') || lower.includes('mũ') || lower.includes('lũy thừa')) {
    return 'Mũ & Logarit';
  }
  if (lower.includes('tích phân') || lower.includes('nguyên hàm') || lower.includes('\\int') || lower.includes('diện tích hình phẳng')) {
    return 'Nguyên hàm & Tích phân';
  }
  if (lower.includes('số phức') || lower.includes('phần thực') || lower.includes('phần ảo') || lower.includes('môđun') || lower.includes('modun') || lower.includes('|z|')) {
    return 'Số phức';
  }
  if (lower.includes('oxyz') || lower.includes('mặt phẳng') || lower.includes('mặt cầu') || lower.includes('đường thẳng') || lower.includes('vectơ') || lower.includes('tọa độ')) {
    return 'Hình học Oxyz trong không gian';
  }
  if (lower.includes('khối chóp') || lower.includes('lăng trụ') || lower.includes('thể tích') || lower.includes('khối nón') || lower.includes('khối trụ') || lower.includes('hình chóp')) {
    return 'Khối đa diện & Thể tích';
  }
  if (lower.includes('xác suất') || lower.includes('chọn ngẫu nhiên') || lower.includes('tổ hợp') || lower.includes('chỉnh hợp') || lower.includes('hoán vị')) {
    return 'Tổ hợp & Xác suất';
  }
  return defaultTopic || COMMON_TOPICS[0];
}

/**
 * Heuristic auto-detection for question level
 */
export function detectLevel(text: string): QuestionLevel {
  const lower = text.toLowerCase();
  if (lower.includes('[vdc]') || lower.includes('vận dụng cao') || lower.includes('giá trị lớn nhất') || lower.includes('tham số m để') || lower.includes('thỏa mãn điều kiện')) {
    return 'van_dung_cao';
  }
  if (lower.includes('[vd]') || lower.includes('vận dụng') || lower.includes('tìm m') || lower.includes('khoảng cách') || lower.includes('cắt nhau')) {
    return 'van_dung';
  }
  if (lower.includes('[th]') || lower.includes('thông hiểu') || lower.includes('tiệm cận') || lower.includes('nghiệm của')) {
    return 'thong_hieu';
  }
  return 'nhan_biet';
}

/**
 * Rule-based regex parser for Vietnamese math test documents
 */
export function parseTextWithRules(rawText: string, defaultTopic: string = 'Hàm số & Đồ thị'): ParsedQuestionItem[] {
  const clean = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const questions: ParsedQuestionItem[] = [];

  // Split by Question markers: "Câu 1", "Câu 2:", "Bài 1", etc.
  const questionBlocks = clean.split(/(?:^|\n)(?=(?:Câu|Bài)\s*\d+[:.])/gi);

  for (const block of questionBlocks) {
    const trimmed = block.trim();
    if (!trimmed || !/^(?:Câu|Bài)\s*\d+[:.]/i.test(trimmed)) continue;

    // Extract Question header line and body
    const matchHeader = trimmed.match(/^(?:Câu|Bài)\s*\d+[:.]\s*([\s\S]*)/i);
    if (!matchHeader) continue;

    const fullContent = matchHeader[1].trim();

    // Look for A. B. C. D. options
    // Common formats:
    // A. ... B. ... C. ... D. ...
    // [A]. ...
    const optionRegex = /(?:^|\s|\n)([A-D])[.):]\s*([\s\S]*?)(?=(?:(?:^|\s|\n)[A-D][.):])|(?:Đáp án|Lời giải|Hướng dẫn giải)|$)/gi;
    
    let contentOnly = fullContent;
    const firstOptionIdx = fullContent.search(/(?:^|\s|\n)[A-D][.):]/);
    if (firstOptionIdx !== -1) {
      contentOnly = fullContent.substring(0, firstOptionIdx).trim();
    }

    const optionsMap: Record<string, string> = { A: '', B: '', C: '', D: '' };
    let optionMatch: RegExpExecArray | null;
    const searchPart = firstOptionIdx !== -1 ? fullContent.substring(firstOptionIdx) : fullContent;

    while ((optionMatch = optionRegex.exec(searchPart)) !== null) {
      const optLetter = optionMatch[1].toUpperCase();
      const optText = optionMatch[2].trim();
      optionsMap[optLetter] = optText;
    }

    // Extract correct option if indicated
    let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
    const ansMatch = fullContent.match(/(?:Đáp án|Đ\/a|Chọn|Key)[:\s]*([A-D])/i);
    if (ansMatch) {
      correctOption = ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    } else {
      // Check if any option is marked with * (e.g., *A. or A*. )
      const starMatch = fullContent.match(/\*([A-D])[.):]|([A-D])\*[.):]/);
      if (starMatch) {
        correctOption = (starMatch[1] || starMatch[2]).toUpperCase() as 'A' | 'B' | 'C' | 'D';
      }
    }

    // Extract explanation if available
    let explanation = '';
    const expMatch = fullContent.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết)[:\s]*([\s\S]*)$/i);
    if (expMatch) {
      explanation = expMatch[1].trim();
    }

    // Ensure valid question if at least option A and B exist
    if (contentOnly && (optionsMap.A || optionsMap.B)) {
      questions.push({
        topic: detectTopic(contentOnly, defaultTopic),
        level: detectLevel(contentOnly),
        content: contentOnly,
        optionA: optionsMap.A || 'Đang cập nhật...',
        optionB: optionsMap.B || 'Đang cập nhật...',
        optionC: optionsMap.C || 'Đang cập nhật...',
        optionD: optionsMap.D || 'Đang cập nhật...',
        correctOption,
        explanation: explanation || 'Chưa có lời giải chi tiết.'
      });
    }
  }

  return questions;
}

/**
 * Parses questions using Gemini AI for highest accuracy with LaTeX math
 */
async function parseWithGemini(
  contentInput: { text?: string; base64Pdf?: string },
  defaultTopic: string = 'Hàm số & Đồ thị'
): Promise<ParsedQuestionItem[]> {
  const ai = getAIClient();
  if (!ai) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `Bạn là chuyên gia chuyển đổi đề thi Toán học Việt Nam.
Hãy phân tích tài liệu/văn bản được cung cấp và trích xuất danh sách tất cả các câu hỏi trắc nghiệm Toán học.
Yêu cầu định dạng nghiêm ngặt:
1. Mọi công thức Toán, biểu thức toán học, ký hiệu đạo hàm, tích phân, ma trận, vector, hình học PHẢI được chuyển thành mã LaTeX chuẩn và kẹp trong dấu $ (ví dụ: $y = x^3 - 3x$, $\\int_0^1 f(x)dx$, $\\vec{n} = (1; 2; 3)$, $\\frac{a}{b}$).
2. Trích xuất đúng 4 phương án optionA, optionB, optionC, optionD.
3. Xác định correctOption ('A', 'B', 'C', hoặc 'D') từ đáp án được gạch chân, in đậm, đánh dấu sao hoặc bảng đáp án cuối bài nếu có (nếu không rõ, mặc định 'A').
4. explanation: Lời giải chi tiết nếu có trong tài liệu, hoặc tóm tắt cách giải ngắn gọn.
5. level: Nhận biết ('nhan_biet'), Thông hiểu ('thong_hieu'), Vận dụng ('van_dung'), Vận dụng cao ('van_dung_cao').
6. topic: Chọn 1 trong các chuyên đề Toán THPT:
   - 'Hàm số & Đồ thị'
   - 'Mũ & Logarit'
   - 'Nguyên hàm & Tích phân'
   - 'Số phức'
   - 'Hình học Oxyz trong không gian'
   - 'Khối đa diện & Thể tích'
   - 'Tổ hợp & Xác suất'

Trả về kết quả dưới dạng mảng JSON các câu hỏi.`;

  const contents: any[] = [];

  if (contentInput.base64Pdf) {
    contents.push({
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: contentInput.base64Pdf
          }
        },
        { text: prompt }
      ]
    });
  } else if (contentInput.text) {
    contents.push({
      role: 'user',
      parts: [
        { text: `${prompt}\n\nNỘI DUNG TÀI LIỆU CẦN TRÍCH XUẤT:\n\n${contentInput.text}` }
      ]
    });
  } else {
    return [];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY' as any,
        description: 'Danh sách các câu hỏi toán học trích xuất được',
        items: {
          type: 'OBJECT' as any,
          properties: {
            topic: { type: 'STRING' as any },
            level: { type: 'STRING' as any, enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'] },
            content: { type: 'STRING' as any },
            optionA: { type: 'STRING' as any },
            optionB: { type: 'STRING' as any },
            optionC: { type: 'STRING' as any },
            optionD: { type: 'STRING' as any },
            correctOption: { type: 'STRING' as any, enum: ['A', 'B', 'C', 'D'] },
            explanation: { type: 'STRING' as any }
          },
          required: ['topic', 'level', 'content', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption']
        }
      }
    }
  });

  const rawJson = response.text || '[]';
  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: any) => ({
    topic: item.topic || defaultTopic,
    level: item.level || 'nhan_biet',
    content: item.content || '',
    optionA: item.optionA || '',
    optionB: item.optionB || '',
    optionC: item.optionC || '',
    optionD: item.optionD || '',
    correctOption: item.correctOption || 'A',
    explanation: item.explanation || ''
  }));
}

/**
 * Main dispatcher: parses Word (.docx), PDF or raw text into Math questions
 */
export async function parseUploadedDocument(params: {
  base64?: string;
  mimeType?: string;
  fileName?: string;
  rawText?: string;
  defaultTopic?: string;
}): Promise<{ questions: ParsedQuestionItem[]; parserUsed: 'gemini-ai' | 'rule-based'; rawExtractedText?: string }> {
  const { base64, mimeType, fileName = '', rawText = '', defaultTopic = 'Hàm số & Đồ thị' } = params;
  let extractedText = rawText;
  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fileName.toLowerCase().endsWith('.docx') ||
    fileName.toLowerCase().endsWith('.doc');

  // 1. Extract text from Word or PDF if base64 provided
  if (base64 && isDocx) {
    try {
      const buffer = Buffer.from(base64, 'base64');
      const mammothResult = await mammoth.extractRawText({ buffer });
      extractedText = mammothResult.value;
    } catch (err: any) {
      console.error('Word extraction error:', err);
      throw new Error(`Không thể đọc file Word (.docx): ${err.message || 'File không đúng định dạng'}`);
    }
  } else if (base64 && isPdf) {
    try {
      const buffer = Buffer.from(base64, 'base64');
      const parser = new (PDFParse as any)({ data: buffer });
      const pdfData = await parser.getText();
      if (pdfData && pdfData.text) {
        extractedText = pdfData.text;
      }
    } catch (pdfErr: any) {
      console.warn('PDF extraction with pdf-parse error:', pdfErr?.message);
    }
  }

  // 2. Attempt parsing with Gemini AI first if available
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (hasGemini) {
    try {
      if (isPdf && base64) {
        const questions = await parseWithGemini({ base64Pdf: base64 }, defaultTopic);
        if (questions.length > 0) {
          return { questions, parserUsed: 'gemini-ai' };
        }
      } else if (extractedText && extractedText.trim().length > 10) {
        const questions = await parseWithGemini({ text: extractedText }, defaultTopic);
        if (questions.length > 0) {
          return { questions, parserUsed: 'gemini-ai', rawExtractedText: extractedText };
        }
      }
    } catch (aiErr: any) {
      console.warn('Gemini parsing warning, falling back to rule-based parser:', aiErr.message);
    }
  }

  // 3. Fallback to Regex/Rule-based parser
  if (extractedText && extractedText.trim().length > 10) {
    const questions = parseTextWithRules(extractedText, defaultTopic);
    return {
      questions,
      parserUsed: 'rule-based',
      rawExtractedText: extractedText
    };
  }

  if (isPdf && !hasGemini) {
    throw new Error(
      'Để đọc trực tiếp file PDF với công thức toán học phức tạp, hệ thống khuyến nghị cấu hình GEMINI_API_KEY. Bạn có thể mở file PDF, copy toàn bộ nội dung và dán vào ô "Dán văn bản thô" để nhập ngay!'
    );
  }

  throw new Error('Không tìm thấy nội dung câu hỏi hợp lệ trong tài liệu tải lên.');
}
