#!/usr/bin/env python3
"""Prepare dashboard CSVs and verify them against the supplied AIHW workbooks.

Requires Python 3.9+ and openpyxl. Run from any directory:
    python tools/prepare_data.py
    python tools/prepare_data.py --dataset-dir /path/to/dataset

Only reads source workbooks; writes data/*.csv and data/validation.json.
Suppressed or unpublished values are None (empty CSV fields), never zero.
"""

import argparse
import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path

import openpyxl


YEARS = tuple(range(2011, 2022))
FILES = {
    "national": "hospitalisation_injury_publication_sep2023.xlsx",
    "states": "state-and-territory-hospitalisation-injury-publication-2023.xlsx",
    "first_nations": "First-Nations-hospitalised-injuries-2023.xlsx",
}
STATES = {
    "NSW": "NSW", "Vic": "Victoria", "Qld": "Queensland",
    "SA": "South Australia", "WA": "Western Australia", "Tas": "Tasmania",
    "NT": "Northern Territory", "ACT": "ACT",
}
FN_GROUPS = {
    "First Nations people": "First Nations peoples",
    "Non-Indigenous": "Non-Indigenous Australians",
}
UNPUBLISHED = {"n.p.", "np", "n/a", "na", "..", "...", "-", ""}


def count(value):
    """Reject unexpected cells rather than silently fabricating a value."""
    if value is None or (isinstance(value, str) and value.strip().lower() in UNPUBLISHED):
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"Unexpected count cell: {value!r}")
    if value < 0 or int(value) != value:
        raise ValueError(f"Invalid hospitalisation count: {value!r}")
    return int(value)


def year_rows(sheet, start, width):
    for row in sheet.iter_rows(min_row=start, max_col=width, values_only=True):
        if row[0] in YEARS:
            yield row


def complete_sum(values):
    """A sum with any suppressed cell is also unpublished."""
    return None if not values or any(v is None for v in values) else sum(values)


def write_csv(folder, name, fields, rows):
    with (folder / name).open("w", encoding="utf-8", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    return {"rows": len(rows), "fields": fields,
            "missing_counts": sum(row["count"] is None for row in rows)}


def prepare(dataset_dir, output_dir):
    checks = []

    def check(label, actual, expected):
        if actual != expected:
            raise ValueError(f"{label}: actual {actual!r} != published {expected!r}")
        checks.append(label)

    paths = {name: dataset_dir / filename for name, filename in FILES.items()}
    books = {name: openpyxl.load_workbook(path, read_only=True, data_only=True)
             for name, path in paths.items()}

    # The national raw sheet also contains unrelated trauma and medical events.
    # Use Traffic ONLY and Hospitalisations (M), not Count of cases (I) or bed days.
    national_published = {int(r[0]): count(r[1]) for r in year_rows(books["national"]["T1"], 3, 2)}
    road_header = next(books["national"]["T2"].iter_rows(min_row=2, max_row=2, max_col=14, values_only=True))
    road_names = [str(v).strip() for v in road_header[1:13]]
    road_published = {(int(r[0]), name): count(r[index + 1])
                      for r in year_rows(books["national"]["T2"], 3, 14)
                      for index, name in enumerate(road_names)}
    national_cells, road_cells = defaultdict(list), defaultdict(list)
    for row in books["national"]["raw"].iter_rows(min_row=2, max_col=13, values_only=True):
        if row[0] not in YEARS or row[3] != "Traffic":
            continue
        year, road_user, value = int(row[0]), row[6], count(row[12])
        if road_user not in road_names:
            raise ValueError(f"Unexpected Traffic road-user category: {road_user!r}")
        national_cells[year].append(value)
        road_cells[(year, road_user)].append(value)
    national = {y: complete_sum(national_cells[y]) for y in YEARS}
    road = {key: complete_sum(values) for key, values in road_cells.items()}
    check("National year coverage", sorted(national_published), list(YEARS))
    check("National road-user coverage", set(road), set(road_published))
    for year in YEARS:
        check(f"National raw vs T1: {year}", national[year], national_published[year])
        check(f"National T2 category sum vs T1: {year}",
              complete_sum([road_published[(year, name)] for name in road_names]), national[year])
        for name in road_names:
            check(f"National raw vs T2: {year}, {name}", road[(year, name)], road_published[(year, name)])

    # State raw consists of adjacent independent tables. Read ONLY its first A:F block.
    # Australia includes residence not recorded/offshore, and cannot be reconstructed
    # by summing the eight jurisdictions. Take Australia directly from published T1.
    state_published = {}
    for row in year_rows(books["states"]["T1"], 4, 10):
        year = int(row[0])
        for index, name in enumerate(STATES.values(), start=1):
            state_published[(year, name)] = count(row[index])
        check(f"State T1 Australia vs national T1: {year}", count(row[9]), national[year])
    state_cells = defaultdict(list)
    for row in books["states"]["raw"].iter_rows(min_row=3, max_col=6, values_only=True):
        if row[0] not in YEARS:
            continue
        if row[2] != "Traffic" or row[5] not in STATES:
            raise ValueError(f"Unexpected state raw row: {row!r}")
        state_cells[(int(row[0]), STATES[row[5]])].append(count(row[3]))
    states = {key: complete_sum(values) for key, values in state_cells.items()}
    check("State annual coverage", set(states), set(state_published))
    for key, expected in state_published.items():
        check(f"State raw vs T1: {key[0]}, {key[1]}", states[key], expected)

    # First Nations raw also has adjacent tables. Its first A:G block groups by age.
    # Some 2014 age cells are suppressed, so annual counts come from published T1.
    # We validate every fully published raw annual group sum, and report skipped
    # groups explicitly instead of filling suppressed age cells from annual totals.
    fn = {}
    for row in year_rows(books["first_nations"]["T1"], 4, 4):
        year = int(row[0])
        fn[(year, "First Nations peoples")] = count(row[1])
        fn[(year, "Non-Indigenous Australians")] = count(row[2])
        fn[(year, "Australia")] = count(row[3])
        check(f"First Nations T1 Australia vs national T1: {year}", count(row[3]), national[year])
    fn_cells = defaultdict(list)
    for row in books["first_nations"]["raw"].iter_rows(min_row=3, max_col=7, values_only=True):
        if row[0] not in YEARS:
            continue
        if row[2] != "Traffic" or row[3] not in FN_GROUPS:
            raise ValueError(f"Unexpected First Nations raw row: {row!r}")
        fn_cells[(int(row[0]), FN_GROUPS[row[3]])].append(count(row[5]))
    skipped = []
    for key, cells in fn_cells.items():
        raw_total = complete_sum(cells)
        if raw_total is None:
            skipped.append({"year": key[0], "group": key[1],
                            "reason": "Raw age cells include n.p.; published T1 annual count used.",
                            "suppressed_cells": sum(v is None for v in cells)})
        else:
            check(f"First Nations raw age sum vs T1: {key[0]}, {key[1]}", raw_total, fn[key])
    check("First Nations annual coverage", set(fn), {(y, group) for y in YEARS
          for group in ("First Nations peoples", "Non-Indigenous Australians", "Australia")})

    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "states.csv": write_csv(output_dir, "states.csv", ["year", "state", "count"],
                                [{"year": y, "state": s, "count": national[y] if s == "Australia" else states[(y, s)]}
                                 for y in YEARS for s in [*STATES.values(), "Australia"]]),
        "national.csv": write_csv(output_dir, "national.csv", ["year", "count"],
                                  [{"year": y, "count": national[y]} for y in YEARS]),
        "road_users.csv": write_csv(output_dir, "road_users.csv", ["year", "road_user", "count"],
                                    [{"year": y, "road_user": name, "count": road[(y, name)]}
                                     for y in YEARS for name in road_names]),
        "first_nations.csv": write_csv(output_dir, "first_nations.csv", ["year", "group", "count"],
                                       [{"year": y, "group": name, "count": fn[(y, name)]}
                                        for y in YEARS for name in [*FN_GROUPS.values(), "Australia"]]),
    }
    manifest = {
        "status": "PASS", "years": [2011, 2021], "release": 2023,
        "measure": "Road crash hospitalisations; counts, not population-adjusted rates or unique people.",
        "sources": {name: {"file": FILES[name], "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
                    for name, path in paths.items()},
        "preparation": {
            "national.csv": "national raw: filter Cause of injury = Traffic; sum Hospitalisations column M by calendar year; validated against T1.",
            "road_users.csv": "national raw: same Traffic measure, by year and all 12 T2 road-user categories; validated against T2.",
            "states.csv": "states raw first A:F table: sum count excluding died in hospital within 30 days by year and state. Australia from T1 (cross-checked with national T1).",
            "first_nations.csv": "First Nations published T1 annual totals. Validate against raw first A:G age table where no suppressed cells; Australia cross-checked against national T1.",
        },
        "outputs": outputs,
        "checks": {"passed": len(checks), "failed": 0, "details": checks,
                   "raw_reconciliation_skipped": skipped},
        "notes": [
            "n.p. and other unpublished count markers stay null (empty CSV fields), never zero; no suppressed cell values inferred.",
            "Current exported annual/T2 summary counts are all published; selected outputs contain no null count cells.",
            "Only the required raw table block is aggregated; adjacent raw tables describe overlapping populations and must not be combined.",
            "Australia includes unrecorded or migratory/offshore residence; eight state totals need not sum to Australia.",
            "Australia includes First Nations status not stated or inadequately described; the two named groups need not sum to Australia.",
            "NSW series break from June 2017; Victoria series break from calendar year 2012. Comparisons across breaks require care.",
            "No population denominators are supplied to these views. Differences in counts must not be described as differences in individual risk.",
            "First Nations 2014 raw age totals cannot be fully reconciled because four component cells are suppressed; published T1 totals are used without reconstructing cells.",
        ],
    }
    (output_dir / "validation.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for book in books.values():
        book.close()
    return manifest


def main():
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, default=root / "dataset")
    parser.add_argument("--output-dir", type=Path, default=root / "data")
    args = parser.parse_args()
    result = prepare(args.dataset_dir, args.output_dir)
    print(json.dumps({"status": result["status"], "outputs": result["outputs"],
                      "checks_passed": result["checks"]["passed"],
                      "raw_group_sums_skipped": len(result["checks"]["raw_reconciliation_skipped"])}, indent=2))


if __name__ == "__main__":
    main()
