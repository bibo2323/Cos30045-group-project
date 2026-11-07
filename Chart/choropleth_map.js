const AUSTRALIAN_STATES_URL = 'https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson';
const stateCodes = {
  'New South Wales': 'NSW',
  'Northern Territory': 'NT',
  Queensland: 'Qld',
  'South Australia': 'SA',
  Tasmania: 'Tas',
  Victoria: 'Vic',
  'Western Australia': 'WA',
  'Australian Capital Territory': 'ACT'
};

let australianStates;
function mapColor(intensity) {
  const colors = [[77, 157, 224], [215, 48, 31], [75, 31, 15]];
  const position = intensity * (colors.length - 1);
  const index = Math.min(Math.floor(position), colors.length - 2);
  const progress = position - index;
  const start = colors[index], end = colors[index + 1];
  return `rgb(${start.map((channel, i) => Math.round(channel + (end[i] - channel) * progress)).join(',')})`;
}

function loadAustralianStates() {
  if (!australianStates) {
    australianStates = fetch(AUSTRALIAN_STATES_URL).then(response => {
      if (!response.ok) throw new Error(`Unable to load Australian state boundaries (${response.status})`);
      return response.json();
    });
  }
  return australianStates;
}

window.renderChoroplethMap = function (data) {
  const { G20 } = window, svg = G20.clear('#mapChart'), [width, height] = G20.size(svg);
  const year = +document.querySelector('#q2Year').value, user = document.querySelector('#q2Select').value;
  const rows = data.filter(row => +row['calendar year'] === year && row['road user'] === user);
  const values = rows.map(row => G20.number(row['Percent share']));
  const max = Math.max(...values), min = Math.min(...values);

  document.querySelector('#q2YearValue').value = year;
  document.querySelector('#mapLegend').innerHTML = 
  '<span>Lower share</span><i style="background:#4d9de0"></i> <i style="background:#d7301f"></i><i style="background:#4b1f0f"></i><span>Higher share</span>';

  loadAustralianStates().then(geojson => {
    const projection = d3.geoMercator().fitExtent([[24, 18], [width - 24, height - 18]], geojson);
    const path = d3.geoPath(projection);
    const group = G20.svg('g', {}, svg);

    geojson.features.forEach(feature => {
      const stateName = feature.properties.STATE_NAME;
      const code = stateCodes[stateName];
      if (!code) return;
      const row = rows.find(item => item['state or territory'] === code);
      const value = G20.number(row?.['Percent share']);
      const intensity = max === min ? .5 : (value - min) / (max - min);
      const state = G20.svg('path', {
        d: path(feature),
        fill: mapColor(intensity),
        stroke: '#fff',
        'stroke-width': 1.5,
        'vector-effect': 'non-scaling-stroke',
        tabindex: 0,
        role: 'img',
        'aria-label': `${stateName}: ${G20.percent(value)}`
      }, group);

      const showTooltip = event => {
        const bounds = svg.getBoundingClientRect();
        const point = event.touches?.[0] || event;
        G20.tooltip(svg, `${stateName}: ${G20.percent(value)}`, point.clientX - bounds.left, point.clientY - bounds.top);
      };
      state.addEventListener('mouseenter', showTooltip);
      state.addEventListener('mousemove', showTooltip);
      state.addEventListener('focus', showTooltip);
      state.addEventListener('mouseleave', G20.hideTooltip);
      state.addEventListener('blur', G20.hideTooltip);
    });
  }).catch(error => {
    console.error(error);
    document.querySelector('#q2Insight').textContent = 'The map boundaries could not be loaded. Please check your connection and reload the page.';
  });

  const top = rows.slice().sort((a, b) => G20.number(b['Percent share']) - G20.number(a['Percent share']))[0];
  document.querySelector('#q2Insight').innerHTML = `In ${year}, <strong>${top?.['state name']}</strong> has the largest share of <strong>${user.toLowerCase()}</strong> injuries at ${G20.percent(G20.number(top?.['Percent share']))}.`;
};
