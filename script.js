const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

// Глобальные переменные для графика
let chart = null;
let chartData = [];
let chartLabels = [];

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Фильтруем только записи от MQ135 с газом
        const gasData = data.filter(row => 
            row.device_id === 'esp32_mq135' && row.gas_raw != null
        ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (gasData.length > 0) {
            // Конвертируем RAW в PPM (примерная формула для MQ135)
            // Обычно PPM = RAW * (3.3 / 4095) * 1000
            const last = gasData[gasData.length - 1];
            const lastPPM = (last.gas_raw * (3.3 / 4095) * 100).toFixed(0);
            
            document.getElementById('connectionStatus').innerHTML = 
                `✅ Последние данные: ${new Date(last.created_at).toLocaleTimeString()}`;
            
            // Главная страница - только текущие значения
            document.getElementById('latestData').innerHTML = `
                <div style="font-size: 48px; text-align: center; margin: 20px 0;">
                    💨 <strong>${last.gas_raw}</strong> <span style="font-size: 24px;">RAW</span>
                </div>
                <div style="font-size: 32px; text-align: center; margin: 20px 0; color: #e67e22;">
                    🌫️ <strong>${lastPPM}</strong> <span style="font-size: 18px;">PPM</span>
                </div>
                <div style="text-align: center; color: #666;">
                    🕐 ${new Date(last.created_at).toLocaleString()}<br>
                    📟 Устройство: ${last.device_id}
                </div>
            `;
            
            // Подготовка данных для графика (последние 20 записей)
            const last20 = gasData.slice(-20);
            chartLabels = last20.map(row => {
                const d = new Date(row.created_at);
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            });
            chartData = last20.map(row => (row.gas_raw * (3.3 / 4095) * 100).toFixed(0));
            
            // Создаем или обновляем график
            updateChart();
            
            // Таблица с историей (последние 10 записей)
            let tableHtml = `
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #f0f0f0;">
                        <th>Время</th>
                        <th>RAW</th>
                        <th>PPM</th>
                    </tr>
            `;
            
            gasData.slice(-10).reverse().forEach(row => {
                const ppm = (row.gas_raw * (3.3 / 4095) * 100).toFixed(0);
                tableHtml += `<tr style="border-bottom: 1px solid #ddd;">
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td><strong>${row.gas_raw}</strong></td>
                    <td>${ppm}</td>
                </tr>`;
            });
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
        }
    } catch (error) {
        console.log(error);
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
                tension: 0.3,
                fill: true
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
                    title: {
                        display: true,
                        text: 'PPM'
                    }
                }
            }
        }
    });
}

// Добавляем canvas для графика в HTML
document.addEventListener('DOMContentLoaded', () => {
    const chartDiv = document.createElement('div');
    chartDiv.style.height = '300px';
    chartDiv.style.margin = '20px 0';
    chartDiv.innerHTML = '<canvas id="gasChart"></canvas>';
    
    const historyDiv = document.getElementById('historyTable');
    historyDiv.parentNode.insertBefore(chartDiv, historyDiv);
    
    loadData();
    setInterval(loadData, 5000);
});
