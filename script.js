const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let chart = null;

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
        
        // Берем ВСЕ записи с данными (любые датчики)
        const allData = data.filter(row => 
            row.temperature != null || 
            row.humidity != null || 
            row.pressure != null ||
            row.gas_raw != null || 
            row.uv_index != null ||
            row.ecg_raw != null
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (allData.length > 0) {
            const last = allData[0];
            
            // Конвертируем газ в PPM если есть
            const lastPPM = last.gas_raw ? Math.round(last.gas_raw * (3.3 / 4095) * 100) : null;
            
            // Обновляем статус
            document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
            
            // Обновляем ВСЕ датчики на странице
            document.getElementById('gasRaw').textContent = last.gas_raw || '—';
            document.getElementById('gasPPM').textContent = lastPPM || '—';
            
            // BME280
            document.getElementById('tempValue').textContent = last.temperature ? last.temperature.toFixed(1) : '—';
            document.getElementById('humValue').textContent = last.humidity ? last.humidity.toFixed(1) : '—';
            document.getElementById('presValue').textContent = last.pressure ? last.pressure.toFixed(1) : '—';
            
            // MPU6050
            document.getElementById('accX').textContent = last.acc_x ? last.acc_x.toFixed(3) : '—';
            document.getElementById('accY').textContent = last.acc_y ? last.acc_y.toFixed(3) : '—';
            document.getElementById('accZ').textContent = last.acc_z ? last.acc_z.toFixed(3) : '—';
            
            // ML8511
            document.getElementById('uvRaw').textContent = last.uv_raw || '—';
            document.getElementById('uvIndex').textContent = last.uv_index ? last.uv_index.toFixed(2) : '—';
            
            // AD8232
            document.getElementById('ecgRaw').textContent = last.ecg_raw || '—';
            
            // Информация
            document.getElementById('deviceInfo').innerHTML = `🆔 ${last.device_id || 'unknown'}`;
            document.getElementById('lastUpdate').innerHTML = `🕐 ${new Date(last.created_at).toLocaleString()}`;
            
            // График (последние 20 значений газа если есть)
            const gasData = allData.filter(row => row.gas_raw != null).slice(0, 20).reverse();
            if (gasData.length > 0) {
                const labels = gasData.map(row => {
                    const d = new Date(row.created_at);
                    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                });
                const values = gasData.map(row => Math.round(row.gas_raw * (3.3 / 4095) * 100));
                
                if (chart) chart.destroy();
                
                const ctx = document.getElementById('gasChart').getContext('2d');
                chart = new Chart(ctx, {
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
                        scales: {
                            y: { beginAtZero: false }
                        }
                    }
                });
            }
            
            // Таблица истории (ВСЕ датчики)
            let tableHtml = `<table>
                <tr>
                    <th>Время</th>
                    <th>Устройство</th>
                    <th>Темп.</th>
                    <th>Влаж.</th>
                    <th>Давл.</th>
                    <th>Газ RAW</th>
                    <th>Газ PPM</th>
                    <th>UV</th>
                    <th>ECG</th>
                </tr>`;
            
            allData.slice(0, 30).forEach(row => {
                const ppm = row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : '—';
                tableHtml += `<tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td>${row.device_id || '—'}</td>
                    <td>${row.temperature ? row.temperature.toFixed(1) : '—'}</td>
                    <td>${row.humidity ? row.humidity.toFixed(1) : '—'}</td>
                    <td>${row.pressure ? row.pressure.toFixed(1) : '—'}</td>
                    <td>${row.gas_raw || '—'}</td>
                    <td>${ppm}</td>
                    <td>${row.uv_index ? row.uv_index.toFixed(2) : '—'}</td>
                    <td>${row.ecg_raw || '—'}</td>
                </tr>`;
            });
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
            
        } else {
            document.getElementById('connectionStatus').innerHTML = '⚠️ Нет данных';
        }
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

loadData();
setInterval(loadData, 5000);
