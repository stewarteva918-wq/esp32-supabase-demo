const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let gasChart = null;
let allData = [];

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
        allData = data;
        
        // Последние данные от всех датчиков
        const allSensorsData = data.filter(row => 
            row.device_id === 'esp32_all_sensors'
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Данные только от MQ135 (для газа)
        const gasData = data.filter(row => 
            (row.device_id === 'esp32_all_sensors' || row.device_id === 'esp32_mq135') && 
            row.gas_raw != null
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (allSensorsData.length > 0) {
            const last = allSensorsData[0];
            
            // Главная страница (все датчики кроме газа)
            document.getElementById('temp').textContent = last.temperature?.toFixed(1) || '—';
            document.getElementById('hum').textContent = last.humidity?.toFixed(1) || '—';
            document.getElementById('pres').textContent = last.pressure?.toFixed(1) || '—';
            
            document.getElementById('accX').textContent = last.acc_x?.toFixed(2) || '—';
            document.getElementById('accY').textContent = last.acc_y?.toFixed(2) || '—';
            document.getElementById('accZ').textContent = last.acc_z?.toFixed(2) || '—';
            
            document.getElementById('uvRaw').textContent = last.uv_raw || '—';
            document.getElementById('uvIndex').textContent = last.uv_index?.toFixed(1) || '—';
            
            document.getElementById('ecgRaw').textContent = last.ecg_raw || '—';
            
            document.getElementById('deviceInfo').innerHTML = `🆔 ${last.device_id}`;
            document.getElementById('lastUpdate').innerHTML = `🕐 ${new Date(last.created_at).toLocaleString()}`;
            document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        }
        
        // Вкладка с газом
        if (gasData.length > 0) {
            const lastGas = gasData[0];
            const ppm = Math.round(lastGas.gas_raw * (3.3 / 4095) * 100);
            
            document.getElementById('gasRaw').textContent = lastGas.gas_raw;
            document.getElementById('gasPPM').textContent = ppm;
            document.getElementById('gasDeviceInfo').innerHTML = `🆔 ${lastGas.device_id}`;
            document.getElementById('gasLastUpdate').innerHTML = `🕐 ${new Date(lastGas.created_at).toLocaleString()}`;
            
            // График газа
            const gasHistory = gasData.slice(0, 20).reverse();
            const labels = gasHistory.map(row => {
                const d = new Date(row.created_at);
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            });
            const values = gasHistory.map(row => Math.round(row.gas_raw * (3.3 / 4095) * 100));
            
            if (gasChart) gasChart.destroy();
            
            const ctx = document.getElementById('gasChart').getContext('2d');
            gasChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        borderColor: '#007AFF',
                        backgroundColor: 'rgba(0,122,255,0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: false } }
                }
            });
        }
        
        // История
        updateHistory(data);
        
        // Статистика
        const count = data.length;
        const last = data[0]?.created_at ? new Date(data[0].created_at).toLocaleString() : '—';
        document.getElementById('stats').innerHTML = `
            Всего записей: ${count}<br>
            Последнее обновление: ${last}<br>
            Устройств: ${new Set(data.map(d => d.device_id)).size}
        `;
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

function updateHistory(data) {
    const allData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    let tableHtml = `
        <table>
            <tr>
                <th>Время</th>
                <th>Устройство</th>
                <th>Темп</th>
                <th>Влаж</th>
                <th>Давл</th>
                <th>Газ</th>
                <th>UV</th>
                <th>ЭКГ</th>
            </tr>
    `;
    
    allData.slice(0, 30).forEach(row => {
        tableHtml += `<tr>
            <td>${new Date(row.created_at).toLocaleString()}</td>
            <td>${row.device_id || '—'}</td>
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
