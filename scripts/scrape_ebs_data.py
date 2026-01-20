#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EBS 데이터 수집 스크립트

EBS 웹사이트에서 수학/영어 교과과정 데이터를 스크래핑하여
학습 정보 시스템에 저장합니다.

주의: robots.txt 확인 및 저작권 준수 필수
"""

import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import hashlib
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 설정
API_BASE = "http://148.230.97.246:8003"

# User-Agent 설정 (봇 차단 방지)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

# EBS 사이트 URL (예시 - 실제 URL 구조 확인 필요)
EBS_URLS = {
    "math_middle": "https://mid.ebs.co.kr/ebs/mid/midMain",  # 중학 수학
    "math_high": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtAtclList.ebs?sbjtId=MATH",  # 고교 수학
    "english_middle": "https://mid.ebs.co.kr/ebs/mid/midMain",  # 중학 영어
    "english_high": "https://www.ebsi.co.kr/ebs/lms/lmsx/retrieveSbjtAtclList.ebs?sbjtId=ENG",  # 고교 영어
}

# 요청 딜레이 (초당 요청 제한 준수)
REQUEST_DELAY = 2.0  # 2초 간격

def clean_text(text: str) -> str:
    """텍스트 정제 (HTML 태그, 공백 제거)"""
    if not text:
        return ""
    # HTML 태그 제거
    text = re.sub(r'<[^>]+>', '', text)
    # 연속 공백 제거
    text = re.sub(r'\s+', ' ', text)
    # 앞뒤 공백 제거
    return text.strip()

def scrape_ebs_course_list(url: str, subject: str, grade: str) -> List[Dict[str, Any]]:
    """
    EBS 강좌 목록 스크래핑
    
    Args:
        url: EBS 강좌 목록 URL
        subject: 과목 (math 또는 english)
        grade: 학년 (중1, 중2, 중3, 고1, 고2, 고3)
    
    Returns:
        강좌 목록 (제목, URL, 설명 등)
    """
    logger.info(f"EBS 강좌 목록 스크래핑 시작: {url}")
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        courses = []
        
        # EBS 강좌 리스트 선택자 (실제 구조에 맞게 수정 필요)
        # 예시: .course_list, .lecture_item 등
        course_elements = soup.select('.course_list .item, .lecture_list .item, .sbjt_list .item')
        
        if not course_elements:
            # 대체 선택자 시도
            course_elements = soup.select('a[href*="course"], a[href*="lecture"], .title a')
        
        for element in course_elements:
            try:
                # 제목 추출
                title_elem = element.select_one('.title, h3, h4, a')
                if not title_elem:
                    continue
                
                title = clean_text(title_elem.get_text())
                if not title:
                    continue
                
                # URL 추출
                link_elem = element.select_one('a')
                course_url = ""
                if link_elem and link_elem.get('href'):
                    href = link_elem.get('href')
                    if href.startswith('http'):
                        course_url = href
                    elif href.startswith('/'):
                        course_url = f"https://www.ebsi.co.kr{href}"
                    else:
                        course_url = f"{url}/{href}"
                
                # 설명 추출
                desc_elem = element.select_one('.desc, .description, p')
                description = clean_text(desc_elem.get_text()) if desc_elem else ""
                
                # 강사명 추출 (있는 경우)
                teacher_elem = element.select_one('.teacher, .instructor, .author')
                teacher = clean_text(teacher_elem.get_text()) if teacher_elem else ""
                
                courses.append({
                    "title": title,
                    "url": course_url,
                    "description": description,
                    "teacher": teacher,
                    "subject": subject,
                    "grade": grade
                })
                
            except Exception as e:
                logger.warning(f"강좌 항목 파싱 실패: {e}")
                continue
        
        logger.info(f"✅ {len(courses)}개 강좌 수집 완료")
        return courses
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ 요청 실패 ({url}): {e}")
        return []
    except Exception as e:
        logger.error(f"❌ 스크래핑 실패 ({url}): {e}")
        return []

def scrape_ebs_course_detail(course_url: str) -> Dict[str, Any]:
    """
    EBS 강좌 상세 정보 스크래핑
    
    Args:
        course_url: 강좌 상세 페이지 URL
    
    Returns:
        강좌 상세 정보 (학습 목표, 내용 등)
    """
    if not course_url:
        return {}
    
    logger.info(f"강좌 상세 정보 수집: {course_url}")
    
    try:
        time.sleep(REQUEST_DELAY)  # 요청 딜레이
        
        response = requests.get(course_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 본문 추출
        content_elem = soup.select_one('.content, .main-content, .article-body, #content')
        content = clean_text(content_elem.get_text()) if content_elem else ""
        
        # 학습 목표 추출
        objective_elem = soup.select_one('.objective, .learning-goal, .goal')
        objective = clean_text(objective_elem.get_text()) if objective_elem else ""
        
        # 키워드 추출
        keywords = []
        keyword_elems = soup.select('.keyword, .tag, .label')
        for elem in keyword_elems:
            keyword = clean_text(elem.get_text())
            if keyword:
                keywords.append(keyword)
        
        return {
            "content": content,
            "objective": objective,
            "keywords": keywords
        }
        
    except Exception as e:
        logger.warning(f"강좌 상세 정보 수집 실패 ({course_url}): {e}")
        return {}

def scrape_aihub_qa_data() -> List[Dict[str, Any]]:
    """
    AI Hub에서 교과서 기반 질의응답 데이터 수집
    
    참고: AI Hub는 회원가입 후 데이터 다운로드 필요
    """
    logger.info("AI Hub 데이터 수집 시작 (수동 다운로드 필요)")
    
    # AI Hub 데이터는 수동 다운로드 후 JSON 파일로 저장 필요
    # 여기서는 파일에서 로드하는 예시만 제공
    
    aihub_data_path = Path("learning-content/aihub_qa_data.json")
    
    if not aihub_data_path.exists():
        logger.warning("AI Hub 데이터 파일이 없습니다. 수동으로 다운로드하세요:")
        logger.info("1. https://aihub.or.kr 접속")
        logger.info("2. '초중고 학생 질문-답변 데이터' 검색")
        logger.info("3. 데이터 다운로드 후 learning-content/aihub_qa_data.json으로 저장")
        return []
    
    try:
        with open(aihub_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"✅ AI Hub 데이터 로드 완료: {len(data)}개 항목")
        return data
        
    except Exception as e:
        logger.error(f"❌ AI Hub 데이터 로드 실패: {e}")
        return []

def scrape_public_data_portal(api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    공공데이터포털에서 교육과정 데이터 수집
    
    Args:
        api_key: 공공데이터포털 API 키 (선택적)
    """
    logger.info("공공데이터포털 데이터 수집 시작")
    
    if not api_key:
        logger.warning("API 키가 없습니다. 공공데이터포털에서 발급받으세요:")
        logger.info("1. https://www.data.go.kr 접속")
        logger.info("2. '교육과정' 검색")
        logger.info("3. 원하는 데이터셋 선택 후 API 키 발급")
        return []
    
    # 공공데이터포털 API 호출 예시
    # 실제 API 엔드포인트는 데이터셋마다 다름
    try:
        # 예시: 교육과정 정보 API
        api_url = f"https://www.data.go.kr/api/교육과정정보?serviceKey={api_key}"
        response = requests.get(api_url, timeout=15)
        response.raise_for_status()
        
        # XML 또는 JSON 파싱 (실제 응답 형식에 맞게 수정)
        data = response.json() if response.headers.get('Content-Type', '').startswith('application/json') else {}
        
        logger.info(f"✅ 공공데이터 수집 완료: {len(data.get('items', []))}개 항목")
        return data.get('items', [])
        
    except Exception as e:
        logger.error(f"❌ 공공데이터 수집 실패: {e}")
        return []

def save_to_api(content_data: Dict[str, Any]) -> bool:
    """수집한 데이터를 VPS API에 저장"""
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/learning/store",
            json=content_data,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"✅ API 저장 성공: {content_data.get('topic', 'Unknown')}")
            return True
        else:
            logger.warning(f"⚠️ API 저장 실패: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ API 저장 오류: {e}")
        return False

def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("EBS 데이터 수집 시작")
    logger.info("=" * 60)
    
    # 수집할 데이터 목록
    collection_plan = [
        {"subject": "math", "grade": "중1", "url": EBS_URLS["math_middle"]},
        {"subject": "math", "grade": "중2", "url": EBS_URLS["math_middle"]},
        {"subject": "math", "grade": "중3", "url": EBS_URLS["math_middle"]},
        {"subject": "math", "grade": "고1", "url": EBS_URLS["math_high"]},
        {"subject": "math", "grade": "고2", "url": EBS_URLS["math_high"]},
        {"subject": "english", "grade": "중1", "url": EBS_URLS["english_middle"]},
        {"subject": "english", "grade": "중2", "url": EBS_URLS["english_middle"]},
        {"subject": "english", "grade": "중3", "url": EBS_URLS["english_middle"]},
        {"subject": "english", "grade": "고1", "url": EBS_URLS["english_high"]},
        {"subject": "english", "grade": "고2", "url": EBS_URLS["english_high"]},
    ]
    
    total_collected = 0
    total_saved = 0
    
    # EBS 강좌 목록 수집
    for plan in collection_plan:
        logger.info(f"\n📚 {plan['grade']} {plan['subject']} 수집 시작...")
        
        courses = scrape_ebs_course_list(
            plan['url'],
            plan['subject'],
            plan['grade']
        )
        
        total_collected += len(courses)
        
        # 각 강좌 상세 정보 수집 및 저장
        for course in courses:
            # 상세 정보 수집
            detail = scrape_ebs_course_detail(course.get('url', ''))
            
            # 학습 콘텐츠 데이터 구성
            content_data = {
                "subject": plan['subject'],
                "topic": course['title'],
                "content": detail.get('content', course.get('description', '')),
                "difficulty": "medium",  # 기본값
                "ebsCurriculum": f"EBS {plan['grade']} {plan['subject']}",
                "keyTopics": detail.get('keywords', []),
                "grade": plan['grade'],
                "teacher": course.get('teacher', ''),
                "objective": detail.get('objective', ''),
                "url": course.get('url', ''),
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            
            # API에 저장
            if save_to_api(content_data):
                total_saved += 1
            
            time.sleep(REQUEST_DELAY)  # 요청 딜레이
    
    # AI Hub 데이터 수집 (수동 다운로드 필요)
    logger.info("\n🤖 AI Hub 데이터 수집 시작...")
    aihub_data = scrape_aihub_qa_data()
    
    if aihub_data:
        for item in aihub_data:
            content_data = {
                "subject": item.get('subject', 'general'),
                "topic": item.get('question', ''),
                "content": item.get('answer', ''),
                "difficulty": item.get('difficulty', 'medium'),
                "ebsCurriculum": "AI Hub",
                "keyTopics": item.get('keywords', []),
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            
            if save_to_api(content_data):
                total_saved += 1
    
    # 공공데이터 수집 (API 키 필요)
    logger.info("\n📊 공공데이터 수집 시작...")
    public_data = scrape_public_data_portal(api_key=None)  # API 키 설정 필요
    
    if public_data:
        for item in public_data:
            content_data = {
                "subject": item.get('subject', 'general'),
                "topic": item.get('title', ''),
                "content": item.get('content', ''),
                "difficulty": "medium",
                "ebsCurriculum": "공공데이터포털",
                "keyTopics": item.get('keywords', []),
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat()
            }
            
            if save_to_api(content_data):
                total_saved += 1
    
    # 결과 요약
    logger.info("\n" + "=" * 60)
    logger.info("수집 완료 요약")
    logger.info("=" * 60)
    logger.info(f"총 수집: {total_collected}개 강좌")
    logger.info(f"총 저장: {total_saved}개 항목")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()

