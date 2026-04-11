/**
 * Filters Module - Cross-candidate filtering system
 * Implements AND logic across 4 positions (President, Governor, Senator 1, Senator 2)
 */

let filterChart = null;

function initializeFiltersUI() {
    console.log('Initializing filters UI...');

    // Populate initial candidates
    populateCandidateSelects(2010);

    // Setup event listeners
    setupFilterListeners();

    // Setup slider value displays
    setupSliderDisplays();

    console.log('✓ Filters UI initialized');
}

/**
 * Populate candidate dropdowns for a given year
 */
function populateCandidateSelects(year) {
    const candidates = appState.data.candidates[year];
    if (!candidates) return;

    const positions = ['president', 'governor', 'senator1', 'senator2'];
    const selectIds = {
        'president': 'filterPresident',
        'governor': 'filterGovernor',
        'senator1': 'filterSenator1',
        'senator2': 'filterSenator2'
    };

    positions.forEach(pos => {
        const selectId = selectIds[pos];
        const select = document.getElementById(selectId);
        if (!select) return;

        // Clear existing options (keep the first "Todos")
        const firstOption = select.querySelector('option');
        select.innerHTML = '<option value="">— Todos (ignorar)</option>';

        const candidateList = candidates[pos] || [];
        candidateList.forEach((candidate, idx) => {
            const option = document.createElement('option');
            option.value = candidate.name || idx;
            option.textContent = candidate.name || `Candidato ${idx}`;
            select.appendChild(option);
        });
    });
}

/**
 * Setup slider value displays and change listeners
 */
function setupSliderDisplays() {
    const sliders = [
        { id: 'presidentMin', display: 'presidentMinValue' },
        { id: 'governorMin', display: 'governorMinValue' },
        { id: 'senator1Min', display: 'senator1MinValue' },
        { id: 'senator2Min', display: 'senator2MinValue' }
    ];

    sliders.forEach(({ id, display }) => {
        const slider = document.getElementById(id);
        const displayEl = document.getElementById(display);

        if (slider && displayEl) {
            slider.addEventListener('input', (e) => {
                displayEl.textContent = e.target.value + '%';
            });
        }
    });
}

/**
 * Setup main filter event listeners
 */
function setupFilterListeners() {
    const filterYear = document.getElementById('filterYear');
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');

    const selectIds = ['filterPresident', 'filterGovernor', 'filterSenator1', 'filterSenator2'];

    // Year change: update candidate lists
    if (filterYear) {
        filterYear.addEventListener('change', (e) => {
            const year = parseInt(e.target.value);
            populateCandidateSelects(year);
        });
    }

    // Candidate selection: show/hide options
    selectIds.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', (e) => {
                const optionsDiv = document.getElementById(selectId + 'Options');
                if (optionsDiv) {
                    optionsDiv.style.display = e.target.value ? 'block' : 'none';
                }
            });
        }
    });

    if (applyBtn) applyBtn.addEventListener('click', applyFilters);
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
}

/**
 * Apply filters and show results
 */
function applyFilters() {
    console.log('Applying filters...');

    const year = parseInt(document.getElementById('filterYear').value);
    const analysisLevel = document.querySelector('input[name="analysisLevel"]:checked').value;

    // Collect filter criteria
    const filters = {
        president: getFilterCriteria('filterPresident'),
        governor: getFilterCriteria('filterGovernor'),
        senator1: getFilterCriteria('filterSenator1'),
        senator2: getFilterCriteria('filterSenator2')
    };

    // Execute filter
    const results = filterData(filters, year, analysisLevel);

    // Display results
    displayFilterResults(results, year, analysisLevel);
    updateFilterStats(results, year, analysisLevel);
    updateFilterDistributionChart(results, year);

    // Update map colors (if map exists)
    if (geoJsonLayer) {
        updateMapByFilterResults(results, analysisLevel);
    }

    console.log(`✓ Filters applied, found ${results.length} matches`);
}

/**
 * Get filter criteria for a position
 */
function getFilterCriteria(selectId) {
    const candidateName = document.getElementById(selectId).value;
    if (!candidateName) return null; // Ignored

    const positionPrefix = selectId.replace('filter', '').toLowerCase();
    const conditionRadio = document.querySelector(`input[name="${positionPrefix}Condition"]:checked`);
    const minSlider = document.getElementById(positionPrefix + 'Min');

    return {
        candidateName: candidateName,
        condition: conditionRadio?.value || 'any', // any, won, lost
        minPercentage: parseInt(minSlider?.value || 0)
    };
}

/**
 * Filter data based on criteria (AND logic)
 */
function filterData(filters, year, level) {
    const sections = appState.data.sections[year];
    const municipalities = appState.data.municipalities[year];

    if (!sections) return [];

    const results = [];

    if (level === 'section') {
        // Filter by section
        Object.entries(sections).forEach(([sectionId, sectionData]) => {
            if (matchesAllFilters(sectionData, filters)) {
                results.push({
                    type: 'section',
                    id: sectionId,
                    municipality: sectionData.municipality,
                    zone: sectionData.zone,
                    section: sectionData.section,
                    region: sectionData.region,
                    data: sectionData
                });
            }
        });
    } else if (level === 'municipality') {
        // Filter by municipality
        municipalities.forEach(mun => {
            // Aggregate section data for this municipality
            const munSections = Object.values(sections).filter(s => s.municipality === mun.name);
            if (munSections.length === 0) return;

            // Create aggregated data for municipality
            const munData = aggregateSectionData(munSections);
            if (matchesAllFilters(munData, filters)) {
                results.push({
                    type: 'municipality',
                    id: mun.name,
                    municipality: mun.name,
                    region: mun.region,
                    sectionsCount: munSections.length,
                    data: munData
                });
            }
        });
    }

    return results;
}

/**
 * Check if a section matches ALL active filters (AND logic)
 */
function matchesAllFilters(sectionData, filters) {
    return Object.values(filters).every(filter => {
        if (!filter) return true; // Ignored filter
        return matchesFilter(sectionData, filter);
    });
}

/**
 * Check if a section matches a single filter
 */
function matchesFilter(sectionData, filter) {
    const { candidateName, condition, minPercentage } = filter;

    // Determine which position we're checking (hack: need to refactor)
    // For now, check all positions until we find the candidate

    const allResults = [
        sectionData.results.president || [],
        sectionData.results.governor || [],
        sectionData.results.senator1 || [],
        sectionData.results.senator2 || []
    ];

    for (const results of allResults) {
        const candidateResult = results.find(r =>
            r.name && r.name.toUpperCase().includes(candidateName.toUpperCase())
        );

        if (candidateResult) {
            const percentage = candidateResult.percentage || 0;

            // Check percentage filter
            if (percentage < minPercentage) return false;

            // Check condition
            if (condition === 'won') {
                return candidateResult.rank === 1;
            } else if (condition === 'lost') {
                return candidateResult.rank > 1;
            }
            // 'any' - just needs to exist and meet % threshold, which we already checked

            return true;
        }
    }

    return false;
}

/**
 * Aggregate section data to municipality level
 */
function aggregateSectionData(sections) {
    const aggregated = {
        results: {
            president: [],
            governor: [],
            senator1: [],
            senator2: []
        }
    };

    // Aggregate vote counts by candidate
    sections.forEach(section => {
        Object.keys(aggregated.results).forEach(position => {
            section.results[position]?.forEach(candidate => {
                const existing = aggregated.results[position].find(c => c.name === candidate.name);
                if (existing) {
                    existing.votes += candidate.votes;
                } else {
                    aggregated.results[position].push({
                        name: candidate.name,
                        votes: candidate.votes,
                        percentage: 0,
                        rank: 0
                    });
                }
            });
        });
    });

    // Recalculate percentages and ranks
    Object.keys(aggregated.results).forEach(position => {
        const results = aggregated.results[position];
        const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);

        results.forEach(candidate => {
            candidate.percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
        });

        results.sort((a, b) => b.votes - a.votes);
        results.forEach((candidate, idx) => {
            candidate.rank = idx + 1;
        });
    });

    return aggregated;
}

/**
 * Display filter results in table
 */
function displayFilterResults(results, year, level) {
    const tbody = document.getElementById('filterResultsTableBody');
    if (!tbody) return;

    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum resultado encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = results.slice(0, 100).map(result => `
        <tr>
            <td>${result.municipality}</td>
            <td>${result.zone || result.sectionsCount || '—'}</td>
            <td>${result.section || '—'}</td>
            <td colspan="2">Detalhes...</td>
        </tr>
    `).join('');
}

/**
 * Update filter stats display
 */
function updateFilterStats(results, year, level) {
    const statsDiv = document.getElementById('filterStats');
    if (!statsDiv) return;

    const totalRecords = level === 'section' ?
        Object.keys(appState.data.sections[year]).length :
        appState.data.municipalities[year].length;

    const percentage = totalRecords > 0 ? ((results.length / totalRecords) * 100).toFixed(2) : 0;

    const statsText = document.getElementById('statsText');
    if (statsText) {
        statsText.innerHTML = `
            <strong>${results.length}</strong> ${level === 'section' ? 'seções' : 'municípios'} encontradas
            <br/>(de ${totalRecords} total = <strong>${percentage}%</strong>)
        `;
    }

    statsDiv.style.display = 'block';
}

/**
 * Update distribution chart
 */
function updateFilterDistributionChart(results, year) {
    const ctx = document.getElementById('chartFilterDistribution');
    if (!ctx) return;

    // Count by region
    const byRegion = {};
    results.forEach(result => {
        const region = result.region || 'Outros';
        byRegion[region] = (byRegion[region] || 0) + 1;
    });

    // Sort regions
    const regions = Object.keys(byRegion).sort();
    const counts = regions.map(r => byRegion[r]);

    // Destroy old chart if exists
    if (filterChart) {
        filterChart.destroy();
    }

    filterChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [{
                label: 'Quantidade',
                data: counts,
                backgroundColor: '#2c5aa0',
                borderColor: '#1a3a52',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Clear all filters
 */
function clearFilters() {
    console.log('Clearing filters...');

    // Clear candidate selects
    document.querySelectorAll('.candidate-select').forEach(select => {
        select.value = '';
    });

    // Reset conditions to 'any'
    document.querySelectorAll('input[name*="Condition"]').forEach(radio => {
        if (radio.value === 'any') radio.checked = true;
    });

    // Reset sliders to 0
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.value = 0;
        const display = document.getElementById(slider.id + 'Value');
        if (display) display.textContent = '0%';
    });

    // Hide options
    document.querySelectorAll('[id$="Options"]').forEach(el => {
        el.style.display = 'none';
    });

    // Clear results
    document.getElementById('filterStats').style.display = 'none';
    document.getElementById('filterResultsTableBody').innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Aplique os filtros para ver resultados</td></tr>';

    // Reset map colors
    if (geoJsonLayer) {
        updateMapColors();
    }
}
