window.renderScatterPlot = function (data) {
  const { G20 } = window, svg = G20.clear('#scatterChart'), [width, height] = G20.size(svg);
  const year = +document.querySelector('#q4Year').value, user = document.querySelector('#q4Select').value, rows = data.filter(row => +row['Calendar year'] === year && row['Road user group'] === user);
  const margin = { left: 52, right: 25, top: 20, bottom: 42 }, max = Math.max(...rows.map(row => G20.number(row['Average stay (days)'])), 1), step = (width - margin.left - margin.right) / (G20.AGE_ORDER.length - 1);
  G20.AGE_ORDER.forEach((age, i) => {
    const row = rows.find(item => item['Age group'] === age), value = G20.number(row?.['Average stay (days)']), x = margin.left + i * step, y = height - margin.bottom - (height - margin.top - margin.bottom) * value / max;
    G20.svg('line', { x1: x, x2: x, y1: height - margin.bottom, y2: y, class: 'grid-line' }, svg);
    const circle = G20.svg('circle', { cx: x, cy: y, r: 8, fill: G20.COLORS[3], class: 'dot' }, svg);
    circle.addEventListener('mouseenter', () => G20.tooltip(svg, `${age}: ${value.toFixed(1)} days`, x, y));
    circle.addEventListener('mouseleave', G20.hideTooltip);
    G20.svg('text', { x, y: height - 14, 'text-anchor': 'middle' }, svg).textContent = age;
  });
  document.querySelector('#q4YearValue').value = year;
  const longest = rows.slice().sort((a, b) => G20.number(b['Average stay (days)']) - G20.number(a['Average stay (days)']))[0];
  document.querySelector('#q4Insight').innerHTML = `For <strong>${user.toLowerCase()}</strong> injuries in ${year}, the <strong>${longest?.['Age group']}</strong> group has the longest average stay at ${G20.number(longest?.['Average stay (days)']).toFixed(1)} days.`;
};
