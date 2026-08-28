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
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tách các biến thể của một câu trả lời trong game show.
 * Ví dụ:
 * - "Kẹt xe / Tắc đường" -> ["Kẹt xe", "Tắc đường", "Kẹt xe Tắc đường"]
 * - "Trang điểm (Makeup)" -> ["Trang điểm", "Makeup", "Trang điểm Makeup"]
 * - "Chocolate (Sô cô la)" -> ["Chocolate", "Sô cô la", "Chocolate Sô cô la"]
 * - "Bún bò / Bún riêu" -> ["Bún bò", "Bún riêu", "Bún bò Bún riêu"]
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
    if (cleaned && cleaned.length >= 2) {
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
      // Nội dung bên ngoài ngoặc
      const outsideParen = normalizeText(answerText.replace(match, ''));
      if (outsideParen) {
        variations.add(outsideParen);
      }
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

  // 1. Kiểm tra bao hàm trực tiếp (Substring containment)
  // Ví dụ: người chơi nói "bánh mì thịt" mà đáp án là "bánh mì" hoặc ngược lại
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  // 2. Kiểm tra không dấu
  const nonAccent1 = removeVietnameseDiacritics(norm1);
  const nonAccent2 = removeVietnameseDiacritics(norm2);
  if (nonAccent1 === nonAccent2) {
    return 0.95;
  }
  if (nonAccent1.includes(nonAccent2) || nonAccent2.includes(nonAccent1)) {
    return 0.8;
  }

  // 3. Kiểm tra tập hợp từ (Word overlap / Jaccard similarity)
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const union = new Set([...words1, ...words2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // 4. Levenshtein similarity
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
  threshold: number = 0.65
): MatchResult {
  const cleanTranscript = normalizeText(transcript);

  if (!cleanTranscript || !answers || answers.length === 0) {
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
      const sim = calculateSimilarity(cleanTranscript, v);

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
  threshold: number = 0.65
): FastMoneyMatchResult {
  const cleanTranscript = normalizeText(transcript);

  if (!cleanTranscript || !answers || answers.length === 0) {
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
      const sim = calculateSimilarity(cleanTranscript, v);

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
