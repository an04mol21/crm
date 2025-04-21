// Global variables
let allData = [];
let filteredData = [];
let charts = {};

// DOM elements
const filterSelects = document.querySelectorAll('.filter-select');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const refreshDataBtn = document.getElementById('refreshData');
const insightSearch = document.getElementById('insightSearch');
const periodSelectors = document.querySelectorAll('.period-selector');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data
    fetchData();
    
    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    refreshDataBtn.addEventListener('click', fetchData);
    insightSearch.addEventListener('input', debounce(searchInsights, 300));
    
    periodSelectors.forEach(selector => {
        selector.addEventListener('click', function() {
            periodSelectors.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            updateTimeTrendChart(this.dataset.period);
        });
    });
});

// Fetch data from Django backend
function fetchData() {
    toggleLoadingState(true); // Show loading state

    fetch('/api/datapoints/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            return response.json();
        })
        .then(data => {
            allData = data; // Store fetched data
            filteredData = [...allData]; // Initialize filtered data
            populateFilters(); // Populate filter dropdowns
            updateDashboard(); // Update dashboard elements
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            toggleLoadingState(false); // Hide loading state
        });
}

// Generate mock data for demo purposes
function generateMockData() {
    const startYear = 2010;
    const endYear = 2024;
    const sectors = ['Energy', 'Environment', 'Government', 'Information Technology', 'Manufacturing', 'Financial Services', 'Healthcare', 'Transportation', 'Retail', 'Education'];
    const topics = ['Climate Change', 'Renewable Energy', 'Digital Transformation', 'AI and Automation', 'Cybersecurity', 'Supply Chain', 'Remote Work', 'Economic Growth', 'Blockchain', 'Healthcare Innovation'];
    const regions = ['North America', 'Europe', 'Asia', 'Africa', 'South America', 'Oceania', 'Middle East'];
    const countries = ['United States', 'China', 'India', 'Germany', 'Japan', 'United Kingdom', 'Brazil', 'Canada', 'Australia', 'Russia', 'France', 'South Africa'];
    const pestles = ['Political', 'Economic', 'Social', 'Technological', 'Legal', 'Environmental'];
    const sources = ['World Economic Forum', 'United Nations', 'Reuters', 'Bloomberg', 'McKinsey', 'Harvard Business Review', 'Financial Times', 'The Economist'];
    const impacts = ['Strength', 'Weakness', 'Opportunity', 'Threat', 'Neutral'];
    
    allData = [];
    
    // Generate 500 random data points
    for (let i = 0; i < 500; i++) {
        const startYearVal = Math.floor(Math.random() * (endYear - startYear)) + startYear;
        const endYearVal = Math.random() > 0.7 ? (Math.floor(Math.random() * (endYear - startYearVal)) + startYearVal + 1).toString() : '';
        
        allData.push({
            id: i + 1,
            end_year: endYearVal,
            intensity: Math.floor(Math.random() * 100) + 1,
            sector: sectors[Math.floor(Math.random() * sectors.length)],
            topic: topics[Math.floor(Math.random() * topics.length)],
            insight: `Insight ${i+1} about ${topics[Math.floor(Math.random() * topics.length)]} in ${regions[Math.floor(Math.random() * regions.length)]}`,
            url: `https://example.com/insight/${i+1}`,
            region: regions[Math.floor(Math.random() * regions.length)],
            start_year: startYearVal.toString(),
            impact: impacts[Math.floor(Math.random() * impacts.length)],
            added: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
            published: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
            country: countries[Math.floor(Math.random() * countries.length)],
            relevance: Math.floor(Math.random() * 10) + 1,
            pestle: pestles[Math.floor(Math.random() * pestles.length)],
            source: sources[Math.floor(Math.random() * sources.length)],
            title: `Analysis of ${topics[Math.floor(Math.random() * topics.length)]} impact on ${sectors[Math.floor(Math.random() * sectors.length)]} in ${countries[Math.floor(Math.random() * countries.length)]}`,
            likelihood: Math.floor(Math.random() * 5) + 1
        });
    }
    
    filteredData = [...allData];
    populateFilters();
    updateDashboard();
}

// Populate filter dropdowns with unique values from data
function populateFilters() {
    fetch('/api/dashboard-summary/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch filter data');
            }
            return response.json();
        })
        .then(summary => {
            const filters = summary.filters;

            // Populate each filter dropdown
            populateSelect('endYearFilter', filters.end_years);
            populateSelect('topicFilter', filters.topics);
            populateSelect('sectorFilter', filters.sectors);
            populateSelect('regionFilter', filters.regions);
            populateSelect('pestleFilter', filters.pestles);
            populateSelect('sourceFilter', filters.sources);
            populateSelect('countryFilter', filters.countries);
            populateSelect('impactFilter', filters.impacts);
        })
        .catch(error => console.error('Error populating filters:', error));
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">All</option>'; // Reset options
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

// Apply selected filters to data
function applyFilters() {
    const filters = {
        end_year: document.getElementById('endYearFilter').value,
        topic: document.getElementById('topicFilter').value,
        sector: document.getElementById('sectorFilter').value,
        region: document.getElementById('regionFilter').value,
        pestle: document.getElementById('pestleFilter').value,
        source: document.getElementById('sourceFilter').value,
        country: document.getElementById('countryFilter').value,
        impact: document.getElementById('impactFilter').value
    };

    fetch('/api/filter/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(filters),
    })
        .then(response => response.json())
        .then(data => {
            filteredData = data.data;
            updateDashboard();
        })
        .catch(error => console.error('Error:', error));
}

// Reset all filters
function resetFilters() {
    filterSelects.forEach(select => {
        select.selectedIndex = 0;
    });
    
    filteredData = [...allData];
    updateDashboard();
}

// Search insights table
function searchInsights() {
    const searchTerm = insightSearch.value.toLowerCase();
    
    const searchResults = filteredData.filter(item => 
        (item.title && item.title.toLowerCase().includes(searchTerm)) || 
        (item.insight && item.insight.toLowerCase().includes(searchTerm)) ||
        (item.topic && item.topic.toLowerCase().includes(searchTerm)) ||
        (item.sector && item.sector.toLowerCase().includes(searchTerm))
    );
    
    populateInsightsTable(searchResults);
}

// Update all dashboard elements with the current filtered data
function updateDashboard() {
    updateMetrics();
    updateCharts();
    populateInsightsTable(filteredData);
}

// Update key metrics
function updateMetrics() {
    document.getElementById('totalDataPoints').textContent = filteredData.length;
    
    // Calculate average metrics
    const avgIntensity = calculateAverage(filteredData, 'intensity');
    const avgLikelihood = calculateAverage(filteredData, 'likelihood');
    const avgRelevance = calculateAverage(filteredData, 'relevance');
    
    document.getElementById('avgIntensity').textContent = avgIntensity.toFixed(1);
    document.getElementById('avgLikelihood').textContent = avgLikelihood.toFixed(1);
    document.getElementById('avgRelevance').textContent = avgRelevance.toFixed(1);
    
    // For demo purposes, show random growth percentages
    document.getElementById('dataPointsGrowth').textContent = (Math.random() * 15).toFixed(1) + '%';
    document.getElementById('intensityChange').textContent = (Math.random() * 10 - 5).toFixed(1) + '%';
    document.getElementById('likelihoodChange').textContent = (Math.random() * 10).toFixed(1) + '%';
    document.getElementById('relevanceChange').textContent = (Math.random() * 8).toFixed(1) + '%';
}

// Initialize or update all charts
function updateCharts() {
    if (filteredData.length === 0) {
        console.warn('No data available for charts');
        return;
    }

    initIntensityTrendChart();
    initTopicsChart();
    initSectorAnalysisChart();
    initRegionComparisonChart();
    initLikelihoodRelevanceChart();
    initCountryInsightsChart();
    initPestleAnalysisChart();
}

// Initialize Intensity Trend Chart
function initIntensityTrendChart() {
    // Get data for chart - group by year and calculate average intensity
    const yearlyData = groupByAndCalculateAverage(filteredData, 'start_year', 'intensity');
    
    // Sort by year
    const sortedData = Object.entries(yearlyData)
        .filter(([year]) => year) // Filter out empty years
        .sort(([yearA], [yearB]) => parseInt(yearA) - parseInt(yearB));
    
    const categories = sortedData.map(([year]) => year);
    const seriesData = sortedData.map(([, value]) => value);
    
    const options = {
        series: [{
            name: 'Average Intensity',
            data: seriesData
        }],
        chart: {
            height: 350,
            type: 'line',
            toolbar: {
                show: true
            },
            zoom: {
                enabled: true
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        markers: {
            size: 5
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Year'
            }
        },
        yaxis: {
            title: {
                text: 'Average Intensity'
            }
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val.toFixed(1);
                }
            }
        },
        colors: ['#008FFB']
    };
    
    if (charts.intensityTrend) {
        charts.intensityTrend.updateOptions({
            series: [{
                data: seriesData
            }],
            xaxis: {
                categories: categories
            }
        });
    } else {
        charts.intensityTrend = new ApexCharts(document.getElementById('intensityTrendChart'), options);
        charts.intensityTrend.render();
    }
}

// Update time trend chart based on selected period
function updateTimeTrendChart(period) {
    // This would be implemented to group data by the selected time period
    console.log(`Updating chart for period: ${period}`);
    
    // Re-initialize intensity trend chart (with modified grouping)
    initIntensityTrendChart();
}

// Initialize Topics Distribution Chart
function initTopicsChart() {
    // Get data for chart - count occurrences of each topic
    const topicsData = countOccurrences(filteredData, 'topic');
    
    // Sort and get top 6 topics
    const topTopics = Object.entries(topicsData)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 6);
    
    const labels = topTopics.map(([topic]) => topic);
    const data = topTopics.map(([, count]) => count);
    
    const options = {
        series: data,
        chart: {
            type: 'donut',
            height: 350
        },
        labels: labels,
        colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A'],
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }],
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Topics',
                            formatter: function(w) {
                                return data.reduce((sum, val) => sum + val, 0);
                            }
                        }
                    }
                }
            }
        }
    };
    
    if (charts.topics) {
        charts.topics.updateOptions({
            series: data,
            labels: labels
        });
    } else {
        charts.topics = new ApexCharts(document.getElementById('topicsChart'), options);
        charts.topics.render();
    }
}

// Initialize Sector Analysis Chart
// Initialize Sector Analysis Chart
function initSectorAnalysisChart() {
    // Get data for chart - count occurrences of each sector and calculate average intensity
    const sectorData = {};
    
    filteredData.forEach(item => {
        if (item.sector) {
            if (!sectorData[item.sector]) {
                sectorData[item.sector] = {
                    count: 0,
                    totalIntensity: 0
                };
            }
            sectorData[item.sector].count += 1;
            sectorData[item.sector].totalIntensity += item.intensity || 0;
        }
    });
    
    // Calculate average intensity for each sector and sort by count
    const processedData = Object.entries(sectorData)
        .map(([sector, data]) => ({
            sector,
            count: data.count,
            avgIntensity: data.totalIntensity / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 sectors
    
    const sectors = processedData.map(item => item.sector);
    const counts = processedData.map(item => item.count);
    const avgIntensities = processedData.map(item => item.avgIntensity);
    
    const options = {
        series: [{
            name: 'Data Points',
            type: 'column',
            data: counts
        }, {
            name: 'Avg. Intensity',
            type: 'line',
            data: avgIntensities
        }],
        chart: {
            height: 350,
            type: 'line',
            toolbar: {
                show: true
            }
        },
        stroke: {
            width: [0, 4]
        },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [1]
        },
        labels: sectors,
        xaxis: {
            categories: sectors,
            title: {
                text: 'Sectors'
            }
        },
        yaxis: [{
            title: {
                text: 'Data Points',
            },
        }, {
            opposite: true,
            title: {
                text: 'Avg. Intensity'
            }
        }],
        colors: ['#008FFB', '#FF4560']
    };
    
    if (charts.sectorAnalysis) {
        charts.sectorAnalysis.updateOptions({
            series: [{
                data: counts
            }, {
                data: avgIntensities
            }],
            xaxis: {
                categories: sectors
            }
        });
    } else {
        charts.sectorAnalysis = new ApexCharts(document.getElementById('sectorAnalysisChart'), options);
        charts.sectorAnalysis.render();
    }
}

// Initialize Region Comparison Chart
function initRegionComparisonChart() {
    // Get data for chart - summarize intensity, likelihood, relevance by region
    const regionData = {};
    
    filteredData.forEach(item => {
        if (item.region) {
            if (!regionData[item.region]) {
                regionData[item.region] = {
                    count: 0,
                    totalIntensity: 0,
                    totalLikelihood: 0,
                    totalRelevance: 0
                };
            }
            regionData[item.region].count += 1;
            regionData[item.region].totalIntensity += item.intensity || 0;
            regionData[item.region].totalLikelihood += item.likelihood || 0;
            regionData[item.region].totalRelevance += item.relevance || 0;
        }
    });
    
    // Calculate averages for each region and sort by count
    const processedData = Object.entries(regionData)
        .map(([region, data]) => ({
            region,
            count: data.count,
            avgIntensity: data.totalIntensity / data.count,
            avgLikelihood: data.totalLikelihood / data.count,
            avgRelevance: data.totalRelevance / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Top 6 regions
    
    const regions = processedData.map(item => item.region);
    const intensities = processedData.map(item => item.avgIntensity);
    const likelihoods = processedData.map(item => item.avgLikelihood);
    const relevances = processedData.map(item => item.avgRelevance);
    
    const options = {
        series: [{
            name: 'Intensity',
            data: intensities
        }, {
            name: 'Likelihood',
            data: likelihoods
        }, {
            name: 'Relevance',
            data: relevances
        }],
        chart: {
            type: 'radar',
            height: 350,
            toolbar: {
                show: true
            }
        },
        xaxis: {
            categories: regions
        },
        yaxis: {
            show: false
        },
        dataLabels: {
            enabled: true
        },
        colors: ['#008FFB', '#00E396', '#FEB019']
    };
    
    if (charts.regionComparison) {
        charts.regionComparison.updateOptions({
            series: [{
                data: intensities
            }, {
                data: likelihoods
            }, {
                data: relevances
            }],
            xaxis: {
                categories: regions
            }
        });
    } else {
        charts.regionComparison = new ApexCharts(document.getElementById('regionComparisonChart'), options);
        charts.regionComparison.render();
    }
}

// Initialize Likelihood vs Relevance Chart
function initLikelihoodRelevanceChart() {
    // Create scatter plot data - each point is likelihood vs relevance with intensity as bubble size
    const scatterData = filteredData
        .filter(item => item.likelihood && item.relevance && item.intensity)
        .slice(0, 100) // Limit to 100 points for performance
        .map(item => ({
            x: item.likelihood,
            y: item.relevance,
            z: item.intensity,
            topic: item.topic || 'Unknown',
            sector: item.sector || 'Unknown'
        }));
    
    // Group by sector for series
    const sectorGroups = {};
    scatterData.forEach(point => {
        if (!sectorGroups[point.sector]) {
            sectorGroups[point.sector] = [];
        }
        sectorGroups[point.sector].push(point);
    });
    
    // Create series array
    const series = Object.entries(sectorGroups)
        .map(([sector, points]) => ({
            name: sector,
            data: points.map(point => ({
                x: point.x,
                y: point.y,
                z: point.z,
                topic: point.topic
            }))
        }))
        .slice(0, 5); // Top 5 sectors only
    
    const options = {
        series: series,
        chart: {
            height: 350,
            type: 'bubble',
            toolbar: {
                show: true
            }
        },
        dataLabels: {
            enabled: false
        },
        fill: {
            opacity: 0.8
        },
        xaxis: {
            title: {
                text: 'Likelihood'
            },
            min: 0,
            max: 5,
            tickAmount: 5
        },
        yaxis: {
            title: {
                text: 'Relevance'
            },
            min: 0,
            max: 10,
            tickAmount: 5
        },
        tooltip: {
            custom: function({series, seriesIndex, dataPointIndex}) {
                const point = series[seriesIndex][dataPointIndex];
                return `<div class="p-2">
                          <div><b>Topic:</b> ${point.topic}</div>
                          <div><b>Likelihood:</b> ${point.x}</div>
                          <div><b>Relevance:</b> ${point.y}</div>
                          <div><b>Intensity:</b> ${point.z}</div>
                        </div>`;
            }
        }
    };
    
    if (charts.likelihoodRelevance) {
        charts.likelihoodRelevance.updateOptions({
            series: series
        });
    } else {
        charts.likelihoodRelevance = new ApexCharts(document.getElementById('likelihoodRelevanceChart'), options);
        charts.likelihoodRelevance.render();
    }
}

// Initialize Country Insights Chart
function initCountryInsightsChart() {
    // Get data for chart - count occurrences and calculate average metrics by country
    const countryData = {};
    
    filteredData.forEach(item => {
        if (item.country) {
            if (!countryData[item.country]) {
                countryData[item.country] = {
                    count: 0,
                    totalIntensity: 0,
                    totalLikelihood: 0,
                    totalRelevance: 0
                };
            }
            countryData[item.country].count += 1;
            countryData[item.country].totalIntensity += item.intensity || 0;
            countryData[item.country].totalLikelihood += item.likelihood || 0;
            countryData[item.country].totalRelevance += item.relevance || 0;
        }
    });
    
    // Sort by total data points and get top 10 countries
    const topCountries = Object.entries(countryData)
        .map(([country, data]) => ({
            country,
            count: data.count,
            avgIntensity: data.totalIntensity / data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    const countries = topCountries.map(item => item.country);
    const counts = topCountries.map(item => item.count);
    const intensities = topCountries.map(item => item.avgIntensity);
    
    const options = {
        series: [{
            name: 'Data Points',
            data: counts
        }],
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: true
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '70%',
                distributed: true,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B', 
                '#2b908f', '#f9a3a4', '#90ee7e', '#f48024', '#69d2e7'],
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: ['#fff']
            },
            formatter: function(val) {
                return val;
            },
            offsetX: 0
        },
        stroke: {
            width: 1,
            colors: ['#fff']
        },
        xaxis: {
            categories: countries,
            title: {
                text: 'Number of Data Points'
            }
        },
        yaxis: {
            title: {
                text: 'Countries'
            }
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + " data points";
                }
            }
        }
    };
    
    if (charts.countryInsights) {
        charts.countryInsights.updateOptions({
            series: [{
                data: counts
            }],
            xaxis: {
                categories: countries
            }
        });
    } else {
        charts.countryInsights = new ApexCharts(document.getElementById('countryInsightsChart'), options);
        charts.countryInsights.render();
    }
}

// Initialize PESTLE Analysis Chart
function initPestleAnalysisChart() {
    // Get data for chart - calculate metrics for each PESTLE category
    const pestleData = {};
    
    filteredData.forEach(item => {
        if (item.pestle) {
            if (!pestleData[item.pestle]) {
                pestleData[item.pestle] = {
                    count: 0,
                    totalIntensity: 0,
                    totalLikelihood: 0,
                    totalRelevance: 0
                };
            }
            pestleData[item.pestle].count += 1;
            pestleData[item.pestle].totalIntensity += item.intensity || 0;
            pestleData[item.pestle].totalLikelihood += item.likelihood || 0;
            pestleData[item.pestle].totalRelevance += item.relevance || 0;
        }
    });
    
    // Calculate averages and prepare chart data
    const processedData = Object.entries(pestleData)
        .map(([pestle, data]) => ({
            pestle,
            count: data.count,
            avgIntensity: data.totalIntensity / data.count,
            avgLikelihood: data.totalLikelihood / data.count,
            avgRelevance: data.totalRelevance / data.count
        }))
        .sort((a, b) => a.pestle.localeCompare(b.pestle));
    
    const categories = processedData.map(item => item.pestle);
    
    const options = {
        series: [{
            name: 'Data Points',
            type: 'column',
            data: processedData.map(item => item.count)
        }, {
            name: 'Avg. Intensity',
            type: 'line',
            data: processedData.map(item => item.avgIntensity)
        }, {
            name: 'Avg. Likelihood',
            type: 'line',
            data: processedData.map(item => item.avgLikelihood)
        }, {
            name: 'Avg. Relevance',
            type: 'line',
            data: processedData.map(item => item.avgRelevance)
        }],
        chart: {
            height: 350,
            type: 'line',
            toolbar: {
                show: true
            }
        },
        stroke: {
            width: [0, 3, 3, 3],
            curve: 'smooth'
        },
        plotOptions: {
            bar: {
                columnWidth: '50%'
            }
        },
        fill: {
            opacity: [0.85, 0.25, 0.25, 0.25],
            gradient: {
                inverseColors: false,
                shade: 'light',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.55,
                stops: [0, 100, 100, 100]
            }
        },
        markers: {
            size: 0
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'PESTLE Categories'
            }
        },
        yaxis: [{
            title: {
                text: 'Data Points',
            },
        }, {
            opposite: true,
            title: {
                text: 'Average Metrics'
            }
        }],
        colors: ['#008FFB', '#FF4560', '#00E396', '#FEB019']
    };
    
    if (charts.pestleAnalysis) {
        charts.pestleAnalysis.updateOptions({
            series: [{
                data: processedData.map(item => item.count)
            }, {
                data: processedData.map(item => item.avgIntensity)
            }, {
                data: processedData.map(item => item.avgLikelihood)
            }, {
                data: processedData.map(item => item.avgRelevance)
            }],
            xaxis: {
                categories: categories
            }
        });
    } else {
        charts.pestleAnalysis = new ApexCharts(document.getElementById('pestleAnalysisChart'), options);
        charts.pestleAnalysis.render();
    }
}

// Populate insights table with data
function populateInsightsTable(data, page = 1) {
    const tableBody = document.getElementById('insightsTableBody');
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Create table rows
    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        
        // Create title cell with truncated text
        const titleCell = document.createElement('td');
        titleCell.style.maxWidth = '250px';
        titleCell.style.overflow = 'hidden';
        titleCell.style.textOverflow = 'ellipsis';
        titleCell.style.whiteSpace = 'nowrap';
        titleCell.title = item.title || '';
        titleCell.textContent = item.title || '';
        row.appendChild(titleCell);
        
        // Add other cells
        row.appendChild(createTableCell(item.topic));
        row.appendChild(createTableCell(item.sector));
        row.appendChild(createTableCell(item.region));
        row.appendChild(createTableCell(item.intensity));
        row.appendChild(createTableCell(item.likelihood));
        row.appendChild(createTableCell(item.relevance));
        
        // Format published date
        const publishedDate = item.published ? new Date(item.published).toLocaleDateString() : '';
        row.appendChild(createTableCell(publishedDate));
        
        tableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination(data.length, itemsPerPage, page);
}

// Create a table cell with the given content
function createTableCell(content) {
    const cell = document.createElement('td');
    cell.textContent = content !== undefined && content !== null ? content : '-';
    return cell;
}

// Update pagination controls
function updatePagination(totalItems, itemsPerPage, currentPage) {
    const pagination = document.getElementById('insightsPagination');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Clear existing pagination
    pagination.innerHTML = '';
    
    // Create previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    if (currentPage > 1) {
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            populateInsightsTable(filteredData, currentPage - 1);
        });
    }
    prevLi.appendChild(prevLink);
    pagination.appendChild(prevLi);
    
    // Create page number buttons (show 5 pages around current)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i !== currentPage) {
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                populateInsightsTable(filteredData, i);
            });
        }
        pageLi.appendChild(pageLink);
        pagination.appendChild(pageLi);
    }
    
    // Create next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            populateInsightsTable(filteredData, currentPage + 1);
        });
    }
    nextLi.appendChild(nextLink);
    pagination.appendChild(nextLi);
}

// Calculate the average of a field in an array of objects
function calculateAverage(data, field) {
    const validValues = data
        .map(item => item[field])
        .filter(val => val !== undefined && val !== null);
    
    if (validValues.length === 0) return 0;
    
    const sum = validValues.reduce((total, val) => total + val, 0);
    return sum / validValues.length;
}

// Group data by a field and calculate average of another field
function groupByAndCalculateAverage(data, groupField, valueField) {
    const groups = {};
    
    data.forEach(item => {
        const groupKey = item[groupField];
        if (groupKey && item[valueField] !== undefined && item[valueField] !== null) {
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    sum: 0,
                    count: 0
                };
            }
            groups[groupKey].sum += item[valueField];
            groups[groupKey].count += 1;
        }
    });
    
    // Calculate average for each group
    Object.keys(groups).forEach(key => {
        groups[key] = groups[key].sum / groups[key].count;
    });
    
    return groups;
}

// Count occurrences of each unique value in a field
function countOccurrences(data, field) {
    const counts = {};
    
    data.forEach(item => {
        const value = item[field];
        if (value) {
            counts[value] = (counts[value] || 0) + 1;
        }
    });
    
    return counts;
}

// Toggle loading state for the dashboard
function toggleLoadingState(isLoading) {
    // In a real implementation, this would show/hide loading spinners
    console.log(`Dashboard loading state: ${isLoading}`);
    
    // Disable/enable filter buttons while loading
    applyFiltersBtn.disabled = isLoading;
    resetFiltersBtn.disabled = isLoading;
    refreshDataBtn.disabled = isLoading;
}

// Debounce function to limit how often a function is called
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// For Django integration, we need to add CSRF token to API requests
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return null;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // If Django API is not available, generate mock data
    generateMockData();
});