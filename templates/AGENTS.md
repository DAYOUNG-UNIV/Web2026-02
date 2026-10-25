# AGENTS.md — 메모 분류 (팀 프로젝트)

AI 코딩 에이전트가 이 저장소에서 일하기 전에 읽는 지도입니다. CLAUDE.md로 복사해도 같은 내용입니다.
아래 예시(메모 분류)는 우리 팀 프로젝트에 맞게 바꿉니다.

## 프로젝트 한 줄
붙여 넣은 수업 메모를 주제별 카드로 나누고, 친구가 나눈 결과와 나란히 보여 주는 웹앱입니다.

## 먼저 읽을 문서
- docs/requirements.md — 무엇을 만들까 (사용 장면, 알파 범위)
- docs/tasks.md — 지금 무엇을 할까 (이번 주 할 일, 한 줄 = 한 PR)
- docs/checklist.md — 제대로 되었나 (끝내기 전 확인)
- docs/design.md, docs/architecture.md — 디자인 토큰, 화면·데이터·폴더

## 실행 방법
```bash
npx serve .          # http://localhost:3000 에서 index.html 열기
npx vitest run       # 테스트 (12주차 이후, test/ 폴더)
```
빌드 단계가 없습니다. `file://`로 열지 않습니다(fetch가 막힙니다).

## 폴더 구조
```
index.html  style.css  script.js  src/  data/  test/  docs/
```
자세한 구조와 데이터 모양은 docs/architecture.md를 봅니다.

## 코딩 규칙
- HTML은 시맨틱 요소를 씁니다. 버튼은 `button`, 입력에는 `label`, 구역은 `main`·`section`.
- 사용자 입력을 `innerHTML`에 넣지 않습니다. `textContent`를 씁니다.
- 새 라이브러리·패키지를 추가하기 전에 물어봅니다. 이유와 대안을 먼저 말합니다.
- 색·간격은 docs/design.md의 CSS 변수를 씁니다. 새 값을 만들지 않습니다.
- 요청한 파일만 고칩니다. 다른 파일을 고쳐야 하면 먼저 말합니다.
- 함수는 작게, 순수 함수(입력 → 출력)는 `src/`에 두어 테스트할 수 있게 합니다.

## 하지 말 것 (사람이 확인한 뒤에만)
- 파일·폴더 삭제, 패키지 설치, 배포, `.env`·키 커밋
- 기존 기능 삭제, 폴더 구조 변경, `git push --force`

## 확인 방법
끝났다고 말하기 전에 docs/checklist.md의 해당 줄을 확인합니다.
확인하지 못한 줄은 "확인 못 함"이라고 말합니다. 브라우저에서 직접 눌러 본 것만 "확인했다"고 합니다.

## 작업 흐름
Issue → 브랜치 `feature/이름-기능` → PR(.github/pull_request_template.md) → 리뷰 1명 → main
커밋 메시지는 한 줄 요약 + 필요하면 이유. main에 직접 커밋하지 않습니다.

## 끝낼 때 보고
1. 바꾼 파일 2. 바꾼 이유 3. 확인한 것 4. 확인하지 못한 것·남은 문제
