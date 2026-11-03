window.renderChoroplethMap = function (data) {
  const { G20 } = window, svg = G20.clear('#mapChart'), [width, height] = G20.size(svg);
  const year = +document.querySelector('#q2Year').value, user = document.querySelector('#q2Select').value;
  const rows = data.filter(row => +row['calendar year'] === year && row['road user'] === user);
  const values = rows.map(row => G20.number(row['Percent share'])), max = Math.max(...values), min = Math.min(...values);
  const states = [['WA', .10, .42, .29, .28], ['NT', .43, .15, .19, .28], ['Qld', .68, .17, .22, .30], ['SA', .36, .56, .27, .25], ['NSW', .66, .53, .2, .24], ['Vic', .59, .78, .16, .15], ['Tas', .67, .91, .11, .08], ['ACT', .77, .61, .07, .07]];
  states.forEach(([code, x, y, stateWidth, stateHeight]) => {
    const row = rows.find(item => item['state or territory'] === code), value = G20.number(row?.['Percent share']);
    const intensity = max === min ? .5 : (value - min) / (max - min), group = G20.svg('g', {}, svg);
    G20.svg('rect', { x: width * x, y: height * y, width: width * stateWidth, height: height * stateHeight, rx: 10, fill: `rgb(${220 - Math.round(120 * intensity)},${242 - Math.round(105 * intensity)},${232 - Math.round(50 * intensity)})`, stroke: '#fff', 'stroke-width': 3 }, group);
    G20.svg('text', { x: width * (x + stateWidth / 2), y: height * (y + stateHeight / 2), 'text-anchor': 'middle', 'font-weight': 700 }, group).textContent = code;
    group.addEventListener('mouseenter', () => G20.tooltip(svg, `${row?.['state name'] || code}: ${G20.percent(value)}`, width * (x + stateWidth / 2), height * y));
    group.addEventListener('mouseleave', G20.hideTooltip);
  });
  document.querySelector('#q2YearValue').value = year;
  document.querySelector('#mapLegend').innerHTML = '<span>Lower share</span><i style="background:#dcf2e8"></i><i style="background:#9cd4c7"></i><i style="background:#4b9d91"></i><span>Higher share</span>';
  const top = rows.slice().sort((a, b) => G20.number(b['Percent share']) - G20.number(a['Percent share']))[0];
  document.querySelector('#q2Insight').innerHTML = `In ${year}, <strong>${top?.['state name']}</strong> has the largest share of <strong>${user.toLowerCase()}</strong> injuries at ${G20.percent(G20.number(top?.['Percent share']))}.`;
};
