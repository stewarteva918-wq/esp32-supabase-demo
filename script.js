// РАБОЧАЯ ВЕРСИЯ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        console.log('🔵 Начинаем запрос...');
        
        // Формируем запрос
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_readings?select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🟡 Статус ответа:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔴 Ошибка ответа:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('🟢 Полученные данные:', data);
        
        // Обновляем статус
        document.getElementById('connectionStatus').textContent = '✅ Подключено к Supabase';
        
        // Показываем данные
        if (data.length > 0) {
            const latest = data[0];
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: <strong>${latest.temperature}°C</strong></p>
                <p>💧 Влажность: <strong>${latest.humidity}%</strong></p>
                <p>🆔 Устройство: <strong>${latest.device_id}</strong></p>
                <p>🕐 Время: <strong>${new Date(latest.created_at).toLocaleString()}</strong></p>
            `;
            
            // Таблица истории
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
            document.getElementById('latestData').innerHTML = '<p>Нет данных в таблице</p>';
            document.getElementById('historyTable').innerHTML = '<p>Добавь тестовую запись в Supabase</p>';
        }
        
    } catch (error) {
        console.error('🔴 Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка подключения';
        document.getElementById('latestData').innerHTML = `<p>Ошибка: ${error.message}</p>`;
    }
}

// Запускаем сразу и каждые 10 секунд
loadData();
setInterval(loadData, 10000);
