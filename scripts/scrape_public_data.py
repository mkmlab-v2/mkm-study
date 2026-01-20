#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
공공데이터포털 데이터 수집 스크립트

공공데이터포털(data.go.kr)에서 교육과정 관련 데이터를 수집하여
학습 정보 시스템에 저장합니다.

주의: API 키 발급 필요 (1-2일 소요)
"""

import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import xml.etree.ElementTree as ET

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API 설정
API_BASE = "http://148.230.97.246:8003"

# 공공데이터포털 추천 데이터셋
PUBLIC_DATA_APIS = {
    "교육과정정보": {
        "name": "교육과정 정보",
        "description": "초중고 교육과정 정보",
        "api_url_template": "http://apis.data.go.kr/1383000/교육과정정보?serviceKey={api_key}&pageNo=1&numOfRows=100",
        "format": "xml"  # 또는 "json"
    },
    "학교기본정보": {
        "name": "학교 기본 정보",
        "description": "전국 학교 정보",
        "api_url_template": "http://apis.data.go.kr/1383000/학교기본정보?serviceKey={api_key}&pageNo=1&numOfRows=100",
        "format": "xml"
    },
    "교과용도서목록": {
        "name": "교과용 도서 목록",
        "description": "교과서 목록 정보",
        "api_url_template": "http://apis.data.go.kr/1383000/교과용도서목록?serviceKey={api_key}&pageNo=1&numOfRows=100",
        "format": "xml"
    }
}

def parse_xml_response(xml_text: str) -> List[Dict[str, Any]]:
    """XML 응답 파싱"""
    try:
        root = ET.fromstring(xml_text)
        items = []
        
        # 공공데이터포털 XML 구조에 맞게 파싱
        # 일반적으로 <items><item>...</item></items> 구조
        for item in root.findall('.//item'):
            item_dict = {}
            for child in item:
                item_dict[child.tag] = child.text
            items.append(item_dict)
        
        return items
        
    except ET.ParseError as e:
        logger.error(f"XML 파싱 오류: {e}")
        return []
    except Exception as e:
        logger.error(f"XML 처리 오류: {e}")
        return []

def fetch_public_data(api_name: str, api_key: str) -> List[Dict[str, Any]]:
    """
    공공데이터포털 API에서 데이터 수집
    
    Args:
        api_name: API 이름 (PUBLIC_DATA_APIS의 키)
        api_key: 공공데이터포털 API 키
    
    Returns:
        수집된 데이터 리스트
    """
    if api_name not in PUBLIC_DATA_APIS:
        logger.error(f"알 수 없는 API: {api_name}")
        return []
    
    api_info = PUBLIC_DATA_APIS[api_name]
    api_url = api_info["api_url_template"].format(api_key=api_key)
    
    logger.info(f"공공데이터 수집 시작: {api_info['name']}")
    
    try:
        response = requests.get(api_url, timeout=30)
        response.raise_for_status()
        
        if api_info["format"] == "xml":
            items = parse_xml_response(response.text)
        else:
            # JSON 형식
            data = response.json()
            items = data.get('response', {}).get('body', {}).get('items', [])
            if not items:
                items = data.get('items', [])
        
        logger.info(f"✅ {len(items)}개 항목 수집 완료")
        return items
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ API 요청 실패: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ 데이터 수집 실패: {e}")
        return []

def convert_to_learning_content(item: Dict[str, Any], api_name: str) -> Dict[str, Any]:
    """공공데이터를 학습 콘텐츠 형식으로 변환"""
    # 다양한 필드명 대응
    title = item.get('title') or item.get('제목') or item.get('과목명') or item.get('교과명', '')
    content = item.get('content') or item.get('내용') or item.get('설명') or item.get('개요', '')
    subject = item.get('subject') or item.get('과목') or item.get('교과', 'general')
    grade = item.get('grade') or item.get('학년') or item.get('학년도', '')
    
    return {
        "subject": subject.lower() if isinstance(subject, str) else 'general',
        "topic": title or "공공데이터",
        "content": content or str(item),
        "difficulty": "medium",
        "ebsCurriculum": f"공공데이터포털 {grade} {subject}" if grade else "공공데이터포털",
        "keyTopics": item.get('keywords', []) or [],
        "grade": str(grade) if grade else "",
        "source": "public_data_portal",
        "api_name": api_name,
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

def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("공공데이터포털 데이터 수집 시작")
    logger.info("=" * 60)
    
    # API 키 확인
    api_key = None
    
    # 환경 변수에서 API 키 로드 시도
    import os
    api_key = os.getenv('PUBLIC_DATA_API_KEY')
    
    if not api_key:
        logger.warning("⚠️ API 키가 없습니다.")
        logger.info("\n📋 공공데이터포털 API 키 발급 가이드:")
        logger.info("1. https://www.data.go.kr 접속")
        logger.info("2. 회원가입 및 로그인")
        logger.info("3. '교육과정' 또는 '학교정보' 검색")
        logger.info("4. 원하는 데이터셋 선택")
        logger.info("5. '활용신청' 클릭 후 API 키 발급")
        logger.info("6. 환경 변수 설정:")
        logger.info("   Windows: setx PUBLIC_DATA_API_KEY \"your-api-key\"")
        logger.info("   또는 스크립트에 직접 입력\n")
        
        # 사용자 입력 요청
        user_input = input("API 키를 입력하세요 (또는 Enter로 건너뛰기): ").strip()
        if user_input:
            api_key = user_input
        else:
            logger.info("API 키 없이 진행합니다. (데이터 수집 불가)")
            return
    
    if not api_key:
        return
    
    total_saved = 0
    
    # 각 API에서 데이터 수집
    for api_name, api_info in PUBLIC_DATA_APIS.items():
        logger.info(f"\n📊 {api_info['name']} 수집 시작...")
        
        items = fetch_public_data(api_name, api_key)
        
        for item in items:
            content_data = convert_to_learning_content(item, api_name)
            
            if save_to_api(content_data):
                total_saved += 1
    
    logger.info("\n" + "=" * 60)
    logger.info(f"✅ 공공데이터 수집 완료: {total_saved}개 항목 저장")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()

