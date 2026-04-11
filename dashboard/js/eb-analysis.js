/**
 * Eduardo Braga (EB) vs Ideological Profile Analysis
 * Correlates EB voting patterns with voter ideological classification
 */

const ebState = {
    ebData: null,
    currentYear: 2018,
    charts: {},
    initialized: false,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initEBAnalysis() {
    // Evitar reinicializar se já foi feito
    if (ebState.initialized && ebState.ebData) {
        return;
    }

    try {
        const ebData = await fetch('/data/ideologia/eb_analise_2018.json').then(r => r.json());
        ebState.ebData = ebData;

        console.log(`✓ EB dados carregados: ${Object.keys(ebData).length} seções`);

        // Destruir gráficos anteriores
        if (ebState.charts.ebScatter) {
            ebState.charts.ebScatter.destroy();
        }

        // Create visualizations
        createEBIdeologyScatterChart();
        populateEBPerformanceTable();

        ebState.initialized = true;
    } catch (error) {
        console.error('Erro ao carregar análise EB:', error);
    }
}

// ============================================================================
// SCATTER PLOT: EB % vs BOLSONARISMO %
// ============================================================================

function createEBIdeologyScatterChart() {
    const canvas = document.getElementById('ebScatterChart');
    if (!canvas || !ebState.ebData) return;

    // Destruir gráfico anterior se existir
    if (ebState.charts && ebState.charts.ebScatter) {
        ebState.charts.ebScatter.destroy();
    }

    const data = ebState.ebData;
    const points = [];
    const colors = [];

    // Preparar dados para scatter
    for (const [, secao] of Object.entries(data)) {
        points.push({
            x: secao.percentual_bolsonaro,
            y: secao.percentual_eb,
            label: `Seção ${secao.secao}`,
            ideologia: secao.ideologia_secao,
        });

        // Color by ideology
        let color = '#999';
        if (secao.ideologia_secao === 'PT') color = '#d73027';
        else if (secao.ideologia_secao === 'BOLSONARO') color = '#4575b4';
        else if (secao.ideologia_secao === 'SWING') color = '#fee090';

        colors.push(color);
    }

    // Create chart
    if (!ebState.charts) ebState.charts = {};

    ebState.charts.ebScatter = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Seções Eleitorais',
                    data: points,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.', '0.8')),
                    borderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Eduardo Braga vs Perfil Ideológico (2018)',
                    font: { size: 14, weight: 'bold' },
                    padding: 15,
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const p = context.raw;
                            return `EB: ${p.y.toFixed(1)}% | Bolsonarismo: ${p.x.toFixed(1)}% | ${p.ideologia}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Bolsonarismo 2018 (%)',
                        font: { size: 12, weight: 'bold' },
                    },
                    min: 0,
                    max: 100,
                    ticks: { callback: v => v + '%' },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Votos Eduardo Braga (%)',
                        font: { size: 12, weight: 'bold' },
                    },
                    min: 0,
                    max: 100,
                    ticks: { callback: v => v + '%' },
                },
            },
        },
    });

    // Add trend line (optional)
    addTrendLine();
}

function addTrendLine() {
    // Calcular correlação e linha de tendência
    const data = ebState.ebData;
    const points = [];

    for (const [, secao] of Object.entries(data)) {
        points.push({
            x: secao.percentual_bolsonaro,
            y: secao.percentual_eb,
        });
    }

    if (points.length < 2) return;

    // Regressão linear
    const n = points.length;
    const sumX = points.reduce((a, p) => a + p.x, 0);
    const sumY = points.reduce((a, p) => a + p.y, 0);
    const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
    const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Adicionar linha de tendência ao dataset
    const chart = ebState.charts.ebScatter;
    if (chart) {
        const trendY1 = intercept;
        const trendY2 = slope * 100 + intercept;

        chart.data.datasets.push({
            label: 'Linha de Tendência',
            type: 'line',
            data: [
                { x: 0, y: Math.max(0, trendY1) },
                { x: 100, y: Math.min(100, trendY2) },
            ],
            borderColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
        });

        chart.update();
    }
}

// ============================================================================
// PERFORMANCE TABLE BY IDEOLOGICAL RANGE
// ============================================================================

function populateEBPerformanceTable() {
    const tbody = document.getElementById('ebPerformanceTableBody');
    if (!tbody || !ebState.ebData) return;

    const data = ebState.ebData;

    // Group by ideology
    const byIdeology = {
        'Bastião PT': { votos: 0, secoes: 0, eb_votos: 0 },
        'Tendência PT': { votos: 0, secoes: 0, eb_votos: 0 },
        'Swing': { votos: 0, secoes: 0, eb_votos: 0 },
        'Tendência Bolsonaro': { votos: 0, secoes: 0, eb_votos: 0 },
        'Bastião Bolsonaro': { votos: 0, secoes: 0, eb_votos: 0 },
    };

    // Classificar por faixa ideológica
    for (const [, secao] of Object.entries(data)) {
        let faixa = 'Swing';

        if (secao.percentual_haddad >= 60) faixa = 'Bastião PT';
        else if (secao.percentual_haddad > 50) faixa = 'Tendência PT';
        else if (secao.percentual_bolsonaro > 50) faixa = 'Tendência Bolsonaro';
        else if (secao.percentual_bolsonaro >= 60) faixa = 'Bastião Bolsonaro';

        byIdeology[faixa].votos += secao.votos_senador_total;
        byIdeology[faixa].secoes += 1;
        byIdeology[faixa].eb_votos += secao.votos_eb;
    }

    // Renderizar tabela
    tbody.innerHTML = '';

    for (const [faixa, stats] of Object.entries(byIdeology)) {
        if (stats.secoes === 0) continue;

        const ebPct = (stats.eb_votos / stats.votos * 100).toFixed(2);
        const row = tbody.insertRow();

        row.innerHTML = `
            <td><strong>${faixa}</strong></td>
            <td>${stats.secoes}</td>
            <td style="color: ${ebPct > 50 ? '#d73027' : '#4575b4'}; font-weight: bold;">
                ${ebPct}%
            </td>
            <td>${stats.eb_votos.toLocaleString('pt-BR')}</td>
        `;
    }

    // Summary
    console.log('EB Performance by Ideology:', byIdeology);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCorrelation() {
    const data = ebState.ebData;
    const points = [];

    for (const [, secao] of Object.entries(data)) {
        points.push({
            x: secao.percentual_bolsonaro,
            y: secao.percentual_eb,
        });
    }

    if (points.length < 2) return null;

    const n = points.length;
    const meanX = points.reduce((a, p) => a + p.x, 0) / n;
    const meanY = points.reduce((a, p) => a + p.y, 0) / n;

    const numerator = points.reduce((a, p) => a + (p.x - meanX) * (p.y - meanY), 0);
    const denomX = Math.sqrt(
        points.reduce((a, p) => a + (p.x - meanX) * (p.x - meanX), 0)
    );
    const denomY = Math.sqrt(
        points.reduce((a, p) => a + (p.y - meanY) * (p.y - meanY), 0)
    );

    return numerator / (denomX * denomY);
}

// ============================================================================
// INITIALIZE ON DEMAND
// ============================================================================

// Called from main.js or when EB tab is activated
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof initEBAnalysis === 'function') {
            // Will be called on tab activation from main.js
        }
    }, 2000);
});
