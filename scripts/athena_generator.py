#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🤖 Athena Generator: 맞춤형 문제 생성기

커리큘럼 맵(Bone) + 기출문제 분석(Ground Truth)을 기반으로
Gemini Pro/GPT-4o를 활용하여 합성 문제를 생성합니다.

장점:
- 저작권 Free (AI 생성 문제)
- 무한 생성 가능
- 4D 태깅 자동 적용
- 체질별 맞춤 문제 생성
"""

import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# VPS Gemma3 (Fallback)
# 환경 변수 확인 (VITE_ 접두사는 프론트엔드용이므로 Python에서는 제거)
# 포트 8000은 잘못된 값이므로 11434로 강제 설정
_vps_url = os.getenv("VITE_VPS_GEMMA3_URL") or os.getenv("VPS_GEMMA3_URL")
if _vps_url and ":8000" in _vps_url:
    # 잘못된 포트가 설정된 경우 수정
    _vps_url = _vps_url.replace(":8000", ":11434")
GEMMA3_URL = _vps_url if _vps_url and ":11434" in _vps_url else "http://148.230.97.246:11434"
logger.info(f"[Athena Generator] Gemma3 URL: {GEMMA3_URL}")

# 학습 정보 API
LEARNING_API_BASE = "http://148.230.97.246:8003"

def load_curriculum_map() -> Dict[str, Any]:
    """커리큘럼 맵 로드"""
    map_path = Path("learning-content/curriculum/curriculum_map.json")
    
    if not map_path.exists():
        logger.error("커리큘럼 맵이 없습니다. 먼저 build_curriculum_map.py를 실행하세요.")
        return {}
    
    with open(map_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_exam_metadata() -> List[Dict[str, Any]]:
    """기출문제 메타데이터 로드"""
    metadata_path = Path("learning-content/kice-exams/metadata/exam_metadata.json")
    
    if not metadata_path.exists():
        logger.warning("기출문제 메타데이터가 없습니다. download_kice_exams.py를 실행하세요.")
        return []
    
    with open(metadata_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_exam_structure(exam_text: str, subject: str) -> Dict[str, Any]:
    """
    기출문제 구조 분석
    
    Args:
        exam_text: 기출문제 텍스트
        subject: 과목 (math 또는 english)
    
    Returns:
        문제 구조 분석 결과 (난이도, 논리 구조, 유형 등)
    """
    # 간단한 분석 (실제로는 더 정교한 분석 필요)
    analysis = {
        "difficulty": "medium",  # easy, medium, hard
        "logic_level": 0.5,  # L 차원 (0.0 ~ 1.0)
        "knowledge_level": 0.5,  # K 차원
        "problem_type": "standard",  # standard, reasoning, application
        "key_concepts": []
    }
    
    # 수학 문제 분석
    if subject == "math":
        # 고난도 문제 키워드
        if any(keyword in exam_text for keyword in ["증명", "최댓값", "최솟값", "극값", "적분", "미분"]):
            analysis["difficulty"] = "hard"
            analysis["logic_level"] = 0.8
        
        # 개념 추출 (간단한 예시)
        if "이차함수" in exam_text:
            analysis["key_concepts"].append("이차함수")
        if "삼각함수" in exam_text:
            analysis["key_concepts"].append("삼각함수")
    
    # 영어 문제 분석
    elif subject == "english":
        # 고난도 문제 키워드
        if any(keyword in exam_text for keyword in ["infer", "imply", "suggest", "추론"]):
            analysis["difficulty"] = "hard"
            analysis["logic_level"] = 0.7
        
        # 문법 개념 추출
        if "가정법" in exam_text or "subjunctive" in exam_text.lower():
            analysis["key_concepts"].append("가정법")
    
    return analysis

def generate_problem_with_gemini(
    curriculum_unit: Dict[str, Any],
    exam_analysis: Optional[Dict[str, Any]],
    constitution: Optional[str] = None,
    difficulty: str = "medium"
) -> Dict[str, Any]:
    """
    Gemini Pro를 사용하여 맞춤형 문제 생성
    
    Args:
        curriculum_unit: 커리큘럼 단원 정보
        exam_analysis: 기출문제 분석 결과 (선택적)
        constitution: 체질 (태양인, 태음인, 소양인, 소음인)
        difficulty: 난이도 (easy, medium, hard)
    
    Returns:
        생성된 문제 정보
    """
    # Gemini API는 현재 400 오류 발생 중이므로 Gemma3 우선 사용
    # if not GEMINI_API_KEY:
    #     logger.warning("Gemini API 키가 없습니다. Gemma3로 대체합니다.")
    #     return generate_problem_with_gemma3(curriculum_unit, exam_analysis, constitution, difficulty)
    
    # 임시로 Gemma3만 사용 (Gemini API 문제 해결 후 재활성화)
    logger.info("Gemini API 우회, Gemma3 사용")
    return generate_problem_with_gemma3(curriculum_unit, exam_analysis, constitution, difficulty)
    
    # 프롬프트 구성
    unit_name = curriculum_unit.get("unit", "")
    topics = curriculum_unit.get("topics", [])
    
    prompt = f"""다음 단원에 대한 {difficulty} 난이도의 학습 문제를 생성해주세요.

단원: {unit_name}
주제: {', '.join(topics)}

요구사항:
1. EBS 고난도 스타일의 문제
2. 논리적 사고력을 요구하는 문제
3. 단계별 풀이 과정이 명확한 문제
4. 학생이 개념을 깊이 이해할 수 있는 문제

문제 형식:
- 문제 설명
- 핵심 개념
- 힌트 (선택적)
- 정답 및 풀이 과정

{"체질: " + constitution + " (체질별 학습 스타일에 맞춘 문제)" if constitution else ""}
{"기출문제 분석 결과를 참고하여 유사한 논리 구조로 문제를 생성해주세요." if exam_analysis else ""}
"""
    
    try:
        # Gemini API 올바른 형식
        response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers={
                "Content-Type": "application/json",
            },
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1024,
                }
            },
            timeout=60  # 타임아웃 60초로 증가
        )
        
        if response.status_code == 200:
            data = response.json()
            generated_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # 4D 벡터 태깅
            vector_4d = {
                "S": 0.25,  # 기본값
                "L": exam_analysis.get("logic_level", 0.5) if exam_analysis else 0.5,
                "K": exam_analysis.get("knowledge_level", 0.5) if exam_analysis else 0.5,
                "M": 0.25  # 기본값
            }
            
            return {
                "problem": generated_text,
                "unit": unit_name,
                "topics": topics,
                "difficulty": difficulty,
                "constitution": constitution,
                "vector_4d": vector_4d,
                "createdAt": datetime.now().isoformat(),
                "source": "athena_generator_gemini"
            }
        else:
            logger.error(f"Gemini API 오류: {response.status_code}")
            return generate_problem_with_gemma3(curriculum_unit, exam_analysis, constitution, difficulty)
            
    except Exception as e:
        logger.error(f"Gemini API 호출 실패: {e}")
        return generate_problem_with_gemma3(curriculum_unit, exam_analysis, constitution, difficulty)

def generate_problem_with_gemma3(
    curriculum_unit: Dict[str, Any],
    exam_analysis: Optional[Dict[str, Any]],
    constitution: Optional[str] = None,
    difficulty: str = "medium"
) -> Dict[str, Any]:
    """Gemma3를 사용하여 맞춤형 문제 생성 (Fallback)"""
    unit_name = curriculum_unit.get("unit", "")
    topics = curriculum_unit.get("topics", [])
    
    # 프롬프트 단순화 (타임아웃 방지)
    prompt = f"""중2 수학 '{unit_name}' 단원의 {difficulty} 난이도 문제를 만들어주세요.

주제: {', '.join(topics[:3])}  # 최대 3개 주제만

형식:
1. 문제
2. 정답
3. 풀이

간단하고 명확하게 작성해주세요."""
    
    try:
        # Gemma3 URL 확인
        logger.info(f"[Gemma3] 연결 시도: {GEMMA3_URL}/api/generate")
        
        response = requests.post(
            f"{GEMMA3_URL}/api/generate",
            headers={
                "Content-Type": "application/json",
            },
            json={
                "model": "gemma3:4b",  # VPS에 설치된 모델 사용
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 500
                }
            },
            timeout=60  # 타임아웃 60초로 증가
        )
        
        if response.status_code == 200:
            data = response.json()
            generated_text = data.get("response", "")
            
            # 4D 벡터 태깅
            vector_4d = {
                "S": 0.25,
                "L": exam_analysis.get("logic_level", 0.5) if exam_analysis else 0.5,
                "K": exam_analysis.get("knowledge_level", 0.5) if exam_analysis else 0.5,
                "M": 0.25
            }
            
            return {
                "problem": generated_text,
                "unit": unit_name,
                "topics": topics,
                "difficulty": difficulty,
                "constitution": constitution,
                "vector_4d": vector_4d,
                "createdAt": datetime.now().isoformat(),
                "source": "athena_generator_gemma3"
            }
        else:
            logger.error(f"Gemma3 API 오류: {response.status_code}")
            return {}
            
    except Exception as e:
        logger.error(f"Gemma3 API 호출 실패: {e}")
        return {}

def save_problem_to_api(problem_data: Dict[str, Any]) -> bool:
    """생성된 문제를 VPS API에 저장"""
    try:
        # 백엔드 API 형식에 맞춘 요청 데이터 (content_data를 직접 전달)
        content_data = {
            "subject": problem_data.get("subject", "math"),
            "topic": problem_data.get("unit", ""),
            "content": problem_data.get("problem", ""),
            "difficulty": problem_data.get("difficulty", "medium"),
            "ebsCurriculum": "Athena Generator",
            "keyTopics": problem_data.get("topics", []),
            "vector_4d": problem_data.get("vector_4d", {}),
            "constitution": problem_data.get("constitution"),
            "createdAt": problem_data.get("createdAt"),
            "updatedAt": problem_data.get("createdAt")
        }
        
        response = requests.post(
            f"{LEARNING_API_BASE}/api/v1/learning/store",
            json=content_data,  # 백엔드 API는 content_data를 직접 받음
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"✅ 문제 저장 완료: {problem_data.get('unit', 'Unknown')}")
            return True
        else:
            try:
                error_text = response.text
            except:
                error_text = str(response.status_code)
            logger.warning(f"⚠️ 문제 저장 실패 ({response.status_code}): {error_text}")
            return False
            
    except requests.exceptions.ConnectionError:
        logger.warning(f"⚠️ VPS API 서버 연결 실패 (서버가 실행 중이지 않을 수 있습니다): {LEARNING_API_BASE}")
        return False
    except Exception as e:
        logger.error(f"❌ 문제 저장 오류: {e}")
        return False

def generate_problems_for_curriculum(
    subject: str,
    grade: str,
    constitution: Optional[str] = None,
    num_problems_per_unit: int = 3
) -> List[Dict[str, Any]]:
    """
    커리큘럼 전체에 대해 문제 생성
    
    Args:
        subject: 과목 (math 또는 english)
        grade: 학년 (중1, 중2, 중3, 고1, 고2)
        constitution: 체질 (선택적)
        num_problems_per_unit: 단원당 생성할 문제 수
    
    Returns:
        생성된 문제 리스트
    """
    logger.info(f"문제 생성 시작: {grade} {subject}")
    
    # 커리큘럼 맵 로드
    curriculum_map = load_curriculum_map()
    
    if not curriculum_map or "subjects" not in curriculum_map:
        logger.error("커리큘럼 맵을 로드할 수 없습니다.")
        return []
    
    grade_data = curriculum_map.get("subjects", {}).get(subject, {}).get(grade, {})
    units = grade_data.get("units", [])
    
    if not units:
        logger.warning(f"{grade} {subject} 커리큘럼이 없습니다.")
        return []
    
    # 기출문제 분석 (선택적)
    exam_metadata = load_exam_metadata()
    exam_analysis = None
    if exam_metadata:
        # 해당 과목의 최근 기출문제 분석 (간단한 예시)
        recent_exams = [e for e in exam_metadata if e.get("subject") == subject][:5]
        if recent_exams:
            # 실제로는 기출문제 텍스트를 분석해야 함
            exam_analysis = {"logic_level": 0.7, "knowledge_level": 0.6}
    
    generated_problems = []
    
    for unit in units:
        logger.info(f"  - 단원: {unit.get('unit', 'Unknown')}")
        
        for i in range(num_problems_per_unit):
            # 난이도 다양화
            difficulty = ["easy", "medium", "hard"][i % 3]
            
            problem = generate_problem_with_gemini(
                unit,
                exam_analysis,
                constitution,
                difficulty
            )
            
            if problem:
                problem["subject"] = subject
                problem["grade"] = grade
                generated_problems.append(problem)
                
                # API에 저장
                save_problem_to_api(problem)
    
    logger.info(f"✅ {len(generated_problems)}개 문제 생성 완료")
    return generated_problems

def main():
    """메인 함수"""
    import sys
    
    logger.info("=" * 60)
    logger.info("Athena Generator: 맞춤형 문제 생성기")
    logger.info("=" * 60)
    
    # 커리큘럼 맵 확인
    curriculum_map = load_curriculum_map()
    if not curriculum_map:
        logger.error("커리큘럼 맵이 없습니다. 먼저 build_curriculum_map.py를 실행하세요.")
        return
    
    # 문제 생성 (예시: 중2 수학)
    logger.info("\n📚 맞춤형 문제 생성 시작...")
    
    # 명령줄 인자 또는 기본값
    if len(sys.argv) >= 2:
        subject = sys.argv[1]
    else:
        subject = "math"
    
    if len(sys.argv) >= 3:
        grade = sys.argv[2]
    else:
        grade = "중2"
    
    if len(sys.argv) >= 4:
        constitution = sys.argv[3] if sys.argv[3] != "None" else None
    else:
        constitution = None
    
    if len(sys.argv) >= 5:
        num_problems = int(sys.argv[4])
    else:
        num_problems = 3
    
    logger.info(f"설정: 과목={subject}, 학년={grade}, 체질={constitution}, 문제수={num_problems}")
    
    problems = generate_problems_for_curriculum(
        subject=subject,
        grade=grade,
        constitution=constitution,
        num_problems_per_unit=num_problems
    )
    
    # 결과 저장
    output_dir = Path("learning-content/generated-problems")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{grade}_{subject}_problems_{datetime.now().strftime('%Y%m%d')}.json"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(problems, f, ensure_ascii=False, indent=2)
    
    logger.info(f"\n✅ 생성된 문제 저장 완료: {output_path}")
    logger.info(f"총 {len(problems)}개 문제 생성")

if __name__ == "__main__":
    main()

