const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

async function loadData() {
    const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Показываем ВСЕ данные в сыром виде
    document.body.innerHTML = `
        <h1>📦 Сырые данные от Supabase</h1>
        <p>Статус: ${response.status}</p>
        <p>Количество записей: ${data.length}</p>
        <p>Данные (первая запись):</p>
        <pre>${JSON.stringify(data[0] || {}, null, 2)}</pre>
        <p>Все данные:</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
}
loadData();
