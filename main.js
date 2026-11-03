window.addEventListener('load', async () => {
  const { G20 } = window;
  try {
    const data = await G20.loadData();
    const users = [...new Set(data.line.map(row => row['Road user group']))];
    const mapUsers = [...new Set(data.map.map(row => row['road user']))]
      .filter(value => /Motor|Pedal|Pedestrian/.test(value));
    const scatterUsers = [...new Set(data.scatter.map(row => row['Road user group']))];
    G20.options('#q1Select', users);
    G20.options('#q2Select', mapUsers);
    G20.options('#q4Select', scatterUsers);
    document.querySelector('#heroTotal').textContent = G20.format(
      data.line.filter(row => +row['Calendar year'] === 2021)
        .reduce((total, row) => total + G20.number(row['Sum(Hospitalisations)']), 0)
    );

    function render() {
      window.renderMultiLineChart(data.line);
      window.renderChoroplethMap(data.map);
      window.renderStackedBarChart(data.remoteness);
      window.renderScatterPlot(data.scatter);
      window.renderStackedAreaChart(data.age);
    }

    ['q1Select', 'q2Select', 'q2Year', 'q3Year', 'q4Select', 'q4Year', 'q5Year']
      .forEach(id => document.getElementById(id).addEventListener('input', render));
    render();
    window.addEventListener('resize', render);
  } catch (error) {
    document.querySelector('.explore').insertAdjacentHTML(
      'afterbegin',
      '<p class="insight">The chart files could not be loaded. Please run the site through a local web server.</p>'
    );
    console.error(error);
  }
});
