#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Hub 데이터 수집 스크립트

AI Hub(aihub.or.kr)에서 교육 관련 데이터셋을 다운로드하고
학습 정보 시스템에 저장합니다.

주의: AI Hub는 회원가입 및 데이터 다운로드 승인 필요
"""

import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import logging
import zipfile
import shutil

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 설정
API_BASE = "http://148.230.97.246:8003"

# AI Hub 추천 데이터셋
AIHUB_DATASETS = {
    "초중고_학생_질문답변": {
        "name": "초중고 학생 질문-답변 데이터",
        "description": "학생들이 자주 묻는 질문과 교사의 답변 쌍",
        "url": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=71371",
        "file_pattern": "*qa*.json"
    },
    "교과서_기반_QA": {
        "name": "한국어 교과서 기반 질의응답 데이터",
        "description": "교과서 내용 기반 질문-답변 데이터",
        "url": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=12345",
        "file_pattern": "*textbook*.json"
    },
    "수학_문항_풀이": {
        "name": "수학 문항 풀이 데이터",
        "description": "수학 문제와 풀이 과정 데이터",
        "url": "https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=realm&dataSetSn=67890",
        "file_pattern": "*math*.json"
    }
}

def load_aihub_json_file(file_path: Path) -> List[Dict[str, Any]]:
    """AI Hub JSON 파일 로드"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 리스트인 경우 그대로 반환, 딕셔너리인 경우 리스트로 변환
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # 일반적으로 'data', 'items', 'results' 등의 키를 가짐
            for key in ['data', 'items', 'results', 'questions', 'qa_pairs']:
                if key in data:
                    return data[key] if isinstance(data[key], list) else [data[key]]
            return [data]
        else:
            return []
            
    except json.JSONDecodeError as e:
        logger.error(f"JSON 파싱 오류 ({file_path}): {e}")
        return []
    except Exception as e:
        logger.error(f"파일 로드 오류 ({file_path}): {e}")
        return []

def process_qa_data(qa_item: Dict[str, Any]) -> Dict[str, Any]:
    """질의응답 데이터를 학습 콘텐츠 형식으로 변환"""
    # 다양한 필드명 대응
    question = qa_item.get('question') or qa_item.get('질문') or qa_item.get('Q') or qa_item.get('q', '')
    answer = qa_item.get('answer') or qa_item.get('답변') or qa_item.get('A') or qa_item.get('a', '')
    subject = qa_item.get('subject') or qa_item.get('과목') or qa_item.get('subject_name', 'general')
    grade = qa_item.get('grade') or qa_item.get('학년') or qa_item.get('grade_level', '')
    topic = qa_item.get('topic') or qa_item.get('주제') or qa_item.get('chapter', '')
    
    return {
        "subject": subject.lower() if isinstance(subject, str) else 'general',
        "topic": topic or question[:50],  # 주제가 없으면 질문 일부 사용
        "content": f"질문: {question}\n\n답변: {answer}",
        "difficulty": qa_item.get('difficulty', 'medium'),
        "ebsCurriculum": f"AI Hub {grade} {subject}" if grade else "AI Hub",
        "keyTopics": qa_item.get('keywords', []) or qa_item.get('키워드', []),
        "grade": str(grade) if grade else "",
        "question": question,
        "answer": answer,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }

def process_math_data(math_item: Dict[str, Any]) -> Dict[str, Any]:
    """수학 문항 데이터를 학습 콘텐츠 형식으로 변환"""
    problem = math_item.get('problem') or math_item.get('문제') or math_item.get('question', '')
    solution = math_item.get('solution') or math_item.get('풀이') or math_item.get('answer', '')
    topic = math_item.get('topic') or math_item.get('주제') or math_item.get('chapter', '')
    grade = math_item.get('grade') or math_item.get('학년', '')
    
    return {
        "subject": "math",
        "topic": topic or problem[:50],
        "content": f"문제: {problem}\n\n풀이: {solution}",
        "difficulty": math_item.get('difficulty', 'medium'),
        "ebsCurriculum": f"AI Hub {grade} 수학" if grade else "AI Hub 수학",
        "keyTopics": math_item.get('keywords', []) or math_item.get('키워드', []),
        "grade": str(grade) if grade else "",
        "problem": problem,
        "solution": solution,
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat()
    }

def save_to_api(content_data: Dict[str, Any]) -> bool:
    """수집한 데이터를 VPS API에 저장"""
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/learning/store",
            json=content_data,
            timeout=10
        )
        
        if response.status_code == 200:
            return True
        else:
            logger.warning(f"⚠️ API 저장 실패: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ API 저장 오류: {e}")
        return False

def process_aihub_directory(data_dir: Path) -> int:
    """AI Hub 데이터 디렉토리 처리"""
    logger.info(f"AI Hub 데이터 디렉토리 처리: {data_dir}")
    
    if not data_dir.exists():
        logger.warning(f"디렉토리가 없습니다: {data_dir}")
        return 0
    
    saved_count = 0
    
    # JSON 파일 찾기
    json_files = list(data_dir.glob("**/*.json"))
    
    if not json_files:
        logger.warning("JSON 파일을 찾을 수 없습니다.")
        return 0
    
    logger.info(f"{len(json_files)}개 JSON 파일 발견")
    
    for json_file in json_files:
        logger.info(f"처리 중: {json_file.name}")
        
        data = load_aihub_json_file(json_file)
        
        if not data:
            continue
        
        for item in data:
            # 데이터 타입에 따라 처리
            if 'question' in item or '질문' in item or 'Q' in item:
                # 질의응답 데이터
                content_data = process_qa_data(item)
            elif 'problem' in item or '문제' in item:
                # 수학 문항 데이터
                content_data = process_math_data(item)
            else:
                # 일반 데이터
                content_data = {
                    "subject": item.get('subject', 'general'),
                    "topic": item.get('title', item.get('topic', 'Unknown')),
                    "content": str(item.get('content', item.get('text', ''))),
                    "difficulty": item.get('difficulty', 'medium'),
                    "ebsCurriculum": "AI Hub",
                    "keyTopics": item.get('keywords', []),
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat()
                }
            
            if save_to_api(content_data):
                saved_count += 1
    
    return saved_count

def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("AI Hub 데이터 수집 시작")
    logger.info("=" * 60)
    
    # AI Hub 데이터 디렉토리
    aihub_data_dir = Path("learning-content/aihub")
    aihub_data_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("\n📋 AI Hub 데이터 수집 가이드:")
    logger.info("1. https://aihub.or.kr 접속")
    logger.info("2. 회원가입 및 로그인")
    logger.info("3. 다음 데이터셋 다운로드:")
    for key, dataset in AIHUB_DATASETS.items():
        logger.info(f"   - {dataset['name']}: {dataset['url']}")
    logger.info(f"4. 다운로드한 파일을 {aihub_data_dir} 디렉토리에 압축 해제")
    logger.info("5. 이 스크립트를 다시 실행하여 데이터 처리\n")
    
    # 데이터 디렉토리 확인
    if not any(aihub_data_dir.iterdir()):
        logger.warning(f"⚠️ {aihub_data_dir} 디렉토리가 비어있습니다.")
        logger.info("위 가이드에 따라 데이터를 다운로드하세요.")
        return
    
    # 데이터 처리
    saved_count = process_aihub_directory(aihub_data_dir)
    
    logger.info("\n" + "=" * 60)
    logger.info(f"✅ AI Hub 데이터 처리 완료: {saved_count}개 항목 저장")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()

