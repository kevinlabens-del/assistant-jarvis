import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AssistantState } from '../types/assistant';

type Props = { state: AssistantState };
type P = { x:number; y:number; a:number; r:number; phase:number; speed:number };
type F = { x1:number; y1:number; cx:number; cy:number; x2:number; y2:number; a:number; phase:number };

const W=360, H=500;
const CYAN='43,220,255';
const BLUE='31,133,255';

function mulberry32(seed:number){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function insideBody(x:number,y:number){
  const head=((x-180)/66)**2+((y-118)/88)**2<1;
  const neck=x>153&&x<207&&y>192&&y<230;
  const torso=((x-180)/146)**2+((y-332)/132)**2<1 && y>210;
  return head||neck||torso;
}
function buildParticles(){
  const rnd=mulberry32(3337); const out:P[]=[];
  while(out.length<900){const x=rnd()*W,y=25+rnd()*420;if(!insideBody(x,y))continue;
    const edgeHead=Math.abs((((x-180)/66)**2+((y-118)/88)**2)-1);
    const edgeTorso=Math.abs((((x-180)/146)**2+((y-332)/132)**2)-1);
    const edge=Math.min(edgeHead,edgeTorso);
    out.push({x,y,a:(edge<.17?.45:.12)+rnd()*.45,r:.45+rnd()*1.15,phase:rnd()*Math.PI*2,speed:.35+rnd()*.9});
  }
  return out;
}
function buildFilaments(){
  const rnd=mulberry32(771); const out:F[]=[];
  for(let i=0;i<125;i++){
    let x1=0,y1=0,x2=0,y2=0,tries=0;
    do{x1=25+rnd()*310;y1=45+rnd()*385;tries++;}while(!insideBody(x1,y1)&&tries<50);
    tries=0;do{x2=25+rnd()*310;y2=45+rnd()*385;tries++;}while(!insideBody(x2,y2)&&tries<50);
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    out.push({x1,y1,x2,y2,cx:mx+(rnd()-.5)*55,cy:my+(rnd()-.5)*55,a:.06+rnd()*.20,phase:rnd()*Math.PI*2});
  }
  return out;
}
const PARTICLES=buildParticles();
const FILAMENTS=buildFilaments();

function stateEnergy(state:AssistantState){
  switch(state){
    case 'IDLE': return .42;
    case 'WAKE': return .78;
    case 'LISTENING': return .9;
    case 'UNDERSTANDING': return 1.0;
    case 'THINKING': return 1.12;
    case 'SPEAKING': return 1.08;
    case 'ACTION': return 1.18;
    case 'ERROR': return 1.02;
    default:return .8;
  }
}

export function JarvisCore({state}:Props){
  const canvasRef=useRef<any>(null);
  const particles=useMemo(()=>PARTICLES,[]);
  const filaments=useMemo(()=>FILAMENTS,[]);

  useEffect(()=>{
    const canvas=canvasRef.current as HTMLCanvasElement|null; if(!canvas)return;
    const ctx=canvas.getContext('2d'); if(!ctx)return;
    let raf=0, start=performance.now(), alive=true;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width='100%'; canvas.style.height='100%'; ctx.scale(dpr,dpr);

    function glowDot(x:number,y:number,r:number,color:string,alpha:number,blur:number){
      ctx!.save();ctx!.globalCompositeOperation='lighter';ctx!.fillStyle=`rgba(${color},${alpha})`;ctx!.shadowColor=`rgb(${color})`;ctx!.shadowBlur=blur;ctx!.beginPath();ctx!.arc(x,y,r,0,Math.PI*2);ctx!.fill();ctx!.restore();
    }
    function strokeGlow(path:()=>void,color:string,alpha:number,width:number,blur:number){
      ctx!.save();ctx!.globalCompositeOperation='lighter';ctx!.strokeStyle=`rgba(${color},${alpha})`;ctx!.lineWidth=width;ctx!.shadowColor=`rgb(${color})`;ctx!.shadowBlur=blur;ctx!.beginPath();path();ctx!.stroke();ctx!.restore();
    }
    function draw(tms:number){
      if(!alive)return; const t=(tms-start)/1000; const energy=stateEnergy(state);
      ctx!.clearRect(0,0,W,H);
      const bg=ctx!.createRadialGradient(180,245,20,180,245,230);bg.addColorStop(0,'rgba(0,125,165,.08)');bg.addColorStop(.45,'rgba(0,55,80,.04)');bg.addColorStop(1,'rgba(0,0,0,0)');ctx!.fillStyle=bg;ctx!.fillRect(0,0,W,H);

      // large ambient orbital energy
      for(let i=0;i<5;i++){
        strokeGlow(()=>{ctx!.ellipse(180,245,105+i*24,150+i*18,Math.sin(t*.13+i)*.16,0,Math.PI*2);},CYAN,.035*energy,1,5);
      }

      // internal neural filaments
      filaments.forEach((f,i)=>{
        const flick=.65+.35*Math.sin(t*(.7+(i%5)*.11)+f.phase);
        strokeGlow(()=>{ctx!.moveTo(f.x1,f.y1);ctx!.quadraticCurveTo(f.cx+Math.sin(t*.4+f.phase)*6,f.cy+Math.cos(t*.35+f.phase)*5,f.x2,f.y2);},i%4===0?BLUE:CYAN,f.a*flick*energy,.55+(i%3)*.18,2.5);
      });

      // anatomical silhouette hinted only by luminous contour, never solid shell
      strokeGlow(()=>{ctx!.ellipse(180,118,66,88,0,0,Math.PI*2);},CYAN,.20*energy,1,9);
      strokeGlow(()=>{ctx!.moveTo(154,205);ctx!.bezierCurveTo(136,222,71,220,48,277);ctx!.bezierCurveTo(25,334,40,414,92,447);ctx!.moveTo(206,205);ctx!.bezierCurveTo(224,222,289,220,312,277);ctx!.bezierCurveTo(335,334,320,414,268,447);},CYAN,.14*energy,1,8);
      strokeGlow(()=>{ctx!.moveTo(154,195);ctx!.lineTo(150,228);ctx!.moveTo(206,195);ctx!.lineTo(210,228);},CYAN,.22*energy,1,6);

      // particles – denser around the body, breathing and flowing vertically
      particles.forEach((p,i)=>{
        const drift=Math.sin(t*p.speed+p.phase)*1.6;
        const rise=((t*(2.5+p.speed*1.7)+p.phase*7)%14)-7;
        const alpha=p.a*(.68+.32*Math.sin(t*(.8+p.speed)+p.phase))*energy;
        glowDot(p.x+drift,p.y-rise*.25,p.r,i%11===0?BLUE:CYAN,alpha,i%7===0?5:2.5);
      });

      // face: human features emerging from the particle field
      strokeGlow(()=>{ctx!.moveTo(137,98);ctx!.quadraticCurveTo(151,89,165,96);ctx!.moveTo(195,96);ctx!.quadraticCurveTo(209,89,223,98);},CYAN,.22*energy,1,5);
      strokeGlow(()=>{ctx!.moveTo(179,104);ctx!.quadraticCurveTo(176,129,180,140);ctx!.quadraticCurveTo(187,144,191,139);},CYAN,.16*energy,1,4);
      strokeGlow(()=>{ctx!.moveTo(147,153);ctx!.quadraticCurveTo(180,166,213,153);},CYAN,.10*energy,1,3);

      let orange='255,143,18';
      if(state==='ERROR'){
        const e=(Math.sin(t*4.4)+1)/2; orange=`255,${Math.round(48+70*(1-e))},${Math.round(35*(1-e))}`;
      }
      const eyePulse=.78+.22*Math.sin(t*(state==='LISTENING'?5.2:2.2));
      glowDot(155,111,4.2,orange,.78*eyePulse*energy,17); glowDot(205,111,4.2,orange,.78*eyePulse*energy,17);
      strokeGlow(()=>{ctx!.moveTo(146,112);ctx!.quadraticCurveTo(155,107,164,112);ctx!.moveTo(196,112);ctx!.quadraticCurveTo(205,107,214,112);},orange,.82*energy,2,12);

      const mouthAmp=state==='SPEAKING' ? (4+Math.abs(Math.sin(t*8))*8) : 2;
      strokeGlow(()=>{ctx!.moveTo(160,157);ctx!.quadraticCurveTo(180,157+mouthAmp,200,157);},orange,.75*energy,2,13);

      // energy flow converging toward head when understanding/thinking
      if(state==='UNDERSTANDING'||state==='THINKING'){
        for(let i=0;i<13;i++){
          const a=i/13*Math.PI*2+t*.6; const rr=90-(t*16+i*7)%75;
          glowDot(180+Math.cos(a)*rr*.72,118+Math.sin(a)*rr,1.3,CYAN,.45,7);
        }
        glowDot(180,80,9,CYAN,.20*(1+.35*Math.sin(t*5)),23);
      }

      // anatomical heart under assistant's left pectoral (viewer-right)
      const hb=1+.10*Math.sin(t*(state==='ACTION'?6:3.1));
      ctx!.save();ctx!.translate(224,302);ctx!.scale(hb,hb);ctx!.translate(-224,-302);
      glowDot(224,302,10,orange,.30*energy,27);
      strokeGlow(()=>{ctx!.moveTo(224,316);ctx!.bezierCurveTo(212,306,207,298,211,289);ctx!.bezierCurveTo(216,280,225,285,226,291);ctx!.bezierCurveTo(230,283,241,282,245,292);ctx!.bezierCurveTo(249,302,238,311,224,316);},orange,.76*energy,2,15);
      ctx!.restore();

      // central cyan life-flow and base apparition ring
      strokeGlow(()=>{ctx!.moveTo(180,205);ctx!.bezierCurveTo(174,250,186,290,180,432);},CYAN,.25*energy,1.2,8);
      for(let i=0;i<3;i++)strokeGlow(()=>{ctx!.ellipse(180,449,50+i*24,5+i*2,0,0,Math.PI*2);},CYAN,(.15-i*.03)*energy,1,9);

      // voice/listening side waves
      if(state==='LISTENING'||state==='SPEAKING'){
        const amp=state==='SPEAKING'?15:10;
        for(const side of [-1,1]) for(let i=0;i<3;i++){
          const x=180+side*(82+i*13); const h=28+i*9+Math.sin(t*5+i)*amp;
          strokeGlow(()=>{ctx!.moveTo(x,118-h/2);ctx!.quadraticCurveTo(x+side*8,118,x,118+h/2);},CYAN,.18*energy,1,7);
        }
      }
      raf=requestAnimationFrame(draw);
    }
    raf=requestAnimationFrame(draw);
    return()=>{alive=false;cancelAnimationFrame(raf);};
  },[state,particles,filaments]);

  return <View style={styles.stage}>
    {React.createElement('canvas' as any,{ref:canvasRef,style:{width:'100%',height:'100%',display:'block'}})}
    <View pointerEvents="none" style={styles.labels}><Text style={styles.state}>{state}</Text><Text style={styles.hint}>ENERGY PRESENCE // PARTICLE CORE</Text></View>
  </View>;
}

const styles=StyleSheet.create({
  stage:{width:'100%',height:560,position:'relative',overflow:'hidden',alignItems:'center'},
  labels:{position:'absolute',bottom:0,left:0,right:0,alignItems:'center'},
  state:{color:'#87efff',fontSize:13,fontWeight:'900',letterSpacing:3.4,textShadowColor:'rgba(43,220,255,.7)',textShadowRadius:8},
  hint:{marginTop:6,color:'#356f7a',fontSize:8,fontWeight:'800',letterSpacing:1.8}
});
