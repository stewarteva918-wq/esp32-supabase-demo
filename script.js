// СУПЕР-ПРОСТОЙ ТЕСТ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        // Простой запрос
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        
        const data = await response.json();
        
        // ПОЛНОСТЬЮ ПЕРЕЗАПИСЫВАЕМ страницу своими руками
        document.body.innerHTML = `
            <h1>📊 Тестовый вывод</h1>
            <p>Статус ответа: ${response.status}</p>
            <p>Количество записей: ${data.length}</p>
            <p>Данные:</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
        
    } catch (error) {
        document.body.innerHTML = `<h1>❌ Ошибка</h1><pre>${error}</pre>`;
    }
}

loadData();
