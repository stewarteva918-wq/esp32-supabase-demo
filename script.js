// ФИНАЛЬНАЯ ВЕРСИЯ СО СТАРЫМ КЛЮЧОМ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    try {
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка...';
        
        // Запрос к Supabase (ключ в URL)
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            document.getElementById('connectionStatus').textContent = '✅ Найдено записей: ' + data.length;
            
            // Последние показания
            const last = data[0];
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: ${last.temperature}°C</p>
                <p>💧 Влажность: ${last.humidity}%</p>
                <p>🆔 Устройство: ${last.device_id}</p>
                <p>🕐 Время: ${new Date(last.created_at).toLocaleString()}</p>
            `;
            
            // Таблица истории
            let tableHtml = '<table border="1" style="width:100%"><tr><th>Время</th><th>°C</th><th>%</th><th>Устройство</th></tr>';
            data.forEach(row => {
                tableHtml += `<tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
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
    }
}

loadData();
setInterval(loadData, 10000);
