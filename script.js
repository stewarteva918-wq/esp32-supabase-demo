// ДИАГНОСТИКА - показать все таблицы
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        let output = '<h1>🔍 Диагностика Supabase</h1>';
        
        // Пробуем получить список таблиц
        const tables = ['sensor_readings', 'Sensor_readings', 'sensor_reading'];
        
        for (const table of tables) {
            output += `<h2>Пробуем таблицу: ${table}</h2>`;
            
            const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&apikey=${SUPABASE_KEY}`;
            output += `<p>URL: ${url}</p>`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                output += `<p>Статус: ${response.status}</p>`;
                output += `<p>Количество записей: ${data.length}</p>`;
                output += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } catch (e) {
                output += `<p style="color:red">Ошибка: ${e.message}</p>`;
            }
        }
        
        document.body.innerHTML = output;
        
    } catch (error) {
        document.body.innerHTML = `<h1>❌ Ошибка</h1><pre>${error}</pre>`;
    }
}

loadData();
