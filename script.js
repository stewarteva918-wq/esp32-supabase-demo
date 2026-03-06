const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    try {
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка...';
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            document.getElementById('connectionStatus').textContent = '✅ Найдено записей: ' + data.length;
            
            // Последние показания
            const last = data[0];
            
            // Правильное форматирование даты
            const date = new Date(last.created_at);
            const formattedDate = date.toLocaleString();
            
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: <strong>${last.temperature}°C</strong></p>
                <p>💧 Влажность: <strong>${last.humidity}%</strong></p>
                <p>🆔 Устройство: <strong>${last.device_id}</strong></p>
                <p>🕐 Время: <strong>${formattedDate}</strong></p>
            `;
            
            // История с правильными датами
            let tableHtml = '<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Время</th><th>°C</th><th>%</th><th>Устройство</th></tr>';
            data.forEach(row => {
                const rowDate = new Date(row.created_at).toLocaleString();
                tableHtml += `<tr>
                    <td>${rowDate}</td>
                    <td>${row.temperature}</td>
                    <td>${row.humidity}</td>
                    <td>${row.device_id}</td>
                </tr>`;
            });
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
            
        } else {
            document.getElementById('connectionStatus').textContent = '⚠️ Таблица пуста';
            document.getElementById('latestData').innerHTML = '<p>📭 Нет данных</p>';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
        document.getElementById('latestData').innerHTML = `<p>Ошибка: ${error.message}</p>`;
    }
}

loadData();
setInterval(loadData, 10000);
