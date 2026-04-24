import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Globe from 'react-globe.gl';
import { MapPin, Navigation, AlertTriangle, Database, ShieldAlert, Zap } from 'lucide-react';
import gsap from 'gsap';
import { subscribeToRisks, RiskAlert } from '../services/riskService';
import { useData } from '../contexts/DataContext';
import { escapeHtml } from '../utils/escapeHtml';

// --- TYPE DEFINITIONS ---
type LocationStatus = 'optimal' | 'warning' | 'critical';
type LocationType = 'hq' | 'silo' | 'client' | 'border' | 'alert';

interface TacticalLocation {
    id: string;
    name: string;
    type: LocationType;
    lat: number;
    lng: number;
    status: LocationStatus;
    details: string;
}

interface TacticalArc {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string[];
}

interface TacticalRing {
    lat: number;
    lng: number;
    maxR: number;
    propagationSpeed: number;
    repeatPeriod: number;
    color: string;
    type: string;
    riskData?: RiskAlert;
}

interface GlobeMarkerNode {
    id?: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    status: LocationStatus;
    details: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-globe.gl ref is untyped
type GlobeRef = React.MutableRefObject<Record<string, any> | null>;

// --- TACTICAL DATA: SANTIAGO'S EMPIRE ---
// Coordenadas reales aproximadas para la demo

const LOCATIONS: TacticalLocation[] = [
    // HQ & GRAINLOGIX (Sinaloa)
    { id: 'hq', name: 'AGRO HUB CENTRAL', type: 'hq', lat: 24.8049, lng: -107.3938, status: 'optimal', details: 'Centro de Inteligencia' },
    { id: 'silo-1', name: 'Silo Logístico A', type: 'silo', lat: 25.4600, lng: -108.0847, status: 'warning', details: 'Merma: 1.2%' },
    { id: 'silo-2', name: 'Terminal de Almacenamiento', type: 'silo', lat: 24.6980, lng: -107.4110, status: 'optimal', details: 'Llenado: 85%' },

    // LOGITRACE ROUTES (Rutas Clave)
    { id: 'dest-1', name: 'Distribución: Occidente', type: 'client', lat: 20.6597, lng: -103.3496, status: 'optimal', details: 'Centro de Consumo' },
    { id: 'dest-2', name: 'Frontera Norte', type: 'border', lat: 31.3086, lng: -110.9426, status: 'optimal', details: 'Flujo de Exportación' },

    // ALERTAS ACTIVAS
    { id: 'alert-1', name: 'UNIDAD 04 (ANOMALÍA)', type: 'alert', lat: 23.2428, lng: -106.4098, status: 'critical', details: 'Retraso Logístico Detectado' },
];

interface Props {
  onClose: () => void;
  target?: { lat: number, lng: number, label: string } | null;
}

export const TacticalGlobe: React.FC<Props> = ({ onClose, target }) => {
    const { tacticalData } = useData();
    const globeEl: GlobeRef = useRef(null);
    const [arcs, setArcs] = useState<TacticalArc[]>([]);
    const [rings, setRings] = useState<TacticalRing[]>([]);
    const [hoveredNode, setHoveredNode] = useState<GlobeMarkerNode | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isMounted, setIsMounted] = useState(false);
    const [dynamicRisks, setDynamicRisks] = useState<RiskAlert[]>([]);
    
    // Lockdown/Animation State
    const [lockdownMode, setLockdownMode] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<GlobeMarkerNode | null>(null);

    // Click Handler for Globe Markers
    const handleMarkerClick = (node: GlobeMarkerNode) => {
        if (node.status === 'critical' || node.type === 'alert') {
            triggerLockdownSequence(node);
        } else {
            // Standard focus for non-critical nodes
            if (globeEl.current) {
                globeEl.current.pointOfView({ lat: node.lat, lng: node.lng, altitude: 0.5 }, 1500);
            }
        }
    };

    const triggerLockdownSequence = (node: GlobeMarkerNode) => {
        setLockdownMode(true);
        setSelectedIncident(node);
        
        if (globeEl.current) {
            // 1. Stop rotation
            globeEl.current.controls().autoRotate = false;
            
            // 2. Dramatic Zoom
            globeEl.current.pointOfView({ 
                lat: node.lat, 
                lng: node.lng, 
                altitude: 0.2 // Very close zoom
            }, 1000); // Fast zoom (1s)
            
            // 3. Shake effect (simulated by small random movements if we had a camera controller exposed, 
            // but for now the UI overlay handles the intensity)
        }
    };

    // 1. Initialize Visual Data
    useEffect(() => {
        // Wait for container to exist
        const timer = setTimeout(() => {
            setIsMounted(true);

            // LOGITRACE LOGISTICS (Arcos)
            // Rutas desde el HUB a Destinos
            const routes = [
                { startLat: 24.8049, startLng: -107.3938, endLat: 20.6597, endLng: -103.3496, color: ['#06b6d4', '#3b82f6'] }, // West
                { startLat: 24.8049, startLng: -107.3938, endLat: 31.3086, endLng: -110.9426, color: ['#06b6d4', '#10b981'] }, // Border
                { startLat: 24.8049, startLng: -107.3938, endLat: 23.2428, endLng: -106.4098, color: ['#ef4444', '#ef4444'] }, // Alert Unit
            ];
            setArcs(routes);

            // RINGS (Alerts & Status)
            const statusRings = LOCATIONS.map(loc => ({
                lat: loc.lat,
                lng: loc.lng,
                maxR: loc.type === 'alert' ? 15 : loc.type === 'hq' ? 8 : 5,
                propagationSpeed: loc.type === 'alert' ? 5 : 2,
                repeatPeriod: loc.type === 'alert' ? 600 : 1500,
                color: loc.type === 'alert' ? '#ef4444' : loc.type === 'hq' ? '#06b6d4' : '#f59e0b',
                type: loc.type // pass type for reference
            }));
            setRings(statusRings);

            // Subscribirse a Riesgos Dinámicos
            const unsubscribe = subscribeToRisks(newRisks => {
                setDynamicRisks(newRisks);
                
                // Add rings for dynamic risks
                const riskRings = newRisks.map(risk => ({
                    lat: risk.lat,
                    lng: risk.lng,
                    maxR: risk.severity === 'critical' ? 25 : 15,
                    propagationSpeed: risk.severity === 'critical' ? 8 : 4,
                    repeatPeriod: 800,
                    color: risk.type === 'theft' ? '#ef4444' : risk.type === 'strike' ? '#f59e0b' : '#3b82f6',
                    type: 'dynamic-risk',
                    riskData: risk
                }));
                
                setRings(prev => [...prev.filter(r => r.type !== 'dynamic-risk'), ...riskRings]);
            });

            return () => unsubscribe();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // 2. Initial Camera Position (Focus on Mexico)
    useEffect(() => {
        if (globeEl.current && isMounted) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.3;
            globeEl.current.controls().enableZoom = true;
            
            // Start centered on Sinaloa/Mexico
            globeEl.current.pointOfView({ lat: 24.0, lng: -102.0, altitude: 1.8 });
        }
    }, [isMounted]);

    // 3. Responsive Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Init
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Entrance Animation
    useEffect(() => {
        gsap.fromTo(containerRef.current, 
            { opacity: 0, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
        );
    }, []);

    // 4. React to Target Updates (Voice Control)
    useEffect(() => {
        if (target && globeEl.current) {
            // Stop auto-rotation to focus
            globeEl.current.controls().autoRotate = false;
            
            // Fly to target
            globeEl.current.pointOfView({
                lat: target.lat,
                lng: target.lng,
                altitude: 0.5 // Zoom in close for impact
            }, 2000); // 2-second flight

            // Add a temporary ring to highlight the spot
            const newRing = {
                lat: target.lat,
                lng: target.lng,
                maxR: 10,
                propagationSpeed: 5,
                repeatPeriod: 500,
                color: '#ec4899', // Pink pulse
                type: 'target'
            };
            setRings(prev => [...prev, newRing]);

            // Resume rotation after a while
            setTimeout(() => {
                globeEl.current.controls().autoRotate = true;
            }, 8000);
        }
    }, [target]);

    return (
        <div className="fixed inset-0 z-[150] bg-[#030712]/95 backdrop-blur-xl flex items-center justify-center p-4">
            
            {/* Main Map Container */}
            <div 
                ref={containerRef} 
                className="w-full h-full max-w-7xl max-h-[90vh] relative border border-slate-700/50 rounded-3xl overflow-hidden bg-black shadow-2xl flex items-center justify-center group"
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
                {/* CORNER DECORATIONS */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 z-30 pointer-events-none" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 z-30 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 z-30 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 z-30 pointer-events-none" />

                {/* SCANNING BEAM */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.5)] z-20 pointer-events-none animate-[scan_6s_linear_infinite]" />
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                  <div>
                    <h2 className="text-3xl font-tech text-white tracking-widest flex items-center gap-3">
                      <Navigation className="text-cyan-400" size={32} />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        TACTICAL OVERVIEW
                      </span>
                    </h2>
                    <p className="text-xs font-mono-tech text-slate-400 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        SATELLITE LINK: ACTIVE | LATENCY: 24ms
                    </p>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="pointer-events-auto p-3 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all border border-transparent hover:border-slate-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                {/* Loading State */}
                {!isMounted && (
                    <div className="absolute inset-0 flex items-center justify-center font-mono-tech text-cyan-500 animate-pulse tracking-widest z-10">
                        INITIALIZING GEOSPATIAL ENGINE...
                    </div>
                )}

                {/* 3D GLOBE */}
                {isMounted && (
                    <Globe
                        ref={globeEl}
                        width={dimensions.width}
                        height={dimensions.height}
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                        
                        // Arcs (Rutas)
                        arcsData={arcs}
                        arcColor="color"
                        arcDashLength={0.4}
                        arcDashGap={2}
                        arcDashAnimateTime={2000}
                        arcStroke={0.5}

                        // Rings (Alertas)
                        ringsData={rings}
                        ringColor={(d: TacticalRing) => (t: number) => {
                             const rgb = d.color === '#ef4444' ? '239, 68, 68' : // Red
                                         d.color === '#06b6d4' ? '6, 182, 212' : // Cyan
                                         '245, 158, 11'; // Amber
                             return `rgba(${rgb}, ${1-t})`;
                        }}
                        ringMaxRadius="maxR"
                        ringPropagationSpeed="propagationSpeed"
                        ringRepeatPeriod="repeatPeriod"

                        // Labels / HTML Markers
                        htmlElementsData={[...LOCATIONS, ...dynamicRisks.map(r => ({
                            ...r,
                            name: r.title,
                            status: r.severity === 'critical' ? 'critical' : r.severity === 'high' ? 'critical' : 'warning',
                            details: r.description
                        }))]}
                        htmlElement={(d: GlobeMarkerNode) => {
                            const el = document.createElement('div');
                            el.className = 'cursor-pointer';
                            const markerColor = d.status === 'critical' ? '#ef4444' : d.status === 'warning' ? '#f59e0b' : '#06b6d4';
                            el.innerHTML = `
                                <div class="relative group flex flex-col items-center">
                                    <div class="absolute -inset-4 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" style="background:${markerColor}33"></div>
                                    <div class="w-2 h-2 rounded-full border border-white transition-transform group-hover:scale-150" style="background:${markerColor};box-shadow:0 0 10px ${markerColor}"></div>
                                    <div class="absolute top-4 px-2 py-0.5 bg-black/80 border border-slate-700 rounded text-[7px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                        <span class="text-cyan-400 font-bold">[</span> ${escapeHtml(d.name)} <span class="text-cyan-400 font-bold">]</span>
                                    </div>
                                </div>
                            `;
                            // Hover listeners
                            el.onmouseenter = () => { 
                                setHoveredNode(d); 
                                globeEl.current.controls().autoRotate = false; 
                            };
                            el.onmouseleave = () => { 
                                setHoveredNode(null); 
                                globeEl.current.controls().autoRotate = true; 
                            };
                            el.onclick = () => handleMarkerClick(d);
                            return el;
                        }}
                        htmlLat="lat"
                        htmlLng="lng"
                        
                        // Atmosphere
                        atmosphereColor="#06b6d4"
                        atmosphereAltitude={0.15}
                    />
                )}

                {/* --- LOCKDOWN CINEMATIC OVERLAY --- */}
                {lockdownMode && selectedIncident && (
                    <div className="absolute inset-0 pointer-events-none z-[200] flex items-center justify-center">
                        {/* Red vignette & Scanlines */}
                        <div className="absolute inset-0 bg-red-950/20 pointer-events-auto">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(10,0,0,0)_50%,rgba(255,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(255,0,0,0.02),rgba(255,0,0,0.06))] bg-[length:100%_4px,100%_100%] pointer-events-none"></div>
                            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.6)] animate-pulse"></div>
                        </div>

                        {/* Incident Report Panel */}
                        <div className="relative bg-black/90 border border-red-500/50 p-8 max-w-2xl w-full mx-4 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.4)] backdrop-blur-xl pointer-events-auto animate-in zoom-in-95 duration-500">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6 border-b border-red-900/50 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500 animate-pulse">
                                        <ShieldAlert className="text-red-500 w-8 h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-tech text-white tracking-[0.2em] font-bold">
                                            INCIDENT REPORT <span className="text-red-500">#{selectedIncident.id.toUpperCase().slice(0,4)}</span>
                                        </h2>
                                        <div className="flex items-center gap-2 text-red-400 font-mono text-xs mt-1">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                                            LIVE FEED // SECURITY PROTOCOL OMEGA
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setLockdownMode(false)}
                                    className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                >
                                    <div className="text-xs font-mono mb-1">CLOSE_STREAM</div>
                                </button>
                            </div>

                            {/* Content Grid */}
                            <div className="grid grid-cols-2 gap-8 font-mono-tech text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-red-500/70 text-xs block mb-1">TARGET ASSET</label>
                                        <div className="text-white text-lg border-l-2 border-red-500 pl-3">
                                            {selectedIncident.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-red-500/70 text-xs block mb-1">COORDINATES</label>
                                        <div className="text-slate-300">
                                            {selectedIncident.lat.toFixed(4)}, {selectedIncident.lng.toFixed(4)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-red-500/70 text-xs block mb-1">THREAT LEVEL</label>
                                        <div className="flex items-center gap-2 text-red-400 font-bold">
                                            CRITICAL
                                            <div className="flex gap-1 h-3 items-end">
                                                {[1,3,2,4,3,5].map((h, i) => (
                                                    <div key={i} className="w-1 bg-red-500 animate-[bounce_1s_infinite]" style={{height: `${h*20}%`, animationDelay: `${i*0.1}s`}}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative bg-red-950/20 rounded border border-red-900/30 p-4 font-mono text-xs text-red-200 overflow-hidden">
                                     <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/50 animate-[scan_2s_linear_infinite]"></div>
                                     <p className="mb-2 text-red-500 font-bold">{'>'} {'>'} ANALYSIS LOG:</p>
                                     <div className="space-y-2 opacity-80">
                                        <p>{'>'} Telemetry signal lost at 14:02 CST.</p>
                                        <p>{'>'} Unscheduled stop detected on Route 45D.</p>
                                        <p>{'>'} Geofence deviation: +2.4km from safe corridor.</p>
                                        <p className="text-white bg-red-900/50 inline-block px-1">
                                            {'>'} ALERT: Probable cargo theft attempt.
                                        </p>
                                     </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-8 flex gap-4">
                                <button className="flex-1 bg-red-600 hover:bg-red-500 text-white font-tech py-3 px-4 rounded transition-all border border-red-400 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2">
                                    <Zap size={18} />
                                    DEPLOY INTERVENTION TEAM
                                </button>
                                <button className="flex-1 bg-black border border-slate-600 hover:border-white text-slate-300 hover:text-white font-tech py-3 px-4 rounded transition-all">
                                    CONTACT DRIVER
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TACTICAL INTELLIGENCE HUD (NEW) --- */}
                <div className="absolute top-24 right-8 bottom-8 w-80 z-40 pointer-events-none flex flex-col gap-4">
                    
                    {/* 1. ASSET METRICS (High Value) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl pointer-events-auto shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                        <div className="flex items-center gap-2 mb-4">
                            <Database size={16} className="text-cyan-400" />
                            <h4 className="text-[10px] font-tech-bold text-white tracking-[0.2em] uppercase">Asset KPIs // Rendimientos</h4>
                        </div>
                        <div className="space-y-4">
                            {tacticalData.slice(0, 4).map((point, i) => {
                                const val = Math.round(point.height * 20); // Scale 0-5 to 0-100
                                return (
                                    <div key={point.label} className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-mono uppercase">
                                            <span className="text-slate-400">{point.label}</span>
                                            <span className={val > 70 ? 'text-emerald-400' : 'text-amber-400'}>{val}% EFF</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${val}%` }}
                                                transition={{ duration: 1.5, delay: 0.8 + (i * 0.1) }}
                                                className={`h-full ${val > 70 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                                            ></motion.div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* 2. RISK ASSESSMENT (High Risk) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-slate-900/60 backdrop-blur-xl border border-red-500/30 p-4 rounded-2xl pointer-events-auto shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldAlert size={16} className="text-red-400" />
                            <h4 className="text-[10px] font-tech-bold text-white tracking-[0.2em] uppercase">Risk Board // Amenazas</h4>
                        </div>
                        <div className="space-y-2">
                             <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-lg flex items-start gap-2 animate-pulse">
                                <AlertTriangle size={12} className="text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-[9px] font-tech text-red-200 uppercase leading-none">Desviación Un-04</p>
                                    <p className="text-[8px] font-mono text-red-500/70 mt-1 uppercase">Alta probabilidad de merma</p>
                                </div>
                             </div>
                             <div className="bg-amber-500/5 border border-amber-500/20 p-2 rounded-lg flex items-start gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <Zap size={12} className="text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-[9px] font-tech text-amber-200 uppercase leading-none">Volatilidad CBOT</p>
                                    <p className="text-[8px] font-mono text-amber-500/70 mt-1 uppercase">Margen presionado -2.4%</p>
                                </div>
                             </div>
                        </div>
                    </motion.div>

                    {/* 3. OPPORTUNITY SCAN (Improvements) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl pointer-events-auto"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={16} className="text-emerald-400" />
                            <h4 className="text-[10px] font-tech-bold text-white tracking-[0.2em] uppercase">Opportunity Scan</h4>
                        </div>
                        <div className="font-mono text-[8px] text-slate-400 space-y-2 uppercase leading-tight">
                            <p className="border-l border-emerald-500 pl-2">
                                {'>'} RUTA "OCCIDENTE" PRESENTA 12% MEJORA EN TIEMPO DE CICLO SI SE RE-RUTA POR MAZATLÁN.
                            </p>
                            <p className="border-l border-slate-700 pl-2 opacity-50">
                                {'>'} BLOQUEO PREVENTIVO EN UNIDAD EXTERNA-88 SUGERIDO PARA OPTIMIZAR SEGURO.
                            </p>
                            <div className="pt-2">
                                <span className="bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">SUGERENCIA IA</span>
                                <p className="mt-1 text-emerald-100">Implementar sensor de humedad en Silo A para mitigar varianza de merma.</p>
                            </div>
                        </div>

                        {/* Visual Metric Graph (Miniature) */}
                        <div className="mt-4 h-12 flex items-end gap-1 px-1">
                            {[40, 70, 45, 90, 65, 80, 55, 30, 95].map((h, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: 1 + (idx * 0.05) }}
                                    className="flex-1 bg-gradient-to-t from-emerald-600 to-cyan-400 rounded-t-sm opacity-50"
                                ></motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* --- FLOATING HOVER CARD (Like Iron Man HUD) --- */}
                {hoveredNode && !lockdownMode && (
                    <div 
                        className="fixed z-[200] pointer-events-none"
                        style={{ 
                            left: mousePos.x + 20, 
                            top: mousePos.y - 20 
                        }}
                    >
                        <div className={`bg-slate-900/90 backdrop-blur-md border rounded-lg p-4 shadow-2xl min-w-[240px] animate-in fade-in slide-in-from-bottom-2
                            ${hoveredNode.status === 'critical' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 
                              hoveredNode.status === 'warning' ? 'border-amber-500' : 'border-cyan-500'}`
                        }>
                            <h3 className={`font-tech text-lg uppercase ${
                                hoveredNode.status === 'critical' ? 'text-red-400' : 
                                hoveredNode.status === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`
                            }>
                                {hoveredNode.name}
                            </h3>
                            <div className="h-px bg-white/10 my-2"></div>
                            <div className="space-y-1 font-mono-tech text-xs text-slate-300">
                                <p className="flex justify-between">
                                    <span className="text-slate-500">TYPE:</span> 
                                    <span>{hoveredNode.type.toUpperCase()}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-500">STATUS:</span> 
                                    <span className={hoveredNode.status === 'critical' ? 'text-red-500 animate-pulse font-bold' : 'text-emerald-400'}>
                                        {hoveredNode.status.toUpperCase()}
                                    </span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-500">DETAILS:</span> 
                                    <span className="text-white">{hoveredNode.details}</span>
                                </p>
                                {hoveredNode.status === 'critical' && (
                                    <div className="mt-2 pt-2 border-t border-red-900/30 text-center text-red-400 text-[10px] tracking-widest animate-pulse">
                                        CLICK TO ANALYZE INCIDENT
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* LEGEND overlay */}
                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur border border-slate-800 p-4 rounded-xl pointer-events-none">
                    <div className="space-y-2 text-[10px] font-mono-tech text-slate-400 uppercase">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                            <span>Unidades Activas / HQ</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                            <span>Atención Requerida (Silos)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                            <span className="text-red-400 font-bold">ALERTA CRÍTICA (ORDEÑA)</span>
                        </div>
                    </div>
                </div>

                {/* GRID OVERLAY EFFECT */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                
                {/* NOISE OVERLAY */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay"></div>
            </div>
        </div>
    );
};
