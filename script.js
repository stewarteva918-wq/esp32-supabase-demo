const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let charts = {
    temp: null, hum: null, pres: null,
    acc: null, uv: null, ecg: null, gas: null
};

let allData = []; // Глобальное хранилище данных

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
        
        // Сохраняем все данные глобально
        allData = data;
        
        // Сортируем по времени
        const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Последние данные от всех датчиков
        const lastAllSensors = sortedData.filter(row => row.device_id === 'esp32_all_sensors').pop() || {};
        const lastGas = sortedData.filter(row => row.device_id === 'esp32_mq135' || row.gas_raw > 100).pop() || {};
        
        // Обновляем значения на главной
        document.getElementById('temp').textContent = lastAllSensors.temperature?.toFixed(1) || '—';
        document.getElementById('hum').textContent = lastAllSensors.humidity?.toFixed(1) || '—';
        document.getElementById('pres').textContent = lastAllSensors.pressure?.toFixed(1) || '—';
        
        document.getElementById('accX').textContent = lastAllSensors.acc_x?.toFixed(2) || '—';
        document.getElementById('accY').textContent = lastAllSensors.acc_y?.toFixed(2) || '—';
        document.getElementById('accZ').textContent = lastAllSensors.acc_z?.toFixed(2) || '—';
        
        document.getElementById('uvRaw').textContent = lastAllSensors.uv_raw || '—';
        document.getElementById('uvIndex').textContent = lastAllSensors.uv_index?.toFixed(1) || '—';
        
        document.getElementById('ecgRaw').textContent = lastAllSensors.ecg_raw || '—';
        
        // Газ (отдельная плата)
        if (lastGas.gas_raw) {
            document.getElementById('gasRaw').textContent = lastGas.gas_raw;
            const ppm = Math.round(lastGas.gas_raw * (3.3 / 4095) * 100);
            document.getElementById('gasPPM').textContent = ppm;
        }
        
        const lastAny = sortedData[sortedData.length - 1] || {};
        document.getElementById('deviceInfo').innerHTML = `🆔 ${lastAny.device_id || '—'}`;
        document.getElementById('lastUpdate').innerHTML = `🕐 ${lastAny.created_at ? new Date(lastAny.created_at).toLocaleString() : '—'}`;
        document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        
        // Обновляем все графики с разделением по устройствам
        updateAllChartsSeparated();
        
        // Обновляем историю с разделением по устройствам
        updateHistory(sortedData.slice(-100).reverse());
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

// ===== ОБНОВЛЕННАЯ ФУНКЦИЯ ГРАФИКОВ С РАЗДЕЛЕНИЕМ =====
function updateAllChartsSeparated() {
    // Получаем последние 20 записей ТОЛЬКО от всех датчиков (не газ)
    const allSensorsData = allData.filter(row => 
        row.device_id === 'esp32_all_sensors'
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(-20);
    
    // Получаем последние 20 записей ТОЛЬКО от газовой платы
    const gasData = allData.filter(row => 
        row.device_id === 'esp32_mq135' || row.gas_raw > 100
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(-20);
    
    // Метки времени для графиков всех датчиков
    const allSensorsLabels = allSensorsData.map(row => {
        const d = new Date(row.created_at);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // Метки времени для графиков газа
    const gasLabels = gasData.map(row => {
        const d = new Date(row.created_at);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // ===== ГРАФИК ТЕМПЕРАТУРЫ (только от всех датчиков) =====
    const tempValues = allSensorsData.map(row => row.temperature || 0);
    const tempCtx = document.getElementById('tempChart')?.getContext('2d');
    if (tempCtx) {
        if (charts.temp) charts.temp.destroy();
        charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [{
                    data: tempValues,
                    borderColor: '#FF6B6B',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК ВЛАЖНОСТИ (только от всех датчиков) =====
    const humValues = allSensorsData.map(row => row.humidity || 0);
    const humCtx = document.getElementById('humChart')?.getContext('2d');
    if (humCtx) {
        if (charts.hum) charts.hum.destroy();
        charts.hum = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [{
                    data: humValues,
                    borderColor: '#4ECDC4',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК ДАВЛЕНИЯ (только от всех датчиков) =====
    const presValues = allSensorsData.map(row => row.pressure || 0);
    const presCtx = document.getElementById('presChart')?.getContext('2d');
    if (presCtx) {
        if (charts.pres) charts.pres.destroy();
        charts.pres = new Chart(presCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [{
                    data: presValues,
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК АКСЕЛЕРОМЕТРА (только от всех датчиков) =====
    const accXCtx = document.getElementById('accChart')?.getContext('2d');
    if (accXCtx) {
        if (charts.acc) charts.acc.destroy();
        charts.acc = new Chart(accXCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [
                    { 
                        data: allSensorsData.map(row => row.acc_x || 0), 
                        borderColor: '#4ECDC4', 
                        borderWidth: 1.5, 
                        pointRadius: 1,
                        label: 'X'
                    },
                    { 
                        data: allSensorsData.map(row => row.acc_y || 0), 
                        borderColor: '#FFE66D', 
                        borderWidth: 1.5, 
                        pointRadius: 1,
                        label: 'Y'
                    },
                    { 
                        data: allSensorsData.map(row => row.acc_z || 0), 
                        borderColor: '#FF9F1C', 
                        borderWidth: 1.5, 
                        pointRadius: 1,
                        label: 'Z'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК UV (только от всех датчиков) =====
    const uvValues = allSensorsData.map(row => row.uv_index || 0);
    const uvCtx = document.getElementById('uvChart')?.getContext('2d');
    if (uvCtx) {
        if (charts.uv) charts.uv.destroy();
        charts.uv = new Chart(uvCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [{
                    data: uvValues,
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК ЭКГ (только от всех датчиков) =====
    const ecgValues = allSensorsData.map(row => row.ecg_raw || 0);
    const ecgCtx = document.getElementById('ecgChart')?.getContext('2d');
    if (ecgCtx) {
        if (charts.ecg) charts.ecg.destroy();
        charts.ecg = new Chart(ecgCtx, {
            type: 'line',
            data: {
                labels: allSensorsLabels,
                datasets: [{
                    data: ecgValues,
                    borderColor: '#2ECC71',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // ===== ГРАФИК ГАЗА (только от газовой платы) =====
    const gasValues = gasData.map(row => row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : 0);
    const gasCtx = document.getElementById('gasChart')?.getContext('2d');
    if (gasCtx) {
        if (charts.gas) charts.gas.destroy();
        charts.gas = new Chart(gasCtx, {
            type: 'line',
            data: {
                labels: gasLabels,
                datasets: [{
                    data: gasValues,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0,122,255,0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// ===== ИСТОРИЯ С РАЗДЕЛЕНИЕМ ПО УСТРОЙСТВАМ =====
function updateHistory(data) {
    // Разделяем данные по устройствам
    const allSensors = data.filter(row => row.device_id === 'esp32_all_sensors');
    const gasSensor = data.filter(row => row.device_id === 'esp32_mq135' || row.gas_raw > 100);
    
    // Объединяем и сортируем по времени
    const combined = [...allSensors, ...gasSensor].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );
    
    let tableHtml = `
        <table>
            <tr>
                <th>Время</th>
                <th>Устройство</th>
                <th>Темп</th>
                <th>Влаж</th>
                <th>Давл</th>
                <th>UV</th>
                <th>ЭКГ</th>
                <th>Газ RAW</th>
                <th>Газ PPM</th>
            </tr>
    `;
    
    combined.slice(0, 30).forEach(row => {
        // Определяем тип устройства
        const deviceType = row.device_id === 'esp32_all_sensors' ? '📊 Все датчики' : '💨 Газ';
        const bgColor = row.device_id === 'esp32_all_sensors' ? '#f0f7ff' : '#fff5e6';
        
        // Расчет PPM если есть газ
        let gasPPM = '—';
        if (row.gas_raw && row.gas_raw > 100) {
            gasPPM = Math.round(row.gas_raw * (3.3 / 4095) * 100);
        }
        
        tableHtml += `<tr style="background: ${bgColor}">
            <td>${new Date(row.created_at).toLocaleString()}</td>
            <td><strong>${deviceType}</strong></td>
            <td>${row.temperature?.toFixed(1) || '—'}</td>
            <td>${row.humidity?.toFixed(1) || '—'}</td>
            <td>${row.pressure?.toFixed(1) || '—'}</td>
            <td>${row.uv_index?.toFixed(1) || '—'}</td>
            <td>${row.ecg_raw || '—'}</td>
            <td>${row.gas_raw || '—'}</td>
            <td>${gasPPM}</td>
        </tr>`;
    });
    tableHtml += '</table>';
    
    document.getElementById('historyTable').innerHTML = tableHtml;
}

// Запуск
loadData();
setInterval(loadData, 30000);
