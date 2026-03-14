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
            // Фильтруем только записи от MQ135
            const mq135Data = data.filter(row => row.device_id === 'esp32_mq135');
            
            document.getElementById('connectionStatus').textContent = 
                `✅ Найдено: ${mq135Data.length} записей от MQ135`;
            
            if (mq135Data.length > 0) {
                // Последние показания газа
                const last = mq135Data[0];
                
                let gasHtml = '';
                if (last.gas_ppm) {
                    gasHtml += `<p>💨 Газ (PPM): <strong>${last.gas_ppm.toFixed(2)}</strong></p>`;
                }
                if (last.gas_raw) {
                    gasHtml += `<p>📟 Сырой сигнал: <strong>${last.gas_raw}</strong></p>`;
                }
                if (last.device_id) {
                    gasHtml += `<p>🆔 Устройство: <strong>${last.device_id}</strong></p>`;
                }
                if (last.created_at) {
                    gasHtml += `<p>🕐 Время: <strong>${new Date(last.created_at).toLocaleString()}</strong></p>`;
                }
                
                document.getElementById('latestData').innerHTML = gasHtml;
                
                // Таблица истории (только газ)
                let tableHtml = '<table border="1" style="width:100%"><tr><th>Время</th><th>Газ (PPM)</th><th>RAW</th><th>Устройство</th></tr>';
                mq135Data.slice(0, 20).forEach(row => { // последние 20 записей
                    tableHtml += `<tr>
                        <td>${new Date(row.created_at).toLocaleString()}</td>
                        <td>${row.gas_ppm ? row.gas_ppm.toFixed(2) : '—'}</td>
                        <td>${row.gas_raw || '—'}</td>
                        <td>${row.device_id}</td>
                    </tr>`;
                });
                tableHtml += '</table>';
                document.getElementById('historyTable').innerHTML = tableHtml;
            } else {
                document.getElementById('latestData').innerHTML = '<p>⏳ Нет данных от MQ135</p>';
            }
        } else {
            document.getElementById('connectionStatus').textContent = '⚠️ Таблица пуста';
            document.getElementById('latestData').innerHTML = '<p>📭 Нет данных</p>';
        }
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
    }
}

// Загружаем сразу и каждые 5 секунд
loadData();
setInterval(loadData, 5000);
