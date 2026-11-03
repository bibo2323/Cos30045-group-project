/* Three focused views share the same filters, D3 charts, table and summary. */
(async () => {
  'use strict';
  const app = window.RoadInjury;
  const { YEARS, JURISDICTIONS, GROUPS, colors, formatNumber: fmt, isBreakYear } = app;
  const get = id => document.getElementById(id);
  const view = { tab: 'national', year: 2021, state: 'NSW', roadUser: 'All road users', group: GROUPS[0], showComparison: true, sort: 'descending' };
  const shorts = { Victoria: 'Vic', Queensland: 'Qld', 'South Australia': 'SA', 'Western Australia': 'WA', Tasmania: 'Tas', 'Northern Territory': 'NT',
    'First Nations peoples': 'First Nations', 'Non-Indigenous Australians': 'Non-Indigenous',
    'Car unknown position': 'Car (unknown)', 'Heavy transport driver': 'Heavy driver', 'Heavy transport passenger': 'Heavy passenger',
    'Heavy transport unknown position': 'Heavy (unknown)', 'Pick-up truck or van occupant': 'Van / pick-up', 'Bus occupant': 'Bus occupant', 'Other or unknown': 'Other / unknown' };
  const short = name => shorts[name] || name;
  let data;
  let lineChart;
  let barChart;

  function series(rows, match) {
    const counts = new Map(rows.filter(match).map(row => [row.year, row.count]));
    return YEARS.map(year => ({ year, value: counts.get(year) ?? null }));
  }
  const at = values => values[YEARS.indexOf(view.year)].value;
  const nationalSeries = () => series(data.national, () => true);
  const stateSeries = state => series(data.states, row => row.state === state);
  const roadSeries = user => series(data.roadUsers, row => row.road_user === user);
  const groupSeries = group => series(data.firstNations, row => row.group === group);
  const breakFor = name => name === 'NSW' ? 2017 : name === 'Victoria' ? 2012 : undefined;

  function current() {
    if (view.tab === 'states') {
      return { key: view.state, name: view.state, values: stateSeries(view.state), breakYear: breakFor(view.state),
        comparison: { name: 'Australia', values: nationalSeries() },
        items: JURISDICTIONS.map(state => ({ key: state, label: short(state), fullLabel: state, value: at(stateSeries(state)) })) };
    }
    if (view.tab === 'first-nations') {
      const other = GROUPS.find(group => group !== view.group);
      return { key: view.group, name: view.group, values: groupSeries(view.group), comparison: { name: other, values: groupSeries(other) },
        items: GROUPS.map(group => ({ key: group, label: short(group), fullLabel: group, value: at(groupSeries(group)) })) };
    }
    const all = view.roadUser === 'All road users';
    return { key: view.roadUser, name: all ? 'Australia' : view.roadUser, values: all ? nationalSeries() : roadSeries(view.roadUser),
      comparison: all ? null : { name: 'Australia', values: nationalSeries() },
      items: app.ROAD_USERS.map(user => ({ key: user, label: short(user), fullLabel: user, value: at(roadSeries(user)) })) };
  }

  function populateSelector() {
    const values = view.tab === 'states' ? JURISDICTIONS : view.tab === 'first-nations' ? GROUPS : ['All road users', ...app.ROAD_USERS];
    get('stateSelect').replaceChildren(...values.map(value => new Option(value, value)));
    get('stateSelect').value = view.tab === 'states' ? view.state : view.tab === 'first-nations' ? view.group : view.roadUser;
    get('entityLabel').textContent = view.tab === 'states' ? 'State / territory' : view.tab === 'first-nations' ? 'Population group' : 'Road user';
  }

  function renderSummary(focus) {
    const index = YEARS.indexOf(view.year);
    const count = at(focus.values);
    const nationwide = at(nationalSeries());
    const valid = focus.values.filter(row => Number.isFinite(row.value));
    const peak = valid.length ? Math.max(...valid.map(row => row.value)) : null;
    const top = focus.items.filter(item => Number.isFinite(item.value)).sort((a, b) => b.value - a.value)[0];
    const scope = `${focus.name} · ${view.year}`;
    get('focusLabel').textContent = scope;
    get('focusValue').textContent = fmt(count);
    const nationalOverview = view.tab === 'national' && view.roadUser === 'All road users';
    get('nationalLabel').textContent = nationalOverview ? `Leading road user · ${view.year}` : `${focus.comparison?.name || 'Australia'} · ${view.year}`;
    get('nationalValue').textContent = fmt(nationalOverview ? top?.value : focus.comparison ? at(focus.comparison.values) : nationwide);
    get('secondMetricDetail').textContent = nationalOverview ? top?.fullLabel || '' : 'hospitalisations';
    get('selectedYear').value = view.year;
    get('yearRange').value = view.year;
    get('yearRange').setAttribute('aria-valuetext', `${view.year}, calendar year`);
    get('comparisonYear').textContent = view.year;
    get('selectionBadge').textContent = `Selected: ${scope}`;
    get('keyPointsScope').textContent = scope;
    get('summaryCount').textContent = fmt(count);
    get('summaryShareLabel').textContent = nationalOverview ? 'Leading road-user category' : "Share of Australia's total";
    get('summaryShare').textContent = nationalOverview ? top?.fullLabel || 'Not published' : Number.isFinite(count) && nationwide > 0 ? `${(count / nationwide * 100).toFixed(1)}%` : 'Not available';
    get('summaryShareNote').textContent = nationalOverview ? `${fmt(top?.value)} hospitalisations in ${view.year}.` : `Out of ${fmt(nationwide)} nationwide in ${view.year}.`;
    get('summaryPeak').textContent = fmt(peak);
    get('summaryPeakNote').textContent = peak === null ? 'No published observations.' : `${valid.filter(row => row.value === peak).map(row => row.year).join(', ')} · highest across 2011–2021.`;
    get('summaryChangeLabel').textContent = index ? `Recorded change from ${view.year - 1}` : 'Previous-year comparison';
    const previous = focus.values[index - 1]?.value;
    if (!index) {
      get('summaryChange').textContent = 'Not available';
      get('summaryChangeNote').textContent = 'The dataset starts in 2011.';
    } else if (focus.breakYear && (view.year === focus.breakYear || view.year - 1 === focus.breakYear)) {
      get('summaryChange').textContent = 'Recording change';
      get('summaryChangeNote').textContent = 'These years need a cautious comparison.';
    } else if (!Number.isFinite(count) || !Number.isFinite(previous) || previous === 0) {
      get('summaryChange').textContent = 'Not comparable';
      get('summaryChangeNote').textContent = 'A comparison value is missing or zero.';
    } else {
      const difference = count - previous;
      get('summaryChange').textContent = `${difference > 0 ? '+' : difference < 0 ? '−' : ''}${Math.abs(difference / previous * 100).toFixed(1)}%`;
      get('summaryChangeNote').textContent = `${fmt(Math.abs(difference))} ${difference >= 0 ? 'more' : 'fewer'} recorded hospitalisations than ${view.year - 1}.`;
    }
    get('summaryBreakNote').hidden = !focus.breakYear;
    get('summaryBreakNote').textContent = focus.breakYear ? `◇ ${focus.name} recording changed in ${focus.breakYear}. Compare across this break with care.` : '';
    if (view.tab === 'first-nations') {
      get('storyText').textContent = `${fmt(at(groupSeries(GROUPS[0])))} First Nations hospitalisations and ${fmt(at(groupSeries(GROUPS[1])))} non-Indigenous hospitalisations were recorded in ${view.year}. Population sizes differ, so these counts cannot establish which group has higher risk.`;
    } else if (view.tab === 'states') {
      get('storyText').textContent = `${top?.fullLabel || 'No jurisdiction'} recorded the highest published count in ${view.year}: ${fmt(top?.value)}. Counts are affected by population size and recording differences.`;
    } else {
      get('storyText').textContent = `${top?.fullLabel || 'No road user'} was the largest recorded road-user category in ${view.year}, with ${fmt(top?.value)} hospitalisations. Explore how the pattern changes across the decade.`;
    }
  }

  function annualColumns(focus) {
    if (view.tab === 'first-nations') return GROUPS.map(name => ({ name, values: groupSeries(name) })).concat({ name: 'Australia', values: nationalSeries() });
    if (view.tab === 'national' && view.roadUser === 'All road users') return [{ name: 'Australia', values: nationalSeries() }];
    return [{ name: focus.name, values: focus.values }, { name: 'Australia', values: nationalSeries() }];
  }

  function renderTables(focus) {
    const columns = annualColumns(focus);
    get('tableCaption').textContent = `${view.tab === 'first-nations' ? 'First Nations comparison' : focus.name} · annual hospitalisations`;
    const header = document.createElement('tr');
    ['Year', ...columns.map(column => column.name)].forEach(name => {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = name; header.append(cell);
    });
    get('dataHead').replaceChildren(header);
    get('dataRows').replaceChildren(...YEARS.map((year, index) => {
      const row = document.createElement('tr'); row.dataset.year = year; row.className = 'year-row';
      row.setAttribute('aria-current', String(year === view.year));
      const heading = document.createElement('th'); heading.scope = 'row';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'year-select'; button.dataset.year = year;
      button.textContent = `${year}${focus.breakYear === year ? ' ◇' : ''}`;
      button.setAttribute('aria-label', `Select year ${year}`); button.setAttribute('aria-pressed', String(year === view.year)); heading.append(button); row.append(heading);
      columns.forEach(column => { const cell = document.createElement('td'); cell.textContent = fmt(column.values[index].value); row.append(cell); });
      return row;
    }));
    get('categoryHeading').textContent = view.tab === 'national' ? 'Road user' : view.tab === 'states' ? 'State / territory' : 'Population group';
    get('comparisonCaption').textContent = `${view.year} · select a category to explore`;
    get('comparisonRows').replaceChildren(...focus.items.slice().sort(view.sort === 'alphabetical' ? (a, b) => a.fullLabel.localeCompare(b.fullLabel) : (a, b) => (b.value ?? -1) - (a.value ?? -1)).map(item => {
      const row = document.createElement('tr');
      const heading = document.createElement('th'); heading.scope = 'row';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'category-select'; button.dataset.key = item.key; button.textContent = item.fullLabel;
      button.setAttribute('aria-pressed', String(item.key === focus.key)); heading.append(button); row.append(heading);
      const cell = document.createElement('td'); cell.textContent = fmt(item.value); row.append(cell); return row;
    }));
  }

  function render() {
    const focus = current();
    get('app').dataset.topic = view.tab;
    document.querySelectorAll('[role=tab]').forEach(tab => { const selected = tab.dataset.topic === view.tab; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    get('explore').setAttribute('aria-labelledby', `tab-${view.tab}`);
    get('comparisonToggle').hidden = !focus.comparison;
    get('comparisonToggleLabel').textContent = view.tab === 'first-nations' ? `Show ${short(focus.comparison.name)}` : 'Show Australia';
    get('showNational').checked = view.showComparison;
    get('sortSelect').value = view.sort;
    get('compareTitle').textContent = view.tab === 'national' ? 'Road users' : view.tab === 'states' ? 'State comparison' : 'Population groups';
    get('trendNote').textContent = view.tab === 'states' ? '◇ Recording changed: NSW in 2017; Victoria in 2012. Compare across these years with care.' : view.tab === 'first-nations' ? 'Population sizes differ. Counts are not measures of individual risk.' : 'Recorded hospitalisations, not unique people. Changes in reporting can affect comparisons.';
    get('barNote').textContent = view.tab === 'first-nations' ? 'Select a group. Higher counts do not necessarily mean higher individual risk.' : `Select a bar to explore that ${view.tab === 'states' ? 'state or territory' : 'road user'}.`;
    document.querySelectorAll('[data-source-topic]').forEach(link => {
      if (link.dataset.sourceTopic === view.tab) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    get('sourceCaution').textContent = view.tab === 'first-nations' ? 'Australia includes Indigenous status not stated, so the two groups do not sum to Australia. Published annual totals are used; suppressed raw age cells are not reconstructed.' : view.tab === 'states' ? 'Australia includes unrecorded or migratory/offshore residence, so states may not sum to the national total. Counts are not population-adjusted risk.' : 'National raw data are filtered to Traffic hospitalisations. Road-user positions remain separate; unpublished values are missing, never zero.';
    get('downloadDatasetName').textContent = `Download ${view.tab === 'national' ? view.roadUser === 'All road users' ? 'National Road User' : view.roadUser + ' Road Injury' : view.tab === 'states' ? view.state + ' & Australia Road Injury' : 'First Nations Comparison'} Dataset ↓`;
    renderSummary(focus);
    renderTables(focus);
    lineChart.update({ year: view.year, series: [{ name: short(focus.name), color: colors.focus, values: focus.values, breakYear: focus.breakYear }, ...(focus.comparison && view.showComparison ? [{ name: short(focus.comparison.name), color: colors.secondary, values: focus.comparison.values }] : [])] });
    barChart.update({ year: view.year, items: focus.items, selectedKey: focus.key, sort: view.sort, onSelect: selectEntity });
  }

  function selectEntity(key) {
    if (view.tab === 'states' && JURISDICTIONS.includes(key)) view.state = key;
    else if (view.tab === 'first-nations' && GROUPS.includes(key)) view.group = key;
    else if (view.tab === 'national' && app.ROAD_USERS.includes(key)) view.roadUser = key;
    else return;
    get('stateSelect').value = key;
    render();
  }
  function selectTopic(topic) {
    if (!['national', 'states', 'first-nations'].includes(topic)) return;
    view.tab = topic; populateSelector(); render();
  }
  function download() {
    const focus = current();
    let rows;
    if (view.tab === 'national') {
      rows = [['Year', 'Road user', 'Hospitalisations', 'Australia hospitalisations'], ...data.roadUsers.filter(row => view.roadUser === 'All road users' || row.road_user === view.roadUser).map(row => [row.year, row.road_user, row.count, data.national.find(n => n.year === row.year).count])];
    } else {
      const columns = annualColumns(focus);
      rows = [['Year', ...columns.map(column => column.name), 'Note'], ...YEARS.map((year, index) => [year, ...columns.map(column => column.values[index].value), view.tab === 'first-nations' ? 'Australia includes Indigenous status not stated' : focus.breakYear === year ? 'Break in recording series' : ''])];
    }
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `${view.tab}-${focus.key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-hospitalisations-2011-2021.csv`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  get('retryLoad').addEventListener('click', () => window.location.reload());
  try {
    if (!window.d3) throw new Error('The local D3 library is missing.');
    data = await app.loadData();
    lineChart = app.createLineChart(get('trendChart')); barChart = app.createHorizontalBarChart(get('compareChart'));
    populateSelector();
    document.querySelectorAll('[role=tab]').forEach(tab => {
      tab.disabled = false;
      tab.addEventListener('click', () => selectTopic(tab.dataset.topic));
      tab.addEventListener('keydown', event => {
        const tabs = [...document.querySelectorAll('[role=tab]')]; const index = tabs.indexOf(tab);
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
        if (next >= 0) { event.preventDefault(); selectTopic(tabs[next].dataset.topic); tabs[next].focus(); }
      });
    });
    get('stateSelect').addEventListener('change', event => {
      if (view.tab === 'national') view.roadUser = event.target.value;
      else if (view.tab === 'states') view.state = event.target.value;
      else view.group = event.target.value;
      render();
    });
    get('yearRange').addEventListener('input', event => { view.year = Number(event.target.value); render(); });
    get('showNational').addEventListener('change', event => { view.showComparison = event.target.checked; render(); });
    get('sortSelect').addEventListener('change', event => { view.sort = event.target.value; render(); });
    get('resetFilters').addEventListener('click', () => { Object.assign(view, { year: 2021, state: 'NSW', roadUser: 'All road users', group: GROUPS[0], showComparison: true, sort: 'descending' }); populateSelector(); render(); });
    get('dataRows').addEventListener('click', event => {
      const row = event.target.closest('tr[data-year]'); if (!row) return;
      const year = Number(row.dataset.year); if (!YEARS.includes(year)) return;
      view.year = year; render(); get('dataRows').querySelector(`button[data-year="${year}"]`).focus({ preventScroll: true });
    });
    get('comparisonRows').addEventListener('click', event => {
      const button = event.target.closest('button[data-key]'); if (!button) return;
      const key = button.dataset.key; selectEntity(key);
      [...get('comparisonRows').querySelectorAll('button')].find(element => element.dataset.key === key)?.focus({ preventScroll: true });
    });
    get('downloadCsv').addEventListener('click', download); get('downloadCsv').disabled = false;
    get('filters').disabled = false; get('loadStatus').hidden = true; get('app').setAttribute('aria-busy', 'false'); render();
  } catch (error) {
    get('app').setAttribute('aria-busy', 'false'); get('loadStatus').hidden = false;
    get('loadStatus').textContent = 'The prepared datasets could not load. Open the site through a web server, check the data files, and retry. Original Excel downloads remain available below.';
    get('retryLoad').hidden = false; console.error('Dashboard load failed:', error);
  }
})();
