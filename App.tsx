import React, { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { JarvisCore } from './src/components/JarvisCore';
import { nextState } from './src/state/assistantMachine';
import type { AssistantState } from './src/types/assistant';

const UPDATE_STORAGE_KEY='cr3atix-jarvis-build';
async function checkForWebUpdate(){if(Platform.OS!=='web')return;const runtime=globalThis as typeof globalThis&{localStorage?:Storage;location?:Location};try{const r=await fetch(`./version.json?t=${Date.now()}`,{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!r.ok)return;const d=await r.json() as {build?:string};if(!d.build||!runtime.localStorage||!runtime.location)return;const prev=runtime.localStorage.getItem(UPDATE_STORAGE_KEY);runtime.localStorage.setItem(UPDATE_STORAGE_KEY,d.build);if(prev&&prev!==d.build){runtime.location.replace(`${runtime.location.pathname}?build=${d.build.slice(0,12)}`);}}catch{}}

export default function App(){
  const [state,setState]=useState<AssistantState>('IDLE');
  useEffect(()=>{void checkForWebUpdate();const sub=AppState.addEventListener('change',s=>{if(s==='active')void checkForWebUpdate();});return()=>sub.remove();},[]);
  return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor="#00070A"/><View style={styles.root}>
    <View pointerEvents="none" style={styles.brand}><Text style={styles.name}>CR3@TIX-JARVIS</Text><Text style={styles.sub}>ASSISTANT IA PERSONNEL</Text></View>
    <View style={styles.core}><JarvisCore state={state}/></View>
    <View style={styles.controls}><Pressable accessibilityRole="button" accessibilityLabel="Passer à l'état suivant" onPress={()=>setState(s=>nextState(s))} style={({pressed})=>[styles.button,pressed&&styles.pressed]}><Text style={styles.buttonText}>ÉTAT SUIVANT</Text></Pressable><Text style={styles.update}>AUTO-UPDATE ACTIF</Text></View>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#00070A'},root:{flex:1,width:'100%',maxWidth:720,alignSelf:'center',backgroundColor:'#00070A',overflow:'hidden'},brand:{position:'absolute',zIndex:3,top:18,left:22},name:{color:'#EAFBFF',fontSize:18,fontWeight:'900',letterSpacing:1.7,textShadowColor:'rgba(54,220,255,.38)',textShadowRadius:8},sub:{marginTop:3,color:'#4DB9D0',fontSize:8,fontWeight:'800',letterSpacing:2.1},core:{flex:1,minHeight:680},controls:{position:'absolute',zIndex:4,left:0,right:0,bottom:18,alignItems:'center'},button:{minWidth:148,minHeight:40,paddingHorizontal:18,borderRadius:22,borderWidth:1,borderColor:'rgba(59,221,255,.45)',backgroundColor:'rgba(0,25,35,.62)',alignItems:'center',justifyContent:'center'},pressed:{opacity:.65,transform:[{scale:.98}]},buttonText:{color:'#CFF9FF',fontSize:9,fontWeight:'900',letterSpacing:1.8},update:{marginTop:6,color:'#285B66',fontSize:7,fontWeight:'800',letterSpacing:1.5}});
