/* Annual hospitalisations chart. Data is supplied by load_data.js. */
(function () {
  'use strict';
  const data = window.RoadInjury;
  const { YEARS, SERIES, colors, formatNumber } = data;
  const fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const breaks = { NSW: 2017, Victoria: 2012 };

  data.createLineChart = function (canvas) {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let view = { state: 'NSW', year: 2021, showNational: true };
    const selectedYear = {
      id: 'selectedYear',
      beforeDatasetsDraw(chart) {
        const index = YEARS.indexOf(Number(view.year));
        if (index < 0 || !chart.chartArea) return;
        const x = chart.scales.x.getPixelForValue(index);
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.strokeStyle = 'rgba(66,123,114,0.24)';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      }
    };
    function focusFill(context) {
      const { ctx, chartArea } = context.chart;
      if (!chartArea) return 'rgba(137,181,166,0.10)';
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, 'rgba(137,181,166,0.30)');
      gradient.addColorStop(1, 'rgba(137,181,166,0.01)');
      return gradient;
    }
    function dataset(state, national) {
      return {
        label: state,
        data: SERIES[state].slice(),
        borderColor: national ? colors.lavender : colors.teal,
        backgroundColor: national ? 'transparent' : focusFill,
        fill: !national,
        borderWidth: national ? 2 : 2.5,
        tension: 0,
        pointRadius: context => {
          const year = YEARS[context.dataIndex];
          return year === breaks[state] ? 6 : year === Number(view.year) ? 5 : national ? 2 : 3;
        },
        pointStyle: context => YEARS[context.dataIndex] === breaks[state] ? 'rectRot' : 'circle',
        pointBackgroundColor: national ? colors.lavender : colors.teal,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 7,
        // The dashed join calls attention to a break in comparability.
        segment: {
          borderDash: context => YEARS[context.p1DataIndex] === breaks[state] ? [5, 5] : undefined
        }
      };
    }
    const chart = new Chart(canvas, {
      type: 'line',
      data: { labels: YEARS, datasets: [] },
      plugins: [selectedYear],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: motion.matches ? 0 : 350 },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 12, right: 12 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.ink,
            titleColor: '#ffffff',
            bodyColor: '#f1f7f3',
            footerColor: '#dfd7f2',
            padding: 13,
            cornerRadius: 10,
            displayColors: true,
            titleFont: { family: fontFamily, size: 18 },
            bodyFont: { family: fontFamily, size: 18 },
            footerFont: { family: fontFamily, size: 16, weight: 'normal' },
            callbacks: {
              title: items => items.length ? String(YEARS[items[0].dataIndex]) : '',
              label: context => `${context.dataset.label}: ${formatNumber(context.parsed.y)}`,
              footer: items => items.some(item => YEARS[item.dataIndex] === breaks[item.dataset.label])
                ? ['◆ Recording changed this year.'] : ''
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: colors.muted, font: { family: fontFamily, size: 16 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 4, padding: 10 }
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.grid, drawTicks: false },
            border: { display: false },
            title: { display: true, text: 'Hospitalisations', color: colors.muted, font: { family: fontFamily, size: 16 } },
            ticks: { color: colors.muted, font: { family: fontFamily, size: 16 }, maxTicksLimit: 5, callback: value => formatNumber(value), padding: 8 }
          }
        }
      }
    });
    function update(nextView) {
      view = { ...view, ...nextView };
      chart.data.datasets = [
        ...(view.showNational ? [dataset('Australia', true)] : []),
        dataset(view.state, false)
      ];
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Annual road injury hospitalisations in ${view.state}${view.showNational ? ' and Australia' : ''}, ${YEARS[0]} to ${YEARS[YEARS.length - 1]}. Highlighted year: ${view.year}.${breaks[view.state] ? ` Data series break in ${breaks[view.state]}.` : ''}`);
      chart.options.animation.duration = motion.matches ? 0 : 350;
      chart.update();
    }
    const motionChange = () => { chart.options.animation.duration = motion.matches ? 0 : 350; chart.update('none'); };
    motion.addEventListener('change', motionChange);
    return { update, destroy() { motion.removeEventListener('change', motionChange); chart.destroy(); } };
  };
}());
