// ФИНАЛЬНАЯ ВЕРСИЯ - ВСЁ РАБОТАЕТ!
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        // Показываем статус загрузки
        document.getElementById('connectionStatus').textContent = '⏳ Загрузка данных...';
        
        // Запрос к Supabase (ключ в URL)
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Обновляем статус
        document.getElementById('connectionStatus').textContent = '✅ Статус: ' + response.status;
        
        // Проверяем, есть ли данные
        if (data.length > 0) {
            // Последние показания (первая запись)
            const latest = data[0];
            document.getElementById('latestData').innerHTML = `
                <p>🌡️ Температура: <strong>${latest.temperature}°C</strong></p>
                <p>💧 Влажность: <strong>${latest.humidity}%</strong></p>
                <p>🆔 Устройство: <strong>${latest.device_id}</strong></p>
                <p>🕐 Время: <strong>${new Date(latest.created_at).toLocaleString()}</strong></p>
            `;
            
            // История измерений (таблица)
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
                        <td>${record.device_id}</td>
                    </tr>
                `;
            });
            
            tableHTML += '</tbody></table>';
            document.getElementById('historyTable').innerHTML = tableHTML;
            
        } else {
            // Если данных нет
            document.getElementById('latestData').innerHTML = '<p>📭 В таблице нет данных. Добавь запись в Supabase!</p>';
            document.getElementById('historyTable').innerHTML = '<p>Добавь тестовую запись через кнопку "Insert" в Supabase</p>';
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка подключения';
        document.getElementById('latestData').innerHTML = `<p>Ошибка: ${error.message}</p>`;
    }
}

// Загружаем сразу и обновляем каждые 10 секунд
loadData();
setInterval(loadData, 10000);
