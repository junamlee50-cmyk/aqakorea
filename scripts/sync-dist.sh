#!/bin/bash
# public/static → dist/static 동기화 스크립트
# 웹(public)에서 수정한 내용을 앱(dist, PWA 서비스 파일)에 반영

WORKSPACE="/home/work/.openclaw/workspace/aqakorea"

echo "🔄 public/static → dist/static 동기화 시작..."

# modules 동기화
for f in "$WORKSPACE/public/static/modules/"*.js; do
  fname=$(basename "$f")
  dest="$WORKSPACE/dist/static/modules/$fname"
  if ! diff -q "$f" "$dest" > /dev/null 2>&1; then
    cp "$f" "$dest"
    echo "  ✅ 업데이트: modules/$fname"
  fi
done

# CSS 동기화
if ! diff -q "$WORKSPACE/public/static/style.css" "$WORKSPACE/dist/static/style.css" > /dev/null 2>&1; then
  cp "$WORKSPACE/public/static/style.css" "$WORKSPACE/dist/static/style.css"
  echo "  ✅ 업데이트: style.css"
fi

# manifest.json 동기화
if ! diff -q "$WORKSPACE/public/static/manifest.json" "$WORKSPACE/dist/static/manifest.json" > /dev/null 2>&1; then
  cp "$WORKSPACE/public/static/manifest.json" "$WORKSPACE/dist/static/manifest.json"
  echo "  ✅ 업데이트: manifest.json"
fi

echo "✨ 동기화 완료 - 웹/앱(PWA) 동일 버전 적용"
