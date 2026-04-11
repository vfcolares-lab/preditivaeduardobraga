/**
 * Detailed Analysis Tables for Ideological Evolution Dashboard
 * Handles section-level, municipality-level, and calha-level data visualization
 */

const tablesState = {
    secoesData: null,
    municipiosData: null,
    currentYear: 2022,
    currentView: 'municipios', // 'secoes', 'municipios', 'calha'
    filteredData: null,
    searchTerm: '',
};

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initTables() {
    try {
        const [secoes, municipios] = await Promise.all([
            fetch('/data/ideologia/evolucao_secoes.json').then(r => r.json()),
            fetch('/data/ideologia/evolucao_municipios.json').then(r => r.json()),
        ]);

        tablesState.secoesData = secoes;
        tablesState.municipiosData = municipios;

        // Initialize tab-specific tables
        initMunicipioAnalysisTab();
        initSecoesAnalysisTab();
    } catch (error) {
        console.error('Erro ao inicializar tabelas:', error);
    }
}

// ============================================================================
// MUNICÍPIO ANALYSIS TAB
// ============================================================================

function initMunicipioAnalysisTab() {
    const searchInput = document.getElementById('municipioSearch');
    const calhaFilter = document.getElementById('calhaFilter');

    if (!searchInput) return;

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        tablesState.searchTerm = e.target.value.toLowerCase();
        populateMunicipioTable();
    });

    // Filter functionality
    if (calhaFilter) {
        calhaFilter.addEventListener('change', populateMunicipioTable);
    }

    // Initial load
    populateMunicipioTable();
}

function populateMunicipioTable() {
    const year = tablesState.currentYear;
    const data = tablesState.municipiosData;
    const searchTerm = tablesState.searchTerm;
    const calhaFilter = document.getElementById('calhaFilter')?.value || '';

    // Create table rows
    const rows = [];
    for (const [municipio, info] of Object.entries(data)) {
        if (searchTerm && !municipio.toLowerCase().includes(searchTerm)) continue;
        if (calhaFilter && info.calha !== calhaFilter) continue;

        const historico = info.serie_temporal || info.historico;
        if (historico && historico[year]) {
            const yearData = historico[year];
            rows.push({
                municipio,
                calha: info.calha,
                petismo: yearData.petismo,
                bolsonarismo: yearData.bolsonarismo,
                terceira_via: yearData.terceira_via || 0,
                saldo: yearData.saldo,
                volatilidade: info.volatilidade_media || 0,
                classificacao: info.classificacao_2026,
            });
        }
    }

    // Sort by saldo (descending)
    rows.sort((a, b) => b.saldo - a.saldo);

    // Render table
    const tableBody = document.querySelector('table tbody') || createMunicipioTable();
    renderMunicipioRows(tableBody, rows);
}

function createMunicipioTable() {
    const wrapper = document.querySelector('.table-wrapper');
    if (!wrapper) return null;

    const table = document.createElement('table');
    table.className = 'data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Município</th>
                <th>Calha</th>
                <th>Petismo %</th>
                <th>Bolsonarismo %</th>
                <th>Terceira Via %</th>
                <th>Saldo</th>
                <th>Volatilidade</th>
                <th>Classificação 2026</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    wrapper.innerHTML = '';
    wrapper.appendChild(table);
    return table.querySelector('tbody');
}

function renderMunicipioRows(tbody, rows) {
    tbody.innerHTML = '';

    rows.forEach(row => {
        const tr = tbody.insertRow();
        const saldoColor = row.saldo > 0 ? '#d73027' : '#4575b4';

        tr.innerHTML = `
            <td><strong>${row.municipio}</strong></td>
            <td>${row.calha}</td>
            <td>${row.petismo.toFixed(2)}</td>
            <td>${row.bolsonarismo.toFixed(2)}</td>
            <td>${row.terceira_via.toFixed(2)}</td>
            <td style="color: ${saldoColor}; font-weight: bold;">
                ${row.saldo > 0 ? '+' : ''}${row.saldo.toFixed(2)}
            </td>
            <td>${row.volatilidade.toFixed(2)}</td>
            <td>
                <span class="badge" style="background: ${getClassificationColor(row.classificacao)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
                    ${row.classificacao}
                </span>
            </td>
        `;

        // Add click handler for detail view
        tr.addEventListener('click', () => {
            showMunicipioDetail(row.municipio, tablesState.municipiosData[row.municipio]);
        });
    });
}

// ============================================================================
// SEÇÕES ANALYSIS TAB
// ============================================================================

function initSecoesAnalysisTab() {
    // Placeholder for section-level analysis
    // Would create a similar interface for viewing section-level data
    console.log('Seções analysis tab initialized');
}

// ============================================================================
// MUNICÍPIO DETAIL VIEW
// ============================================================================

function showMunicipioDetail(municipio, info) {
    const panel = document.getElementById('municipioPanel');
    if (!panel) return;

    const year = tablesState.currentYear;
    const historico = info.serie_temporal || info.historico;
    const yearData = historico?.[year] || {};

    // Update header
    document.getElementById('municipioTitle').textContent = municipio;
    document.getElementById('municipioCalha').textContent = info.calha;
    document.getElementById('municipioClassificacao').textContent = info.classificacao_2026;

    // Calculate trends
    const serie = info.serie_temporal || info.historico;
    if (serie && serie[2010] && serie[2022]) {
        const changePet = serie[2022].petismo - serie[2010].petismo;
        const changeBol = serie[2022].bolsonarismo - serie[2010].bolsonarismo;

        document.getElementById('municipioTendenciaPet').textContent =
            changePet > 0 ? `↑ +${changePet.toFixed(1)}%` : `↓ ${changePet.toFixed(1)}%`;
        document.getElementById('municipioTendenciaBol').textContent =
            changeBol > 0 ? `↑ +${changeBol.toFixed(1)}%` : `↓ ${changeBol.toFixed(1)}%`;
    }

    // Populate historical table
    populateHistoricoTable(municipio, serie);

    // Create and render chart
    createMunicipioChart(municipio, serie);

    // Show panel
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth' });
}

function populateHistoricoTable(municipio, serie) {
    const tbody = document.getElementById('municipioHistoricoTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const years = [2010, 2014, 2018, 2022];
    years.forEach(year => {
        if (serie && serie[year]) {
            const data = serie[year];
            const row = tbody.insertRow();

            row.innerHTML = `
                <td>${year}</td>
                <td>${data.petismo.toFixed(2)}%</td>
                <td>${data.bolsonarismo.toFixed(2)}%</td>
                <td>${data.terceira_via?.toFixed(2) || '--'}%</td>
                <td style="color: ${data.saldo > 0 ? '#d73027' : '#4575b4'}; font-weight: bold;">
                    ${data.saldo.toFixed(2)}
                </td>
            `;
        }
    });
}

function createMunicipioChart(municipio, serie) {
    const canvas = document.getElementById('municipioChart');
    if (!canvas || !serie) return;

    const years = [2010, 2014, 2018, 2022];
    const petismo = years.map(y => serie[y]?.petismo || 0);
    const bolsonarismo = years.map(y => serie[y]?.bolsonarismo || 0);
    const terceira = years.map(y => serie[y]?.terceira_via || 0);

    // Destroy existing chart if any
    const existingChart = Chart.helpers?.instances?.[canvas] || window.municipioChartInstance;
    if (existingChart) existingChart.destroy();

    window.municipioChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Petismo (%)',
                    data: petismo,
                    backgroundColor: 'rgba(215, 48, 39, 0.8)',
                    borderColor: '#d73027',
                    borderWidth: 1,
                },
                {
                    label: 'Bolsonarismo (%)',
                    data: bolsonarismo,
                    backgroundColor: 'rgba(69, 117, 180, 0.8)',
                    borderColor: '#4575b4',
                    borderWidth: 1,
                },
                {
                    label: 'Terceira Via (%)',
                    data: terceira,
                    backgroundColor: 'rgba(254, 224, 144, 0.8)',
                    borderColor: '#fee090',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15 },
                },
                title: {
                    display: true,
                    text: `Evolução Ideológica - ${municipio}`,
                    font: { size: 14, weight: 'bold' },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => v + '%' },
                },
            },
        },
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getClassificationColor(classification) {
    const colors = {
        'Bastião Lulista': '#d73027',
        'Tendência Lulista': '#f46d43',
        'Swing / Dividido': '#fee090',
        'Tendência Bolsonarista': '#74add1',
        'Bastião Bolsonarista': '#4575b4',
        'Volátil': '#fee08b',
    };
    return colors[classification] || '#999';
}

function exportTableToCSV() {
    const year = tablesState.currentYear;
    const data = tablesState.municipiosData;

    // Create CSV header
    let csv = 'Município,Calha,Petismo %,Bolsonarismo %,Terceira Via %,Saldo,Volatilidade,Classificação 2026\n';

    // Add rows
    for (const [municipio, info] of Object.entries(data)) {
        const historico = info.serie_temporal || info.historico;
        if (historico && historico[year]) {
            const yearData = historico[year];
            csv += `"${municipio}","${info.calha}",${yearData.petismo.toFixed(2)},${yearData.bolsonarismo.toFixed(2)},${(yearData.terceira_via || 0).toFixed(2)},${yearData.saldo.toFixed(2)},${(info.volatilidade_media || 0).toFixed(2)},"${info.classificacao_2026}"\n`;
        }
    }

    // Download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `analise_ideologica_${year}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// ============================================================================
// PROJEÇÃO 2026 - CLASSIFICAÇÕES E SWING
// ============================================================================

function populatePredictiveClassifications() {
    if (!tablesState.municipiosData) return;

    const data = tablesState.municipiosData;
    const grid = document.getElementById('classificationGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const classifications = {
        'Bastião Lulista': 0,
        'Tendência Lulista': 0,
        'Swing / Dividido': 0,
        'Tendência Bolsonarista': 0,
        'Bastião Bolsonarista': 0,
        'Volátil': 0,
    };

    // Count municipalities by classification
    for (const [, mun] of Object.entries(data)) {
        const cls = mun.classificacao_2026;
        if (classifications.hasOwnProperty(cls)) {
            classifications[cls]++;
        }
    }

    const colorMap = {
        'Bastião Lulista': '#d73027',
        'Tendência Lulista': '#f46d43',
        'Swing / Dividido': '#fee090',
        'Tendência Bolsonarista': '#74add1',
        'Bastião Bolsonarista': '#4575b4',
        'Volátil': '#fee08b',
    };

    // Create cards
    for (const [classification, count] of Object.entries(classifications)) {
        const card = document.createElement('div');
        card.className = 'classification-item';
        card.style.backgroundColor = colorMap[classification] || '#999';
        card.innerHTML = `
            <div class="classification-label">${classification}</div>
            <div class="classification-count">${count}</div>
        `;
        grid.appendChild(card);
    }
}

function populateSwingMunicipios() {
    if (!tablesState.municipiosData) return;

    const data = tablesState.municipiosData;
    const tbody = document.getElementById('swingTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const swingMunicipios = [];

    // Find swing municipalities
    for (const [municipio, info] of Object.entries(data)) {
        if (info.classificacao_2026 === 'Swing / Dividido') {
            const projecao = info.projecao_2026 || {};
            swingMunicipios.push({
                municipio,
                calha: info.calha || 'N/A',
                petismo2026: projecao.petismo || 0,
                bolsonarismo2026: projecao.bolsonarismo || 0,
                saldo: projecao.saldo || 0,
            });
        }
    }

    // Sort by absolute saldo
    swingMunicipios.sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

    // Populate table
    swingMunicipios.forEach((item) => {
        const row = tbody.insertRow();
        const saldoColor = item.saldo > 0 ? '#d73027' : '#4575b4';
        row.innerHTML = `
            <td>${item.municipio}</td>
            <td>${item.calha}</td>
            <td>${item.petismo2026.toFixed(2)}%</td>
            <td>${item.bolsonarismo2026.toFixed(2)}%</td>
            <td style="color: ${saldoColor}; font-weight: bold;">
                ${item.saldo.toFixed(2)}
            </td>
            <td>${item.saldo > 0 ? 'Tendência PT' : 'Tendência Bolso'}</td>
        `;
    });
}

// ============================================================================
// INITIALIZE ON LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof initTables === 'function') {
            initTables();
        }
    }, 1000);
});
