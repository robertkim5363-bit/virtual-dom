# Virtual DOM & Diff Algorithm — Camp David Demo

> React의 핵심 개념인 **Virtual DOM**과 **Diff 알고리즘**을 Vanilla JavaScript로 직접 구현하고,
> 실위성 지도 위에서 동작하는 **Terrain Camo Masking** 시스템으로 시각화한 프로젝트입니다.

## 🚀 실행 방법

```
index-v2.html 을 브라우저에서 열면 바로 실행됩니다. (빌드 불필요)
```

## 📁 파일 구조

```
virtual-dom/
├── index-v2.html              # ✅ 메인 실행파일 (최신)
├── index-v2-backup-20260325.html  # 🔒 백업 (수정 금지)
├── index-single-v2.html       # 개발 원본 (index-v2.html 과 동일)
├── index-single-backup.html   # 원본 기반 백업
├── index-single.html          # 구버전 (참고용)
├── index.html                 # 초기 버전
├── css/                       # 스타일시트
├── js/                        # 분리된 모듈 (초기 버전용)
└── README.md
```

## ✨ 핵심 기능

### 1. Virtual DOM 엔진
- `createVNode` / `domToVNode` / `renderVNode` — DOM ↔ VNode 양방향 변환
- **5가지 Diff 케이스**: CREATE / REMOVE / REPLACE / UPDATE(props) / UPDATE(children)
- `applyPatch` — 변경된 노드만 실제 DOM에 반영 (최소 Reflow)
- **Undo / Redo** — 패치 히스토리 스냅샷 관리

### 2. Google Earth 스타일 UI
- ESRI ArcGIS 실위성 이미지 (Camp David, Maryland)
- **Wheel Zoom** + 버튼 줌 — 줌 레벨에 따라 고해상도 위성 이미지 자동 재요청
- **Align Names 드래그** — Actual DOM에서 마커/정보카드 위치 직접 조정
- localStorage(`camp-david-layout-v1`)에 정렬값 자동 저장
- **🔒 Lock In Positions** 버튼 — localStorage 값을 HTML 파일에 영구 반영 후 다운로드

### 3. Terrain Camo Masking System
- **Freehand Lasso 선택** — 마우스 드래그로 자유곡선 영역 그리기
- **Polygon Clip-path 마스킹** — 선택 영역 내부만 인접 forest 텍스처로 위장
- **Mask Focus 모드** — 선택 영역 외 흐림 처리로 집중 편집

### 4. Virtual DOM 편집 도구 (Test 모드)
- 텍스트 직접 편집
- 속성(class, style, data-*) 수정
- 요소 추가 / 삭제 / 태그 교체
- Patch → Diff Log에 변경 내역 출력

## 🛠 기술 스택

| 구분 | 내용 |
|------|------|
| Language | Vanilla JavaScript (ES5 + ES6 혼용) |
| Rendering | 순수 DOM API, CSS backdrop-filter |
| 지도 | ESRI ArcGIS World Imagery MapServer |
| 저장 | Browser localStorage |
| 빌드 | 없음 (단일 HTML 파일) |

## 📖 핵심 학습 포인트

**실제 DOM이 느린 이유**
DOM 조작 → 브라우저 Reflow(레이아웃 재계산) + Repaint(화면 다시 그리기) 발생.
빈번한 조작은 이 사이클을 반복시켜 성능 저하를 일으킵니다.

**Virtual DOM 해결 방식**
1. 변경 전후 VNode 트리를 Diff 알고리즘으로 비교
2. 최소 변경 Patch 집합 생성
3. 실제 DOM에 일괄 반영 → 불필요한 Reflow 최소화

## 👥 팀원

- 크래프톤 정글 SW-AI 12기
