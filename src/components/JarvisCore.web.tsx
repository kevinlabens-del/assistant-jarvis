import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AssistantState } from '../types/assistant';

type Props = { state: AssistantState };
type Dot = {x:number;y:number;r:number;a:number;phase:number;speed:number;warm:boolean};
type Stream = {side:number;start:number;curve:number;phase:number;a:number};

const W=420, H=720;
const C='56,220,255';
const B='35,129,255';
const O='255,137,18';

function rng(seed:number){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function bodyWidth(y:number){
  if(y<105) return 58*Math.sqrt(Math.max(0,1-((y-104)/94)**2));
  if(y<210) return 62*Math.sqrt(Math.max(0,1-((y-135)/94)**2));
  if(y<280) return 32+Math.max(0,(y-210)*.45);
  if(y<520) return 78+Math.sin((y-280)/240*Math.PI)*95;
  return Math.max(58,172-(y-520)*.55);
}
function inside(x:number,y:number){const cx=210; return Math.abs(x-cx)<bodyWidth(y) && y>18 && y<640;}
function buildDots(){const r=rng(4419),d:Dot[]=[];while(d.length<1500){const y=20+r()*615;const x=35+r()*350;if(!inside(x,y))continue;const edge=1-Math.min(1,Math.abs(x-210)/(bodyWidth(y)||1));d.push({x,y,r:.35+r()*1.2,a:.10+r()*(edge>.75?.55:.32),phase:r()*Math.PI*2,speed:.35+r()*1.4,warm:r()>.985});}return d;}
function buildStreams(){const r=rng(9321),s:Stream[]=[];for(let i=0;i<90;i++)s.push({side:i%2?1:-1,start:70+r()*520,curve:12+r()*34,phase:r()*6.28,a:.035+r()*.12});return s;}
const DOTS=buildDots(), STREAMS=buildStreams();

function energy(state:AssistantState){return ({IDLE:.38,WAKE:.72,LISTENING:.88,UNDERSTANDING:.98,THINKING:1.08,SPEAKING:1.04,ACTION:1.15,ERROR:.95} as Record<AssistantState,number>)[state];}

export function JarvisCore({state}:Props){
  const ref=useRef<any>(null);
  const dots=useMemo(()=>DOTS,[]), streams=useMemo(()=>STREAMS,[]);
  useEffect(()=>{
    const canvas=ref.current as HTMLCanvasElement|null;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
    let raf=0,alive=true;const start=performance.now();
    const glow=(x:number,y:number,r:number,color:string,a:number,blur:number)=>{ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(${color},${a})`;ctx.shadowColor=`rgb(${color})`;ctx.shadowBlur=blur;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();};
    const stroke=(fn:()=>void,color:string,a:number,w:number,blur:number)=>{ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${color},${a})`;ctx.lineWidth=w;ctx.shadowColor=`rgb(${color})`;ctx.shadowBlur=blur;ctx.beginPath();fn();ctx.stroke();ctx.restore();};
    const draw=(now:number)=>{
      if(!alive)return;const t=(now-start)/1000,e=energy(state);const dpr=Math.min(devicePixelRatio||1,2);const rect=canvas.getBoundingClientRect();const cw=Math.max(2,Math.floor(rect.width*dpr)),ch=Math.max(2,Math.floor(rect.height*dpr));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}ctx.setTransform(cw/W,0,0,ch/H,0,0);ctx.clearRect(0,0,W,H);
      const bg=ctx.createRadialGradient(210,280,30,210,300,330);bg.addColorStop(0,'rgba(0,95,130,.08)');bg.addColorStop(.48,'rgba(0,27,42,.035)');bg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      const reveal=Math.min(1,Math.max(0,(t-.15)/2.2));

      // atmospheric arcs like the reference video
      for(let i=0;i<8;i++){
        const yy=210+i*39+Math.sin(t*.25+i)*8;
        stroke(()=>{ctx.moveTo(18,yy);ctx.bezierCurveTo(105,yy-55-i*3,315,yy+48+i*2,402,yy-6);},C,(.018+i*.002)*e,1,8);
      }

      // controlled energy fibers following anatomy, not random cross-lines
      streams.forEach((s,i)=>{
        const y=s.start;const x0=210+s.side*bodyWidth(y)*.83;const x1=210+s.side*(18+Math.abs(Math.sin(y*.015))*18);const y1=Math.min(628,y+85+Math.sin(t*.35+s.phase)*14);
        stroke(()=>{ctx.moveTo(x0,y);ctx.bezierCurveTo(x0-s.side*s.curve,y+35,x1+s.side*18,y1-35,x1,y1);},i%5===0?B:C,s.a*e*reveal,0.55,4);
      });

      // elegant silhouette edge
      stroke(()=>{ctx.moveTo(210,18);ctx.bezierCurveTo(148,20,142,102,152,153);ctx.bezierCurveTo(158,186,177,204,185,212);ctx.bezierCurveTo(181,236,161,251,132,263);ctx.bezierCurveTo(70,289,49,354,50,430);ctx.bezierCurveTo(52,519,101,596,151,628);},C,.30*e*reveal,1.15,14);
      stroke(()=>{ctx.moveTo(210,18);ctx.bezierCurveTo(272,20,278,102,268,153);ctx.bezierCurveTo(262,186,243,204,235,212);ctx.bezierCurveTo(239,236,259,251,288,263);ctx.bezierCurveTo(350,289,371,354,370,430);ctx.bezierCurveTo(368,519,319,596,269,628);},C,.30*e*reveal,1.15,14);
      stroke(()=>{ctx.moveTo(151,628);ctx.quadraticCurveTo(210,652,269,628);},C,.18*e,1,9);

      // face topology emerging from energy
      stroke(()=>{ctx.moveTo(163,108);ctx.quadraticCurveTo(181,96,195,107);ctx.moveTo(225,107);ctx.quadraticCurveTo(240,96,257,108);},C,.17*e,0.85,5);
      stroke(()=>{ctx.moveTo(210,112);ctx.bezierCurveTo(206,134,207,151,202,166);ctx.quadraticCurveTo(210,171,219,166);},C,.14*e,.8,4);
      stroke(()=>{ctx.moveTo(178,183);ctx.quadraticCurveTo(210,197,242,183);},C,.12*e,.75,4);
      stroke(()=>{ctx.moveTo(159,128);ctx.quadraticCurveTo(169,178,191,204);ctx.moveTo(261,128);ctx.quadraticCurveTo(251,178,229,204);},C,.09*e,.7,3);

      // particles anchored to the body volume
      dots.forEach((p,i)=>{const drift=Math.sin(t*p.speed+p.phase)*1.6;const lift=((t*(1.6+p.speed)+p.phase*4)%10)-5;const alpha=p.a*(.62+.38*Math.sin(t*(.8+p.speed)+p.phase))*e*reveal;glow(p.x+drift,p.y-lift*.32,p.r,p.warm?O:(i%9===0?B:C),alpha,p.r>1?6:2.5);});

      // orange signal system: eyes + mouth
      let sig=O;if(state==='ERROR'){const q=(Math.sin(t*3.8)+1)/2;sig=`255,${Math.round(40+95*(1-q))},${Math.round(20*(1-q))}`;}
      const eyePulse=.78+.22*Math.sin(t*(state==='LISTENING'?5.3:2.2));
      stroke(()=>{ctx.moveTo(166,128);ctx.quadraticCurveTo(181,121,195,129);ctx.moveTo(225,129);ctx.quadraticCurveTo(239,121,254,128);},sig,.92*eyePulse*e,2.2,16);
      glow(181,128,3.6,sig,.78*eyePulse*e,18);glow(239,128,3.6,sig,.78*eyePulse*e,18);
      const mouthAmp=state==='SPEAKING'?5+Math.abs(Math.sin(t*9))*9:2;
      stroke(()=>{ctx.moveTo(185,184);ctx.quadraticCurveTo(210,184+mouthAmp,235,184);},sig,.82*e,2,15);

      // anatomical heart under left pectoral (viewer right)
      const hb=1+.08*Math.sin(t*(state==='ACTION'?6.0:3.0));ctx.save();ctx.translate(274,360);ctx.scale(hb,hb);ctx.translate(-274,-360);
      glow(274,360,18,sig,.16*e,34);
      stroke(()=>{ctx.moveTo(273,391);ctx.bezierCurveTo(248,370,246,345,258,333);ctx.bezierCurveTo(268,323,280,330,281,342);ctx.bezierCurveTo(287,327,305,327,311,341);ctx.bezierCurveTo(319,360,296,380,273,391);},sig,.88*e,2,17);
      stroke(()=>{ctx.moveTo(280,339);ctx.bezierCurveTo(277,326,279,316,288,307);ctx.moveTo(290,341);ctx.bezierCurveTo(295,326,302,319,312,315);ctx.moveTo(266,342);ctx.bezierCurveTo(257,333,252,323,254,313);},sig,.55*e,1.2,10);ctx.restore();

      // central energy channel and base portal
      stroke(()=>{ctx.moveTo(210,215);ctx.bezierCurveTo(201,300,218,415,210,630);},C,.22*e,1.15,9);
      for(let i=0;i<5;i++)stroke(()=>{ctx.ellipse(210,645,64+i*27,5+i*2,0,0,Math.PI*2);},C,(.18-i*.025)*e,1,10);

      // state specific wave behavior
      if(state==='LISTENING'||state==='SPEAKING')for(const s of [-1,1])for(let i=0;i<4;i++){const x=210+s*(78+i*20);const hh=35+i*10+Math.sin(t*6+i)*10;stroke(()=>{ctx.moveTo(x,125-hh/2);ctx.quadraticCurveTo(x+s*13,125,x,125+hh/2);},state==='SPEAKING'?O:C,.14*e,1,8);}
      if(state==='UNDERSTANDING'||state==='THINKING')for(let i=0;i<3;i++){const rr=76+i*18+Math.sin(t*1.5+i)*4;stroke(()=>{ctx.ellipse(210,118,rr,rr*.72,0,0,Math.PI*2);},C,.09*e,1,10);}

      raf=requestAnimationFrame(draw);
    };raf=requestAnimationFrame(draw);return()=>{alive=false;cancelAnimationFrame(raf);};
  },[state,dots,streams]);

  return <View style={styles.stage}>{React.createElement('canvas' as any,{ref,style:{width:'100%',height:'100%',display:'block'}})}<View pointerEvents="none" style={styles.labels}><Text style={styles.state}>{state}</Text><Text style={styles.hint}>CR3@TIX-JARVIS // ENERGY ENTITY</Text></View></View>;
}

const styles=StyleSheet.create({stage:{width:'100%',height:'100%',minHeight:620,position:'relative',overflow:'hidden'},labels:{position:'absolute',bottom:18,left:0,right:0,alignItems:'center'},state:{color:'#97F5FF',fontSize:12,fontWeight:'900',letterSpacing:3.8,textShadowColor:'rgba(43,220,255,.8)',textShadowRadius:10},hint:{marginTop:6,color:'#3C7682',fontSize:8,fontWeight:'800',letterSpacing:1.9}});
