/**
 * Charts Module - Chart.js integration for visualizations
 */

let chartVotesComparison = null;
let chartWinRate = null;
let chartStrengthByRegion = null;
let chartComparativeByMunicipality = null;

/**
 * Initialize Resumo tab charts
 */
function initializeResumoCharts() {
    console.log('Initializing resumo charts...');

    const data2010 = appState.data.municipalities[2010];
    const data2018 = appState.data.municipalities[2018];

    // Calculate EB votes and win rates
    let ebVotes2010 = 0, ebVotes2018 = 0;
    let totalVotes2010 = 0, totalVotes2018 = 0;
    let ebWins2010 = 0, ebWins2018 = 0;
    let totalSections2010 = 0, totalSections2018 = 0;

    if (data2010) {
        data2010.forEach(mun => {
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            if (ebData) {
                ebVotes2010 += ebData.votes || 0;
            }
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
            totalVotes2010 += totalVotes;
        });
        totalSections2010 = appState.data.sections[2010] ? Object.keys(appState.data.sections[2010]).length : 0;
    }

    if (data2018) {
        data2018.forEach(mun => {
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            if (ebData) {
                ebVotes2018 += ebData.votes || 0;
            }
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
            totalVotes2018 += totalVotes;
        });
        totalSections2018 = appState.data.sections[2018] ? Object.keys(appState.data.sections[2018]).length : 0;
    }

    // Calculate win rate (sections where EB was elected - rank 1)
    if (appState.data.sections[2010]) {
        Object.values(appState.data.sections[2010]).forEach(section => {
            const senator1 = section.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            if (ebData && ebData.rank === 1) {
                ebWins2010++;
            }
        });
    }

    if (appState.data.sections[2018]) {
        Object.values(appState.data.sections[2018]).forEach(section => {
            const senator1 = section.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            if (ebData && ebData.rank === 1) {
                ebWins2018++;
            }
        });
    }

    // Chart 1: Votes Comparison (Absolute and Percentage)
    createVotesComparisonChart(ebVotes2010, ebVotes2018, totalVotes2010, totalVotes2018);

    // Chart 2: Win Rate (Donut)
    createWinRateChart(ebWins2010, totalSections2010, ebWins2018, totalSections2018);

    // Chart 3: Strength by Region
    createStrengthByRegionChart();

    console.log('✓ Resumo charts initialized');
}

/**
 * Create votes comparison bar chart
 */
function createVotesComparisonChart(ebVotes2010, ebVotes2018, totalVotes2010, totalVotes2018) {
    const ctx = document.getElementById('chartVotesComparison');
    if (!ctx) return;

    const pct2010 = totalVotes2010 > 0 ? ((ebVotes2010 / totalVotes2010) * 100).toFixed(2) : 0;
    const pct2018 = totalVotes2018 > 0 ? ((ebVotes2018 / totalVotes2018) * 100).toFixed(2) : 0;

    if (chartVotesComparison) chartVotesComparison.destroy();

    chartVotesComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Votos Absolutos', 'Percentual (%)'],
            datasets: [
                {
                    label: '2010',
                    data: [ebVotes2010, pct2010],
                    backgroundColor: '#8b4513',
                    borderColor: '#654321',
                    borderWidth: 1
                },
                {
                    label: '2018',
                    data: [ebVotes2018, pct2018],
                    backgroundColor: '#2c5aa0',
                    borderColor: '#1a3a52',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.datasetIndex === 0) {
                                label += context.parsed.y.toLocaleString('pt-BR');
                            } else {
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Create win rate donut chart
 */
function createWinRateChart(ebWins2010, totalSections2010, ebWins2018, totalSections2018) {
    const ctx = document.getElementById('chartWinRate');
    if (!ctx) return;

    const ebWinPct2010 = totalSections2010 > 0 ? ((ebWins2010 / totalSections2010) * 100).toFixed(1) : 0;
    const ebWinPct2018 = totalSections2018 > 0 ? ((ebWins2018 / totalSections2018) * 100).toFixed(1) : 0;

    const othersPct2010 = 100 - ebWinPct2010;
    const othersPct2018 = 100 - ebWinPct2018;

    if (chartWinRate) chartWinRate.destroy();

    chartWinRate = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['EB Eleito', 'Outro Candidato'],
            datasets: [
                {
                    label: '2010',
                    data: [ebWinPct2010, othersPct2010],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderColor: ['#1e8449', '#c0392b'],
                    borderWidth: 1
                },
                {
                    label: '2018',
                    data: [ebWinPct2018, othersPct2018],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderColor: ['#1e8449', '#c0392b'],
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create strength by region (calha) bar chart
 */
function createStrengthByRegionChart() {
    const ctx = document.getElementById('chartStrengthByRegion');
    if (!ctx) return;

    // Aggregate EB votes by region for both years
    const regionData2010 = {};
    const regionData2018 = {};
    const regionTotals2010 = {};
    const regionTotals2018 = {};

    if (appState.data.municipalities[2010]) {
        appState.data.municipalities[2010].forEach(mun => {
            const region = mun.region || 'Outros';
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);

            regionData2010[region] = (regionData2010[region] || 0) + (ebData?.votes || 0);
            regionTotals2010[region] = (regionTotals2010[region] || 0) + totalVotes;
        });
    }

    if (appState.data.municipalities[2018]) {
        appState.data.municipalities[2018].forEach(mun => {
            const region = mun.region || 'Outros';
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);

            regionData2018[region] = (regionData2018[region] || 0) + (ebData?.votes || 0);
            regionTotals2018[region] = (regionTotals2018[region] || 0) + totalVotes;
        });
    }

    // Get all regions and sort
    const allRegions = new Set([...Object.keys(regionData2010), ...Object.keys(regionData2018)]);
    const regions = Array.from(allRegions).sort();

    // Calculate percentages
    const pct2010 = regions.map(r =>
        regionTotals2010[r] > 0 ? ((regionData2010[r] || 0) / regionTotals2010[r] * 100).toFixed(1) : 0
    );
    const pct2018 = regions.map(r =>
        regionTotals2018[r] > 0 ? ((regionData2018[r] || 0) / regionTotals2018[r] * 100).toFixed(1) : 0
    );

    if (chartStrengthByRegion) chartStrengthByRegion.destroy();

    chartStrengthByRegion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [
                {
                    label: '2010 (%)',
                    data: pct2010,
                    backgroundColor: '#8b4513',
                    borderColor: '#654321',
                    borderWidth: 1
                },
                {
                    label: '2018 (%)',
                    data: pct2018,
                    backgroundColor: '#2c5aa0',
                    borderColor: '#1a3a52',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Comparativo tab charts
 */
function initializeComparativeCharts() {
    console.log('Initializing comparative charts...');

    const municipalities2010 = appState.data.municipalities[2010] || [];
    const municipalities2018 = appState.data.municipalities[2018] || [];

    // Sort by EB votes in 2018 descending
    const munDataWithVotes = municipalities2010.map(mun2010 => {
        const mun2018 = municipalities2018.find(m => m.name === mun2010.name);
        const senator2010 = mun2010.results.senator1 || [];
        const senator2018 = (mun2018?.results.senator1) || [];

        const ebVotes2010 = senator2010.find(s => s.name && s.name.toUpperCase().includes('BRAGA'))?.votes || 0;
        const ebVotes2018 = senator2018.find(s => s.name && s.name.toUpperCase().includes('BRAGA'))?.votes || 0;

        return {
            name: mun2010.name,
            votes2010: ebVotes2010,
            votes2018: ebVotes2018
        };
    }).sort((a, b) => b.votes2018 - a.votes2018).slice(0, 15); // Top 15

    const munNames = munDataWithVotes.map(m => m.name);
    const votes2010 = munDataWithVotes.map(m => m.votes2010);
    const votes2018 = munDataWithVotes.map(m => m.votes2018);

    createMunicipalityComparisonChart(munNames, votes2010, votes2018);

    console.log('✓ Comparative charts initialized');
}

/**
 * Create municipality comparison bar chart
 */
function createMunicipalityComparisonChart(municipalities, votes2010, votes2018) {
    const ctx = document.getElementById('chartMunicipalityComparison');
    if (!ctx) return;

    if (chartComparativeByMunicipality) chartComparativeByMunicipality.destroy();

    chartComparativeByMunicipality = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: municipalities,
            datasets: [
                {
                    label: '2010',
                    data: votes2010,
                    backgroundColor: '#8b4513',
                    borderColor: '#654321',
                    borderWidth: 1
                },
                {
                    label: '2018',
                    data: votes2018,
                    backgroundColor: '#2c5aa0',
                    borderColor: '#1a3a52',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.x.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}
