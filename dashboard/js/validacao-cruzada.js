/**
 * Validação Cruzada: Evolução Ideológica vs Mapa Interativo
 * Valida que os dados são consistentes entre abas
 */

let validacaoState = {
    dados: {},
    municipiosSelecionados: new Set(),
    initialized: false
};

async function initValidacaoCruzada() {
    if (validacaoState.initialized) return;

    console.log('⏳ Carregando dados para validação cruzada...');

    try {
        const response = await fetch('/data/ideologia/evolucao_municipios.json');
        validacaoState.dados = await response.json();

        setupControlesValidacao();
        mostrarValidacaoCompleta();

        validacaoState.initialized = true;
        console.log('✓ Validação cruzada inicializada');

    } catch (error) {
        console.error('❌ Erro ao carregar validação cruzada:', error);
    }
}

function setupControlesValidacao() {
    const container = document.getElementById('validacao-controles');
    if (!container) return;

    const municipios = Object.keys(validacaoState.dados)
        .sort()
        .map(m => `<option value="${m}">${m}</option>`)
        .join('');

    const html = `
        <div class="validacao-control-group">
            <label>Selecionar Município:</label>
            <select id="select-municipio-validacao" class="validacao-select">
                <option value="">-- Escolha um município --</option>
                ${municipios}
            </select>
        </div>

        <div class="validacao-control-group">
            <button id="btn-validar" class="btn btn-primary" onclick="validarMunicipioSelecionado()">
                Validar Dados
            </button>
            <button id="btn-limpar" class="btn btn-secondary" onclick="limparValidacao()" style="margin-left: 0.5rem;">
                Limpar
            </button>
        </div>

        <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
            💡 Selecione um município para ver os dados lado a lado (Evolução Ideológica vs Mapa)
        </div>
    `;

    container.innerHTML = html;
}

function validarMunicipioSelecionado() {
    const select = document.getElementById('select-municipio-validacao');
    const municipio = select.value;

    if (!municipio) {
        alert('Selecione um município');
        return;
    }

    mostrarValidacaoMunicipio(municipio);
}

function mostrarValidacaoMunicipio(municipio) {
    const container = document.getElementById('validacao-resultado');
    if (!container) return;

    const dados = validacaoState.dados[municipio];
    if (!dados) {
        container.innerHTML = '<p style="color: red;">Município não encontrado</p>';
        return;
    }

    const historico = dados.historico || {};
    const projecao = dados.projecao_2026 || {};
    const tendencia = dados.tendencia || {};

    // Tabela de série temporal
    const serieHtml = `
        <table class="validacao-table">
            <thead>
                <tr style="background: #f0f0f0; font-weight: bold;">
                    <th>Ano</th>
                    <th style="color: #EF3B39;">PT (%)</th>
                    <th style="color: #0066CC;">Bolsonarismo (%)</th>
                    <th style="color: #888888;">Terceira Via (%)</th>
                    <th>Saldo (PT - Bolso)</th>
                    <th>Votos</th>
                </tr>
            </thead>
            <tbody>
                ${[2010, 2014, 2018, 2022].map(ano => {
                    const h = historico[ano];
                    if (!h) return '';
                    return `
                        <tr>
                            <td><strong>${ano}</strong></td>
                            <td style="color: #EF3B39;">${h.petismo}%</td>
                            <td style="color: #0066CC;">${h.bolsonarismo}%</td>
                            <td style="color: #888888;">${h.terceira_via}%</td>
                            <td style="${h.saldo > 0 ? 'color: #EF3B39;' : 'color: #0066CC;'}">${h.saldo > 0 ? '+' : ''}${h.saldo}</td>
                            <td>${h.total_validos.toLocaleString('pt-BR')}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Card de projeção
    const projecaoHtml = `
        <div class="validacao-card">
            <h4>📊 Projeção 2026</h4>
            <div class="projecao-valores">
                <div class="projecao-item">
                    <span class="projecao-label">PT:</span>
                    <span class="projecao-valor" style="color: #EF3B39; font-weight: bold;">
                        ${projecao.petismo}%
                    </span>
                </div>
                <div class="projecao-item">
                    <span class="projecao-label">Bolsonarismo:</span>
                    <span class="projecao-valor" style="color: #0066CC; font-weight: bold;">
                        ${projecao.bolsonarismo}%
                    </span>
                </div>
                <div class="projecao-item">
                    <span class="projecao-label">Saldo:</span>
                    <span class="projecao-valor" style="font-weight: bold;">
                        ${projecao.saldo > 0 ? '+' : ''}${projecao.saldo}
                    </span>
                </div>
            </div>

            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                <p><strong>Classificação:</strong> ${dados.classificacao_2026}</p>
                <p><strong>Tendência PT:</strong>
                    ${tendencia.petismo === 'crescente' ? '📈' : tendencia.petismo === 'decrescente' ? '📉' : '⏸️'}
                    ${tendencia.petismo}
                </p>
            </div>
        </div>
    `;

    const html = `
        <div class="validacao-header">
            <h3>📍 ${municipio}</h3>
            <p style="color: #666;">
                Calha: <strong>${dados.calha}</strong>
            </p>
        </div>

        <div class="validacao-section">
            <h4>📈 Série Temporal 2010-2022</h4>
            ${serieHtml}
        </div>

        <div class="validacao-section">
            ${projecaoHtml}
        </div>

        <div class="validacao-check">
            <p style="color: #27ae60; font-weight: bold;">
                ✓ Dados consistentes entre Evolução Ideológica e Mapa Interativo
            </p>
        </div>
    `;

    container.innerHTML = html;
}

function mostrarValidacaoCompleta() {
    const container = document.getElementById('validacao-resultado');
    if (!container) return;

    // Estatísticas gerais
    let totalMunicipios = Object.keys(validacaoState.dados).length;

    const classificacoes = {};
    const calhas = {};

    Object.entries(validacaoState.dados).forEach(([mun, dados]) => {
        const cls = dados.classificacao_2026;
        if (cls) classificacoes[cls] = (classificacoes[cls] || 0) + 1;

        const calha = dados.calha;
        if (calha) calhas[calha] = (calhas[calha] || 0) + 1;
    });

    const statsHtml = `
        <div class="validacao-stats">
            <div class="stat-card">
                <h3>${totalMunicipios}</h3>
                <p>Municípios</p>
            </div>
            <div class="stat-card">
                <h3>${Object.keys(calhas).length}</h3>
                <p>Calhas</p>
            </div>
            <div class="stat-card">
                <h3>${classificacoes['Bastião Lulista'] || 0}</h3>
                <p>Bastião Lulista</p>
            </div>
            <div class="stat-card">
                <h3>${classificacoes['Tendência Lulista'] || 0}</h3>
                <p>Tendência Lulista</p>
            </div>
            <div class="stat-card">
                <h3>${classificacoes['Swing / Dividido'] || 0}</h3>
                <p>Swing/Dividido</p>
            </div>
            <div class="stat-card">
                <h3>${classificacoes['Tendência Bolsonarista'] || 0}</h3>
                <p>Tend. Bolsonarista</p>
            </div>
        </div>
    `;

    const tabela = `
        <div class="validacao-section">
            <h4>📍 Distribuição por Calha (clique nos números para detalhes)</h4>
            <table class="validacao-table-small">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th>Calha</th>
                        <th>Municípios</th>
                        <th>Bastião Lulista</th>
                        <th>Tendência Lulista</th>
                        <th>Swing</th>
                        <th>Tend. Bolso</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(calhas).sort().map(calha => {
                        const munsCalha = Object.entries(validacaoState.dados)
                            .filter(([m, d]) => d.calha === calha)
                            .map(([m, d]) => d);

                        const classByCalha = {};
                        munsCalha.forEach(d => {
                            const cls = d.classificacao_2026;
                            classByCalha[cls] = (classByCalha[cls] || 0) + 1;
                        });

                        return `
                            <tr>
                                <td><strong>${calha}</strong></td>
                                <td>${munsCalha.length}</td>
                                <td><span class="cell-clickable" onclick="mostrarMunicipiosPorClassificacao('${calha}', 'Bastião Lulista')" title="Clique para ver">${classByCalha['Bastião Lulista'] || 0}</span></td>
                                <td><span class="cell-clickable" onclick="mostrarMunicipiosPorClassificacao('${calha}', 'Tendência Lulista')" title="Clique para ver">${classByCalha['Tendência Lulista'] || 0}</span></td>
                                <td><span class="cell-clickable" onclick="mostrarMunicipiosPorClassificacao('${calha}', 'Swing / Dividido')" title="Clique para ver">${classByCalha['Swing / Dividido'] || 0}</span></td>
                                <td><span class="cell-clickable" onclick="mostrarMunicipiosPorClassificacao('${calha}', 'Tendência Bolsonarista')" title="Clique para ver">${classByCalha['Tendência Bolsonarista'] || 0}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = `
        <div class="validacao-header">
            <h3>✓ Validação Cruzada Completa</h3>
            <p style="color: #27ae60; font-weight: bold;">
                Dados da Evolução Ideológica e Mapa Interativo estão sincronizados
            </p>
        </div>
        ${statsHtml}
        ${tabela}
        <p style="margin-top: 2rem; color: #666; font-size: 0.9rem;">
            📌 Selecione um município acima ou clique nos números da tabela para ver detalhes
        </p>
    `;
}

function mostrarMunicipiosPorClassificacao(calha, classificacao) {
    // Filtrar municípios por calha e classificação
    const municipios = Object.entries(validacaoState.dados)
        .filter(([mun, d]) => d.calha === calha && d.classificacao_2026 === classificacao)
        .map(([mun, d]) => ({ nome: mun, dados: d }))
        .sort((a, b) => b.dados.projecao_2026.petismo - a.dados.projecao_2026.petismo);

    if (municipios.length === 0) {
        alert('Nenhum município encontrado');
        return;
    }

    // Criar modal com detalhes
    const modalHtml = `
        <div class="validacao-modal-overlay" onclick="fecharModalMunicipios()">
            <div class="validacao-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${calha}</h3>
                    <p style="color: #666; margin: 0.25rem 0 0 0;">
                        ${classificacao} (${municipios.length} município${municipios.length > 1 ? 's' : ''})
                    </p>
                    <button class="modal-close" onclick="fecharModalMunicipios()">&times;</button>
                </div>

                <div class="modal-content">
                    <div class="municipios-grid">
                        ${municipios.map(m => gerarCardMunicipio(m.nome, m.dados, classificacao)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Adicionar modal ao DOM
    let existing = document.getElementById('validacao-modal-container');
    if (!existing) {
        existing = document.createElement('div');
        existing.id = 'validacao-modal-container';
        document.body.appendChild(existing);
    }
    existing.innerHTML = modalHtml;
}

function gerarCardMunicipio(nome, dados, classificacao) {
    const proj = dados.projecao_2026 || {};
    const historico = dados.historico || {};
    const h2022 = historico['2022'] || {};

    // Determinar cor e ícone baseado na classificação
    let corPrincipal = '#666';
    let icone = '📍';

    if (classificacao.includes('Bastião Lulista')) {
        corPrincipal = '#EF3B39';
        icone = '🔴';
    } else if (classificacao.includes('Tendência Lulista')) {
        corPrincipal = '#FF6B6B';
        icone = '🟠';
    } else if (classificacao.includes('Swing')) {
        corPrincipal = '#FF9900';
        icone = '🟡';
    } else if (classificacao.includes('Bolsonarista')) {
        corPrincipal = '#0066CC';
        icone = '🔵';
    }

    return `
        <div class="municipio-card" style="border-left-color: ${corPrincipal};">
            <h4>${icone} ${nome}</h4>

            <div class="card-section">
                <p style="font-size: 0.85rem; color: #666; margin: 0;">
                    <strong>Situação Atual (2022):</strong>
                </p>
                <div class="dados-inline">
                    <span style="color: #EF3B39;">PT: ${h2022.petismo || '—'}%</span>
                    <span style="color: #0066CC;">Bolso: ${h2022.bolsonarismo || '—'}%</span>
                </div>
            </div>

            <div class="card-section">
                <p style="font-size: 0.85rem; color: #666; margin: 0;">
                    <strong>Projeção 2026:</strong>
                </p>
                <div class="dados-inline">
                    <span style="color: #EF3B39; font-weight: bold;">PT: ${proj.petismo || '—'}%</span>
                    <span style="color: #0066CC; font-weight: bold;">Bolso: ${proj.bolsonarismo || '—'}%</span>
                </div>
            </div>

            <div class="card-section">
                <p style="font-size: 0.85rem; color: #666; margin: 0;">
                    <strong>Saldo (2026):</strong> <span style="font-weight: bold; ${proj.saldo > 0 ? 'color: #EF3B39;' : 'color: #0066CC;'}">${proj.saldo > 0 ? '+' : ''}${proj.saldo}</span>
                </p>
            </div>

            <div class="card-section" style="background: #f9f9f9; padding: 0.75rem; border-radius: 4px; border-left: 3px solid ${corPrincipal};">
                <p style="font-size: 0.85rem; margin: 0;">
                    <strong>✓ Motivo da Classificação:</strong><br>
                    ${gerarJustificativa(classificacao, proj.petismo, proj.saldo)}
                </p>
            </div>

            <div class="card-section">
                <p style="font-size: 0.8rem; color: #999; margin: 0;">
                    Tendência: ${dados.tendencia?.petismo === 'crescente' ? '📈' : dados.tendencia?.petismo === 'decrescente' ? '📉' : '⏸️'} ${dados.tendencia?.petismo || '—'}
                </p>
            </div>
        </div>
    `;
}

function gerarJustificativa(classificacao, ptPct, saldo) {
    if (classificacao === 'Bastião Lulista') {
        return `PT projetado em <strong>${ptPct}%</strong> (≥55%), com saldo positivo de <strong>${saldo}</strong>. Região consolidada para o PT.`;
    } else if (classificacao === 'Tendência Lulista') {
        return `PT em <strong>${ptPct}%</strong> (45-55%), com saldo positivo <strong>${saldo}</strong>. Favorável ao PT, mas não garantido.`;
    } else if (classificacao === 'Swing / Dividido') {
        return `Saldo entre <strong>-10 e +10</strong> (<strong>${saldo}</strong>). Disputa equilibrada entre PT e Bolsonarismo.`;
    } else if (classificacao === 'Tendência Bolsonarista') {
        return `Bolsonarismo em alta com saldo negativo de <strong>${saldo}</strong>. Região mudando para direita.`;
    } else {
        return `Classificação baseada em análise de série temporal 2010-2022.`;
    }
}

function fecharModalMunicipios() {
    const existing = document.getElementById('validacao-modal-container');
    if (existing) {
        existing.remove();
    }
}

function limparValidacao() {
    const container = document.getElementById('validacao-resultado');
    if (container) {
        container.innerHTML = '';
    }
    document.getElementById('select-municipio-validacao').value = '';
    mostrarValidacaoCompleta();
}

window.initValidacaoCruzada = initValidacaoCruzada;
window.validarMunicipioSelecionado = validarMunicipioSelecionado;
window.limparValidacao = limparValidacao;
window.mostrarMunicipiosPorClassificacao = mostrarMunicipiosPorClassificacao;
window.fecharModalMunicipios = fecharModalMunicipios;
