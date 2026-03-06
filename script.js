// ДИАГНОСТИЧЕСКИЙ КОД
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        // Пробуем разные варианты названия таблицы
        const possibleTables = [
            'sensor_readings',
            'sensor_reading',
            'Sensor_readings',
            'sensorreadings'
        ];
        
        let result = '';
        
        for (const tableName of possibleTables) {
            const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&apikey=${SUPABASE_KEY}`;
            result += `\n\n🔍 Пробуем таблицу: ${tableName}\n`;
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                result += `Статус: ${response.status}\n`;
                result += `Данные: ${JSON.stringify(data, null, 2)}`;
            } catch (e) {
                result += `Ошибка: ${e.message}`;
            }
        }
        
        // Выводим всё на страницу
        document.body.innerHTML = `<pre>${result}</pre>`;
        
    } catch (error) {
        document.body.innerHTML = `<h1>❌ Ошибка</h1><pre>${error}</pre>`;
    }
}

loadData();
