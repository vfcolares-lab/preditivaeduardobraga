/**
 * Resumo de Votos Nulos e Brancos
 * Comparação 2010 vs 2018 vs 2022
 */

let resumoNulosBrancosState = {
    dados: {},
    initialized: false
};

async function initResumoNulosBrancos() {
    if (resumoNulosBrancosState.initialized) return;

    console.log('⏳ Carregando resumo de votos nulos e brancos...');

    try {
        const resp = await fetch('./data/ideologia/votos_nulos_brancos_comparativo.json');
        const dados = await resp.json();

        resumoNulosBrancosState.dados = dados;
        mostrarResumoNulosBrancos();

        resumoNulosBrancosState.initialized = true;
        console.log('✓ Resumo de votos nulos/brancos carregado');

    } catch (error) {
        console.error('❌ Erro ao carregar resumo:', error);
    }
}

function mostrarResumoNulosBrancos() {
    const container = document.getElementById('resumo-nulos-brancos');
    if (!container) return;

    const dados = resumoNulosBrancosState.dados;

    // Tabela 2010
    let html2010 = '';
    if (dados['dados_2010']) {
        html2010 = gerarTabelaCargo(2010, dados['dados_2010']);
    }

    // Tabela 2018
    let html2018 = '';
    if (dados['dados_2018']) {
        html2018 = gerarTabelaCargo(2018, dados['dados_2018']);
    }

    // Tabela 2022
    let html2022 = '';
    if (dados['dados_2022']) {
        html2022 = gerarTabelaCargo(2022, dados['dados_2022']);
    }

    const html = `
        <div style="padding: 20px;">
            <h3>📊 Análise de Votos Nulos e Brancos</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Comparação de votos nulos e brancos por cargo e eleição
            </p>

            ${html2010 ? `
                <div style="margin-bottom: 30px;">
                    <h4>📅 2010</h4>
                    ${html2010}
                </div>
            ` : ''}

            ${html2018 ? `
                <div style="margin-bottom: 30px;">
                    <h4>📅 2018</h4>
                    <p style="font-size: 12px; color: #999;">⚠️ Nota: Dados de 2018 incluem apenas Presidente para Amazonas</p>
                    ${html2018}
                </div>
            ` : ''}

            ${html2022 ? `
                <div style="margin-bottom: 30px;">
                    <h4>📅 2022</h4>
                    ${html2022}
                </div>
            ` : ''}

            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; border-left: 4px solid #0066cc;">
                <strong>💡 O que significa?</strong>
                <ul style="margin: 10px 0 0 20px; padding: 0;">
                    <li><strong>Votos Válidos:</strong> Votos para candidatos específicos</li>
                    <li><strong>Votos Brancos:</strong> Votos em branco (eleitor deixou em branco)</li>
                    <li><strong>Votos Nulos:</strong> Votos inválidos (#NULO#, rasgado, etc)</li>
                </ul>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function gerarTabelaCargo(ano, dados) {
    let html = `
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
                <tr style="background: #f0f0f0; border-bottom: 2px solid #ccc;">
                    <th style="padding: 10px; text-align: left; border-right: 1px solid #ddd;">Cargo</th>
                    <th style="padding: 10px; text-align: right; border-right: 1px solid #ddd;">Votos Totais</th>
                    <th style="padding: 10px; text-align: right; border-right: 1px solid #ddd;">Válidos</th>
                    <th style="padding: 10px; text-align: right; border-right: 1px solid #ddd;">Brancos</th>
                    <th style="padding: 10px; text-align: right;">Nulos</th>
                </tr>
            </thead>
            <tbody>
    `;

    const cargos_ordem = [
        'Presidente',
        'Governador',
        'Senador (1ª vaga)',
        'Senador (2ª vaga)',
        'Cargo 6',
        'Cargo 7'
    ];

    for (const cargo of cargos_ordem) {
        if (!(cargo in dados)) continue;

        const stats = dados[cargo];
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; border-right: 1px solid #eee;"><strong>${cargo}</strong></td>
                <td style="padding: 10px; text-align: right; border-right: 1px solid #eee;">
                    ${stats.votos_geral.toLocaleString('pt-BR')}
                </td>
                <td style="padding: 10px; text-align: right; border-right: 1px solid #eee;">
                    <span style="color: #27ae60; font-weight: bold;">
                        ${stats.votos_validos.toLocaleString('pt-BR')}
                    </span><br>
                    <span style="font-size: 11px; color: #666;">${stats.pct_validos}%</span>
                </td>
                <td style="padding: 10px; text-align: right; border-right: 1px solid #eee;">
                    <span style="color: #f39c12; font-weight: bold;">
                        ${stats.votos_brancos.toLocaleString('pt-BR')}
                    </span><br>
                    <span style="font-size: 11px; color: #666;">${stats.pct_brancos}%</span>
                </td>
                <td style="padding: 10px; text-align: right;">
                    <span style="color: #e74c3c; font-weight: bold;">
                        ${stats.votos_nulos.toLocaleString('pt-BR')}
                    </span><br>
                    <span style="font-size: 11px; color: #666;">${stats.pct_nulos}%</span>
                </td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}

window.initResumoNulosBrancos = initResumoNulosBrancos;
