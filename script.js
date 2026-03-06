// Супер-простой тест с ключом в URL
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        console.log('🔵 Начинаем запрос...');
        
        // Добавляем ключ прямо в URL как параметр
        const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
        console.log('🔵 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🟡 Статус ответа:', response.status);
        
        const data = await response.json();
        console.log('🟢 Данные:', data);
        
        document.getElementById('connectionStatus').textContent = 'Статус: ' + response.status;
        
    } catch (error) {
        console.error('🔴 Ошибка:', error);
        document.getElementById('connectionStatus').textContent = '❌ Ошибка';
    }
}

loadData();
