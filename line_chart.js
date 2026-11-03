/* D3 v7 SVG annual trend. Missing observations remain gaps, never zeroes. */
(function () {
  'use strict';
  const app = window.RoadInjury = window.RoadInjury || {};
  app.createLineChart = function createLineChart(element) {
    const d3 = window.d3;
    const svg = d3.select(element);
    const parent = element.parentElement;
    const colors = app.colors;
    const format = app.formatNumber;
    let config = null;
    let destroyed = false;
    let frame = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    svg.attr('role', 'group').attr('preserveAspectRatio', 'xMidYMid meet');
    const root = svg.append('g').attr('class', 'line-chart-root');
    const tooltip = d3.select(parent).append('div').attr('class', 'chart-tooltip')
      .attr('role', 'tooltip').style('position', 'absolute').style('pointer-events', 'none')
      .style('font-size', '18px').style('max-width', 'calc(100% - 16px)').style('display', 'none');

    function hideTooltip() { tooltip.style('display', 'none'); }
    function showTooltip(event, datum) {
      tooltip.text(`${datum.name} · ${datum.year}: ${format(datum.value)} hospitalisations${datum.isBreak ? ' · Recording changed this year' : ''}`)
        .style('display', 'block');
      const bounds = parent.getBoundingClientRect();
      const target = event.currentTarget.getBoundingClientRect();
      const pointer = event.type.startsWith('pointer');
      const pointX = pointer ? event.clientX : target.left + target.width / 2;
      const pointY = pointer ? event.clientY : target.top;
      const box = tooltip.node().getBoundingClientRect();
      tooltip.style('left', `${Math.max(8, Math.min(bounds.width - box.width - 8, pointX - bounds.left + 12))}px`)
        .style('top', `${Math.max(8, Math.min(bounds.height - box.height - 8, pointY - bounds.top - box.height - 12))}px`);
    }
    function render(animate) {
      if (!config || destroyed || !parent.getClientRects().length || parent.closest('[hidden]')) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width < 100 || height < 100) return;
      hideTooltip();
      const margin = { top: 43, right: 20, bottom: 38, left: width < 450 ? 57 : 66 };
      const plotWidth = Math.max(1, width - margin.left - margin.right);
      const plotHeight = Math.max(1, height - margin.top - margin.bottom);
      svg.attr('viewBox', `0 0 ${width} ${height}`)
        .attr('aria-label', `Annual hospitalisations, 2011 to 2021. ${config.series.map(s => s.name).join(' and ')}. Selected year ${config.year}. Exact values are in the data table.`);
      root.attr('transform', `translate(${margin.left},${margin.top})`);
      const all = config.series.flatMap(s => s.values).filter(d => Number.isFinite(d.value));
      const x = d3.scaleLinear().domain([2011, 2021]).range([0, plotWidth]);
      const y = d3.scaleLinear().domain([0, Math.max(1, d3.max(all, d => d.value) || 0)]).nice(4).range([plotHeight, 0]);
      const years = width < 450 ? [2011, 2015, 2019, 2021] : width < 720 ? [2011, 2013, 2015, 2017, 2019, 2021] : d3.range(2011, 2022);
      root.selectAll('.grid').data([null]).join('g').attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(4).tickSize(-plotWidth).tickFormat(''))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('line').attr('stroke', colors.grid));
      root.selectAll('.y-axis').data([null]).join('g').attr('class', 'y-axis')
        .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(9).tickFormat(d3.format('~s')));
      root.selectAll('.x-axis').data([null]).join('g').attr('class', 'x-axis')
        .attr('transform', `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format('d')).tickSize(0).tickPadding(12));
      root.selectAll('.x-axis .domain, .y-axis .domain').remove();
      root.selectAll('.x-axis text, .y-axis text').attr('fill', colors.muted).attr('font-size', 16).attr('font-family', 'inherit');
      root.selectAll('.year-guide').data([config.year]).join('line').attr('class', 'year-guide')
        .attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', 0).attr('y2', plotHeight)
        .attr('stroke', colors.secondary).attr('stroke-dasharray', '3 5').attr('opacity', .65);

      // Joining individual adjacent observations keeps straight segments and preserves missing gaps.
      const segments = [];
      const points = [];
      config.series.forEach((series, seriesIndex) => {
        const byYear = new Map(series.values.map(d => [d.year, d.value]));
        const values = d3.range(2011, 2022).map(year => ({ year, value: byYear.get(year) ?? null }));
        const color = series.color || (seriesIndex ? colors.secondary : colors.focus);
        values.forEach((datum, i) => {
          if (!Number.isFinite(datum.value)) return;
          points.push({ ...datum, key: `${series.name}-${datum.year}`, name: series.name, color, seriesIndex, isBreak: datum.year === series.breakYear });
          const previous = values[i - 1];
          if (previous && Number.isFinite(previous.value)) segments.push({ key: `${series.name}-${datum.year}`, from: previous, to: datum, color,
            dashed: seriesIndex > 0 || (series.breakYear && (datum.year === series.breakYear || previous.year === series.breakYear)) });
        });
      });
      root.selectAll('.trend-segment').data(segments, d => d.key).join('line').attr('class', 'trend-segment')
        .attr('x1', d => x(d.from.year)).attr('x2', d => x(d.to.year))
        .attr('y1', d => y(d.from.value)).attr('y2', d => y(d.to.value))
        .attr('stroke', d => d.color).attr('stroke-width', 2.5).attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', d => d.dashed ? '6 4' : null);
      const marks = root.selectAll('.trend-point').data(points, d => d.key).join('path').attr('class', 'trend-point')
        .attr('transform', d => `translate(${x(d.year)},${y(d.value)})`)
        .attr('d', d => d3.symbol().type(d.isBreak ? d3.symbolDiamond : d3.symbolCircle).size(d.year === config.year ? 135 : d.isBreak ? 85 : 45)())
        .attr('fill', d => d.seriesIndex ? '#fff' : d.color).attr('stroke', d => d.color).attr('stroke-width', 2)
        .attr('tabindex', 0).attr('role', 'img')
        .attr('aria-label', d => `${d.name}, ${d.year}: ${format(d.value)} hospitalisations${d.isBreak ? '. Recording changed this year' : ''}`)
        .on('pointerenter pointermove focus', showTooltip).on('pointerleave blur', hideTooltip)
        .on('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
      marks.selectAll('title').data(d => [d]).join('title').text(d => `${d.name}, ${d.year}: ${format(d.value)}${d.isBreak ? ' ◇ Recording change' : ''}`);
      const legend = root.selectAll('.series-legend').data(config.series, d => d.name).join('g').attr('class', 'series-legend');
      // Two short series labels share a single line; wide names wrap into separate rows.
      const stackLegend = config.series.length > 1 && width < 530;
      legend.attr('transform', (_, i) => `translate(${stackLegend ? 0 : i * plotWidth / Math.max(1, config.series.length)},${stackLegend ? -30 + i * 20 : -22})`);
      legend.selectAll('line').data((d, i) => [{ color: d.color || (i ? colors.secondary : colors.focus), dashed: i > 0 }]).join('line')
        .attr('x1', 0).attr('x2', 20).attr('stroke', d => d.color).attr('stroke-width', 3).attr('stroke-dasharray', d => d.dashed ? '6 4' : null);
      legend.selectAll('text').data(d => [d]).join('text').attr('x', 27).attr('y', 5).attr('fill', colors.ink)
        .attr('font-size', 16).attr('font-family', 'inherit').text(d => d.name);
      if (animate && !reducedMotion.matches) {
        marks.interrupt().attr('opacity', .45).transition().duration(180).attr('opacity', 1);
      }
    }
    const observer = new ResizeObserver(() => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = null; render(false); });
    });
    observer.observe(parent);
    return {
      update(next) { config = next; render(true); },
      destroy() { destroyed = true; observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); root.selectAll('*').interrupt(); root.remove(); tooltip.remove(); }
    };
  };
}());
