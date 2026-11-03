# Data processing

## Sources and scope

The dashboard uses the supplied **2023 release**, covering **calendar years 2011–2021**. The source is AIHW's National Hospital Morbidity Database, published through [BITRE's Hospitalised Injury page](https://www.bitre.gov.au/resource/road-safety/hospitalised-injury).

| Workbook in `dataset/` | Dashboard use | Prepared file |
| --- | --- | --- |
| `hospitalisation_injury_publication_sep2023.xlsx` | National annual total and 12 road-user categories | `national.csv`, `road_users.csv` |
| `state-and-territory-hospitalisation-injury-publication-2023.xlsx` | Eight jurisdictions and Australia, by year | `states.csv` |
| `First-Nations-hospitalised-injuries-2023.xlsx` | First Nations peoples, non-Indigenous Australians and Australia, by year | `first_nations.csv` |

These are selected views of the workbooks. The dashboard does not present every worksheet or combination of age, sex, remoteness, road user, counterparty and bed days.

## Extraction rules

Run `python3 tools/prepare_data.py` from the project folder after installing `openpyxl`. The script opens source workbooks read-only and records their SHA-256 hashes in `data/validation.json` so the exact inputs can be identified.

**National:** filter the `raw` worksheet to `Cause of injury = Traffic` in column D. Sum **Hospitalisations, column M**, by calendar year for the national total and by calendar year plus road user for the category series. Do not use `Count of cases` in column I or bed days. Check annual totals against T1 and all 12 road-user categories against T2.

**States and territories:** use only the first `raw` table, columns A:F. Sum column D, `count of cases excluding died in hospitals within 30 days`, by calendar year and state or territory. Adjacent tables describe overlapping breakdowns and must not be added to this table. Check the 88 jurisdiction-year totals against T1. Take Australia directly from T1 and cross-check it against the national workbook; do not derive Australia by adding the jurisdictions.

**First Nations:** use the published annual totals in T1. Independently sum the first raw age table, columns A:G, using **Hospitalisations in column F**, for each year and population group wherever all component cells are published. Read Australia from T1 and cross-check it against the national workbook.

The output row counts are 11 national totals, 132 road-user observations, 99 jurisdiction/Australia observations and 33 population-group/Australia observations. Each output uses one row per year and category, with integer hospitalisation counts.

## Suppression and validation

Unpublished cells such as `n.p.` stay missing, represented as empty CSV fields and `null` in the browser. They are never converted to zero. An aggregate containing an unpublished component is not treated as a fully observed raw sum.

Four raw age cells in the First Nations workbook are suppressed in 2014: two for each named group. The two affected raw annual reconciliations are recorded as skipped. Published T1 annual totals remain available and are used; suppressed age cells are not inferred from those totals.

The current validation report contains **288 passed checks and 0 failures**, plus the two explicit skips. Checks include coverage, agreement with published T1/T2 values and agreement between national totals in the three workbooks. All current exported counts are published values. This validation does not establish that every workbook dimension has been integrated or that the website has passed usability testing.

## Calculations shown on the page

- **Share of Australia:** selected count ÷ Australia's count in the same calendar year × 100.
- **Recorded annual change:** (selected-year count − previous-year count) ÷ previous-year count × 100. No percentage is shown when a required value is missing or zero, or when the comparison touches the selected jurisdiction's recording-break year.
- **Highest recorded count:** maximum published count within the selected series over 2011–2021; tied years are all listed.
- **Leading category:** largest published count among the categories in the selected year's bar chart.

The First Nations view's national share uses the full Australia total, including unknown Indigenous status. It is not the group's share of the two displayed groups combined.

## Interpretation limits

- These are hospitalisations, not unique people, deaths or population-adjusted rates. Larger counts alone do not establish higher individual risk.
- NSW has a recording break from June 2017; Victoria has a break from calendar year 2012. The line chart marks the break and uses dashed adjoining segments. Cross-break comparisons require care.
- Australia includes unrecorded or migratory/offshore residence. Jurisdiction totals may not sum to Australia.
- Australia includes Indigenous status not stated or inadequately described. The two named groups may not sum to Australia.
- Different group and jurisdiction population sizes affect count comparisons. No population denominator has been added to these views.
- A published 2023 release does not mean the observations describe 2023 or the present day.

## Downloads

The named dataset button downloads CSV data across the complete 2011–2021 period for the current view: all national road-user categories or the selected road user; the selected jurisdiction plus Australia; or both population groups plus Australia. The original Excel download is provided separately. Changing the selected year highlights an observation without shortening the exported period.
