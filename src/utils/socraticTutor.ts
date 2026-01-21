/**
 * 🏛️ 소크라테스 튜터 - Gemma3 + 4D 증류 기술 통합
 * 
 * 질문을 통해 학생이 스스로 답을 찾도록 유도하는 소크라테스식 교수법을 구현합니다.
 * 
 * 작성일: 2026-01-22
 * 상태: ✅ Phase 4 구현 중
 */

import type { Vector4D } from './types';
import { askGemma3Streaming } from './api';
import { vectorizeText } from './api';

export interface SocraticQuestion {
  id: string;
  question: string; // 질문 텍스트
  hint?: string; // 힌트 (선택적)
  level: 'easy' | 'medium' | 'hard'; // 질문 난이도
  vector_4d?: Vector4D; // 4D 벡터 (증류된 핵심)
  expectedDirection?: string; // 예상 답변 방향
}

export interface SocraticSession {
  id: string;
  topic: string;
  subject: 'math' | 'english';
  questions: SocraticQuestion[];
  currentQuestionIndex: number;
  studentAnswers: string[];
  hintsUsed: number[];
  startTime: number;
  endTime?: number;
}

/**
 * 소크라테스 튜터 클래스
 */
export class SocraticTutor {
  /**
   * 소크라테스식 질문 생성 (Gemma3 + 4D 증류)
   */
  async generateSocraticQuestion(
    topic: string,
    subject: 'math' | 'english',
    difficulty: 'easy' | 'medium' | 'hard',
    context?: string
  ): Promise<SocraticQuestion> {
    // 4D 벡터로 주제 증류
    const topicVector = await vectorizeText(topic);
    
    // Gemma3로 소크라테스식 질문 생성
    const prompt = this.buildSocraticPrompt(topic, subject, difficulty, context, topicVector);
    
    // 스트리밍 응답 수집
    let fullResponse = '';
    for await (const chunk of askGemma3Streaming(prompt, context)) {
      fullResponse += chunk;
    }
    
    // 질문 파싱 (간단한 파싱 로직)
    const question = this.parseQuestionFromResponse(fullResponse);
    const hint = this.extractHintFromResponse(fullResponse);
    const expectedDirection = this.extractExpectedDirection(fullResponse);
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question,
      hint,
      level: difficulty,
      vector_4d: topicVector,
      expectedDirection
    };
  }

  /**
   * 소크라테스식 프롬프트 생성
   */
  private buildSocraticPrompt(
    topic: string,
    subject: 'math' | 'english',
    difficulty: 'easy' | 'medium' | 'hard',
    context: string | undefined,
    vector_4d: Vector4D
  ): string {
    const difficultyGuide = {
      easy: '기본 개념을 이해하도록 유도하는 간단한 질문',
      medium: '논리적 사고를 자극하는 중간 난이도 질문',
      hard: '심층적 사고를 요구하는 고난도 질문'
    };

    return `당신은 소크라테스식 교수법을 사용하는 튜터입니다.

주제: ${topic}
과목: ${subject === 'math' ? '수학' : '영어'}
난이도: ${difficultyGuide[difficulty]}

4D 벡터 분석:
- S(정서): ${(vector_4d.S * 100).toFixed(0)}%
- L(논리): ${(vector_4d.L * 100).toFixed(0)}%
- K(지식): ${(vector_4d.K * 100).toFixed(0)}%
- M(신체): ${(vector_4d.M * 100).toFixed(0)}%

${context ? `컨텍스트: ${context}\n` : ''}

소크라테스식 질문 생성 규칙:
1. 정답을 직접 말하지 말고, 학생이 스스로 생각하도록 유도
2. 단계별로 작은 질문들을 통해 논리적 사고 경로를 만들어가기
3. 학생의 현재 이해 수준을 고려하여 적절한 난이도로 질문
4. 힌트는 간접적이고, 학생이 스스로 발견할 수 있도록

다음 형식으로 질문을 생성해주세요:

질문: [학생이 스스로 생각하도록 유도하는 질문]
힌트: [필요시 제공할 힌트 (선택적)]
예상 방향: [학생이 답해야 할 논리적 방향]

질문을 생성해주세요:`;
  }

  /**
   * 응답에서 질문 파싱
   */
  private parseQuestionFromResponse(response: string): string {
    // "질문:" 또는 "Question:" 뒤의 텍스트 추출
    const questionMatch = response.match(/(?:질문|Question)[:：]\s*(.+?)(?:\n|힌트|Hint|예상|Expected)/s);
    if (questionMatch) {
      return questionMatch[1].trim();
    }
    
    // 첫 번째 문장을 질문으로 사용
    const firstSentence = response.split(/[.!?。！？]/)[0].trim();
    return firstSentence || response.substring(0, 100);
  }

  /**
   * 응답에서 힌트 추출
   */
  private extractHintFromResponse(response: string): string | undefined {
    const hintMatch = response.match(/(?:힌트|Hint)[:：]\s*(.+?)(?:\n|예상|Expected|$)/s);
    return hintMatch ? hintMatch[1].trim() : undefined;
  }

  /**
   * 응답에서 예상 방향 추출
   */
  private extractExpectedDirection(response: string): string | undefined {
    const directionMatch = response.match(/(?:예상 방향|Expected Direction|예상)[:：]\s*(.+?)(?:\n|$)/s);
    return directionMatch ? directionMatch[1].trim() : undefined;
  }

  /**
   * 학생 답변 평가 (소크라테스식)
   */
  async evaluateStudentAnswer(
    question: SocraticQuestion,
    studentAnswer: string,
    context?: string
  ): Promise<{
    isCorrect: boolean;
    feedback: string;
    nextQuestion?: string;
    needsMoreGuidance: boolean;
  }> {
    const prompt = `당신은 소크라테스식 교수법을 사용하는 튜터입니다.

원래 질문: ${question.question}
${question.expectedDirection ? `예상 방향: ${question.expectedDirection}\n` : ''}
학생 답변: ${studentAnswer}

${context ? `컨텍스트: ${context}\n` : ''}

소크라테스식 피드백 규칙:
1. 정답/오답을 직접 말하지 말고, 학생의 사고 과정을 평가
2. 논리적 오류가 있으면 간접적으로 지적하고, 올바른 방향으로 유도
3. 답변이 맞으면 다음 단계로 나아갈 수 있는 질문 제시
4. 답변이 틀렸으면 왜 틀렸는지 생각하도록 유도하는 질문 제시

다음 형식으로 피드백을 생성해주세요:

피드백: [학생의 사고 과정을 평가하고 유도하는 피드백]
다음 질문: [다음 단계로 나아갈 수 있는 질문 (선택적)]

피드백을 생성해주세요:`;

    let fullResponse = '';
    for await (const chunk of askGemma3Streaming(prompt, context)) {
      fullResponse += chunk;
    }

    // 피드백 파싱
    const feedback = this.parseFeedbackFromResponse(fullResponse);
    const nextQuestion = this.extractNextQuestion(fullResponse);
    
    // 간단한 정답 판단 (키워드 기반, 향후 개선 필요)
    const isCorrect = this.simpleAnswerCheck(studentAnswer, question.expectedDirection);
    const needsMoreGuidance = !isCorrect && feedback.length < 50; // 짧은 피드백은 더 많은 지도 필요

    return {
      isCorrect,
      feedback,
      nextQuestion,
      needsMoreGuidance
    };
  }

  /**
   * 응답에서 피드백 파싱
   */
  private parseFeedbackFromResponse(response: string): string {
    const feedbackMatch = response.match(/(?:피드백|Feedback)[:：]\s*(.+?)(?:\n|다음 질문|Next Question|$)/s);
    if (feedbackMatch) {
      return feedbackMatch[1].trim();
    }
    return response.substring(0, 200);
  }

  /**
   * 응답에서 다음 질문 추출
   */
  private extractNextQuestion(response: string): string | undefined {
    const nextMatch = response.match(/(?:다음 질문|Next Question)[:：]\s*(.+?)(?:\n|$)/s);
    return nextMatch ? nextMatch[1].trim() : undefined;
  }

  /**
   * 간단한 정답 체크 (키워드 기반, 향후 개선 필요)
   */
  private simpleAnswerCheck(
    studentAnswer: string,
    expectedDirection?: string
  ): boolean {
    if (!expectedDirection) {
      // 예상 방향이 없으면 항상 true (더 많은 지도 필요)
      return false;
    }

    // 간단한 키워드 매칭 (향후 개선 필요)
    const expectedKeywords = expectedDirection.toLowerCase().split(/\s+/);
    const answerKeywords = studentAnswer.toLowerCase().split(/\s+/);
    
    // 키워드 일치율 계산
    const matchCount = expectedKeywords.filter(keyword =>
      answerKeywords.some(answerKeyword => answerKeyword.includes(keyword))
    ).length;
    
    return matchCount / expectedKeywords.length > 0.3; // 30% 이상 일치하면 정답
  }

  /**
   * 소크라테스 세션 생성
   */
  async createSocraticSession(
    topic: string,
    subject: 'math' | 'english',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    context?: string
  ): Promise<SocraticSession> {
    // 첫 번째 질문 생성
    const firstQuestion = await this.generateSocraticQuestion(
      topic,
      subject,
      difficulty,
      context
    );

    return {
      id: `socratic-${Date.now()}`,
      topic,
      subject,
      questions: [firstQuestion],
      currentQuestionIndex: 0,
      studentAnswers: [],
      hintsUsed: [],
      startTime: Date.now()
    };
  }

  /**
   * 다음 질문 생성 (학생 답변 기반)
   */
  async generateNextQuestion(
    session: SocraticSession,
    studentAnswer: string,
    context?: string
  ): Promise<SocraticQuestion | null> {
    const currentQuestion = session.questions[session.currentQuestionIndex];
    
    // 학생 답변 평가
    const evaluation = await this.evaluateStudentAnswer(
      currentQuestion,
      studentAnswer,
      context
    );

    // 다음 질문이 있으면 생성
    if (evaluation.nextQuestion) {
      const nextQuestion: SocraticQuestion = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: evaluation.nextQuestion,
        level: currentQuestion.level,
        vector_4d: currentQuestion.vector_4d
      };
      
      return nextQuestion;
    }

    // 다음 질문이 없으면 새로운 주제 질문 생성
    if (evaluation.isCorrect) {
      // 정답이면 다음 단계 질문 생성
      const nextQuestion = await this.generateSocraticQuestion(
        session.topic,
        session.subject,
        session.questions[0].level,
        context
      );
      return nextQuestion;
    }

    return null;
  }
}

// 싱글톤 인스턴스
let socraticTutorInstance: SocraticTutor | null = null;

/**
 * SocraticTutor 인스턴스 가져오기 (싱글톤)
 */
export function getSocraticTutor(): SocraticTutor {
  if (!socraticTutorInstance) {
    socraticTutorInstance = new SocraticTutor();
  }
  return socraticTutorInstance;
}

