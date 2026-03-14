const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let chart = null;

// Функция переключения вкладок
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
        
        const gasData = data.filter(row => 
            row.device_id === 'esp32_mq135' && row.gas_raw != null
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (gasData.length > 0) {
            const last = gasData[0];
            const lastPPM = Math.round(last.gas_raw * (3.3 / 4095) * 100);
            
            // Обновляем главную страницу
            document.getElementById('gasRaw').textContent = last.gas_raw;
            document.getElementById('gasPPM').textContent = lastPPM;
            document.getElementById('deviceInfo').innerHTML = `🆔 ${last.device_id}`;
            document.getElementById('lastUpdate').innerHTML = `🕐 ${new Date(last.created_at).toLocaleString()}`;
            document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
            
            // График (последние 20)
            const last20 = gasData.slice(0, 20).reverse();
            const labels = last20.map(row => {
                const d = new Date(row.created_at);
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            });
            const values = last20.map(row => Math.round(row.gas_raw * (3.3 / 4095) * 100));
            
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
            
            // Таблица истории (ТОЛЬКО для вкладки История)
            let tableHtml = '<table><tr><th>Время</th><th>RAW</th><th>PPM</th></tr>';
            gasData.slice(0, 50).forEach(row => {
                const ppm = Math.round(row.gas_raw * (3.3 / 4095) * 100);
                tableHtml += `<tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td>${row.gas_raw}</td>
                    <td>${ppm}</td>
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
