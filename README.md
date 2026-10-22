# Group 20 · Road injury in Australia

A responsive, interactive dashboard using the supplied AIHW state and territory road crash hospitalisation workbook (2023 release, calendar years 2011–2021).

## Run locally

From this folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. Chart.js 4.4.4 loads from jsDelivr and needs an internet connection. The data table and CSV export work even if the chart library is unavailable.

## Files

- `index.html`: page layout and accessible controls.
- `main.css`: gentle yellow gradients, compact responsive layout, smooth anchor scrolling, subtle animations and reduced motion support.
- `load_data.js`: shared data snapshot, formatting and source notes.
- `line_chart.js`: trend chart and series break markers.
- `horizontal_bar_chart.js`: sortable comparison chart and bar selection.
- `main.js`: filters, linked views, summary, table and CSV export.

## Explore

Choose a jurisdiction and move the year slider. Sort the horizontal bars, click a bar to select that jurisdiction, toggle the national line, reset the view, or download the selected jurisdiction's full annual series as CSV. The data table offers the same values without relying on charts.

## Data limits

Counts are hospitalisations, not unique people or population-adjusted risk. The NSW series has a break from June 2017 and Victoria from 2012. The national total includes unrecorded or migratory/offshore residence and may differ from the sum of jurisdictions. The original source workbook is linked on the page. Updating the workbook alone does not update the curated snapshot in `load_data.js`.

## Current coverage

The prototype uses a curated snapshot of the state and territory workbook, Table T1. Other national breakdowns and First Nations data are not integrated. The assignment brief specifies D3; this prototype currently uses Chart.js and requires migration to meet that requirement. The named dataset button exports only the selected jurisdiction and Australia, 2011–2021; the full source workbook is a separate download.
