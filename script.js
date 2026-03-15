const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let scene, camera, renderer, cube;
let charts = { temp: null, hum: null, pres: null, uv: null, ecg: null, gas: null };
let historyData = { temp: [], hum: [], pres: [], uv: [], ecg: [], gas: [], labels: [] };

window.openTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'mpu3d' && renderer) {
        setTimeout(() => {
            const container = document.getElementById('cube3d');
            if (container) {
                renderer.setSize(container.clientWidth, 400);
                renderer.render(scene, camera);
            }
        }, 100);
    }
}

function init3D() {
    const container = document.getElementById('cube3d');
    if (!container) return;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / 400, 0.1, 1000);
    camera.position.z = 8;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 400);
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Красивый куб с градиентом
    const geometry = new THREE.BoxGeometry(3, 1, 2);
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x00a8ff, emissive: 0x002244 }), // правая
        new THREE.MeshStandardMaterial({ color: 0x0097e6, emissive: 0x002244 }), // левая
        new THREE.MeshStandardMaterial({ color: 0x00a8ff, emissive: 0x002244 }), // верх
        new THREE.MeshStandardMaterial({ color: 0x0097e6, emissive: 0x002244 }), // низ
        new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x002244 }), // перед
        new THREE.MeshStandardMaterial({ color: 0x00b8ff, emissive: 0x002244 })  // зад
    ];
    
    cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    
    // Добавим оси для красоты
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Свет
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    renderer.render(scene, camera);
}

async function loadData() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`);
        const data = await response.json();
        
        // Берем ТОЛЬКО данные от одной платы (последние)
        const espData = data.filter(row => row.device_id === 'esp32_all_sensors');
        if (espData.length === 0) return;
        
        const sortedData = espData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const last = sortedData[sortedData.length - 1];
        const last20 = sortedData.slice(-20);
        
        // Обновляем графики (теперь только от одной платы - скачков нет!)
        historyData.labels = last20.map(row => {
            const d = new Date(row.created_at);
            return `${d.getHours()}:${d.getMinutes()}`;
        });
        
        historyData.temp = last20.map(row => row.temperature || 0);
        historyData.hum = last20.map(row => row.humidity || 0);
        historyData.pres = last20.map(row => row.pressure || 0);
        historyData.uv = last20.map(row => row.uv_index || 0);
        historyData.ecg = last20.map(row => row.ecg_raw || 0);
        
        // Обновляем главную
        document.getElementById('temp').textContent = last.temperature?.toFixed(1) || '—';
        document.getElementById('hum').textContent = last.humidity?.toFixed(1) || '—';
        document.getElementById('pres').textContent = last.pressure?.toFixed(1) || '—';
        document.getElementById('uvRaw').textContent = last.uv_raw || '—';
        document.getElementById('uvIndex').textContent = last.uv_index?.toFixed(1) || '—';
        document.getElementById('ecgRaw').textContent = last.ecg_raw || '—';
        
        // Обновляем 3D
        if (last.gyro_x !== undefined && cube) {
            document.getElementById('gyroX').textContent = last.gyro_x?.toFixed(2) || '—';
            document.getElementById('gyroY').textContent = last.gyro_y?.toFixed(2) || '—';
            document.getElementById('gyroZ').textContent = last.gyro_z?.toFixed(2) || '—';
            document.getElementById('accX').textContent = last.acc_x?.toFixed(2) || '—';
            document.getElementById('accY').textContent = last.acc_y?.toFixed(2) || '—';
            document.getElementById('accZ').textContent = last.acc_z?.toFixed(2) || '—';
            
            cube.rotation.x = last.gyro_y || 0;
            cube.rotation.y = last.gyro_z || 0;
            cube.rotation.z = last.gyro_x || 0;
            renderer.render(scene, camera);
        }
        
        document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        document.getElementById('lastUpdate').innerHTML = `🕐 ${new Date(last.created_at).toLocaleString()}`;
        
        // Обновляем графики
        updateCharts();
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

function updateCharts() {
    // Температура
    const tempCtx = document.getElementById('tempChart')?.getContext('2d');
    if (tempCtx) {
        if (charts.temp) charts.temp.destroy();
        charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.temp,
                    borderColor: '#FF6B6B',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
    
    // Влажность
    const humCtx = document.getElementById('humChart')?.getContext('2d');
    if (humCtx) {
        if (charts.hum) charts.hum.destroy();
        charts.hum = new Chart(humCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.hum,
                    borderColor: '#4ECDC4',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
    
    // Давление
    const presCtx = document.getElementById('presChart')?.getContext('2d');
    if (presCtx) {
        if (charts.pres) charts.pres.destroy();
        charts.pres = new Chart(presCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.pres,
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
    
    // UV
    const uvCtx = document.getElementById('uvChart')?.getContext('2d');
    if (uvCtx) {
        if (charts.uv) charts.uv.destroy();
        charts.uv = new Chart(uvCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.uv,
                    borderColor: '#9B59B6',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
    
    // ЭКГ
    const ecgCtx = document.getElementById('ecgChart')?.getContext('2d');
    if (ecgCtx) {
        if (charts.ecg) charts.ecg.destroy();
        charts.ecg = new Chart(ecgCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.ecg,
                    borderColor: '#2ECC71',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 2,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init3D, 500);
    loadData();
    setInterval(loadData, 30000);
});
