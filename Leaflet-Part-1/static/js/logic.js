// Initialize the map
var map = L.map('map').setView([37.7749, -122.4194], 5);

// Base map layers
var streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var satelliteMap = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

// Add street map as default
streetMap.addTo(map);

// USGS Earthquake Data URL
var earthquakeUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

// Fetch earthquake data using D3
d3.json(earthquakeUrl)
    .then(function(data) {
        createEarthquakeMarkers(data.features);
    })
    .catch(function(error) {
        console.log(error);
    });

// Fetch tectonic plates data
var plateUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

d3.json(plateUrl)
    .then(function(data) {
        createPlateMarkers(data);
    })
    .catch(function(error) {
        console.log(error);
    });

var earthquakes = L.layerGroup();
var tectonicPlates = L.layerGroup();

function createEarthquakeMarkers(earthquakeData) {
    earthquakeData.forEach(feature => {
        var coordinates = feature.geometry.coordinates;
        var properties = feature.properties;

        // Determine color based on depth
        var depth = coordinates[2];
        var color = getColor(depth);

        // Create a circle marker
        L.circle([coordinates[1], coordinates[0]], {
            color: "black",
            fillColor: color,
            fillOpacity: 0.75,
            radius: properties.mag * 15000
        }).bindPopup(`<h3>${properties.place}</h3><hr><p>Magnitude: ${properties.mag}</p><p>Depth: ${depth} km</p>`).addTo(earthquakes);
    });

    earthquakes.addTo(map);
    addLegend();
}

function createPlateMarkers(data) {
    L.geoJson(data, {
        color: "orange",
        weight: 2
    }).addTo(tectonicPlates);

    tectonicPlates.addTo(map);
}

function getColor(depth) {
    return depth > 90 ? "#ff5f65" :
           depth > 70 ? "#fca35d" :
           depth > 50 ? "#fdb72a" :
           depth > 30 ? "#f7db11" :
           depth > 10 ? "#dcf400" :
                        "#a3f600";
}

function addLegend() {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [-10, 10, 30, 50, 70, 90],
            colors = ["#a3f600", "#dcf400", "#f7db11", "#fdb72a", "#fca35d", "#ff5f65"];

        // Create legend title
        div.innerHTML += '<h4>Depth (km)</h4>';

        // Loop through depth intervals to create a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<div class="legend-row">' +
                '<i style="background:' + colors[i] + '"></i> ' +
                '<span>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] : '+') + '</span>' +
                '</div>';
        }

        return div;
    };

    legend.addTo(map);
}

// Base layers
var baseMaps = {
    "Street Map": streetMap,
    "Topographic Map": topoMap,
    "Satellite Map": satelliteMap
};

// Overlay layers
var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates
};

// Add layer control to map
L.control.layers(baseMaps, overlayMaps).addTo(map);
