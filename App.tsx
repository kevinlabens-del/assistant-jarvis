import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { JarvisCore } from './src/components/JarvisCore';
import { DEMO_TIMELINE } from './src/state/assistantMachine';
import type { AssistantState } from './src/types/assistant';

const UPDATE_STORAGE_KEY='cr3atix-jarvis-build';

async function checkForWebUpdate(){
  if(Platform.OS!=='web')return;
  const runtime=globalThis as typeof globalThis&{localStorage?:Storage;location?:Location};
  try{
    const r=await fetch(`./version.json?t=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}});
    if(!r.ok)return;
    const d=await r.json() as {build?:string};
    if(!d.build||!runtime.localStorage||!runtime.location)return;
    const prev=runtime.localStorage.getItem(UPDATE_STORAGE_KEY);
    runtime.localStorage.setItem(UPDATE_STORAGE_KEY,d.build);
    if(prev&&prev!==d.build)runtime.location.replace(`${runtime.location.pathname}?build=${d.build.slice(0,12)}`);
  }catch{}
}

export default function App(){
  const [timelineIndex,setTimelineIndex]=useState(0);
  const state=DEMO_TIMELINE[timelineIndex]?.state ?? 'IDLE';
  const duration=DEMO_TIMELINE[timelineIndex]?.durationMs ?? 3000;
  const [cycle,setCycle]=useState(0);

  useEffect(()=>{
    void checkForWebUpdate();
    const sub=AppState.addEventListener('change',s=>{if(s==='active')void checkForWebUpdate();});
    return()=>sub.remove();
  },[]);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      setTimelineIndex(i=>(i+1)%DEMO_TIMELINE.length);
    },duration);
    return()=>clearTimeout(timer);
  },[timelineIndex,duration,cycle]);

  const status=useMemo(()=>{
    const labels:Record<AssistantState,string>={
      MATERIALIZING:'APPARITION',IDLE:'VEILLE',WAKE:'RÉVEIL',LISTENING:'ÉCOUTE',UNDERSTANDING:'COMPRÉHENSION',
      THINKING:'RÉFLEXION',SPEAKING:'RÉPONSE',ACTION:'ACTION',ERROR:'ERREUR',DISSOLVING:'DISPARITION',
    };
    return labels[state];
  },[state]);

  const replay=()=>{setTimelineIndex(0);setCycle(c=>c+1);};

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor="#00070A"/>
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.brand}>
        <Text style={styles.name}>CR3@TIX-JARVIS</Text>
        <Text style={styles.sub}>ASSISTANT IA PERSONNEL</Text>
      </View>

      <View style={styles.core}><JarvisCore state={state}/></View>

      <View pointerEvents="none" style={styles.modeBadge}>
        <View style={styles.dot}/><Text style={styles.modeText}>{status}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Rejouer la séquence de référence" onPress={replay} style={({pressed})=>[styles.button,pressed&&styles.pressed]}>
          <Text style={styles.buttonText}>REJOUER LA SÉQUENCE</Text>
        </Pressable>
        <Text style={styles.update}>AUTO-UPDATE ACTIF</Text>
      </View>
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#00070A'},
  root:{flex:1,width:'100%',maxWidth:720,alignSelf:'center',backgroundColor:'#00070A',overflow:'hidden'},
  brand:{position:'absolute',zIndex:3,top:18,left:22},
  name:{color:'#EAFBFF',fontSize:18,fontWeight:'900',letterSpacing:1.7,textShadowColor:'rgba(54,220,255,.38)',textShadowRadius:8},
  sub:{marginTop:3,color:'#4DB9D0',fontSize:8,fontWeight:'800',letterSpacing:2.1},
  core:{flex:1,minHeight:680},
  modeBadge:{position:'absolute',zIndex:4,top:20,right:18,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:6,borderRadius:14,borderWidth:1,borderColor:'rgba(52,205,236,.18)',backgroundColor:'rgba(0,13,18,.42)'},
  dot:{width:5,height:5,borderRadius:5,backgroundColor:'#3BE4FF',shadowColor:'#3BE4FF',shadowOpacity:1,shadowRadius:6},
  modeText:{color:'#7BDDEA',fontSize:7,fontWeight:'900',letterSpacing:1.4},
  controls:{position:'absolute',zIndex:4,left:0,right:0,bottom:16,alignItems:'center'},
  button:{minWidth:152,minHeight:38,paddingHorizontal:17,borderRadius:21,borderWidth:1,borderColor:'rgba(59,221,255,.34)',backgroundColor:'rgba(0,20,28,.56)',alignItems:'center',justifyContent:'center'},
  pressed:{opacity:.65,transform:[{scale:.98}]},
  buttonText:{color:'#CFF9FF',fontSize:8,fontWeight:'900',letterSpacing:1.7},
  update:{marginTop:5,color:'#285B66',fontSize:6,fontWeight:'800',letterSpacing:1.4},
});
