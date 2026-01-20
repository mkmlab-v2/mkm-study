#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VPS 기반 학습 정보 시스템 API 서버

체질별 학습 스타일, 최신 두뇌 과학, 암기 기법, 기억법 통합
EBS 교과과정 기반 영어/수학 대량 데이터 제공
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os
import hashlib
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MKM Study Learning Content API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 학습 콘텐츠 저장 경로 (VPS)
LEARNING_CONTENT_DIR = Path("/var/www/mkm-study/learning-content")
LEARNING_CONTENT_DIR.mkdir(parents=True, exist_ok=True)

# 체질별 학습 스타일 데이터
CONSTITUTION_LEARNING_STYLES = {
    "태양인": {
        "constitution": "태양인",
        "preferredMethod": "혁신적이고 창의적인 학습 방법",
        "studyTime": "오전 6-10시 (활력 최고점)",
        "focusPattern": "짧고 집중적인 세션 (25분 학습 + 5분 휴식)",
        "memoryTechnique": "연상 기법, 스토리텔링",
        "examples": [
            "수학: 개념을 시각적 다이어그램으로 표현",
            "영어: 상황별 대화 연습, 롤플레이"
        ]
    },
    "태음인": {
        "constitution": "태음인",
        "preferredMethod": "체계적이고 안정적인 학습 방법",
        "studyTime": "오후 2-6시 (집중력 최고점)",
        "focusPattern": "장기간 지속적 학습 (50분 학습 + 10분 휴식)",
        "memoryTechnique": "반복 학습, 체계적 정리",
        "examples": [
            "수학: 단계별 문제 풀이, 공식 정리 노트",
            "영어: 단어장 만들기, 문법 체계 정리"
        ]
    },
    "소양인": {
        "constitution": "소양인",
        "preferredMethod": "효율적이고 논리적인 학습 방법",
        "studyTime": "저녁 7-11시 (사고력 최고점)",
        "focusPattern": "빠른 전환 학습 (30분 학습 + 5분 휴식)",
        "memoryTechnique": "논리적 연결, 패턴 인식",
        "examples": [
            "수학: 문제 유형별 분류, 공식 유도 과정 이해",
            "영어: 문법 규칙 체계화, 어원 분석"
        ]
    },
    "소음인": {
        "constitution": "소음인",
        "preferredMethod": "정밀하고 완성도 높은 학습 방법",
        "studyTime": "새벽 3-7시 (정밀도 최고점)",
        "focusPattern": "깊이 있는 집중 학습 (90분 학습 + 15분 휴식)",
        "memoryTechnique": "정밀 암기, 상세 분석",
        "examples": [
            "수학: 증명 과정 완전 이해, 예외 케이스 분석",
            "영어: 문장 구조 완전 분석, 뉘앙스 이해"
        ]
    }
}

# 최신 두뇌 과학 기법
BRAIN_SCIENCE_TECHNIQUES = {
    "spaced_repetition": {
        "name": "간격 반복 학습법",
        "description": "시간 간격을 두고 반복 학습하여 장기 기억 강화",
        "steps": [
            "1일차: 학습",
            "3일차: 복습",
            "7일차: 복습",
            "14일차: 복습",
            "30일차: 최종 복습"
        ],
        "effectiveness": 0.95
    },
    "chunking": {
        "name": "청킹 기법",
        "description": "정보를 의미 있는 덩어리로 나누어 기억",
        "steps": [
            "관련 정보를 그룹화",
            "각 그룹에 의미 부여",
            "그룹 간 연결 관계 파악"
        ],
        "effectiveness": 0.88
    },
    "mnemonic": {
        "name": "연상 기억법",
        "description": "이미 알고 있는 것과 연결하여 기억",
        "steps": [
            "기억할 정보 선택",
            "익숙한 이미지/단어와 연결",
            "이야기로 만들기"
        ],
        "effectiveness": 0.82
    },
    "active_recall": {
        "name": "능동적 회상",
        "description": "단순 반복보다 스스로 떠올리기 연습",
        "steps": [
            "학습 후 바로 문제 풀기",
            "책 없이 떠올려보기",
            "틀린 부분만 다시 학습"
        ],
        "effectiveness": 0.90
    },
    "interleaving": {
        "name": "교차 학습법",
        "description": "여러 주제를 섞어서 학습하여 전이 효과 극대화",
        "steps": [
            "주제 A 학습",
            "주제 B 학습",
            "주제 A 복습",
            "주제 C 학습",
            "주제 B 복습"
        ],
        "effectiveness": 0.85
    }
}

# Pydantic 모델
class Vector4D(BaseModel):
    S: float
    L: float
    K: float
    M: float

class LearningSearchRequest(BaseModel):
    query: str
    subject: Optional[str] = None
    constitution: Optional[str] = None
    vector_4d: Optional[Vector4D] = None
    limit: int = 10

class PersonalizedRecommendationRequest(BaseModel):
    constitution: str
    vector_4d: Vector4D
    subject: str

@app.get("/")
async def root():
    return {"message": "MKM Study Learning Content API", "version": "1.0.0"}

@app.get("/api/v1/learning/constitution/{constitution}")
async def get_constitution_learning_style(constitution: str):
    """체질별 학습 스타일 조회"""
    if constitution not in CONSTITUTION_LEARNING_STYLES:
        raise HTTPException(status_code=404, detail=f"체질 '{constitution}'을 찾을 수 없습니다.")
    
    return CONSTITUTION_LEARNING_STYLES[constitution]

# 학습 콘텐츠 저장소 (실제로는 File-Based Memory System 사용)
LEARNING_CONTENT_STORAGE = Path("/var/www/mkm-study/learning-content")
LEARNING_CONTENT_STORAGE.mkdir(parents=True, exist_ok=True)

class LearningContentStore:
    """학습 콘텐츠 저장소 (File-Based)"""
    
    def __init__(self):
        self.storage_dir = LEARNING_CONTENT_STORAGE
        self.storage_dir.mkdir(parents=True, exist_ok=True)
    
    def store(self, content_data: Dict[str, Any]) -> str:
        """학습 콘텐츠 저장"""
        content_id = hashlib.md5(
            f"{content_data.get('topic', '')}_{content_data.get('subject', '')}_{datetime.now().isoformat()}".encode()
        ).hexdigest()
        
        content_data["id"] = content_id
        content_data["createdAt"] = datetime.now().isoformat()
        content_data["updatedAt"] = datetime.now().isoformat()
        
        # JSON 파일로 저장
        file_path = self.storage_dir / f"{content_id}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(content_data, f, ensure_ascii=False, indent=2)
        
        return content_id
    
    def search(self, query: str, subject: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """학습 콘텐츠 검색 (간단한 텍스트 매칭)"""
        results = []
        
        # 모든 JSON 파일 검색
        for json_file in self.storage_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                
                # 간단한 텍스트 매칭 (실제로는 벡터 검색 사용)
                if query.lower() in content.get('topic', '').lower() or \
                   query.lower() in content.get('content', '').lower():
                    
                    if subject and content.get('subject') != subject:
                        continue
                    
                    results.append(content)
            except Exception as e:
                logger.warning(f"파일 읽기 실패 ({json_file}): {e}")
                continue
        
        # 관련도 순으로 정렬 (간단한 점수 계산)
        results.sort(key=lambda x: (
            query.lower() in x.get('topic', '').lower(),
            len(x.get('content', ''))
        ), reverse=True)
        
        return results[:limit]

# 전역 저장소 인스턴스
_content_store = LearningContentStore()

@app.post("/api/v1/learning/store")
async def store_learning_content(content_data: Dict[str, Any]):
    """학습 콘텐츠 저장"""
    try:
        content_id = _content_store.store(content_data)
        logger.info(f"학습 콘텐츠 저장 완료: {content_id}")
        return {"success": True, "content_id": content_id}
    except Exception as e:
        logger.error(f"학습 콘텐츠 저장 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/learning/search")
async def search_learning_content(request: LearningSearchRequest):
    """학습 콘텐츠 검색 (체질별 맞춤)"""
    logger.info(f"학습 콘텐츠 검색: query={request.query}, subject={request.subject}, constitution={request.constitution}")
    
    # File-Based Memory System에서 검색
    results = _content_store.search(
        query=request.query,
        subject=request.subject,
        limit=request.limit
    )
    
    # 체질별 필터링 (있는 경우)
    if request.constitution:
        # 체질별 맞춤 로직 (향후 구현)
        pass
    
    return {"results": results}

@app.get("/api/v1/learning/memory-techniques")
async def get_memory_techniques(subject: Optional[str] = None):
    """최신 암기 기법 조회"""
    techniques = list(BRAIN_SCIENCE_TECHNIQUES.values())
    
    if subject:
        # 과목별 맞춤 기법 필터링 (향후 구현)
        pass
    
    return {"techniques": techniques}

@app.get("/api/v1/learning/ebs")
async def get_ebs_content(
    grade: int = Query(..., description="학년"),
    subject: str = Query(..., description="과목 (math 또는 english)"),
    chapter: Optional[str] = None
):
    """EBS 교과과정 기반 학습 콘텐츠 조회"""
    # TODO: 실제 EBS 데이터베이스 연동
    # 현재는 더미 데이터 반환
    
    logger.info(f"EBS 콘텐츠 조회: grade={grade}, subject={subject}, chapter={chapter}")
    
    # 더미 데이터
    contents = [
        {
            "id": f"ebs_{subject}_{grade}_001",
            "subject": subject,
            "topic": f"{grade}학년 {subject} 1단원",
            "content": f"{grade}학년 {subject} 교과과정 내용...",
            "difficulty": "medium",
            "ebsCurriculum": f"EBS {grade}학년 {subject}",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    ]
    
    return {"contents": contents}

@app.post("/api/v1/learning/personalized")
async def get_personalized_recommendation(request: PersonalizedRecommendationRequest):
    """체질별 맞춤 학습 추천"""
    # TODO: 4D 벡터 기반 맞춤 추천 알고리즘 구현
    # 현재는 체질별 기본 추천 반환
    
    logger.info(f"맞춤 추천: constitution={request.constitution}, subject={request.subject}, vector_4d={request.vector_4d}")
    
    # 체질별 학습 스타일 조회
    style = CONSTITUTION_LEARNING_STYLES.get(request.constitution)
    if not style:
        raise HTTPException(status_code=404, detail=f"체질 '{request.constitution}'을 찾을 수 없습니다.")
    
    # 더미 추천 데이터
    recommendations = [
        {
            "id": f"personalized_{request.constitution}_{request.subject}_001",
            "subject": request.subject,
            "topic": f"{request.constitution} 맞춤 {request.subject} 학습",
            "content": f"{style['preferredMethod']}을 활용한 {request.subject} 학습 콘텐츠...",
            "difficulty": "medium",
            "constitution": request.constitution,
            "memoryTechnique": style["memoryTechnique"],
            "brainScience": "spaced_repetition",
            "ebsCurriculum": f"EBS {request.subject}",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    ]
    
    return {"recommendations": recommendations}

@app.get("/")
async def root():
    """API 서버 상태 확인"""
    return {
        "status": "running",
        "service": "MKM Study Learning Content API",
        "version": "1.0.0",
        "endpoints": {
            "curriculum": "/api/v1/learning/curriculum",
            "store": "/api/v1/learning/store",
            "search": "/api/v1/learning/search",
            "constitution": "/api/v1/learning/constitution/{constitution}",
            "memory_techniques": "/api/v1/learning/memory-techniques"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print(f"Starting FastAPI server at http://0.0.0.0:8003")
    print(f"API Documentation: http://0.0.0.0:8003/docs")
    uvicorn.run(app, host="0.0.0.0", port=8003)

