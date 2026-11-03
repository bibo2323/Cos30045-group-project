window.renderStackedAreaChart = function (data) {
  const { G20 } = window, svg = G20.clear('#areaChart'), [width, height] = G20.size(svg);
  const margin = { left: 48, right: 20, top: 20, bottom: 40 }, totals = G20.YEARS.map(year => G20.AGE_ORDER.map(age =>
    data.filter(row => +row['Calendar year'] === year && row['Age group'] === age)
      .reduce((sum, row) => sum + G20.number(row['Sum(Hospitalisations)']), 0)
  )), scale = (height - margin.top - margin.bottom) / Math.max(...totals.map(row => row.reduce((a, b) => a + b, 0)));
  let base = Array(11).fill(0);
  G20.AGE_ORDER.forEach((age, ageIndex) => {
    const top = totals.map((row, i) => base[i] + row[ageIndex]);
    const points = [...G20.YEARS.map((_, i) => [margin.left + (width - margin.left - margin.right) * i / 10, height - margin.bottom - top[i] * scale]), ...G20.YEARS.map((_, j) => { const i = 10 - j; return [margin.left + (width - margin.left - margin.right) * i / 10, height - margin.bottom - base[i] * scale]; })];
    G20.svg('path', { d: points.map((point, i) => `${i ? 'L' : 'M'}${point[0]},${point[1]}`).join(' ') + 'Z', fill: G20.COLORS[ageIndex], opacity: .9 }, svg);
    base = top;
  });
  G20.YEARS.forEach((year, i) => G20.svg('text', { x: margin.left + (width - margin.left - margin.right) * i / 10, y: height - 12, 'text-anchor': 'middle' }, svg).textContent = year);
  const selectedYear = +document.querySelector('#q5Year').value, current = totals[selectedYear - 2011], initial = totals[0];
  const share = values => values.slice(5).reduce((a, b) => a + b, 0) / values.reduce((a, b) => a + b, 0);
  document.querySelector('#q5YearValue').value = selectedYear;
  document.querySelector('#q5Insight').innerHTML = `In <strong>${selectedYear}</strong>, people aged 65 and over represent <strong>${G20.percent(share(current) * 100)}</strong> of records, compared with ${G20.percent(share(initial) * 100)} in 2011.`;
};
