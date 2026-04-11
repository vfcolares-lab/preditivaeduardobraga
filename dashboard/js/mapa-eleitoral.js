/**
 * Mapa Eleitoral Interativo - Amazonas 2010-2022
 * Integração com estilo Polling Stations Results
 */

let mapaState = {
    map: null,
    municipiosGeo: {},
    dadosEleitoral: {},
    circulos: {},
    eleicaoSelecionada: 2022,
    cargos: [],
    modoVisualizacao: 'vencedor', // 'vencedor' ou 'margem'
    initialized: false
};

// Paleta de cores para os campos ideológicos
const CORES = {
    PT: '#EF3B39',           // Vermelho petista
    DIREITA: '#0066CC',       // Azul bolsonarista
    CENTRO: '#FFC500',        // Amarelo centro
    TERCEIRA_VIA: '#888888',  // Cinza
    SWING: '#FF9900'          // Laranja swing
};

async function initMapaEleitoral() {
    if (mapaState.initialized) return;

    console.log('⏳ Inicializando Mapa Eleitoral...');

    try {
        // Carregar dados geográficos
        const geoResponse = await fetch('./data/municipios_am_geo.json');
        mapaState.municipiosGeo = await geoResponse.json();

        // Carregar dados eleitorais
        const eletResponse = await fetch('./data/ideologia/evolucao_municipios.json');
        mapaState.dadosEleitoral = await eletResponse.json();

        // Inicializar mapa
        initMap();

        // Configurar controles
        setupControles();

        // Desenhar municípios
        desenharMunicipios(2022);

        mapaState.initialized = true;
        console.log('✓ Mapa Eleitoral iniciado');

    } catch (error) {
        console.error('❌ Erro ao carregar Mapa Eleitoral:', error);
    }
}

function initMap() {
    // Centro do Amazonas
    const centerAM = [-3.1129, -60.0217]; // Manaus

    mapaState.map = L.map('map-container', {
        center: centerAM,
        zoom: 6,
        minZoom: 5,
        maxZoom: 10,
        scrollWheelZoom: true
    });

    // Adicionar tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapaState.map);
}

function setupControles() {
    const container = document.getElementById('mapa-controles');
    if (!container) return;

    // Seletor de eleição
    const eleicoesHtml = `
        <div class="mapa-control-group">
            <label>Eleição:</label>
            <select id="select-eleicao" class="mapa-select">
                <option value="2010">2010</option>
                <option value="2014">2014</option>
                <option value="2018">2018</option>
                <option value="2022" selected>2022</option>
            </select>
        </div>

        <div class="mapa-control-group">
            <label>Visualização:</label>
            <select id="select-visualizacao" class="mapa-select">
                <option value="vencedor" selected>Por Vencedor</option>
                <option value="margem">Por Margem de Vitória</option>
                <option value="pt">Força PT (%)</option>
                <option value="direita">Força Direita (%)</option>
            </select>
        </div>

        <div class="mapa-legenda" id="mapa-legenda"></div>
    `;

    container.innerHTML = eleicoesHtml;

    // Event listeners
    document.getElementById('select-eleicao').addEventListener('change', (e) => {
        mapaState.eleicaoSelecionada = parseInt(e.target.value);
        desenharMunicipios(mapaState.eleicaoSelecionada);
    });

    document.getElementById('select-visualizacao').addEventListener('change', (e) => {
        mapaState.modoVisualizacao = e.target.value;
        desenharMunicipios(mapaState.eleicaoSelecionada);
    });

    atualizarLegenda();
}

function desenharMunicipios(ano) {
    // Limpar círculos anteriores
    Object.values(mapaState.circulos).forEach(circulo => {
        if (circulo) {
            mapaState.map.removeLayer(circulo);
        }
    });
    mapaState.circulos = {};

    // Desenhar novo círculo para cada município
    for (const [municipio, geo] of Object.entries(mapaState.municipiosGeo)) {
        if (!mapaState.dadosEleitoral[municipio]) continue;

        const dados = mapaState.dadosEleitoral[municipio];
        const historico = dados.historico || {};
        const dataAno = historico[ano];

        if (!dataAno) continue;

        const lat = geo.lat;
        const lng = geo.lng;
        const cor = obterCor(dataAno, ano);
        const radius = obterRaio(dataAno);

        // Criar círculo
        const circulo = L.circleMarker([lat, lng], {
            radius: radius,
            fillColor: cor,
            color: '#333',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(mapaState.map);

        // Popup com informações
        const popup = gerarPopup(municipio, dataAno, geo.calha);
        circulo.bindPopup(popup);

        // Tooltip
        circulo.bindTooltip(municipio, { permanent: false, direction: 'center' });

        mapaState.circulos[municipio] = circulo;
    }

    atualizarLegenda();
}

function obterCor(dados, ano) {
    switch (mapaState.modoVisualizacao) {
        case 'vencedor':
            // Vencedor da eleição
            if (dados.petismo > dados.bolsonarismo) {
                return CORES.PT;
            } else if (dados.bolsonarismo > dados.petismo) {
                return CORES.DIREITA;
            } else {
                return CORES.CENTRO;
            }

        case 'margem':
            // Gradiente baseado em margem de vitória
            const saldo = Math.abs(dados.saldo);
            if (saldo > 30) return dados.saldo > 0 ? '#8B0000' : '#000080'; // Vermelho/Azul escuro
            if (saldo > 20) return dados.saldo > 0 ? '#DC143C' : '#0047AB'; // Vermelho/Azul
            if (saldo > 10) return dados.saldo > 0 ? '#FF6B6B' : '#4169E1'; // Vermelho/Azul claro
            return CORES.SWING; // Laranja para swing

        case 'pt':
            // Gradiente PT
            if (dados.petismo > 70) return '#8B0000';
            if (dados.petismo > 50) return '#DC143C';
            if (dados.petismo > 30) return '#FF6B6B';
            return '#FFB6C1';

        case 'direita':
            // Gradiente Direita
            if (dados.bolsonarismo > 70) return '#000080';
            if (dados.bolsonarismo > 50) return '#0047AB';
            if (dados.bolsonarismo > 30) return '#4169E1';
            return '#87CEEB';

        default:
            return CORES.CENTRO;
    }
}

function obterRaio(dados) {
    const total = dados.total_validos || 1;
    // Raio proporcional ao tamanho do eleitorado (com limite)
    return Math.max(8, Math.min(25, 5 + Math.log(total) / 2));
}

function gerarPopup(municipio, dados, calha) {
    return `
        <div class="popup-municipio">
            <h4>${municipio}</h4>
            <p><strong>Calha:</strong> ${calha}</p>
            <hr>
            <p><strong>PT:</strong> <span style="color: ${CORES.PT}">${dados.petismo}%</span></p>
            <p><strong>Direita:</strong> <span style="color: ${CORES.DIREITA}">${dados.bolsonarismo}%</span></p>
            <p><strong>Outros:</strong> ${dados.terceira_via}%</p>
            <p><strong>Saldo:</strong> ${dados.saldo > 0 ? '+' : ''}${dados.saldo}</p>
            <p><strong>Votos:</strong> ${dados.total_validos.toLocaleString('pt-BR')}</p>
        </div>
    `;
}

function atualizarLegenda() {
    const container = document.getElementById('mapa-legenda');
    if (!container) return;

    let html = '<div class="legenda-items">';

    if (mapaState.modoVisualizacao === 'vencedor') {
        html += `
            <div class="legenda-item">
                <span class="legenda-cor" style="background: ${CORES.PT}"></span>
                <span>PT Venceu</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: ${CORES.DIREITA}"></span>
                <span>Direita Venceu</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: ${CORES.CENTRO}"></span>
                <span>Empate/Outros</span>
            </div>
        `;
    } else if (mapaState.modoVisualizacao === 'margem') {
        html += `
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #8B0000"></span>
                <span>PT >30pp</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #DC143C"></span>
                <span>PT 20-30pp</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #FF6B6B"></span>
                <span>PT 10-20pp</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: ${CORES.SWING}"></span>
                <span>Margem <10pp</span>
            </div>
        `;
    } else if (mapaState.modoVisualizacao === 'pt') {
        html += `
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #8B0000"></span>
                <span>PT >70%</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #DC143C"></span>
                <span>PT 50-70%</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #FF6B6B"></span>
                <span>PT 30-50%</span>
            </div>
            <div class="legenda-item">
                <span class="legenda-cor" style="background: #FFB6C1"></span>
                <span>PT <30%</span>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// Expose functions globalmente
window.initMapaEleitoral = initMapaEleitoral;
