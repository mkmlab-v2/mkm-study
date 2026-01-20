#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📊 수능/모의고사 기출문제 다운로더

한국교육과정평가원(KICE)의 수능 및 모의고사 기출문제를
공공 데이터로 확보하여 '기준점(Ground Truth)'으로 활용합니다.

저작권: 국가 저작물 (공개, 사용 자유)
"""

import sys
import json
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import time
import re
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User-Agent 설정
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
}

# 요청 딜레이
REQUEST_DELAY = 2.0  # 2초 간격

# 평가원 기출문제 URL (실제 URL 확인 필요)
KICE_BASE_URL = "https://www.kice.re.kr"
KICE_EXAM_URLS = {
    "수능": "https://www.kice.re.kr/boardCnts/list.do?boardID=1500230&m=040101&s=kice",  # 수능 기출문제
    "모의고사": "https://www.kice.re.kr/boardCnts/list.do?boardID=1500231&m=040102&s=kice",  # 모의고사 기출문제
    "학력평가": "https://www.kice.re.kr/boardCnts/list.do?boardID=1500232&m=040103&s=kice",  # 전국연합학력평가
}

# 최근 N년치 기출문제 수집
YEARS_TO_COLLECT = 10  # 최근 10년

def download_pdf(url: str, save_path: Path) -> bool:
    """PDF 파일 다운로드"""
    try:
        time.sleep(REQUEST_DELAY)
        response = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.info(f"✅ PDF 다운로드 완료: {save_path.name}")
        return True
        
    except Exception as e:
        logger.error(f"❌ PDF 다운로드 실패 ({url}): {e}")
        return False

def extract_exam_metadata(html_content: str) -> List[Dict[str, Any]]:
    """기출문제 목록에서 메타데이터 추출"""
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html_content, 'html.parser')
    exams = []
    
    # 평가원 게시판 구조에 맞게 파싱 (실제 구조 확인 필요)
    exam_items = soup.select('.exam-item, .board-item, .list-item')
    
    for item in exam_items:
        try:
            # 제목 추출
            title_elem = item.select_one('.title, h3, a')
            title = title_elem.get_text().strip() if title_elem else ""
            
            # 연도 추출 (예: "2024학년도")
            year_match = re.search(r'(\d{4})학년도', title)
            year = year_match.group(1) if year_match else ""
            
            # PDF 링크 추출
            link_elem = item.select_one('a[href*=".pdf"], a[href*="download"]')
            pdf_url = ""
            if link_elem:
                href = link_elem.get('href', '')
                if href.startswith('http'):
                    pdf_url = href
                elif href.startswith('/'):
                    pdf_url = urljoin(KICE_BASE_URL, href)
                else:
                    pdf_url = urljoin(KICE_BASE_URL, href)
            
            # 과목 추출 (수학, 영어 등)
            subject = ""
            if "수학" in title or "math" in title.lower():
                subject = "math"
            elif "영어" in title or "english" in title.lower():
                subject = "english"
            
            if title and year:
                exams.append({
                    "title": title,
                    "year": year,
                    "subject": subject,
                    "pdf_url": pdf_url,
                    "exam_type": "수능" if "수능" in title else "모의고사"
                })
                
        except Exception as e:
            logger.warning(f"메타데이터 추출 실패: {e}")
            continue
    
    return exams

def scrape_kice_exams(exam_type: str = "수능") -> List[Dict[str, Any]]:
    """
    평가원 기출문제 목록 수집
    
    Args:
        exam_type: 시험 유형 ("수능", "모의고사", "학력평가")
    
    Returns:
        기출문제 메타데이터 리스트
    """
    logger.info(f"평가원 기출문제 수집 시작: {exam_type}")
    
    if exam_type not in KICE_EXAM_URLS:
        logger.error(f"알 수 없는 시험 유형: {exam_type}")
        return []
    
    url = KICE_EXAM_URLS[exam_type]
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        exams = extract_exam_metadata(response.text)
        
        # 최근 N년치만 필터링
        current_year = datetime.now().year
        filtered_exams = [
            exam for exam in exams
            if exam.get("year") and int(exam.get("year", 0)) >= (current_year - YEARS_TO_COLLECT)
        ]
        
        logger.info(f"✅ {len(filtered_exams)}개 기출문제 발견")
        return filtered_exams
        
    except Exception as e:
        logger.error(f"❌ 기출문제 수집 실패: {e}")
        return []

def download_exam_pdfs(exams: List[Dict[str, Any]], output_dir: Path):
    """기출문제 PDF 다운로드"""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    downloaded = 0
    failed = 0
    
    for exam in exams:
        if not exam.get("pdf_url"):
            continue
        
        # 파일명 생성
        filename = f"{exam['year']}_{exam['exam_type']}_{exam['subject']}_{exam['title'][:20]}.pdf"
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)  # 파일명에 사용 불가 문자 제거
        
        save_path = output_dir / filename
        
        if save_path.exists():
            logger.info(f"⏭️ 이미 다운로드됨: {filename}")
            continue
        
        if download_pdf(exam["pdf_url"], save_path):
            downloaded += 1
        else:
            failed += 1
    
    logger.info(f"\n다운로드 완료: 성공 {downloaded}개, 실패 {failed}개")

def convert_pdf_to_text(pdf_path: Path) -> str:
    """PDF를 텍스트로 변환 (OCR 또는 텍스트 추출)"""
    try:
        # PyPDF2 또는 pdfplumber 사용
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text
        except ImportError:
            try:
                import PyPDF2
                with open(pdf_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    text = ""
                    for page in pdf_reader.pages:
                        text += page.extract_text() or ""
                    return text
            except ImportError:
                logger.warning("PDF 라이브러리가 없습니다. pip install pdfplumber 또는 PyPDF2 필요")
                return ""
    except Exception as e:
        logger.error(f"PDF 변환 실패 ({pdf_path}): {e}")
        return ""

def process_exam_pdfs(pdf_dir: Path, output_dir: Path):
    """기출문제 PDF를 텍스트로 변환하여 저장"""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_files = list(pdf_dir.glob("*.pdf"))
    logger.info(f"PDF 변환 시작: {len(pdf_files)}개 파일")
    
    converted = 0
    
    for pdf_file in pdf_files:
        try:
            text = convert_pdf_to_text(pdf_file)
            
            if text:
                # 텍스트 파일로 저장
                text_file = output_dir / f"{pdf_file.stem}.txt"
                with open(text_file, 'w', encoding='utf-8') as f:
                    f.write(text)
                
                converted += 1
                logger.info(f"✅ 변환 완료: {pdf_file.name}")
            else:
                logger.warning(f"⚠️ 텍스트 추출 실패: {pdf_file.name}")
                
        except Exception as e:
            logger.error(f"❌ 변환 오류 ({pdf_file}): {e}")
    
    logger.info(f"\n변환 완료: {converted}/{len(pdf_files)}개")

def main():
    """메인 함수"""
    logger.info("=" * 60)
    logger.info("수능/모의고사 기출문제 다운로더")
    logger.info("=" * 60)
    
    # 출력 디렉토리
    output_base = Path("learning-content/kice-exams")
    pdf_dir = output_base / "pdfs"
    text_dir = output_base / "texts"
    metadata_dir = output_base / "metadata"
    
    # 기출문제 수집
    all_exams = []
    
    for exam_type in ["수능", "모의고사"]:
        exams = scrape_kice_exams(exam_type)
        all_exams.extend(exams)
    
    # 메타데이터 저장
    metadata_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = metadata_dir / "exam_metadata.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(all_exams, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✅ 메타데이터 저장 완료: {len(all_exams)}개")
    
    # PDF 다운로드 (선택적)
    user_input = input("\nPDF 다운로드를 진행하시겠습니까? (y/n): ").strip().lower()
    if user_input == 'y':
        download_exam_pdfs(all_exams, pdf_dir)
        
        # PDF를 텍스트로 변환 (선택적)
        user_input2 = input("\nPDF를 텍스트로 변환하시겠습니까? (y/n): ").strip().lower()
        if user_input2 == 'y':
            process_exam_pdfs(pdf_dir, text_dir)
    
    logger.info("\n🎯 다음 단계:")
    logger.info("1. 기출문제 메타데이터 확인: learning-content/kice-exams/metadata/exam_metadata.json")
    logger.info("2. Athena Generator 구축: 기출문제를 분석하여 문제 생성 프롬프트 작성")
    logger.info("3. 합성 문제 생성: 커리큘럼 맵 + 기출문제 분석 → 맞춤형 문제 생성")

if __name__ == "__main__":
    main()

