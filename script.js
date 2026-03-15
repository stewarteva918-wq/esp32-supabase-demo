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
    
    // Перерисовываем 3D при открытии вкладки
    if (tabName === 'mpu3d' && renderer && scene && camera) {
        setTimeout(() => {
            const container = document.getElementById('cube3d');
            if (container && container.clientWidth > 0) {
                renderer.setSize(container.clientWidth, 400);
                renderer.render(scene, camera);
            }
        }, 200);
    }
}

function init3D() {
    console.log('🎮 Инициализация 3D...');
    const container = document.getElementById('cube3d');
    if (!container) {
        console.log('❌ Контейнер cube3d не найден');
        return;
    }
    
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / 400, 0.1, 1000);
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, 400);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(window.devicePixelRatio);
        
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        
        // Красивый куб
        const geometry = new THREE.BoxGeometry(3, 1, 2);
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0x330000 }), // правая
            new THREE.MeshStandardMaterial({ color: 0x4ecdc4, emissive: 0x003333 }), // левая
            new THREE.MeshStandardMaterial({ color: 0x45b7d1, emissive: 0x003344 }), // верх
            new THREE.MeshStandardMaterial({ color: 0x96ceb4, emissive: 0x003322 }), // низ
            new THREE.MeshStandardMaterial({ color: 0xffcc5c, emissive: 0x332200 }), // перед
            new THREE.MeshStandardMaterial({ color: 0xff6f69, emissive: 0x330000 })  // зад
        ];
        
        cube = new THREE.Mesh(geometry, materials);
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
        
        // Добавим оси для наглядности
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        
        // Освещение
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 10, 7);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404060);
        scene.add(ambientLight);
        
        // Пол
        const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
        scene.add(gridHelper);
        
        renderer.render(scene, camera);
        console.log('✅ 3D инициализирован');
        
    } catch (e) {
        console.log('❌ Ошибка 3D:', e);
    }
}

async function loadData() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`);
        const data = await response.json();
        
        // Разделяем данные по устройствам
        const allSensorsData = data.filter(row => row.device_id === 'esp32_all_sensors')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const gasData = data.filter(row => row.device_id === 'esp32_mq135' || row.gas_raw > 100)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        if (allSensorsData.length > 0) {
            const last = allSensorsData[allSensorsData.length - 1];
            const last20 = allSensorsData.slice(-20);
            
            // Обновляем графики
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
            
            // Обновляем 3D (данные MPU6050)
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
                
                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
            }
            
            document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
            document.getElementById('lastUpdate').innerHTML = `🕐 ${new Date(last.created_at).toLocaleString()}`;
            
            updateCharts();
        }
        
        // Обновляем газ (отдельная плата)
        if (gasData.length > 0) {
            const lastGas = gasData[gasData.length - 1];
            const gasHistory = gasData.slice(-20);
            
            document.getElementById('gasRaw').textContent = lastGas.gas_raw || '—';
            if (lastGas.gas_raw) {
                const ppm = Math.round(lastGas.gas_raw * (3.3 / 4095) * 100);
                document.getElementById('gasPPM').textContent = ppm;
            }
            
            // График газа
            const gasLabels = gasHistory.map(row => {
                const d = new Date(row.created_at);
                return `${d.getHours()}:${d.getMinutes()}`;
            });
            const gasValues = gasHistory.map(row => 
                row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : 0
            );
            
            const gasCtx = document.getElementById('gasChart')?.getContext('2d');
            if (gasCtx) {
                if (charts.gas) charts.gas.destroy();
                charts.gas = new Chart(gasCtx, {
                    type: 'line',
                    data: {
                        labels: gasLabels,
                        datasets: [{
                            data: gasValues,
                            borderColor: '#007AFF',
                            backgroundColor: 'rgba(0,122,255,0.1)',
                            borderWidth: 2,
                            fill: true,
                            pointRadius: 2,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }
        
        // Обновляем историю
        updateHistory(data);
        
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

function updateHistory(data) {
    const allData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    let tableHtml = `
        <table>
            <tr>
                <th>Время</th>
                <th>Устройство</th>
                <th>Темп</th>
                <th>Влаж</th>
                <th>Давл</th>
                <th>UV</th>
                <th>ЭКГ</th>
                <th>Газ RAW</th>
                <th>Газ PPM</th>
            </tr>
    `;
    
    allData.slice(0, 30).forEach(row => {
        const deviceType = row.device_id === 'esp32_all_sensors' ? '📊 Все' : '💨 Газ';
        const bgColor = row.device_id === 'esp32_all_sensors' ? '#f0f7ff' : '#fff5e6';
        
        let gasPPM = '—';
        if (row.gas_raw && row.gas_raw > 100) {
            gasPPM = Math.round(row.gas_raw * (3.3 / 4095) * 100);
        }
        
        tableHtml += `<tr style="background: ${bgColor}">
            <td>${new Date(row.created_at).toLocaleString()}</td>
            <td><strong>${deviceType}</strong></td>
            <td>${row.temperature?.toFixed(1) || '—'}</td>
            <td>${row.humidity?.toFixed(1) || '—'}</td>
            <td>${row.pressure?.toFixed(1) || '—'}</td>
            <td>${row.uv_index?.toFixed(1) || '—'}</td>
            <td>${row.ecg_raw || '—'}</td>
            <td>${row.gas_raw || '—'}</td>
            <td>${gasPPM}</td>
        </tr>`;
    });
    tableHtml += '</table>';
    
    document.getElementById('historyTable').innerHTML = tableHtml;
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск...');
    setTimeout(init3D, 1000);
    loadData();
    setInterval(loadData, 30000);
});

// Кнопки сброса
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('reset-btn')) {
        const id = e.target.id;
        fetch(`/${id}`).catch(err => console.log(err));
    }
});
