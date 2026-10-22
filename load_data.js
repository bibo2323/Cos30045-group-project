/*
 * Source: dataset/state-and-territory-hospitalisation-injury-publication-2023.xlsx
 * Table T1, rows 4–14. AIHW National Hospital Morbidity Database, September 2023.
 * Values are hospitalisation counts, not rates or distinct people.
 * This curated snapshot is loaded as a plain script; no server-side Excel parsing.
 */
window.RoadInjury = {
  YEARS: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
  SERIES: {
    NSW: [10618, 11121, 11421, 11313, 11084, 11474, 11016, 9794, 9942, 9274, 9003],
    Victoria: [9326, 8098, 7784, 8523, 9198, 10360, 10794, 11453, 11392, 9884, 11130],
    Queensland: [6322, 6813, 7821, 7725, 8306, 8702, 9134, 9381, 9515, 9801, 10447],
    'South Australia': [2359, 2311, 2221, 2381, 2467, 2654, 2394, 2489, 2457, 2503, 2632],
    'Western Australia': [3442, 3493, 3475, 3154, 3183, 3031, 3195, 3274, 3534, 3636, 3568],
    Tasmania: [493, 536, 570, 646, 677, 657, 659, 781, 708, 778, 805],
    'Northern Territory': [456, 496, 561, 575, 691, 709, 703, 832, 656, 787, 710],
    ACT: [537, 601, 573, 542, 700, 654, 632, 712, 665, 629, 740],
    Australia: [34033, 34024, 35001, 35515, 37082, 38963, 39339, 39590, 39866, 37966, 39505]
  },
  SHORT: {
    NSW: 'NSW', Victoria: 'Vic', Queensland: 'Qld', 'South Australia': 'SA',
    'Western Australia': 'WA', Tasmania: 'Tas', 'Northern Territory': 'NT', ACT: 'ACT',
    Australia: 'Australia'
  },
  JURISDICTIONS: ['NSW', 'Victoria', 'Queensland', 'South Australia', 'Western Australia', 'Tasmania', 'Northern Territory', 'ACT'],
  colors: {
    teal: '#427b72', mint: '#89b5a6', lavender: '#a59bc9', ink: '#293f3b',
    muted: '#667b74', grid: 'rgba(76,107,93,0.10)'
  },
  formatNumber: number => new Intl.NumberFormat('en-AU').format(number),
  isBreakYear: (state, year) => (state === 'NSW' && year === 2017) || (state === 'Victoria' && year === 2012)
};
