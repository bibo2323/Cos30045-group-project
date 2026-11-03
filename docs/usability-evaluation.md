# Usability evaluation

**Human participant study: NOT RUN.** This document is a test plan and recording template. Do not report the planned tasks as participant results. Browser checks performed by a developer or an automated agent are separate technical evidence.

## Purpose

Check whether a reader can find a value, compare categories, understand the count measure and download the intended dataset. Include an older reader if practical because readable text and simple controls are design goals.

Use the same published dataset and default settings for each participant. Obtain consent, explain that the interface is being tested, and avoid collecting unnecessary personal information. Allow keyboard-only use where relevant.

## Tasks

| Task | Success evidence | Result / time / comments |
| --- | --- | --- |
| Find Australia's hospitalisations in 2021. | Reader finds 39,505 and identifies the year. | NOT RUN |
| In States & territories, select NSW and 2021. Find its count and national share. | 9,003; 22.8%; correct state and year. | NOT RUN |
| Select 2016 from the annual table. Explain what changed. | Slider, badge, charts and key points all show 2016. | NOT RUN |
| In National, compare road users and select Car driver in 2021. | Reader finds 13,327 and can select its trend. | NOT RUN |
| Open First Nations. Explain whether the larger count proves higher individual risk. | Reader recognises that population sizes differ and counts alone cannot establish risk. | NOT RUN |
| Download a dataset and explain its scope. | Reader names the intended view and recognises that the export covers 2011–2021. | NOT RUN |

For each task, record completion without help, completion with help or failure; approximate time; wrong turns; and the participant's own comments. Use anonymous participant codes. After the tasks, ask which control or label was least clear and whether the text was comfortable to read.

## Developer browser checks

Observed technical checks in the Codex in-app browser on 23 October 2026. These are agent checks, not participant usability results. The same website files were uploaded to Vercel; live loading was checked separately.

| Check | Status | Evidence / browser / viewport / date |
| --- | --- | --- |
| Three tabs load their matching data and labels. | PASS | Australia 2021: 39,505; NSW: 9,003; First Nations: 2,220; non-Indigenous: 36,755. Live National load also verified. |
| Selector, slider, bars and table years update the linked views. | PASS | Queensland selector and 2019 table year: 9,515. NSW slider to 2020: 9,274. First Nations and Car driver bar keyboard selection updated counts and badge. |
| Comparison toggle, sorting and reset work. | PASS | Toggle reduced 22 trend points to 11. Name sort matched category-table order. Reset restored 2021, NSW and descending sort in States view. |
| CSV headers, period and values match each view. | PASS | Actual downloads parsed: NSW/Australia, Car driver/Australia and both First Nations groups/Australia; each has 11 annual rows. NSW 2017 export marks recording break. National all-category export was reviewed in code. |
| Keyboard tab navigation and selection retain usable focus. | PASS | ArrowRight changed National to States; Space selected NSW 2017 and focus remained on the rebuilt year button. Enter selected non-Indigenous bar; Space selected Car driver. |
| Desktop and phone layout dimensions. | PASS | At 1280 px, charts share a row. At 390 px, charts stack; document width stays within viewport. Wide First Nations table scrolls inside its region. This does not establish comfort for older users. |
| D3 charts render without console errors or duplicated SVG layers. | PASS | Two root groups remained after repeated updates; 11/22 finite trend marks as expected; no NaN/Infinity SVG geometry; no error/warning logs observed locally or at first live load. |
| Back to top. | PASS | Computed scroll behaviour is smooth; scroll position was intermediate after click and then reached 0. |
| Reduced-motion system preference. | NOT RUN | CSS and D3 support were inspected; the system preference was not changed for a runtime test. |

## Findings and changes

| Finding and evidence | Proposed change | Priority | Retest result |
| --- | --- | --- | --- |
| No participant findings yet. | Pending study. | — | NOT RUN |

Record the actual participant count, date and method after the study. Summarise remaining limitations separately from improvements that were implemented and retested.

## Expanded data layout check — 23 October 2026

- PASS: annual data, selected-year comparisons and preparation/source notes use permanent, separately labelled sections; no disclosure controls remain. All five downloads are in Downloads.
- PASS: desktop Chrome shows the aligned cards; selecting 2019 updated the badge, counts and comparison table. Selecting Car driver from the comparison table updated the view. The moved CSV button produced the expected 11-row annual file.
- PASS: static build, JavaScript syntax, referenced/unique IDs, whitespace check and Vercel production deployment. The new visible headings and loaded D3 data were also checked on the live website.
- NOT RUN: new phone-size visual check (in-app browser connection unavailable); responsive grid and wrapping rules were inspected. Human participant study remains NOT RUN.
