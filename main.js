/* Page controls and linked views. Chart rendering lives in the two chart modules. */
(() => {
  'use strict';
  const data = window.RoadInjury;
  const { YEARS, SERIES, JURISDICTIONS, formatNumber, isBreakYear } = data;
  const get = id => document.getElementById(id);
  const view = { state: 'NSW', year: 2021, showNational: true, sort: 'descending' };
  let lineChart;
  let barChart;

  JURISDICTIONS.forEach(state => get('stateSelect').add(new Option(state, state)));
  get('stateSelect').value = view.state;

  function updateSummary() {
    const index = YEARS.indexOf(view.year);
    const count = SERIES[view.state][index];
    const national = SERIES.Australia[index];
    get('focusLabel').textContent = `${view.state} · ${view.year}`;
    get('focusValue').textContent = formatNumber(count);
    get('nationalLabel').textContent = `Australia · ${view.year}`;
    get('nationalValue').textContent = formatNumber(national);
    get('selectedYear').value = view.year;
    get('yearRange').setAttribute('aria-valuetext', `${view.year}, calendar year`);
    get('comparisonYear').textContent = view.year;
    get('legendState').textContent = view.state;
    get('selectionBadge').textContent = `Selected: ${view.state} · ${view.year}`;
    get('downloadDatasetName').textContent = `Download ${view.state} & Australia road injury dataset ↓`;
    get('nationalLegend').hidden = !view.showNational;

  }

  function updateKeyPoints() {
    const index = YEARS.indexOf(view.year);
    const values = SERIES[view.state];
    const count = values[index];
    const national = SERIES.Australia[index];
    const peak = Math.max(...values);
    const peakYears = YEARS.filter((year, position) => values[position] === peak);
    const breakYear = YEARS.find(year => isBreakYear(view.state, year));

    get('keyPointsScope').textContent = `${view.state} · ${view.year}`;
    get('summaryCount').textContent = formatNumber(count);
    get('summaryShare').textContent = `${(count / national * 100).toFixed(1)}%`;
    get('summaryShareNote').textContent = `Out of ${formatNumber(national)} nationwide in ${view.year}.`;
    get('summaryPeak').textContent = formatNumber(peak);
    get('summaryPeakNote').textContent = `${peakYears.join(', ')} · highest across 2011–2021.`;
    get('summaryBreakNote').hidden = !breakYear;
    get('summaryBreakNote').textContent = breakYear
      ? `◇ ${view.state} recording changed in ${breakYear}. Compare across this break with care.`
      : '';

    get('summaryChangeLabel').textContent = index > 0 ? `Change from ${view.year - 1}` : 'Previous-year comparison';
    if (index === 0) {
      get('summaryChange').textContent = 'Not available';
      get('summaryChangeNote').textContent = 'The dataset starts in 2011.';
    } else if (isBreakYear(view.state, view.year) || isBreakYear(view.state, view.year - 1)) {
      // Avoid interpreting a change across or next to altered recording as a trend.
      get('summaryChange').textContent = 'Recording change';
      get('summaryChangeNote').textContent = 'These years need a cautious comparison.';
    } else {
      const previous = values[index - 1];
      const change = count - previous;
      const percent = change / previous * 100;
      get('summaryChange').textContent = `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(percent).toFixed(1)}%`;
      get('summaryChangeNote').textContent = change === 0
        ? `The same count as ${view.year - 1}.`
        : `${formatNumber(Math.abs(change))} ${change > 0 ? 'more' : 'fewer'} hospitalisations than ${view.year - 1}.`;
    }
  }

  function updateTable() {
    get('tableState').textContent = view.state;
    get('tableCaption').textContent = `${view.state} and Australia · annual road crash hospitalisations`;
    get('dataRows').replaceChildren(...YEARS.map((year, index) => {
      const row = document.createElement('tr');
      row.setAttribute('aria-current', String(year === view.year));
      row.dataset.year = String(year);
      row.className = 'year-row';
      const heading = document.createElement('th');
      heading.scope = 'row';
      const yearButton = document.createElement('button');
      yearButton.type = 'button';
      yearButton.className = 'year-select';
      yearButton.dataset.year = String(year);
      yearButton.textContent = `${year}${isBreakYear(view.state, year) ? ' ◇' : ''}`;
      yearButton.setAttribute('aria-label', `Select year ${year}`);
      yearButton.setAttribute('aria-pressed', String(year === view.year));
      heading.append(yearButton);
      row.append(heading);
      [SERIES[view.state][index], SERIES.Australia[index]].forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = formatNumber(value);
        row.append(cell);
      });
      return row;
    }));
  }

  function render() {
    updateSummary();
    updateKeyPoints();
    updateTable();
    lineChart?.update(view);
    barChart?.update(view);
  }

  // One delegated handler supports row clicks and native keyboard activation.
  get('dataRows').addEventListener('click', event => {
    const row = event.target.closest('tr[data-year]');
    if (!row || !get('dataRows').contains(row)) return;
    const year = Number(row.dataset.year);
    if (!YEARS.includes(year)) return;
    view.year = year;
    get('yearRange').value = year;
    render();
    // The table is rebuilt on render; keep keyboard focus on the chosen year.
    get('dataRows').querySelector(`button[data-year="${year}"]`).focus({ preventScroll: true });
  });

  get('stateSelect').addEventListener('change', event => {
    view.state = event.target.value;
    render();
  });
  get('yearRange').addEventListener('input', event => {
    view.year = Number(event.target.value);
    render();
  });
  get('showNational').addEventListener('change', event => {
    view.showNational = event.target.checked;
    render();
  });
  get('sortSelect').addEventListener('change', event => {
    view.sort = event.target.value;
    render();
  });
  get('compareChart').addEventListener('jurisdiction-select', event => {
    if (!JURISDICTIONS.includes(event.detail.state)) return;
    view.state = event.detail.state;
    get('stateSelect').value = view.state;
    render();
  });
  get('resetFilters').addEventListener('click', () => {
    Object.assign(view, { state: 'NSW', year: 2021, showNational: true, sort: 'descending' });
    get('stateSelect').value = view.state;
    get('yearRange').value = view.year;
    get('showNational').checked = view.showNational;
    get('sortSelect').value = view.sort;
    render();
  });

  get('downloadCsv').addEventListener('click', () => {
    const rows = [['Calendar year', 'Jurisdiction', 'Hospitalisations', 'Australia hospitalisations', 'Series note']];
    YEARS.forEach((year, index) => rows.push([
      year, view.state, SERIES[view.state][index], SERIES.Australia[index],
      isBreakYear(view.state, year) ? 'Break in series; see source workbook' : ''
    ]));
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `road-crash-hospitalisations-${view.state.toLowerCase().replaceAll(' ', '-')}-and-australia-2011-2021.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  if (typeof window.Chart === 'function') {
    try {
      lineChart = data.createLineChart(get('trendChart'));
      barChart = data.createHorizontalBarChart(get('compareChart'));
    } catch (error) {
      get('chartStatus').hidden = false;
      get('chartStatus').textContent = 'The charts could not be displayed. You can still explore the numbers in the data table or download the dataset.';
      console.error('Chart setup failed:', error);
    }
  } else {
    get('chartStatus').hidden = false;
    get('chartStatus').textContent = 'The chart library could not load. Check your connection and reload. The data table and dataset download are still available.';
  }
  render();
})();
