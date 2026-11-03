/* The CSVs are produced by tools/prepare_data.py; unpublished counts stay null. */
window.RoadInjury = {
  YEARS: Array.from({ length: 11 }, (_, index) => 2011 + index),
  JURISDICTIONS: ['NSW', 'Victoria', 'Queensland', 'South Australia', 'Western Australia', 'Tasmania', 'Northern Territory', 'ACT'],
  GROUPS: ['First Nations peoples', 'Non-Indigenous Australians'],
  colors: { focus: '#367bb5', secondary: '#7c91b5', bar: '#9cc8e8', ink: '#243b53', muted: '#526b82', grid: 'rgba(54,123,181,.12)' },
  formatNumber: number => Number.isFinite(number) ? new Intl.NumberFormat('en-AU').format(number) : 'Not published',
  isBreakYear: (state, year) => (state === 'NSW' && year === 2017) || (state === 'Victoria' && year === 2012),
  async loadData() {
    const count = value => {
      if (value === '' || value === 'n.p.') return null;
      if (!/^\d+$/.test(value)) throw new Error('Invalid count in prepared CSV.');
      return Number(value);
    };
    const parse = row => ({ ...row, year: Number(row.year), count: count(row.count) });
    const [states, national, roadUsers, firstNations] = await Promise.all([
      d3.csv('data/states.csv', parse), d3.csv('data/national.csv', parse),
      d3.csv('data/road_users.csv', parse), d3.csv('data/first_nations.csv', parse)
    ]);
    const unique = (rows, key) => new Set(rows.map(key)).size === rows.length;
    if (states.length !== 99 || national.length !== 11 || firstNations.length !== 33 || roadUsers.length !== 132 ||
        !unique(states, row => `${row.year}|${row.state}`) || !unique(national, row => row.year) ||
        !unique(firstNations, row => `${row.year}|${row.group}`) || !unique(roadUsers, row => `${row.year}|${row.road_user}`)) {
      throw new Error('Prepared CSV coverage or uniqueness check failed.');
    }
    const all = [...states, ...national, ...roadUsers, ...firstNations];
    if (all.some(row => !this.YEARS.includes(row.year))) throw new Error('Unexpected reporting year.');
    this.datasets = { states, national, roadUsers, firstNations };
    this.ROAD_USERS = [...new Set(roadUsers.map(row => row.road_user))];
    return this.datasets;
  }
};
