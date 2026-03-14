const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Берем только записи от MQ135 с газом
        const gasData = data.filter(row => 
            row.device_id === 'esp32_mq135' && row.gas_raw != null
        );
        
        if (gasData.length > 0) {
            document.getElementById('connectionStatus').innerHTML = 
                `✅ Найдено: ${gasData.length} записей с газом`;
            
            // Последние показания
            const last = gasData[0];
            document.getElementById('latestData').innerHTML = `
                <p>💨 Газ (RAW): <strong>${last.gas_raw}</strong></p>
                <p>🆔 Устройство: <strong>${last.device_id}</strong></p>
                <p>🕐 Время: <strong>${new Date(last.created_at).toLocaleString()}</strong></p>
            `;
            
            // Таблица истории
            let tableHtml = '<table border="1"><tr><th>Время</th><th>Газ (RAW)</th></tr>';
            gasData.slice(0, 20).forEach(row => {
                tableHtml += `<tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td>${row.gas_raw}</td>
                </tr>`;
            });
            tableHtml += '</table>';
            document.getElementById('historyTable').innerHTML = tableHtml;
        }
    } catch (error) {
        console.log(error);
    }
}

loadData();
setInterval(loadData, 5000);
