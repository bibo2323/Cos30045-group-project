window.renderStackedBarChart = function (data) {
  const { G20 } = window, svg = G20.clear('#stackedChart'), [width, height] = G20.size(svg);
  const year = +document.querySelector('#q3Year').value, groups = ['First Nations people', 'Non-Indigenous'], areas = ['Major Cities', 'Regional', 'Remote'];
  const chartLeft = width < 600 ? 100 : 180, chartRight = 30, groupGap = width < 600 ? 30 : 80;
  const barWidth = Math.max(60, (width - chartLeft - chartRight - groupGap) / 2);
  groups.forEach((group, groupIndex) => {
    const x = chartLeft + groupIndex * (barWidth + groupGap); let offset = 0;
    areas.forEach((area, areaIndex) => {
      const row = data.find(item => +item['Calendar year'] === year && item['First Nations status'] === group && item['ABS remoteness area'] === area);
      const segmentHeight = (height - 85) * G20.number(row?.['Percent share']) / 100;
      G20.svg('rect', { x, y: height - 55 - offset - segmentHeight, width: barWidth, height: segmentHeight, fill: G20.COLORS[areaIndex] }, svg);
      offset += segmentHeight;
    });
    G20.svg('text', { x: x + barWidth / 2, y: height - 15, 'text-anchor': 'middle', 'font-weight': 700 }, svg).textContent = group === 'First Nations people' ? 'First Nations' : group;
  });
  areas.forEach((area, i) => { G20.svg('rect', { x: 18, y: 30 + i * 25, width: 12, height: 12, fill: G20.COLORS[i], rx: 3 }, svg); G20.svg('text', { x: 36, y: 40 + i * 25 }, svg).textContent = area; });
  document.querySelector('#q3YearValue').value = year;
  const remote = status => data.find(row => +row['Calendar year'] === year && row['First Nations status'] === status && row['ABS remoteness area'] === 'Remote');
  document.querySelector('#q3Insight').innerHTML = `In ${year}, remote areas account for <strong>${G20.percent(G20.number(remote('First Nations people')?.['Percent share']))}</strong> of First Nations hospitalisations versus <strong>${G20.percent(G20.number(remote('Non-Indigenous')?.['Percent share']))}</strong> for non-Indigenous people.`;
};
