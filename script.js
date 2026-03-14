const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let chart = null;
let chartData = [];
let chartLabels = [];

function openTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Фильтруем записи от MQ135
        const gasData = data.filter(row => 
            row.device_id === 'esp32_mq135' && row.gas_raw != null
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (gasData.length > 0) {
            const last = gasData[gasData.length - 1];
            
            // Конвертируем RAW в PPM
            const lastPPM = Math.round(last.gas_raw * (3.3 / 4095) * 100);
            
            // Обновляем главную страницу
            document.getElementById('currentRaw').textContent = last.gas_raw;
            document.getElementById('currentPPM').textContent = lastPPM;
            document.getElementById('currentDevice').textContent = `🆔 ${last.device_id}`;
            document.getElementById('currentTime').textContent = `🕐 ${new Date(last.created_at).toLocaleString()}`;
            document.getElementById('connectionStatus').textContent = '✅ Онлайн';
            
            // Подготовка данных для графика (последние 20)
            const last20 = gasData.slice(-20);
            chartLabels = last20.map(row => {
                const d = new Date(row.created_at);
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            });
            chartData = last20.map(row => Math.round(row.gas_raw * (3.3 / 4095) * 100));
            
            updateChart();
            
            // История (таблица)
            let tableHtml = `
                <table>
                    <tr>
                        <th>Время</th>
                        <th>RAW</th>
                        <th>PPM</th>
                    </tr>
            `;
            
            gasData.slice(-50).reverse().forEach(row => {
                const ppm = Math.round(row.gas_raw * (3.3 / 4095) * 100);
                tableHtml += `<tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td>${row.gas_raw}</td>
                    <td>${ppm}</td>
                </tr>`;
            });
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
        }
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
    }
}

function updateChart() {
    const ctx = document.getElementById('gasChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Концентрация газа (PPM)',
                data: chartData,
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#e67e22',
                pointBorderColor: 'white',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Запуск
loadData();
setInterval(loadData, 5000);
