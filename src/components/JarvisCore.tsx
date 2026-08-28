import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import type { AssistantState } from '../types/assistant';
import { VISUAL_STATE } from '../state/assistantMachine';

type Props = { state: AssistantState };

const FILAMENTS = Array.from({ length: 34 }, (_, i) => ({
  left: 18 + ((i * 19) % 64),
  top: 8 + ((i * 31) % 82),
  width: 18 + ((i * 13) % 62),
  rotate: -70 + ((i * 29) % 140),
  opacity: .12 + ((i % 5) * .07),
}));
const PARTICLES = Array.from({ length: 46 }, (_, i) => ({
  left: 4 + ((i * 37) % 92), top: 3 + ((i * 53) % 92), size: 1 + (i % 3),
}));

export function JarvisCore({ state }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const errorBlend = useRef(new Animated.Value(0)).current;
  const config = useMemo(() => VISUAL_STATE[state], [state]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse,{toValue:1,duration:Math.max(220,config.pulseSpeedMs/2),useNativeDriver:true}),
      Animated.timing(pulse,{toValue:0,duration:Math.max(220,config.pulseSpeedMs/2),useNativeDriver:true}),
    ])); loop.start(); return()=>loop.stop();
  },[config.pulseSpeedMs,pulse]);
  useEffect(()=>{const loop=Animated.loop(Animated.sequence([
    Animated.timing(float,{toValue:1,duration:2400,useNativeDriver:true}),
    Animated.timing(float,{toValue:0,duration:2400,useNativeDriver:true}),
  ]));loop.start();return()=>loop.stop();},[float]);
  useEffect(()=>{errorBlend.setValue(0);if(state!=='ERROR')return;if(Platform.OS!=='web')Vibration.vibrate([0,28,80,22]);Animated.sequence([
    Animated.timing(errorBlend,{toValue:1,duration:650,useNativeDriver:false}),Animated.delay(180),Animated.timing(errorBlend,{toValue:0,duration:750,useNativeDriver:false})]).start();},[state,errorBlend]);

  const bodyY=float.interpolate({inputRange:[0,1],outputRange:[5,-5]});
  const glow=pulse.interpolate({inputRange:[0,1],outputRange:[.55,1]});
  const coreScale=pulse.interpolate({inputRange:[0,1],outputRange:[.94,1.12]});
  const mouthScale=pulse.interpolate({inputRange:[0,1],outputRange:[.72,1.35]});
  const signal=errorBlend.interpolate({inputRange:[0,1],outputRange:[config.eyeColor,'#ff3030']});
  const heart=errorBlend.interpolate({inputRange:[0,1],outputRange:[config.heartColor,'#ff3030']});
  const awake=state==='IDLE'?0.38:1;

  return <View style={styles.stage}>
    <View style={styles.aura3}/><View style={styles.aura2}/><View style={styles.aura1}/>
    {PARTICLES.map((p,i)=><Animated.View key={'p'+i} style={[styles.particle,{left:`${p.left}%`,top:`${p.top}%`,width:p.size,height:p.size,opacity:glow}]}/>)}
    <Animated.View style={[styles.entity,{opacity:awake,transform:[{translateY:bodyY}]}]}>
      {FILAMENTS.map((f,i)=><View key={'f'+i} style={[styles.filament,{left:`${f.left}%`,top:`${f.top}%`,width:f.width,opacity:f.opacity,transform:[{rotate:`${f.rotate}deg`}]}]}/>)}
      <View style={styles.skullAura}/>
      <View style={styles.head}>
        <View style={styles.faceContour}/><View style={styles.cheekL}/><View style={styles.cheekR}/>
        <View style={styles.browL}/><View style={styles.browR}/>
        <Animated.View style={[styles.eye,styles.eyeL,{backgroundColor:signal,opacity:glow}]}/>
        <Animated.View style={[styles.eye,styles.eyeR,{backgroundColor:signal,opacity:glow}]}/>
        <View style={styles.noseBridge}/><View style={styles.noseTip}/>
        <Animated.View style={[styles.mouth,{backgroundColor:signal,opacity:glow,transform:[{scaleX:state==='SPEAKING'?mouthScale:1}]}]}/>
        <View style={styles.chin}/>
      </View>
      <View style={styles.neckL}/><View style={styles.neckR}/>
      <View style={styles.torso}>
        <View style={styles.clavicleL}/><View style={styles.clavicleR}/>
        <View style={styles.sternum}/><View style={styles.ribL1}/><View style={styles.ribR1}/><View style={styles.ribL2}/><View style={styles.ribR2}/>
        <Animated.View style={[styles.heartHalo,{opacity:glow,transform:[{scale:coreScale}]}]}/>
        <Animated.View style={[styles.heartCore,{backgroundColor:heart,opacity:glow,transform:[{scale:coreScale}]}]}/>
      </View>
      <View style={styles.dissolve}/>
    </Animated.View>
    <Text style={styles.stateLabel}>{state}</Text><Text style={styles.stateHint}>ENERGY PRESENCE // V1</Text>
  </View>;
}

const cyan='#2bdcff';
const styles=StyleSheet.create({
 stage:{width:'100%',minHeight:560,alignItems:'center',justifyContent:'center',overflow:'hidden'},
 aura3:{position:'absolute',width:430,height:430,borderRadius:215,backgroundColor:'rgba(0,108,145,.035)'},
 aura2:{position:'absolute',width:330,height:330,borderRadius:165,borderWidth:1,borderColor:'rgba(43,220,255,.10)'},
 aura1:{position:'absolute',width:230,height:230,borderRadius:115,backgroundColor:'rgba(18,192,238,.035)'},
 particle:{position:'absolute',borderRadius:4,backgroundColor:cyan,shadowColor:cyan,shadowOpacity:1,shadowRadius:5},
 entity:{width:330,height:450,alignItems:'center',position:'relative'},
 filament:{position:'absolute',height:1,backgroundColor:cyan,shadowColor:cyan,shadowOpacity:.8,shadowRadius:4},
 skullAura:{position:'absolute',top:20,width:185,height:205,borderRadius:95,backgroundColor:'rgba(20,190,235,.045)',shadowColor:cyan,shadowOpacity:.35,shadowRadius:30},
 head:{position:'absolute',top:35,width:132,height:172,borderTopLeftRadius:67,borderTopRightRadius:67,borderBottomLeftRadius:58,borderBottomRightRadius:58,borderWidth:1,borderColor:'rgba(64,226,255,.48)',backgroundColor:'rgba(0,12,20,.38)',shadowColor:cyan,shadowOpacity:.65,shadowRadius:20},
 faceContour:{position:'absolute',left:17,top:18,width:98,height:137,borderRadius:50,borderWidth:1,borderColor:'rgba(73,225,255,.18)'},
 cheekL:{position:'absolute',left:19,top:88,width:42,height:1,backgroundColor:'rgba(43,220,255,.28)',transform:[{rotate:'58deg'}]},
 cheekR:{position:'absolute',right:19,top:88,width:42,height:1,backgroundColor:'rgba(43,220,255,.28)',transform:[{rotate:'-58deg'}]},
 browL:{position:'absolute',left:25,top:57,width:32,height:2,backgroundColor:'rgba(58,222,255,.5)',transform:[{rotate:'5deg'}]},
 browR:{position:'absolute',right:25,top:57,width:32,height:2,backgroundColor:'rgba(58,222,255,.5)',transform:[{rotate:'-5deg'}]},
 eye:{position:'absolute',top:67,width:24,height:6,borderRadius:10,shadowColor:'#ff9300',shadowOpacity:1,shadowRadius:13},eyeL:{left:27},eyeR:{right:27},
 noseBridge:{position:'absolute',left:64,top:74,width:2,height:37,backgroundColor:'rgba(54,220,255,.34)'},
 noseTip:{position:'absolute',left:57,top:108,width:16,height:1,backgroundColor:'rgba(54,220,255,.25)'},
 mouth:{position:'absolute',left:45,top:128,width:41,height:4,borderRadius:8,shadowColor:'#ff9300',shadowOpacity:1,shadowRadius:12},
 chin:{position:'absolute',left:48,top:145,width:35,height:1,backgroundColor:'rgba(43,220,255,.22)'},
 neckL:{position:'absolute',top:198,left:128,width:2,height:58,backgroundColor:'rgba(43,220,255,.38)',transform:[{rotate:'10deg'}]},
 neckR:{position:'absolute',top:198,right:128,width:2,height:58,backgroundColor:'rgba(43,220,255,.38)',transform:[{rotate:'-10deg'}]},
 torso:{position:'absolute',top:232,width:280,height:180,borderTopLeftRadius:105,borderTopRightRadius:105,borderBottomLeftRadius:80,borderBottomRightRadius:80,borderWidth:1,borderColor:'rgba(43,220,255,.22)',backgroundColor:'rgba(0,17,26,.16)',shadowColor:cyan,shadowOpacity:.3,shadowRadius:25},
 clavicleL:{position:'absolute',left:35,top:36,width:100,height:1,backgroundColor:'rgba(43,220,255,.35)',transform:[{rotate:'-12deg'}]},clavicleR:{position:'absolute',right:35,top:36,width:100,height:1,backgroundColor:'rgba(43,220,255,.35)',transform:[{rotate:'12deg'}]},
 sternum:{position:'absolute',left:139,top:38,width:1,height:115,backgroundColor:'rgba(43,220,255,.25)'},
 ribL1:{position:'absolute',left:49,top:72,width:80,height:1,backgroundColor:'rgba(43,220,255,.18)',transform:[{rotate:'13deg'}]},ribR1:{position:'absolute',right:49,top:72,width:80,height:1,backgroundColor:'rgba(43,220,255,.18)',transform:[{rotate:'-13deg'}]},ribL2:{position:'absolute',left:57,top:105,width:72,height:1,backgroundColor:'rgba(43,220,255,.13)',transform:[{rotate:'18deg'}]},ribR2:{position:'absolute',right:57,top:105,width:72,height:1,backgroundColor:'rgba(43,220,255,.13)',transform:[{rotate:'-18deg'}]},
 heartHalo:{position:'absolute',right:74,top:58,width:64,height:64,borderRadius:32,backgroundColor:'rgba(255,137,0,.07)',shadowColor:'#ff8a00',shadowOpacity:1,shadowRadius:30},
 heartCore:{position:'absolute',right:94,top:77,width:25,height:31,borderRadius:13,shadowColor:'#ff8a00',shadowOpacity:1,shadowRadius:18,transform:[{rotate:'-14deg'}]},
 dissolve:{position:'absolute',bottom:3,width:220,height:35,borderRadius:110,backgroundColor:'rgba(43,220,255,.045)',shadowColor:cyan,shadowOpacity:.6,shadowRadius:18},
 stateLabel:{marginTop:8,color:'#82eeff',fontSize:13,letterSpacing:3.2,fontWeight:'800'},stateHint:{marginTop:6,color:'#356f7a',fontSize:9,letterSpacing:2,fontWeight:'700'}
});
