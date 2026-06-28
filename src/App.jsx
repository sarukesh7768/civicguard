import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Activity, LogOut, X, BrainCircuit, ShieldAlert,
  CheckCircle, Wrench, Eye, Zap, Cpu, BarChart3, Video as VideoIcon, Image as ImageIcon, Trophy, Sparkles,
  TrendingUp, AlertTriangle, MapPin, Clock, Tag, Lightbulb, Users, ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const supabaseUrl     = "https://wbjckwryfjwzmybeqcvd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiamNrd3J5Zmp3em15YmVxY3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE3OTI3NSwiZXhwIjoyMDk3NzU1Mjc1fQ.CLvpchCUb3kQnfMjlB_PFzzJMaZR-DJ2tLV0EZfJZtU";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NIM_API_KEY = "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";
const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NIM_MODEL = 'meta/llama-3.1-70b-instruct';

const STATUS = {
  pending:  { color: '#ef4444', glow: '#ef444488', label: 'PENDING',  bg: 'rgba(239,68,68,0.14)'  },
  verified: { color: '#f97316', glow: '#f9731688', label: 'VERIFIED', bg: 'rgba(249,115,22,0.14)' },
  resolved: { color: '#22c55e', glow: '#22c55e88', label: 'RESOLVED', bg: 'rgba(34,197,94,0.14)'  },
};

const URGENCY = {
  low:    { color: '#22c55e', label: 'LOW'    },
  medium: { color: '#f97316', label: 'MEDIUM' },
  high:   { color: '#ef4444', label: 'HIGH'   },
};

const BADGES = [
  { min: 0,    name: 'ROOKIE_SENTRY',   icon: '🛡️' },
  { min: 30,   name: 'CIVIC_SCOUT',     icon: '🔭' },
  { min: 80,   name: 'GUARDIAN',        icon: '⚔️' },
  { min: 150,  name: 'CITY_PROTECTOR',  icon: '🏛️' },
  { min: 300,  name: 'CIVIC_LEGEND',    icon: '👑' },
];
function badgeFor(karma) {
  return BADGES.reduce((acc, b) => (karma >= b.min ? b : acc), BADGES[0]);
}

const markerIcon = (status) => {
  const s = (status || 'pending').toLowerCase();
  const cfg = STATUS[s] || STATUS.pending;
  const isPending = s === 'pending';
  return new L.DivIcon({
    className: 'cg-marker-wrapper',
    html: `<div class="cg-dot${isPending ? ' cg-dot-blink' : ''}" style="
      background-color:${cfg.color} !important;
      box-shadow:0 0 8px ${cfg.glow}, 0 0 2px ${cfg.color};
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
};

function MapEvents({ onMapClick, canReport, onWorkerClick }) {
  useMapEvents({
    click(e) {
      if (e.originalEvent.target.closest('.leaflet-marker-icon') ||
          e.originalEvent.target.closest('.leaflet-popup')) return;
      if (canReport) onMapClick(e.latlng);
      else onWorkerClick();
    },
  });
  return null;
}

function MapInvalidate() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const ro = new ResizeObserver(() => map.invalidateSize());
    const container = map.getContainer();
    if (container) ro.observe(container);
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); };
  }, [map]);
  return null;
}

const BOOT_MESSAGES = [
  'INITIALIZING NEURAL MESH...',
  'LOADING CIVIC PROTOCOLS...',
  'ESTABLISHING UPLINK...',
  'CALIBRATING AI MODULES...',
  'SYNCING MAP DATABASE...',
  'BOOT SEQUENCE COMPLETE',
];

function HUDLoader({ progress }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [scanDots, setScanDots] = useState('');
  const [latency] = useState(() => Math.floor(Math.random() * 20) + 8);
  const [coords] = useState(() => {
    const lat = (12.9716 + (Math.random() - 0.5) * 0.01).toFixed(4);
    const lng = (77.5946 + (Math.random() - 0.5) * 0.01).toFixed(4);
    return `${lat}° N, ${lng}° E`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx(i => Math.min(i + 1, BOOT_MESSAGES.length - 1));
    }, 520);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setScanDots(d => d.length >= 3 ? '' : d + '.');
    }, 320);
    return () => clearInterval(t);
  }, []);

  const pct = Math.round(progress);

  return (
    <div style={bootStyles.root}>
      <style>{bootCSS}</style>
      <div style={bootStyles.topBar}>
        <div style={bootStyles.topBarLeft}>
          <span style={bootStyles.topBarItem}>[ SYSTEM STATUS: OPTIMAL ]_</span>
          <span style={bootStyles.topBarItem}>[ AI ANALYSIS: ACTIVE ]_</span>
        </div>
        <div style={bootStyles.topBarRight}>
          <span style={bootStyles.topBarItem}>LATENCY: {latency}ms</span>
          <span style={bootStyles.topBarItem}>NODE ID: CG-09X-BETA</span>
        </div>
      </div>
      <div style={bootStyles.scanlineOverlay} />
      <div style={bootStyles.center}>
        <div style={bootStyles.logoWrap}>
          <svg width="110" height="120" viewBox="0 0 110 120" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 18px #00f2ff) drop-shadow(0 0 6px #00f2ff)', animation: 'bootLogoPulse 2.5s ease-in-out infinite' }}>
            <path d="M55 6 L96 22 L96 58 C96 82 75 102 55 114 C35 102 14 82 14 58 L14 22 Z"
              stroke="#00f2ff" strokeWidth="2" fill="rgba(0,242,255,0.06)" />
            <line x1="55" y1="30" x2="55" y2="90" stroke="#00f2ff" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="30" y1="55" x2="80" y2="55" stroke="#00f2ff" strokeWidth="0.8" strokeOpacity="0.5" />
            <circle cx="55" cy="55" r="18" stroke="#00f2ff" strokeWidth="1.2" fill="none" strokeOpacity="0.7" />
            <circle cx="55" cy="55" r="6" fill="#00f2ff" fillOpacity="0.8" />
            <circle cx="55" cy="30" r="2.5" fill="#00f2ff" fillOpacity="0.9" />
            <circle cx="55" cy="80" r="2.5" fill="#00f2ff" fillOpacity="0.9" />
            <circle cx="30" cy="55" r="2.5" fill="#00f2ff" fillOpacity="0.9" />
            <circle cx="80" cy="55" r="2.5" fill="#00f2ff" fillOpacity="0.9" />
          </svg>
          <div style={bootStyles.logoLabel}>CIVIC GUARD AI</div>
        </div>
        <h1 style={bootStyles.title}>CIVIC GUARD</h1>
        <div style={bootStyles.scanRow}><div style={bootStyles.sepLine} /></div>
        <div style={bootStyles.scanningRow}>
          <span style={bootStyles.scanBracket}>{'( '}</span>
          <span style={bootStyles.scanText}>SCANNING</span>
          <span style={bootStyles.scanBracket}>{scanDots.padEnd(3, ' ') + ' )'}</span>
        </div>
        <div style={bootStyles.progressWrap}>
          <div style={bootStyles.progressTrack}>
            <div style={{ ...bootStyles.progressFill, width: `${pct}%` }} />
          </div>
          <div style={bootStyles.progressLabels}>
            <span>UPLINK ACTIVE</span>
            <span>{pct}%</span>
          </div>
        </div>
        <div style={bootStyles.bootMsg}>{BOOT_MESSAGES[msgIdx]}</div>
      </div>
      <div style={bootStyles.bottomBar}>
        <span>ESTABLISHING DECENTRALIZED GOVERNANCE PROTOCOL · AI-POWERED CIVIC MANAGEMENT</span>
      </div>
      <div style={bootStyles.coordCorner}>COORD: {coords}</div>
    </div>
  );
}

const bootStyles = {
  root: { position: 'fixed', inset: 0, background: '#000', color: '#00f2ff', fontFamily: "'Share Tech Mono', 'Courier New', monospace", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', userSelect: 'none' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, borderBottom: '1px solid rgba(0,242,255,0.15)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', letterSpacing: '1.5px', background: 'rgba(0,242,255,0.02)', zIndex: 10 },
  topBarLeft:  { display: 'flex', flexDirection: 'column', gap: '3px' },
  topBarRight: { display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' },
  topBarItem:  { opacity: 0.65 },
  scanlineOverlay: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,242,255,0.018) 3px, rgba(0,242,255,0.018) 4px)', zIndex: 1 },
  center: { position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' },
  logoLabel: { fontSize: '9px', letterSpacing: '3px', opacity: 0.55, marginTop: '8px' },
  title: { fontSize: '28px', fontWeight: 'bold', letterSpacing: '10px', color: '#00f2ff', textShadow: '0 0 30px rgba(0,242,255,0.8), 0 0 60px rgba(0,242,255,0.3)', margin: '0 0 24px', animation: 'bootTitlePulse 3s ease-in-out infinite' },
  scanRow: { display: 'flex', justifyContent: 'center', margin: '2px 0' },
  sepLine: { width: '220px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,242,255,0.4), transparent)' },
  scanningRow: { display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0' },
  scanBracket: { fontSize: '11px', opacity: 0.4, letterSpacing: '2px' },
  scanText: { fontSize: '12px', letterSpacing: '8px', color: '#00f2ff', opacity: 0.85, animation: 'bootScanPulse 1.2s ease-in-out infinite' },
  progressWrap: { marginTop: '20px', width: '260px' },
  progressTrack: { width: '100%', height: '3px', background: 'rgba(0,242,255,0.12)', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #00a8b5, #00f2ff)', boxShadow: '0 0 10px #00f2ff', transition: 'width 0.08s linear' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '9px', letterSpacing: '2px', opacity: 0.5 },
  bootMsg: { marginTop: '18px', fontSize: '11px', letterSpacing: '3px', color: '#00f2ff', opacity: 0.7, minHeight: '18px', animation: 'bootMsgFade 0.4s ease-in-out' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(0,242,255,0.1)', padding: '10px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '9px', letterSpacing: '2px', opacity: 0.4 },
  coordCorner: { position: 'absolute', bottom: '14px', left: '20px', fontSize: '9px', letterSpacing: '1.5px', opacity: 0.35 },
};

const bootCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  @keyframes bootLogoPulse { 0%,100% { opacity:0.85; } 50% { opacity:1; filter:drop-shadow(0 0 28px #00f2ff) drop-shadow(0 0 8px #00f2ff); } }
  @keyframes bootTitlePulse { 0%,100% { text-shadow:0 0 30px rgba(0,242,255,0.8),0 0 60px rgba(0,242,255,0.3); } 50% { text-shadow:0 0 50px rgba(0,242,255,1),0 0 100px rgba(0,242,255,0.5); } }
  @keyframes bootScanPulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
  @keyframes bootMsgFade { from { opacity:0; transform:translateY(4px); } to { opacity:0.7; transform:translateY(0); } }
`;

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const isError   = msg.startsWith('⚠');
  const isSuccess = msg.startsWith('✓');
  const accentColor = isError ? '#ff3b3b' : isSuccess ? '#00ff88' : '#ff9500';
  const bgColor     = isError ? 'rgba(255,30,30,0.22)' : isSuccess ? 'rgba(0,255,136,0.14)' : 'rgba(255,149,0,0.16)';
  const icon        = isError ? '⚠' : isSuccess ? '✓' : 'ℹ';
  const cleanMsg    = msg.replace(/^[⚠✓ℹ]\s*/, '');
  return (
    <div style={{
      position:'fixed', top:'80px', left:'50%', transform:'translateX(-50%)', zIndex:999999,
      display:'flex', alignItems:'center', gap:'12px', padding:'14px 24px 14px 18px',
      background:bgColor, border:`2px solid ${accentColor}`,
      boxShadow:`0 0 0 1px ${accentColor}33, 0 0 32px ${accentColor}66, 0 8px 32px rgba(0,0,0,0.8)`,
      backdropFilter:'blur(16px)', fontFamily:"'Share Tech Mono',monospace", color:'#fff',
      fontSize:'11px', letterSpacing:'1.5px', whiteSpace:'nowrap', maxWidth:'92vw',
      animation:'toastPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards', borderRadius:'3px', minWidth:'280px',
    }}>
      <div style={{
        width:'28px', height:'28px', borderRadius:'50%', background:accentColor,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#000',
        fontWeight:'bold', flexShrink:0, boxShadow:`0 0 12px ${accentColor}`,
      }}>{icon}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
        <span style={{ color:accentColor, fontSize:'8px', letterSpacing:'3px', opacity:0.8 }}>
          {isError ? 'SYSTEM_ALERT' : isSuccess ? 'CONFIRMED' : 'INFO'}
        </span>
        <span style={{ color:'#fff', fontWeight:'bold', fontSize:'11px' }}>{cleanMsg}</span>
      </div>
    </div>
  );
}

function LoginBG() {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    const NODES = Array.from({ length: 60 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4,
      r:Math.random()*1.5+0.5, pulse:Math.random()*Math.PI*2,
    }));
    let scanY = 0, tick = 0;
    const draw = () => {
      ctx.fillStyle='#0d1515'; ctx.fillRect(0,0,W,H);
      tick++; scanY=(scanY+0.8)%H;
      ctx.strokeStyle='rgba(0,242,255,0.04)'; ctx.lineWidth=1;
      const gs=48, ox=(tick*0.15)%gs, oy=(tick*0.1)%gs;
      for(let x=-gs+ox;x<W+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=-gs+oy;y<H+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      const grad=ctx.createLinearGradient(0,scanY-40,0,scanY+40);
      grad.addColorStop(0,'rgba(0,242,255,0)');grad.addColorStop(0.5,'rgba(0,242,255,0.06)');grad.addColorStop(1,'rgba(0,242,255,0)');
      ctx.fillStyle=grad; ctx.fillRect(0,scanY-40,W,80);
      NODES.forEach(n=>{n.x+=n.vx;n.y+=n.vy;n.pulse+=0.02;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1;});
      NODES.forEach((a,i)=>{
        NODES.slice(i+1).forEach(b=>{
          const dx=a.x-b.x,dy=a.y-b.y,dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<150){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(0,242,255,${0.12*(1-dist/150)})`;ctx.lineWidth=0.5;ctx.stroke();}
        });
        const glow=0.5+0.5*Math.sin(a.pulse);
        ctx.beginPath();ctx.arc(a.x,a.y,a.r*(1+0.4*glow),0,Math.PI*2);
        ctx.fillStyle=`rgba(0,242,255,${0.3+0.4*glow})`;ctx.shadowColor='#00f2ff';ctx.shadowBlur=6*glow;ctx.fill();ctx.shadowBlur=0;
      });
      frameRef.current=requestAnimationFrame(draw);
    };
    frameRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(frameRef.current);window.removeEventListener('resize',onResize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}}/>;
}

function AIBadge({ issue }) {
  if (!issue.ai_category && !issue.ai_urgency && !issue.ai_summary) return null;
  const urgCfg = URGENCY[issue.ai_urgency] || URGENCY.medium;
  return (
    <div style={{background:'rgba(0,242,255,0.06)',border:'1px solid rgba(0,242,255,0.2)',padding:'8px 10px',marginBottom:'10px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
        <Cpu size={10} color="#00f2ff"/>
        <span style={{fontSize:'8px',letterSpacing:'2px',color:'#00f2ff',opacity:0.7}}>AI ANALYSIS</span>
      </div>
      {issue.ai_category && (
        <div style={{display:'flex',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
          <span style={{fontSize:'8px',padding:'1px 6px',letterSpacing:'1px',background:'rgba(0,242,255,0.12)',color:'#00f2ff',border:'1px solid rgba(0,242,255,0.25)'}}>{issue.ai_category}</span>
          {issue.ai_urgency && (
            <span style={{fontSize:'8px',padding:'1px 6px',letterSpacing:'1px',background:`rgba(${urgCfg.color==='#ef4444'?'239,68,68':urgCfg.color==='#f97316'?'249,115,22':'34,197,94'},0.12)`,color:urgCfg.color,border:`1px solid ${urgCfg.color}44`}}>URGENCY: {urgCfg.label}</span>
          )}
        </div>
      )}
      {issue.ai_summary && (
        <p style={{fontSize:'10px',lineHeight:'1.5',opacity:0.75,margin:0,fontStyle:'italic'}}>{issue.ai_summary}</p>
      )}
    </div>
  );
}

function IssuePopup({ issue, userRole, onAction }) {
  const s   = (issue.status || 'pending').toLowerCase();
  const cfg = STATUS[s] || STATUS.pending;
  const canVerify  = userRole === 'citizen' && s === 'pending';
  const canResolve = userRole === 'worker'  && s === 'verified';
  return (
    <div style={S.popup}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <span style={{fontSize:'8px',letterSpacing:'2px',opacity:0.45}}>CIVIC_ALERT</span>
        <span style={{fontSize:'8px',letterSpacing:'1px',padding:'2px 8px',background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}44`}}>{cfg.label}</span>
      </div>
      {issue.image_url && (
        <div style={{marginBottom:'10px',overflow:'hidden',border:'1px solid rgba(0,242,255,0.2)'}}>
          <img src={issue.image_url} alt="Issue" style={{width:'100%',maxHeight:'150px',objectFit:'cover',display:'block'}} onError={e=>{e.target.parentElement.style.display='none';}}/>
        </div>
      )}
      {issue.video_url && (
        <div style={{marginBottom:'10px',overflow:'hidden',border:'1px solid rgba(0,242,255,0.2)'}}>
          <video src={issue.video_url} controls style={{width:'100%',maxHeight:'150px',display:'block',background:'#000'}}/>
        </div>
      )}
      <AIBadge issue={issue}/>
      <p style={{fontSize:'11px',lineHeight:'1.55',marginBottom:'8px',opacity:0.88}}>{issue.description}</p>
      <div style={{fontSize:'8px',opacity:0.35,marginBottom:'10px',letterSpacing:'1px'}}>{new Date(issue.created_at).toLocaleString()}</div>
      {canVerify && (
        <button onClick={()=>onAction(issue.id,'verified')} style={{...S.popupBtn,borderColor:'#f97316',color:'#f97316'}}>
          <Eye size={10} style={{marginRight:5}}/> VERIFY ISSUE (+10 XP)
        </button>
      )}
      {canResolve && (
        <button onClick={()=>onAction(issue.id,'resolved')} style={{...S.popupBtn,borderColor:'#22c55e',color:'#22c55e'}}>
          <CheckCircle size={10} style={{marginRight:5}}/> MARK RESOLVED (+15 XP)
        </button>
      )}
      {!canVerify && !canResolve && (
        <div style={{fontSize:'8px',opacity:0.3,letterSpacing:'1px',textAlign:'center',padding:'4px 0'}}>
          {s==='resolved'?'✓ ISSUE CLOSED':'NO ACTION AVAILABLE FOR YOUR ROLE'}
        </div>
      )}
    </div>
  );
}

async function callNIM(systemPrompt, userPrompt) {
  const response = await fetch(NIM_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: NIM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NIM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

async function analyzeIssueWithAI(description) {
  try {
    const raw = await callNIM(
      `You are a civic issue classification AI for an urban management system in Bengaluru, India.
Analyze civic issue reports and return ONLY a valid JSON object with NO markdown, NO preamble, NO explanation.
The JSON must have exactly these fields:
{
  "category": "<one of: Pothole, Flooding, Broken Streetlight, Garbage, Sewage, Road Damage, Tree Fall, Vandalism, Other>",
  "urgency": "<one of: low, medium, high>",
  "summary": "<single concise sentence, max 20 words, describing the action for the field worker>"
}`,
      `Analyze this civic issue and respond with JSON only: "${description}"`
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('analyzeIssueWithAI error:', err);
    return { category: 'Other', urgency: 'medium', summary: 'Manual inspection required.' };
  }
}

function generatePredictiveInsights(issues) {
  return new Promise((resolve) => {
    try {
      if (issues.length === 0) { resolve(null); return; }

      const now = Date.now();
      const week = 7 * 24 * 3600 * 1000;
      const recent = issues.filter(i => now - new Date(i.created_at).getTime() < week);
      const countBy = (arr) => arr.reduce((acc, i) => {
        const k = i.ai_category || 'Other';
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {});
      const recentCounts = countBy(recent.length ? recent : issues);
      const trending_category = Object.entries(recentCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Other';

      const grid = {};
      issues.forEach(i => {
        if (!i.latitude || !i.longitude) return;
        const gx = Math.round(+i.latitude  * 100) / 100;
        const gy = Math.round(+i.longitude * 100) / 100;
        const key = `${gx},${gy}`;
        if (!grid[key]) grid[key] = { lat: gx, lng: gy, items: [] };
        grid[key].items.push(i);
      });

      const LOCALITIES = [
        { name: 'Koramangala',    minLat:12.920, maxLat:12.945, minLng:77.610, maxLng:77.640 },
        { name: 'Indiranagar',    minLat:12.965, maxLat:12.985, minLng:77.635, maxLng:77.660 },
        { name: 'Whitefield',     minLat:12.960, maxLat:12.990, minLng:77.730, maxLng:77.770 },
        { name: 'Jayanagar',      minLat:12.920, maxLat:12.945, minLng:77.575, maxLng:77.600 },
        { name: 'Malleshwaram',   minLat:13.000, maxLat:13.020, minLng:77.555, maxLng:77.580 },
        { name: 'Hebbal',         minLat:13.030, maxLat:13.060, minLng:77.585, maxLng:77.610 },
        { name: 'Electronic City',minLat:12.830, maxLat:12.860, minLng:77.660, maxLng:77.690 },
        { name: 'Marathahalli',   minLat:12.950, maxLat:12.970, minLng:77.695, maxLng:77.720 },
        { name: 'Rajajinagar',    minLat:12.990, maxLat:13.010, minLng:77.545, maxLng:77.570 },
        { name: 'Banashankari',   minLat:12.900, maxLat:12.925, minLng:77.545, maxLng:77.575 },
      ];
      const localityName = (lat, lng) => {
        const loc = LOCALITIES.find(l => lat>=l.minLat && lat<=l.maxLat && lng>=l.minLng && lng<=l.maxLng);
        return loc ? loc.name : `Zone ${(lat).toFixed(2)}°N`;
      };

      const hotspotCells = Object.values(grid)
        .sort((a,b) => b.items.length - a.items.length)
        .slice(0, 4);

      const hotspots = hotspotCells.map(cell => {
        const highUrgency = cell.items.filter(i => i.ai_urgency === 'high').length;
        const pending     = cell.items.filter(i => i.status === 'pending').length;
        const topCat      = Object.entries(countBy(cell.items)).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'issues';
        const risk        = highUrgency >= 2 || cell.items.length >= 5 ? 'high'
                          : cell.items.length >= 3 || highUrgency >= 1 ? 'medium' : 'low';
        const area        = localityName(cell.lat, cell.lng);
        const reason      = `${cell.items.length} reports, ${pending} pending — primarily ${topCat.toLowerCase()}.`;
        return { area, risk, reason, reports: cell.items.length, pending, topCat, highUrgency };
      });

      // Compute 7-day forecast buckets
      const dayBuckets = Array(7).fill(0);
      recent.forEach(i => {
        const age = Math.floor((now - new Date(i.created_at).getTime()) / (24*3600*1000));
        if (age >= 0 && age < 7) dayBuckets[6 - age]++;
      });

      const prevWeek = issues.filter(i => {
        const age = now - new Date(i.created_at).getTime();
        return age >= week && age < 2 * week;
      });
      const recentCount = recent.length;
      const prevCount   = prevWeek.length || 1;
      const trendPct    = Math.round((recentCount / prevCount - 1) * 100);
      const trend       = recentCount > prevCount * 1.2 ? 'increasing'
                        : recentCount < prevCount * 0.8 ? 'decreasing' : 'stable';
      const pendingCount = issues.filter(i => i.status === 'pending').length;
      const forecast = trend === 'increasing'
        ? `Issue volume is rising (+${trendPct}% vs last week); expect continued high reports next 7 days.`
        : trend === 'decreasing'
        ? `Reports are declining this week; lower volume expected, but ${pendingCount} issues remain unresolved.`
        : `Issue volume is stable this week; approximately ${Math.round(recentCount * 1.05)} reports expected next 7 days.`;

      const highPending = issues.filter(i => i.status==='pending' && i.ai_urgency==='high').length;
      const topCatOverall = Object.entries(countBy(issues)).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'issues';
      const recommendation = highPending > 0
        ? `Prioritise the ${highPending} high-urgency pending ${topCatOverall.toLowerCase()} reports in ${hotspots[0]?.area || 'top hotspot'} immediately.`
        : `Deploy field teams to ${hotspots[0]?.area || 'top hotspot'} to address the ${topCatOverall.toLowerCase()} cluster before escalation.`;

      // Category quality flag
      const allOther = Object.keys(recentCounts).length === 1 && recentCounts['Other'];
      const dataQualityFlag = allOther
        ? `100% of reports tagged "Other" — categorization may be incomplete, limiting forecast accuracy.`
        : null;

      resolve({
        hotspots, trending_category, forecast, recommendation,
        trend, trendPct, pendingCount, dayBuckets, recentCount,
        catCounts: recentCounts, topCatOverall, dataQualityFlag,
      });
    } catch (err) {
      console.error('generatePredictiveInsights error:', err);
      resolve(null);
    }
  });
}

// ── IMPROVED PREDICTIVE INSIGHTS PANEL ───────────────────────────────────────
function PredictiveInsightsPanel({ issues, onClose }) {
  const [loading,    setLoading]    = useState(true);
  const [insights,   setInsights]   = useState(null);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selZone,    setSelZone]    = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    if (issues.length === 0) {
      setError('No issues in database yet. Report some issues first!');
      setLoading(false);
      return;
    }
    setTimeout(() => {
      generatePredictiveInsights(issues).then(res => {
        if (!active) return;
        if (res) setInsights(res);
        else setError('Analysis failed. Please try again.');
        setLoading(false);
      });
    }, 700);
    return () => { active = false; };
  }, [issues]);

  const TABS = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'zones',    label: 'HOTSPOTS' },
    { id: 'trends',   label: 'TRENDS'   },
    { id: 'actions',  label: 'ACTIONS'  },
  ];

  const tabBtn = (tab) => ({
    padding: '6px 12px',
    fontSize: '9px',
    letterSpacing: '1.5px',
    fontFamily: "'Share Tech Mono',monospace",
    cursor: 'pointer',
    border: activeTab === tab.id ? '1px solid rgba(0,242,255,0.6)' : '1px solid rgba(0,242,255,0.18)',
    background: activeTab === tab.id ? 'rgba(0,242,255,0.14)' : 'transparent',
    color: activeTab === tab.id ? '#00f2ff' : 'rgba(0,242,255,0.45)',
    transition: 'all 0.15s',
    fontWeight: activeTab === tab.id ? 'bold' : 'normal',
  });

  // Mini sparkline SVG — last 7 days bars
  const SparkBars = ({ data, color }) => {
    const max = Math.max(...data, 1);
    const W = 80, H = 28, gap = 3, bw = (W - gap * (data.length - 1)) / data.length;
    return (
      <svg width={W} height={H} style={{ display: 'block' }}>
        {data.map((v, i) => {
          const bh = Math.max(2, (v / max) * H);
          return (
            <rect
              key={i}
              x={i * (bw + gap)}
              y={H - bh}
              width={bw}
              height={bh}
              rx="1"
              fill={color}
              opacity={0.4 + 0.6 * (v / max)}
            />
          );
        })}
      </svg>
    );
  };

  // Inline mini bar
  const MiniBar = ({ pct, color }) => (
    <div style={{ height: '4px', background: 'rgba(0,242,255,0.1)', borderRadius: '2px', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.5s', borderRadius: '2px' }} />
    </div>
  );

  const sectionTitle = (label, icon) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', marginTop: '4px' }}>
      {icon && React.createElement(icon, { size: 10, color: '#00f2ff', opacity: 0.6 })}
      <span style={{ fontSize: '8px', letterSpacing: '2px', opacity: 0.45 }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(0,242,255,0.1)' }} />
    </div>
  );

  const kpiCard = (label, value, subColor) => (
    <div style={{ border: '1px solid rgba(0,242,255,0.14)', background: 'rgba(0,242,255,0.04)', padding: '10px 8px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: subColor || '#00f2ff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '7px', opacity: 0.45, letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
    </div>
  );

  const riskColor = (r) => r === 'high' ? '#ef4444' : r === 'medium' ? '#f97316' : '#22c55e';

  const recBox = (icon, accentColor, title, body) => (
    <div style={{ borderLeft: `2px solid ${accentColor}`, background: `${accentColor}0a`, padding: '10px 12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        {React.createElement(icon, { size: 11, color: accentColor })}
        <span style={{ fontSize: '8px', letterSpacing: '2px', color: accentColor }}>{title}</span>
      </div>
      <p style={{ fontSize: '10px', lineHeight: 1.65, opacity: 0.85, margin: 0 }}>{body}</p>
    </div>
  );

  return (
    <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...S.formPanel, width: '440px', maxHeight: '88vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="#00f2ff" />
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px' }}>PREDICTIVE INSIGHTS</div>
              <div style={{ fontSize: '7px', opacity: 0.35, letterSpacing: '2px', marginTop: '2px' }}>LOCAL PATTERN ANALYSIS ENGINE</div>
            </div>
          </div>
          <X size={15} onClick={onClose} style={{ cursor: 'pointer', color: '#00f2ff', opacity: 0.6 }} />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
            <BrainCircuit size={42} color="#00f2ff" style={{ animation: 'spin 2.5s linear infinite' }} />
            <p style={{ fontSize: '9px', letterSpacing: '2px', opacity: 0.6, marginTop: '14px', textAlign: 'center' }}>
              RUNNING FORECAST MODEL...<br />
              <span style={{ opacity: 0.4, fontSize: '8px' }}>ANALYZING {issues.length} CIVIC REPORTS</span>
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', padding: '16px' }}>
            <div style={{ fontSize: '8px', letterSpacing: '2px', color: '#ef4444', marginBottom: '6px' }}>⚠ ERROR</div>
            <p style={{ fontSize: '10px', opacity: 0.75, margin: 0, lineHeight: 1.6 }}>{error}</p>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && insights && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} style={tabBtn(t)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <>
                {/* Alert banner */}
                <div style={{ background: insights.trend === 'increasing' ? 'rgba(239,68,68,0.08)' : insights.trend === 'decreasing' ? 'rgba(34,197,94,0.07)' : 'rgba(0,242,255,0.06)', border: `1px solid ${insights.trend === 'increasing' ? 'rgba(239,68,68,0.3)' : insights.trend === 'decreasing' ? 'rgba(34,197,94,0.3)' : 'rgba(0,242,255,0.2)'}`, padding: '10px 12px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <TrendingUp size={14} color={insights.trend === 'increasing' ? '#ef4444' : insights.trend === 'decreasing' ? '#22c55e' : '#00f2ff'} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '10px', lineHeight: 1.65, margin: 0, opacity: 0.9 }}>{insights.forecast}</p>
                </div>

                {/* KPIs */}
                {sectionTitle('CURRENT SNAPSHOT')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  {kpiCard('TOTAL', issues.length, '#00f2ff')}
                  {kpiCard('PENDING', insights.pendingCount, '#ef4444')}
                  {kpiCard('HOTSPOTS', (insights.hotspots || []).length, '#f97316')}
                  {kpiCard('TREND', insights.trend === 'increasing' ? `+${insights.trendPct}%` : insights.trend === 'decreasing' ? `${insights.trendPct}%` : 'STABLE', insights.trend === 'increasing' ? '#ef4444' : insights.trend === 'decreasing' ? '#22c55e' : '#00f2ff')}
                </div>

                {/* 7-day sparkline */}
                {sectionTitle('7-DAY ACTIVITY', BarChart3)}
                <div style={{ background: 'rgba(0,242,255,0.03)', border: '1px solid rgba(0,242,255,0.1)', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '48px' }}>
                    {insights.dayBuckets.map((v, i) => {
                      const max = Math.max(...insights.dayBuckets, 1);
                      const h = Math.max(4, (v / max) * 44);
                      const isLast = i === insights.dayBuckets.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '100%', height: `${h}px`, background: isLast ? '#00f2ff' : `rgba(0,242,255,${0.2 + 0.5 * (v / max)})`, borderRadius: '2px 2px 0 0', transition: 'height 0.4s' }} />
                          <span style={{ fontSize: '7px', opacity: 0.35 }}>{['D-6','D-5','D-4','D-3','D-2','D-1','TODAY'][i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top hotspot preview */}
                {insights.hotspots[0] && (
                  <>
                    {sectionTitle('TOP HOTSPOT', MapPin)}
                    <div style={{ border: `1px solid ${riskColor(insights.hotspots[0].risk)}44`, background: `${riskColor(insights.hotspots[0].risk)}0a`, padding: '10px 12px', cursor: 'pointer' }}
                      onClick={() => setActiveTab('zones')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{insights.hotspots[0].area}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '8px', color: riskColor(insights.hotspots[0].risk), letterSpacing: '1px', padding: '1px 6px', border: `1px solid ${riskColor(insights.hotspots[0].risk)}44`, background: `${riskColor(insights.hotspots[0].risk)}14` }}>{(insights.hotspots[0].risk || '').toUpperCase()}</span>
                          <ChevronRight size={11} color="#00f2ff" opacity={0.4} />
                        </div>
                      </div>
                      <p style={{ fontSize: '9px', opacity: 0.6, margin: 0, lineHeight: 1.5 }}>{insights.hotspots[0].reason}</p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── HOTSPOTS TAB ── */}
            {activeTab === 'zones' && (
              <>
                {/* Filter chips */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {['all','high','medium','low'].map(r => (
                    <button key={r} onClick={() => setFilterRisk(r)} style={{ padding: '4px 10px', fontSize: '8px', letterSpacing: '1.5px', fontFamily: "'Share Tech Mono',monospace", cursor: 'pointer', border: filterRisk === r ? `1px solid ${r === 'all' ? '#00f2ff' : riskColor(r)}` : '1px solid rgba(0,242,255,0.2)', background: filterRisk === r ? (r === 'all' ? 'rgba(0,242,255,0.14)' : `${riskColor(r)}14`) : 'transparent', color: filterRisk === r ? (r === 'all' ? '#00f2ff' : riskColor(r)) : 'rgba(0,242,255,0.4)', borderRadius: '2px' }}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Zone cards */}
                {(insights.hotspots || [])
                  .filter(h => filterRisk === 'all' || h.risk === filterRisk)
                  .map((h, idx) => {
                    const rc = riskColor(h.risk);
                    const isSelected = selZone === idx;
                    return (
                      <div key={idx} onClick={() => setSelZone(isSelected ? null : idx)}
                        style={{ border: `1px solid ${isSelected ? rc : rc + '33'}`, background: isSelected ? `${rc}12` : `${rc}07`, padding: '10px 12px', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={11} color={rc} />
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{h.area}</span>
                          </div>
                          <span style={{ fontSize: '8px', color: rc, letterSpacing: '1px', padding: '1px 6px', border: `1px solid ${rc}44`, background: `${rc}14` }}>{(h.risk || '').toUpperCase()}</span>
                        </div>
                        <p style={{ fontSize: '9px', opacity: 0.6, margin: 0, lineHeight: 1.5, marginBottom: '8px' }}>{h.reason}</p>
                        {/* Stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(0,242,255,0.1)' }}>
                          {[['REPORTS', h.reports], ['PENDING', h.pending], ['RISK', `${h.risk?.toUpperCase()}`]].map(([l, v]) => (
                            <div key={l} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: l === 'RISK' ? rc : '#00f2ff' }}>{v}</div>
                              <div style={{ fontSize: '7px', opacity: 0.4, letterSpacing: '1px', marginTop: '2px' }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        {/* Expanded detail */}
                        {isSelected && (
                          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,242,255,0.1)' }}>
                            <div style={{ fontSize: '8px', opacity: 0.45, letterSpacing: '1px', marginBottom: '6px' }}>ZONE DETAIL</div>
                            <div style={{ fontSize: '9px', opacity: 0.7, lineHeight: 1.6 }}>
                              Primary category: <span style={{ color: '#00f2ff' }}>{h.topCat}</span><br />
                              High urgency: <span style={{ color: h.highUrgency > 0 ? '#ef4444' : '#22c55e' }}>{h.highUrgency}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                {(insights.hotspots || []).filter(h => filterRisk === 'all' || h.risk === filterRisk).length === 0 && (
                  <div style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '1px', textAlign: 'center', padding: '20px 0' }}>NO ZONES MATCH THIS FILTER</div>
                )}
              </>
            )}

            {/* ── TRENDS TAB ── */}
            {activeTab === 'trends' && (
              <>
                {sectionTitle('CATEGORY BREAKDOWN', Tag)}
                <div style={{ marginBottom: '16px' }}>
                  {Object.entries(insights.catCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const max = Math.max(...Object.values(insights.catCounts), 1);
                      const pct = (count / max) * 100;
                      return (
                        <div key={cat} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', opacity: 0.6, marginBottom: '4px', letterSpacing: '1px' }}>
                            <span>{cat.toUpperCase()}</span>
                            <span>{count}</span>
                          </div>
                          <MiniBar pct={pct} color="linear-gradient(90deg,#00a8b5,#00f2ff)" />
                        </div>
                      );
                    })}
                </div>

                {sectionTitle('SIGNAL TRACKER', Activity)}
                {[
                  { label: 'REPORT VOLUME', value: `+${insights.trendPct >= 0 ? insights.trendPct : 0}%`, color: insights.trend === 'increasing' ? '#ef4444' : insights.trend === 'decreasing' ? '#22c55e' : '#00f2ff', status: insights.trend.toUpperCase(), days: insights.dayBuckets },
                  { label: 'PENDING RATE', value: issues.length ? `${Math.round((insights.pendingCount / issues.length) * 100)}%` : '0%', color: insights.pendingCount / issues.length > 0.5 ? '#f97316' : '#22c55e', status: insights.pendingCount / issues.length > 0.5 ? 'ELEVATED' : 'NORMAL', days: insights.dayBuckets.map(v => Math.round(v * 0.6)) },
                  { label: 'ZONE SPREAD', value: `${insights.hotspots.length} ZONES`, color: '#00f2ff', status: 'STABLE', days: Array(7).fill(insights.hotspots.length) },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(0,242,255,0.08)' }}>
                    <span style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1px', minWidth: '100px' }}>{item.label}</span>
                    <SparkBars data={item.days} color={item.color} />
                    <div style={{ textAlign: 'right', minWidth: '64px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '7px', color: item.color, opacity: 0.65, letterSpacing: '1px' }}>{item.status}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '14px' }}>
                  {sectionTitle('TRENDING CATEGORY', Tag)}
                  <span style={{ fontSize: '10px', padding: '5px 12px', background: 'rgba(0,242,255,0.12)', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.3)', display: 'inline-block', letterSpacing: '1px' }}>
                    ▲ {insights.trending_category}
                  </span>
                </div>
              </>
            )}

            {/* ── ACTIONS TAB ── */}
            {activeTab === 'actions' && (
              <>
                {sectionTitle('AI RECOMMENDATIONS', Lightbulb)}

                {/* Priority action */}
                {recBox(AlertTriangle, '#ef4444', 'PRIORITY ACTION', insights.recommendation)}

                {/* Data quality flag */}
                {insights.dataQualityFlag && recBox(Tag, '#f97316', 'DATA QUALITY FLAG', insights.dataQualityFlag)}

                {/* Pending workload */}
                {recBox(Clock, '#00f2ff', '7-DAY OUTLOOK',
                  insights.trend === 'increasing'
                    ? `Volume up ${insights.trendPct}% this week. Pre-position additional response capacity in top hotspot zones before the trend peaks.`
                    : insights.trend === 'decreasing'
                    ? `Volume declining. Focus remaining capacity on clearing ${insights.pendingCount} unresolved pending issues before week-end.`
                    : `Volume stable. Maintain current response capacity and focus on clearing ${insights.pendingCount} pending backlog.`
                )}

                {/* Zone deployment table */}
                {(insights.hotspots || []).length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {sectionTitle('DEPLOYMENT PRIORITY', Users)}
                    {insights.hotspots.map((h, i) => {
                      const rc = riskColor(h.risk);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid rgba(0,242,255,0.08)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00f2ff', minWidth: '18px', opacity: 0.5 }}>#{i + 1}</span>
                          <MapPin size={10} color={rc} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '10px', flex: 1 }}>{h.area}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '8px', color: rc, letterSpacing: '1px' }}>{(h.risk || '').toUpperCase()}</span>
                            <span style={{ fontSize: '8px', opacity: 0.4 }}>{h.reports}R / {h.pending}P</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── IMPACT DASHBOARD ──────────────────────────────────────────────────────────
function ImpactDashboard({ issues, onClose }) {
  const stats = useMemo(() => {
    const byCat = {}, byStatus = { pending:0, verified:0, resolved:0 };
    let resolvedDurations = [];
    issues.forEach(i => {
      const cat = i.ai_category || 'Other';
      byCat[cat] = (byCat[cat] || 0) + 1;
      const s = (i.status || 'pending').toLowerCase();
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (s === 'resolved' && i.updated_at && i.created_at) {
        const d = (new Date(i.updated_at) - new Date(i.created_at)) / 36e5;
        if (d > 0) resolvedDurations.push(d);
      }
    });
    const avgResHrs = resolvedDurations.length ? resolvedDurations.reduce((a,b)=>a+b,0)/resolvedDurations.length : null;
    const resolutionRate = issues.length ? Math.round((byStatus.resolved/issues.length)*100) : 0;
    const topCats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const maxCat = topCats.length ? topCats[0][1] : 1;
    return { byStatus, avgResHrs, resolutionRate, topCats, maxCat, total: issues.length };
  }, [issues]);

  return (
    <div style={S.modalOverlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{...S.formPanel, width:'440px', maxHeight:'82vh', overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <BarChart3 size={14} color="#00f2ff"/>
            <span style={{fontSize:'10px',fontWeight:'bold',letterSpacing:'3px'}}>IMPACT DASHBOARD</span>
          </div>
          <X size={15} onClick={onClose} style={{cursor:'pointer',color:'#00f2ff',opacity:0.6}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'18px'}}>
          <MiniStat label="TOTAL ISSUES"    value={stats.total} color="#00f2ff"/>
          <MiniStat label="RESOLUTION RATE" value={`${stats.resolutionRate}%`} color="#22c55e"/>
          <MiniStat label="AVG RESOLVE"     value={stats.avgResHrs?`${stats.avgResHrs.toFixed(1)}h`:'—'} color="#f97316"/>
        </div>
        <div style={{marginBottom:'18px'}}>
          <div style={S.dashSectionTitle}>STATUS BREAKDOWN</div>
          {Object.entries(STATUS).map(([k,cfg])=>{
            const v=stats.byStatus[k]||0, pct=stats.total?(v/stats.total)*100:0;
            return(
              <div key={k} style={{marginBottom:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'8px',opacity:0.6,marginBottom:'3px',letterSpacing:'1px'}}>
                  <span>{cfg.label}</span><span>{v}</span>
                </div>
                <div style={{height:'6px',background:'rgba(0,242,255,0.08)',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:cfg.color,boxShadow:`0 0 6px ${cfg.color}`,transition:'width 0.4s'}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <div style={S.dashSectionTitle}>TOP CATEGORIES (AI-CLASSIFIED)</div>
          {stats.topCats.length===0&&<div style={{fontSize:'9px',opacity:0.4,letterSpacing:'1px'}}>NO DATA YET</div>}
          {stats.topCats.map(([cat,v])=>{
            const pct=(v/stats.maxCat)*100;
            return(
              <div key={cat} style={{marginBottom:'7px'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'8px',opacity:0.6,marginBottom:'3px',letterSpacing:'1px'}}>
                  <span>{cat.toUpperCase()}</span><span>{v}</span>
                </div>
                <div style={{height:'5px',background:'rgba(0,242,255,0.08)',borderRadius:'2px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#00a8b5,#00f2ff)'}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{border:`1px solid ${color}33`,background:`${color}0c`,padding:'10px 8px',textAlign:'center'}}>
      <div style={{fontSize:'17px',fontWeight:'bold',color}}>{value}</div>
      <div style={{fontSize:'7px',opacity:0.5,letterSpacing:'1px',marginTop:'4px'}}>{label}</div>
    </div>
  );
}

function Leaderboard({ onClose, currentUserId }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, role, karma_points')
        .order('karma_points', { ascending: false })
        .limit(20);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={S.modalOverlay} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{...S.formPanel,width:'380px',maxHeight:'80vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <Trophy size={14} color="#00f2ff"/>
            <span style={{fontSize:'10px',fontWeight:'bold',letterSpacing:'3px'}}>LEADERBOARD</span>
          </div>
          <X size={15} onClick={onClose} style={{cursor:'pointer',color:'#00f2ff',opacity:0.6}}/>
        </div>
        {loading && <p style={{fontSize:'9px',opacity:0.5,letterSpacing:'2px'}}>LOADING RANKINGS...</p>}
        {!loading && rows.map((r,idx)=>{
          const badge=badgeFor(r.karma_points||0), isMe=r.id===currentUserId;
          return(
            <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 10px',marginBottom:'6px',background:isMe?'rgba(0,242,255,0.1)':'rgba(0,242,255,0.03)',border:`1px solid ${isMe?'rgba(0,242,255,0.4)':'rgba(0,242,255,0.1)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'11px',fontWeight:'bold',width:'18px',opacity:idx<3?1:0.5,color:idx===0?'#ffd700':idx===1?'#c0c0c0':idx===2?'#cd7f32':'#00f2ff'}}>#{idx+1}</span>
                <span style={{fontSize:'14px'}}>{badge.icon}</span>
                <div>
                  <div style={{fontSize:'10px',fontWeight:isMe?'bold':'normal'}}>UNIT_{r.id.slice(0,6).toUpperCase()} {isMe&&'(YOU)'}</div>
                  <div style={{fontSize:'7px',opacity:0.4,letterSpacing:'1px'}}>{badge.name} · {r.role?.toUpperCase()||'CITIZEN'}</div>
                </div>
              </div>
              <div style={{fontSize:'11px',color:'#00f2ff',fontWeight:'bold'}}>{r.karma_points||0} XP</div>
            </div>
          );
        })}
        {!loading&&rows.length===0&&<p style={{fontSize:'9px',opacity:0.4,letterSpacing:'1px'}}>NO UNITS REGISTERED YET.</p>}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user,            setUser]            = useState(null);
  const [issues,          setIssues]          = useState([]);
  const [showForm,        setShowForm]        = useState(false);
  const [coords,          setCoords]          = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [aiLoading,       setAiLoading]       = useState(false);
  const [booting,         setBooting]         = useState(true);
  const [bootPct,         setBootPct]         = useState(0);
  const [karma,           setKarma]           = useState(0);
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [portal,          setPortal]          = useState('citizen');
  const [toast,           setToast]           = useState(null);
  const [hovered,         setHovered]         = useState(null);
  const [imgPreview,      setImgPreview]      = useState(null);
  const [videoPreview,    setVideoPreview]    = useState(null);
  const [desc,            setDesc]            = useState('');
  const [showDashboard,   setShowDashboard]   = useState(false);
  const [showInsights,    setShowInsights]    = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const mapRef = useRef(null);
  const BOOT_MS = 3200;

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now()-start)/BOOT_MS)*100);
      setBootPct(pct);
      if (pct >= 100) { clearInterval(tick); setTimeout(()=>setBooting(false), 100); }
    }, 30);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => { if (session) fetchProfile(session.user); });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) fetchProfile(session.user); else setUser(null);
    });
    fetchIssues();
    const channel = supabase
      .channel('issues-rt')
      .on('postgres_changes', { event:'*', schema:'public', table:'issues' }, ()=>fetchIssues())
      .subscribe();
    return () => { subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase.from('issues').select('*').order('created_at', { ascending:false });
    if (data) setIssues(data);
  };

  const fetchProfile = async (authUser) => {
    const { data } = await supabase.from('profiles').select('role,karma_points').eq('id', authUser.id).single();
    setUser({ ...authUser, role: data?.role ?? 'citizen' });
    setKarma(data?.karma_points ?? 0);
  };

  const handleAuth = async (type) => {
    setLoading(true);
    const { error } = type === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options:{ data:{ role:portal } } });
    if (error) setToast(`⚠ ${error.message}`);
    setLoading(false);
  };

  const handleMapClick = useCallback((latlng) => {
    setCoords(latlng); setShowForm(true);
  }, []);

  const handleSubmit = async () => {
    if (!desc.trim()) { setToast('⚠ DESCRIPTION REQUIRED'); return; }
    if (!coords)      { setToast('⚠ CLICK MAP TO SET LOCATION'); return; }
    const imgEl = document.getElementById('cg-img');
    const vidEl = document.getElementById('cg-video');
    setLoading(true);
    let imageUrl=null, videoUrl=null;
    try {
      const imageFile = imgEl?.files?.[0];
      if (imageFile?.size > 0) {
        const ext=imageFile.name.split('.').pop();
        const path=`${user.id}/${Date.now()}-img.${ext}`;
        const { error:upErr } = await supabase.storage.from('issue-images').upload(path, imageFile);
        if (!upErr) { const { data:u } = supabase.storage.from('issue-images').getPublicUrl(path); imageUrl=u.publicUrl; }
      }
      const videoFile = vidEl?.files?.[0];
      if (videoFile?.size > 0) {
        const ext=videoFile.name.split('.').pop();
        const path=`${user.id}/${Date.now()}-vid.${ext}`;
        const { error:upErr } = await supabase.storage.from('issue-videos').upload(path, videoFile);
        if (!upErr) { const { data:u } = supabase.storage.from('issue-videos').getPublicUrl(path); videoUrl=u.publicUrl; }
      }

      setAiLoading(true);
      const ai = await analyzeIssueWithAI(desc.trim());
      setAiLoading(false);

      const { data:inserted, error:insertErr } = await supabase.from('issues').insert([{
        description: desc.trim(), latitude: coords.lat, longitude: coords.lng,
        status: 'pending', user_id: user.id, title: 'CIVIC_ALERT',
        ai_category: ai.category||'Other', ai_urgency: ai.urgency||'medium', ai_summary: ai.summary||'',
        ...(imageUrl && { image_url: imageUrl }),
        ...(videoUrl && { video_url: videoUrl }),
      }]).select();
      if (insertErr) throw insertErr;
      if (inserted?.[0]) setIssues(prev=>[inserted[0],...prev]);
      setShowForm(false); setDesc(''); setImgPreview(null); setVideoPreview(null);
      setToast(`✓ ALERT TRANSMITTED · AI: ${ai.category} · ${(ai.urgency||'').toUpperCase()}`);
    } catch (err) {
      setAiLoading(false);
      setToast(`⚠ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (issueId, newStatus) => {
    setIssues(prev=>prev.map(i=>i.id===issueId?{...i,status:newStatus}:i));
    const { error } = await supabase.from('issues').update({ status:newStatus, updated_at:new Date().toISOString() }).eq('id', issueId);
    if (error) {
      setIssues(prev=>prev.map(i=>i.id===issueId?{...i,status:'pending'}:i));
      setToast(`⚠ ${error.message}`); return;
    }
    if (newStatus === 'verified') {
      const nk=karma+10;
      await supabase.from('profiles').update({ karma_points:nk }).eq('id', user.id);
      setKarma(nk);
      setToast(`✓ VERIFIED — +10 XP · ${badgeFor(nk).icon} ${badgeFor(nk).name}`);
    } else {
      const nk=karma+15;
      await supabase.from('profiles').update({ karma_points:nk }).eq('id', user.id);
      setKarma(nk);
      setToast('✓ ISSUE MARKED RESOLVED · +15 XP');
    }
  };

  const ho = (key) => ({ onMouseEnter:()=>setHovered(key), onMouseLeave:()=>setHovered(null) });
  const myBadge = badgeFor(karma);

  if (booting) return <HUDLoader progress={bootPct}/>;

  if (!user) return (
    <div style={{position:'relative',height:'100vh',width:'100vw',overflow:'hidden',fontFamily:"'Share Tech Mono',monospace",background:'#0d1515'}}>
      <LoginBG/>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <div style={{position:'relative',zIndex:10,height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:'360px',background:'rgba(13,21,21,0.88)',border:'1px solid rgba(0,242,255,0.4)',boxShadow:'0 0 60px rgba(0,242,255,0.1)',padding:'40px 36px 36px',backdropFilter:'blur(12px)',animation:'panelIn 0.6s cubic-bezier(0.16,1,0.3,1) both',position:'relative',overflow:'hidden'}}>
          {[['0','auto','auto','0'],['0','auto','0','auto'],['auto','0','auto','0'],['auto','0','0','auto']].map((d,i)=>(
            <div key={i} style={cornerDeco(...d)}/>
          ))}
          <div style={{textAlign:'center',marginBottom:'28px'}}>
            <div style={{width:'56px',height:'56px',margin:'0 auto 14px',border:'2px solid #00f2ff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 24px rgba(0,242,255,0.3)',animation:'iconPulse 3s ease-in-out infinite',background:'rgba(0,242,255,0.06)'}}>
              <ShieldAlert color="#00f2ff" size={26}/>
            </div>
            <h1 style={{letterSpacing:'6px',fontSize:'16px',color:'#00f2ff',margin:'0 0 4px',textShadow:'0 0 20px rgba(0,242,255,0.5)'}}>CIVIC GUARD</h1>
            <div style={{fontSize:'7px',opacity:0.35,letterSpacing:'2px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
              <Cpu size={8}/> AI-POWERED CIVIC MANAGEMENT
            </div>
          </div>
          <div style={{display:'flex',border:'1px solid rgba(0,242,255,0.25)',marginBottom:'20px',borderRadius:'2px',overflow:'hidden'}}>
            {['citizen','worker'].map(p=>{
              const active=portal===p;
              return(
                <button key={p} onClick={()=>setPortal(p)} {...ho(`p-${p}`)} style={{flex:1,padding:'11px',border:'none',fontSize:'9px',fontWeight:'bold',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",letterSpacing:'2px',background:active?'linear-gradient(135deg,#00f2ff 0%,#0099bb 100%)':hovered===`p-${p}`?'rgba(0,242,255,0.1)':'transparent',color:active?'#0d1515':'#00f2ff',transition:'all 0.25s ease'}}>{p.toUpperCase()}</button>
              );
            })}
          </div>
          {['email','password'].map(field=>(
            <div key={field} style={{position:'relative',marginBottom:'12px'}}>
              <input type={field} placeholder={field==='email'?'USER_ID':'ACCESS_CODE'}
                onChange={e=>field==='email'?setEmail(e.target.value):setPassword(e.target.value)}
                style={{width:'100%',boxSizing:'border-box',background:'rgba(0,242,255,0.04)',border:'1px solid rgba(0,242,255,0.2)',padding:'12px 14px',color:'#00f2ff',fontSize:'11px',outline:'none',fontFamily:"'Share Tech Mono',monospace",letterSpacing:'1px',transition:'all 0.2s',borderRadius:'2px'}}
                onFocus={e=>{e.target.style.borderColor='#00f2ff';e.target.style.boxShadow='0 0 0 1px rgba(0,242,255,0.2),0 0 16px rgba(0,242,255,0.1)';}}
                onBlur={e=>{e.target.style.borderColor='rgba(0,242,255,0.2)';e.target.style.boxShadow='none';}}
              />
            </div>
          ))}
          <button onClick={()=>handleAuth('login')} disabled={loading} {...ho('login')} style={{width:'100%',padding:'13px',background:hovered==='login'?'rgba(0,242,255,0.18)':'rgba(0,242,255,0.08)',border:`1.5px solid ${hovered==='login'?'#00f2ff':'rgba(0,242,255,0.5)'}`,color:'#00f2ff',fontWeight:'bold',cursor:loading?'not-allowed':'pointer',letterSpacing:'3px',fontSize:'10px',fontFamily:"'Share Tech Mono',monospace",transition:'all 0.2s',marginBottom:'12px',borderRadius:'2px'}}>
            {loading?'[ AUTHENTICATING... ]':'[ INITIALIZE_AUTH ]'}
          </button>
          <div style={{textAlign:'center'}}>
            <button onClick={()=>handleAuth('signup')} disabled={loading} {...ho('signup')} style={{background:'none',border:'none',color:'#00f2ff',fontSize:'8px',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",letterSpacing:'2px',opacity:hovered==='signup'?0.9:0.4,textDecoration:hovered==='signup'?'underline':'none',transition:'all 0.2s'}}>
              ↗ REGISTER_NEW_UNIT
            </button>
          </div>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,#00f2ff,transparent)',animation:'statusBar 3s ease-in-out infinite',opacity:0.6}}/>
        </div>
      </div>
      <style>{loginCSS}</style>
    </div>
  );

  const counts = Object.fromEntries(
    Object.keys(STATUS).map(k=>[k, issues.filter(i=>(i.status||'pending').toLowerCase()===k).length])
  );

  return (
    <div style={S.appContainer}>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      {showDashboard   && <ImpactDashboard        issues={issues} onClose={()=>setShowDashboard(false)}/>}
      {showInsights    && <PredictiveInsightsPanel issues={issues} onClose={()=>setShowInsights(false)}/>}
      {showLeaderboard && <Leaderboard onClose={()=>setShowLeaderboard(false)} currentUserId={user.id}/>}

      <header style={S.header}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <Activity color="#00f2ff" style={{animation:'pulse 2s infinite'}} size={15}/>
          <span style={{display:'flex',alignItems:'center',fontSize:'9px',fontWeight:'bold',letterSpacing:'2px',opacity:0.7}}>
            {user.role==='worker'?<Wrench size={11} style={{marginRight:4}}/>:<Shield size={11} style={{marginRight:4}}/>}
            UNIT_{user.role.toUpperCase()}
          </span>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
          <div style={{letterSpacing:'4px',fontWeight:'bold',fontSize:'11px',color:'#00f2ff'}}>CIVIC GUARD</div>
          <div style={{fontSize:'7px',opacity:0.35,letterSpacing:'2px',display:'flex',alignItems:'center',gap:'4px'}}>
            <Cpu size={8}/> AI-POWERED
          </div>
        </div>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <button onClick={()=>setShowDashboard(true)}   {...ho('dash')}     style={S.headerIconBtn(hovered==='dash')}     title="Impact Dashboard"><BarChart3  size={13}/></button>
          <button onClick={()=>setShowInsights(true)}    {...ho('insights')} style={S.headerIconBtn(hovered==='insights')} title="Predictive Insights"><Sparkles size={13}/></button>
          <button onClick={()=>setShowLeaderboard(true)} {...ho('lead')}     style={S.headerIconBtn(hovered==='lead')}     title="Leaderboard"><Trophy      size={13}/></button>
          <div style={{color:'#00f2ff',fontSize:'11px',letterSpacing:'1px',display:'flex',alignItems:'center',gap:'4px'}}>
            <Zap size={11} color="#f97316"/> {karma} XP <span style={{fontSize:'12px'}}>{myBadge.icon}</span>
          </div>
          <LogOut size={15} onClick={()=>supabase.auth.signOut()} {...ho('logout')} style={{cursor:'pointer',opacity:hovered==='logout'?1:0.4,color:hovered==='logout'?'#ef4444':'#00f2ff',transition:'all 0.2s'}}/>
        </div>
      </header>

      <div style={S.roleBanner}>
        {user.role==='citizen'
          ?<><Eye size={9} style={{marginRight:5}}/>TAP MAP TO REPORT AN ISSUE · CLICK ANY RED MARKER TO VERIFY IT</>
          :<><Wrench size={9} style={{marginRight:5}}/>CLICK ORANGE MARKERS TO MARK VERIFIED ISSUES AS RESOLVED</>}
      </div>

      <div style={{flex:1,position:'relative',overflow:'hidden',minHeight:0}}>
        <MapContainer center={[12.9716,77.5946]} zoom={13} minZoom={3} maxZoom={19}
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}} ref={mapRef} closePopupOnClick={false}>
          <MapInvalidate/>
          {/*
            FIXED: Stadia Maps requires the requesting domain to be registered
            in their dashboard, or it throws a 401 on any domain it doesn't
            recognize (which is what was happening on the deployed site).
            Switched to CartoDB's dark tiles — free, no API key, and works
            on any domain out of the box.
          */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={20}
            subdomains="abcd"
            className="cg-tiles"
          />
          {issues.filter(i=>i.latitude!=null&&i.longitude!=null).map(i=>(
            <Marker key={i.id} position={[+i.latitude,+i.longitude]} icon={markerIcon(i.status)}>
              <Popup minWidth={230} maxWidth={270} autoPan={true}>
                <IssuePopup issue={i} userRole={user.role} onAction={handleAction}/>
              </Popup>
            </Marker>
          ))}
          <MapEvents onMapClick={handleMapClick} canReport={user.role==='citizen'} onWorkerClick={()=>setToast('ℹ WORKER MODE — click an orange marker to resolve it')}/>
        </MapContainer>

        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(180deg, rgba(0,242,255,0.02) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,242,255,0.02) 100%)',
          pointerEvents:'none',zIndex:400,
        }}/>

        <div style={S.legend}>
          {Object.entries(STATUS).map(([k,cfg])=>(
            <div key={k} style={{display:'flex',alignItems:'center',gap:'7px'}}>
              <div style={{width:9,height:9,borderRadius:'50%',backgroundColor:cfg.color,boxShadow:`0 0 5px ${cfg.color}`,...(k==='pending'?{animation:'m-blink 1.6s infinite'}:{})}}/>
              <span style={{fontSize:'8px',opacity:0.65,letterSpacing:'1px'}}>{cfg.label} <span style={{opacity:0.45}}>({counts[k]})</span></span>
            </div>
          ))}
        </div>

        <div style={S.statsPanel}>
          {Object.entries(STATUS).map(([k,cfg])=>(
            <div key={k} style={{textAlign:'center'}}>
              <div style={{fontSize:'18px',fontWeight:'bold',color:cfg.color,lineHeight:1}}>{counts[k]}</div>
              <div style={{fontSize:'7px',opacity:0.45,letterSpacing:'1px',marginTop:'2px'}}>{cfg.label}</div>
            </div>
          ))}
          <div style={{width:'1px',background:'rgba(0,242,255,0.15)',alignSelf:'stretch',margin:'0 4px'}}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'18px',fontWeight:'bold',color:'#00f2ff',lineHeight:1}}>{issues.length}</div>
            <div style={{fontSize:'7px',opacity:0.45,letterSpacing:'1px',marginTop:'2px'}}>TOTAL</div>
          </div>
        </div>

        {showForm && (
          <div style={S.modalOverlay} onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setImgPreview(null);setVideoPreview(null);}}}>
            <div style={S.formPanel}>
              {(loading||aiLoading) && (
                <div style={S.loaderOverlay}>
                  <BrainCircuit size={46} color="#00f2ff" style={{animation:'spin 2.5s linear infinite'}}/>
                  <h3 style={{fontSize:'10px',letterSpacing:'3px',marginTop:'14px',color:'#00f2ff'}}>
                    {aiLoading?'AI ANALYZING...':'TRANSMITTING...'}
                  </h3>
                  {aiLoading&&<p style={{fontSize:'8px',opacity:0.45,letterSpacing:'2px',marginTop:'6px'}}>CLASSIFYING · ESTIMATING URGENCY</p>}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <div>
                  <span style={{fontSize:'9px',fontWeight:'bold',letterSpacing:'3px'}}>NEW ALERT</span>
                  <div style={{fontSize:'7px',opacity:0.35,letterSpacing:'2px',marginTop:'2px',display:'flex',alignItems:'center',gap:'4px'}}>
                    <Cpu size={7}/> AI WILL AUTO-CLASSIFY
                  </div>
                </div>
                <X size={15} onClick={()=>{setShowForm(false);setImgPreview(null);setVideoPreview(null);}} style={{cursor:'pointer',opacity:0.5,color:'#00f2ff',transition:'all 0.2s'}}/>
              </div>
              {coords && (
                <div style={{fontSize:'8px',opacity:0.4,marginBottom:'12px',letterSpacing:'1px'}}>
                  📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </div>
              )}
              <textarea value={desc} onChange={e=>setDesc(e.target.value)}
                placeholder="[ DESCRIBE THE CIVIC ISSUE IN DETAIL ]"
                style={{...S.cyberInput,resize:'none',width:'100%',boxSizing:'border-box'}} rows={3}/>
              <label style={{fontSize:'9px',opacity:0.45,letterSpacing:'2px',display:'flex',alignItems:'center',gap:'5px',marginBottom:'6px'}}>
                <ImageIcon size={10}/> ATTACH PHOTO (optional)
              </label>
              <input id="cg-img" type="file" accept="image/*"
                style={{fontSize:'9px',color:'#00f2ff',opacity:0.65,marginBottom:'10px',display:'block'}}
                onChange={e=>{const f=e.target.files?.[0];setImgPreview(f?URL.createObjectURL(f):null);}}/>
              {imgPreview && (
                <div style={{marginBottom:'12px',border:'1px solid rgba(0,242,255,0.25)',overflow:'hidden'}}>
                  <img src={imgPreview} alt="Preview" style={{width:'100%',maxHeight:'110px',objectFit:'cover',display:'block'}}/>
                </div>
              )}
              <label style={{fontSize:'9px',opacity:0.45,letterSpacing:'2px',display:'flex',alignItems:'center',gap:'5px',marginBottom:'6px'}}>
                <VideoIcon size={10}/> ATTACH VIDEO (optional)
              </label>
              <input id="cg-video" type="file" accept="video/*"
                style={{fontSize:'9px',color:'#00f2ff',opacity:0.65,marginBottom:'10px',display:'block'}}
                onChange={e=>{const f=e.target.files?.[0];setVideoPreview(f?URL.createObjectURL(f):null);}}/>
              {videoPreview && (
                <div style={{marginBottom:'12px',border:'1px solid rgba(0,242,255,0.25)',overflow:'hidden'}}>
                  <video src={videoPreview} controls style={{width:'100%',maxHeight:'110px',display:'block',background:'#000'}}/>
                </div>
              )}
              <button onClick={handleSubmit} {...ho('tx')} style={{...S.primaryBtn,width:'100%',background:hovered==='tx'?'rgba(0,242,255,0.2)':'rgba(0,242,255,0.08)',transform:hovered==='tx'?'translateY(-1px)':'none',transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                <BrainCircuit size={12}/> TRANSMIT + AI SCAN
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{globalCSS}</style>
    </div>
  );
}

function cornerDeco(top, bottom, right, left) {
  return {
    position:'absolute', width:'12px', height:'12px', top, bottom, right, left,
    borderTop:    top    !=='auto'?'1px solid rgba(0,242,255,0.5)':'none',
    borderBottom: bottom !=='auto'?'1px solid rgba(0,242,255,0.5)':'none',
    borderRight:  right  !=='auto'?'1px solid rgba(0,242,255,0.5)':'none',
    borderLeft:   left   !=='auto'?'1px solid rgba(0,242,255,0.5)':'none',
  };
}

const C = { cyan:'#00f2ff', bg:'#0d1515', border:'rgba(0,242,255,0.2)' };
const S = {
  appContainer:   { height:'100vh',width:'100vw',display:'flex',flexDirection:'column',background:C.bg,color:C.cyan,fontFamily:"'Share Tech Mono',monospace",overflow:'hidden',margin:0,padding:0,boxSizing:'border-box' },
  header:         { height:'52px',padding:'0 22px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',background:C.bg,zIndex:1000,flexShrink:0 },
  headerIconBtn:  (a)=>({ background:a?'rgba(0,242,255,0.15)':'transparent',border:`1px solid ${a?'rgba(0,242,255,0.5)':'rgba(0,242,255,0.2)'}`,color:'#00f2ff',cursor:'pointer',padding:'5px 7px',display:'flex',alignItems:'center',transition:'all 0.2s',borderRadius:'2px' }),
  roleBanner:     { background:'rgba(0,242,255,0.03)',borderBottom:`1px solid ${C.border}`,padding:'4px 22px',fontSize:'8px',letterSpacing:'1.5px',opacity:0.55,textAlign:'center',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',gap:'4px' },
  cyberInput:     { background:'rgba(0,242,255,0.04)',border:`1px solid ${C.border}`,padding:'10px',color:C.cyan,fontSize:'11px',outline:'none',marginBottom:'10px',fontFamily:"'Share Tech Mono',monospace",transition:'border-color 0.2s',display:'block' },
  primaryBtn:     { padding:'12px',background:'rgba(0,242,255,0.08)',border:`1px solid ${C.cyan}`,color:C.cyan,fontWeight:'bold',cursor:'pointer',letterSpacing:'2px',fontSize:'9px',fontFamily:"'Share Tech Mono',monospace" },
  legend:         { position:'absolute',bottom:'16px',left:'12px',zIndex:999,background:'rgba(13,21,21,0.92)',border:`1px solid ${C.border}`,padding:'10px 14px',display:'flex',flexDirection:'column',gap:'7px',backdropFilter:'blur(6px)' },
  statsPanel:     { position:'absolute',bottom:'16px',right:'12px',zIndex:999,background:'rgba(13,21,21,0.92)',border:`1px solid ${C.border}`,padding:'10px 16px',display:'flex',gap:'16px',alignItems:'center',backdropFilter:'blur(6px)' },
  modalOverlay:   { position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 },
  formPanel:      { width:'310px',background:C.bg,border:`1px solid ${C.cyan}`,padding:'24px',position:'relative',overflow:'hidden',boxShadow:'0 0 40px rgba(0,242,255,0.12)' },
  loaderOverlay:  { position:'absolute',inset:0,background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:100 },
  popup:          { background:'#0d1515',color:'#00f2ff',padding:'12px',fontFamily:"'Share Tech Mono',monospace",fontSize:'11px',minWidth:'220px' },
  popupBtn:       { display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'8px',background:'transparent',border:'1px solid',cursor:'pointer',fontSize:'9px',fontFamily:"'Share Tech Mono',monospace",letterSpacing:'2px',marginTop:'6px',transition:'opacity 0.15s' },
  dashSectionTitle: { fontSize:'8px',letterSpacing:'2px',opacity:0.45,marginBottom:'8px' },
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { margin:0 !important; padding:0 !important; width:100%; height:100%; overflow:hidden; }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%{opacity:1} 50%{opacity:0.3} 100%{opacity:1} }
  @keyframes m-blink { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
  @keyframes cg-blink { 0%{opacity:0.6;transform:scale(0.85)} 50%{opacity:1;transform:scale(1.15)} 100%{opacity:0.6;transform:scale(0.85)} }
  @keyframes toastPop { 0%{opacity:0;transform:translateX(-50%) translateY(-18px) scale(0.9)} 60%{opacity:1;transform:translateX(-50%) translateY(4px) scale(1.02)} 100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
  @keyframes panelIn  { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes iconPulse { 0%,100%{box-shadow:0 0 16px rgba(0,242,255,0.25)} 50%{box-shadow:0 0 32px rgba(0,242,255,0.55),0 0 60px rgba(0,242,255,0.15)} }
  @keyframes statusBar { 0%{transform:scaleX(0);transform-origin:left;opacity:0.6} 50%{transform:scaleX(1);transform-origin:left;opacity:1} 51%{transform:scaleX(1);transform-origin:right} 100%{transform:scaleX(0);transform-origin:right;opacity:0.6} }
  .leaflet-div-icon.cg-marker-wrapper { background:transparent !important; border:none !important; box-shadow:none !important; }
  .cg-dot { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,0.9); }
  .cg-dot-blink { animation:cg-blink 1.6s ease-in-out infinite; }
  .leaflet-popup-content-wrapper { background:#0d1515 !important; border:1px solid rgba(0,242,255,0.4) !important; border-radius:0 !important; box-shadow:0 0 24px rgba(0,242,255,0.12) !important; padding:0 !important; }
  .leaflet-popup-content { margin:0 !important; width:auto !important; }
  .leaflet-popup-tip-container { display:none !important; }
  .leaflet-popup-close-button { color:rgba(0,242,255,0.6) !important; font-size:18px !important; top:6px !important; right:8px !important; }
  .leaflet-popup-close-button:hover { color:#ef4444 !important; }
  .leaflet-container { width:100% !important; height:100% !important; background:#0d1515; }
  .cg-tiles { filter: brightness(1.35) contrast(1.15) saturate(1.1); }
  .leaflet-tile-pane { filter: brightness(1.35) contrast(1.15) saturate(1.1); }
  textarea:focus { border-color:#00f2ff !important; box-shadow:0 0 0 1px rgba(0,242,255,0.2); }
  button:active { transform:scale(0.97) !important; }
  input[type="file"] { cursor:pointer; }
`;

const loginCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  *, *::before, *::after { box-sizing:border-box; }
  html, body, #root { margin:0 !important; padding:0 !important; width:100%; height:100%; overflow:hidden; }
  input::placeholder { color:rgba(0,242,255,0.28); letter-spacing:2px; }
  @keyframes panelIn  { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes iconPulse { 0%,100%{box-shadow:0 0 16px rgba(0,242,255,0.25)} 50%{box-shadow:0 0 32px rgba(0,242,255,0.55),0 0 60px rgba(0,242,255,0.15)} }
  @keyframes statusBar { 0%{transform:scaleX(0);transform-origin:left;opacity:0.6} 50%{transform:scaleX(1);transform-origin:left;opacity:1} 51%{transform:scaleX(1);transform-origin:right} 100%{transform:scaleX(0);transform-origin:right;opacity:0.6} }
  @keyframes toastPop { 0%{opacity:0;transform:translateX(-50%) translateY(-18px) scale(0.9)} 60%{opacity:1;transform:translateX(-50%) translateY(4px) scale(1.02)} 100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
`;
