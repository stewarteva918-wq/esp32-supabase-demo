const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    try {
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка...';
        
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            document.getElementById('connectionStatus').textContent = '✅ Найдено записей: ' + data.length;
            
            // Последняя запись
            const last = data[0];
            
            // Форматируем время из timestamp (created_at) в читаемый вид
            const date = new Date(last.created_at * 1000); // если created_at в секундах
            const timeString = date.toLocaleString();
            
            let html = '';
            if (last.temperature) html += `<p>🌡️ Температура: ${last.temperature}°C</p>`;
            if (last.humidity) html += `<p>💧 Влажность: ${last.humidity}%</p>`;
            html += `<p>🆔 Устройство: ${last.device_id}</p>`;
            html += `<p>🕐 Время (sensor_readings): ${new Date(last.sensor_readings).toLocaleString()}</p>`;
            html += `<p>🕐 Время (created_at): ${timeString}</p>`;
            
            document.getElementById('latestData').innerHTML = html;
            
            // Таблица истории
            let tableHtml = '<table border="1" style="width:100%"><tr><th>sensor_readings</th><th>created_at</th><th>°C</th><th>%</th><th>Устройство</th></tr>';
            data.forEach(row => {
                const dateFromTimestamp = new Date(row.created_at * 1000).toLocaleString();
                tableHtml += `<tr>
                    <td>${new Date(row.sensor_readings).toLocaleString()}</td>
                    <td>${dateFromTimestamp}</td>
                    <td>${row.temperature || '—'}</td>
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
    }
}

loadData();
setInterval(loadData, 10000);
