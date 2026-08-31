import type { Question, FastMoneyQuestion } from '../types/game';
import questionsData from './questions.json';

export interface QuestionsDataFile {
  title?: string;
  questions: Question[];
  fastMoneyQuestions: FastMoneyQuestion[];
}

export const DEFAULT_QUESTIONS: Question[] = (questionsData as QuestionsDataFile).questions;

export const DEFAULT_FAST_MONEY_QUESTIONS: FastMoneyQuestion[] = (questionsData as QuestionsDataFile).fastMoneyQuestions;

export const DEFAULT_QUESTION_PACK: QuestionsDataFile = {
  title: questionsData.title,
  questions: DEFAULT_QUESTIONS,
  fastMoneyQuestions: DEFAULT_FAST_MONEY_QUESTIONS,
};

export default questionsData;
