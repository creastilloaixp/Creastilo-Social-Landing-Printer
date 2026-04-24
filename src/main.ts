import './style.css'
import Globe from 'globe.gl'

// --- SCROLL SEQUENCE ENGINE ---
class ScrollSequencer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    frameCount: number = 40;
    images: HTMLImageElement[] = [];
    currentFrameIndex: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.resize();
        this.preload();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('scroll', () => this.onScroll());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render(this.currentFrameIndex);
    }

    preload() {
        console.log("[SEQUENCER] Preloading 60 AI Cinematic Frames...");
        for (let i = 1; i <= this.frameCount; i++) {
            const img = new Image();
            img.src = `/frames/creastilo_${i}.jpg`; 
            this.images.push(img);
        }
    }

    onScroll() {
        const scrollTop = window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollFraction = scrollTop / maxScroll;
        const frameIndex = Math.min(
            this.frameCount - 1,
            Math.floor(scrollFraction * this.frameCount)
        );

        if (frameIndex !== this.currentFrameIndex) {
            this.currentFrameIndex = frameIndex;
            requestAnimationFrame(() => this.render(frameIndex));
        }
    }

    render(index: number) {
        if (this.images[index]) {
            const img = this.images[index];
            // Simple Cover logic
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Start Sequence
    new ScrollSequencer('scroll-canvas');

    const viewportContent = document.getElementById('viewport-content');
    const terminalLogs = document.getElementById('terminal-logs');
    const buttons = document.querySelectorAll('.control-btn');
    const copilotBtn = document.getElementById('activate-copilot');

    // UI Content for different agency verticals
    const modules: Record<string, string> = {
        vision: `
            <div class="vision-scan-ui">
                <div class="scan-frame"></div>
                <div class="scan-data" style="position: absolute; top: 10%; right: 10%; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.8); padding: 1.5rem;">
                    <div style="font-size: 0.6rem; opacity: 0.4; margin-bottom: 0.5rem;">/ OBJECT_RECOGNITION</div>
                    <div class="data-row"><span>TAG:</span> <span style="color:var(--accent)">PENTHOUSE_UNIT</span></div>
                    <div class="data-row"><span>PROB:</span> <span>99.4%</span></div>
                    <div class="data-row"><span>LUX_LVL:</span> <span style="color:#ffcc00">S_TIER</span></div>
                </div>
                <div class="scan-label" style="position: absolute; left: 50%; bottom: 10%; transform: translateX(-50%); font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent);">
                    [ ATIA_VISION: SCANNING_ACTIVE ]
                </div>
            </div>
        `,
        voice: `
            <div class="waves-container" style="display:flex; flex-direction:column; gap:20px; align-items:center; justify-content:center; height:100%;">
                <div style="display:flex; gap:8px; height: 100px; align-items: center;">
                    ${Array.from({ length: 30 }).map((_, i) => `<div class="wave-bar" style="width:4px; height:${20 + Math.random() * 60}%; background:#ff0055; animation: wave 1.2s ${i * 0.05}s infinite ease-in-out;"></div>`).join('')}
                </div>
                <div class="voice-hud" style="text-align:center; font-family:'JetBrains Mono'; border: 1px solid rgba(255,0,85,0.3); padding: 1rem; width: 250px;">
                    <div style="font-size:0.6rem; opacity:0.5;">ZADARMA_NEXUS_BRIDGE</div>
                    <div style="font-size:1.2rem; color:#ff0055; margin: 5px 0;">CONNECTED</div>
                    <div style="font-size:0.6rem;">LATENCY: 12ms</div>
                </div>
            </div>
            <style>
                @keyframes wave { 0%, 100% { height: 20%; transform: scaleY(1); } 50% { height: 100%; transform: scaleY(1.5); } }
            </style>
        `,
        capture: `
            <div class="dashboard-preview">
                <div class="db-chart">
                    <div class="muted-text">/ FUNNEL_PERFORMANCE_ANALYTICS</div>
                    <div style="height: 150px; display: flex; align-items: flex-end; gap: 5px; margin-top: 2rem;">
                        <div style="flex:1; background: var(--primary); height: 30%; opacity: 0.3;"></div>
                        <div style="flex:1; background: var(--primary); height: 50%; opacity: 0.5;"></div>
                        <div style="flex:1; background: var(--primary); height: 80%; opacity: 0.8;"></div>
                        <div style="flex:1; background: var(--primary); height: 45%; opacity: 0.4;"></div>
                        <div style="flex:1; background: var(--primary); height: 95%;"></div>
                    </div>
                </div>
                <div class="db-sidebar">
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">CONVERSIÓN</div>
                        <div style="font-size: 1.2rem; color: var(--primary);">24.8%</div>
                    </div>
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">ROAS_AVG</div>
                        <div style="font-size: 1.2rem; color: var(--primary);">8.4x</div>
                    </div>
                </div>
            </div>
            <div style="padding: 0 1.5rem 1.5rem;">
                <p style="font-size: 0.8rem; opacity: 0.7;">Captura de leads de alta intención. No usamos formularios genéricos; creamos experiencias de calificación profunda integradas con tu ecosistema.</p>
            </div>
        `,
        avatar: `
            <div class="dashboard-preview">
                <div class="db-chart" style="display: flex; justify-content: center; align-items: center;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid var(--primary); display: flex; justify-content: center; align-items: center; background: rgba(226,176,94,0.1);">
                        <span style="font-size: 2rem;">👤</span>
                    </div>
                </div>
                <div class="db-sidebar">
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">ADN_DIGITAL</div>
                        <div style="font-size: 0.8rem;">98.2%_MATCH</div>
                    </div>
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">SKILLS_SYNC</div>
                        <div style="font-size: 0.8rem;">ACTIVO</div>
                    </div>
                </div>
            </div>
            <div style="padding: 0 1.5rem 1.5rem;">
                <p style="font-size: 0.8rem; opacity: 0.7;">Síntesis de identidad para fundadores y marcas. Clonamos tu voz, tu visión y tu expertise para que puedas estar presente en todas partes sin ocupar tu tiempo.</p>
            </div>
        `,
        governance: `
            <div class="governance-container" style="width: 100%; height: 100%; position: relative; overflow: hidden; background: #000;">
                <div id="globe-viz" style="width: 100%; height: 100%;"></div>
                <div class="gov-overlay" style="position: absolute; top: 1.5rem; left: 1.5rem; pointer-events: none; z-index: 10;">
                    <div class="muted-text">/ GLOBAL_GOVERNANCE_PROTOCOL</div>
                    <h3 style="color: var(--accent); margin: 0.5rem 0;">INTELIGENCIA_GEOESPACIAL</h3>
                    <div class="status-badge" style="display:inline-block; padding: 2px 8px; border: 1px solid var(--accent); font-size: 0.6rem; color: var(--accent);">SAT_LINK: ESTABLE</div>
                </div>
                <div class="gov-legend" style="position: absolute; bottom: 1.5rem; right: 1.5rem; text-align: right; pointer-events: none; z-index: 10; font-family: 'JetBrains Mono'; font-size: 0.6rem; color: var(--accent); opacity: 0.7;">
                    <div>LATENCY: 14ms</div>
                    <div>ENCRYPTION: AES-512</div>
                </div>
            </div>
        `,
        harvester: `
            <div class="harvester-ui" style="padding: 2rem; display: flex; flex-direction: column; height: 100%;">
                <div class="muted-text">/ RECOLECCIÓN_DE_INTELIGENCIA / BANCO_DE_DATOS</div>
                <div class="target-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 1.5rem 0;">
                    <div style="border: 1px solid rgba(255,255,255,0.1); padding: 10px; font-size: 0.6rem;">FUENTE_01: ZILLOW_SCRAPER</div>
                    <div style="border: 1px solid rgba(255,255,255,0.1); padding: 10px; font-size: 0.6rem;">FUENTE_02: IDEALISTA_API</div>
                </div>
                <div id="data-stream-inner" style="flex-grow: 1; overflow: hidden; background: rgba(0,0,0,0.4); border: 1px dashed rgba(255,255,255,0.1); padding: 1rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; font-family: 'JetBrains Mono'; font-size: 0.5rem; color: var(--accent);">
                    <!-- Inyección de datos en tiempo real -->
                </div>
                <div style="margin-top: 1rem; text-align: right; color: #ff0055; font-size: 0.6rem; letter-spacing: 2px;">ESTADO: RECOLECTANDO_GEMAS_V4</div>
            </div>
        `,
        agents: `
            <div class="module-view" style="padding: 2rem;">
                <div class="muted-text">/ INGENIERÍA_DE_AGENTES / SKILLS_PERSONALIZADOS</div>
                <div style="margin: 2rem 0;">
                    <ul style="list-style: none; padding: 0; font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent);">
                        <li style="margin-bottom: 0.5rem;">[✔] MEMORIA_A_LARGO_PLAZO: ACTIVADA</li>
            <div class="dashboard-preview">
                <div class="db-chart">
                    <div class="muted-text">/ AUTONOMOUS_AGENT_SKILLS</div>
                    <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.6rem;">
                            <span>VENTAS_DIRECTAS</span>
                            <span style="color: var(--primary);">92%</span>
                        </div>
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1);"><div style="width: 92%; height: 100%; background: var(--primary);"></div></div>
                        
                        <div style="display: flex; justify-content: space-between; font-size: 0.6rem;">
                            <span>SOPORTE_TÉCNICO</span>
                            <span style="color: var(--primary);">88%</span>
                        </div>
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1);"><div style="width: 88%; height: 100%; background: var(--primary);"></div></div>
                    </div>
                </div>
                <div class="db-sidebar">
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">AGENTES_ACTIVOS</div>
                        <div style="font-size: 1.2rem; color: var(--primary);">14</div>
                    </div>
                </div>
            </div>
            <div style="padding: 0 1.5rem 1.5rem;">
                <p style="font-size: 0.8rem; opacity: 0.7;">Desplegamos agentes que piensan y actúan. Desde el cierre de ventas hasta el soporte post-venta, tus agentes operan con autonomía total bajo tu identidad.</p>
            </div>
        `,
        software: `
            <div class="dashboard-preview">
                <div class="db-chart">
                    <div class="muted-text">/ BESPOKE_INFRASTRUCTURE_SCHEMA</div>
                    <div style="margin-top: 2rem; display: flex; justify-content: space-around; align-items: center;">
                        <div style="width: 40px; height: 40px; border: 1px dashed var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.5rem;">DB</div>
                        <div style="width: 40px; height: 1px; background: var(--primary); opacity: 0.3;"></div>
                        <div style="width: 40px; height: 40px; border: 1px solid var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.5rem; background: rgba(226,176,94,0.2);">CORE</div>
                        <div style="width: 40px; height: 1px; background: var(--primary); opacity: 0.3;"></div>
                        <div style="width: 40px; height: 40px; border: 1px dashed var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.5rem;">UI</div>
                    </div>
                </div>
                <div class="db-sidebar">
                    <div class="db-stat">
                        <div style="font-size: 0.6rem; opacity: 0.5;">UPTIME</div>
                        <div style="font-size: 1rem; color: #0f0;">99.99%</div>
                    </div>
                </div>
            </div>
            <div style="padding: 0 1.5rem 1.5rem;">
                <p style="font-size: 0.8rem; opacity: 0.7;">Eres dueño de tu tecnología. Construimos software escalable y robusto que te libera de las limitaciones y costos por usuario de las plataformas SaaS genéricas.</p>
            </div>
        `
    };

    function initGlobe(targetId: string = 'narrative-globe') {
        const globeContainer = document.getElementById(targetId);
        if (!globeContainer) return;

        // Limpiar cargador si existe
        const loader = globeContainer.querySelector('.globe-loader');
        if (loader) loader.remove();

        // @ts-ignore
        const myGlobe = Globe()(globeContainer)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('#00000000')
            .showAtmosphere(true)
            .atmosphereColor('#E2B05E')
            .atmosphereAltitude(0.2);

        // Arcos de ejemplo (Rutas Logísticas Doradas)
        const arcsData = [
            { startLat: 24.8049, startLng: -107.3938, endLat: 40.7128, endLng: -74.0060, color: ['#E2B05E', '#FFD700'] },
            { startLat: 24.8049, startLng: -107.3938, endLat: 19.4326, endLng: -99.1332, color: ['#E2B05E', '#FFD700'] },
            { startLat: 24.8049, startLng: -107.3938, endLat: 51.5074, endLng: -0.1278, color: ['#E2B05E', '#FFD700'] },
            { startLat: 24.8049, startLng: -107.3938, endLat: -33.8688, endLng: 151.2093, color: ['#E2B05E', '#FFD700'] }
        ];

        myGlobe.arcsData(arcsData)
            .arcColor('color')
            .arcDashLength(0.4)
            .arcDashGap(4)
            .arcDashAnimateTime(2000)
            .arcStroke(0.6);

        myGlobe.controls().autoRotate = true;
        myGlobe.controls().autoRotateSpeed = 0.8;
        myGlobe.controls().enableZoom = false;

        // Focar en un punto estratégico
        myGlobe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 });
        
        // Resize handler para el globo
        window.addEventListener('resize', () => {
            myGlobe.width(globeContainer.clientWidth);
            myGlobe.height(globeContainer.clientHeight);
        });
    }

    // Ya no necesitamos waitForGlobe si el import es exitoso

    function addLog(msg: string, type: 'info' | 'warn' | 'success' = 'info') {
        if (!terminalLogs) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        if (type === 'success') entry.style.color = '#00ff88';
        if (type === 'warn') entry.style.color = '#ffcc00';
        entry.textContent = `/ ${msg}`;
        terminalLogs.prepend(entry);
        if (terminalLogs.childElementCount > 10) {
            terminalLogs.lastElementChild?.remove();
        }
    }

    // Data stream animator for Harvester
    setInterval(() => {
        const stream = document.getElementById('data-stream-inner');
        if (stream) {
            const bit = document.createElement('div');
            bit.textContent = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16)}`;
            bit.style.opacity = (Math.random() * 0.5 + 0.2).toString();
            stream.prepend(bit);
            if (stream.childElementCount > 60) stream.lastElementChild?.remove();
        }
    }, 100);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const module = btn.getAttribute('data-module');
            if (!module) return;

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (viewportContent) {
                viewportContent.innerHTML = modules[module] || '';
                addLog(`MÓDULO_ACTIVADO: ${module.toUpperCase()}`, 'success');
                
                if (module === 'governance') {
                    // Esperar a que el DOM se inyecte
                    setTimeout(() => initGlobe('globe-viz'), 50);
                }

                // Simulación de telemetría específica
                if (module === 'vision') setTimeout(() => addLog('ATIA_OVERLAY: ENFOQUE_EN_OBJETIVO', 'warn'), 800);
                if (module === 'avatar') setTimeout(() => addLog('SINTETIZANDO_IDENTIDAD_CREASTILO', 'success'), 500);
                if (module === 'voice') setTimeout(() => addLog('ESTABLECIENDO_PUENTE_VOZ', 'success'), 500);
            }
        });
    });

    // Activación de Co-piloto - Interacción Hero
    copilotBtn?.addEventListener('click', () => {
        addLog('INICIALIZANDO_SECUENCIA_COOPILOTO_X...', 'warn');
        copilotBtn.textContent = 'BOOTING...';
        copilotBtn.setAttribute('disabled', 'true');
        
        setTimeout(() => addLog('CARGANDO_PESOS_NEURALES: VERSION_3.1.0', 'info'), 1000);
        setTimeout(() => addLog('CONECTANDO_CON_HUB_TIEMPO_REAL_CREASTILO', 'info'), 2000);
        setTimeout(() => {
            addLog('COOPILOTO_X_EN_LÍNEA. ESPERANDO_ASIGNACIÓN.', 'success');
            copilotBtn.textContent = 'COOPILOTO_ACTIVO';
            document.querySelector('.mega-title')?.classList.add('pulse');
        }, 3500);
    });

    // Secuencia inicial
    addLog('SISTEMA_OPERATIVO_CREASTILO_V2.1_LISTO');
    setTimeout(() => addLog('IDENTIDAD_SINTÉTICA_ESTABLECIDA', 'success'), 1200);
    setTimeout(() => addLog('X-DEV_SYNCHRONIZED_WITH_TARGET_SPECS', 'info'), 2400);

    // INICIALIZACIÓN AUTOMÁTICA DEL GLOBO (Sección Narrativa)
    initGlobe('narrative-globe');
});
