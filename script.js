const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

// Графики
let charts = {
    temp: null,
    acc: null,
    uv: null,
    ecg: null,
    gas: null
};

let historyData = {
    temp: [], hum: [], pres: [],
    accX: [], accY: [], accZ: [],
    uv: [], ecg: [],
    gas: [], labels: []
};

window.openTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Сортируем по времени
        const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const last20 = sortedData.slice(-20);
        
        // Обновляем историю для графиков
        historyData.labels = last20.map(row => {
            const d = new Date(row.created_at);
            return `${d.getHours()}:${d.getMinutes()}`;
        });
        
        historyData.temp = last20.map(row => row.temperature || 0);
        historyData.hum = last20.map(row => row.humidity || 0);
        historyData.pres = last20.map(row => row.pressure || 0);
        historyData.accX = last20.map(row => row.acc_x || 0);
        historyData.accY = last20.map(row => row.acc_y || 0);
        historyData.accZ = last20.map(row => row.acc_z || 0);
        historyData.uv = last20.map(row => row.uv_index || 0);
        historyData.ecg = last20.map(row => row.ecg_raw || 0);
        historyData.gas = last20.map(row => row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : 0);
        
        // Последние данные
        const last = sortedData[sortedData.length - 1] || {};
        
        // Обновляем значения на странице
        document.getElementById('temp').textContent = last.temperature?.toFixed(1) || '—';
        document.getElementById('hum').textContent = last.humidity?.toFixed(1) || '—';
        document.getElementById('pres').textContent = last.pressure?.toFixed(1) || '—';
        
        document.getElementById('accX').textContent = last.acc_x?.toFixed(2) || '—';
        document.getElementById('accY').textContent = last.acc_y?.toFixed(2) || '—';
        document.getElementById('accZ').textContent = last.acc_z?.toFixed(2) || '—';
        
        document.getElementById('uvRaw').textContent = last.uv_raw || '—';
        document.getElementById('uvIndex').textContent = last.uv_index?.toFixed(1) || '—';
        
        document.getElementById('ecgRaw').textContent = last.ecg_raw || '—';
        
        if (last.gas_raw) {
            const ppm = Math.round(last.gas_raw * (3.3 / 4095) * 100);
            document.getElementById('gasRaw').textContent = last.gas_raw;
            document.getElementById('gasPPM').textContent = ppm;
        }
        
        document.getElementById('deviceInfo').innerHTML = `🆔 ${last.device_id || '—'}`;
        document.getElementById('lastUpdate').innerHTML = `🕐 ${last.created_at ? new Date(last.created_at).toLocaleString() : '—'}`;
        document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        
        // Обновляем все графики
        updateAllCharts();
        
        // Обновляем историю
        updateHistory(sortedData.slice(-50).reverse());
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

function updateAllCharts() {
    // График температуры
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    if (charts.temp) charts.temp.destroy();
    charts.temp = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [{
                data: historyData.temp,
                borderColor: '#FF6B6B',
                borderWidth: 2,
                fill: false,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    // График акселерометра
    const accCtx = document.getElementById('accChart').getContext('2d');
    if (charts.acc) charts.acc.destroy();
    charts.acc = new Chart(accCtx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [
                { data: historyData.accX, borderColor: '#4ECDC4', borderWidth: 1.5, pointRadius: 1 },
                { data: historyData.accY, borderColor: '#FFE66D', borderWidth: 1.5, pointRadius: 1 },
                { data: historyData.accZ, borderColor: '#FF9F1C', borderWidth: 1.5, pointRadius: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    // График UV
    const uvCtx = document.getElementById('uvChart').getContext('2d');
    if (charts.uv) charts.uv.destroy();
    charts.uv = new Chart(uvCtx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [{
                data: historyData.uv,
                borderColor: '#9B59B6',
                borderWidth: 2,
                fill: false,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    // График ЭКГ
    const ecgCtx = document.getElementById('ecgChart').getContext('2d');
    if (charts.ecg) charts.ecg.destroy();
    charts.ecg = new Chart(ecgCtx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [{
                data: historyData.ecg,
                borderColor: '#2ECC71',
                borderWidth: 2,
                fill: false,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });

    // График газа (большой)
    const gasCtx = document.getElementById('gasChart').getContext('2d');
    if (charts.gas) charts.gas.destroy();
    charts.gas = new Chart(gasCtx, {
        type: 'line',
        data: {
            labels: historyData.labels,
            datasets: [{
                data: historyData.gas,
                borderColor: '#007AFF',
                backgroundColor: 'rgba(0,122,255,0.1)',
                borderWidth: 2,
                fill: true,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function updateHistory(data) {
    let tableHtml = `
        <table>
            <tr>
                <th>Время</th>
                <th>Темп</th>
                <th>Влаж</th>
                <th>Давл</th>
                <th>Газ</th>
                <th>UV</th>
                <th>ЭКГ</th>
            </tr>
    `;
    
    data.slice(0, 20).forEach(row => {
        tableHtml += `<tr>
            <td>${new Date(row.created_at).toLocaleString()}</td>
            <td>${row.temperature?.toFixed(1) || '—'}</td>
            <td>${row.humidity?.toFixed(1) || '—'}</td>
            <td>${row.pressure?.toFixed(1) || '—'}</td>
            <td>${row.gas_raw || '—'}</td>
            <td>${row.uv_index?.toFixed(1) || '—'}</td>
            <td>${row.ecg_raw || '—'}</td>
        </tr>`;
    });
    tableHtml += '</table>';
    
    document.getElementById('historyTable').innerHTML = tableHtml;
}

// Запуск
loadData();
setInterval(loadData, 30000);
