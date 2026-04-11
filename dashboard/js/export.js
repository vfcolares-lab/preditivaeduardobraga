/**
 * Export Functionality for Ideological Evolution Dashboard
 * Provides PDF and CSV export capabilities
 */

// ============================================================================
// CSV EXPORT
// ============================================================================

function exportMunicipiosToCSV() {
    const year = dashboardState.currentYear || 2022;
    const data = dashboardState.municipalitiesData;

    if (!data) {
        alert('Dados não carregados');
        return;
    }

    // Create CSV header
    let csv = 'Município,Calha,Petismo %,Bolsonarismo %,Terceira Via %,Saldo,Volatilidade,Classificação 2026\n';

    // Add rows
    for (const [municipio, info] of Object.entries(data)) {
        if (info.serie_temporal && info.serie_temporal[year]) {
            const yearData = info.serie_temporal[year];
            const calha = info.calha || 'N/A';
            const volatilidade = info.volatilidade_media || 0;
            const classificacao = info.classificacao_2026 || 'N/A';

            csv += `"${municipio}","${calha}",${yearData.petismo.toFixed(2)},${yearData.bolsonarismo.toFixed(2)},${(yearData.terceira_via || 0).toFixed(2)},${yearData.saldo.toFixed(2)},${volatilidade.toFixed(2)},"${classificacao}"\n`;
        }
    }

    downloadFile(
        csv,
        `analise_ideologica_municipios_${year}.csv`,
        'text/csv;charset=utf-8'
    );
}

function exportRankingsToCSV() {
    const data = dashboardState.municipalitiesData;
    const year = 2022;

    if (!data) {
        alert('Dados não carregados');
        return;
    }

    // Create different CSVs for each ranking
    const rankings = {
        petista: [],
        bolsonarista: [],
        volatil: [],
    };

    for (const [municipio, info] of Object.entries(data)) {
        if (info.serie_temporal && info.serie_temporal[year]) {
            const yearData = info.serie_temporal[year];
            rankings.petista.push({
                municipio,
                calha: info.calha,
                valor: yearData.petismo,
            });
            rankings.bolsonarista.push({
                municipio,
                calha: info.calha,
                valor: yearData.bolsonarismo,
            });
            rankings.volatil.push({
                municipio,
                calha: info.calha,
                valor: info.volatilidade_media || 0,
            });
        }
    }

    // Sort
    rankings.petista.sort((a, b) => b.valor - a.valor);
    rankings.bolsonarista.sort((a, b) => b.valor - a.valor);
    rankings.volatil.sort((a, b) => b.valor - a.valor);

    // Create combined CSV
    let csv = 'Ranking,Município,Calha,Valor\n';

    // Add Petista
    rankings.petista.forEach((item, idx) => {
        csv += `"Mais Petista",${idx + 1},"${item.municipio}","${item.calha}",${item.valor.toFixed(2)}\n`;
    });

    // Add Bolsonarista
    rankings.bolsonarista.forEach((item, idx) => {
        csv += `"Mais Bolsonarista",${idx + 1},"${item.municipio}","${item.calha}",${item.valor.toFixed(2)}\n`;
    });

    // Add Volátil
    rankings.volatil.forEach((item, idx) => {
        csv += `"Mais Volátil",${idx + 1},"${item.municipio}","${item.calha}",${item.valor.toFixed(2)}\n`;
    });

    downloadFile(csv, 'analise_ideologica_rankings.csv', 'text/csv;charset=utf-8');
}

// ============================================================================
// PDF EXPORT (using html2pdf library)
// ============================================================================

function exportDashboardToPDF() {
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        // Fallback: load html2pdf library
        loadHtml2PdfLibrary(() => {
            generatePDF();
        });
    } else {
        generatePDF();
    }
}

function loadHtml2PdfLibrary(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

function generatePDF() {
    const element = document.querySelector('.main-content');
    const opt = {
        margin: 10,
        filename: 'analise_ideologica_evolutiva.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        alert(
            'Erro: biblioteca html2pdf não disponível. Use a exportação CSV como alternativa.'
        );
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function downloadFile(content, filename, mimeType) {
    const element = document.createElement('a');
    element.setAttribute(
        'href',
        'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content)
    );
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function exportChartImage(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        alert('Gráfico não encontrado');
        return;
    }

    const image = canvas.toDataURL('image/png');
    const element = document.createElement('a');
    element.setAttribute('href', image);
    element.setAttribute('download', `grafico_${canvasId}.png`);
    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// ============================================================================
// ADD EXPORT BUTTONS TO UI
// ============================================================================

function addExportButtons() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Check if buttons already exist
    if (document.getElementById('exportBtnsContainer')) return;

    const container = document.createElement('div');
    container.id = 'exportBtnsContainer';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        gap: 10px;
        z-index: 1000;
        flex-direction: column;
    `;

    container.innerHTML = `
        <button onclick="exportMunicipiosToCSV()" class="btn btn-secondary" title="Exportar municípios">
            📊 CSV Municípios
        </button>
        <button onclick="exportRankingsToCSV()" class="btn btn-secondary" title="Exportar rankings">
            📋 CSV Rankings
        </button>
        <button onclick="exportDashboardToPDF()" class="btn btn-secondary" title="Exportar PDF">
            📄 PDF Relatório
        </button>
    `;

    document.body.appendChild(container);
}

// ============================================================================
// INITIALIZE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addExportButtons, 1500);
});
