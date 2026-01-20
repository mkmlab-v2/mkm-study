#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📚 커리큘럼 맵퍼 (Curriculum Mapper)

교육부 고시 교육과정 및 EBS 목차를 기반으로
[학년-과목-단원-핵심개념] 트리 구조를 구축합니다.

목적: 시스템의 '네비게이션 지도' 구축
저작권: 교육과정 정보는 공공 데이터 (저작권 없음)
"""

import sys
import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import re
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User-Agent 설정
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

# 요청 딜레이
REQUEST_DELAY = 1.5  # 1.5초 간격

# 교육부 고시 교육과정 URL (예시 - 실제 URL 확인 필요)
EDUCATION_CURRICULUM_URLS = {
    "math_middle": "https://www.moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=...",  # 중학교 수학
    "math_high": "https://www.moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=...",  # 고등학교 수학
    "english_middle": "https://www.moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=...",  # 중학교 영어
    "english_high": "https://www.moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=...",  # 고등학교 영어
}

# EBS 목차 URL (실제 구조 확인 필요)
EBS_CURRICULUM_URLS = {
    "math_middle": "https://mid.ebs.co.kr/ebs/mid/midMain",  # 중학 수학
    "math_high": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtAtclList.ebs?sbjtId=MATH",  # 고교 수학
    "english_middle": "https://mid.ebs.co.kr/ebs/mid/midMain",  # 중학 영어
    "english_high": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtAtclList.ebs?sbjtId=ENG",  # 고교 영어
}

# 표준 교육과정 구조 (2022 개정 교육과정 기반)
STANDARD_CURRICULUM = {
    "math": {
        "초6": [
            {"unit": "분수의 나눗셈", "topics": ["분수 나눗셈", "분수와 자연수의 나눗셈", "분수 나눗셈의 활용"]},
            {"unit": "소수의 나눗셈", "topics": ["소수 나눗셈", "소수와 자연수의 나눗셈", "소수 나눗셈의 활용"]},
            {"unit": "비와 비율", "topics": ["비", "비율", "비율의 활용"]},
            {"unit": "원의 넓이", "topics": ["원의 넓이 구하기", "원의 넓이와 원주율", "원의 넓이 활용"]},
            {"unit": "직육면체의 부피와 겉넓이", "topics": ["직육면체의 부피", "직육면체의 겉넓이", "부피와 겉넓이의 관계"]},
            {"unit": "비례식과 비례배분", "topics": ["비례식", "비례배분", "비례식의 활용"]},
            {"unit": "원기둥, 원뿔, 구", "topics": ["원기둥", "원뿔", "구"]},
            {"unit": "자료의 정리", "topics": ["도수분포표", "히스토그램", "자료 해석"]}
        ],
        "중1": [
            {"unit": "소인수분해", "topics": ["소수와 합성수", "소인수분해", "최대공약수와 최소공배수"]},
            {"unit": "정수와 유리수", "topics": ["정수", "유리수", "유리수의 사칙연산"]},
            {"unit": "일차방정식", "topics": ["일차방정식", "일차방정식의 활용"]},
            {"unit": "좌표평면과 그래프", "topics": ["좌표평면", "정비례와 반비례"]},
            {"unit": "도형의 기초", "topics": ["기본 도형", "작도와 합동"]},
            {"unit": "평면도형", "topics": ["다각형", "원과 부채꼴"]},
            {"unit": "입체도형", "topics": ["입체도형", "입체도형의 겉넓이와 부피"]},
            {"unit": "통계", "topics": ["자료의 정리와 해석"]}
        ],
        "중2": [
            {"unit": "유리수와 순환소수", "topics": ["유리수와 순환소수", "순환소수를 분수로 나타내기"]},
            {"unit": "식의 계산", "topics": ["다항식의 계산", "곱셈 공식", "인수분해"]},
            {"unit": "일차부등식", "topics": ["일차부등식", "연립일차부등식"]},
            {"unit": "연립방정식", "topics": ["연립방정식", "연립방정식의 활용"]},
            {"unit": "일차함수", "topics": ["일차함수", "일차함수의 그래프", "일차함수의 활용"]},
            {"unit": "이등변삼각형과 직각삼각형", "topics": ["이등변삼각형", "직각삼각형"]},
            {"unit": "평행사변형", "topics": ["평행사변형", "여러 가지 사각형"]},
            {"unit": "닮음", "topics": ["닮은 도형", "삼각형의 닮음", "닮음의 활용"]},
            {"unit": "확률", "topics": ["확률", "확률의 계산"]}
        ],
        "중3": [
            {"unit": "제곱근과 실수", "topics": ["제곱근", "무리수와 실수"]},
            {"unit": "인수분해와 이차방정식", "topics": ["인수분해", "이차방정식", "이차방정식의 활용"]},
            {"unit": "이차함수", "topics": ["이차함수", "이차함수의 그래프", "이차함수의 활용"]},
            {"unit": "원의 성질", "topics": ["원과 직선", "원주각"]},
            {"unit": "삼각비", "topics": ["삼각비", "삼각비의 활용"]},
            {"unit": "통계", "topics": ["대푯값과 산포도", "상관관계"]}
        ],
        "고1": [
            {"unit": "다항식", "topics": ["다항식의 연산", "나머지정리와 인수분해"]},
            {"unit": "방정식과 부등식", "topics": ["복소수", "이차방정식", "이차방정식과 이차함수", "여러 가지 방정식", "연립일차방정식"]},
            {"unit": "도형의 방정식", "topics": ["평면좌표", "직선의 방정식", "원의 방정식", "도형의 이동"]},
            {"unit": "집합과 명제", "topics": ["집합", "명제"]},
            {"unit": "함수", "topics": ["함수", "유리함수와 무리함수"]},
            {"unit": "수열", "topics": ["등차수열과 등비수열", "수열의 합", "수학적 귀납법"]}
        ],
        "고2": [
            {"unit": "지수함수와 로그함수", "topics": ["지수", "로그", "지수함수", "로그함수"]},
            {"unit": "삼각함수", "topics": ["삼각함수", "삼각함수의 그래프", "삼각함수의 활용"]},
            {"unit": "수열의 극한", "topics": ["수열의 극한", "급수"]},
            {"unit": "함수의 극한과 연속", "topics": ["함수의 극한", "함수의 연속"]},
            {"unit": "다항함수의 미분법", "topics": ["미분계수와 도함수", "도함수의 활용"]},
            {"unit": "다항함수의 적분법", "topics": ["부정적분", "정적분", "정적분의 활용"]},
            {"unit": "확률과 통계", "topics": ["순열과 조합", "확률", "통계"]}
        ]
    },
    "english": {
        "초6": [
            {"unit": "인사와 자기소개", "topics": ["Hello, Hi", "My name is...", "Nice to meet you"]},
            {"unit": "숫자와 색깔", "topics": ["Numbers 1-100", "Colors", "Counting"]},
            {"unit": "가족과 친구", "topics": ["Family members", "This is my...", "Who is this?"]},
            {"unit": "학교생활", "topics": ["School subjects", "Classroom English", "School activities"]},
            {"unit": "하루 일과", "topics": ["Daily routines", "What time is it?", "I get up at..."]},
            {"unit": "음식과 음료", "topics": ["Food and drinks", "I like...", "What do you want?"]},
            {"unit": "동물과 자연", "topics": ["Animals", "Nature", "I can see..."]},
            {"unit": "과거 이야기", "topics": ["Past tense", "Yesterday", "What did you do?"]}
        ],
        "중1": [
            {"unit": "인사와 자기소개", "topics": ["인사 표현", "자기소개", "기본 대화"]},
            {"unit": "현재시제", "topics": ["be동사", "일반동사", "현재진행형"]},
            {"unit": "과거시제", "topics": ["과거형 동사", "과거진행형"]},
            {"unit": "미래시제", "topics": ["will", "be going to"]},
            {"unit": "명사와 대명사", "topics": ["명사", "대명사", "소유격"]},
            {"unit": "형용사와 부사", "topics": ["형용사", "부사", "비교급과 최상급"]},
            {"unit": "전치사", "topics": ["시간 전치사", "장소 전치사"]},
            {"unit": "의문문", "topics": ["의문사", "의문문 만들기"]}
        ],
        "중2": [
            {"unit": "현재완료", "topics": ["현재완료", "현재완료진행형"]},
            {"unit": "수동태", "topics": ["수동태", "수동태의 활용"]},
            {"unit": "관계대명사", "topics": ["관계대명사 who", "관계대명사 which", "관계대명사 that"]},
            {"unit": "조동사", "topics": ["can/could", "may/might", "must/should"]},
            {"unit": "가정법", "topics": ["가정법 과거", "가정법 과거완료"]},
            {"unit": "부정사와 동명사", "topics": ["부정사", "동명사", "부정사 vs 동명사"]},
            {"unit": "분사", "topics": ["현재분사", "과거분사", "분사구문"]}
        ],
        "중3": [
            {"unit": "복합문", "topics": ["명사절", "부사절", "형용사절"]},
            {"unit": "간접의문문", "topics": ["간접의문문", "간접화법"]},
            {"unit": "도치와 강조", "topics": ["도치", "강조 구문"]},
            {"unit": "독해 전략", "topics": ["주제 찾기", "요지 파악", "추론"]}
        ],
        "고1": [
            {"unit": "수능 영어 기초", "topics": ["문법 기초", "어휘", "독해 기초"]},
            {"unit": "문법 심화", "topics": ["시제", "태", "법", "준동사"]},
            {"unit": "독해 심화", "topics": ["주제/제목", "요지/주장", "어휘 추론", "빈칸 추론"]},
            {"unit": "어휘", "topics": ["수능 필수 어휘", "어휘 학습법"]}
        ],
        "고2": [
            {"unit": "수능 영어 실전", "topics": ["실전 문제 풀이", "시간 관리", "전략"]},
            {"unit": "고난도 문법", "topics": ["복잡한 문법 구조", "예외 규칙"]},
            {"unit": "고난도 독해", "topics": ["장문 독해", "추상적 주제"]},
            {"unit": "작문", "topics": ["영작", "에세이"]}
        ]
    }
}

def scrape_ebs_curriculum_tree(url: str, subject: str, grade: str) -> List[Dict[str, Any]]:
    """
    EBS 목차에서 커리큘럼 트리 구조 추출
    
    Args:
        url: EBS 커리큘럼 페이지 URL
        subject: 과목 (math 또는 english)
        grade: 학년 (중1, 중2, 중3, 고1, 고2)
    
    Returns:
        커리큘럼 트리 구조 (단원-주제 리스트)
    """
    logger.info(f"EBS 커리큘럼 수집: {grade} {subject}")
    
    try:
        time.sleep(REQUEST_DELAY)
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        curriculum_tree = []
        
        # EBS 목차 구조 파싱 (실제 구조에 맞게 수정 필요)
        # 예시: .curriculum-tree, .chapter-list 등
        chapters = soup.select('.chapter, .unit, .curriculum-item')
        
        for chapter in chapters:
            try:
                # 단원명 추출
                unit_name = chapter.select_one('.title, h3, h4, .name')
                if not unit_name:
                    continue
                
                unit_title = unit_name.get_text().strip()
                
                # 주제(토픽) 추출
                topics = []
                topic_elements = chapter.select('.topic, .lesson, .section')
                for topic_elem in topic_elements:
                    topic_title = topic_elem.get_text().strip()
                    if topic_title:
                        topics.append(topic_title)
                
                if not topics:
                    # 주제가 없으면 단원명만 사용
                    topics = [unit_title]
                
                curriculum_tree.append({
                    "unit": unit_title,
                    "topics": topics
                })
                
            except Exception as e:
                logger.warning(f"단원 파싱 실패: {e}")
                continue
        
        if not curriculum_tree:
            # EBS에서 수집 실패 시 표준 교육과정 사용
            logger.warning(f"EBS 수집 실패, 표준 교육과정 사용: {grade} {subject}")
            return STANDARD_CURRICULUM.get(subject, {}).get(grade, [])
        
        logger.info(f"✅ {len(curriculum_tree)}개 단원 수집 완료")
        return curriculum_tree
        
    except Exception as e:
        logger.warning(f"EBS 커리큘럼 수집 실패 ({url}): {e}, 표준 교육과정 사용")
        return STANDARD_CURRICULUM.get(subject, {}).get(grade, [])

def build_curriculum_map() -> Dict[str, Any]:
    """
    전체 커리큘럼 맵 구축
    
    Returns:
        전체 커리큘럼 맵 (JSON 구조)
    """
    logger.info("=" * 60)
    logger.info("커리큘럼 맵 구축 시작")
    logger.info("=" * 60)
    
    curriculum_map = {
        "version": "1.0",
        "createdAt": datetime.now().isoformat(),
        "source": "교육부 고시 교육과정 + EBS 목차",
        "subjects": {
            "math": {},
            "english": {}
        }
    }
    
    # 수학 커리큘럼 수집
    logger.info("\n📐 수학 커리큘럼 수집 시작...")
    for grade in ["중1", "중2", "중3", "고1", "고2"]:
        logger.info(f"  - {grade} 수학...")
        
        # EBS URL 선택
        if grade.startswith("중"):
            url = EBS_CURRICULUM_URLS["math_middle"]
        else:
            url = EBS_CURRICULUM_URLS["math_high"]
        
        # 커리큘럼 트리 수집
        curriculum_tree = scrape_ebs_curriculum_tree(url, "math", grade)
        
        curriculum_map["subjects"]["math"][grade] = {
            "grade": grade,
            "subject": "math",
            "units": curriculum_tree,
            "totalUnits": len(curriculum_tree),
            "totalTopics": sum(len(unit.get("topics", [])) for unit in curriculum_tree)
        }
    
    # 영어 커리큘럼 수집
    logger.info("\n📖 영어 커리큘럼 수집 시작...")
    for grade in ["중1", "중2", "중3", "고1", "고2"]:
        logger.info(f"  - {grade} 영어...")
        
        # EBS URL 선택
        if grade.startswith("중"):
            url = EBS_CURRICULUM_URLS["english_middle"]
        else:
            url = EBS_CURRICULUM_URLS["english_high"]
        
        # 커리큘럼 트리 수집
        curriculum_tree = scrape_ebs_curriculum_tree(url, "english", grade)
        
        curriculum_map["subjects"]["english"][grade] = {
            "grade": grade,
            "subject": "english",
            "units": curriculum_tree,
            "totalUnits": len(curriculum_tree),
            "totalTopics": sum(len(unit.get("topics", [])) for unit in curriculum_tree)
        }
    
    # 통계 계산
    total_units = sum(
        len(curriculum_map["subjects"][subject][grade]["units"])
        for subject in ["math", "english"]
        for grade in curriculum_map["subjects"][subject]
    )
    
    total_topics = sum(
        curriculum_map["subjects"][subject][grade]["totalTopics"]
        for subject in ["math", "english"]
        for grade in curriculum_map["subjects"][subject]
    )
    
    curriculum_map["statistics"] = {
        "totalGrades": 10,  # 중1~고2
        "totalSubjects": 2,  # 수학, 영어
        "totalUnits": total_units,
        "totalTopics": total_topics
    }
    
    logger.info("\n" + "=" * 60)
    logger.info("커리큘럼 맵 구축 완료")
    logger.info("=" * 60)
    logger.info(f"총 단원 수: {total_units}개")
    logger.info(f"총 주제 수: {total_topics}개")
    logger.info("=" * 60)
    
    return curriculum_map

def save_curriculum_map(curriculum_map: Dict[str, Any], output_path: Path):
    """커리큘럼 맵을 JSON 파일로 저장"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(curriculum_map, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ 커리큘럼 맵 저장 완료: {output_path}")

def main():
    """메인 함수"""
    # 커리큘럼 맵 구축
    curriculum_map = build_curriculum_map()
    
    # 저장 경로
    output_dir = Path("learning-content/curriculum")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "curriculum_map.json"
    
    # 저장
    save_curriculum_map(curriculum_map, output_path)
    
    # VPS API에 저장 (선택적)
    try:
        import requests
        api_base = "http://148.230.97.246:8003"
        response = requests.post(
            f"{api_base}/api/v1/learning/curriculum/store",
            json=curriculum_map,
            timeout=10
        )
        if response.status_code == 200:
            logger.info("✅ VPS API 저장 완료")
        else:
            logger.warning(f"⚠️ VPS API 저장 실패: {response.status_code}")
    except Exception as e:
        logger.warning(f"⚠️ VPS API 저장 오류: {e}")
    
    logger.info("\n🎯 다음 단계:")
    logger.info("1. 커리큘럼 맵 확인: learning-content/curriculum/curriculum_map.json")
    logger.info("2. 기출문제 다운로더 실행: scripts/download_kice_exams.py")
    logger.info("3. Athena Generator 구축: 커리큘럼 맵 기반 문제 생성")

if __name__ == "__main__":
    main()

