/* State and territory comparison. Click a bar to select a jurisdiction. */
(function () {
  'use strict';
  const data = window.RoadInjury;
  const { YEARS, SERIES, SHORT, JURISDICTIONS, colors, formatNumber } = data;
  const fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  data.createHorizontalBarChart = function (canvas) {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let names = JURISDICTIONS.slice();
    let view = { state: 'NSW', year: 2021, sort: 'descending' };
    function barFill(context) {
      const selected = names[context.dataIndex] === view.state;
      const { ctx, chartArea } = context.chart;
      if (!chartArea) return selected ? colors.lavender : colors.mint;
      const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
      gradient.addColorStop(0, selected ? '#c2b9de' : '#b4d4c7');
      gradient.addColorStop(1, selected ? colors.lavender : colors.mint);
      return gradient;
    }
    const chart = new Chart(canvas, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Hospitalisations', data: [], backgroundColor: barFill, borderRadius: 6, borderSkipped: false, maxBarThickness: 30, categoryPercentage: 0.75, barPercentage: 0.85 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: motion.matches ? 0 : 350 },
        layout: { padding: { right: 12, top: 4 } },
        onClick(event, elements) {
          if (elements.length) canvas.dispatchEvent(new CustomEvent('jurisdiction-select', { detail: { state: names[elements[0].index] }, bubbles: true }));
        },
        onHover(event, elements) { canvas.style.cursor = elements.length ? 'pointer' : 'default'; },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.ink,
            titleColor: '#ffffff',
            bodyColor: '#f1f7f3',
            padding: 13,
            cornerRadius: 10,
            titleFont: { family: fontFamily, size: 18 },
            bodyFont: { family: fontFamily, size: 18 },
            callbacks: {
              title: items => items.length ? `${names[items[0].dataIndex]} · ${view.year}` : '',
              label: context => `${formatNumber(context.parsed.x)} hospitalisations`,
              afterLabel: () => 'Click to select'
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: colors.grid, drawTicks: false },
            border: { display: false },
            title: { display: true, text: 'Hospitalisations', color: colors.muted, font: { family: fontFamily, size: 16 } },
            ticks: { color: colors.muted, font: { family: fontFamily, size: 16 }, maxTicksLimit: 4, callback: value => formatNumber(value), padding: 8 }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: colors.ink, font: { family: fontFamily, size: 16 }, padding: 8 }
          }
        }
      }
    });
    function update(nextView) {
      view = { ...view, ...nextView };
      const index = YEARS.indexOf(Number(view.year));
      names = JURISDICTIONS.slice().sort(view.sort === 'alphabetical'
        ? (a, b) => a.localeCompare(b)
        : (a, b) => SERIES[b][index] - SERIES[a][index] || a.localeCompare(b));
      chart.data.labels = names.map(name => SHORT[name]);
      chart.data.datasets[0].data = names.map(name => SERIES[name][index]);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Road injury hospitalisations by Australian state and territory in ${view.year}, sorted ${view.sort === 'alphabetical' ? 'alphabetically' : 'from highest to lowest'}. ${view.state} is highlighted. Use the jurisdiction selector for keyboard access.`);
      chart.options.animation.duration = motion.matches ? 0 : 350;
      chart.update();
    }
    const motionChange = () => { chart.options.animation.duration = motion.matches ? 0 : 350; chart.update('none'); };
    motion.addEventListener('change', motionChange);
    return { update, destroy() { motion.removeEventListener('change', motionChange); chart.destroy(); } };
  };
}());
