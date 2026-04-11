/**
 * Resumo Correto de Eduardo Braga
 * Carrega dados de analise_eb_completa.json e senador_2018_eb.json
 * Calcula: votos, percentuais, urnas ganhas, variação, top crescimento/queda
 */

let resumoEBState = {
    dados2010: {},
    dados2018: {},
    initialized: false
};

async function initResumoEBCorreto() {
    console.log('🚀 Iniciando resumo correto de EB...');

    // Aguardar para garantir que o DOM está completamente pronto
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        // Carregar dados de 2010 (de analise_eb_completa)
        const resp2010 = await fetch('./data/ideologia/analise_eb_completa.json');
        const dados2010 = await resp2010.json();

        // Carregar dados de 2018 (de senador_2018_eb)
        const resp2018 = await fetch('./data/ideologia/senador_2018_eb.json');
        const dados2018 = await resp2018.json();

        // Carregar dados de brancos e nulos
        const respNulosBrancos = await fetch('./data/ideologia/votos_nulos_brancos_comparativo.json');
        const dadosNulosBrancos = await respNulosBrancos.json();

        resumoEBState.dados2010 = dados2010;
        resumoEBState.dados2018 = dados2018;
        resumoEBState.dadosNulosBrancos = dadosNulosBrancos;

        console.log('✓ Dados 2010 carregados:', Object.keys(dados2010).length, 'municípios');
        console.log('✓ Dados 2018 carregados:', Object.keys(dados2018.municipios).length, 'municípios');
        console.log('✓ Dados de nulos/brancos carregados');

        // Tentar atualizar com retry
        await atualizarIndicadoresComRetry();

        resumoEBState.initialized = true;
        console.log('✓ Resumo de EB atualizado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao carregar resumo EB:', error);
    }
}

async function atualizarIndicadoresComRetry() {
    let tentativas = 0;
    const maxTentativas = 10;

    while (tentativas < maxTentativas) {
        const sucesso = atualizarIndicadoresResumoCorreto();
        if (sucesso) {
            console.log('✓ Indicadores atualizados após', tentativas, 'tentativa(s)');
            break;
        }
        tentativas++;
        console.log('⏳ Tentativa', tentativas, 'de atualizar indicadores...');
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (tentativas >= maxTentativas) {
        console.warn('⚠️  Não foi possível atualizar indicadores após', maxTentativas, 'tentativas');
    }
}

function atualizarIndicadoresResumoCorreto() {
    const dados2010 = resumoEBState.dados2010;
    const dados2018 = resumoEBState.dados2018;

    if (!dados2010 || !dados2018 || Object.keys(dados2010).length === 0) {
        console.warn('⚠️  Dados não carregados ainda');
        return false;
    }

    // ============ CÁLCULOS GERAIS ============

    // Totais 2010 (agregados por município)
    let votos_eb_2010 = 0, votos_validos_2010 = 0;
    let municipios_totais_2010 = 0;

    Object.values(dados2010).forEach(municipio => {
        if (municipio.historico && municipio.historico['2010']) {
            votos_eb_2010 += municipio.historico['2010'].votos_eb || 0;
            votos_validos_2010 += municipio.historico['2010'].votos_validos || 0;
            municipios_totais_2010++;
        }
    });

    // Totais 2018 (com dados por seção)
    const votos_eb_2018 = dados2018.totais.votos_eb;
    const votos_validos_2018 = dados2018.totais.votos_validos;

    const pct_2010 = votos_validos_2010 > 0 ? (votos_eb_2010 / votos_validos_2010 * 100).toFixed(2) : 0;
    const pct_2018 = votos_validos_2018 > 0 ? (votos_eb_2018 / votos_validos_2018 * 100).toFixed(2) : 0;

    console.log('📊 Cálculos:');
    console.log(`  2010 (Senador): ${votos_eb_2010.toLocaleString('pt-BR')} / ${votos_validos_2010.toLocaleString('pt-BR')} = ${pct_2010}%`);
    console.log(`  2018 (Senador): ${votos_eb_2018.toLocaleString('pt-BR')} / ${votos_validos_2018.toLocaleString('pt-BR')} = ${pct_2018}%`);

    // ============ URNAS GANHAS (1º LUGAR) ============

    // Para 2010: analisar a estrutura dos dados
    console.log('📋 Amostra de dados 2010:', Object.entries(dados2010).slice(0, 2));

    // Para 2010: usamos número de municípios onde EB tem bom desempenho
    // (Como não temos ranking por seção em 2010, usamos municipios com performance >= 25% como proxy)
    let municipios_eb_ganhou_2010 = 0;
    Object.entries(dados2010).forEach(([mun, municipio]) => {
        if (municipio.historico && municipio.historico['2010']) {
            const hist2010 = municipio.historico['2010'];
            const pct_eb = hist2010.percentual_eb !== undefined ? hist2010.percentual_eb :
                          (hist2010.votos_eb && hist2010.votos_validos ?
                           (hist2010.votos_eb / hist2010.votos_validos * 100) : 0);

            console.log(`  ${mun}: votos_eb=${hist2010.votos_eb}, votos_validos=${hist2010.votos_validos}, percentual=${pct_eb.toFixed(2)}%`);

            // Contar como "ganhou" se percentual >= 25% (boa chance de ser 1º lugar em 2010)
            if (pct_eb >= 25) {
                municipios_eb_ganhou_2010++;
            }
        }
    });

    const taxa_2010 = municipios_totais_2010 > 0 ? ((municipios_eb_ganhou_2010 / municipios_totais_2010) * 100).toFixed(1) : 0;

    // Para 2018: contamos seções onde EB teve percentual alto
    let urnas_ganhas_2018 = 0;
    const total_secoes_2018 = Object.keys(dados2018.secoes).length;

    // Uma seção é "ganha" se EB teve >= 25% (heurística para 1º lugar)
    Object.values(dados2018.secoes).forEach(secao => {
        if (secao.percentual_eb >= 25) {
            urnas_ganhas_2018++;
        }
    });

    const taxa_2018 = total_secoes_2018 > 0 ? ((urnas_ganhas_2018 / total_secoes_2018) * 100).toFixed(1) : 0;

    console.log(`  Urnas 2010: ${municipios_eb_ganhou_2010} / ${municipios_totais_2010} municípios (>=30%) = ${taxa_2010}%`);
    console.log(`  Urnas 2018: ${urnas_ganhas_2018} / ${total_secoes_2018} seções (>=25%) = ${taxa_2018}%`);

    // ============ VARIAÇÃO ============

    const variacao_absoluta = (pct_2018 - pct_2010).toFixed(2);
    const variacao_relativa = pct_2010 > 0 ? ((variacao_absoluta / pct_2010) * 100).toFixed(1) : 0;

    console.log(`  Variação: ${variacao_absoluta} pp (${variacao_relativa}% de mudança)`);

    // ============ TOP CRESCIMENTO/QUEDA ============

    const growth = [];
    Object.entries(dados2010).forEach(([nomeMun, mun2010]) => {
        const mun2018 = dados2018.municipios[nomeMun];
        if (mun2018 && mun2010.historico && mun2010.historico['2010']) {
            const pct2010_mun = mun2010.historico['2010'].percentual_eb || 0;
            const pct2018_mun = mun2018.percentual_eb || 0;

            growth.push({
                name: nomeMun,
                variation: pct2018_mun - pct2010_mun
            });
        }
    });

    growth.sort((a, b) => b.variation - a.variation);

    // ============ ATUALIZAR DOM ============

    const resumoTab = document.getElementById('resumo');
    if (!resumoTab) {
        console.warn('⚠️  Tab #resumo não encontrada');
        return false;
    }

    const indicadores = resumoTab.querySelectorAll('.indicator-card');
    console.log('  Encontrados', indicadores.length, 'cards de indicadores');

    if (indicadores.length < 4) {
        console.warn('⚠️  Menos de 4 cards encontrados');
        return false;
    }

    // Card 1: Votos absolutos
    try {
        const card1 = indicadores[0];
        const values1 = card1.querySelectorAll('.value-2010, .value-2018');
        if (values1.length >= 2) {
            values1[0].textContent = votos_eb_2010.toLocaleString('pt-BR');
            values1[1].textContent = votos_eb_2018.toLocaleString('pt-BR');
            console.log('  ✓ Card 1 (votos absolutos) atualizado');
        }
    } catch (e) {
        console.warn('⚠️  Erro ao atualizar card 1:', e);
    }

    // Card 2: Percentual
    try {
        const card2 = indicadores[1];
        const values2 = card2.querySelectorAll('.value-2010, .value-2018');
        if (values2.length >= 2) {
            values2[0].textContent = pct_2010 + '%';
            values2[1].textContent = pct_2018 + '%';
            console.log('  ✓ Card 2 (percentuais) atualizado com', pct_2010 + '%', 'vs', pct_2018 + '%');
        }
    } catch (e) {
        console.warn('⚠️  Erro ao atualizar card 2:', e);
    }

    // Card 3: Urnas ganhas
    try {
        const card3 = indicadores[2];
        const values3 = card3.querySelectorAll('.value-2010, .value-2018');
        if (values3.length >= 2) {
            values3[0].textContent = taxa_2010 + '%';
            values3[1].textContent = taxa_2018 + '%';
            console.log('  ✓ Card 3 (urnas ganhas) atualizado com', taxa_2010 + '%', 'vs', taxa_2018 + '%');
        }
    } catch (e) {
        console.warn('⚠️  Erro ao atualizar card 3:', e);
    }

    // Variação
    try {
        const variationDiv = document.getElementById('variation');
        if (variationDiv) {
            variationDiv.innerHTML = `${(variacao_absoluta > 0 ? '+' : '')}${variacao_absoluta} pp<br><small>(${variacao_relativa > 0 ? '+' : ''}${variacao_relativa}% de mudança)</small>`;
            variationDiv.style.color = variacao_absoluta > 0 ? 'green' : 'red';
            console.log('  ✓ Variação atualizada');
        }
    } catch (e) {
        console.warn('⚠️  Erro ao atualizar variação:', e);
    }

    // Top Crescimento e Queda
    try {
        const topGrowth = document.getElementById('top-growth');
        if (topGrowth && growth.length > 0) {
            topGrowth.innerHTML = growth.slice(0, 5).map((item, idx) =>
                `<li>${item.name}: ${(item.variation > 0 ? '+' : '')}${item.variation.toFixed(2)}pp</li>`
            ).join('');
            console.log('  ✓ Top crescimento atualizado');
        }

        const topDecline = document.getElementById('top-decline');
        if (topDecline && growth.length > 0) {
            topDecline.innerHTML = growth.slice(-5).reverse().map((item, idx) =>
                `<li>${item.name}: ${item.variation.toFixed(2)}pp</li>`
            ).join('');
            console.log('  ✓ Top queda atualizado');
        }

        // ============ ATUALIZAR BRANCOS E NULOS ============
        const dadosNulosBrancos = resumoEBState.dadosNulosBrancos;
        if (dadosNulosBrancos && dadosNulosBrancos.dados_2010 && dadosNulosBrancos.dados_2018) {
            // Para 2010: usar dados de Senador (2ª vaga)
            const senador2010 = dadosNulosBrancos.dados_2010['Senador (2ª vaga)'] || {};
            // Para 2018: usar dados de Presidente (único disponível)
            const presidente2018 = dadosNulosBrancos.dados_2018['Presidente'] || {};

            // Adicionar seção de resumo de nulos e brancos logo após o resumo de EB
            const resumoNulosBrancosDiv = document.getElementById('resumo-nulos-brancos');
            if (resumoNulosBrancosDiv) {
                const htmlNulosBrancos = `
                    <h2 style="margin-top: 2rem;">📊 Resumo de Votos Brancos e Nulos</h2>
                    <p style="color: #666; margin-bottom: 1rem;">Comparação de votos brancos e nulos entre Senador 2010 e Presidente 2018</p>

                    <div class="indicators-grid" style="margin-bottom: 2rem;">
                        <div class="indicator-card" style="background: #f0f7ff;">
                            <h3>Votos Brancos</h3>
                            <div class="indicator-value">
                                <span style="color: #f39c12; font-weight: bold;">${(senador2010.votos_brancos || 0).toLocaleString('pt-BR')}</span>
                                <span class="vs">vs</span>
                                <span style="color: #f39c12; font-weight: bold;">${(presidente2018.votos_brancos || 0).toLocaleString('pt-BR')}</span>
                            </div>
                            <div class="indicator-detail">
                                <span style="color: #f39c12;">${senador2010.pct_brancos || 0}%</span> vs <span style="color: #f39c12;">${presidente2018.pct_brancos || 0}%</span>
                            </div>
                        </div>

                        <div class="indicator-card" style="background: #fff5f5;">
                            <h3>Votos Nulos</h3>
                            <div class="indicator-value">
                                <span style="color: #e74c3c; font-weight: bold;">${(senador2010.votos_nulos || 0).toLocaleString('pt-BR')}</span>
                                <span class="vs">vs</span>
                                <span style="color: #e74c3c; font-weight: bold;">${(presidente2018.votos_nulos || 0).toLocaleString('pt-BR')}</span>
                            </div>
                            <div class="indicator-detail">
                                <span style="color: #e74c3c;">${senador2010.pct_nulos || 0}%</span> vs <span style="color: #e74c3c;">${presidente2018.pct_nulos || 0}%</span>
                            </div>
                        </div>

                        <div class="indicator-card" style="background: #f5f5f5;">
                            <h3>Votos Válidos</h3>
                            <div class="indicator-value">
                                <span style="color: #27ae60; font-weight: bold;">${(senador2010.votos_validos || 0).toLocaleString('pt-BR')}</span>
                                <span class="vs">vs</span>
                                <span style="color: #27ae60; font-weight: bold;">${(presidente2018.votos_validos || 0).toLocaleString('pt-BR')}</span>
                            </div>
                            <div class="indicator-detail">
                                <span style="color: #27ae60;">${senador2010.pct_validos || 0}%</span> vs <span style="color: #27ae60;">${presidente2018.pct_validos || 0}%</span>
                            </div>
                        </div>
                    </div>

                    <div style="padding: 1rem; background: #f9f9f9; border-radius: 4px; border-left: 4px solid #0066cc; margin-bottom: 2rem;">
                        <strong>💡 O que significa?</strong>
                        <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0; color: #666;">
                            <li><strong>Votos Válidos:</strong> Votos para candidatos específicos</li>
                            <li><strong>Votos Brancos:</strong> Votos deixados em branco pelo eleitor</li>
                            <li><strong>Votos Nulos:</strong> Votos inválidos (rasgado, digitação errada, etc)</li>
                        </ul>
                    </div>

                    <p style="font-size: 0.85rem; color: #999;">
                        📅 <strong>Nota:</strong> 2010: Senador (2ª vaga) | 2018: Presidente (único cargo disponível para AM)
                    </p>
                `;

                resumoNulosBrancosDiv.innerHTML = htmlNulosBrancos;
                console.log('  ✓ Dados de nulos/brancos adicionados ao resumo');
            }
        }
    } catch (e) {
        console.warn('⚠️  Erro ao atualizar ranking:', e);
    }

    return true;
}

// Inicializar imediatamente
window.initResumoEBCorreto = initResumoEBCorreto;

document.addEventListener('DOMContentLoaded', function() {
    initResumoEBCorreto();

    // Também atualizar quando clicar na aba resumo
    const resumoBtns = document.querySelectorAll('[data-tab="resumo"]');
    resumoBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            setTimeout(() => {
                console.log('📌 Aba Resumo clicada - atualizando indicadores');
                atualizarIndicadoresComRetry();
            }, 100);
        });
    });
});
