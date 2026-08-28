import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AssistantState } from '../types/assistant';

type Props = { state: AssistantState };

const STATE_INDEX: Record<AssistantState, number> = {
  IDLE: 0,
  WAKE: 1,
  LISTENING: 2,
  UNDERSTANDING: 3,
  THINKING: 4,
  SPEAKING: 5,
  ACTION: 6,
  ERROR: 7,
};

const VERT = `
attribute vec2 aPosition;
void main(){ gl_Position = vec4(aPosition,0.0,1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uState;

#define PI 3.14159265359

float hash21(vec2 p){
  p = fract(p*vec2(123.34,456.21));
  p += dot(p,p+45.32);
  return fract(p.x*p.y);
}

float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}

float fbm(vec2 p){
  float v=0.0, a=.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(8.1,3.7); a*=.5; }
  return v;
}

float ell(vec2 p, vec2 r){ return length(p/r)-1.0; }
float lineSeg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }

float bodySDF(vec2 p){
  float head=ell(p-vec2(0.0,.56),vec2(.235,.30));
  float jaw=ell(p-vec2(0.0,.44),vec2(.20,.19));
  float neck=ell(p-vec2(0.0,.18),vec2(.11,.20));
  float chest=ell(p-vec2(0.0,-.20),vec2(.50,.43));
  float shoulderL=ell(p-vec2(-.37,-.08),vec2(.28,.20));
  float shoulderR=ell(p-vec2(.37,-.08),vec2(.28,.20));
  float torso=ell(p-vec2(0.0,-.47),vec2(.36,.34));
  return min(min(min(head,jaw),neck),min(min(chest,torso),min(shoulderL,shoulderR)));
}

float faceMask(vec2 p){ return smoothstep(.02,-.10,ell(p-vec2(0.0,.54),vec2(.205,.255))); }

float anatomyFlow(vec2 p,float t){
  float a=abs(p.x);
  float f1=abs(sin((p.y*14.0+a*7.0)+fbm(p*7.0+t*.07)*5.0));
  float f2=abs(sin((p.y*20.0-a*11.0)+fbm(p*9.0-t*.05)*4.0));
  float spine=exp(-38.0*abs(p.x+sin(p.y*8.0+t*.5)*.008));
  float clav=exp(-55.0*abs(p.y+.035+abs(p.x)*.24));
  return pow(1.0-f1,8.0)*.65 + pow(1.0-f2,10.0)*.42 + spine*.9 + clav*.35;
}

float particleField(vec2 p,float t,float mask){
  vec2 q=p*vec2(42.0,55.0);
  vec2 id=floor(q), gv=fract(q)-.5;
  float rnd=hash21(id);
  vec2 drift=vec2(sin(t*.65+rnd*18.0),cos(t*.48+rnd*15.0))*.12;
  float d=length(gv-drift);
  float sparkle=smoothstep(.095,.0,d)*step(.74,rnd);
  float pulse=.45+.55*sin(t*(1.2+rnd*2.0)+rnd*20.0);
  return sparkle*(.55+.45*pulse)*mask;
}

float ring(vec2 p,float r,float width){ return smoothstep(width,0.0,abs(length(p)-r)); }

vec3 cyan=vec3(.08,.72,1.0);
vec3 blue=vec3(.02,.28,1.0);
vec3 amber=vec3(1.0,.42,.035);
vec3 redc=vec3(1.0,.035,.02);

void main(){
  vec2 uv=gl_FragCoord.xy/uResolution.xy;
  vec2 p=(uv-.5)*vec2(uResolution.x/uResolution.y,1.0)*2.0;
  p.y += .05;
  float t=uTime;

  float energy = .55;
  if(uState>0.5) energy=.82;
  if(uState>1.5) energy=.95;
  if(uState>2.5) energy=1.02;
  if(uState>3.5) energy=1.10;
  if(uState>4.5) energy=1.08;
  if(uState>5.5) energy=1.18;

  float reveal=smoothstep(0.0,1.0,clamp(t/1.9,0.0,1.0));
  float sdf=bodySDF(p);
  float inside=smoothstep(.03,-.05,sdf)*reveal;
  float edge=exp(-34.0*abs(sdf))*reveal;
  float aura=exp(-5.5*max(sdf,0.0))*reveal;

  vec3 col=vec3(.002,.008,.014);
  col += cyan*aura*.055*energy;

  float waves=0.0;
  for(int i=0;i<5;i++){
    float fi=float(i);
    vec2 rp=vec2(p.x*(1.0+fi*.07),p.y+.10);
    waves += ring(rp,.52+fi*.12,.006)*(.075-fi*.009);
  }
  col += cyan*waves*(.5+.5*sin(t*.6))*energy;

  float flow=anatomyFlow(p,t)*inside;
  float fog=fbm(p*5.0+vec2(0.0,-t*.08))*inside;
  col += mix(blue,cyan,.67)*flow*(.34+.20*fog)*energy;
  col += cyan*edge*.55*energy;
  col += cyan*inside*fog*.055*energy;

  float stars=particleField(p,t,inside);
  col += mix(blue,cyan,.7)*stars*1.35*energy;

  float face=faceMask(p);
  float browL=lineSeg(p,vec2(-.145,.64),vec2(-.045,.655));
  float browR=lineSeg(p,vec2(.045,.655),vec2(.145,.64));
  float nose=lineSeg(p,vec2(.0,.60),vec2(.0,.49));
  float jawL=lineSeg(p,vec2(-.17,.52),vec2(-.08,.38));
  float jawR=lineSeg(p,vec2(.17,.52),vec2(.08,.38));
  col += cyan*face*(exp(-70.0*browL)+exp(-70.0*browR)+exp(-75.0*nose)+exp(-55.0*jawL)+exp(-55.0*jawR))*.13;

  vec3 signal=amber;
  if(uState>6.5){ float e=.5+.5*sin(t*3.1); signal=mix(amber,redc,smoothstep(.18,.82,e)); }
  float eyePulse=.78+.22*sin(t*(uState>1.5&&uState<2.5?5.0:2.1));
  vec2 le=p-vec2(-.09,.585), re=p-vec2(.09,.585);
  float eyes=exp(-430.0*(le.x*le.x*1.0+le.y*le.y*7.0))+exp(-430.0*(re.x*re.x*1.0+re.y*re.y*7.0));
  col += signal*eyes*1.8*eyePulse*energy;

  float mouthY=.435;
  float mouthOpen = (uState>4.5&&uState<5.5)?(.010+.016*abs(sin(t*8.5))):.006;
  float mouth=exp(-260.0*(p.x*p.x*2.8 + (p.y-mouthY)*(p.y-mouthY)/(mouthOpen*mouthOpen+0.0002)));
  col += signal*mouth*1.35*energy;

  vec2 hp=(p-vec2(.19,-.17));
  float beat=1.0+.055*sin(t*(uState>5.5&&uState<6.5?6.0:3.2));
  hp/=beat;
  float h1=ell(hp-vec2(-.020,.015),vec2(.055,.075));
  float h2=ell(hp-vec2(.030,.020),vec2(.050,.060));
  float hb=min(h1,h2);
  float heartGlow=exp(-18.0*abs(hb))+exp(-7.0*length(hp))*1.15;
  float vessel1=exp(-95.0*lineSeg(hp,vec2(.00,.055),vec2(-.035,.13)));
  float vessel2=exp(-95.0*lineSeg(hp,vec2(.018,.055),vec2(.065,.12)));
  col += signal*(heartGlow*.65+vessel1*.35+vessel2*.35)*energy;

  float base=0.0;
  for(int j=0;j<4;j++){ float fj=float(j); vec2 bp=vec2(p.x/(.24+fj*.07),(p.y+.78)/(.020+fj*.006)); base+=exp(-8.0*abs(length(bp)-1.0))*(.16-fj*.025); }
  col += cyan*base*reveal;

  if(uState>1.5&&uState<2.5){
    float sw=abs(p.x)-.34;
    float sig=sin((p.y-.56)*58.0+t*8.0)*.5+.5;
    col += cyan*exp(-38.0*abs(sw))*sig*.22;
  }

  if(uState>2.5&&uState<4.5){
    vec2 cp=p-vec2(0.0,.61);
    float brain=exp(-14.0*length(cp))*(.45+.55*fbm(cp*15.0+t*.15));
    col += cyan*brain*.38;
  }

  float vign=smoothstep(1.35,.18,length(p*vec2(.74,.82)));
  col*=.55+.45*vign;
  col=1.0-exp(-col*1.35);
  gl_FragColor=vec4(col,1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string){
  const s=gl.createShader(type); if(!s) return null;
  gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); gl.deleteShader(s); return null; }
  return s;
}

export function JarvisCore({ state }: Props){
  const canvasRef=useRef<any>(null);

  useEffect(()=>{
    const canvas=canvasRef.current as HTMLCanvasElement|null; if(!canvas) return;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'}) as WebGLRenderingContext|null;
    if(!gl) return;
    const vs=compile(gl,gl.VERTEX_SHADER,VERT), fs=compile(gl,gl.FRAGMENT_SHADER,FRAG); if(!vs||!fs) return;
    const program=gl.createProgram(); if(!program) return;
    gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(program)); return; }
    gl.useProgram(program);

    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'aPosition'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const resLoc=gl.getUniformLocation(program,'uResolution');
    const timeLoc=gl.getUniformLocation(program,'uTime');
    const stateLoc=gl.getUniformLocation(program,'uState');
    let raf=0; const start=performance.now(); let alive=true;

    const render=(now:number)=>{
      if(!alive) return;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const rect=canvas.getBoundingClientRect();
      const cw=Math.max(2,Math.floor(rect.width*dpr)), ch=Math.max(2,Math.floor(rect.height*dpr));
      if(canvas.width!==cw||canvas.height!==ch){ canvas.width=cw; canvas.height=ch; }
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(resLoc,canvas.width,canvas.height);
      gl.uniform1f(timeLoc,(now-start)/1000);
      gl.uniform1f(stateLoc,STATE_INDEX[state]);
      gl.drawArrays(gl.TRIANGLES,0,6);
      raf=requestAnimationFrame(render);
    };
    raf=requestAnimationFrame(render);
    return()=>{ alive=false; cancelAnimationFrame(raf); gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); if(buf) gl.deleteBuffer(buf); };
  },[state]);

  return <View style={styles.stage}>
    {React.createElement('canvas' as any,{ref:canvasRef,style:{width:'100%',height:'100%',display:'block'}})}
    <View pointerEvents="none" style={styles.labels}>
      <Text style={styles.state}>{state}</Text>
      <Text style={styles.hint}>VOLUMETRIC ENERGY // WEBGL CORE</Text>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  stage:{width:'100%',height:570,position:'relative',overflow:'hidden',alignItems:'center'},
  labels:{position:'absolute',bottom:1,left:0,right:0,alignItems:'center'},
  state:{color:'#8bf3ff',fontSize:13,fontWeight:'900',letterSpacing:3.5,textShadowColor:'rgba(43,220,255,.75)',textShadowRadius:9},
  hint:{marginTop:6,color:'#356f7a',fontSize:8,fontWeight:'800',letterSpacing:1.8}
});
