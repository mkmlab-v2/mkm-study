#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EBS 교과과정 데이터 임포트 스크립트

EBS 중/고등학교 수학/영어 교과과정 데이터를 수집하여
VPS 학습 정보 시스템에 저장합니다.
"""

import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 설정
API_BASE = "http://148.230.97.246:8003"

# EBS 교과과정 데이터 (예시 - 실제로는 EBS API 또는 파일에서 로드)
EBS_MATH_CURRICULUM = {
    "중1": [
        {
            "chapter": 1,
            "title": "소인수분해",
            "sections": [
                {"section": 1, "title": "소인수분해", "content": "소인수분해는 자연수를 소수의 곱으로 나타내는 것입니다..."},
                {"section": 2, "title": "최대공약수와 최소공배수", "content": "최대공약수는 두 수의 공약수 중 가장 큰 수입니다..."},
                {"section": 3, "title": "소인수분해의 활용", "content": "소인수분해를 이용하여 최대공약수와 최소공배수를 구할 수 있습니다..."}
            ],
            "keyTopics": ["소인수분해", "최대공약수", "최소공배수"],
            "difficulty": "easy"
        },
        {
            "chapter": 2,
            "title": "정수와 유리수",
            "sections": [
                {"section": 1, "title": "정수와 유리수", "content": "정수는 양의 정수, 0, 음의 정수로 이루어져 있습니다..."},
                {"section": 2, "title": "유리수의 덧셈과 뺄셈", "content": "유리수의 덧셈과 뺄셈은 분모를 통분하여 계산합니다..."},
                {"section": 3, "title": "유리수의 곱셈과 나눗셈", "content": "유리수의 곱셈과 나눗셈은 분수의 곱셈과 나눗셈과 같습니다..."}
            ],
            "keyTopics": ["정수", "유리수", "사칙연산"],
            "difficulty": "easy"
        }
    ],
    "중2": [
        {
            "chapter": 1,
            "title": "유리수와 순환소수",
            "sections": [
                {"section": 1, "title": "유리수와 순환소수", "content": "순환소수는 소수점 아래의 숫자가 반복되는 소수입니다..."},
                {"section": 2, "title": "순환소수를 분수로 나타내기", "content": "순환소수를 분수로 나타낼 수 있습니다..."}
            ],
            "keyTopics": ["순환소수", "분수"],
            "difficulty": "medium"
        }
    ],
    "중3": [
        {
            "chapter": 1,
            "title": "제곱근과 실수",
            "sections": [
                {"section": 1, "title": "제곱근", "content": "제곱근은 제곱하여 그 수가 되는 수입니다..."},
                {"section": 2, "title": "실수", "content": "실수는 유리수와 무리수를 포함합니다..."}
            ],
            "keyTopics": ["제곱근", "실수"],
            "difficulty": "medium"
        }
    ],
    "고1": [
        {
            "chapter": 1,
            "title": "다항식의 연산",
            "sections": [
                {"section": 1, "title": "다항식의 덧셈과 뺄셈", "content": "다항식의 덧셈과 뺄셈은 동류항끼리 계산합니다..."},
                {"section": 2, "title": "다항식의 곱셈", "content": "다항식의 곱셈은 분배법칙을 이용합니다..."}
            ],
            "keyTopics": ["다항식", "연산"],
            "difficulty": "medium"
        },
        {
            "chapter": 2,
            "title": "인수분해",
            "sections": [
                {"section": 1, "title": "인수분해", "content": "인수분해는 다항식을 여러 다항식의 곱으로 나타내는 것입니다..."},
                {"section": 2, "title": "인수분해 공식", "content": "인수분해 공식을 이용하여 인수분해할 수 있습니다..."}
            ],
            "keyTopics": ["인수분해", "공식"],
            "difficulty": "medium"
        }
    ],
    "고2": [
        {
            "chapter": 1,
            "title": "이차함수",
            "sections": [
                {"section": 1, "title": "이차함수", "content": "이차함수는 y = ax² + bx + c (a ≠ 0) 형태의 함수입니다..."},
                {"section": 2, "title": "이차함수의 그래프", "content": "이차함수의 그래프는 포물선입니다..."},
                {"section": 3, "title": "이차함수의 최댓값과 최솟값", "content": "이차함수의 최댓값과 최솟값을 구할 수 있습니다..."}
            ],
            "keyTopics": ["이차함수", "포물선", "최댓값", "최솟값"],
            "difficulty": "hard"
        }
    ]
}

EBS_ENGLISH_CURRICULUM = {
    "중1": [
        {
            "chapter": 1,
            "title": "인사와 자기소개",
            "sections": [
                {"section": 1, "title": "인사 표현", "content": "Hello, Hi, Good morning 등의 인사 표현을 학습합니다..."},
                {"section": 2, "title": "자기소개", "content": "My name is... I'm from... 등의 자기소개 표현을 학습합니다..."}
            ],
            "keyTopics": ["인사", "자기소개"],
            "difficulty": "easy"
        }
    ],
    "중2": [
        {
            "chapter": 1,
            "title": "과거형",
            "sections": [
                {"section": 1, "title": "과거형 동사", "content": "과거형 동사의 규칙 변화와 불규칙 변화를 학습합니다..."},
                {"section": 2, "title": "과거형 문장", "content": "과거형을 사용한 문장을 학습합니다..."}
            ],
            "keyTopics": ["과거형", "동사"],
            "difficulty": "medium"
        }
    ],
    "고1": [
        {
            "chapter": 1,
            "title": "수능 영어 기초",
            "sections": [
                {"section": 1, "title": "문법 기초", "content": "수능 영어에 필요한 문법 기초를 학습합니다..."},
                {"section": 2, "title": "어휘", "content": "수능 필수 어휘를 학습합니다..."}
            ],
            "keyTopics": ["문법", "어휘"],
            "difficulty": "medium"
        }
    ]
}

def import_ebs_content(grade: str, subject: str, curriculum: Dict[str, List[Dict[str, Any]]]):
    """EBS 교과과정 데이터를 API에 저장"""
    logger.info(f"EBS 데이터 임포트 시작: {grade} {subject}")
    
    success_count = 0
    error_count = 0
    
    for chapter_data in curriculum.get(grade, []):
        for section in chapter_data.get("sections", []):
            try:
                # 학습 콘텐츠 생성
                content = {
                    "subject": subject,
                    "topic": f"{grade} {chapter_data['title']} - {section['title']}",
                    "content": section["content"],
                    "difficulty": chapter_data.get("difficulty", "medium"),
                    "ebsCurriculum": f"EBS {grade} {subject}",
                    "keyTopics": chapter_data.get("keyTopics", [])
                }
                
                # API에 저장
                response = requests.post(
                    f"{API_BASE}/api/v1/learning/store",
                    json=content,
                    timeout=10
                )
                
                if response.status_code == 200:
                    success_count += 1
                    logger.info(f"✅ 저장 완료: {content['topic']}")
                else:
                    error_count += 1
                    logger.error(f"❌ 저장 실패: {content['topic']} - {response.status_code}")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"❌ 오류 발생: {section.get('title', 'Unknown')} - {e}")
    
    logger.info(f"임포트 완료: 성공 {success_count}개, 실패 {error_count}개")
    return success_count, error_count

def main():
    """메인 함수"""
    logger.info("EBS 교과과정 데이터 임포트 시작")
    
    total_success = 0
    total_error = 0
    
    # 수학 데이터 임포트
    for grade in ["중1", "중2", "중3", "고1", "고2"]:
        success, error = import_ebs_content(grade, "math", EBS_MATH_CURRICULUM)
        total_success += success
        total_error += error
    
    # 영어 데이터 임포트
    for grade in ["중1", "중2", "고1"]:
        success, error = import_ebs_content(grade, "english", EBS_ENGLISH_CURRICULUM)
        total_success += success
        total_error += error
    
    logger.info(f"전체 임포트 완료: 성공 {total_success}개, 실패 {total_error}개")
    
    if total_error == 0:
        logger.info("✅ 모든 데이터 임포트 성공!")
    else:
        logger.warning(f"⚠️ 일부 데이터 임포트 실패: {total_error}개")

if __name__ == "__main__":
    main()

