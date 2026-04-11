/**
 * Map Module - Leaflet.js integration for Amazonas municipalities
 */

let currentMap = null;
let geoJsonLayer = null;
let municipalityData = {};

/**
 * Initialize the map
 */
function initializeMap() {
    console.log('Initializing map...');

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    if (!appState.data.geojson) {
        console.error('GeoJSON data not loaded');
        return;
    }

    // Create map if not exists
    if (!currentMap) {
        // Initialize Leaflet map centered on Amazonas
        currentMap = L.map('map').setView([-3.0, -62.0], 5);

        // Add OSM tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(currentMap);

        // Build municipality data lookup
        buildMunicipalityLookup();

        // Add GeoJSON layer
        geoJsonLayer = L.geoJSON(appState.data.geojson, {
            style: (feature) => getMapStyle(feature),
            onEachFeature: (feature, layer) => onEachFeature(feature, layer)
        }).addTo(currentMap);
    }

    // Setup controls
    setupMapControls();

    // Initial color update
    updateMapColors();

    console.log('✓ Map initialized successfully');
}

/**
 * Build lookup table: municipality name → voting data
 */
function buildMunicipalityLookup() {
    const year = parseInt(document.getElementById('mapYear').value);
    const municipalities = appState.data.municipalities[year] || [];

    municipalityData = {};
    municipalities.forEach(mun => {
        municipalityData[mun.name.toUpperCase()] = mun;
    });

    console.log(`Built lookup for ${Object.keys(municipalityData).length} municipalities`);
}

/**
 * Get style for a municipality polygon
 */
function getMapStyle(feature) {
    // Check if feature has name property
    if (!feature || !feature.properties || !feature.properties.name) {
        return {
            fillColor: '#e0e0e0',
            weight: 1.5,
            opacity: 1,
            color: '#333',
            fillOpacity: 0.5
        };
    }

    const munName = feature.properties.name.toUpperCase();
    const munData = municipalityData[munName];
    const mode = document.getElementById('mapMode').value;

    let fillColor = '#cccccc';
    let opacity = 0.7;

    if (munData && munData.results) {
        const senator1 = munData.results.senator1 || [];

        // Find Eduardo Braga data
        const ebData = senator1.find(s =>
            s.name && s.name.toUpperCase().includes('BRAGA')
        );

        if (ebData) {
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
            const ebPercentage = totalVotes > 0 ? (ebData.votes / totalVotes) * 100 : 0;

            if (mode === 'eb_absolute') {
                // Gradient based on absolute votes
                if (ebData.votes > 50000) fillColor = '#8b0000';      // Dark red
                else if (ebData.votes > 30000) fillColor = '#dc143c'; // Crimson
                else if (ebData.votes > 15000) fillColor = '#ff6347'; // Tomato
                else if (ebData.votes > 5000) fillColor = '#ffa07a';  // Light salmon
                else if (ebData.votes > 0) fillColor = '#ffe4b5';     // Moccasin
                else fillColor = '#e0e0e0';
            } else if (mode === 'eb_percentage') {
                // Gradient based on percentage
                if (ebPercentage > 55) fillColor = '#1a3a52';         // Dark blue
                else if (ebPercentage > 45) fillColor = '#2c5aa0';    // Medium blue
                else if (ebPercentage > 35) fillColor = '#4a90e2';    // Light blue
                else if (ebPercentage > 25) fillColor = '#90caf9';    // Lighter blue
                else if (ebPercentage > 15) fillColor = '#cce5ff';    // Very light blue
                else fillColor = '#e0e0e0';
            } else if (mode === 'top_candidate') {
                // Color by top candidate
                const topCandidate = senator1[0];
                if (topCandidate && topCandidate.name) {
                    if (topCandidate.name.toUpperCase().includes('BRAGA')) {
                        fillColor = '#27ae60'; // Green - EB won
                    } else {
                        fillColor = '#e74c3c'; // Red - someone else won
                    }
                }
            }
        }
    }

    return {
        fillColor: fillColor,
        weight: 1.5,
        opacity: 1,
        color: '#333',
        fillOpacity: opacity
    };
}

/**
 * Handle feature interactions
 */
function onEachFeature(feature, layer) {
    // Check if feature has name
    if (!feature || !feature.properties || !feature.properties.name) {
        layer.bindPopup('Município sem dados');
        return;
    }

    const munName = feature.properties.name.toUpperCase();
    const munData = municipalityData[munName];

    // Popup on click
    let popupContent = `<strong>${feature.properties.name}</strong>`;

    if (munData && munData.results) {
        const senator1 = munData.results.senator1 || [];
        const ebData = senator1.find(s => s.name && s.name.toUpperCase().includes('BRAGA'));
        if (ebData) {
            const totalVotes = senator1.reduce((sum, s) => sum + (s.votes || 0), 0);
            const ebPercentage = totalVotes > 0 ? ((ebData.votes / totalVotes) * 100).toFixed(1) : 0;
            popupContent += `<br/>EB Votos: ${ebData.votes.toLocaleString('pt-BR')}<br/>EB %: ${ebPercentage}%`;
        }
    }

    layer.bindPopup(popupContent);

    // Hover effects
    layer.on('mouseover', function() {
        this.setStyle({
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });
        if (!L.Browser.ie && !L.Browser.opera) {
            this.bringToFront();
        }
    });

    layer.on('mouseout', function() {
        geoJsonLayer.resetStyle(this);
    });
}

/**
 * Setup map control listeners
 */
function setupMapControls() {
    const mapModeSelect = document.getElementById('mapMode');
    const mapYearSelect = document.getElementById('mapYear');

    mapModeSelect.addEventListener('change', updateMapColors);
    mapYearSelect.addEventListener('change', () => {
        buildMunicipalityLookup();
        updateMapColors();
    });
}

/**
 * Update map colors based on selected mode
 */
function updateMapColors() {
    console.log('Updating map colors...');

    if (!geoJsonLayer) {
        console.error('GeoJSON layer not ready');
        return;
    }

    // Reset all styles
    geoJsonLayer.eachLayer(layer => {
        if (layer.setStyle) {
            layer.setStyle(getMapStyle(layer.feature));
        }
    });

    // Update legend
    updateMapLegend();
}

/**
 * Update map legend based on current mode
 */
function updateMapLegend() {
    const mode = document.getElementById('mapMode').value;
    const legendDiv = document.getElementById('mapLegend');

    let legendHTML = '<div style="background: white; padding: 10px; border-radius: 5px; font-size: 12px;">';
    legendHTML += '<strong style="display: block; margin-bottom: 8px;">Legenda</strong>';

    if (mode === 'eb_absolute') {
        legendHTML += '<div><span style="background: #8b0000; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> >50k votos</div>';
        legendHTML += '<div><span style="background: #dc143c; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 30k-50k</div>';
        legendHTML += '<div><span style="background: #ff6347; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 15k-30k</div>';
        legendHTML += '<div><span style="background: #ffa07a; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 5k-15k</div>';
        legendHTML += '<div><span style="background: #ffe4b5; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> <5k</div>';
    } else if (mode === 'eb_percentage') {
        legendHTML += '<div><span style="background: #1a3a52; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> >55%</div>';
        legendHTML += '<div><span style="background: #2c5aa0; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 45-55%</div>';
        legendHTML += '<div><span style="background: #4a90e2; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 35-45%</div>';
        legendHTML += '<div><span style="background: #90caf9; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> 25-35%</div>';
        legendHTML += '<div><span style="background: #cce5ff; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> <25%</div>';
    } else if (mode === 'top_candidate') {
        legendHTML += '<div><span style="background: #27ae60; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> EB eleito (1º lugar)</div>';
        legendHTML += '<div><span style="background: #e74c3c; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> Outro candidato venceu</div>';
    } else if (mode === 'filter_result') {
        legendHTML += '<div><span style="background: #2c5aa0; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> Atende aos filtros</div>';
        legendHTML += '<div><span style="background: #cccccc; width: 20px; height: 12px; display: inline-block; margin-right: 5px;"></span> Não atende</div>';
    }

    legendHTML += '</div>';
    legendDiv.innerHTML = legendHTML;
}

/**
 * Update map colors based on filter results
 */
function updateMapByFilterResults(filterResults, level) {
    console.log(`Updating map for ${filterResults.length} matching ${level}s`);

    // Build set of matching IDs for quick lookup (normalize to uppercase)
    const matchingIds = new Set(filterResults.map(r => r.id.toUpperCase()));

    // Update styles for all municipalities
    if (geoJsonLayer) {
        geoJsonLayer.eachLayer(layer => {
            if (layer.setStyle && layer.feature) {
                const munName = layer.feature.properties.name?.toUpperCase();
                const isMatching = munName && matchingIds.has(munName);

                layer.setStyle({
                    fillColor: isMatching ? '#2c5aa0' : '#cccccc',
                    weight: 1.5,
                    opacity: 1,
                    color: '#333',
                    fillOpacity: isMatching ? 0.8 : 0.4
                });
            }
        });
    }

    // Update legend
    updateMapLegend();
}
