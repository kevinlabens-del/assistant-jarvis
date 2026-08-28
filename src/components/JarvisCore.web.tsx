import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AssistantState } from '../types/assistant';

type Props = { state: AssistantState };
type Particle = {
  tx:number; ty:number; sx:number; sy:number; r:number; a:number;
  phase:number; speed:number; warm:boolean; layer:number;
};

type Fiber = { side:number; y:number; bend:number; phase:number; alpha:number; length:number };

const W=430, H=760;
const CYAN='54,221,255';
const BLUE='29,116,255';
const AMBER='255,137,18';
const RED='255,42,34';

function rnd(seed:number){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

function bodyHalfWidth(y:number){
  if(y<50) return 0;
  if(y<235){
    const yy=(y-140)/112;
    return 69*Math.sqrt(Math.max(0,1-yy*yy));
  }
  if(y<285) return 25+(y-235)*.58;
  if(y<505){
    const q=(y-285)/220;
    return 91+92*Math.sin(q*Math.PI*.86);
  }
  if(y<650) return 176-(y-505)*.52;
  return Math.max(42,101-(y-650)*.45);
}

function insideBody(x:number,y:number){
  const hw=bodyHalfWidth(y);
  return hw>0 && Math.abs(x-W/2)<hw;
}

function buildParticles(){
  const r=rnd(84217); const out:Particle[]=[];
  while(out.length<2100){
    const ty=42+r()*620, tx=35+r()*(W-70);
    if(!insideBody(tx,ty)) continue;
    const hw=Math.max(1,bodyHalfWidth(ty));
    const edge=Math.abs(tx-W/2)/hw;
    const fromBottom=r()>.42;
    out.push({
      tx,ty,
      sx: fromBottom ? W/2+(r()-.5)*95 : (r()>.5?-1:1)*(W*.46+r()*120)+W/2,
      sy: fromBottom ? H+30+r()*160 : 90+r()*540,
      r:.35+r()*(edge>.75?1.6:1.05),
      a:.08+r()*(edge>.73?.58:.34),
      phase:r()*Math.PI*2,
      speed:.35+r()*1.4,
      warm:r()>.989,
      layer:r()>.72?1:0,
    });
  }
  return out;
}

function buildFibers(){
  const r=rnd(99201); const out:Fiber[]=[];
  for(let i=0;i<118;i++) out.push({side:i%2?1:-1,y:86+r()*510,bend:10+r()*34,phase:r()*Math.PI*2,alpha:.025+r()*.095,length:58+r()*130});
  return out;
}

const PARTICLES=buildParticles();
const FIBERS=buildFibers();

function stateEnergy(state:AssistantState){
  const map:Record<AssistantState,number>={
    MATERIALIZING:.88,IDLE:.46,WAKE:.82,LISTENING:.96,UNDERSTANDING:1.02,
    THINKING:1.10,SPEAKING:1.08,ACTION:1.16,ERROR:1.02,DISSOLVING:.70,
  };
  return map[state];
}

function easeOutCubic(x:number){return 1-Math.pow(1-Math.max(0,Math.min(1,x)),3);}
function easeInCubic(x:number){x=Math.max(0,Math.min(1,x));return x*x*x;}
function mix(a:number,b:number,t:number){return a+(b-a)*t;}

export function JarvisCore({state}:Props){
  const ref=useRef<any>(null);
  const particles=useMemo(()=>PARTICLES,[]);
  const fibers=useMemo(()=>FIBERS,[]);

  useEffect(()=>{
    const canvas=ref.current as HTMLCanvasElement|null; if(!canvas)return;
    const ctx=canvas.getContext('2d',{alpha:true}); if(!ctx)return;
    let raf=0,alive=true; const started=performance.now();

    const glow=(x:number,y:number,r:number,color:string,a:number,blur:number)=>{
      ctx.save(); ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=`rgba(${color},${Math.max(0,a)})`; ctx.shadowColor=`rgb(${color})`; ctx.shadowBlur=blur;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.restore();
    };
    const stroke=(fn:()=>void,color:string,a:number,w:number,blur:number)=>{
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${color},${Math.max(0,a)})`;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=`rgb(${color})`;ctx.shadowBlur=blur;ctx.beginPath();fn();ctx.stroke();ctx.restore();
    };

    const draw=(now:number)=>{
      if(!alive)return;
      const t=(now-started)/1000, e=stateEnergy(state);
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const rect=canvas.getBoundingClientRect();
      const cw=Math.max(2,Math.floor(rect.width*dpr)), ch=Math.max(2,Math.floor(rect.height*dpr));
      if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
      ctx.setTransform(cw/W,0,0,ch/H,0,0);ctx.clearRect(0,0,W,H);

      let form=1, scatter=0;
      if(state==='MATERIALIZING'){form=easeOutCubic(t/5.7);scatter=1-form;}
      else if(state==='DISSOLVING'){const q=easeInCubic(t/5.9);form=1-q;scatter=q;}
      const presence=form;

      const bg=ctx.createRadialGradient(W/2,300,12,W/2,330,360);
      bg.addColorStop(0,`rgba(0,133,175,${.052*presence})`);
      bg.addColorStop(.48,`rgba(0,45,70,${.032*presence})`);
      bg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

      // Wide magnetic-field waves seen around the entity in the reference video.
      for(let i=0;i<9;i++){
        const yy=198+i*43+Math.sin(t*.28+i*.8)*8;
        stroke(()=>{ctx.moveTo(-25,yy);ctx.bezierCurveTo(90,yy-70-i*2,330,yy+68+i*3,W+25,yy-8);},CYAN,(.014+i*.0022)*e*presence,.8+(i%3)*.18,7);
      }

      // A faint concentric field around the head, stronger while processing.
      const headField=(state==='LISTENING'?1.1:state==='UNDERSTANDING'||state==='THINKING'?1.45:state==='SPEAKING'?1.18:.62)*presence;
      for(let i=0;i<5;i++){
        const rr=88+i*25+Math.sin(t*.7+i)*3;
        stroke(()=>{ctx.ellipse(W/2,145,rr,rr*.78,0,0,Math.PI*2);},CYAN,.025*headField,1,9);
      }

      // Structured anatomical energy fibers. They flow down the head, neck and torso.
      fibers.forEach((f,i)=>{
        const hw=bodyHalfWidth(f.y); if(hw<=0)return;
        const x0=W/2+f.side*hw*.86;
        const endY=Math.min(648,f.y+f.length);
        const endHW=bodyHalfWidth(endY);
        const x1=W/2+f.side*Math.min(Math.max(14,endHW*.30),56);
        const wobble=Math.sin(t*.38+f.phase)*7;
        stroke(()=>{ctx.moveTo(x0,f.y);ctx.bezierCurveTo(x0-f.side*(f.bend+wobble),f.y+f.length*.32,x1+f.side*16,endY-f.length*.27,x1,endY);},i%7===0?BLUE:CYAN,f.alpha*e*presence,.55+(i%4)*.12,3.2);
      });

      // Human face topology, deliberately subtle so it appears to emerge from the energy.
      stroke(()=>{ctx.moveTo(151,118);ctx.quadraticCurveTo(174,103,198,116);ctx.moveTo(232,116);ctx.quadraticCurveTo(256,103,279,118);},CYAN,.12*e*presence,.9,5);
      stroke(()=>{ctx.moveTo(215,115);ctx.bezierCurveTo(210,145,211,166,205,181);ctx.quadraticCurveTo(215,187,225,181);},CYAN,.11*e*presence,.82,4);
      stroke(()=>{ctx.moveTo(176,203);ctx.quadraticCurveTo(215,221,254,203);},CYAN,.095*e*presence,.8,4);
      stroke(()=>{ctx.moveTo(150,146);ctx.quadraticCurveTo(158,198,188,225);ctx.moveTo(280,146);ctx.quadraticCurveTo(272,198,242,225);},CYAN,.065*e*presence,.72,3);
      stroke(()=>{ctx.moveTo(171,233);ctx.quadraticCurveTo(187,255,190,282);ctx.moveTo(259,233);ctx.quadraticCurveTo(243,255,240,282);},CYAN,.085*e*presence,.8,4);

      // Shoulder/clavicle energy anchors: enough anatomy to read the silhouette without a hard shell.
      stroke(()=>{ctx.moveTo(215,289);ctx.bezierCurveTo(180,286,139,298,83,329);ctx.moveTo(215,289);ctx.bezierCurveTo(250,286,291,298,347,329);},CYAN,.12*e*presence,1.0,7);
      stroke(()=>{ctx.moveTo(215,286);ctx.bezierCurveTo(205,360,221,462,215,651);},CYAN,.15*e*presence,1.1,8);
      for(let i=0;i<4;i++){
        const yy=337+i*54;
        stroke(()=>{ctx.moveTo(214,yy);ctx.bezierCurveTo(174,yy-9,127,yy+4,91,yy+34);ctx.moveTo(216,yy);ctx.bezierCurveTo(256,yy-9,303,yy+4,339,yy+34);},CYAN,.045*e*presence,.7,4);
      }

      // Thousands of particles move from/to the body rather than simply appearing/disappearing.
      particles.forEach((p,i)=>{
        const phaseDelay=((p.ty/650)*.38 + ((i%17)/17)*.10);
        let localForm=form;
        if(state==='MATERIALIZING') localForm=easeOutCubic(Math.max(0,Math.min(1,(t/5.7-phaseDelay)/(1-phaseDelay))));
        if(state==='DISSOLVING') localForm=1-easeInCubic(Math.max(0,Math.min(1,(t/5.9-phaseDelay*.6)/(1-phaseDelay*.6))));
        const swirl=scatter*(26+((i%11)*2.3));
        const px=mix(p.sx,p.tx,localForm)+Math.sin(t*p.speed+p.phase)*1.5+Math.cos(p.phase+t*.9)*swirl*scatter*.18;
        const py=mix(p.sy,p.ty,localForm)+Math.cos(t*(p.speed*.72)+p.phase)*1.2-scatter*(Math.sin(p.phase*2.1+t)*15);
        const twinkle=.56+.44*Math.sin(t*(.72+p.speed)+p.phase);
        const alpha=p.a*twinkle*e*(.25+.75*localForm);
        glow(px,py,p.r,p.warm?AMBER:(p.layer?BLUE:CYAN),alpha,p.r>1.2?7:2.6);
      });

      let signal=AMBER;
      if(state==='ERROR'){
        const q=.5+.5*Math.sin(t*3.2);
        const g=Math.round(137*(1-q)+42*q), b=Math.round(18*(1-q)+34*q);
        signal=`255,${g},${b}`;
      }
      const signalPresence=Math.max(0,Math.min(1,(presence-.24)/.76));
      const eyePulse=.76+.24*Math.sin(t*(state==='LISTENING'?5.3:2.15));

      // Warm eyes and mouth, as defined for CR3@TIX-JARVIS.
      stroke(()=>{ctx.moveTo(154,144);ctx.quadraticCurveTo(174,134,197,145);ctx.moveTo(233,145);ctx.quadraticCurveTo(256,134,276,144);},signal,.9*eyePulse*e*signalPresence,2.4,18);
      glow(176,144,4.1,signal,.68*eyePulse*e*signalPresence,21);glow(254,144,4.1,signal,.68*eyePulse*e*signalPresence,21);
      const mouthOpen=state==='SPEAKING'?5+Math.abs(Math.sin(t*8.6))*11:2.0;
      stroke(()=>{ctx.moveTo(185,205);ctx.quadraticCurveTo(215,205+mouthOpen,245,205);},signal,.84*e*signalPresence,2.15,16);

      // Anatomical heart beneath the assistant's left pectoral (viewer-right).
      const heartX=282,heartY=390;const beat=1+.075*Math.sin(t*(state==='ACTION'?6.2:3.05));
      ctx.save();ctx.translate(heartX,heartY);ctx.scale(beat,beat);ctx.translate(-heartX,-heartY);
      glow(heartX,heartY,18,signal,.14*e*signalPresence,38);
      stroke(()=>{ctx.moveTo(280,425);ctx.bezierCurveTo(254,401,250,376,261,361);ctx.bezierCurveTo(272,346,287,354,288,370);ctx.bezierCurveTo(294,352,313,350,320,365);ctx.bezierCurveTo(329,387,305,410,280,425);},signal,.92*e*signalPresence,2.2,18);
      stroke(()=>{ctx.moveTo(288,367);ctx.bezierCurveTo(286,349,290,337,301,325);ctx.moveTo(299,371);ctx.bezierCurveTo(306,351,315,341,326,338);ctx.moveTo(273,369);ctx.bezierCurveTo(264,354,259,343,261,329);},signal,.59*e*signalPresence,1.15,11);ctx.restore();

      // Voice/listening fields, matching the visible reactive waves in the source video.
      if(state==='LISTENING'||state==='SPEAKING'){
        for(const side of [-1,1]) for(let i=0;i<4;i++){
          const x=215+side*(93+i*19), hh=37+i*13+Math.sin(t*6+i*.7)*11;
          stroke(()=>{ctx.moveTo(x,146-hh/2);ctx.quadraticCurveTo(x+side*14,146,x,146+hh/2);},state==='SPEAKING'?AMBER:CYAN,.13*e*presence,1,8);
        }
      }
      if(state==='UNDERSTANDING'||state==='THINKING'){
        for(let i=0;i<18;i++){
          const a=i/18*Math.PI*2+t*.42; const rr=92-((t*18+i*8)%77);
          glow(215+Math.cos(a)*rr*.75,144+Math.sin(a)*rr,1.3,CYAN,.38*presence,7);
        }
        glow(215,112,11,CYAN,.12*e*(1+.3*Math.sin(t*4.6))*presence,28);
      }

      // Base energy pool. During materialization it is the source; during dissolution it becomes the sink.
      for(let i=0;i<6;i++){
        const rr=66+i*25+Math.sin(t*.6+i)*2;
        stroke(()=>{ctx.ellipse(215,676,rr,5+i*1.8,0,0,Math.PI*2);},CYAN,(.17-i*.021)*e*(.5+.5*presence),1,10);
      }
      if(state==='MATERIALIZING'||state==='DISSOLVING') glow(215,676,7,CYAN,.5*(state==='MATERIALIZING'?1-form:scatter),25);

      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{alive=false;cancelAnimationFrame(raf);};
  },[state,particles,fibers]);

  return <View style={styles.stage}>
    {React.createElement('canvas' as any,{ref,style:{width:'100%',height:'100%',display:'block'}})}
    <View pointerEvents="none" style={styles.labels}>
      <Text style={styles.state}>{state}</Text>
      <Text style={styles.hint}>CR3@TIX-JARVIS // ENERGY ENTITY</Text>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  stage:{width:'100%',height:'100%',minHeight:650,position:'relative',overflow:'hidden'},
  labels:{position:'absolute',bottom:14,left:0,right:0,alignItems:'center'},
  state:{color:'#97F5FF',fontSize:11,fontWeight:'900',letterSpacing:3.5,textShadowColor:'rgba(43,220,255,.8)',textShadowRadius:10},
  hint:{marginTop:5,color:'#376D77',fontSize:7,fontWeight:'800',letterSpacing:1.7},
});
