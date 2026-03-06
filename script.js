const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*`;
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        const data = await response.json();
        console.log('Данные из Supabase:', data); // ПОСМОТРИ В КОНСОЛИ!
        
        if (data.length > 0) {
            document.getElementById('connectionStatus').textContent = '✅ Данные получены!';
            document.getElementById('latestData').innerHTML = 
                `<p>Найдено записей: ${data.length}</p>` +
                `<p>Первая: ${data[0].temperature}°C, ${data[0].humidity}%</p>`;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

loadData();
