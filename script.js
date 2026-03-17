const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Выводим ВСЁ в консоль
        console.log('Всего записей:', data.length);
        console.log('Последние 5 записей:', data.slice(-5));
        
        // Показываем прямо на странице
        document.body.innerHTML = `
            <h1>🔍 Диагностика</h1>
            <p>Всего записей: ${data.length}</p>
            <p>Последняя запись:</p>
            <pre>${JSON.stringify(data[data.length-1], null, 2)}</pre>
            <p>Последние 5 created_at:</p>
            <ul>
                ${data.slice(-5).map(d => `<li>${d.created_at}</li>`).join('')}
            </ul>
        `;
    } catch (error) {
        document.body.innerHTML = `<h1>❌ Ошибка</h1><pre>${error}</pre>`;
    }
}

loadData();
setInterval(loadData, 5000);
