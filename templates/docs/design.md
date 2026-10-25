# design.md — 팀 디자인 기준

이 문서는 10주차에 씁니다. 팀원들이 5주차에 각자 쓴 DESIGN.md를 하나로 고릅니다.
5주차 형식 그대로, 값과 사용 이유를 나누어 적습니다. 값만 있으면 AI도 사람도 어디에 써야 할지 모릅니다.
값은 CSS 변수(`:root`)로 옮기고, 모든 화면이 같은 변수를 씁니다.

## 방향 한 줄

이 프로젝트가 화면에서 지키고 싶은 것 한 문장.

<details>
<summary>예시 · 메모 분류</summary>

> 메모 글자가 주인공입니다. 테두리·색·장식은 카드를 구분할 만큼만 씁니다.

</details>

>

## 색

<details>
<summary>예시 · 메모 분류</summary>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--color-action` | `#0f766e` | 주요 동작 버튼('나누기')과 키보드 포커스. 흰 배경 대비 5.6:1 |
| `--color-bg` | `#ffffff` | 페이지 배경. 메모 글자를 가장 잘 읽히게 |
| `--color-text` | `#111827` | 본문 글자. 검정보다 조금 부드럽게 |
| `--color-muted` | `#6b7280` | 글자 수, 안내 문구처럼 덜 중요한 글자. 흰 배경 대비 4.8:1 |
| `--color-border` | `#e5e7eb` | 카드 테두리. 그림자 대신 선으로 구분 |
| `--color-friend` | `#eef2ff` | 친구 열 배경. 내 열과 한눈에 구분 |

</details>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--color-action` | | |
| `--color-bg` | | |
| `--color-text` | | |
| `--color-muted` | | |
| `--color-border` | | |

## 글꼴

<details>
<summary>예시 · 메모 분류</summary>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--font-body` | `Pretendard, system-ui, sans-serif` | 본문. 설치 없이도 보이도록 system-ui 대체 |
| `--text-body` | `16px / 1.6` | 본문 크기와 줄간격. 메모가 길어도 읽기 편하게 |
| `--text-title` | `1.5rem / 700` | 화면 제목. 한 화면에 하나만 |
| `--text-small` | `0.875rem` | 글자 수, 날짜. 본문보다 작지만 14px 아래로는 내리지 않음 |

</details>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--font-body` | | |
| `--text-body` | | |
| `--text-title` | | |
| `--text-small` | | |

## 간격

<details>
<summary>예시 · 메모 분류</summary>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--space-1` | `8px` | 카드 안 글자 사이 |
| `--space-2` | `16px` | 카드와 카드 사이, 페이지 좌우 여백(모바일) |
| `--space-3` | `24px` | 카드 안쪽 여백, 구역 사이 |
| `--width-read` | `720px` | 한 열의 최대 폭. 줄이 너무 길어지지 않게 |

</details>

| 이름 | 값 | 사용 이유 |
|---|---|---|
| `--space-1` | | |
| `--space-2` | | |
| `--space-3` | | |
| `--width-read` | | |

## 버튼

<details>
<summary>예시 · 메모 분류</summary>

| 항목 | 값 | 사용 이유 |
|---|---|---|
| 높이 | `44px` 이상 | 손가락으로 누르기 쉬운 최소 크기 |
| 모서리 | `8px` | 카드(12px)보다 작게, 구분되게 |
| 기본 | 배경 `--color-action`, 글자 흰색 | 한 화면에 주요 버튼은 하나 |
| 보조 | 배경 없음, 테두리 `--color-border` | '취소', '복사'처럼 덜 중요한 동작 |
| 포커스 | 바깥선 `2px solid --color-action`, 간격 `2px` | 키보드 사용자가 위치를 알 수 있게. `outline: none` 금지 |
| 비활성 | 투명도 `0.5`, 커서 `not-allowed` | 빈 입력일 때 '나누기' |

</details>

| 항목 | 값 | 사용 이유 |
|---|---|---|
| 높이 | | |
| 모서리 | | |
| 기본 | | |
| 보조 | | |
| 포커스 | | |
| 비활성 | | |

## 카드

<details>
<summary>예시 · 메모 분류</summary>

| 항목 | 값 | 사용 이유 |
|---|---|---|
| 안쪽 여백 | `--space-3` | 글자가 테두리에 붙지 않게 |
| 테두리 | `1px solid --color-border` | 그림자 대신. 인쇄·저사양에서도 같게 |
| 모서리 | `12px` | 부드럽게, 버튼보다 크게 |
| 제목 | `--text-body`, `600` | 주제 이름. 본문과 크기는 같고 굵기만 다르게 |
| 선택됨 | 테두리 `--color-action` | 옮길 카드를 고른 상태 |

</details>

| 항목 | 값 | 사용 이유 |
|---|---|---|
| 안쪽 여백 | | |
| 테두리 | | |
| 모서리 | | |
| 제목 | | |
| 선택됨 | | |

## 접근성 최소 기준

바꾸지 않는 기준입니다. 13주차 접근성 점검에서 이 표로 확인합니다.

| 기준 | 값 | 확인 방법 |
|---|---|---|
| 글자 대비 | 4.5:1 이상 (큰 글자 3:1) | DevTools 색상 선택기의 대비 표시, 또는 대비 검사 도구 |
| 포커스 | 항상 보임 | Tab 키로 돌면서 어디에 있는지 눈으로 확인 |
| 터치 목표 | 44×44px 이상 | 버튼·링크 크기를 DevTools로 확인 |
| 색만으로 구분하지 않기 | 색 + 글자 또는 아이콘 | 흑백으로 바꿔도 구분되는지 |
| 움직임 | `prefers-reduced-motion` 존중 | 설정 켜고 애니메이션이 꺼지는지 |

## CSS로 옮기기

```css
:root {
  --color-action: #0f766e;
  --color-bg: #ffffff;
  --color-text: #111827;
  --space-2: 16px;
  --space-3: 24px;
}

button.primary {
  min-height: 44px;
  background: var(--color-action);
}

button:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
```

## 하지 않을 것

<details>
<summary>예시 · 메모 분류</summary>

- 카드마다 다른 색 쓰지 않기. 주제 구분은 제목 글자로.
- 그림자 쓰지 않기. 테두리로 충분.
- 본문 글자를 14px 아래로 내리지 않기.

</details>

-
-
