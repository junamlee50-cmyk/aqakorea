#!/bin/bash
# ============================================================
# AMK 빌드 검증 스크립트 - 업그레이드마다 자동 실행
# 반복 문제 예방: 버전 불일치 / CSS 누락 / 모듈 체크
# ============================================================
set -e
ERRORS=0

echo "🔍 AMK 빌드 검증 시작..."

# 1. 버전 태그 통일 여부
VERSIONS=$(grep -o "?v=[a-zA-Z0-9]*" src/index.tsx | sort -u | wc -l)
if [ "$VERSIONS" -gt 1 ]; then
  echo "❌ [버전불일치] ?v= 태그가 ${VERSIONS}종류 존재"
  grep -o "?v=[a-zA-Z0-9]*" src/index.tsx | sort -u
  ERRORS=$((ERRORS+1))
else
  echo "✅ 버전 태그 통일됨: $(grep -o '?v=[a-zA-Z0-9]*' src/index.tsx | head -1)"
fi

# 2. Tailwind CSS 유틸리티 클래스 포함 여부
FLEX_CNT=$(grep -c "\.flex{" dist/static/vendor/tailwind.min.css 2>/dev/null || echo 0)
if [ "$FLEX_CNT" -eq 0 ]; then
  echo "❌ [CSS누락] Tailwind .flex 클래스 없음 (레이아웃 깨짐)"
  ERRORS=$((ERRORS+1))
else
  CSS_SIZE=$(wc -c < dist/static/vendor/tailwind.min.css)
  echo "✅ Tailwind CSS 정상 (${CSS_SIZE} bytes)"
fi

# 3. dist/static/vendor 동기화 여부
if [ ! -f "dist/static/vendor/tailwind.min.css" ]; then
  echo "❌ [동기화오류] dist/static/vendor 없음"
  ERRORS=$((ERRORS+1))
else
  echo "✅ dist/static/vendor 동기화됨"
fi

# 4. 필수 모듈 파일 존재 여부
for f in core customer payment field admin stats seo ticket; do
  if [ ! -f "dist/static/modules/${f}.js" ]; then
    echo "❌ [모듈누락] dist/static/modules/${f}.js 없음"
    ERRORS=$((ERRORS+1))
  fi
done
echo "✅ 모든 모듈 파일 존재"

# 5. Service Worker 등록 코드 확인
if grep -q "serviceWorker.*register" src/index.tsx; then
  echo "✅ Service Worker 등록 코드 있음"
else
  echo "❌ [SW없음] Service Worker 등록 코드 누락"
  ERRORS=$((ERRORS+1))
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "✅✅✅ 빌드 검증 통과 - 배포 가능"
else
  echo "❌ 오류 ${ERRORS}개 발견 - 배포 전 수정 필요"
  exit 1
fi
