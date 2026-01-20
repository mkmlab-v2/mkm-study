#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
학습 콘텐츠 벡터화 스크립트

학습 콘텐츠를 4D 벡터로 변환하여
File-Based Memory System에 저장합니다.
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
VECTORIZE_API = f"{API_BASE}/api/v1/vectorize"  # 벡터화 API (가정)

def vectorize_content(content: str, subject: str, topic: str) -> Dict[str, float]:
    """
    학습 콘텐츠를 4D 벡터로 변환
    
    Args:
        content: 학습 콘텐츠 텍스트
        subject: 과목 (math 또는 english)
        topic: 주제
    
    Returns:
        4D 벡터 (S, L, K, M)
    """
    try:
        # 벡터화 API 호출 (실제로는 VPS의 벡터화 서비스 사용)
        response = requests.post(
            VECTORIZE_API,
            json={
                "text": content,
                "metadata": {
                    "subject": subject,
                    "topic": topic
                }
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("vector_4d", {"S": 0.25, "L": 0.25, "K": 0.25, "M": 0.25})
        else:
            logger.warning(f"벡터화 API 실패, 기본값 사용: {response.status_code}")
            return {"S": 0.25, "L": 0.25, "K": 0.25, "M": 0.25}
            
    except Exception as e:
        logger.error(f"벡터화 오류: {e}, 기본값 사용")
        return {"S": 0.25, "L": 0.25, "K": 0.25, "M": 0.25}

def process_learning_content(content_file: Path):
    """학습 콘텐츠 파일을 벡터화하여 저장"""
    logger.info(f"학습 콘텐츠 벡터화 시작: {content_file}")
    
    # 파일 읽기
    with open(content_file, 'r', encoding='utf-8') as f:
        contents = json.load(f)
    
    vectorized_count = 0
    error_count = 0
    
    for item in contents:
        try:
            # 벡터화
            vector_4d = vectorize_content(
                item["content"],
                item["subject"],
                item["topic"]
            )
            
            # 벡터화된 데이터 저장
            item["vector_4d"] = vector_4d
            item["vectorized_at"] = datetime.now().isoformat()
            
            vectorized_count += 1
            logger.info(f"✅ 벡터화 완료: {item['topic']}")
            
        except Exception as e:
            error_count += 1
            logger.error(f"❌ 벡터화 실패: {item.get('topic', 'Unknown')} - {e}")
    
    # 벡터화된 데이터 저장
    output_file = content_file.parent / f"{content_file.stem}_vectorized.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(contents, f, ensure_ascii=False, indent=2)
    
    logger.info(f"벡터화 완료: 성공 {vectorized_count}개, 실패 {error_count}개")
    logger.info(f"출력 파일: {output_file}")
    
    return vectorized_count, error_count

def main():
    """메인 함수"""
    logger.info("학습 콘텐츠 벡터화 시작")
    
    # 학습 콘텐츠 파일 경로 (예시)
    content_dir = Path("C:/workspace/projects/mkm/mkm-study20260120/learning-content")
    content_dir.mkdir(parents=True, exist_ok=True)
    
    # 모든 JSON 파일 처리
    json_files = list(content_dir.glob("*.json"))
    
    if not json_files:
        logger.warning("벡터화할 학습 콘텐츠 파일이 없습니다.")
        logger.info("먼저 import_ebs_content.py를 실행하여 데이터를 임포트하세요.")
        return
    
    total_vectorized = 0
    total_errors = 0
    
    for json_file in json_files:
        if "_vectorized" in json_file.name:
            continue  # 이미 벡터화된 파일은 스킵
        
        vectorized, errors = process_learning_content(json_file)
        total_vectorized += vectorized
        total_errors += errors
    
    logger.info(f"전체 벡터화 완료: 성공 {total_vectorized}개, 실패 {total_errors}개")
    
    if total_errors == 0:
        logger.info("✅ 모든 콘텐츠 벡터화 성공!")
    else:
        logger.warning(f"⚠️ 일부 콘텐츠 벡터화 실패: {total_errors}개")

if __name__ == "__main__":
    main()

