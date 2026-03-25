# Virtual DOM & Diff Algorithm — Satellite Camo Demo

---

## 🎯 핵심 가치 제안

**미션**
> 위성사진 한 장이면 주변 지형을 자동으로 샘플링해서,
> 은폐 대상을 **최소한의 DOM 조작만으로** 감쪽같이 위장하는 렌더링 엔진을 만든다.

**비전**
> 사막이든 바다든 숲이든 도시든 —
> 어떤 환경의 사진이 들어와도, **사람 손 하나 안 거치고** 알아서 읽고 알아서 덮는 시스템.

---

## 📌 학습 목표와 프로젝트의 부합성

과제가 요구하는 4가지 핵심 구현이 이 프로젝트 어디에 녹아있는지 직접 매핑합니다.

**① DOM → Virtual DOM 변환**

위성사진 위에 깔린 100개 타일, 보안 패널, 마커 — 이 모든 HTML 요소를

```js
{ type: "div", props: { class: "tile tile-clear" }, children: [] }
```

형태의 JS 객체로 변환하는 `domToVNode` 함수가 이에 해당합니다.

**② Diff 알고리즘 — 두 Virtual DOM 비교**

CAMO 스위치를 켜기 전 V-DOM과 켠 후 V-DOM을 비교해서 _"100개 타일 중 20개만 class가 바뀌었다"_ 를 찾아냅니다. 과제의 **5가지 핵심 케이스** 중 `UPDATE(속성 변경)`에 해당합니다.

**③ Patch — 변경된 부분만 실제 DOM에 반영**

Diff가 찾아낸 20개 타일만 브라우저 화면에서 교체합니다. 나머지 80개는 손 안 댑니다. 과제가 요구하는 _"변경된 부분만 실제 영역에 렌더링"_ 그대로입니다.

**④ State History — Undo / Redo**

CAMO 적용 전 상태로 되돌리기(뒤로가기), 다시 켜기(앞으로가기). 패치 히스토리 스냅샷으로 구현합니다.

---

## 🚀 실행 방법

빌드 없이 브라우저에서 바로 실행합니다.

```
# Camp David (메인 데모)
index-single-v2.html 을 브라우저에서 열기

# Naval Station Norfolk (잠수함 타겟 데모)
index-norfolk-v1.html 을 브라우저에서 열기
```

> `file://` 프로토콜 기준. 외부 의존성 없음 (ESRI 위성 이미지만 인터넷 필요)

---

## 📁 파일 구조

```
virtual-dom/
├── index-single-v2.html                   ✅ Camp David 메인 실행파일
├── index-norfolk-v1.html                  ✅ Naval Station Norfolk 실행파일
├── index-single-v2-backup-20260325.html   🔒 Camp David 백업
├── index-norfolk-v1-backup-20260325.html  🔒 Norfolk 백업
├── index-v2-backup-20260325.html          🔒 초기 버전 백업
└── README.md
```

두 HTML 파일은 **동일한 코드베이스**를 공유하며, 위치별 설정(위성 bbox, 마커, 날씨 등)만 다릅니다.

---

## ✨ 핵심 기능

### 1. Virtual DOM 엔진

- `createVNode` / `domToVNode` / `renderVNode` — DOM ↔ VNode 양방향 변환
- **5가지 Diff 케이스**: `CREATE` / `REMOVE` / `REPLACE` / `UPDATE(props)` / `UPDATE(children)`
- `applyPatch` — 변경된 노드만 실제 DOM에 반영 (최소 Reflow)
- **Undo / Redo** — 패치 히스토리 스냅샷 관리

### 2. Google Earth 스타일 UI

- ESRI ArcGIS World Imagery 실위성 이미지
- **Wheel Zoom** + 버튼 줌 — 줌 레벨에 따라 고해상도 위성 이미지 자동 재요청
- **Align Names 드래그** — 마커/정보카드 위치를 Actual DOM에서 직접 조정
- **🔒 Lock In Positions** — localStorage 정렬값을 HTML에 영구 반영 후 다운로드

### 3. 멀티 영역 Terrain Camo Masking

핵심 기능. **여러 영역을 동시에 위장** 처리할 수 있습니다.

```
1. Mask Focus 모드 진입
2. Trace Area → 마우스 드래그로 자유곡선(Lasso) 영역 그리기
3. Apply Terrain Clone → 인접 지형 텍스처 패치로 채움
4. 반복 — 여러 영역을 연속으로 트레이스 & 어플라이
5. 패널의 Region 리스트에서 개별 Remove 또는 Clear All
```

| 단계 | 설명 |
|------|------|
| Lasso 트레이스 | MouseEvent로 폴리곤 포인트 수집 |
| Clip-path 마스킹 | SVG polygon → CSS `clip-path: polygon(...)` |
| 패치 생성 | 선택 영역 경계 바깥의 인접 지형 샘플링 → 원형 패치로 채움 |
| 멀티 리전 | 각 마스크는 독립된 `.camo-region` DOM 요소로 관리 |
| 클릭 선택 | `pointInPolygon` 감지 + 면적 기준 최소 영역 우선 선택 |

### 4. Norfolk 전용 — Dynamic Bbox Refresh

줌 레벨 1.6× 이상 진입 시 현재 뷰포트 geo bbox를 계산해 ESRI에 tight 이미지를 재요청합니다. 잠수함처럼 작은 타겟도 고해상도로 확인 가능합니다.

```
getVisibleGeoBbox()  →  buildSatelliteUrl(w, h, bbox)  →  applyDynamicSatBackground()
```

---

## 🗺 데모 위치 정보

| 데모 | 위치 | 주요 타겟 |
|------|------|-----------|
| Camp David | 39.648°N 77.465°W · Maryland | Aspen Lodge, Helipad, Putting Green 외 |
| Naval Station Norfolk | 36.9397°N 76.3333°W · Virginia | 핵추진 공격잠수함 · Pier 4 계류 |

---

## 🛠 기술 스택

| 구분 | 내용 |
|------|------|
| Language | Vanilla JavaScript (ES5) |
| Rendering | 순수 DOM API, CSS clip-path, backdrop-filter |
| 위성 이미지 | ESRI ArcGIS World Imagery MapServer |
| 저장 | Browser localStorage |
| 빌드 도구 | 없음 — 단일 HTML 파일 |
| 외부 의존성 | Google Fonts (UI 폰트) |

---

## 👥 팀원

크래프톤 정글 SW-AI 12기
