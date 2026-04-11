/**
 * Chart.js Visualizations for Ideological Evolution Dashboard
 * Handles all chart rendering and updates
 */

const chartsState = {
    charts: {},
    municipalitiesData: null,
    secoesData: null,
    initialized: false,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initCharts() {
    // Evitar reinicializar se já foi feito
    if (chartsState.initialized && chartsState.municipalitiesData) {
        return;
    }

    try {
        // Load data
        const [municipios, secoes] = await Promise.all([
            fetch('./data/ideologia/evolucao_municipios.json').then(r => r.json()),
            fetch('./data/ideologia/evolucao_secoes.json').then(r => r.json()),
        ]);

        chartsState.municipalitiesData = municipios;
        chartsState.secoesData = secoes;

        // Destroy previous charts
        Object.values(chartsState.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        chartsState.charts = {};

        // Create charts for "Evolução Temporal" tab
        createEvolutionChart();
        createCalhaDistributionChart();
        createVolatilityChart();

        // Create charts for "Mapa Preditivo 2026" tab
        createClassificationDistributionChart();

        chartsState.initialized = true;
    } catch (error) {
        console.error('Erro ao inicializar gráficos:', error);
    }
}

// ============================================================================
// EVOLUÇÃO TEMPORAL (LINE CHART)
// ============================================================================

function createEvolutionChart() {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) {
        console.warn('Canvas evolutionChart não encontrado, criando...');
        return;
    }

    // Destruir gráfico anterior
    if (chartsState.charts.evolution) {
        chartsState.charts.evolution.destroy();
    }

    const data = chartsState.municipalitiesData;
    const years = [2010, 2014, 2018, 2022];

    // Calcular médias estaduais por ano
    let avgPetismo = [],
        avgBolsonarismo = [],
        avgSaldo = [];

    years.forEach(year => {
        let petTot = 0, bolTot = 0, count = 0;

        for (const [, mun] of Object.entries(data)) {
            const historico = mun.serie_temporal || mun.historico;
            if (historico && historico[year]) {
                const d = historico[year];
                petTot += d.petismo || 0;
                bolTot += d.bolsonarismo || 0;
                count++;
            }
        }

        avgPetismo.push((petTot / count).toFixed(2));
        avgBolsonarismo.push((bolTot / count).toFixed(2));
        avgSaldo.push((avgPetismo[avgPetismo.length - 1] - avgBolsonarismo[avgBolsonarismo.length - 1]).toFixed(2));
    });

    chartsState.charts.evolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Petismo (%)',
                        data: avgPetismo,
                        borderColor: '#d73027',
                        backgroundColor: 'rgba(215, 48, 39, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#d73027',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    },
                    {
                        label: 'Bolsonarismo (%)',
                        data: avgBolsonarismo,
                        borderColor: '#4575b4',
                        backgroundColor: 'rgba(69, 117, 180, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#4575b4',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12, weight: 'bold' },
                        },
                    },
                    title: {
                        display: true,
                        text: 'Evolução Ideológica Estadual 2010-2022',
                        font: { size: 16, weight: 'bold' },
                        padding: 20,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: v => v + '%' },
                        grid: { drawBorder: false },
                    },
                    x: {
                        grid: { display: false },
                    },
                },
            },
        });
}

// ============================================================================
// DISTRIBUIÇÃO POR CALHA (BAR CHART)
// ============================================================================

function createCalhaDistributionChart() {
    const ctx = document.getElementById('calhaChart');
    if (!ctx) {
        console.warn('Canvas calhaChart não encontrado');
        return;
    }

    const data = chartsState.municipalitiesData;
    const year = 2022;

    // Agrupar por calha
    const porCalha = {};

    for (const [, mun] of Object.entries(data)) {
        const calha = mun.calha;
        if (!porCalha[calha]) {
            porCalha[calha] = { petismo: 0, bolsonarismo: 0, count: 0 };
        }

        if (mun.serie_temporal && mun.serie_temporal[year]) {
            const d = mun.serie_temporal[year];
            porCalha[calha].petismo += d.petismo || 0;
            porCalha[calha].bolsonarismo += d.bolsonarismo || 0;
            porCalha[calha].count++;
        }
    }

    // Calcular médias
    const calhas = Object.keys(porCalha).sort();
    const petismoMedios = calhas.map(c => (porCalha[c].petismo / porCalha[c].count).toFixed(2));
    const bolsonarismMedios = calhas.map(c => (porCalha[c].bolsonarismo / porCalha[c].count).toFixed(2));

    // Destruir gráfico anterior
    if (chartsState.charts.calha) {
        chartsState.charts.calha.destroy();
    }

    chartsState.charts.calha = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: calhas,
                datasets: [
                    {
                        label: 'Petismo Médio (%)',
                        data: petismoMedios,
                        backgroundColor: 'rgba(215, 48, 39, 0.8)',
                        borderColor: '#d73027',
                        borderWidth: 1,
                    },
                    {
                        label: 'Bolsonarismo Médio (%)',
                        data: bolsonarismMedios,
                        backgroundColor: 'rgba(69, 117, 180, 0.8)',
                        borderColor: '#4575b4',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 11 },
                        },
                    },
                    title: {
                        display: true,
                        text: 'Ideologia Média por Calha (2022)',
                        font: { size: 14, weight: 'bold' },
                        padding: 15,
                    },
                },
                scales: {
                    x: {
                        max: 100,
                        ticks: { callback: v => v + '%' },
                    },
                },
            },
        });
}

// ============================================================================
// VOLATILIDADE (SCATTER PLOT)
// ============================================================================

function createVolatilityChart() {
    const ctx = document.getElementById('volatilityChart');
    if (!ctx) {
        console.warn('Canvas volatilityChart não encontrado');
        return;
    }

    const data = chartsState.municipalitiesData;
    const year = 2022;

    // Dados para scatter: saldo vs volatilidade
    const points = [];
    const colors = [];

    for (const [municipio, mun] of Object.entries(data)) {
        if (mun.serie_temporal && mun.serie_temporal[year]) {
            const d = mun.serie_temporal[year];
            const volatilidade = mun.volatilidade_media || 0;

            points.push({
                x: d.saldo,
                y: volatilidade,
                label: municipio,
            });

            // Color by classification
            const classification = mun.classificacao_2026;
            let color = '#999';
            if (classification === 'Bastião Lulista') color = '#d73027';
            else if (classification === 'Tendência Lulista') color = '#f46d43';
            else if (classification === 'Swing / Dividido') color = '#fee090';
            else if (classification === 'Tendência Bolsonarista') color = '#74add1';
            else if (classification === 'Bastião Bolsonarista') color = '#4575b4';
            else if (classification === 'Volátil') color = '#fee08b';

            colors.push(color);
        }
    }

    // Destruir gráfico anterior
    if (chartsState.charts.volatility) {
        chartsState.charts.volatility.destroy();
    }

    chartsState.charts.volatility = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Municípios',
                        data: points.map((p, i) => ({
                            x: p.x,
                            y: p.y,
                            r: 8,
                            label: p.label,
                        })),
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.8', '1')),
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: 'Saldo Ideológico vs Volatilidade (2022)',
                        font: { size: 14, weight: 'bold' },
                        padding: 15,
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const idx = context.dataIndex;
                                const p = points[idx];
                                return `${p.label}: Saldo ${p.x.toFixed(2)}, Volatilidade ${p.y.toFixed(2)}%`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Saldo Ideológico (PT - Bolso)' },
                        min: -100,
                        max: 100,
                    },
                    y: {
                        title: { display: true, text: 'Volatilidade Média (%)' },
                        min: 0,
                    },
                },
            },
        });
}

// ============================================================================
// DISTRIBUIÇÃO DE CLASSIFICAÇÕES 2026 (DONUT)
// ============================================================================

function createClassificationDistributionChart() {
    const ctx = document.getElementById('classificationChart');
    if (!ctx) {
        console.warn('Canvas classificationChart não encontrado');
        return;
    }

    const data = chartsState.municipalitiesData;

    const classifications = {
        'Bastião Lulista': 0,
        'Tendência Lulista': 0,
        'Swing / Dividido': 0,
        'Tendência Bolsonarista': 0,
        'Bastião Bolsonarista': 0,
        'Volátil': 0,
    };

    for (const [, mun] of Object.entries(data)) {
        const cls = mun.classificacao_2026;
        if (classifications.hasOwnProperty(cls)) {
            classifications[cls]++;
        }
    }

    const labels = Object.keys(classifications);
    const counts = Object.values(classifications);
    const colors = [
        '#d73027', // Bastião Lulista
        '#f46d43', // Tendência Lulista
        '#fee090', // Swing
        '#74add1', // Tendência Bolsonarista
        '#4575b4', // Bastião Bolsonarista
        '#fee08b', // Volátil
    ];

    // Destruir gráfico anterior
    if (chartsState.charts.classification) {
        chartsState.charts.classification.destroy();
    }

    chartsState.charts.classification = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        data: counts,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: '500' },
                        },
                    },
                    title: {
                        display: true,
                        text: 'Classificação Preditiva 2026',
                        font: { size: 14, weight: 'bold' },
                        padding: 15,
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${value} municípios (${percentage}%)`;
                            },
                        },
                    },
                },
            },
        });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function updateChartsForYear(year) {
    // Update evolution chart and redraw
    if (chartsState.charts.evolution) {
        chartsState.charts.evolution.update();
    }
}

// ============================================================================
// INITIALIZE ON DEMAND
// ============================================================================

// Charts will be initialized when first tab is viewed
// Add to main.js: call initCharts() when page loads or during tab init
