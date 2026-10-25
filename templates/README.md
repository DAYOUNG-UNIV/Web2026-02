# 팀 프로젝트 템플릿 (10~15주차)

팀 저장소에 복사해서 쓰는 Markdown 템플릿 모음입니다.
모든 파일에는 중립 예시(메모 분류 앱, 팀원 1·2·3)가 들어 있습니다. 예시는 읽고 지운 뒤, 우리 팀 내용으로 채웁니다.

## 복사하는 법

교안 저장소를 내려받은 뒤(ZIP 또는 `git clone`), 터미널에서 팀 저장소 폴더로 들어가 다음을 실행합니다. `your-repo`는 팀 저장소 폴더 이름으로 바꿉니다.

```bash
# 10주차: 하네스 문서 + 에이전트 지도 + PR·Issue 양식
cp -r templates/docs your-repo/docs
cp templates/AGENTS.md your-repo/AGENTS.md
cp -r templates/.github your-repo/.github

# 14~15주차: 최종 README (기존 README.md를 덮어쓰므로 내용을 옮긴 뒤 실행)
cp templates/README-project.md your-repo/README.md
```

탐색기(Finder)에서 폴더를 끌어다 복사해도 같습니다. `.github` 폴더는 숨김 폴더이니 빠뜨리지 않았는지 확인합니다.
CLAUDE.md가 필요하면 `cp AGENTS.md CLAUDE.md`로 복사합니다. 내용은 같습니다.

## 파일과 쓰는 주차

| 파일 | 쓰는 주차 | 한 줄 설명 | 팀 시트에서 가져올 칸 |
|---|---|---|---|
| `docs/requirements.md` | 10 | 무엇을 만들까 | ② 질문, ⑤ 팀 아이디어·기여 표, ⑥ 사용 장면, ⑧ 알파 범위 |
| `docs/tasks.md` | 10부터 매주 | 지금 무엇을 할까 | ⑨ 누가 무엇을 |
| `docs/checklist.md` | 10 (12에 테스트로) | 제대로 되었나 | ⑥ 단계, ⑧ 확인할 것 |
| `docs/design.md` | 10 | 팀 디자인 기준(토큰) | 팀원들의 5주차 DESIGN.md |
| `docs/architecture.md` | 10 | 화면·데이터·폴더·기술 | ⑦ 화면과 기술 |
| `AGENTS.md` | 10 | AI 코딩 에이전트용 프로젝트 지도 | 위 문서들의 요약 |
| `.github/pull_request_template.md` | 10 (첫 PR부터) | PR 본문 양식 | — |
| `.github/ISSUE_TEMPLATE/bug.md`, `feature.md` | 10 (12 교차 검토) | Issue 양식 | — |
| `AI-USE-NOTE.md` | 매주 | AI USE NOTE 양식과 예시 | — |
| `docs/alpha-test.md` | 11 카드 → 12 기록 → 13 정리 | 알파 테스트 카드·기록·우선순위 | 알파 테스트 칸 |
| `docs/beta-scope.md` | 13 | 베타 시연 범위·대비책·배포 점검 | — |
| `docs/demo-feedback.md` | 14 | 시연회 TAG·투표·고칠 것·동결 | — |
| `docs/presentation.md` | 14 | 최종 발표 구성 1쪽 | — |
| `README-project.md` | 14 초안 → 15 완성 | 아카이빙용 최종 README | — |
| `docs/postmortem.md` | 15 | 비난 없는 포스트모템 | — |
| `docs/portfolio.md` | 15 (개인) | 기여·AI 협업 포트폴리오 | — |

제출 기한은 주차로만 적습니다. 정확한 기한은 eTL 과제 페이지가 기준입니다.

## 하네스란

사람에게 기획서와 작업 목록이 필요하듯, AI에게도 무엇을 만들고 있는지, 지금 무엇을 해야 하는지, 언제 끝났다고 볼 수 있는지를 알려 줘야 합니다. 처음에는 세 문서면 충분합니다. `requirements.md`(무엇을 만들까), `tasks.md`(지금 무엇을 할까), `checklist.md`(제대로 되었나)입니다. 팀이 화면을 그리기 시작하면 `design.md`(디자인 기준)와 `architecture.md`(화면·데이터·폴더)를 더합니다. 마지막으로 `AGENTS.md`(또는 `CLAUDE.md`)가 이 문서들을 가리키는 지도가 됩니다. 에이전트는 이 지도를 먼저 읽고 일을 시작합니다. 프로젝트가 커지면 권한·자동 테스트·훅·CI를 조금씩 더할 수 있습니다. 12주차 특강에서 그 확장을 봅니다.

## 채우는 규칙

- 새 글을 쓰지 않습니다. 9주차 팀 시트에 이미 적은 내용을 해당 칸에 옮겨 적습니다. 시트에 없는 칸만 새로 채웁니다.
- 예시 블록(`<details>`)은 읽은 뒤 지워도 되고 남겨 두어도 됩니다. 빈 칸은 반드시 채웁니다.
- 공개 저장소입니다. 학생 실명 대신 팀원 번호나 GitHub 아이디를 쓰고, 테스터는 '테스터 1'처럼 적습니다. 키·비밀·내부 링크(채팅방·폼)는 넣지 않습니다.
- 문서는 한 번 쓰고 끝이 아닙니다. 매주 스튜디오 끝에 `tasks.md`를 갱신하고, 범위가 바뀌면 `requirements.md`를 고칩니다.
- AI에게 초안을 맡겨도 됩니다. 다만 우리 질문에서 벗어난 내용이 섞이지 않았는지 사람이 읽고 판단합니다.

처음부터 모든 칸을 완벽하게 채울 필요는 없습니다. 이번 주에 아는 만큼만 적고, 다음 주에 고칩니다.
