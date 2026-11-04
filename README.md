# GroupName: DV01_T20
- Siti Nur Fatimah binti Abdul Halem 105812491
- Chung Zhe TONG 105804977
- Meryl Xin Yii LIEW 105803563


# Group 20 · Road injury in Australia

A compact, interactive D3 dashboard using three supplied road injury workbooks. The data cover calendar years **2011–2021**, published in **2023**. AIHW supplied the hospital data; BITRE publishes the workbooks on its [Hospitalised Injury page](https://www.bitre.gov.au/resource/road-safety/hospitalised-injury).

**Live website:** [group20-road-injury.vercel.app](https://group20-road-injury.vercel.app/)

## Run locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Use a web server because the browser loads the prepared CSV files. D3 7.9.0 is included in `vendor/`, with its licence; the dashboard has no external chart-library or data-network dependency.

## Explore

- **National:** annual hospitalisations and 12 road-user categories.
- **States & territories:** annual counts for eight jurisdictions, with Australia as a comparison.
- **First Nations:** annual counts for First Nations peoples and non-Indigenous Australians.

Choose a category and year, select a bar or table year, sort the bars, and toggle the comparison line. The charts, table, selection badge and key points update together. Named CSV downloads contain the displayed data series across 2011–2021. The original Excel workbook is a separate download from the official BITRE website.

The interface uses a light blue palette, readable text, keyboard controls, responsive charts, gentle animation and reduced-motion support. Annual data, selected-year comparison values and data preparation are always visible in separate cards. All dataset and report downloads are grouped in the Downloads card.

## Prepare the data again

Keep the three original workbooks in `dataset/`. The preparation script requires Python 3.9+ and `openpyxl`:

```sh
python3 -m pip install openpyxl
python3 tools/prepare_data.py
```

Optional paths:

```sh
python3 tools/prepare_data.py --dataset-dir /path/to/dataset --output-dir /path/to/data
```

The script reads the workbooks without changing them and writes four CSVs plus `data/validation.json`. Regenerate these files after replacing a source workbook; the browser does not read Excel directly.

## Files

- `index.html`, `main.css`: layout, controls and styling.
- `load_data.js`: CSV loading, coverage checks and shared helpers.
- `line_chart.js`, `horizontal_bar_chart.js`: reusable D3 chart modules.
- `main.js`: the three views, filters, calculations, tables and downloads.
- `data/`: prepared national, road-user, jurisdiction and population-group counts.
- `tools/prepare_data.py`: reproducible extraction and source checks.
- `vendor/`: local D3 library and licence.
- [Data processing](docs/data-processing.md): sources, calculations and limitations.
- [Usability evaluation](docs/usability-evaluation.md): test tasks and evidence record.

## Build and deploy

Run `node tools/build_site.mjs` with Node.js 18+ to build `dist/`. `vercel.json` uses this command and serves that folder. The build includes only the website, prepared public data and D3 licence; Excel downloads point to BITRE. Original workbooks stay in `dataset/` for reproducible preparation.

The production deployment was verified on 23 October 2026. It was uploaded directly from the local source; no Git commit or push was made. Future source changes require a new deployment.

## Scope and verification

All three workbooks contribute data. Selected annual totals and road-user categories are integrated; other dimensions, such as age, sex, remoteness, counterparty and bed days, are outside the current dashboard scope.

**Data checks: PASS — 288 checks, 0 failures.** Two First Nations raw annual reconciliations for 2014 are explicitly skipped because four age cells are suppressed. Published T1 annual totals are used without reconstructing those cells. This result verifies the prepared data, not browser behaviour or a human usability study.

**Browser checks: PASS** for linked controls, all three view types, named CSV downloads, desktop/phone layout and live loading. See the evaluation document for evidence and limits.

**Human participant usability study: NOT RUN.** The evaluation document contains a task and recording template. Reduced-motion support is implemented; changing the system preference was not tested.

Counts describe hospitalisations, not unique people or population-adjusted risk. NSW has a recording break from June 2017 and Victoria from 2012. National totals include unknown residence or Indigenous status, so component categories may not sum to Australia. See the processing notes before interpreting comparisons.
