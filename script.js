const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let charts = {
    temp: null, hum: null, pres: null,
    acc: null, uv: null, ecg: null, gas: null
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
        
        // Разделяем данные по устройствам
        const allSensorsData = data.filter(row => 
            row.device_id === 'esp32_all_sensors'
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        const gasData = data.filter(row => 
            row.device_id === 'esp32_mq135' || row.gas_raw > 100
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Последние данные
        const lastAll = allSensorsData[allSensorsData.length - 1] || {};
        const lastGas = gasData[gasData.length - 1] || {};
        
        // Обновляем значения на главной
        document.getElementById('temp').textContent = lastAll.temperature?.toFixed(1) || '—';
        document.getElementById('hum').textContent = lastAll.humidity?.toFixed(1) || '—';
        document.getElementById('pres').textContent = lastAll.pressure?.toFixed(1) || '—';
        
        document.getElementById('accX').textContent = lastAll.acc_x?.toFixed(2) || '—';
        document.getElementById('accY').textContent = lastAll.acc_y?.toFixed(2) || '—';
        document.getElementById('accZ').textContent = lastAll.acc_z?.toFixed(2) || '—';
        
        document.getElementById('uvRaw').textContent = lastAll.uv_raw || '—';
        document.getElementById('uvIndex').textContent = lastAll.uv_index?.toFixed(1) || '—';
        
        document.getElementById('ecgRaw').textContent = lastAll.ecg_raw || '—';
        
        if (lastGas.gas_raw) {
            document.getElementById('gasRaw').textContent = lastGas.gas_raw;
            const ppm = Math.round(lastGas.gas_raw * (3.3 / 4095) * 100);
            document.getElementById('gasPPM').textContent = ppm;
        }
        
        document.getElementById('deviceInfo').innerHTML = `🆔 ${lastAll.device_id || '—'}`;
        document.getElementById('lastUpdate').innerHTML = `🕐 ${lastAll.created_at ? new Date(lastAll.created_at).toLocaleString() : '—'}`;
        document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        
        // Обновляем графики
        updateCharts(allSensorsData, gasData);
        
        // Обновляем историю
        updateHistory([...allSensorsData, ...gasData].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        ));
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

function updateCharts(allSensorsData, gasData) {
    // Берем последние 20 записей
    const last20All = allSensorsData.slice(-20);
    const last20Gas = gasData.slice(-20);
    
    // Метки времени для всех датчиков
    const allLabels = last20All.map(row => {
        const d = new Date(row.created_at);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    });
    
    // Метки времени для газа
    const gasLabels = last20Gas.map(row => {
        const d = new Date(row.created_at);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    });
    
    // ===== ГРАФИК ТЕМПЕРАТУРЫ =====
    const tempCtx = document.getElementById('tempChart')?.getContext('2d');
    if (tempCtx) {
        if (charts.temp) charts.temp.destroy();
        charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [{
                    data: last20All.map(row => row.temperature || 0),
                    borderColor: '#FF6B6B',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.2
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

    // ===== ГРАФИК ВЛАЖНОСТИ =====
    const humCtx = document.getElementById('humChart')?.getContext('2d');
    if (humCtx) {
        if (charts.hum) charts.hum.destroy();
        charts.hum = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [{
                    data: last20All.map(row => row.humidity || 0),
                    borderColor: '#4ECDC4',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.2
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

    // ===== ГРАФИК ДАВЛЕНИЯ =====
    const presCtx = document.getElementById('presChart')?.getContext('2d');
    if (presCtx) {
        if (charts.pres) charts.pres.destroy();
        charts.pres = new Chart(presCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [{
                    data: last20All.map(row => row.pressure || 0),
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.2
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

    // ===== ГРАФИК АКСЕЛЕРОМЕТРА =====
    const accCtx = document.getElementById('accChart')?.getContext('2d');
    if (accCtx) {
        if (charts.acc) charts.acc.destroy();
        charts.acc = new Chart(accCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    { data: last20All.map(row => row.acc_x || 0), borderColor: '#4ECDC4', borderWidth: 1.5, pointRadius: 1 },
                    { data: last20All.map(row => row.acc_y || 0), borderColor: '#FFE66D', borderWidth: 1.5, pointRadius: 1 },
                    { data: last20All.map(row => row.acc_z || 0), borderColor: '#FF9F1C', borderWidth: 1.5, pointRadius: 1 }
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

    // ===== ГРАФИК UV =====
    const uvCtx = document.getElementById('uvChart')?.getContext('2d');
    if (uvCtx) {
        if (charts.uv) charts.uv.destroy();
        charts.uv = new Chart(uvCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [{
                    data: last20All.map(row => row.uv_index || 0),
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.2
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

    // ===== ГРАФИК ЭКГ =====
    const ecgCtx = document.getElementById('ecgChart')?.getContext('2d');
    if (ecgCtx) {
        if (charts.ecg) charts.ecg.destroy();
        charts.ecg = new Chart(ecgCtx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [{
                    data: last20All.map(row => row.ecg_raw || 0),
                    borderColor: '#2ECC71',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.2
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

    // ===== ГРАФИК ГАЗА =====
    const gasCtx = document.getElementById('gasChart')?.getContext('2d');
    if (gasCtx) {
        if (charts.gas) charts.gas.destroy();
        charts.gas = new Chart(gasCtx, {
            type: 'line',
            data: {
                labels: gasLabels,
                datasets: [{
                    data: last20Gas.map(row => row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : 0),
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0,122,255,0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 2,
                    tension: 0.2
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

function updateHistory(data) {
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
    
    data.slice(0, 30).forEach(row => {
        const deviceType = row.device_id === 'esp32_all_sensors' ? '📊 Все датчики' : '💨 Газ';
        const bgColor = row.device_id === 'esp32_all_sensors' ? '#f0f7ff' : '#fff5e6';
        
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

// Функция скачивания данных в CSV
function downloadDataAsCSV() {
    const btn = document.getElementById('downloadCSV');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Подготовка...';
    btn.disabled = true;
    
    setTimeout(async () => {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
            );
            const data = await response.json();
            
            const sortedData = data.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            
            let csv = 'Время;Устройство;Температура (°C);Влажность (%);Давление (hPa);UV индекс;ЭКГ (RAW);Газ (RAW);Газ (PPM);Acc X;Acc Y;Acc Z\n';
            
            sortedData.forEach(row => {
                const date = new Date(row.created_at).toLocaleString();
                const device = row.device_id === 'esp32_all_sensors' ? 'Все датчики' : 'Газ';
                const temp = row.temperature?.toFixed(1) || '';
                const hum = row.humidity?.toFixed(1) || '';
                const pres = row.pressure?.toFixed(1) || '';
                const uv = row.uv_index?.toFixed(1) || '';
                const ecg = row.ecg_raw || '';
                const gasRaw = row.gas_raw || '';
                const gasPPM = row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : '';
                const accX = row.acc_x?.toFixed(2) || '';
                const accY = row.acc_y?.toFixed(2) || '';
                const accZ = row.acc_z?.toFixed(2) || '';
                
                csv += `${date};${device};${temp};${hum};${pres};${uv};${ecg};${gasRaw};${gasPPM};${accX};${accY};${accZ}\n`;
            });
            
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const filename = `esp32_data_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}.csv`;
            
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            btn.innerHTML = '✅ Скачано!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            btn.innerHTML = '❌ Ошибка';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }, 100);
}

// Запуск
loadData();
setInterval(loadData, 5000);
