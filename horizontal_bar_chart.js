/* D3 v7 SVG comparison. All bars use a zero baseline; suppressed cells are labelled. */
(function () {
  'use strict';
  const app = window.RoadInjury = window.RoadInjury || {};
  app.createHorizontalBarChart = function createHorizontalBarChart(element) {
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
    const root = svg.append('g').attr('class', 'bar-chart-root');
    const tooltip = d3.select(parent).append('div').attr('class', 'chart-tooltip')
      .attr('role', 'tooltip').style('position', 'absolute').style('pointer-events', 'none')
      .style('font-size', '18px').style('max-width', 'calc(100% - 16px)').style('display', 'none');
    function hideTooltip() { tooltip.style('display', 'none'); }
    function showTooltip(event, datum) {
      tooltip.text(`${datum.fullLabel || datum.label} · ${config.year}: ${Number.isFinite(datum.value) ? `${format(datum.value)} hospitalisations` : 'Not published'}`)
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
      const items = config.items.slice().sort(config.sort === 'alphabetical'
        ? (a, b) => (a.fullLabel || a.label).localeCompare(b.fullLabel || b.label)
        : (a, b) => (Number.isFinite(b.value) ? b.value : -Infinity) - (Number.isFinite(a.value) ? a.value : -Infinity) || (a.fullLabel || a.label).localeCompare(b.fullLabel || b.label));
      const maxLabelLength = d3.max(items, d => d.label.length) || 0;
      const left = Math.min(width < 450 ? 121 : 180, Math.max(72, maxLabelLength * 9.3 + 16));
      const margin = { top: 7, right: width < 400 ? 68 : 83, bottom: 38, left };
      const plotWidth = Math.max(1, width - margin.left - margin.right);
      const plotHeight = Math.max(1, height - margin.top - margin.bottom);
      svg.attr('viewBox', `0 0 ${width} ${height}`)
        .attr('aria-label', `Hospitalisations by category in ${config.year}. Select a bar to update the dashboard. Exact values are in the data table.`);
      root.attr('transform', `translate(${margin.left},${margin.top})`);
      const x = d3.scaleLinear().domain([0, Math.max(1, d3.max(items, d => Number.isFinite(d.value) ? d.value : 0) || 0)]).nice(4).range([0, plotWidth]);
      const y = d3.scaleBand().domain(items.map(d => d.key)).range([0, plotHeight]).padding(.28);
      root.selectAll('.grid').data([null]).join('g').attr('class', 'grid')
        .attr('transform', `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).ticks(width < 450 ? 3 : 4).tickSize(-plotHeight).tickFormat(''))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('line').attr('stroke', colors.grid));
      root.selectAll('.x-axis').data([null]).join('g').attr('class', 'x-axis')
        .attr('transform', `translate(0,${plotHeight})`)
        .call(d3.axisBottom(x).ticks(width < 450 ? 3 : 4).tickSize(0).tickPadding(12).tickFormat(d3.format('~s')))
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('text').attr('fill', colors.muted).attr('font-size', 16).attr('font-family', 'inherit'));
      const rows = root.selectAll('.bar-row').data(items, d => d.key).join(
        enter => {
          const row = enter.append('g').attr('class', 'bar-row');
          row.append('rect').attr('class', 'row-hit-area');
          row.append('rect').attr('class', 'value-bar');
          row.append('text').attr('class', 'category-label');
          row.append('text').attr('class', 'value-label');
          row.append('title');
          return row;
        }
      ).order().attr('transform', d => `translate(0,${y(d.key)})`)
        .attr('role', 'button').attr('tabindex', 0).attr('aria-pressed', d => String(d.key === config.selectedKey))
        .attr('aria-label', d => `${d.fullLabel || d.label}, ${config.year}: ${Number.isFinite(d.value) ? `${format(d.value)} hospitalisations` : 'Not published'}. Select ${d.fullLabel || d.label}.`)
        .style('cursor', 'pointer')
        .on('pointerenter pointermove focus', showTooltip).on('pointerleave blur', hideTooltip)
        .on('click', (_, d) => { hideTooltip(); if (config.onSelect) config.onSelect(d.key); })
        .on('keydown', (event, d) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hideTooltip(); if (config.onSelect) config.onSelect(d.key); }
          if (event.key === 'Escape') hideTooltip();
        });
      rows.select('.row-hit-area').attr('x', -margin.left).attr('y', -3).attr('width', width).attr('height', y.bandwidth() + 6)
        .attr('rx', 5).attr('fill', d => d.key === config.selectedKey ? '#eef6fd' : 'transparent');
      const bars = rows.select('.value-bar').attr('x', 0).attr('y', 0).attr('height', y.bandwidth()).attr('rx', Math.min(5, y.bandwidth() / 2))
        .attr('fill', d => d.color || (d.key === config.selectedKey ? colors.focus : colors.bar))
        .attr('stroke', d => d.key === config.selectedKey ? colors.ink : colors.focus).attr('stroke-width', 1);
      bars.interrupt();
      const targetBars = animate && !reducedMotion.matches ? bars.transition().duration(180) : bars;
      targetBars.attr('width', d => Number.isFinite(d.value) ? x(d.value) : 0);
      rows.select('.category-label').attr('x', -10).attr('y', y.bandwidth() / 2).attr('dy', '.35em').attr('text-anchor', 'end')
        .attr('fill', colors.ink).attr('font-family', 'inherit').attr('font-size', 16)
        .attr('font-weight', d => d.key === config.selectedKey ? 700 : 500)
        .text(d => d.label);
      // Ellipsis retains readable type; full category is available on hover, focus and in the table.
      rows.select('.category-label').each(function (d) {
        const label = d3.select(this);
        let text = d.label;
        while (this.getComputedTextLength() > margin.left - 14 && text.length > 1) {
          text = text.slice(0, -1);
          label.text(`${text}…`);
        }
      });
      rows.select('.value-label').attr('x', d => Number.isFinite(d.value) ? x(d.value) + 8 : 8)
        .attr('y', y.bandwidth() / 2).attr('dy', '.35em').attr('fill', colors.ink).attr('font-size', 16).attr('font-family', 'inherit')
        .attr('font-weight', d => d.key === config.selectedKey ? 700 : 500)
        .text(d => Number.isFinite(d.value) ? format(d.value) : 'Not published');
      rows.select('title').text(d => `${d.fullLabel || d.label}: ${Number.isFinite(d.value) ? format(d.value) : 'Not published'}`);
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
