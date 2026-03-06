// ТОЧНЫЙ КОД ПОД ТВОЮ ТАБЛИЦУ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        // Показываем статус загрузки
        document.getElementById('connectionStatus').textContent = '🔄 Загружаем данные...';
        
        // Запрос к Supabase
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Ответ от Supabase:', data);
        
        if (data && data.length > 0) {
            document.getElementById('connectionStatus').textContent = '✅ Найдено записей: ' + data.length;
            
            // Последняя запись
            const last = data[0];
            
            // Формируем HTML для последних показаний
            let latestHtml = '';
            if (last.temperature) latestHtml += `<p>🌡️ Температура: ${last.temperature}°C</p>`;
            if (last.humidity) latestHtml += `<p>💧 Влажность: ${last.humidity}%</p>`;
            if (last.device_id) latestHtml += `<p>🆔 Устройство: ${last.device_id}</p>`;
            if (last.created_at) latestHtml += `<p>🕐 Время: ${new Date(last.created_at).toLocaleString()}</p>`;
            
            document.getElementById('latestData').innerHTML = latestHtml;
            
            // Таблица истории
            let tableHtml = '<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Время</th><th>Температура</th><th>Влажность</th><th>Устройство</th></tr>';
            
            data.forEach(row => {
                tableHtml += '<tr>';
                tableHtml += `<td>${row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>`;
                tableHtml += `<td>${row.temperature || '-'}</td>`;
                tableHtml += `<td>${row.humidity || '-'}</td>`;
                tableHtml += `<td>${row.device_id || '-'}</td>`;
                tableHtml += '</tr>';
            });
            
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
            
        } else {
            document.getElementById('connectionStatus').textContent = '⚠️ Таблица пуста';
            document.getElementById('latestData').innerHTML = '<p>📭 Нет данных. Добавь запись в Supabase!</p>';
            document.getElementById('historyTable').innerHTML = '<p>Нажми Insert в таблице sensor_readings и добавь тестовые данные</p>';
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка подключения';
        document.getElementById('latestData').innerHTML = `<p>Ошибка: ${error.message}</p>`;
    }
}

// Загружаем сразу
loadData();

// Обновляем каждые 10 секунд
setInterval(loadData, 10000);
