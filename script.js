// МИНИМАЛЬНЫЙ ТЕСТ
const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_84XA7ovvjzTYM4wzkvdkPg_GTRyWvOP';

async function loadData() {
    try {
        // Простой запрос
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        
        const data = await response.json();
        
        // Выводим данные в консоль
        console.log('Данные из Supabase:', data);
        
        // Показываем на странице
        document.getElementById('connectionStatus').innerHTML = 
            'Статус: ' + response.status + '<br>' +
            'Данные получены: ' + JSON.stringify(data);
        
        document.getElementById('latestData').innerHTML = 
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

loadData();
