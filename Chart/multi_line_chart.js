window.renderMultiLineChart = function (data) {
  const { G20 } = window, svg = G20.clear('#lineChart'), [width, height] = G20.size(svg);
  const margin = { left: 52, right: 20, top: 20, bottom: 38 };
  const users = [...new Set(data.map(row => row['Road user group']))];
  const selected = document.querySelector('#q1Select').value;
  const max = Math.max(...data.map(row => G20.number(row['Sum(Hospitalisations)'])));
  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + (height - margin.top - margin.bottom) * i / 4;
    G20.svg('line', { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: 'grid-line' }, svg);
    G20.svg('text', { x: margin.left - 9, y: y + 4, 'text-anchor': 'end' }, svg).textContent = G20.format(max * (1 - i / 4));
  }
  users.forEach((user, userIndex) => {
    const rows = G20.YEARS.map(year => data.find(row => +row['Calendar year'] === year && row['Road user group'] === user));
    const points = rows.map((row, i) => [
      margin.left + (width - margin.left - margin.right) * i / 10,
      height - margin.bottom - (height - margin.top - margin.bottom) * G20.number(row?.['Sum(Hospitalisations)']) / max
    ]);
    G20.svg('polyline', { points: points.map(point => point.join(',')).join(' '), class: `line ${user === selected ? '' : 'muted'}`, stroke: G20.COLORS[userIndex] }, svg);
    points.forEach((point, i) => {
      const circle = G20.svg('circle', { cx: point[0], cy: point[1], r: user === selected ? 4 : 2.5, class: 'dot', fill: G20.COLORS[userIndex] }, svg);
      circle.addEventListener('mouseenter', () => G20.tooltip(svg, `${user} · ${G20.YEARS[i]}: ${G20.format(G20.number(rows[i]?.['Sum(Hospitalisations)']))}`, point[0], point[1]));
      circle.addEventListener('mouseleave', G20.hideTooltip);
    });
  });
  G20.YEARS.forEach((year, i) => G20.svg('text', { x: margin.left + (width - margin.left - margin.right) * i / 10, y: height - 12, 'text-anchor': 'middle' }, svg).textContent = year);
  const selectedRows = data.filter(row => row['Road user group'] === selected);
  const first = G20.number(selectedRows[0]?.['Sum(Hospitalisations)']), last = G20.number(selectedRows.at(-1)?.['Sum(Hospitalisations)']);
  document.querySelector('#q1Insight').innerHTML = `<strong>${selected}</strong> hospitalisations ${last >= first ? 'rose' : 'fell'} from ${G20.format(first)} in 2011 to ${G20.format(last)} in 2021 (${last >= first ? '+' : ''}${G20.percent((last / first - 1) * 100)}).`;
};
