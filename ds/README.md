# 웹프로그래밍개론 디자인 시스템 · Course Design System (`ds/`)

새로 만드는 모든 수업 페이지(확장판, 요약판, 발표, 선택 모듈, 허브)가 쓰는 스타일과 동작입니다. 빌드는 필요 없습니다. CSS 파일 하나와 JS 파일 하나를 연결하고, 아래 HTML 조각을 그대로 붙여 넣은 뒤 내용만 바꿉니다.

One stylesheet and one script for every new course page. There is no build step. It works from `file://` and from GitHub Pages. Copy the snippets below verbatim and change only the content. If something you need is not in this file, do not invent a new look: use the closest component, or plain prose.

| File | What it is |
|---|---|
| `ds/ds.css` | Tokens, light/dark themes, every page type and component, print rules. |
| `ds/ds.js` | Progressive enhancement. It finds components by class and turns them on automatically. Public API: `window.DS`, and `window.deck` on decks. |
| `ds/bridge.css` | Override layer for the **old** pages (week2–5, `*show`, `index`) that use `assets/css/course-design.css`. It is not for new pages. See §10. |
| `ds/tools/restyle.py` | Makes re-themed *copies* of old pages in `restyled/` for comparison. It never edits the originals. See §10. |
| `ds/samples/*.html` | Working references: `reading.html` (A), `summary.html` (B), `deck.html` (C), `module.html` (D). Open them next to this file. |

> 원칙: 샘플에 있는 마크업을 복사해서 씁니다. 새 클래스, 인라인 스타일, 새 색, 이모지, 그라디언트를 만들지 않습니다.
> Rule: copy markup from the samples. Do not add new classes, inline styles, colours, emoji or gradients.

---

## 목차 · Contents

1. 파일 연결 · Linking and the page head
2. 디자인 원칙 · Design rules
3. 문구 규칙 · Copy rules
4. 페이지 유형 · Page types: A reading · B summary · C deck · D module · E hub
5. 컴포넌트 · Components (snippets, attributes, do/don't)
6. JS API · storage keys
7. 접근성 · Accessibility
8. 인쇄 · Print
9. 토큰 · Tokens
10. 옛 페이지 · `bridge.css` and `tools/restyle.py`
11. 검수 · QA checklist
12. 알려진 한계 · Known limitations

---

## 1. 파일 연결 · Linking and the page head

### 1.1 경로 · Paths

Paths are relative, with no leading `/`, so that `file://` and GitHub Pages (which serves from a sub-path) both work.

| Page location (example) | CSS | JS | Course home |
|---|---|---|---|
| repo root (`week11.html`) | `ds/ds.css` | `ds/ds.js` | `index.html` |
| one folder down (`week11/reading.html`) | `../ds/ds.css` | `../ds/ds.js` | `../index.html` |
| `ds/samples/*.html` | `../ds.css` | `../ds.js` | `../../index.html` |

### 1.2 `<head>` (exact, for a page one folder down)

```html
<!doctype html>
<html lang="ko" data-page="reading">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>11주차 확장판 · 데이터를 가져오는 웹 | 웹프로그래밍개론</title>
<meta name="description" content="한 문장 요약.">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="../ds/ds.css">
<script>document.documentElement.classList.add('js');try{var t=JSON.parse(localStorage.getItem('ds-theme'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<script defer src="../ds/ds.js" onerror="document.documentElement.classList.remove('js')"></script>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
```

- `data-page` must be one of `reading`, `summary`, `deck`, `module` or `hub`. It decides the TOC, progress bar, deck engine and page width.
- The inline script does two jobs. It adds `html.js`, so that no-JS fallbacks hide, and it applies the saved theme before first paint, so the page does not flash. Keep it exactly as written. It is wrapped in `try/catch`, so blocked storage does not break it.
- The `onerror` on the `ds.js` tag removes `.js` if the script fails to load. Labs, quizzes, sims and decks then fall back to readable static content.
- Pretendard is the only external stylesheet. If it is blocked, the font stack falls back to the system Korean font (Apple SD Gothic Neo, Noto Sans KR or Malgun Gothic). Do not add other fonts or icon fonts.
- `<title>`: `N주차 <판> · <주제> | 웹프로그래밍개론`. For a deck use `N주차 발표 · <주제> | 웹프로그래밍개론`; for a module use `선택 모듈 · <주제> | 웹프로그래밍개론`.

### 1.3 상단 바 · Top bar (all page types except deck)

```html
<header class="topbar">
  <a class="topbar-home" href="../index.html">웹프로그래밍개론</a>
  <span class="topbar-page">11주차 · 데이터를 가져오는 웹</span>
  <nav class="topbar-nav" aria-label="11주차 자료">
    <a href="reading.html" aria-current="page">확장판</a>
    <a href="summary.html">요약판</a>
    <a href="deck.html">발표</a>
  </nav>
  <div class="topbar-tools"></div>
</header>
```

- Leave `.topbar-tools` empty. JS fills it with, in order: the part selector (reading pages with 2 or more parts), the TOC button, the global 심화 toggle (only if the page has `.deep`), and the theme toggle.
- Put `aria-current="page"` on the link for the current page. On phones (< 48rem) the nav moves into the TOC drawer as `.toc-links` on reading and module pages; on summary and hub pages it stays in the bar and the page name is dropped instead. Keep the nav to at most 4 short links.
- If the page has no `.topbar`, JS adds a floating theme button instead. Every non-deck page should have a topbar.

### 1.4 외부 요청 · External requests

The only requests a page makes are the Pretendard CSS and, inside lab iframes, the pinned CDN libraries named in `data-libs` (§5.25). No analytics, embeds, web fonts, images or scripts may come from elsewhere. Put images in the repo and give them a relative path.

---

## 2. 디자인 원칙 · Design rules

The look is university press × MDN: warm paper, near-black ink, one teal accent, hairlines, numbered hierarchy. The instructor asked for something "더 깔끔하고 AI스럽지 않은 형태", meaning clean and not AI-generic.

**Do**
- Use structure to organise the page: numbered parts and sections (`03.2`), hairline rules and left rules on callouts.
- Keep body text at the measure (≤ 68ch). `.doc` already sets this, so do not widen paragraphs.
- Use one accent (`--accent`) for links, the current state and "today". The colours `--solo`, `--team` and `--show` mark activity type only (agenda and tags).
- Prefer a table, `dl.defs`, `ol.flow` or a code block over a decorative box.
- Write real course content. Every example in a sample is a realistic week-11 example; do the same for your week.

**Don't**
- No gradients, glows, shadows (popovers excepted), glassmorphism, emoji, icon fonts or decorative SVG blobs.
- No hero banners, centred layouts, big rounded cards or "card soup" (grids of identical boxes). No pill badges except the square `.ai-grade` and `.tag`.
- No radius above 6px. Do not set `style="…"` attributes, and do not add `<style>` blocks to pages. If something is missing, ask the DS owner rather than patching locally.
- No new colours. Use only the tokens in §9.
- No brand logos or trademarks of AI tools, GitHub and so on. Text names are fine ("ChatGPT Edu", "Claude Code").

**Headings and numbering**

| Page | h1 | Part | Section | Sub-heading | Numbering shown |
|---|---|---|---|---|---|
| reading | `.doc-head h1` | `.part-head h2` | `.sec > h3` | `h4` | `PART 03`, `03.2` (CSS counters) |
| module | `.doc-head h1` | (none) | `.sec > h2` | `h3` | `01`, `02` … |
| summary, hub | `.doc-head h1` | (none) | `.sec.unnumbered > h2` | `h3` | none; `.concept` gets `01` … |

Never type numbers into headings. CSS adds them. To exclude a section from numbering, add `.unnumbered`.

---

## 3. 문구 규칙 · Copy rules

The copy is Korean, in the polite-formal 합니다체, with short sentences that speak to the student directly. In examples, use "학생"/"팀" and project names; never use real people's names.

| Item | Write exactly like this |
|---|---|
| Date | `11/17(화)`; in prose `11월 17일(화)` |
| Time range | `10:00–12:50` (en dash) |
| **Deadline** | `11/17(화) 오전 9:59 · eTL`, with `<time datetime="2026-11-17T09:59:00+09:00">`. Deadlines are the class-day morning at 9:59, not midnight. Say so once on the page. |
| Submission place | `eTL › 과제 › 11주차 팀 과제` |
| Contact | `eTL 메시지`. Never an e-mail address, phone number, messenger link or personal name. |
| Default AI tool | **ChatGPT Edu** is the default. **Claude Code** is the coding agent used alongside it. Name the tool on every prompt card (`.prompt-tool`). |
| AI note | `AI USE NOTE` (Latin capitals, as on the course home page) |
| Week label | `11주차`; for parts and sections let CSS number them |

**AI 등급 · AI grade** (the vocabulary from the course home page). Use the English label as the badge text and `data-grade` for the colour. **The default is ALLOWED.**

| Badge text | `data-grade` | Meaning (Korean, for prose) |
|---|---|---|
| `AI REQUIRED` | `required` | AI 활용 필수 |
| `AI ALLOWED` | `allowed` | 자유롭게 활용 (default) |
| `AI LIMITED` | `limited` | 일부만 활용 (say which part) |
| `NO AI` | `none` | AI 없이 수행 |

**Never**
- No internal URLs, drive links, unpublished file names, student data or anything marked confidential.
- Do not promise dates, rooms or tools you are unsure of. In decks, put such items in the speaker notes as `<li class="check">확인 필요: …</li>` (§4C). In other pages, leave them out.
- Simulations always carry the fixed label `연습용 화면 · 실제 서비스가 아닙니다`; the JS adds it. No logos, no real product chrome, no sign-in or credential forms, and no payment forms.

---

## 4. 페이지 유형 · Page types

### A. 확장판 · Reading (`data-page="reading"`)

This is the long, complete teaching text. It has a sticky TOC on wide screens and a drawer on phones, a reading progress bar, a part selector in the top bar, prev/next navigation between parts, and a global toggle for 심화 boxes. It stays fast with more than 100 sections: above 30 sections the parts get `content-visibility`, and with 40 or more code blocks highlighting becomes lazy.

```html
<!-- head + skip link as in §1.2, data-page="reading" -->
<header class="topbar"> … §1.3 … </header>

<div class="layout">
<main class="doc" id="main">

  <header class="doc-head">
    <span class="kicker">11주차 · 11월 10일(화) · 확장판</span>
    <h1>데이터를 가져오는 웹: fetch, JSON, 비동기, 저장</h1>
    <p class="lead">이번 주에 무엇을 하고 어디까지 가는지 두세 문장.</p>
    <ul class="doc-meta">
      <li><b>읽는 시간</b> 약 50분</li>
      <li><b>선수 내용</b> 5주차 DOM·이벤트</li>
      <li><b>AI 등급</b> AI ALLOWED</li>
      <li><b>요약판</b> <a href="summary.html">2쪽으로 보기</a></li>
    </ul>
  </header>

  <section class="part" id="request">
    <header class="part-head">
      <h2>웹은 요청과 응답</h2>
      <p class="lead">이 파트에서 배울 것 한두 문장.</p>
    </header>

    <section class="sec" id="url">
      <h3>URL 읽기</h3>
      <p class="sec-goal">이 절을 읽고 나면 URL을 다섯 부분으로 나누어 읽을 수 있습니다.</p>  <!-- optional -->
      <p>본문…</p>
    </section>

    <section class="sec" id="methods">
      <h3>HTTP 메서드</h3>
      …
    </section>
  </section>

  <!-- more .part … -->

  <nav class="doc-foot" aria-label="주차 이동">
    <a class="prev" href="../week10/reading.html"><span>← 이전</span>10주차 · 저장소와 하네스</a>
    <a class="next" href="summary.html"><span>요약판 →</span>11주차를 2쪽으로 다시 보기</a>
  </nav>
</main>
</div>
</body>
</html>
```

Rules
- Give every `.part` and `.sec` an explicit, stable, lowercase `id` (`request`, `res-ok`). Other pages deep-link to these ids (`reading.html#res-ok`), and the JS only invents ids as a fallback.
- `.layout` is required on reading and module pages. It places the TOC column. Leave the TOC to JS; do not write a `<nav class="toc">`.
- A part holds sections only (`.part > .part-head + .sec…`). The TOC lists `.part` → `.sec`; headings inside a section (`h4`) do not appear.
- Part order for a week: 오늘의 지도 (agenda, stack map, goals with checklist) → 2–4 concept parts → AI와 함께 → 팀 스튜디오와 과제 (assignment, quiz).
- `.part-nav` (prev/next part) is added automatically to the bottom of each part. `.doc-foot` is the page-level prev/next you write yourself.

### B. 요약판 · Summary (`data-page="summary"`)

This is a 2–4 page A4 recap: a one-line summary, the goals, 오늘의 지도, one concept block per idea, a quiz, and links of the form "확장판에서 더 보기 →". It has no TOC and no `.layout`.

```html
<!-- head with data-page="summary" -->
<header class="topbar"> … </header>

<main class="doc" id="main">
  <header class="doc-head">
    <span class="kicker">11주차 · 11월 10일(화) · 요약판</span>
    <h1>데이터를 가져오는 웹</h1>
    <p class="lead">한 줄(길어야 두 줄) 요약.</p>
    <ul class="doc-meta">
      <li><b>읽는 시간</b> 약 10분</li>
      <li><b>자세한 설명과 실습</b> <a href="reading.html">확장판</a></li>
    </ul>
  </header>

  <section class="sec unnumbered" id="goals">
    <h2>학습 목표</h2>
    <ol class="goals"> <li>…</li> </ol>
  </section>

  <section class="sec unnumbered" id="map">
    <h2>오늘의 지도</h2>
    <figure class="stack-map" data-active="network server" data-flow data-note-network="요청·응답" data-note-server="JSON API">
      <figcaption>웹서비스 구조 지도. 오늘은 브라우저와 서버 사이를 봅니다.</figcaption>
    </figure>
    <ol class="flow"> … </ol>
  </section>

  <section class="sec unnumbered" id="concepts">
    <h2>핵심 개념</h2>
    <div class="concept" id="c-fetch">
      <h3>fetch와 async/await</h3>
      <p class="concept-def"><code>fetch</code>는 결과 대신 <dfn>Promise</dfn>를 돌려줍니다. …</p>
      <pre class="code" data-lang="js"><code>…6줄 이내…</code></pre>
      <p class="callout mistake">fetch는 404·500에도 실패하지 않습니다. …</p>
      <a class="more" href="reading.html#res-ok">확장판에서 더 보기</a>
    </div>
    <!-- 5–8 concepts -->
  </section>

  <section class="sec unnumbered" id="check">
    <h2>확인 문제</h2>
    <form class="quiz" aria-label="11주차 확인 문제"> … </form>
  </section>

  <section class="sec unnumbered" id="homework">
    <h2>과제</h2>
    <article class="assignment"> … </article>
  </section>

  <nav class="doc-foot" aria-label="자료 이동"> … </nav>
</main>
```

Rules
- Length is 2–4 A4 pages when printed. Use 5–8 `.concept` blocks. Each has one definition sentence, at most one code block of 8 lines or fewer or one small table, at most one `.callout.mistake`, and one `a.more`.
- `a.more` text is always `확장판에서 더 보기`; CSS adds the arrow. Its `href` must point at an existing `id` in the reading page.
- No labs, sims or deep boxes here. Those live in the reading page.

### C. 발표 · Deck (`data-page="deck"`)

These are lecture slides at 1280×720, shown one at a time.
- Keyboard:
  - `→` `PageDown` `Space` go forward; `←` `PageUp` `Shift+Space` go back; `Home` and `End` jump to the ends.
  - `T` opens the slide TOC, `N` the speaker notes and `F` full screen; `Esc` closes panels.
- Timer: presets of 3, 5, 10 and 15 minutes.
- Navigation aids: a progress bar, phase steps from `data-phase`, and `#s=N` deep links (1-based).
- Swipe works on touch screens.
- Print gives one slide per landscape page.

```html
<!-- head with data-page="deck"; skip link text: 슬라이드로 건너뛰기 -->
<main class="deck" id="main" data-title="11주차 · 데이터를 가져오는 웹">

  <section class="slide cover" data-phase="도입" data-title="표지">
    <span class="kicker">웹프로그래밍개론 · 11주차</span>
    <h1>데이터를 가져오는 웹</h1>
    <p class="sub">fetch · JSON · 비동기 · 저장</p>
    <div class="cover-meta"><span>11월 10일(화) 10:00–12:50</span><span>확장판·요약판은 eTL 공지 링크</span></div>
    <div class="notes"><ul><li class="check">확인 필요: 강의실 Wi-Fi에서 연습 페이지가 열리는지.</li></ul></div>
  </section>

  <section class="slide section" data-phase="강의 1" data-title="웹은 요청과 응답">
    <span class="sec-no">01</span>
    <h2>웹은 요청과 응답</h2>
    <p class="lead">URL · 메서드 · 상태 코드 · JSON</p>
  </section>

  <section class="slide" data-phase="강의 1" data-title="상태 코드">
    <span class="kicker">강의 1</span>
    <h2>상태 코드는 첫 자리부터 읽습니다</h2>
    <div class="three body">
      <div><p class="big">2xx</p><p><b>성공</b> · 받은 데이터를 그립니다.</p></div>
      <div><p class="big">4xx</p><p><b>요청한 쪽 문제</b> · 무엇을 고칠지 알려 줍니다.</p></div>
      <div><p class="big">5xx</p><p><b>서버 문제</b> · 다시 시도할 길을 둡니다.</p></div>
    </div>
    <p class="slide-foot">한 줄 정리.</p>
    <div class="notes"><p>진행 메모.</p></div>
  </section>

</main>
</body>
```

Slide anatomy: `.kicker`, then `h2`, then **one** main block marked `.body`, then an optional `.slide-foot`, then `.notes`.

| Class | Use |
|---|---|
| `.slide.cover` | Title slide (the phase steps are hidden). Use `h1`, `.sub` and `.cover-meta > span…`. |
| `.slide.section` | Part divider: `.sec-no` (two digits, typed), `h2`, `.lead`. |
| `.slide.dense` | Smaller type for a slide that must hold an assignment card or a table. |
| `.body` | Put this on the main block (`ol.pts`, `div.two`, `.flow`, `.pair`, `figure.prompt`, `.agenda`, `.stack-map.horizontal`). It gives the standard top gap. |
| `ol.pts > li > b + span` | Numbered key points. Use 3–5 of them. |
| `div.two`, `div.three` | Two or three columns. Each child is a `div`, a `pre` or an `ol`. |
| `p.big` | One large statement or number. |
| `.slide-foot` | One line at the bottom, or the timer buttons. |
| `button.timer-btn[data-timer="300"]` | Opens the timer preset to that many seconds. |
| `.notes` | Speaker notes, hidden on the slide and shown with `N`. `li.check` marks a line as "확인 필요:" to verify before class. |
| `data-phase` | The phase name. Consecutive slides share one. Phases become the step bar (`도입`, `강의 1`, `실습`, `강의 2`, `AI와 함께`, `팀 스튜디오`, `마무리`). |
| `data-title` | A short name for the HUD and the `T` list. |

Rules
- **Each slide must fit 1280×720 without scrolling.** Budget: a kicker, an h2 of at most two lines, and one body block (at most 5 points, a code block of 12 lines or fewer, or a lab with `data-height` of 200 or less), plus one foot line. If it does not fit, split the slide.
- Every slide except section dividers has `.notes`. Anything unconfirmed (rooms, times, tool availability, guests) goes into notes as `li.check`, never onto the slide.
- Nothing else may sit outside `main.deck`. The steps, HUD, TOC, notes panel, timer and bar are generated.
- Labs on slides work, but use small ones (`data-height="190"`, 2–3 tabs). See §12 for the autorun limitation.

### D. 선택 모듈 · Module (`data-page="module"`)

A module is a shorter, self-contained elective topic (React, a backend, deployment and so on). It opens with **"이 모듈이 맞는 프로젝트"** and a progress checklist. Its sections are flat and numbered `01`, `02` and so on. It has a TOC like a reading page.

```html
<!-- head with data-page="module" -->
<header class="topbar"> … </header>
<div class="layout">
<main class="doc" id="main">
  <header class="doc-head">
    <span class="kicker">선택 모듈 · 프레임워크</span>
    <h1>React로 데이터 목록 그리기</h1>
    <p class="lead">무엇이 편해지고 무엇이 늘어나는지, 범위는 어디까지인지.</p>
    <ul class="doc-meta">
      <li><b>예상 시간</b> 90분</li>
      <li><b>먼저 볼 것</b> <a href="../week11/reading.html#async">11주차 비동기와 fetch</a></li>
      <li><b>AI 등급</b> AI ALLOWED</li>
    </ul>
  </header>

  <section class="fit" aria-labelledby="fit-title">
    <h2 id="fit-title">이 모듈이 맞는 프로젝트</h2>
    <dl>
      <div><dt>잘 맞는 경우</dt><dd><ul><li>…</li><li>…</li></ul></dd></div>
      <div><dt>과한 경우</dt><dd><ul><li>…</li></ul></dd></div>
      <div><dt>먼저 할 것</dt><dd>…</dd></div>
    </dl>
  </section>

  <p>진행 상황을 표시하며 따라가세요. 표시는 이 브라우저에만 저장됩니다.</p>
  <ul class="checklist" data-checklist="mod-react-progress">
    <li><label><input type="checkbox"> 01 컴포넌트가 무엇을 대신하는지 설명할 수 있다</label></li>
    …one line per section…
  </ul>

  <section class="sec" id="why"><h2>컴포넌트는 무엇을 대신하나</h2> … </section>
  <section class="sec" id="start"><h2>Vite로 시작하기</h2> … </section>
  …
  <section class="sec" id="related"><h2>이어지는 주차</h2> <ol class="weeks"> … </ol> </section>

  <nav class="doc-foot" aria-label="자료 이동"> … </nav>
</main>
</div>
```

Rules
- Use 5–8 sections. The checklist has one item per section, and each item starts with the section number typed as text (`01 …`).
- `.fit` must contain all three of `잘 맞는 경우`, `과한 경우` and `먼저 할 것`, in that order.
- Include a "when not to use this" section (`언제 … 가 과한가`), usually as a table.

### E. 허브 · Hub (`data-page="hub"`)

The hub is the course index: the week list, electives and the AI lab. It has no TOC and no `.layout`.

```html
<!-- head with data-page="hub"; at repo root use ds/ds.css and ds/ds.js -->
<header class="topbar">
  <a class="topbar-home" href="index.html">웹프로그래밍개론</a>
  <span class="topbar-page">2026년 2학기</span>
  <nav class="topbar-nav" aria-label="바로 가기">
    <a href="#weeks">주차별 자료</a>
    <a href="#modules">선택 모듈</a>
    <a href="#ai-lab">AI 실습</a>
  </nav>
  <div class="topbar-tools"></div>
</header>
<main class="doc" id="main">
  <header class="doc-head">
    <span class="kicker">2026년 2학기 · 매주 화요일 10:00–12:50</span>
    <h1>웹프로그래밍개론</h1>
    <p class="lead">한두 문장 소개. 자료는 확장판(자세한 설명과 실습), 요약판(2~4쪽), 발표(수업 슬라이드)로 나뉩니다.</p>
    <ul class="doc-meta"><li><b>질문</b> eTL 메시지</li><li><b>과제 마감</b> 수업 날 오전 9:59 · eTL</li></ul>
  </header>

  <section class="sec unnumbered" id="weeks">
    <h2>주차별 자료</h2>
    <ol class="weeks">
      <li class="week is-past">
        <span class="week-no">10</span>
        <div class="week-main"><p class="week-date">11/3(화)</p><p class="week-title"><a href="week10/reading.html">저장소·하네스·AI 에이전트</a></p><p class="week-desc">터미널과 npm, 팀 저장소 규칙</p></div>
        <ul class="week-links"><li><a href="week10/reading.html">확장판</a></li><li><a href="week10/summary.html">요약판</a></li><li><a href="week10/deck.html">발표</a></li></ul>
      </li>
      <li class="week is-now"> … same structure … </li>
      <li class="week">
        <span class="week-no">12</span>
        <div class="week-main"><p class="week-date">11/17(화)</p><p class="week-title">AI 코드 검토와 하네스</p><p class="week-desc">특별 세션 주간</p></div>
        <ul class="week-links"><li><span class="na">공개 전</span></li></ul>
      </li>
    </ol>
  </section>

  <section class="sec unnumbered" id="modules">
    <h2>선택 모듈</h2>
    <dl class="defs">
      <div><dt><a href="modules/react.html">React</a></dt><dd>컴포넌트, useEffect로 fetch, 언제 React가 과한가</dd></div>
    </dl>
  </section>

  <section class="sec unnumbered" id="ai-lab">
    <h2>AI 실습</h2>
    <dl class="defs">
      <div><dt><a href="ai/chatgpt-edu.html">ChatGPT Edu 따라 하기</a></dt><dd>새 채팅, 파일 첨부, 프로젝트 <span class="tag accent">기본 도구</span></dd></div>
      <div><dt><a href="ai/claude-code.html">Claude Code 따라 하기</a></dt><dd>권한 요청, diff 확인 <span class="tag">함께 쓰는 도구</span></dd></div>
    </dl>
  </section>
</main>
```

| Class | Meaning |
|---|---|
| `li.week.is-now` | This week: an accent rule plus "· 이번 주" after the date. Exactly one at a time. |
| `li.week.is-past` | A past week (muted number). |
| `.week-no` | Typed two-digit or plain number (`09`, `10`). |
| `span.na` | A material that is not yet available (`공개 전`, `준비 중`). Never use a dead link. |

---

## 5. 컴포넌트 · Components

JS initialises everything automatically on `DOMContentLoaded`. For content you insert later, call `DS.init(container)`. Every component reads acceptably without JS.

### 5.1 코드 블록 · Code block

```html
<pre class="code" data-lang="js" data-file="src/app.js"><code>async function load() {
  const res = await fetch('/api/works');
}</code></pre>
```

| Attribute | Values | Effect |
|---|---|---|
| `data-lang` | `js` `jsx` `ts` `html` `css` `json` `bash` `sh` `shell` `console` `powershell` `text` `md` | Selects the highlighter and the label. Other values show as plain text with the value as the label. |
| `data-file` | any text | Shown as the header (a file name, or a label such as `고치기 전`). |
| `data-plain` | (flag) | Header and copy button, but no highlighting. |
| class `bad` / `good` | | A red or green top rule, for before/after pairs. |

- A copy button is added. For shell languages the copy drops a leading `$ ` from each line, so write prompts as `$ npm install`.
- **Escape** `<`, `>` and `&` inside `<code>` (`&lt;`, `&gt;`, `&amp;`). Write `=&gt;` for arrows.
- Start the code on the same line as `<code>` and end it right before `</code>`, with no leading blank line.
- Put a `pre` that is a raw example and must stay untouched inside `.no-enhance`.
- Do not hand-write `<span>` colouring, line numbers or a copy button.

**Bad/good pair**

```html
<div class="pair">
<pre class="code bad" data-lang="js" data-file="고치기 전"><code>…</code></pre>
<pre class="code good" data-lang="js" data-file="고친 뒤"><code>…</code></pre>
</div>
```

The two blocks sit side by side when there is room and stacked otherwise. Always label them with `data-file`.

### 5.2 변경 내용 · Static diff

```html
<figure class="fig">
  <div class="diff" data-file="src/app.js">
<pre><code>@@ loadWorks @@
 async function loadWorks() {
+  status.textContent = '불러오는 중…';
-  return render(await res.json());
 }</code></pre>
  </div>
  <figcaption>에이전트가 만든 변경. 바뀐 줄이 모두 요청한 함수 안에 있습니다.</figcaption>
</figure>
```

Each line starts with `+` (added), `-` (removed), a space (context) or `@@` (hunk header). The marker column is drawn by CSS. The `figure.fig` wrapper is optional; it adds the "그림 N" caption.

### 5.3 파일 트리 · File tree

```html
<ul class="filetree" aria-label="프로젝트 구조">
  <li class="dir"><span>team-app</span>
    <ul>
      <li><span>index.html</span></li>
      <li class="dir"><span>src</span>
        <ul><li class="is-hot"><span>app.js</span><span class="ft-note">/api/weather 만 부릅니다</span></li></ul>
      </li>
      <li class="is-new"><span>.env</span><span class="ft-note">저장소에 올리지 않습니다</span></li>
    </ul>
  </li>
</ul>
```

`li.dir` marks a folder. `.is-hot` marks the file being discussed (accent), `.is-new` a new file, and `.ft-note` a short note after the name. Keep it to 15 lines or fewer.

### 5.4 표 · Table

```html
<div class="table-wrap">
  <table class="table">
    <caption>팀 프로젝트에서 자주 만나는 상태 코드</caption>
    <thead><tr><th scope="col" class="num">코드</th><th scope="col">이름</th><th scope="col">화면에서 할 일</th></tr></thead>
    <tbody>
      <tr><td class="num"><code>200</code></td><td>OK</td><td>받은 데이터를 그립니다.</td></tr>
    </tbody>
  </table>
</div>
```

- Always use the `.table-wrap` wrapper, so the table scrolls inside itself at 390px rather than the page scrolling.
- The `caption` is required. CSS numbers it "표 N". Use `scope` on header cells, and `class="num"` for right-aligned tabular numbers.

### 5.5 그림 · Figure

```html
<figure class="fig">
  <div class="fig-frame"> <img src="../assets/…/network-tab.png" alt="Network 탭에서 GET /api/works 줄을 고른 화면" width="1200" height="700"> </div>
  <figcaption>Network 탭. 상태 코드 열에서 200을 확인합니다.</figcaption>
</figure>
```

CSS numbers the caption "그림 N". `.fig-frame` is optional; it adds a hairline box. Give images real `alt` text plus `width` and `height`.

### 5.6 본문 도구 · Prose helpers

```html
<dl class="defs">
  <div><dt><code>GET</code></dt><dd>자원을 읽습니다.</dd></div>
  <div><dt><code>POST</code></dt><dd>새 자원을 만듭니다.</dd></div>
</dl>

<p class="side-note">여백 메모. 넓은 화면에서는 오른쪽 여백에, 좁은 화면에서는 본문 안에 놓입니다.</p>

<div class="cols"> <div>…</div> <div>…</div> </div>   <!-- 2–3 equal columns that wrap -->

<p>용어: <dfn title="URL에서 ? 뒤에 이름=값 쌍을 &amp;로 이어 붙인 부분.">쿼리 문자열</dfn>,
   단축키: <kbd>Ctrl</kbd> <kbd>Enter</kbd>, 태그: <span class="tag team">팀</span></p>
```

- **`dfn[title]`** (or `.term[data-def]`) shows a popover on hover, focus or tap. Use it for the first appearance of a term only. A `dfn` without `title` is just the defining-instance style.
- **`.tag`** variants are `solo`, `team`, `show`, `ok`, `warn`, `err` and `accent`. Tags are small square labels; use them sparingly.
- **`kbd`**: one key per `<kbd>`, separated by spaces. Write macOS keys as symbols (`⌘`, `⌥`, `⌃`, `⇧`).
- **`.side-note`**: place it *before* the paragraph it annotates.
- **`.lead`**: one per doc-head, part-head or section-slide.

### 5.7 탭 · Tabs

```html
<div class="tabs" data-tabs="os" data-label="운영체제">
  <section class="tab" data-tab="macOS">…</section>
  <section class="tab" data-tab="Windows" data-default>…</section>
</div>
```

| Attribute | Effect |
|---|---|
| `data-tab` | The tab label (required). |
| `data-default` | The tab shown first (otherwise the first tab). |
| `data-tabs` | A group name. All tab sets with the same name on every page stay in sync and remember the choice (`ds-tab:<group>`). Use shared names: `os`, `async-style`, `pkg`. |
| `data-label` | The `aria-label` of the tab list. |

Keyboard: `←` and `→` move between tabs, as do `Home` and `End`. Without JS all panels show in sequence. Use tabs for alternatives (OS, syntax style), not for hiding required content.

### 5.8 흐름 · Steps / flow

```html
<ol class="flow">
  <li><b>Network 탭 열기</b><span>열어 둔 뒤에 새로고침해야 기록이 남습니다.</span></li>
  <li class="is-on"><b>요청 한 줄 누르기</b><span>Headers에서 메서드와 상태 코드를 봅니다.</span></li>
</ol>
<ol class="flow vertical"> … </ol>
```

A flow has 3–5 steps; each holds a `b` (2–6 words) and a `span` (one sentence). Steps are numbered automatically. `.is-on` highlights the current step. `.vertical` gives a top-to-bottom flow for longer explanations; horizontal flows wrap at 390px.

### 5.9 일정 · Timeline

```html
<ol class="timeline" aria-label="후반부 일정">
  <li class="is-done"><span class="tl-week">10주차</span><span class="tl-date">11/3</span><span class="tl-title">저장소·하네스·에이전트</span></li>
  <li class="is-now"><span class="tl-week">11주차</span><span class="tl-date">11/10</span><span class="tl-title">데이터를 가져오는 웹</span></li>
  <li><span class="tl-week">12주차</span><span class="tl-date">11/17</span><span class="tl-title">AI 코드 검토</span></li>
</ol>
```

States are `.is-done` and `.is-now` (only one). `.timeline.compact` shows only week numbers plus the title of the current week. Use it for 10 or more items.

### 5.10 웹서비스 구조 지도 · Stack map

**Automatic form** (four standard layers; preferred):

```html
<figure class="stack-map" data-active="network server" data-flow
        data-note-network="오늘: 요청·응답" data-note-server="오늘: JSON API">
  <figcaption>웹서비스 구조 지도. 강조된 두 층이 오늘의 범위입니다.</figcaption>
</figure>
```

**Explicit form** (custom text):

```html
<figure class="stack-map" data-active="client" data-flow>
  <ol>
    <li data-layer="user"><b>사용자</b><span>보고, 누르고, 입력합니다</span></li>
    <li data-layer="client"><b>HTML · CSS · JS</b><span>화면의 구조, 모양, 동작</span><em>오늘: DOM 이벤트</em></li>
    <li data-layer="network"><b>브라우저 · 네트워크</b><span>URL, 요청과 응답, HTTP</span></li>
    <li data-layer="server"><b>API · 서버 · 데이터</b><span>데이터를 저장하고 돌려줍니다</span></li>
  </ol>
  <figcaption>…</figcaption>
</figure>
```

| Attribute | Values | Effect |
|---|---|---|
| `data-active` | space-separated `user` `client` `network` `server` | Highlights this week's layers. |
| `data-flow` | (flag) | Draws the "요청 →" and "← 응답" rails beside the layers. |
| `data-note-<layer>` | text | An "오늘: …" note on that layer (automatic form only; in the explicit form use `<em>`). |
| class `horizontal` | | Four columns. Use it on deck slides. |

Use the stack map on every week's "오늘의 지도" and do not change the four layer names. It is the course's shared map.

### 5.11 진행표 · Agenda

```html
<ol class="agenda" aria-label="11주차 진행 순서">
  <li class="lecture"><span class="agenda-time">10:00</span><span class="agenda-what"><b>도입 · 오늘의 지도</b><span>보조 설명(선택)</span></span><span class="agenda-len">10분</span></li>
  <li class="solo"> …개인 실습… </li>
  <li class="break"><span class="agenda-time">10:55</span><span class="agenda-what"><b>휴식</b></span><span class="agenda-len">10분</span></li>
  <li class="team"> …팀… </li>
  <li class="show"> …발표/시연… </li>
</ol>
<p class="agenda-sum">강의 45분 · 개인 실습 35분 · 팀 55분 · 휴식 10분</p>
```

Each `li` takes an activity class: `lecture`, `solo`, `team`, `show` or `break`. The minutes must add up to the session (170 minutes for 10:00–12:50). Say once in the prose that the times may shift.

### 5.12 학습 목표 · Goals

```html
<ol class="goals">
  <li>요청과 응답을 URL, HTTP 메서드, 상태 코드, 헤더로 나누어 읽을 수 있다.</li>
</ol>
```

Use 3–5 goals, each a single sentence ending in an observable verb (`~할 수 있다`). Follow them with a `.checklist` for self-assessment on reading pages.

### 5.13 알림 상자 · Callouts

```html
<aside class="callout">          <p>참고(기본).</p></aside>
<aside class="callout tip">      <p>도움말.</p></aside>
<aside class="callout warn">     <p>주의.</p></aside>
<aside class="callout mistake">  <p class="callout-title">JSON은 JavaScript 객체가 아닙니다</p><p>…</p></aside>
<aside class="callout ai">       <p>AI와 함께.</p></aside>
<aside class="callout warn" data-label="보안">  <p>라벨을 바꾼 주의.</p></aside>
<p class="callout mistake">한 문장짜리는 p 하나로도 됩니다.</p>
```

| Class | Label shown | Use for |
|---|---|---|
| (none) or `note` | 참고 | Side information. |
| `tip` | 도움말 | A shortcut or a better way. |
| `warn` | 주의 | Security, privacy, data loss, deadlines. |
| `mistake` | 자주 하는 실수 | A concrete error students make, with its symptom. |
| `ai` | AI와 함께 | How to use or check AI for this topic. |

- `data-label` replaces the label text. `.callout-title` is an optional bold first line.
- Use at most one callout per section, and never two in a row. Callouts are a left rule plus a label, not boxes, so do not wrap them in anything.

### 5.14 심화 · Deep box

```html
<aside class="deep" id="deep-event-loop">
  <h4>이벤트 루프와 마이크로태스크: 출력 순서 맞히기</h4>
  <p>…</p>
  <pre class="code" data-lang="js"><code>…</code></pre>
</aside>
<aside class="deep" data-label="심화 · 선택"> <h4>…</h4> … </aside>
```

- This is optional depth. Boxes are **collapsed by default**. The top-bar button "심화 펼치기/접기" opens or closes all of them and remembers the choice (`ds-deep`).
- Put `<html … data-deep="open">` on the page to make "open" the default when the student has no saved choice.
- Collapsed text stays searchable: `Ctrl+F` opens the matching box (`hidden="until-found"`). Print expands all boxes.
- The title is the first `h3`, `h4`, `h5` or `.deep-title`. Use the heading level one below the enclosing section (reading `h4`, module `h3`).
- Never put required content, assignment information or anything a quiz depends on inside `.deep`.

### 5.15 자가 점검 · Self-check list

```html
<ul class="checklist" data-checklist="w11-goals">
  <li><label><input type="checkbox"> Network 탭에서 요청 하나를 골라 상태 코드를 읽었다.</label></li>
</ul>
```

- State is saved per browser under `ds-check:<file name>:<data-checklist>`. **Make `data-checklist` unique across the whole course**, with a week prefix (`w11-goals`, `w11-ai-review`, `mod-react-progress`), because `reading.html` exists in many folders.
- A progress line ("2 / 5 확인" with a "지우기" button) is added above the list. `data-progress="off"` hides it.
- All storage access is guarded. With blocked storage the list still works for the session.

### 5.16 확인 문제 · Quiz

```html
<form class="quiz" aria-label="11주차 확인 문제">
  <fieldset class="quiz-item">
    <legend class="quiz-q"><span class="quiz-no">Q1</span>서버가 <code>404</code>로 답했을 때 <code>await fetch(url)</code>는?</legend>
    <ul class="quiz-options">
      <li><label><input type="radio" name="w11q1"> Promise가 거부되어 catch로 간다</label><p class="quiz-why">거부되는 것은 응답을 아예 받지 못한 경우입니다.</p></li>
      <li data-answer><label><input type="radio" name="w11q1"> 정상으로 이행되고 res.ok가 false다</label><p class="quiz-why">맞습니다. …</p></li>
    </ul>
  </fieldset>

  <fieldset class="quiz-item">
    <legend class="quiz-q"><span class="quiz-no">Q2</span>… 모두 고르세요.</legend>
    <ul class="quiz-options">
      <li data-answer><label><input type="checkbox" name="w11q2"> …</label><p class="quiz-why">…</p></li>
      <li><label><input type="checkbox" name="w11q2"> …</label><p class="quiz-why">…</p></li>
    </ul>
  </fieldset>

  <div class="quiz-item">
    <p class="quiz-q"><span class="quiz-no">Q3</span>문자열 <code>'[1,2]'</code>를 배열로 바꾸는 함수 이름을 쓰세요.</p>
    <div class="quiz-short"><input type="text" data-accept="JSON.parse|JSON.parse()" aria-label="Q3 답" autocomplete="off" spellcheck="false"></div>
    <p class="quiz-why"><code>JSON.parse</code>입니다.</p>
  </div>
</form>
```

| Piece | Rule |
|---|---|
| `li[data-answer]` | Marks a correct option (`data-answer` on the `input` also works). Radio means one answer; checkbox means "모두 고르세요". |
| `input[data-accept]` | The accepted short answers, separated by `|`. Comparison ignores case, surrounding spaces and quotes, and a trailing period. Enter checks. |
| `.quiz-why` | The explanation. It shows after an answer is checked and stays hidden until then. Write one per option (or one per short-answer item). |
| Check button | Added automatically ("확인"). After the second try the correct answers are revealed. |
| `name` | Unique per item across the page (`w11q1`). |

Use 3–5 items. Without JS all explanations are visible, like a printed answer key.

### 5.17 과제 카드 · Assignment

The field order is fixed: **과제명 → AI 등급 → 할 일 (3 items or fewer) → 예상 소요 → 제출물·파일 이름 → 제출처 → 마감 (large) → 확인 기준**. Never reorder or drop a field.

```html
<article class="assignment" aria-labelledby="hw11-title">
  <header class="assignment-head">
    <span class="kicker">11주차 과제 · 팀</span>
    <h4 class="assignment-title" id="hw11-title">수직 프로토타입: 한 장면을 끝까지</h4>
    <span class="ai-grade" data-grade="allowed">AI ALLOWED</span>
  </header>
  <dl class="assignment-fields">
    <div><dt>할 일</dt><dd><ol>
      <li>사용 장면 하나가 fetch부터 화면까지 동작하게 만들기</li>
      <li>팀원 모두 PR을 1개 이상 올리고 서로 리뷰하기</li>
      <li>데모와 AI USE NOTE 남기기</li>
    </ol></dd></div>
    <div><dt>예상 소요</dt><dd>팀 전체 4~6시간 (한 사람당 1.5시간 내외)</dd></div>
    <div><dt>제출물·파일 이름</dt><dd><code>README.md</code>, <code>demo.mp4</code>, <code>docs/ai-use-note.md</code></dd></div>
    <div><dt>제출처</dt><dd>eTL › 과제 › 11주차 팀 과제</dd></div>
    <div class="due"><dt>마감</dt><dd><time datetime="2026-11-17T09:59:00+09:00">11/17(화) 오전 9:59</time> · eTL<small>자정이 아니라 수업 날 아침 9시 59분입니다.</small></dd></div>
    <div><dt>확인 기준</dt><dd><ul><li>…</li><li>…</li></ul></dd></div>
  </dl>
</article>
```

- The heading level follows the outline: `h4` inside a reading section, `h3` inside a summary or module section or a slide.
- `.due` makes the deadline large, and JS appends "n일 남음", "n시간 남음" or "마감 지남" from `time[datetime]`. Always give the full ISO timestamp with `+09:00`. `data-countdown="off"` on the `article` disables the countdown (use it for archives).
- `.ai-grade` values follow §3: `required`, `allowed`, `limited` or `none`. For `limited`, say in 할 일 or 확인 기준 which part may use AI.
- The kicker states the scope (`· 개인` or `· 팀`).

### 5.18 프롬프트 카드 · Prompt card

```html
<figure class="prompt">
  <figcaption class="prompt-head"><span class="prompt-tool">ChatGPT Edu</span><span class="prompt-purpose">fetch 코드 초안 받기</span></figcaption>
  <pre class="prompt-text">아래 조건으로 목록을 불러와 그리는 JavaScript 함수를 써 줘.

- 주소: <var>/api/works</var> (GET)
- 그릴 곳: <var>&lt;ul id="list"&gt;</var>
- async/await로 쓰고, 라이브러리는 쓰지 마.</pre>
  <div class="prompt-check">
    <p class="prompt-check-title">결과를 받은 뒤 확인할 것</p>
    <ul>
      <li><code>res.ok</code>를 검사하나요?</li>
      <li>API 키나 비밀번호가 코드 안에 들어 있지 않나요?</li>
    </ul>
  </div>
</figure>
```

- `.prompt-tool` is the tool name (`ChatGPT Edu` or `Claude Code`), and `.prompt-purpose` is what the prompt is for.
- `<var>` marks the slots students replace (shown underlined). Escape `<` and `>` inside them.
- The copy button is added automatically and copies the plain text.
- `.prompt-check` is required. It holds 2–4 checks, titled exactly `결과를 받은 뒤 확인할 것`.
- Prompts are written in natural Korean in 반말 ("~해 줘"), the way students actually type them.

### 5.19 요약판 개념 · Concept block and "more" link

See §4B. Use `div.concept[id]` containing `h3`, `p.concept-def`, an optional code block or table, an optional `p.callout.mistake`, and `a.more`. Concepts are numbered `01`, `02` and so on by CSS.

### 5.20 모듈 적합성 · Fit block

See §4D. Use `section.fit[aria-labelledby] > h2 + dl > div > dt + dd`.

### 5.21 문서 끝 · Document footer

```html
<nav class="doc-foot" aria-label="주차 이동">
  <a class="prev" href="../week10/reading.html"><span>← 이전</span>10주차 · 저장소와 하네스</a>
  <a class="next" href="summary.html"><span>요약판 →</span>11주차를 2쪽으로 다시 보기</a>
</nav>
```

Either link may be omitted. The `span` is the small direction label.

### 5.22 버튼 · Buttons

`button.btn` (default), `.btn.primary` (ink-filled; at most one per component) and `.btn.quiet`; add `.small` for the compact size. Pages rarely need hand-written buttons. Components make their own.

### 5.23 코드 실습 · Code lab

The lab is an editable HTML, CSS, JS, server and test playground that runs in a sandboxed iframe (`sandbox="allow-scripts allow-modals allow-forms"`, **no** `allow-same-origin`).
- Running: the **실행** button, `Ctrl+Enter` or `⌘+Enter`, and it also runs automatically when scrolled into view. **처음 코드로** resets the code.
- Output tabs: 콘솔 (console), 테스트 ("2 / 3 통과") and 네트워크 (network), the last with a latency and offline switch.
- Error lines are mapped back to the editor ("JS 3번째 줄"). Infinite loops are stopped after 1.5 s.

```html
<div class="lab" data-title="세 가지 상태와 res.ok" data-kicker="실습 2" data-latency="300" data-active="js">
<script type="text/plain" data-lab="html">
<label>검색 <input id="q"></label>
<button id="go">찾기</button>
<p id="status" role="status"></p>
<ul id="list"></ul>
</script>
<script type="text/plain" data-lab="css">
body { font: 15px/1.6 system-ui, sans-serif; margin: 16px; }
</script>
<script type="text/plain" data-lab="js">
async function show(url) {
  statusEl.textContent = '불러오는 중…';
  const res = await fetch(url);
  // TODO: res.ok가 false면 throw new Error('서버 응답 ' + res.status)
  …
}
show('/api/works');
</script>
<script type="text/plain" data-lab="server">
const works = [{ id: 1, title: '소리 지도' }];
app.get('/api/works', (req, res) => {
  const q = (req.query.q || '').trim();
  res.json(works.filter(w => w.title.includes(q)));
});
</script>
<script type="text/plain" data-lab="test">
test('목록을 그리고 개수를 알려 준다', async () => {
  await until(() => $$('#list li').length === 1);
  expect($('#status').textContent).toContain('1개');
});
test('없는 주소(404)면 상태 코드를 알려 준다', async () => {
  await show('/api/nothing');
  expect($('#status').textContent).toContain('404');
});
</script>
</div>
```

**Source blocks** are `script[type="text/plain"][data-lab=…]`, direct children of `.lab`. The tab order is always HTML, CSS, JS, 서버, 테스트; include only the ones you need.

| `data-lab` | What it is |
|---|---|
| `html` | The body markup, or a full document (`<!doctype html>…`) if you need your own `<head>`. |
| `css` | Injected as a `<style>`. |
| `js` | Runs after the HTML. With React or JSX it is compiled by Babel. |
| `server` | A mock **Express** server in the same frame; `fetch('/api/…')` is routed to it. |
| `test` | Tests that run after the JS; results go to the 테스트 tab. |

- Write `<\/script>` (and `<\/style>`) inside a source block; the DS turns it back into `</script>`.
- Start the code right after the `>` line. Indentation is dedented automatically.

**Attributes on `.lab`**

| Attribute | Default | Effect |
|---|---|---|
| `data-title` | `코드 실습` | The title in the lab header. |
| `data-kicker` | `실습` | Small label before the title (`실습 2`). |
| `data-active` | first tab | The tab opened first (`html`, `css`, `js`, `server` or `test`). Open the tab students must edit. |
| `data-hide` | — | Space-separated tabs to hide (the code still runs), e.g. `data-hide="css test"`. |
| `data-height` | `15rem` | Editor and result height: a number (px) or a CSS length. |
| `data-stacked` | — | Always put the editor above the result, even on wide screens. |
| `data-libs` | — | `react`, `chart`, `d3` or `babel`, or an `https://…` script URL, space-separated. The pinned CDN versions are React 18.3.1 + ReactDOM + Babel standalone 7.24.7 (unpkg), Chart.js 4.4.1 and D3 7.9.0 (jsDelivr). If a library fails to load, the lab shows "… 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 실행하세요." |
| `data-jsx` | — | Compile JS with Babel (JSX) without loading React. `data-libs="react"` already implies it. |
| `data-latency` | `300` | Mock server delay in ms; the student can change it in the 네트워크 tab (0, 300 ms, 1 s or 3 s). |
| `data-api` | `/api` | The path prefix routed to the mock server. Other URLs go to the real network. |
| `data-network` | — | Show the 네트워크 tab even without a server block (logs real fetches). |
| `data-live` | — | Re-run 0.7 s after typing stops. Use it only for small HTML/CSS demos. |
| `data-autorun="false"` | runs | Do not run when the lab scrolls into view; the student presses 실행. |

**Mock server API** (inside `server`): `app` and `express` exist already. `const app = express();` and `require('express')` / `require('cors')` also work.
- `app.get` / `post` / `put` / `patch` / `delete` / `all(path, ...handlers)`. Paths support `:params` and `*`.
- `app.use([prefix], fn)`, plus `express.json()`, `express.urlencoded()`, `express.static()` and `cors()` as no-ops.
- `app.listen(port, cb)` only logs.
- `req` has `method`, `path`, `url`, `query`, `params`, `body` (JSON-parsed when possible), `headers` and `get(name)`.
- `res` has `status(c)`, `json(o)`, `send(x)`, `end()`, `sendStatus(c)`, `set(k, v)` and `type(t)`. All are chainable.
- An unmatched route returns `404` with `{ "error": "Not Found", "message": "GET /api/x 에 맞는 경로가 없습니다" }`. A handler that never responds gives `504` after 5 s, with a hint in the console.
- The 오프라인 switch makes `fetch` reject with `TypeError: Failed to fetch`, which exercises the `catch` path.

**Test API** (inside `test`):
- Declaring tests: `test(name, fn)` / `it(...)`, `describe(name, fn)`. `fn` may be `async`.
- `expect(x)` matchers:
  - `.toBe` / `.toEqual` (deep) / `.toContain` (string or array).
  - `.toBeTruthy` / `.toBeFalsy` / `.toBeDefined` / `.toBeUndefined` / `.toBeNull`.
  - `.toBeGreaterThan` / `.toBeGreaterThanOrEqual` / `.toBeLessThan` / `.toHaveLength`.
  - `.toMatch(re|str)` / `.toBeInstanceOf` / `.toThrow()`, and `.not.<matcher>`.
- Helpers:
  - `$(sel)` and `$$(sel)` (the latter returns an array).
  - `wait(ms)` and `until(fn, ms = 3000)`; `until` polls until `fn()` is truthy and fails with a message otherwise.
  - `click(sel)` and `type(sel, text)`; `type` sets the value and fires `input` and `change`.
- Tests share the page with the JS, so they can call its top-level functions (`show(...)`).
- Write failure-friendly test names in Korean (`'목록 3개를 그리고 개수를 알려 준다'`). The summary shows `2 / 3 통과`. Design labs so the starting code fails exactly the test the student must fix.

**Storage in labs.** The frame has no real `localStorage`. A stand-in `localStorage`/`sessionStorage` is provided and kept across runs of the same lab until 처음 코드로 (or a page reload), so "add a memo → run again → it is still there" works.

**Mobile.** Editors are plain `textarea`s with 16px text on touch devices, so iOS does not zoom. `Tab` indents; press `Esc` and then `Tab` to move focus out of the editor. The console and network panel keep a fixed height (`--lab-out-h`, default 8.5rem) so the page does not jump.

**Do**
- Keep each tab under about 40 lines and the page's whole lab count at 6 or fewer.
- Use realistic Korean data (team names, work titles), not `foo` or `bar`.
- Log something meaningful (`console.log('받은 개수:', works.length)`).

**Don't**
- Don't call real third-party APIs from labs. Use the mock server.
- Don't put secrets or keys in labs, even fake-looking ones.
- Don't use `alert()` as the main output.

### 5.24 AI 채팅 연습 화면 · sim-chat

This is a scripted, clickable practice copy of an AI chat app, so students can rehearse the workflow (new chat, attach, prompt, read, verify). It is **not** the real service.
- The fixed label "연습용 화면 · 실제 서비스가 아닙니다" is always shown.
- No logos, brand marks or real product colours are used, and there are no login forms.

```html
<div class="sim sim-chat" data-variant="chatgpt" aria-label="AI 채팅 연습 화면">
<script type="application/json" data-sim>
{
  "model": "기본 모델",
  "projects": ["웹프로그래밍개론 팀 프로젝트"],
  "history": ["9주차 데이터 항목 표 정리", "README 초안 다듬기"],
  "labels": [
    { "target": "new-chat", "text": "**새 채팅**: 주제가 바뀌면 새로 시작합니다." },
    { "target": "attach", "text": "**파일 첨부**: 코드 파일을 그대로 보여 줄 수 있습니다." }
  ],
  "steps": [
    { "role": "system-note", "text": "왼쪽 위의 **새 채팅**을 눌러 시작하세요.", "expect": "click:new-chat" },
    { "role": "user", "attachments": ["app.js"], "expect": "click:attach",
      "attachCoach": "입력창 왼쪽의 **+** 버튼을 눌러 app.js를 첨부하세요.",
      "expectInput": "첨부한 app.js에서 … 왜 그런지 설명해 주세요." },
    { "role": "tool", "text": "app.js 읽는 중", "done": "app.js를 읽었습니다", "ms": 900 },
    { "role": "assistant", "text": "원인은 **…**입니다.\n\n- 첫째…\n- 둘째…\n\n```js\nif (!res.ok) throw new Error('서버 응답 ' + res.status);\n```",
      "coach": "답을 그대로 붙여 넣기 전에 Network 탭에서 직접 확인하세요." },
    { "role": "assistant", "text": "오른쪽 캔버스에 정리했습니다.",
      "panel": { "title": "404 안내 문구 초안", "kind": "캔버스", "content": "1. …\n2. …" } },
    { "role": "system-note", "text": "AI가 제안한 문구 가운데 실제 상황과 맞지 않는 것이 있나요?" }
  ],
  "end": "끝까지 따라 했습니다. 직접 확인한 것과 고친 것을 AI USE NOTE에 적어 두세요."
}
</script>
</div>
```

**Attributes:**
- `data-variant`: `chatgpt` (the default; a generic layout with a 캔버스 panel) or `claude` (a generic layout with an 아티팩트 panel and an extra sidebar item).
- `data-height`: a number (px) or a CSS length; the default is `34rem` (36rem when stacked on phones).

**Top-level JSON**

| Key | Meaning |
|---|---|
| `steps` | Required, in order (below). |
| `model` | Text on the model button (use `기본 모델`; do not name real model versions). |
| `projects`, `history` | Sidebar entries (strings). |
| `labels` | Numbered callouts on the UI: `[{ "target": "<data-t>", "text": "**굵게** 설명" }]`, shown as a legend under the screen. |
| `title` | Initial conversation title (otherwise the first user message). |
| `end` | Coach text at the end. Always mention verification or AI USE NOTE. |
| `speed` | Streaming speed (default 4; higher is faster). |
| `ui` | Override any UI string (e.g. `{ "placeholder": "…" }`). |

**Step fields.** `role` is one of the following.
- `system-note`: coach text.
  - With `"expect": "click:<target>"` it waits for the student to click that element, which is highlighted.
  - With `"wait": false` it advances by itself.
  - Otherwise it shows a 계속 button.
- `user`: the student's message.
  - `expectInput` is the sentence to type; a **자동 입력** button fills it in. Any text the student writes is accepted.
  - Without `expectInput`, `text` is posted automatically.
  - `attachments` lists file names. Adding `"expect": "click:attach"` makes the student press **+** first; `attachCoach` is the coach text for that.
  - `coach` overrides the coach text.
- `assistant`: `text` is streamed. It is a Markdown subset: paragraphs, `- ` and `1. ` lists, `**bold**`, `` `code` `` and ```` ```lang ```` fences.
  - `panel` opens the side panel as `{ title, kind, content, lang? }`; with `lang`, the content is shown as code.
  - `while` is the coach text during streaming. `coach` pauses afterwards with a 계속 button.
- `tool`: a "working…" line, with `text`, `done`, `ms` and `coach`.
- `panel`: opens a panel without a message.
- Any step may also carry `newChat: true` and `title`.

**Click targets** (`data-t`):
- Sidebar: `new-chat`, `search`, `projects` (the first project), `project-1`…, `history-0`…, and `artifacts` (claude only).
- Top: `model`, `menu`.
- Composer: `attach`, `tools`, `send`, `composer`.
- Panel: `panel-close`.

The strip controls are **처음부터** and **다음 단계** (for presenting). A full transcript is in a `details` ("전체 과정을 글로 보기") for screen readers and print.

**Do:** keep it to 4–8 steps; end with a verification step; use course-realistic prompts.

**Don't:**
- Don't imitate exact brand UI, logos, colours or model names.
- Don't show login, payment or account pages.
- Don't claim features the course hasn't confirmed.

### 5.25 터미널·에이전트 연습 화면 · sim-terminal

A scripted terminal (`shell`) or coding-agent session (`claude-code`, `codex`). The student types the command, with a hint and **자동 입력**; answers permission prompts with numbered choices (keys `1`–`9`, `↑` and `↓`, `Esc` for the last option); reads diffs; and watches a files pane update.

```html
<div class="sim sim-term" data-variant="claude-code" aria-label="코딩 에이전트 연습 화면">
<script type="application/json" data-sim>
{
  "title": "코딩 에이전트 (연습)",
  "cwd": "~/team-app",
  "files": ["CLAUDE.md", "index.html", "src/", "src/app.js"],
  "steps": [
    { "type": "command", "cmd": "claude", "coach": "팀 저장소 폴더에서 `claude`를 입력합니다." },
    { "type": "output", "lines": ["에이전트가 시작되었습니다 (연습 화면)", "  CLAUDE.md를 읽었습니다"] },
    { "type": "prompt", "text": "src/app.js의 loadWorks에 res.ok 검사를 추가해 줘. 다른 파일은 건드리지 마.", "coach": "요청에 **범위**와 **하지 말 것**이 있나요?" },
    { "type": "agent", "text": "계획: ① `src/app.js`를 읽고 ② `res.ok` 검사를 넣겠습니다." },
    { "type": "tool", "name": "Read", "arg": "src/app.js", "result": "42줄을 읽었습니다", "ms": 700 },
    { "type": "diff", "file": "src/app.js", "lines": ["@@ loadWorks @@", "   const res = await fetch('/api/works');", "+  if (!res.ok) throw new Error('서버 응답 ' + res.status);"] },
    { "type": "permission", "title": "파일 수정 · src/app.js", "question": "이 변경을 적용할까요?",
      "options": [ { "label": "예" },
                   { "label": "예, 이번 세션에서는 다시 묻지 않기", "feedback": "처음에는 변경마다 확인합니다. 1번을 골라 보세요." },
                   { "label": "아니요 (Esc)" } ],
      "expect": 1, "after": "허락하기 전에 diff에서 바뀌는 줄을 읽었나요?" },
    { "type": "files", "modified": ["src/app.js"] },
    { "type": "output", "lines": ["✓ loadWorks: 목록을 그린다", "Tests: 1 passed"] }
  ],
  "end": "실제 터미널에서도 같은 순서로 해 보고, 커밋하기 전에 git diff로 확인하세요."
}
</script>
</div>
```

**Attributes:**
- `data-variant`: `shell` (default, plain terminal), `claude-code` or `codex` (agent styling; a boxed `>` prompt for `prompt` steps).
- `data-height`: a number (px) or a CSS length.

**Top-level JSON:**
- `title`: default `터미널`, or `AI 코딩 에이전트 (연습)` for agent variants.
- `cwd`: default `~/project`.
- `files`: paths; folders end with `/`. The pane is hidden while the list is empty.
- `steps`, `end`, and `speed` (agent streaming, default 5).

**Step types**

| `type` | Fields | Behaviour |
|---|---|---|
| `command` | `cmd`, `hint`, `coach` | The student types `cmd` (spacing-insensitive). A wrong command gets a gentle correction. 자동 입력 types it. |
| `prompt` | `text`, `coach` | A request to the agent; any text is accepted, and 자동 입력 fills `text`. |
| `output` | `lines[]` or `text`, `cls`, `coach`, `wait` | Printed line by line. Lines starting with `✓` / `ok` / `PASS` are coloured green, `error` / `✗` / `fail` red, and `warn` / `⚠` amber. With `coach`, a 계속 button follows. |
| `agent` | `text`, `coach`, `wait` | The agent's explanation, streamed; inline `**bold**` and `` `code` `` work. |
| `tool` | `name`, `arg`, `result`, `ms`, `coach` | A tool-call line `Name(arg) → result`. If `arg` is a listed file, it is highlighted in the files pane. |
| `diff` | `file`, `lines[]` (or `diff` string), `coach` | A coloured diff; the file is marked modified. |
| `permission` | `title`, `detail`, `question`, `options[]`, `expect`, `feedback`, `after`, `coach` | Numbered choices. `options` are strings or `{ label, feedback, result, coach }`. `expect` is **1-based**; a wrong pick shows that option's `feedback` and lets the student try again. |
| `files` | `files[]` (replace), `add[]`, `modified[]` | Updates the files pane (new or modified marks). |
| `note` | `text`, `wait` | Coach text with 계속 (or auto with `wait: false`). |
| `clear` | — | Clears the screen. |
| `mode` | `mode` | Accepted for readability; it has no visible effect. |

**Do:** keep it to 6–14 steps, and end on verification (`git diff`, a test, a browser check).

**Don't:** don't print real tokens, e-mail addresses or account names, and don't teach a "don't ask again" option as the right answer.

### 5.26 발표 전용 · Deck-only pieces

See §4C: `.slide` variants, `.pts`, `.two`, `.three`, `.big`, `.sec-no`, `.sub`, `.cover-meta`, `.slide-foot`, `.notes` with `li.check`, and `button.timer-btn[data-timer]`. All other components (code, flow, pair, prompt, agenda, stack map, lab, assignment) work on slides; add `.body` to the main one.

---

## 6. JS API · 저장 키 · Storage keys

```js
DS.init(rootElement)      // enhance components added after load (idempotent)
DS.highlight(code, lang)  // → highlighted HTML string
DS.version                // '1.0.0'

// deck pages only
deck.count                // number of slides
deck.current              // 0-based index
deck.show(i)              // go to slide i (0-based); URL becomes #s=i+1
deck.next(); deck.prev();
deck.slides               // array of .slide elements
```

| localStorage key | Value (JSON) | Written by |
|---|---|---|
| `ds-theme` | `"light"` or `"dark"` (absent means follow the OS) | theme toggle |
| `ds-deep` | `"open"` or `"closed"` | global 심화 toggle |
| `ds-check:<file>:<data-checklist>` | array of checked indexes | checklist |
| `ds-tab:<data-tabs>` | the chosen `data-tab` label | tabs |

Every read and write is wrapped in `try/catch`; with storage blocked the page works, it just does not remember. Nothing is sent anywhere.

---

## 7. 접근성 · Accessibility

The DS already provides the following.
- `lang="ko"` and a skip link.
- Visible 2px focus rings, keyboard support for tabs, quiz, TOC (Esc closes), deck, sims and permission prompts.
- `aria-live` on lab status, quiz results and sim coach text.
- `prefers-reduced-motion` (no smooth scroll, instant sim streaming).
- Contrast of at least 4.5:1 for text tokens in both themes.
- Code and terminal surfaces are readable in both themes.

Authors must:
- Keep heading levels in order (§2), and keep exactly one `h1`.
- Write real `alt` text, table captions, `scope` on header cells, `aria-label` on each `.sim`, and unique `name`s for quiz inputs.
- Never convey meaning by colour alone. Bad and good code blocks carry labels (`data-file="고치기 전"`).
- Not use `--faint` for text. It is for decoration only.
- Check at 390px wide: no horizontal page scroll (tables and code scroll inside themselves).

---

## 8. 인쇄 · Print

- **Reading, summary, module and hub pages** print on A4 (16/15/18 mm margins). Chrome is hidden (topbar, TOC, buttons, sims' interactive part).
- **Content changes in print:**
  - 심화 boxes and `<details>` are expanded.
  - Labs print their source code.
  - Sims print their text transcript.
  - Each part starts on a new page.
  - External link URLs are printed after the link text.
- **Summary pages** must come out at 2–4 A4 pages. Check with the browser's print preview.
- **Decks** print one slide per landscape 16:9 page (297 × 167 mm), with the HUD, notes and timer hidden.

---

## 9. 토큰 · Tokens

Use tokens only through the existing classes. If you must reference one, use `var(--token)` and never hex.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F7F6F2` | `#151514` | page background |
| `--surface` | `#FFFEFB` | `#1C1C1A` | raised surfaces (lab, cards) |
| `--sunken` | `#EFEDE7` | `#242421` | hover and wells |
| `--ink` | `#1C1B19` | `#ECE9E2` | text |
| `--ink-2` | `#3B3934` | `#CFCBC2` | secondary text |
| `--muted` | `#66625A` | `#A39F95` | captions and meta (≥ 4.5:1) |
| `--faint` | `#9A968C` | `#6F6C64` | decoration only |
| `--line` / `--line-soft` | `#D8D4CA` / `#E6E3DB` | `#3A3934` / `#2B2A27` | hairlines |
| `--accent` | `#15625C` | `#7CC9BD` | the one accent (links, current, today) |
| `--ok` / `--warn` / `--err` | `#2B6A35` / `#855400` / `#A1332A` | `#93C99A` / `#E2B866` / `#F0A193` | status |
| `--solo` / `--team` / `--show` | `#1B6E68` / `#2E4E9E` / `#9D2A62` | lighter pairs | activity type (agenda, tags) |
| `--font` | Pretendard Variable → system Korean sans | | body and headings |
| `--mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, "D2Coding", monospace` | | code |
| `--radius` / `--radius-lg` | `4px` / `6px` | | the maximum radius |
| `--measure` | `41rem` (about 68ch) | | line length |

Body text is 16.5px with a line-height of 1.7; the theme is set by `html[data-theme]`, or follows the OS when that attribute is absent.

---

## 10. 옛 페이지 · Old pages: `bridge.css` and `tools/restyle.py`

**`ds/bridge.css`** re-points the old `course-design.css` tokens (`--paper`, `--ink`, `--solo`, `--code-bg`, `--sans` and so on) at the DS palette and type. It also adds a few safe global rules (focus ring, selection, link underline, heading font) and re-colours the old VS Code-style highlighter to the DS warm-dark palette. It does not change layouts. Old code editors stay dark on purpose, because they overlay a transparent textarea on a coloured `pre` and hard-code light-on-dark text. Dark mode on the old "book" pages (week2, week2_show) is kept, in DS colours.

To apply it to an old page, add two links **after** the existing `assets/css/course-design.css` link (paths from the repo root):

```html
<link rel="stylesheet" href="assets/css/course-design.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="ds/bridge.css">
```

For `index.html` (Tailwind) it re-maps only the classes that exist on that page (`studio-card`, `text-navy`, `bg-navy`, `ai-orange`, `ai-blue`).

**`ds/tools/restyle.py`** previews the bridge without touching originals. It needs only the Python standard library.

```bash
python3 ds/tools/restyle.py week5.html                 # → restyled/week5.html
python3 ds/tools/restyle.py --all                      # week2–5, *show pages, index.html
python3 ds/tools/restyle.py --all --link-siblings      # links between restyled pages stay inside restyled/
python3 ds/tools/restyle.py week5.html --out /tmp/preview
```

- **What it does:**
  - It copies each page into the output folder and rewrites relative `href`, `src`, `poster`, `data-src` and CSS `url()` references, but only those whose target really exists. They are usually prefixed with `../`.
  - It injects the Pretendard and `bridge.css` links. They go after the `course-design.css` link, or before `</head>` when that link is absent.
- **What it leaves alone:** `<script>` and `<textarea>` bodies. Paths used only from JavaScript are listed as warnings and may not load in the copy.
- **Safeguards:** it refuses to overwrite an original and refuses `--out` set to the repo root.
- `restyled/` is a throw-away preview. Delete it after comparing and never commit it.

---

## 11. 검수 · QA checklist (every page, before hand-off)

1. Open the page from `file://` with DevTools open. There must be **no console errors**. Blocked Pretendard or CDN requests are fine offline, and so is a lab's own intentional error output.
2. Check every relative link and `#anchor` against a real file or `id`. `a.more` targets and `doc-foot` links matter most.
3. At **1280×720** and **390×844**, in **light** and **dark**:
   - There must be no horizontal page scroll (`document.documentElement.scrollWidth <= innerWidth`).
   - Headings must be numbered correctly, and the TOC must highlight the section you scroll to.
4. Decks: on every slide, `slide.scrollHeight - slide.clientHeight <= 4` at 1280×720. Walk through with `→`, and check `T`, `N` and `#s=5`.
5. Labs: press 실행. The expected tests fail at the start (if intended) and pass after the intended fix; the 네트워크 tab shows the request.
6. Sims: click through to the end once with the keyboard only.
7. Quiz: wrong answer, then right answer. The explanations show.
8. Print preview: summary pages fit 2–4 A4 pages, and decks print one slide per page.
9. Copy rules (§3): deadline format, AI grade label, the tool named on prompt cards, no names or internal links, and `확인 필요` only in deck notes.

The overflow and console checks can be scripted with Playwright:

```js
// node check.js page.html   (npm i -D playwright)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1280, 720], [390, 844]]) {
    for (const scheme of ['light', 'dark']) {
      const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
      const errs = [];
      p.on('console', m => m.type() === 'error' && !/ERR_|net::/.test(m.text()) && errs.push(m.text()));
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto('file://' + require('path').resolve(process.argv[2]));
      await p.waitForTimeout(1500);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const slides = await p.evaluate(() => [...document.querySelectorAll('.slide')]
        .map((s, i) => (window.deck && deck.show(i), [i + 1, s.scrollHeight - s.clientHeight]))
        .filter(([, d]) => d > 4));
      console.log(w, scheme, { overflowX: over, errors: errs, tallSlides: slides });
      await p.close();
    }
  }
  await b.close();
})();
```

---

## 12. 알려진 한계 · Known limitations

- **CDN-dependent labs** (`data-libs`) need the internet. Offline, they show the "라이브러리를 불러오지 못했습니다" message, and tests report that they could not run. Neither React nor Chart.js nor D3 was exercised live in the DS's sandboxed test environment (CDNs blocked there); only the offline path was verified.
- **Pretendard** loads from jsDelivr; offline the system Korean font is used. Layout does not depend on it.
- **Lab sandbox** includes `allow-forms` and `allow-modals` (so `submit` handlers and `alert` work). It excludes `allow-same-origin`, so lab code cannot read the course page, cookies or real storage.
- **Mock server** implements the subset of Express listed in §5.23 (no streaming, cookies, file uploads or real middleware). It runs in the same frame as the page code, which is a teaching model, not a real network.
- **Labs on deck slides** run when the deck loads (all slides share one viewport position). Keep them small, or set `data-autorun="false"`.
- **JSX labs** report errors without line mapping (Babel compiles in the frame).
- **Old pages**: `bridge.css` changes tokens and type, not layout. Old code surfaces stay dark by design, and the GitHub- or VS Code-style simulators keep their own colours. `restyle.py` does not rewrite paths that appear only inside JavaScript.
- **Checklist keys** use the file name, so the same `data-checklist` value on two `reading.html` files in different folders would share state. Use week-prefixed names (§5.15).
