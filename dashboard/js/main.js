/**
 * Main Application State and Initialization
 */

// Global app state
const appState = {
    year: 2010,
    analysisLevel: 'section',
    data: {
        candidates: {},
        sections: {},
        municipalities: {},
        geojson: null
    },
    filters: {
        president: { candidateId: null, condition: 'any', minPercentage: 0 },
        governor: { candidateId: null, condition: 'any', minPercentage: 0 },
        senator1: { candidateId: null, condition: 'any', minPercentage: 0 },
        senator2: { candidateId: null, condition: 'any', minPercentage: 0 }
    },
    filterResult: {
        matchingIds: [],
        stats: { total: 0, percentage: 0 }
    },
    mapColorMode: 'eb_absolute'
};

/**
 * Load JSON data files
 */
async function loadData() {
    const startTime = performance.now();
    console.log('Loading data...');
    const statusDiv = document.querySelector('.main-content');

    try {
        let step = 0;
        const updateStatus = (msg) => {
            step++;
            console.log(`[${step}] ${msg}`);
            if (statusDiv) statusDiv.innerHTML = `<div style="text-align:center;padding:2rem;"><p>${msg}</p></div>`;
        };

        updateStatus('⏳ Carregando candidatos 2010...');
        const candidates2010 = await fetch('./data/processed/candidates_2010.json').then(r => r.json());

        updateStatus('⏳ Carregando candidatos 2018...');
        const candidates2018 = await fetch('./data/processed/candidates_2018.json').then(r => r.json());
        appState.data.candidates = { 2010: candidates2010, 2018: candidates2018 };

        updateStatus('⏳ Carregando seções 2010 (~11MB)...');
        const sections2010 = await fetch('./data/processed/sections_2010.json').then(r => r.json());

        updateStatus('⏳ Carregando seções 2018 (~19MB)...');
        const sections2018 = await fetch('./data/processed/sections_2018.json').then(r => r.json());
        appState.data.sections = {
            2010: sections2010.sections,
            2018: sections2018.sections
        };

        updateStatus('⏳ Carregando municípios 2010...');
        const municipalities2010 = await fetch('./data/processed/municipalities_2010.json').then(r => r.json());

        updateStatus('⏳ Carregando municípios 2018...');
        const municipalities2018 = await fetch('./data/processed/municipalities_2018.json').then(r => r.json());
        appState.data.municipalities = {
            2010: municipalities2010.municipalities,
            2018: municipalities2018.municipalities
        };

        updateStatus('⏳ Carregando mapa (GeoJSON)...');
        const geojson = await fetch('./data/reference/amazonas_enriched.geojson').then(r => r.json());
        appState.data.geojson = geojson;

        const endTime = performance.now();
        const loadTime = ((endTime - startTime) / 1000).toFixed(2);

        console.log('✓ Data loaded successfully in', loadTime, 'seconds');
        console.log('Candidates 2010:', appState.data.candidates[2010]);
        console.log('Sections 2010:', Object.keys(appState.data.sections[2010]).length, 'sections');
        console.log('Municipalities 2010:', appState.data.municipalities[2010].length, 'municipalities');

        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Erro ao carregar dados. Verifique se os arquivos JSON estão no diretório /data/processed/');
        return false;
    }
}

/**
 * Initialize Tab System
 */
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            // Deactivate all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Activate selected tab
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Trigger tab-specific initialization if needed
            onTabChange(tabName);
        });
    });
}

/**
 * Handle tab changes (for lazy loading)
 */
function onTabChange(tabName) {
    console.log('Changed to tab:', tabName);

    switch (tabName) {
        case 'resumo':
            initializeResume();
            break;
        case 'mapa':
            setTimeout(() => initializeMap(), 100);
            break;
        case 'comparativo':
            setTimeout(() => initializeComparative(), 100);
            break;
        case 'filtros':
            initializeFiltersUI();
            break;
        case 'senatorial':
            initializeSenatorialAnalysis();
            break;
        case 'chapas':
            initializeBallotsAnalysis();
            break;
        case 'ideologia':
            // Initialize ideology evolution charts
            if (typeof initCharts === 'function') {
                initCharts();
            }
            break;
        case 'projecao-2026':
            // Initialize 2026 projection visualizations
            if (typeof populatePredictiveClassifications === 'function') {
                populatePredictiveClassifications();
                populateSwingMunicipios();
            }
            break;
        case 'eb-ideologia':
            // Initialize EB vs Ideology analysis
            if (typeof initEBAnalysis === 'function') {
                initEBAnalysis();
            }
            break;
        case 'dados':
            initializeRawDataTable();
            break;
    }
}

/**
 * Initialize Resume Tab
 */
function initializeResume() {
    console.log('ℹ️ initializeResume() desabilitada - usando dados de analise_eb_completa.json');
    // Função desabilitada - dados carregados por resumo-eb-correto.js
    return;

    // CÓDIGO ANTIGO COMENTADO (usava dados incorretos)
    /*
    const resumoTab = document.querySelector('#resumo');
    if (!resumoTab) {
        console.warn('Resumo tab not found, skipping initialization');
        return;
    }

    if (resumoTab.dataset.initialized === 'true') return;

    console.log('Initializing Resume tab...');

    // Calculate key indicators
    const data2010 = appState.data.municipalities[2010];
    const data2018 = appState.data.municipalities[2018];

    // Find Eduardo Braga's data
    let totalVotes2010 = 0, totalVotes2018 = 0;
    let validVotes2010 = 0, validVotes2018 = 0;
    let ebWins2010 = 0, ebWins2018 = 0;
    let totalSections2010 = 0, totalSections2018 = 0;

    if (data2010) {
        data2010.forEach(mun => {
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toLowerCase().includes('braga'));
            if (ebData) {
                totalVotes2010 += ebData.votes || 0;
            }
            validVotes2010 += senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
        });
        totalSections2010 = appState.data.sections[2010] ? Object.keys(appState.data.sections[2010]).length : 0;
    }

    if (data2018) {
        data2018.forEach(mun => {
            const senator1 = mun.results.senator1 || [];
            const ebData = senator1.find(s => s.name && s.name.toLowerCase().includes('braga'));
            if (ebData) {
                totalVotes2018 += ebData.votes || 0;
            }
            validVotes2018 += senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
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

    // Update indicators
    document.querySelector('#resumo .value-2010').textContent = totalVotes2010.toLocaleString('pt-BR');
    document.querySelector('#resumo .value-2018').textContent = totalVotes2018.toLocaleString('pt-BR');

    const pct2010 = validVotes2010 > 0 ? ((totalVotes2010 / validVotes2010) * 100).toFixed(2) : 0;
    const pct2018 = validVotes2018 > 0 ? ((totalVotes2018 / validVotes2018) * 100).toFixed(2) : 0;

    document.querySelectorAll('#resumo .indicator-card')[1].querySelector('.value-2010').textContent = pct2010 + '%';
    document.querySelectorAll('#resumo .indicator-card')[1].querySelector('.value-2018').textContent = pct2018 + '%';

    // Update win rate indicator
    const winRatePct2010 = totalSections2010 > 0 ? ((ebWins2010 / totalSections2010) * 100).toFixed(1) : 0;
    const winRatePct2018 = totalSections2018 > 0 ? ((ebWins2018 / totalSections2018) * 100).toFixed(1) : 0;

    document.querySelectorAll('#resumo .indicator-card')[2].querySelector('.value-2010').textContent = winRatePct2010 + '%';
    document.querySelectorAll('#resumo .indicator-card')[2].querySelector('.value-2018').textContent = winRatePct2018 + '%';

    // Variation (both absolute and relative)
    const variationAbsolute = (pct2018 - pct2010).toFixed(2);
    const variationRelative = pct2010 > 0 ? ((variationAbsolute / pct2010) * 100).toFixed(1) : 0;

    const variationText = `${(variationAbsolute > 0 ? '+' : '')}${variationAbsolute} pp<br><small>(${variationRelative > 0 ? '+' : ''}${variationRelative}% de mudança)</small>`;
    document.getElementById('variation').innerHTML = variationText;
    document.getElementById('variation').style.color = variationAbsolute > 0 ? 'green' : 'red';

    // Top growth and decline
    const growth = [];
    if (data2010 && data2018) {
        data2010.forEach(mun2010 => {
            const mun2018 = data2018.find(m => m.name === mun2010.name);
            if (mun2018) {
                const votes2010 = (mun2010.results.senator1 || []).find(s => s.name && s.name.toLowerCase().includes('braga'))?.votes || 0;
                const votes2018 = (mun2018.results.senator1 || []).find(s => s.name && s.name.toLowerCase().includes('braga'))?.votes || 0;
                const total2010 = (mun2010.results.senator1 || []).reduce((sum, s) => sum + (s.votes || 0), 0);
                const total2018 = (mun2018.results.senator1 || []).reduce((sum, s) => sum + (s.votes || 0), 0);

                const pct2010 = total2010 > 0 ? (votes2010 / total2010) * 100 : 0;
                const pct2018 = total2018 > 0 ? (votes2018 / total2018) * 100 : 0;

                growth.push({
                    name: mun2010.name,
                    variation: pct2018 - pct2010
                });
            }
        });
    }

    growth.sort((a, b) => b.variation - a.variation);

    const topGrowth = document.getElementById('top-growth');
    topGrowth.innerHTML = growth.slice(0, 5).map((item, idx) =>
        `<li>${item.name}: ${(item.variation > 0 ? '+' : '')}${item.variation.toFixed(2)}pp</li>`
    ).join('');

    const topDecline = document.getElementById('top-decline');
    topDecline.innerHTML = growth.slice(-5).reverse().map((item, idx) =>
        `<li>${item.name}: ${item.variation.toFixed(2)}pp</li>`
    ).join('');

    resumoTab.dataset.initialized = 'true';

    // Initialize charts
    initializeResumoCharts();
    */
}

/**
 * Dark mode toggle
 */
function setupThemeToggle() {
    const btn = document.getElementById('toggleTheme');
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    // Load saved preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️';
    }
}

/**
 * Initialize Application
 */
async function initializeApp() {
    console.log('Initializing application...');

    // Show loading indicator in a safe way
    const mainContent = document.querySelector('.main-content');
    const originalContent = mainContent.innerHTML;

    document.body.style.opacity = '0.8';
    mainContent.innerHTML = '<div style="text-align:center;padding:2rem;"><p>⏳ Carregando dados...</p></div>';

    // Load data
    const dataLoaded = await loadData();
    if (!dataLoaded) {
        mainContent.innerHTML = '<div style="text-align:center;padding:2rem;color:red;"><p>❌ Erro ao carregar dados!</p></div>';
        return;
    }

    // Restore original UI
    document.body.style.opacity = '1';
    mainContent.innerHTML = originalContent;

    // Initialize components
    setupThemeToggle();
    initializeTabs();

    // Initialize first tab (com delay para garantir que o DOM está pronto)
    setTimeout(() => {
        const resumoTab = document.querySelector('#resumo');
        if (resumoTab) {
            initializeResume();
        } else {
            console.warn('Resumo tab not found, will initialize on first click');
        }
    }, 100);

    console.log('✓ Application initialized');
}

/**
 * Wait for DOM to be ready, then initialize
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize Comparativo Tab
 */
function initializeComparative() {
    const comparativoTab = document.querySelector('#comparativo');
    if (!comparativoTab) {
        console.warn('Comparativo tab not found, skipping initialization');
        return;
    }

    if (comparativoTab.dataset.initialized === 'true') return;

    console.log('Initializing Comparativo tab...');

    initializeComparativeCharts();

    comparativoTab.dataset.initialized = 'true';
}
/**
 * Senatorial pair analysis (EB + Plínio in 2018)
 */
function initializeSenatorialAnalysis() {
    const senatorialTab = document.querySelector('#senatorial');
    if (!senatorialTab) {
        console.warn('Senatorial tab not found');
        return;
    }

    if (senatorialTab.dataset.initialized === 'true') return;

    console.log('Initializing senatorial analysis...');

    // Analysis for 2018 (when Plínio appears)
    const year = 2018;
    const sections = appState.data.sections[year] || {};
    const municipalities = appState.data.municipalities[year] || [];

    // Four mutually exclusive categories
    let bothInTop2 = 0;           // Both rank <= 2
    let ebInTop2PlinioOut = 0;    // EB rank <= 2, Plínio rank > 2 or null
    let ebOutPlinioInTop2 = 0;    // EB rank > 2 or null, Plínio rank <= 2
    let bothOutTop2 = 0;          // Both rank > 2 or null

    let municipalityStats = {};

    // Count patterns in sections
    Object.values(sections).forEach(section => {
        const senator = section.results.senator1 || []; // Both senator1 and senator2 have same candidates

        const ebData = senator.find(c => c.name && c.name.toUpperCase().includes('BRAGA'));
        const plinioData = senator.find(c => c.name && c.name.toUpperCase().includes('PLINIO'));

        const ebRank = ebData ? ebData.rank : null;
        const plinioRank = plinioData ? plinioData.rank : null;

        const ebInTop2 = ebRank !== null && ebRank <= 2;
        const plinioInTop2 = plinioRank !== null && plinioRank <= 2;

        // Four mutually exclusive patterns
        if (ebInTop2 && plinioInTop2) {
            bothInTop2++;
        } else if (ebInTop2 && !plinioInTop2) {
            ebInTop2PlinioOut++;
        } else if (!ebInTop2 && plinioInTop2) {
            ebOutPlinioInTop2++;
        } else {
            bothOutTop2++;
        }
    });

    // Calculate the three independent metrics the user requested
    const ebNotInTop2 = ebOutPlinioInTop2 + bothOutTop2;
    const plinioNotInTop2 = ebInTop2PlinioOut + bothOutTop2;

    // Count patterns by municipality
    municipalities.forEach(mun => {
        const senator = mun.results.senator1 || [];

        const ebData = senator.find(c => c.name && c.name.toUpperCase().includes('BRAGA'));
        const plinioData = senator.find(c => c.name && c.name.toUpperCase().includes('PLINIO'));

        const ebVotes = ebData?.votes || 0;
        const plinioVotes = plinioData?.votes || 0;

        municipalityStats[mun.name] = {
            ebVotes: ebVotes,
            plinioVotes: plinioVotes,
            ebIn: ebVotes > 0,
            plinioIn: plinioVotes > 0,
            bothIn: ebVotes > 0 && plinioVotes > 0
        };
    });

    // Update UI with stats
    const totalSections = Object.keys(sections).length;
    const bothInTop2Pct = ((bothInTop2 / totalSections) * 100).toFixed(1);
    const ebNotInTop2Pct = ((ebNotInTop2 / totalSections) * 100).toFixed(1);
    const plinioNotInTop2Pct = ((plinioNotInTop2 / totalSections) * 100).toFixed(1);
    const ebInTop2PlinioOutPct = ((ebInTop2PlinioOut / totalSections) * 100).toFixed(1);
    const ebOutPlinioInTop2Pct = ((ebOutPlinioInTop2 / totalSections) * 100).toFixed(1);
    const bothOutTop2Pct = ((bothOutTop2 / totalSections) * 100).toFixed(1);

    // Update display elements with the user's requested metrics
    document.getElementById('senatorialTogether').textContent = `${bothInTop2} seções (${bothInTop2Pct}%)`;
    document.getElementById('senatorialEBOnly').textContent = `${ebNotInTop2} seções (${ebNotInTop2Pct}%)`;
    document.getElementById('senatorialOtherFirst').textContent = `${plinioNotInTop2} seções (${plinioNotInTop2Pct}%)`;

    // Show the fourth category (both out) for completeness
    if (document.getElementById('senatorialNeither')) {
        document.getElementById('senatorialNeither').textContent = `${bothOutTop2} seções (${bothOutTop2Pct}%)`;
    }

    // Log detailed breakdown for debugging
    console.log('Senatorial Analysis Breakdown:');
    console.log(`  Both in top 2: ${bothInTop2} (${bothInTop2Pct}%)`);
    console.log(`  EB in top 2, Plínio out: ${ebInTop2PlinioOut} (${ebInTop2PlinioOutPct}%)`);
    console.log(`  EB out, Plínio in top 2: ${ebOutPlinioInTop2} (${ebOutPlinioInTop2Pct}%)`);
    console.log(`  Both out of top 2: ${bothOutTop2} (${bothOutTop2Pct}%)`);
    console.log(`  Total: ${bothInTop2 + ebInTop2PlinioOut + ebOutPlinioInTop2 + bothOutTop2}`);
    console.log('Independent metrics:');
    console.log(`  EB NOT in top 2: ${ebNotInTop2} (${ebNotInTop2Pct}%)`);
    console.log(`  Plínio NOT in top 2: ${plinioNotInTop2} (${plinioNotInTop2Pct}%)`);

    // Create donut chart with four categories
    createSenatorialPairChart(bothInTop2, ebInTop2PlinioOut, ebOutPlinioInTop2, bothOutTop2);

    // Create municipality distribution chart
    createSenatorialByMunicipalityChart(municipalityStats);

    // Analyze sections by vote type (1st, 2nd, combined)
    createSenatorialVoteTypeAnalysis(sections);

    // Analyze ballots with blank/null senate votes
    analyzeBallotCombinationsWithBlankSenate(sections);

    senatorialTab.dataset.initialized = 'true';
    console.log('✓ Senatorial analysis initialized');
}

/**
 * Analyze ballot combinations with blank/null senate votes
 * Shows: President + Governor + Senado status combinations
 */
function analyzeBallotCombinationsWithBlankSenate(sections) {
    const year = 2018;

    // Track combinations: president + governor + senate_status
    let combinations = {};

    Object.values(sections).forEach(section => {
        const president = section.results.president || [];
        const governor = section.results.governor || [];
        const senator = section.results.senator1 || [];

        // Find who won president
        const presWinner = president.length > 0
            ? president.reduce((max, curr) => (curr.votes > max.votes ? curr : max))
            : { name: 'Sem voto', votes: 0 };

        // Find who won governor
        const govWinner = governor.length > 0
            ? governor.reduce((max, curr) => (curr.votes > max.votes ? curr : max))
            : { name: 'Sem voto', votes: 0 };

        // Find who won senator or if blank/null won
        let senateStatus = 'Sem voto';
        let senateName = null;

        if (senator.length > 0) {
            const senWinner = senator.reduce((max, curr) => (curr.votes > max.votes ? curr : max));

            if (senWinner.name === 'VOTO BRANCO') {
                senateStatus = 'BRANCO';
                senateName = 'VOTO BRANCO';
            } else if (senWinner.name === 'VOTO NULO') {
                senateStatus = 'NULO';
                senateName = 'VOTO NULO';
            } else {
                senateStatus = 'CANDIDATO';
                senateName = senWinner.name;
            }
        }

        // Create combination key: Presidente + Governador + Senado
        const combKey = `${presWinner.name}|${govWinner.name}|${senateStatus}|${senateName}`;

        if (!combinations[combKey]) {
            combinations[combKey] = {
                president: presWinner.name,
                governor: govWinner.name,
                senateStatus: senateStatus,
                senateName: senateName,
                count: 0,
                ebInSenate: 0  // Count when EB was in top 2 in senate
            };
        }

        combinations[combKey].count++;

        // Check if EB is in top 2 in senate
        const ebData = senator.find(c => c.name && c.name.toUpperCase().includes('BRAGA'));
        if (ebData && ebData.rank && ebData.rank <= 2) {
            combinations[combKey].ebInSenate++;
        }
    });

    // Convert to array and sort by frequency
    const sorted = Object.values(combinations)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20

    displayBlankSenateCombinations(sorted);
}

/**
 * Display ballot combinations with blank/null senate votes
 */
function displayBlankSenateCombinations(combinations) {
    const container = document.getElementById('blankSenateCombinations');
    if (!container) return;

    const totalSections = combinations.reduce((sum, c) => sum + c.count, 0);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Presidente</th>
                    <th>Governador</th>
                    <th>Senado</th>
                    <th>Seções</th>
                    <th>% do Total</th>
                    <th>EB no Top 2</th>
                </tr>
            </thead>
            <tbody>
    `;

    combinations.forEach(comb => {
        const pct = ((comb.count / totalSections) * 100).toFixed(2);
        const ebPct = ((comb.ebInSenate / comb.count) * 100).toFixed(1);

        // Highlight interesting combinations
        let rowClass = '';
        let senateDisplay = comb.senateName;

        if (comb.senateStatus === 'BRANCO') {
            rowClass = 'class="highlight-row"';
            senateDisplay = '🟤 VOTO BRANCO';
        } else if (comb.senateStatus === 'NULO') {
            rowClass = 'class="highlight-row"';
            senateDisplay = '⚫ VOTO NULO';
        }

        html += `
            <tr ${rowClass}>
                <td>${comb.president}</td>
                <td><strong>${comb.governor}</strong></td>
                <td>${senateDisplay}</td>
                <td>${comb.count}</td>
                <td>${pct}%</td>
                <td>${comb.ebInSenate} (${ebPct}%)</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Analyze EB ranking by municipality: 1st, 2nd, 3rd+ place
 */
function createSenatorialVoteTypeAnalysis(sections) {
    const year = 2018;
    const municipalities = appState.data.municipalities[year] || [];

    // For each municipality, count sections by EB ranking
    let municipalityRankAnalysis = {};

    municipalities.forEach(mun => {
        municipalityRankAnalysis[mun.name] = {
            name: mun.name,
            total_sections: 0,
            rank_1_wins: 0,      // EB rank 1 (most voted)
            rank_2_wins: 0,      // EB rank 2 (second most voted)
            rank_3plus_wins: 0   // EB rank 3+ (outside top 2)
        };
    });

    // Iterate through sections
    Object.values(sections).forEach(section => {
        const mun_name = section.municipality;
        if (!municipalityRankAnalysis[mun_name]) {
            municipalityRankAnalysis[mun_name] = {
                name: mun_name,
                total_sections: 0,
                rank_1_wins: 0,
                rank_2_wins: 0,
                rank_3plus_wins: 0
            };
        }

        const stats = municipalityRankAnalysis[mun_name];
        stats.total_sections++;

        const senator = section.results.senator1 || []; // Use senator1 (consolidated data)

        const ebData = senator.find(c => c.name && c.name.toUpperCase().includes('BRAGA'));

        if (!ebData) {
            stats.rank_3plus_wins++; // EB not in ranking
        } else if (ebData.rank === 1) {
            stats.rank_1_wins++;
        } else if (ebData.rank === 2) {
            stats.rank_2_wins++;
        } else {
            stats.rank_3plus_wins++;
        }
    });

    // Create table
    displaySenatorialRankingTable(municipalityRankAnalysis);

    console.log('✓ Senatorial ranking analysis completed');
}

/**
 * Display senatorial ranking analysis table
 */
function displaySenatorialRankingTable(analysis) {
    const container = document.getElementById('senatorialVoteTypeTable');
    if (!container) return;

    // Sort by 1st place wins descending
    const sorted = Object.values(analysis)
        .sort((a, b) => b.rank_1_wins - a.rank_1_wins);

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Município</th>
                    <th>Total de Seções</th>
                    <th>1º Lugar</th>
                    <th>2º Lugar</th>
                    <th>Fora do Top 2</th>
                </tr>
            </thead>
            <tbody>
    `;

    sorted.forEach(row => {
        const pct1 = ((row.rank_1_wins / row.total_sections) * 100).toFixed(1);
        const pct2 = ((row.rank_2_wins / row.total_sections) * 100).toFixed(1);
        const pct3 = ((row.rank_3plus_wins / row.total_sections) * 100).toFixed(1);

        html += `
            <tr>
                <td><strong>${row.name}</strong></td>
                <td>${row.total_sections}</td>
                <td>${row.rank_1_wins} (${pct1}%)</td>
                <td>${row.rank_2_wins} (${pct2}%)</td>
                <td>${row.rank_3plus_wins} (${pct3}%)</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Create senatorial pair donut chart
 */
function createSenatorialPairChart(together, ebOnly, plinioOnly, neither) {
    const ctx = document.getElementById('chartSenatorialPair');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ambos venceram', 'Só EB venceu', 'Só Plínio venceu', 'Nenhum venceu'],
            datasets: [{
                data: [together, ebOnly, plinioOnly, neither],
                backgroundColor: ['#27ae60', '#3498db', '#e74c3c', '#95a5a6'],
                borderColor: ['#1e8449', '#2980b9', '#c0392b', '#7f8c8d'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create municipality senatorial distribution
 */
function createSenatorialByMunicipalityChart(munStats) {
    const ctx = document.getElementById('chartSenatorialByMunicipality');
    if (!ctx) return;

    // Sort municipalities by EB votes
    const sorted = Object.entries(munStats)
        .sort((a, b) => b[1].ebVotes - a[1].ebVotes)
        .slice(0, 15);

    const labels = sorted.map(([name]) => name);
    const ebVotes = sorted.map(([_, stats]) => stats.ebVotes);
    const plinioVotes = sorted.map(([_, stats]) => stats.plinioVotes);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'EB (Senator1)',
                    data: ebVotes,
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                },
                {
                    label: 'Plínio (Senator2)',
                    data: plinioVotes,
                    backgroundColor: '#e74c3c',
                    borderColor: '#c0392b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

/**
 * Ballots (chapas prováveis) analysis
 */
function initializeBallotsAnalysis() {
    const chapasTab = document.querySelector('#chapas');
    if (!chapasTab) {
        console.warn('Chapas tab not found');
        return;
    }

    if (chapasTab.dataset.initialized === 'true') return;

    console.log('Initializing ballots analysis...');

    // Analyze most likely ballot combinations for both years
    // President + Governor + Senator
    for (const year of [2010, 2018]) {
        const sections = appState.data.sections[year] || {};
        const ballotCounts = {};

        // Count ballot combinations: President + Governor + Senator
        Object.values(sections).forEach(section => {
            const presArray = section.results.president || [];
            const govArray = section.results.governor || [];
            const senArray = section.results.senator1 || []; // Only senator1 now (consolidated data)

            // Get the most voted candidate (rank 1) in each position
            const presTop = presArray.length > 0
                ? presArray.reduce((max, curr) => (curr.votes > max.votes ? curr : max))
                : { name: 'Sem voto' };
            const govTop = govArray.length > 0
                ? govArray.reduce((max, curr) => (curr.votes > max.votes ? curr : max))
                : { name: 'Sem voto' };
            const senTop = senArray.length > 0
                ? senArray.reduce((max, curr) => (curr.votes > max.votes ? curr : max))
                : { name: 'Sem voto' };

            const pres = presTop.name || 'Sem voto';
            const gov = govTop.name || 'Sem voto';
            const sen = senTop.name || 'Sem voto';

            const ballotKey = `${pres}|${gov}|${sen}`;
            ballotCounts[ballotKey] = (ballotCounts[ballotKey] || 0) + 1;
        });

        // Sort by frequency and get top 10
        const sorted = Object.entries(ballotCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key, count]) => {
                const [pres, gov, sen] = key.split('|');
                return {
                    pres, gov, sen,
                    count,
                    hasEB: sen.toUpperCase().includes('BRAGA')
                };
            });

        // Create chart
        createBallotsChart(sorted, year);

        // Show top ballot info
        if (sorted.length > 0) {
            const top = sorted[0];
            const ballotLabel = `${top.pres} + ${top.gov} + ${top.sen}`;
            console.log(`Top ballot ${year}: ${ballotLabel} (${top.count} seções)`);
        }
    }

    // Analyze by region (calha)
    const municipalities = appState.data.municipalities[2018] || [];
    analyzeBalletsByRegion(municipalities);

    chapasTab.dataset.initialized = 'true';
    console.log('✓ Ballots analysis initialized');
}

/**
 * Create ballots chart
 */
function createBallotsChart(ballots, year) {
    const canvasId = year === 2010 ? 'chartBallots2010' : 'chartBallots2018';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = ballots.map((b, idx) => `#${idx + 1}`);
    const data = ballots.map(b => b.count);
    const backgroundColor = ballots.map(b => b.hasEB ? '#27ae60' : '#95a5a6');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Seções',
                data: data,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.map(c => c === '#27ae60' ? '#1e8449' : '#7f8c8d'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const ballot = ballots[context.dataIndex];
                            return `Presidente: ${ballot.pres}\nGovernador: ${ballot.gov}\nSenador: ${ballot.sen}`;
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

/**
 * Analyze ballots by region (calha)
 */
function analyzeBalletsByRegion(municipalities) {
    const tbody = document.getElementById('ballotsByRegionTableBody');
    if (!tbody) return;

    const regionBallots = {};

    municipalities.forEach(mun => {
        const region = mun.region || 'Outros';
        const gov = mun.results.governor?.[0]?.name || 'Desconhecido';
        const sen = mun.results.senator1?.[0]?.name || 'Desconhecido';

        const ballotKey = `${gov}|${sen}`;

        if (!regionBallots[region]) {
            regionBallots[region] = {};
        }
        regionBallots[region][ballotKey] = (regionBallots[region][ballotKey] || 0) + 1;
    });

    // Get most common ballot per region
    const rows = Object.entries(regionBallots).map(([region, ballots]) => {
        const mostCommon = Object.entries(ballots).sort((a, b) => b[1] - a[1])[0];
        if (!mostCommon) return null;

        const [ballotKey, freq] = mostCommon;
        const [gov, sen] = ballotKey.split('|');
        const hasEB = sen.toUpperCase().includes('BRAGA');

        return {
            region,
            ballot: `${gov} + ${sen}`,
            freq,
            hasEB
        };
    }).filter(Boolean);

    // Populate table
    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${row.region}</td>
            <td>${row.ballot}</td>
            <td>${row.freq}</td>
            <td>${row.hasEB ? '✅ Sim' : '❌ Não'}</td>
        </tr>
    `).join('');
}

// Note: initializeMap() and initializeFiltersUI() and initializeRawDataTable()
// are implemented in their respective module files (map.js, filters.js)

/**
 * Initialize Raw Data Table
 */
function initializeRawDataTable() {
    const dadosTab = document.querySelector('#dados');
    if (!dadosTab) {
        console.warn('Dados tab not found, skipping initialization');
        return;
    }

    if (dadosTab.dataset.initialized === 'true') return;

    console.log('Initializing raw data table...');

    const year = parseInt(document.getElementById('tableYear').value);
    const sections = appState.data.sections[year] || {};

    // Display first page
    displayRawDataPage(sections, 0);

    // Setup search and year change
    document.getElementById('searchRaw').addEventListener('input', () => {
        displayRawDataPage(sections, 0);
    });

    document.getElementById('tableYear').addEventListener('change', (e) => {
        const newYear = parseInt(e.target.value);
        const newSections = appState.data.sections[newYear] || {};
        displayRawDataPage(newSections, 0);
    });

    dadosTab.dataset.initialized = 'true';
}

/**
 * Display raw data table page
 */
function displayRawDataPage(sections, pageNum) {
    const searchTerm = document.getElementById('searchRaw').value.toLowerCase();
    const itemsPerPage = 50;

    // Filter sections
    const sectionIds = Object.keys(sections);
    let filtered = sectionIds.filter(id => {
        const section = sections[id];
        return !searchTerm ||
               id.toLowerCase().includes(searchTerm) ||
               (section.municipality || '').toLowerCase().includes(searchTerm);
    });

    // Paginate
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIdx = pageNum * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filtered.slice(startIdx, endIdx);

    // Populate table
    const tbody = document.getElementById('rawDataTableBody');
    tbody.innerHTML = pageData.map(id => {
        const section = sections[id];
        const president = section.results.president[0] || {};
        const governor = section.results.governor[0] || {};
        const senator1 = section.results.senator1[0] || {};
        const senator2 = section.results.senator2[0] || {};

        return `<tr>
            <td>${section.municipality || '—'}</td>
            <td>${section.zone || '—'}</td>
            <td>${section.section || '—'}</td>
            <td>${president.name || '—'}</td>
            <td>${governor.name || '—'}</td>
            <td>${senator1.name || '—'}</td>
            <td>${senator2.name || '—'}</td>
            <td>${section.voters_eligible || '—'}</td>
            <td>${section.voters_turnout || '—'}</td>
        </tr>`;
    }).join('');

    // Update pagination
    document.getElementById('pageInfo').textContent = `Página ${pageNum + 1} de ${totalPages || 1} (${filtered.length} resultados)`;
    document.getElementById('prevPage').disabled = pageNum === 0;
    document.getElementById('nextPage').disabled = pageNum >= totalPages - 1;

    // Setup pagination buttons
    document.getElementById('prevPage').onclick = () => displayRawDataPage(sections, pageNum - 1);
    document.getElementById('nextPage').onclick = () => displayRawDataPage(sections, pageNum + 1);
}
