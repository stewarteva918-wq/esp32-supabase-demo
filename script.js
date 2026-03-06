// МАКСИМАЛЬНО ПРОСТОЙ ТЕСТ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        console.log('1. Начинаем запрос...');
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        
        console.log('2. Статус ответа:', response.status);
        
        const data = await response.json();
        console.log('3. Данные:', data);
        
        // Обновляем статус на странице
        document.getElementById('connectionStatus').textContent = 'Статус: ' + response.status;
        
    } catch (error) {
        console.error('4. ОШИБКА:', error);
    }
}

// Запускаем при загрузке
loadData();
