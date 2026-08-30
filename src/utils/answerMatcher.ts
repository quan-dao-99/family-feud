import type { Answer } from '../types/game';

export interface FastMoneyAnswerOption {
  text: string;
  points: number;
}

export type MatchStatus = 'MATCH_NEW' | 'MATCH_ALREADY_REVEALED' | 'NO_MATCH';

export interface MatchResult {
  status: MatchStatus;
  matchedAnswer: Answer | null;
  matchedVariation: string;
  similarity: number;
  message: string;
}

export interface FastMoneyMatchResult {
  status: 'MATCH' | 'NO_MATCH';
  matchedAnswer: FastMoneyAnswerOption | null;
  matchedVariation: string;
  similarity: number;
  message: string;
}

/**
 * Loại bỏ dấu tiếng Việt để so sánh không dấu (phụ trợ)
 */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa chuỗi văn bản: viết thường, loại bỏ dấu câu và khoảng trắng thừa
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'…–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Bảng quy đổi số từ 0 - 100 dạng chữ tiếng Việt sang chữ số
 */
const NUMBER_WORDS_MAP: Record<string, number> = {
  'không': 0, 'khong': 0,
  'một': 1, 'mot': 1, 'mốt': 1,
  'hai': 2,
  'ba': 3,
  'bốn': 4, 'bon': 4, 'tư': 4, 'tu': 4,
  'năm': 5, 'nam': 5, 'lăm': 5, 'lam': 5, 'nhăm': 5, 'nham': 5,
  'sáu': 6, 'sau': 6,
  'bảy': 7, 'bay': 7, 'bẩy': 7, 'bey': 7,
  'tám': 8, 'tam': 8,
  'chín': 9, 'chin': 9,
  'mười': 10, 'muoi': 10,
};

const NUMBER_TO_WORDS: Record<number, string[]> = {
  0: ['không', 'khong'],
  1: ['một', 'mot', 'mốt'],
  2: ['hai'],
  3: ['ba'],
  4: ['bốn', 'bon', 'tư'],
  5: ['năm', 'nam', 'lăm', 'nhăm'],
  6: ['sáu', 'sau'],
  7: ['bảy', 'bay', 'bẩy'],
  8: ['tám', 'tam'],
  9: ['chín', 'chin'],
  10: ['mười', 'muoi'],
};

/**
 * Chuyển đổi chuỗi chữ số tiếng Việt cơ bản (0 - 100) sang số số
 * Ví dụ: "hai mươi lăm" -> "25", "bảy" -> "7", "mười hai" -> "12"
 */
export function convertVietnameseWordsToNumber(text: string): string {
  const norm = normalizeText(text);
  if (!norm) return text;

  // Single word numbers 0 - 10
  if (NUMBER_WORDS_MAP[norm] !== undefined) {
    return String(NUMBER_WORDS_MAP[norm]);
  }

  // Two word numbers (11 - 19)
  if (norm.startsWith('mười ') || norm.startsWith('muoi ')) {
    const unitWord = norm.replace(/^mư?ời\s+/, '').trim();
    if (NUMBER_WORDS_MAP[unitWord] !== undefined) {
      return String(10 + NUMBER_WORDS_MAP[unitWord]);
    }
  }

  // Tens numbers: "hai mươi", "hai mươi lăm", "ba mươi", v.v.
  const tensMatch = norm.match(/^(hai|ba|bốn|bon|tư|năm|nam|sáu|sau|bảy|bay|bẩy|tám|tam|chín|chin)\s+(mươi|muoi|chục|hăm)(\s+(một|mot|mốt|hai|ba|bốn|bon|tư|năm|nam|lăm|lam|nhăm|nham|sáu|sau|bảy|bay|bẩy|tám|tam|chín|chin))?$/);
  if (tensMatch) {
    const tensDigit = NUMBER_WORDS_MAP[tensMatch[1]] || 0;
    const unitWord = tensMatch[4];
    const unitDigit = unitWord ? (NUMBER_WORDS_MAP[unitWord] || 0) : 0;
    return String(tensDigit * 10 + unitDigit);
  }

  return text;
}

/**
 * Loại bỏ các từ đệm thông dụng khi người chơi trả lời trên gameshow
 * Ví dụ: "Dạ thưa MC câu trả lời của em là bánh mì" -> "bánh mì"
 */
export function cleanSpokenTranscript(transcript: string): string {
  let cleaned = normalizeText(transcript);
  if (!cleaned) return '';

  const fillerPrefixes = [
    /^(dạ\s+)?(thưa\s+mc\s+)?câu\s+trả\s+lời\s+(của\s+(em|tôi|mình)\s+)?là\s+/i,
    /^(dạ\s+)?(thưa\s+mc\s+)?đáp\s+án\s+(của\s+(em|tôi|mình)\s+)?là\s+/i,
    /^(dạ\s+)?(tôi|em|mình)\s+(xin\s+)?(chọn|nghĩ\s+là|đoán\s+là|trả\s+lời\s+là)\s+/i,
    /^(dạ\s+)?theo\s+(tôi|em|mình)\s+(thì\s+)?là\s+/i,
    /^(dạ\s+)?chắc\s+là\s+/i,
    /^(dạ\s+thưa\s+mc\s+|thưa\s+mc\s+|dạ\s+)/i,
    /^(là\s+)/i,
  ];

  for (const prefix of fillerPrefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  return cleaned;
}

/**
 * Tách các biến thể của một câu trả lời trong game show.
 * Tự động tạo các biến thể số dạng chữ và số, ngoặc đơn, gạch chéo.
 */
export function extractAnswerVariations(answerText: string): string[] {
  const rawNormalized = normalizeText(answerText);
  const variations = new Set<string>();

  if (rawNormalized) {
    variations.add(rawNormalized);
  }

  // Tách theo dấu gạch chéo /, dấu phẩy, chữ "hoặc", "hay", "|"
  const splitPattern = /[/|,]|(\bhoặc\b)|(\bhay\b)/gi;
  const parts = answerText.split(splitPattern).filter(Boolean);

  for (const part of parts) {
    const cleaned = normalizeText(part);
    if (cleaned && cleaned.length >= 1) {
      variations.add(cleaned);
    }
  }

  // Tách nội dung trong ngoặc đơn (...)
  const parenMatches = answerText.match(/\(([^)]+)\)/g);
  if (parenMatches) {
    for (const match of parenMatches) {
      const insideParen = match.replace(/[()]/g, '');
      const cleanedInside = normalizeText(insideParen);
      if (cleanedInside) {
        variations.add(cleanedInside);
      }
      const outsideParen = normalizeText(answerText.replace(match, ''));
      if (outsideParen) {
        variations.add(outsideParen);
      }
    }
  }

  // Thêm biến thể cho số (ví dụ "7" -> "bảy", "25 tuổi" -> "hai mươi lăm tuổi", "25")
  const currentVars = Array.from(variations);
  for (const v of currentVars) {
    // Nếu v là số đơn lẻ (ví dụ "7")
    const num = parseInt(v, 10);
    if (!isNaN(num) && String(num) === v) {
      const words = NUMBER_TO_WORDS[num];
      if (words) {
        words.forEach((w) => variations.add(w));
      }
    }

    // Nếu v chứa số kèm chữ (ví dụ "25 tuổi")
    const numPrefixMatch = v.match(/^(\d+)\s*(.*)$/);
    if (numPrefixMatch) {
      const digits = parseInt(numPrefixMatch[1], 10);
      const suffix = numPrefixMatch[2];
      variations.add(numPrefixMatch[1]); // e.g. "25"
      if (digits <= 10 && NUMBER_TO_WORDS[digits]) {
        NUMBER_TO_WORDS[digits].forEach((w) => {
          variations.add(`${w} ${suffix}`.trim());
          variations.add(w);
        });
      }
    }

    // Ngược lại: nếu v là chữ số tiếng Việt (ví dụ "bảy"), thêm "7"
    if (NUMBER_WORDS_MAP[v] !== undefined) {
      variations.add(String(NUMBER_WORDS_MAP[v]));
    }
  }

  return Array.from(variations);
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // Xóa
        d[i][j - 1] + 1, // Chèn
        d[i - 1][j - 1] + cost // Thay thế
      );
    }
  }

  return d[m][n];
}

/**
 * Tính độ tương đồng từ 0 (hoàn toàn khác) đến 1 (trùng khớp hoàn toàn)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;

  // 1. Kiểm tra quy đổi số tiếng Việt (ví dụ: người nói "bảy" mà đáp án là "7")
  const num1 = convertVietnameseWordsToNumber(norm1);
  const num2 = convertVietnameseWordsToNumber(norm2);
  if (num1 === num2 || norm1 === num2 || num1 === norm2) {
    return 1;
  }

  // 2. Kiểm tra bao hàm trực tiếp (Substring containment)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return Math.max(0.88, minLen / maxLen);
  }

  // 3. Kiểm tra không dấu
  const nonAccent1 = removeVietnameseDiacritics(norm1);
  const nonAccent2 = removeVietnameseDiacritics(norm2);
  if (nonAccent1 === nonAccent2) {
    return 0.95;
  }
  if (nonAccent1.includes(nonAccent2) || nonAccent2.includes(nonAccent1)) {
    return 0.85;
  }

  // 4. Kiểm tra tập hợp từ (Word overlap / Jaccard similarity)
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const union = new Set([...words1, ...words2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // 5. Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const levDist = levenshteinDistance(norm1, norm2);
  const levSim = 1 - levDist / maxLen;

  return Math.max(jaccard, levSim);
}

/**
 * So khớp câu trả lời người chơi vừa nói với danh sách đáp án của vòng đấu
 */
export function matchAnswer(
  transcript: string,
  answers: Answer[],
  revealedAnswerIds: string[] = [],
  threshold: number = 0.60
): MatchResult {
  const rawClean = normalizeText(transcript);
  const cleanTranscript = cleanSpokenTranscript(transcript);

  if ((!rawClean && !cleanTranscript) || !answers || answers.length === 0) {
    return {
      status: 'NO_MATCH',
      matchedAnswer: null,
      matchedVariation: '',
      similarity: 0,
      message: 'Không nhận diện được giọng nói hoặc chưa có đáp án.',
    };
  }

  let bestMatch: {
    answer: Answer;
    variation: string;
    similarity: number;
  } | null = null;

  for (const ans of answers) {
    const variations = extractAnswerVariations(ans.text);
    for (const v of variations) {
      // Test cả transcript đã lọc filler và transcript gốc
      const simClean = calculateSimilarity(cleanTranscript, v);
      const simRaw = calculateSimilarity(rawClean, v);
      const sim = Math.max(simClean, simRaw);

      if (sim > (bestMatch?.similarity || 0)) {
        bestMatch = {
          answer: ans,
          variation: v,
          similarity: sim,
        };
      }
    }
  }

  if (bestMatch && bestMatch.similarity >= threshold) {
    const isRevealed = revealedAnswerIds.includes(bestMatch.answer.id);
    return {
      status: isRevealed ? 'MATCH_ALREADY_REVEALED' : 'MATCH_NEW',
      matchedAnswer: bestMatch.answer,
      matchedVariation: bestMatch.variation,
      similarity: Math.round(bestMatch.similarity * 100) / 100,
      message: isRevealed
        ? `Đáp án "${bestMatch.answer.text}" đã được lật trước đó!`
        : `Khớp đáp án: "${bestMatch.answer.text}" (${bestMatch.answer.points} điểm)`,
    };
  }

  return {
    status: 'NO_MATCH',
    matchedAnswer: null,
    matchedVariation: '',
    similarity: bestMatch ? Math.round(bestMatch.similarity * 100) / 100 : 0,
    message: `Không có đáp án phù hợp trong bảng kết quả.`,
  };
}

/**
 * So khớp cho các câu hỏi trong vòng Fast Money
 */
export function matchFastMoneyAnswer(
  transcript: string,
  answers: FastMoneyAnswerOption[],
  threshold: number = 0.60
): FastMoneyMatchResult {
  const rawClean = normalizeText(transcript);
  const cleanTranscript = cleanSpokenTranscript(transcript);

  if ((!rawClean && !cleanTranscript) || !answers || answers.length === 0) {
    return {
      status: 'NO_MATCH',
      matchedAnswer: null,
      matchedVariation: '',
      similarity: 0,
      message: 'Không nhận diện được giọng nói.',
    };
  }

  let bestMatch: {
    answer: FastMoneyAnswerOption;
    variation: string;
    similarity: number;
  } | null = null;

  for (const ans of answers) {
    const variations = extractAnswerVariations(ans.text);
    for (const v of variations) {
      const simClean = calculateSimilarity(cleanTranscript, v);
      const simRaw = calculateSimilarity(rawClean, v);
      const sim = Math.max(simClean, simRaw);

      if (sim > (bestMatch?.similarity || 0)) {
        bestMatch = {
          answer: ans,
          variation: v,
          similarity: sim,
        };
      }
    }
  }

  if (bestMatch && bestMatch.similarity >= threshold) {
    return {
      status: 'MATCH',
      matchedAnswer: bestMatch.answer,
      matchedVariation: bestMatch.variation,
      similarity: Math.round(bestMatch.similarity * 100) / 100,
      message: `Khớp đáp án: "${bestMatch.answer.text}" (${bestMatch.answer.points} điểm)`,
    };
  }

  return {
    status: 'NO_MATCH',
    matchedAnswer: null,
    matchedVariation: '',
    similarity: bestMatch ? Math.round(bestMatch.similarity * 100) / 100 : 0,
    message: 'Không có đáp án phù hợp trong danh sách khảo sát.',
  };
}
