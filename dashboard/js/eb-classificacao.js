/**
 * Classificação Eduardista - Histórico 2010-2022
 * Análise de desempenho de Eduardo Braga por município
 * Classificação baseada em média ponderada: 2010=25%, 2018=25%, 2022=50%
 */

let ebClassificacaoState = {
    dados: {},
    initialized: false
};

async function initEBClassificacao() {
    if (ebClassificacaoState.initialized) return;

    console.log('⏳ Carregando classificação eduardista histórica...');

    try {
        // Carregar dados de análise completa (2010-2022)
        const respCompleta = await fetch('./data/ideologia/analise_eb_completa.json');
        const dadosCompleta = await respCompleta.json();

        ebClassificacaoState.dados = dadosCompleta;

        setupControlesEBClassificacao();
        mostrarClassificacaoCompleta();

        ebClassificacaoState.initialized = true;
        console.log('✓ Classificação Eduardista carregada (2010-2022)');

    } catch (error) {
        console.error('❌ Erro ao carregar classificação:', error);
    }
}

function setupControlesEBClassificacao() {
    const container = document.getElementById('eb-classificacao-controles');
    if (!container) return;

    const html = `
        <div class="eb-control-group">
            <label>ℹ️ Nota sobre dados:</label>
            <div style="font-size: 12px; color: #666; margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <p style="margin: 0 0 6px 0;">
                    🗓️ <strong>Histórico 2010-2022:</strong><br>
                    Senador 2010 e Governador 2022<br>
                    <em>(2018 interpolado)</em>
                </p>
                <p style="margin: 0;">
                    📊 <strong>Cálculo:</strong> Média ponderada (2010=25%, 2018=25%, 2022=50%)
                </p>
            </div>
        </div>

        <div class="eb-legenda" id="eb-legenda"></div>
    `;

    container.innerHTML = html;
    atualizarLegendaEB();
}

function mostrarClassificacaoCompleta() {
    const container = document.getElementById('eb-classificacao-resultado');
    if (!container) return;

    const dados = ebClassificacaoState.dados;

    // Contar classificações
    const municipiosClassificados = {};
    Object.entries(dados).forEach(([munNome, munData]) => {
        const cls = munData.classificacao?.classificacao || 'Sem classificação';
        if (!municipiosClassificados[cls]) {
            municipiosClassificados[cls] = 0;
        }
        municipiosClassificados[cls] += 1;
    });

    // Stats
    const statsHtml = `
        <div class="eb-stats">
            <div class="eb-stat-card">
                <h3>${Object.values(municipiosClassificados).reduce((a, b) => a + b, 0)}</h3>
                <p>Municípios</p>
            </div>
            <div class="eb-stat-card">
                <h3>${municipiosClassificados['Bastião Eduardista'] || 0}</h3>
                <p>Bastião EB</p>
            </div>
            <div class="eb-stat-card">
                <h3>${municipiosClassificados['Tendência Eduardista'] || 0}</h3>
                <p>Tendência EB</p>
            </div>
            <div class="eb-stat-card">
                <h3>${municipiosClassificados['Swing / Competitivo'] || 0}</h3>
                <p>Swing</p>
            </div>
            <div class="eb-stat-card">
                <h3>${municipiosClassificados['Tendência Anti-Eduardista'] || 0}</h3>
                <p>Tend. Anti-EB</p>
            </div>
            <div class="eb-stat-card">
                <h3>${municipiosClassificados['Bastião Anti-Eduardista'] || 0}</h3>
                <p>Bastião Anti-EB</p>
            </div>
        </div>
    `;

    // Tabela de calhas
    const tabelaHtml = `
        <div class="eb-section">
            <h4>📍 Distribuição por Calha (clique nos números para detalhes)</h4>
            ${gerarTabelaCalhasEB(dados)}
        </div>
    `;

    container.innerHTML = `
        <div class="eb-header">
            <h3>📊 Classificação Eduardista - Histórico 2010-2022</h3>
            <p style="color: #666;">
                Análise de desempenho de Eduardo Braga por município (Média ponderada 2010-2022)
            </p>
        </div>
        ${statsHtml}
        ${tabelaHtml}
    `;

    atualizarLegendaEB();
}

function gerarTabelaCalhasEB(dados) {
    const calhas = {};

    // Agrupar por calha e classificação
    Object.entries(dados).forEach(([munNome, munData]) => {
        const calha = munData.calha || 'Outros';
        if (!calhas[calha]) {
            calhas[calha] = {};
        }

        const cls = munData.classificacao?.classificacao || 'Sem classificação';
        if (!calhas[calha][cls]) {
            calhas[calha][cls] = 0;
        }
        calhas[calha][cls] += 1;
    });

    const colunas = ['Bastião Eduardista', 'Tendência Eduardista', 'Swing / Competitivo', 'Tendência Anti-Eduardista', 'Bastião Anti-Eduardista'];

    let html = `
        <table class="eb-table">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th>Calha/Região</th>
                    <th>Total</th>
                    ${colunas.map(col => `<th>${col}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    Object.keys(calhas).sort().forEach(calha => {
        const classByCalha = calhas[calha];
        const total = Object.values(classByCalha).reduce((a, b) => a + b, 0);

        html += `
            <tr>
                <td><strong>${calha}</strong></td>
                <td>${total}</td>
                ${colunas.map(col => {
                    const count = classByCalha[col] || 0;
                    return `<td><span class="cell-clickable-eb" onclick="mostrarMunicipiosEB('${calha}', '${col}')" title="Clique para ver">${count}</span></td>`;
                }).join('')}
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function mostrarMunicipiosEB(calha, classificacao) {
    const dados = ebClassificacaoState.dados;

    const municipios = [];

    Object.entries(dados).forEach(([munNome, munData]) => {
        if (munData.calha === calha && munData.classificacao?.classificacao === classificacao) {
            const cls_data = munData.classificacao;
            municipios.push({
                nome: munNome,
                pct_2010: cls_data.pct_2010,
                pct_2018: cls_data.pct_2018,
                pct_2022: cls_data.pct_2022,
                media: cls_data.media_ponderada,
                tendencia: cls_data.tendencia,
                nota_2018: cls_data.nota_2018,
                votos_2022: munData.historico['2022']?.votos_eb || 0,
                total_2022: munData.historico['2022']?.votos_totais || 0
            });
        }
    });

    if (municipios.length === 0) {
        alert('Nenhum município encontrado');
        return;
    }

    // Ordenar por tendência (crescimento decrescente)
    municipios.sort((a, b) => b.media - a.media);

    // Modal
    const modalHtml = `
        <div class="eb-modal-overlay" onclick="fecharModalEB()">
            <div class="eb-modal" onclick="event.stopPropagation()" style="max-height: 80vh; overflow-y: auto;">
                <div class="eb-modal-header">
                    <h3>${calha}</h3>
                    <p>${classificacao} (${municipios.length} município${municipios.length > 1 ? 's' : ''})</p>
                    <button class="eb-modal-close" onclick="fecharModalEB()">&times;</button>
                </div>

                <div class="eb-modal-content">
                    <div class="municipios-list-eb">
                        ${municipios.map(m => `
                            <div class="mun-item-eb">
                                <div class="mun-nome">${m.nome}</div>
                                <div class="mun-stats" style="font-size: 12px;">
                                    <div style="margin-bottom: 6px;">
                                        <strong>Série Histórica EB:</strong><br>
                                        2010: ${m.pct_2010}% |
                                        2018: ${m.pct_2018}% <em style="color: #999;">(${m.nota_2018})</em> |
                                        2022: ${m.pct_2022}%
                                    </div>
                                    <div style="margin-bottom: 6px;">
                                        <strong>Média Ponderada:</strong> ${m.media}%
                                    </div>
                                    <div style="margin-bottom: 6px;">
                                        <strong>Tendência (2010→2022):</strong>
                                        <span style="color: ${m.tendencia >= 0 ? '#27ae60' : '#e74c3c'};">
                                            ${m.tendencia >= 0 ? '↑' : '↓'} ${Math.abs(m.tendencia)}%
                                        </span>
                                    </div>
                                    <div style="color: #666;">
                                        2022: ${m.votos_2022.toLocaleString('pt-BR')} votos / ${m.total_2022.toLocaleString('pt-BR')} total
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    let existing = document.getElementById('eb-modal-container');
    if (!existing) {
        existing = document.createElement('div');
        existing.id = 'eb-modal-container';
        document.body.appendChild(existing);
    }
    existing.innerHTML = modalHtml;
}

function fecharModalEB() {
    const existing = document.getElementById('eb-modal-container');
    if (existing) existing.remove();
}

function atualizarLegendaEB() {
    const container = document.getElementById('eb-legenda');
    if (!container) return;

    const html = `
        <div class="legenda-items-eb">
            <div class="legenda-item-eb">
                <span class="legenda-cor-eb" style="background: #EF3B39;"></span>
                <span>Bastião EB (≥55%)</span>
            </div>
            <div class="legenda-item-eb">
                <span class="legenda-cor-eb" style="background: #FF6B6B;"></span>
                <span>Tendência EB (45-55%)</span>
            </div>
            <div class="legenda-item-eb">
                <span class="legenda-cor-eb" style="background: #FF9900;"></span>
                <span>Swing (35-45%)</span>
            </div>
            <div class="legenda-item-eb">
                <span class="legenda-cor-eb" style="background: #0066CC;"></span>
                <span>Tend. Anti-EB (20-35%)</span>
            </div>
            <div class="legenda-item-eb">
                <span class="legenda-cor-eb" style="background: #000080;"></span>
                <span>Bastião Anti-EB (<20%)</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

window.initEBClassificacao = initEBClassificacao;
window.mostrarMunicipiosEB = mostrarMunicipiosEB;
window.fecharModalEB = fecharModalEB;
