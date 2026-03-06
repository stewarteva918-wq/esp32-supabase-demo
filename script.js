// ИСПРАВЛЕННАЯ ВЕРСИЯ (под твои названия колонок)
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка...';
        
        // Запрос к Supabase
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        document.getElementById('connectionStatus').textContent = '✅ Статус: ' + response.status;
        
        if (data.length > 0) {
            const latest = data[0];
            // Используем правильные названия колонок
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: <strong>${latest.temperature || 'нет'}°C</strong></p>
                <p>💧 Влажность: <strong>${latest.humidity || 'нет'}%</strong></p>
                <p>🆔 Устройство: <strong>${latest.device_id || 'нет'}</strong></p>
                <p>🕐 Время: <strong>${new Date(latest.created_at).toLocaleString()}</strong></p>
            `;
            
            // Таблица
            let tableHTML = '<table><tr><th>Время</th><th>°C</th><th>%</th><th>Устройство</th></tr>';
            data.forEach(r => {
                tableHTML += `<tr>
                    <td>${new Date(r.created_at).toLocaleString()}</td>
                    <td>${r.temperature || '—'}</td>
                    <td>${r.humidity || '—'}</td>
                    <td>${r.device_id || '—'}</td>
                </tr>`;
            });
            tableHTML += '</table>';
            document.getElementById('historyTable').innerHTML = tableHTML;
        } else {
            document.getElementById('latestData').innerHTML = '<p>📭 Нет данных в таблице</p>';
            document.getElementById('historyTable').innerHTML = '<p>Добавь запись в Supabase через кнопку Insert</p>';
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
    }
}

loadData();
setInterval(loadData, 10000);
