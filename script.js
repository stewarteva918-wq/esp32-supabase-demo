// Конфигурация Supabase (НОВЫЙ ФОРМАТ)
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP'; // твой publishable ключ

// Функция для загрузки данных из Supabase
async function loadData() {
    try {
        // Показываем статус
        document.getElementById('connectionStatus').textContent = 'Загрузка данных...';
        
        // Формируем URL для запроса к Supabase REST API
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=created_at.desc&limit=10`;
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Обновляем статус
        document.getElementById('connectionStatus').textContent = '✅ Подключено к Supabase';
        
        if (data.length === 0) {
            document.getElementById('latestData').innerHTML = '<p>Пока нет данных от ESP32</p>';
            document.getElementById('historyTable').innerHTML = '<p>Нет данных для отображения</p>';
            return;
        }
        
        // Отображаем последние показания
        const latest = data[0];
        document.getElementById('latestData').innerHTML = `
            <p>🌡️ Температура: <strong>${latest.temperature}°C</strong></p>
            <p>💧 Влажность: <strong>${latest.humidity}%</strong></p>
            <p>🆔 Устройство: <strong>${latest.device_id || 'не указано'}</strong></p>
            <p>🕐 Время: <strong>${new Date(latest.created_at).toLocaleString()}</strong></p>
        `;
        
        // Отображаем историю
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Температура (°C)</th>
                        <th>Влажность (%)</th>
                        <th>Устройство</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.forEach(record => {
            tableHTML += `
                <tr>
                    <td>${new Date(record.created_at).toLocaleString()}</td>
                    <td>${record.temperature}</td>
                    <td>${record.humidity}</td>
                    <td>${record.device_id || '—'}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        document.getElementById('historyTable').innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка подключения';
        document.getElementById('latestData').innerHTML = `<p>Ошибка: ${error.message}</p>`;
        document.getElementById('historyTable').innerHTML = `<p>Проверь консоль (F12) для деталей</p>`;
    }
}

// Загружаем данные при открытии страницы
loadData();

// Обновляем данные каждые 10 секунд
setInterval(loadData, 10000);
