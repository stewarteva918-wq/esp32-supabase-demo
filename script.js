const SUPABASE_URL = 'https://xqawbkilonphmhikawqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxYXdia2lsb25waG1oaWthd3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTk2ODEsImV4cCI6MjA4ODEzNTY4MX0.IPLfnbuEA6PCK6y79NHKnbRpoBzMiNAA7BVWveQDM6o';

let charts = {
    temp: null, hum: null, pres: null,
    uv: null, ecg: null, gas: null
};

let historyData = {
    temp: [], hum: [], pres: [],
    uv: [], ecg: [],
    gas: [], labels: []
};

// 3D переменные
let scene, camera, renderer, cube;
let gyroX = 0, gyroY = 0, gyroZ = 0;

window.openTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Перерисовываем 3D при переключении на вкладку
    if (tabName === 'mpu3d' && cube && renderer) {
        setTimeout(() => {
            renderer.setSize(document.getElementById('cube3d').clientWidth, 400);
            renderer.render(scene, camera);
        }, 100);
    }
}

// Инициализация 3D
function init3D() {
    const container = document.getElementById('cube3d');
    if (!container) return;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / 400, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, 400);
    container.appendChild(renderer.domElement);
    
    // Создаем куб в форме MPU6050
    const geometry = new THREE.BoxGeometry(5, 1, 4);
    const materials = [
        new THREE.MeshBasicMaterial({ color: 0x03045e }), // правая
        new THREE.MeshBasicMaterial({ color: 0x023e8a }), // левая
        new THREE.MeshBasicMaterial({ color: 0x0077b6 }), // верх
        new THREE.MeshBasicMaterial({ color: 0x03045e }), // низ
        new THREE.MeshBasicMaterial({ color: 0x023e8a }), // перед
        new THREE.MeshBasicMaterial({ color: 0x0077b6 })  // зад
    ];
    
    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    camera.position.z = 10;
    
    renderer.render(scene, camera);
    
    // Обработка ресайза
    window.addEventListener('resize', () => {
        if (document.getElementById('mpu3d').classList.contains('active')) {
            camera.aspect = container.clientWidth / 400;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, 400);
            renderer.render(scene, camera);
        }
    });
}

async function loadData() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/sensor_readings?select=*&apikey=${SUPABASE_KEY}`
        );
        const data = await response.json();
        
        // Сортируем по времени
        const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const last20 = sortedData.slice(-20);
        
        // Обновляем историю для графиков
        historyData.labels = last20.map(row => {
            const d = new Date(row.created_at);
            return `${d.getHours()}:${d.getMinutes()}`;
        });
        
        historyData.temp = last20.map(row => row.temperature || 0);
        historyData.hum = last20.map(row => row.humidity || 0);
        historyData.pres = last20.map(row => row.pressure || 0);
        historyData.uv = last20.map(row => row.uv_index || 0);
        historyData.ecg = last20.map(row => row.ecg_raw || 0);
        historyData.gas = last20.map(row => row.gas_raw ? Math.round(row.gas_raw * (3.3 / 4095) * 100) : 0);
        
        // Последние данные
        const last = sortedData[sortedData.length - 1] || {};
        
        // Обновляем значения на странице
        document.getElementById('temp').textContent = last.temperature?.toFixed(1) || '—';
        document.getElementById('hum').textContent = last.humidity?.toFixed(1) || '—';
        document.getElementById('pres').textContent = last.pressure?.toFixed(1) || '—';
        
        // MPU6050 данные для 3D
        if (last.acc_x) {
            document.getElementById('accX').textContent = last.acc_x?.toFixed(2) || '—';
            document.getElementById('accY').textContent = last.acc_y?.toFixed(2) || '—';
            document.getElementById('accZ').textContent = last.acc_z?.toFixed(2) || '—';
            
            // Обновляем 3D куб (используем гироскоп если есть, иначе акселерометр)
            if (last.gyro_x) {
                gyroX = last.gyro_x;
                gyroY = last.gyro_y;
                gyroZ = last.gyro_z;
                
                document.getElementById('gyroX').textContent = gyroX?.toFixed(2) || '—';
                document.getElementById('gyroY').textContent = gyroY?.toFixed(2) || '—';
                document.getElementById('gyroZ').textContent = gyroZ?.toFixed(2) || '—';
            } else {
                // Если нет гироскопа, используем акселерометр
                gyroX = last.acc_x / 10;
                gyroY = last.acc_y / 10;
                gyroZ = last.acc_z / 10;
                
                document.getElementById('gyroX').textContent = gyroX?.toFixed(2) || '—';
                document.getElementById('gyroY').textContent = gyroY?.toFixed(2) || '—';
                document.getElementById('gyroZ').textContent = gyroZ?.toFixed(2) || '—';
            }
            
            if (cube) {
                cube.rotation.x = gyroY;
                cube.rotation.y = gyroZ;
                cube.rotation.z = gyroX;
                renderer.render(scene, camera);
            }
        }
        
        document.getElementById('uvRaw').textContent = last.uv_raw || '—';
        document.getElementById('uvIndex').textContent = last.uv_index?.toFixed(1) || '—';
        
        document.getElementById('ecgRaw').textContent = last.ecg_raw || '—';
        
        if (last.gas_raw) {
            document.getElementById('gasRaw').textContent = last.gas_raw;
            const ppm = Math.round(last.gas_raw * (3.3 / 4095) * 100);
            document.getElementById('gasPPM').textContent = ppm;
        }
        
        document.getElementById('deviceInfo').innerHTML = `🆔 ${last.device_id || '—'}`;
        document.getElementById('lastUpdate').innerHTML = `🕐 ${last.created_at ? new Date(last.created_at).toLocaleString() : '—'}`;
        document.getElementById('connectionStatus').innerHTML = '✅ Онлайн';
        
        // Обновляем все графики
        updateAllCharts();
        
        // Обновляем историю
        updateHistory(sortedData.slice(-50).reverse());
        
        // Статистика
        const count = data.length;
        document.getElementById('stats').innerHTML = `
            Всего записей: ${count}<br>
            Последнее обновление: ${last.created_at ? new Date(last.created_at).toLocaleString() : '—'}<br>
            Устройств: ${new Set(data.map(d => d.device_id)).size}
        `;
        
    } catch (error) {
        console.log(error);
        document.getElementById('connectionStatus').innerHTML = '❌ Ошибка';
    }
}

function updateAllCharts() {
    // График температуры
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
                    pointRadius: 1,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // График влажности
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
                    pointRadius: 1,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // График давления
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
                    pointRadius: 1,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // График UV
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
                    pointRadius: 1,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // График ЭКГ
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
                    pointRadius: 1,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    }

    // График газа
    const gasCtx = document.getElementById('gasChart')?.getContext('2d');
    if (gasCtx) {
        if (charts.gas) charts.gas.destroy();
        charts.gas = new Chart(gasCtx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    data: historyData.gas,
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0,122,255,0.1)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 2
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

function updateHistory(data) {
    let tableHtml = `
        <table>
            <tr>
                <th>Время</th>
                <th>Темп</th>
                <th>Влаж</th>
                <th>Давл</th>
                <th>UV</th>
                <th>ЭКГ</th>
                <th>Газ RAW</th>
                <th>Газ PPM</th>
            </tr>
    `;
    
    data.slice(0, 30).forEach(row => {
        let gasPPM = '—';
        if (row.gas_raw && row.gas_raw > 100) {
            gasPPM = Math.round(row.gas_raw * (3.3 / 4095) * 100);
        }
        
        tableHtml += `<tr>
            <td>${new Date(row.created_at).toLocaleString()}</td>
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

// Инициализация 3D после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        init3D();
    }, 500);
});

// Обработчики кнопок сброса
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('reset-btn')) {
        const id = e.target.id;
        fetch(`/${id}`)
            .then(() => console.log(`Reset ${id}`))
            .catch(err => console.log(err));
    }
});

// Запуск
loadData();
setInterval(loadData, 30000);
