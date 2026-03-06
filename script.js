// ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка...';
        
        // Ключ в URL работает!
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        document.getElementById('connectionStatus').textContent = '✅ Подключено к Supabase';
        
        if (data.length > 0) {
            const latest = data[0];
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: <strong>${latest.temperature}°C</strong></p>
                <p>💧 Влажность: <strong>${latest.humidity}%</strong></p>
                <p>🆔 Устройство: <strong>${latest.device_id}</strong></p>
                <p>🕐 Время: <strong>${new Date(latest.created_at).toLocaleString()}</strong></p>
            `;
            
            let tableHTML = '<table><tr><th>Время</th><th>°C</th><th>%</th><th>Устройство</th></tr>';
            data.forEach(r => {
                tableHTML += `<tr>
                    <td>${new Date(r.created_at).toLocaleString()}</td>
                    <td>${r.temperature}</td>
                    <td>${r.humidity}</td>
                    <td>${r.device_id}</td>
                </tr>`;
            });
            tableHTML += '</table>';
            document.getElementById('historyTable').innerHTML = tableHTML;
        } else {
            document.getElementById('latestData').innerHTML = '<p>📭 Нет данных. Добавь запись в Supabase!</p>';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
    }
}

loadData();
setInterval(loadData, 10000);
