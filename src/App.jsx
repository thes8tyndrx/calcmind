import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from './hooks/useAuth';
import { useLeaderboard } from './hooks/useLeaderboard';// ─── Theme ────────────────────────────────────────────────────────────────────
const GOLD="#C8901C", GREEN="#4DC758", RED="#D95252", BLUE="#4A9EFF", PINK="#FF6B8A";
const THEMES={
  dark:{bg:"#1A1B22",hdr:"#1F2029",card:"#25262F",card2:"#2C2D38",
    border:"rgba(255,255,255,0.09)",text:"#EEEEF2",sub:"rgba(238,238,242,0.45)",
    muted:"rgba(238,238,242,0.22)",inputBg:"rgba(255,255,255,0.05)",
    navBg:"#1F2029",scrollThumb:"rgba(255,255,255,0.1)",
    weakBg:"rgba(217,82,82,0.07)",weakBorder:"rgba(217,82,82,0.2)"},
  light:{bg:"#F5F4F0",hdr:"#FFFFFF",card:"#FFFFFF",card2:"#F0EFE9",
    border:"rgba(0,0,0,0.09)",text:"#1A1A1A",sub:"rgba(0,0,0,0.45)",
    muted:"rgba(0,0,0,0.22)",inputBg:"rgba(0,0,0,0.04)",
    navBg:"#FFFFFF",scrollThumb:"rgba(0,0,0,0.12)",
    weakBg:"rgba(217,82,82,0.05)",weakBorder:"rgba(217,82,82,0.2)"},
};

const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const shuffle=a=>[...a].sort(()=>Math.random()-0.5);
const pick=arr=>arr[rand(0,arr.length-1)];
const gcd=(a,b)=>b===0?a:gcd(b,a%b);

// ─── localStorage helpers (with in-memory fallback for restricted envs) ─────────
const _mem={};
const LS={
  get:(k,def)=>{
    try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):(_mem[k]??def);}
    catch{return _mem[k]??def;}
  },
  set:(k,v)=>{
    try{localStorage.setItem(k,JSON.stringify(v));}catch{}
    _mem[k]=v;
  },
};

// ─── Ranks ────────────────────────────────────────────────────────────────────
const RANKS=[
  {min:0,   label:"Novice",    color:"#8A8FA8",icon:"○"},
  {min:150, label:"Apprentice",color:BLUE,     icon:"◈"},
  {min:400, label:"Calculator",color:GREEN,    icon:"⊞"},
  {min:900, label:"Analyst",   color:GOLD,     icon:"◆"},
  {min:2000,label:"Expert",    color:"#C45AFF",icon:"✦"},
  {min:4000,label:"Master",    color:RED,      icon:"★"},
  {min:8000,label:"Legend",    color:"#FFD700",icon:"⬡"},
];
const getRank=xp=>{let r=RANKS[0];for(const R of RANKS)if(xp>=R.min)r=R;return r;};
const nextRank=xp=>{const i=RANKS.findIndex(r=>xp<r.min);return i>0?RANKS[i]:null;};
const LVL_NAMES=["Starter","Basic","Moderate","Advanced","Expert"];
const LVL_COLORS=[GREEN,"#56C4C4",GOLD,"#C45AFF",RED];
const LVL_XP=[5,10,18,28,45];
const QS_PER_LEVEL=15;

// ─── FRAC TABLE ───────────────────────────────────────────────────────────────
const FRAC_TABLE=[
  {n:1,d:2,pct:50},{n:1,d:3,pct:33.33},{n:2,d:3,pct:66.67},
  {n:1,d:4,pct:25},{n:3,d:4,pct:75},
  {n:1,d:5,pct:20},{n:2,d:5,pct:40},{n:3,d:5,pct:60},{n:4,d:5,pct:80},
  {n:1,d:6,pct:16.67},{n:5,d:6,pct:83.33},
  {n:1,d:7,pct:14.28},{n:2,d:7,pct:28.57},{n:3,d:7,pct:42.86},
  {n:1,d:8,pct:12.5},{n:3,d:8,pct:37.5},{n:5,d:8,pct:62.5},{n:7,d:8,pct:87.5},
  {n:1,d:9,pct:11.11},{n:2,d:9,pct:22.22},
  {n:1,d:10,pct:10},{n:3,d:10,pct:30},{n:7,d:10,pct:70},
  {n:1,d:11,pct:9.09},{n:1,d:12,pct:8.33},{n:1,d:15,pct:6.67},
  {n:1,d:16,pct:6.25},{n:2,d:15,pct:13.33},{n:4,d:15,pct:26.67},
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── GENERATORS ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function genArith(lvl){
  const ops=lvl===0?["+","-"]:lvl===1?["+","-","×"]:["+","-","×","÷"];
  const o=pick(ops);
  let a,b,ans,display;
  if(o==="+"){
    a=lvl<2?rand(11,79):lvl<3?rand(100,699):lvl<4?rand(500,4999):rand(2000,29999);
    b=lvl<2?rand(11,79):lvl<3?rand(100,699):lvl<4?rand(500,4999):rand(2000,29999);
    ans=a+b;display=`${a} + ${b}`;
  }else if(o==="-"){
    a=lvl<2?rand(30,99):lvl<3?rand(200,999):lvl<4?rand(1000,9999):rand(5000,49999);
    b=lvl<2?rand(11,a-2):lvl<3?rand(50,a-10):lvl<4?rand(100,a-50):rand(500,a-100);
    ans=a-b;display=`${a} − ${b}`;
  }else if(o==="×"){
    if(lvl===1){a=rand(11,19);b=rand(2,9);}
    else if(lvl===2){a=rand(11,25);b=rand(11,19);}
    else if(lvl===3){a=rand(21,49);b=rand(21,30);}
    else{a=rand(31,99);b=rand(21,49);}
    ans=a*b;display=`${a} × ${b}`;
  }else{
    const divs=[[2,9],[2,9],[11,19],[11,25],[21,40]];
    const[bmin,bmax]=divs[Math.min(lvl,4)];
    b=rand(bmin,bmax);ans=rand(11,80);a=ans*b;display=`${a} ÷ ${b}`;
  }
  return{display,ans:String(ans),type:"arith"};
}

// Custom Table Generator — takes exact config
function genCustomTable(cfg){
  const{tableFrom,tableTo,byFrom,byTo,includeReverse}=cfg;
  const a=rand(tableFrom,tableTo);
  const b=rand(byFrom,byTo);
  if(includeReverse&&rand(0,1)){
    // Division question (reverse)
    const dividend=a*b;
    return{display:`${dividend} ÷ ${a}`,ans:String(b),type:"customTable"};
  }
  return{display:`${a} × ${b}`,ans:String(a*b),type:"customTable"};
}

function genTable(lvl){
  const c=[[2,9,2,9],[11,19,2,9],[11,25,11,15],[11,40,11,19],[21,70,21,50]][Math.min(lvl,4)];
  const a=rand(c[0],c[1]),b=rand(c[2],c[3]);
  return{display:`${a} × ${b}`,ans:String(a*b),type:"table"};
}

function genDivision(lvl){
  const c=[[2,9,2,9],[11,25,2,9],[11,30,11,15],[21,50,11,19],[21,80,21,40]][Math.min(lvl,4)];
  const b=rand(c[2],c[3]),ans=rand(c[0],c[1]);
  return{display:`${ans*b} ÷ ${b}`,ans:String(ans),type:"division"};
}

function genSqCb(lvl){
  const byLvl=[
    {types:["sq","sqrt"],sqR:[2,12],sqrtR:[2,12],cbR:[2,9],cbrtR:[2,9]},
    {types:["sq","sqrt","cb"],sqR:[11,20],sqrtR:[11,20],cbR:[2,10],cbrtR:[2,10]},
    {types:["sq","sqrt","cb","cbrt"],sqR:[21,30],sqrtR:[2,20],cbR:[11,15],cbrtR:[2,12]},
    {types:["sq","cb","cbrt"],sqR:[31,50],sqrtR:[2,25],cbR:[11,18],cbrtR:[2,12]},
    {types:["sq","cb","cbrt"],sqR:[51,99],sqrtR:[2,30],cbR:[11,20],cbrtR:[2,12]},
  ][Math.min(lvl,4)];
  const t=pick(byLvl.types);
  let display,ans;
  if(t==="sq"){const n=rand(byLvl.sqR[0],byLvl.sqR[1]);ans=n*n;display=`${n}²`;}
  else if(t==="sqrt"){const n=rand(byLvl.sqrtR[0],byLvl.sqrtR[1]);ans=n;display=`√${n*n}`;}
  else if(t==="cb"){const n=rand(byLvl.cbR[0],byLvl.cbR[1]);ans=n*n*n;display=`${n}³`;}
  else{const n=rand(byLvl.cbrtR[0],byLvl.cbrtR[1]);ans=n;display=`∛${n*n*n}`;}
  return{display,ans:String(ans),type:"sqcb"};
}

// ─── SERIES — Full pattern library ───────────────────────────────────────────
const PRIMES=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97];

const SERIES_PATTERNS={
  // ── Arithmetic ──
  ap_simple:()=>{
    const s=rand(1,20),d=rand(2,9);
    return Array.from({length:6},(_,i)=>s+i*d);
  },
  ap_large:()=>{
    const s=rand(10,100),d=rand(10,50);
    return Array.from({length:6},(_,i)=>s+i*d);
  },
  ap_negative:()=>{
    const s=rand(50,200),d=rand(5,20);
    const a=Array.from({length:6},(_,i)=>s-i*d);
    return a[5]>0?a:null;
  },
  ap_double:()=>{
    // Two interleaved APs: 2,3,4,6,6,9,8,12...
    const s1=rand(1,5),d1=rand(2,6),s2=rand(1,5),d2=rand(3,8);
    const a=[];for(let i=0;i<3;i++){a.push(s1+i*d1);a.push(s2+i*d2);}
    return a;
  },
  // ── Geometric ──
  gp_x2:()=>{
    const s=rand(1,6);const a=Array.from({length:6},(_,i)=>s*Math.pow(2,i));
    return a[5]>3000?null:a;
  },
  gp_x3:()=>{
    const s=rand(1,4);const a=Array.from({length:5},(_,i)=>s*Math.pow(3,i));
    return a[4]>2500?null:a;
  },
  gp_x4:()=>{
    const s=rand(1,3);const a=Array.from({length:5},(_,i)=>s*Math.pow(4,i));
    return a[4]>3000?null:a;
  },
  gp_half:()=>{
    // Decreasing GP: 96, 48, 24, 12, 6
    const end=rand(1,4),r=[2,3][rand(0,1)];
    const a=Array.from({length:5},(_,i)=>end*Math.pow(r,4-i));
    return a;
  },
  // ── Squares / Cubes ──
  sq_basic:()=>Array.from({length:6},(_,i)=>(i+1)*(i+1)),
  sq_offset:()=>{const s=rand(2,8);return Array.from({length:6},(_,i)=>(s+i)*(s+i));},
  sq_plus_k:()=>{const s=rand(1,5),k=rand(2,9);return Array.from({length:6},(_,i)=>(s+i)*(s+i)+k);},
  sq_plus_n:()=>{const s=rand(1,5);return Array.from({length:6},(_,i)=>(s+i)*(s+i)+(s+i));}, // n²+n
  cb_basic:()=>Array.from({length:5},(_,i)=>(i+1)**3),
  cb_offset:()=>{const s=rand(2,6);return Array.from({length:5},(_,i)=>(s+i)**3);},
  cb_plus_k:()=>{const s=rand(1,4),k=rand(2,7);return Array.from({length:5},(_,i)=>(s+i)**3+k*(i+1));},
  // ── Difference patterns ──
  diff2_const:()=>{
    // 2nd difference constant: 1,2,4,7,11,16 (diffs: 1,2,3,4,5)
    const s=rand(1,10),d1=rand(1,5),dstep=rand(1,3);
    const a=[s,s+d1];
    let d=d1;
    for(let i=2;i<6;i++){d+=dstep;a.push(a[i-1]+d);}
    return a;
  },
  diff2_gp:()=>{
    // Differences are GP: 1,3,7,15,31 (diffs: 2,4,8,16)
    const s=rand(1,5);const a=[s];
    let diff=rand(1,3);
    for(let i=1;i<6;i++){a.push(a[i-1]+diff);diff*=2;}
    return a[5]>5000?null:a;
  },
  diff3_const:()=>{
    // 3rd difference constant (like triangular numbers): 0,1,4,10,20,35
    const s=rand(0,5);
    const a=[s];let d1=rand(1,4),d2=rand(0,2),d3=rand(1,2);
    a.push(s+d1);d1+=d2;
    for(let i=2;i<6;i++){a.push(a[i-1]+d1);d1+=d2;d2+=d3;}
    return a[5]<10000?a:null;
  },
  // ── Prime-based ──
  prime_seq:()=>PRIMES.slice(rand(0,5),rand(5,11)).slice(0,6),
  prime_plus1:()=>PRIMES.slice(0,6).map(p=>p+1),
  prime_x2:()=>{const a=PRIMES.slice(0,6).map(p=>p*2);return a;},
  prime_xd:()=>{const d=pick([3,5,7]);return PRIMES.slice(0,6).map(p=>p*d);},
  prime_diff:()=>{
    // Differences are primes: 1, 3, 6, 11, 18, 29 (diffs: 2,3,5,7,11)
    const s=rand(1,5);const a=[s];
    for(let i=0;i<5;i++)a.push(a[i]+PRIMES[i]);
    return a;
  },
  skip_prime:()=>{
    // Every other prime: 2,5,11,17,23
    return PRIMES.filter((_,i)=>i%2===0).slice(0,6);
  },
  mult_special:()=>{
    // Multiples of special numbers: 7, 11, 13, 17, 37
    const base=pick([7,11,13,17,19,23,37]);
    const start=rand(1,5);
    return Array.from({length:6},(_,i)=>base*(start+i));
  },
  // ── Mixed / Fibonacci ──
  fibonacci:()=>{const a=rand(1,5),b=rand(1,8);const f=[a,b];for(let i=2;i<7;i++)f.push(f[i-1]+f[i-2]);return f;},
  lucas:()=>[2,1,3,4,7,11,18].slice(0,6),
  triangular:()=>Array.from({length:6},(_,i)=>(i+1)*(i+2)/2),
  // ── HP (Harmonic Progression: reciprocals form AP) ──
  hp_simple:()=>{
    // Show as fractions expressed as simple values where AP of denominators
    // e.g. 1/2, 1/4, 1/6, 1/8 -> we show 6,3,2... no, HP is hard to display
    // Instead: differences that decrease multiplicatively
    const s=rand(60,120),r=[2,3,4][rand(0,2)];
    const a=[];let cur=s;
    for(let i=0;i<5;i++){a.push(cur);if(cur%r!==0)return null;cur=cur/r;}
    return a[4]>0&&Number.isInteger(a[4])?a:null;
  },
  // ── n(n+1) pattern ──
  n_np1:()=>{
    const s=rand(1,5);
    return Array.from({length:6},(_,i)=>(s+i)*(s+i+1));
  },
  // ── Alternating sign add/subtract ──
  alt_diff:()=>{
    const s=rand(5,30),d1=rand(3,12),d2=rand(2,8);
    const a=[s];
    for(let i=1;i<6;i++)a.push(a[i-1]+(i%2===1?d1:-d2));
    return a.every(v=>v>0)?a:null;
  },
};

// ─── WRONG NUMBER GENERATOR ───────────────────────────────────────────────────
function makeWrongSeries(){
  const patternKeys=Object.keys(SERIES_PATTERNS);
  let correct=null,tries=0;
  while(!correct&&tries<30){
    const fn=SERIES_PATTERNS[pick(patternKeys)];
    const g=fn?.();
    if(g&&Array.isArray(g)&&g.length>=5&&g.every(v=>Number.isFinite(v)&&v>=0&&v<100000))correct=g;
    tries++;
  }
  if(!correct)correct=[3,6,9,12,15,18];

  // Inject error — vary the corruption type
  const errIdx=rand(2,correct.length-1);
  const realVal=correct[errIdx];
  let wrongVal;
  const corruptType=rand(0,3);
  if(corruptType===0){
    // Off by constant ±(1-5)
    const offsets=[-5,-4,-3,-2,-1,1,2,3,4,5].filter(p=>realVal+p>0&&realVal+p!==realVal);
    wrongVal=realVal+(pick(offsets)||2);
  }else if(corruptType===1&&errIdx>0){
    // Off by ratio — make it as if GP ratio was different
    const wrongRatio=[2,3,4][rand(0,2)];
    wrongVal=Math.round(correct[errIdx-1]*wrongRatio);
    if(wrongVal===realVal||wrongVal<=0)wrongVal=realVal+pick([3,-3,5,-5]);
  }else if(corruptType===2){
    // Off by one step — as if starting index was different
    wrongVal=realVal+(realVal-correct[errIdx-1])+rand(-2,2);
    if(wrongVal===realVal||wrongVal<=0)wrongVal=realVal+3;
  }else{
    // Random nearby value
    wrongVal=realVal+pick([-6,-4,-2,2,4,6]);
    if(wrongVal<=0)wrongVal=realVal+4;
  }
  wrongVal=Math.max(1,Math.round(wrongVal));
  if(wrongVal===realVal)wrongVal=realVal+2;

  const displayed=correct.map((v,i)=>i===errIdx?wrongVal:v);
  return{
    display:"Find the WRONG number:",
    ans:String(wrongVal),
    seqVis:displayed,
    missingIdx:-1,
    wrongIdx:errIdx,
    isWrongType:true,
    correctVal:realVal,
    type:"series",
  };
}

// ─── SERIES GENERATOR ─────────────────────────────────────────────────────────
function genSeries(lvl,forcedPattern=null){
  // 30% chance wrong-number at L2+, 50% at L4
  const wrongChance=lvl>=4?0.5:lvl>=2?0.3:0;
  if(Math.random()<wrongChance)return makeWrongSeries();

  // Pool by level — harder patterns unlock progressively
  const poolByLvl={
    0:["ap_simple","ap_large"],
    1:["ap_simple","ap_large","gp_x2","gp_x3","sq_basic","sq_offset"],
    2:["ap_large","ap_negative","gp_x2","gp_x3","gp_x4","sq_offset","sq_plus_k","cb_basic","diff2_const","fibonacci","triangular"],
    3:["ap_double","gp_half","sq_plus_k","sq_plus_n","cb_offset","diff2_const","diff2_gp","prime_seq","prime_diff","fibonacci","n_np1","alt_diff","mult_special"],
    4:["ap_double","gp_half","cb_plus_k","diff2_gp","diff3_const","prime_plus1","prime_xd","prime_xd","skip_prime","prime_diff","mult_special","hp_simple","n_np1","lucas"],
  };

  const keys=forcedPattern?[forcedPattern]:(poolByLvl[Math.min(lvl,4)]||poolByLvl[0]);
  let seq=null,tries=0;
  while(!seq&&tries<40){
    const key=pick(keys);
    const fn=SERIES_PATTERNS[key];
    const g=fn?.();
    if(g&&Array.isArray(g)&&g.length>=5&&g.every(v=>Number.isFinite(v)&&v>=0&&v<100000))seq=g;
    tries++;
  }
  if(!seq)seq=[3,6,9,12,15,18];

  const missingIdx=rand(Math.max(2,seq.length-2),seq.length-1);
  return{display:"",ans:String(seq[missingIdx]),seqVis:seq,missingIdx,isWrongType:false,type:"series"};
}

// Custom series — explicit pattern type chosen by user
function genCustomSeries(cfg){
  const{pattern,includeWrong}=cfg;
  if(includeWrong&&rand(0,1)===0)return makeWrongSeries();
  return genSeries(2,pattern);
}

function genPctRatio(lvl){
  const subtypes=[
    ["frac_pct"],
    ["frac_pct","pct_of","ratio_simple"],
    ["pct_of","ratio_find","pct_change"],
    ["ratio_find","pct_reverse","ratio_chain"],
    ["ratio_chain","pct_reverse","compound"],
  ][Math.min(lvl,4)];
  const sub=pick(subtypes);
  let display,ans,hint="";
  if(sub==="frac_pct"){
    const pool=lvl<2?FRAC_TABLE.filter(f=>f.d<=8):FRAC_TABLE;
    const f=pick(pool);
    const isRev=lvl>1&&rand(0,1);
    if(isRev){display=`${f.pct}% = ?/${f.d}`;ans=String(f.n);}
    else{display=`${f.n}/${f.d} = ?%`;ans=String(Math.round(f.pct));hint=`÷${f.d}×100`;}
  }else if(sub==="pct_of"){
    const p=pick([10,12.5,20,25,33,50,75]);
    const base=rand(2,20)*20;
    ans=Math.round(p*base/100);display=`${p}% of ${base}`;
  }else if(sub==="ratio_simple"){
    const a=rand(2,8),b=rand(2,8),total=rand(2,10)*(a+b);
    const type=rand(0,1);
    ans=type===0?total*a/(a+b):total*b/(a+b);
    display=`A:B = ${a}:${b}\nTotal=${total}, ${type===0?"A":"B"}=?`;
  }else if(sub==="ratio_find"){
    const a=rand(2,9),b=rand(2,9),mult=rand(3,15);
    const t=rand(0,2);
    if(t===0){display=`A:B = ${a}:${b}, A = ${a*mult}\nB = ?`;ans=b*mult;}
    else if(t===1){const total=(a+b)*mult;display=`A:B = ${a}:${b}\nTotal=${total}, A−B=?`;ans=Math.abs(a-b)*mult;}
    else{const av=a*mult,bv=b*mult,g=gcd(av,bv);display=`A=${av}, B=${bv}\nA:B = ?:${bv/g}`;ans=av/g;}
  }else if(sub==="pct_change"){
    const base=rand(2,12)*100,r=pick([10,20,25,50]),inc=rand(0,1);
    ans=inc?base+base*r/100:base-base*r/100;
    display=`${base} ${inc?"increased":"decreased"}\nby ${r}% = ?`;
  }else if(sub==="pct_reverse"){
    const ans_=rand(3,20)*10,r=pick([10,20,25,50]);
    const base=ans_*100/(100-r);
    if(!Number.isInteger(base))return genPctRatio(lvl);
    display=`After ${r}% decrease = ${ans_}\noriginal = ?`;ans=base;
  }else if(sub==="ratio_chain"){
    const a=rand(2,5),b=rand(2,5),c=rand(2,5),mult=rand(3,10);
    const total=(a+b+c)*mult,part=rand(0,2);
    display=`A:B:C = ${a}:${b}:${c}\nTotal=${total}, ${["A","B","C"][part]}=?`;
    ans=[a,b,c][part]*mult;
  }else{
    const p=rand(3,15)*500,r=pick([10,20]);
    ans=Math.round(p*Math.pow(1+r/100,2));
    display=`P=₹${p}, r=${r}%\nCI 2yr amount=?`;hint=`P×(1+r)²`;
  }
  return{display,ans:String(Math.round(ans)),hint,type:"pctRatio"};
}

function genMensuration(lvl){
  const PI=3.14;
  const byLvl=[
    ["rect_area","rect_peri","sq_area","sq_peri","tri_area"],
    ["rect_area","sq_area","tri_area","rhombus","circle_area","circle_peri"],
    ["circle_area","circle_peri","trap_area","tri_area","cube_vol","cuboid_vol"],
    ["cylinder_vol","cone_vol","sphere_vol","prism_vol","pyramid_vol"],
    ["cylinder_area","cone_area","sphere_area","prism_vol","pyramid_vol","cylinder_vol","cone_vol"],
  ][Math.min(lvl,4)];
  const s=pick(byLvl);
  let display,ans,hint;
  const m=(sh,ca,h)=>{display=sh;ans=ca;hint=h;};
  if(s==="rect_area"){const l=rand(3,20),b=rand(2,15);m(`Rectangle\nl=${l}, b=${b}\nArea=?`,l*b,"A=l×b");}
  else if(s==="rect_peri"){const l=rand(3,20),b=rand(2,15);m(`Rectangle\nl=${l}, b=${b}\nPerimeter=?`,2*(l+b),"P=2(l+b)");}
  else if(s==="sq_area"){const a=rand(3,25);m(`Square side=${a}\nArea=?`,a*a,"A=s²");}
  else if(s==="sq_peri"){const a=rand(3,25);m(`Square side=${a}\nPerimeter=?`,4*a,"P=4s");}
  else if(s==="tri_area"){const b=rand(2,15)*2,h=rand(2,15);m(`Triangle\nb=${b}, h=${h}\nArea=?`,b*h/2,"A=½bh");}
  else if(s==="rhombus"){const d1=rand(2,15)*2,d2=rand(2,15);m(`Rhombus\nd₁=${d1}, d₂=${d2}\nArea=?`,d1*d2/2,"A=d₁d₂÷2");}
  else if(s==="circle_area"){const r=rand(3,14);m(`Circle r=${r}\nArea=? (π=3.14)`,Math.round(PI*r*r),"A=πr²");}
  else if(s==="circle_peri"){const r=rand(3,14);m(`Circle r=${r}\nCircumference=?`,Math.round(2*PI*r),"C=2πr");}
  else if(s==="trap_area"){const a=rand(3,15),b=rand(5,20),h=(a+b)%2===0?rand(2,10):rand(2,10)*2;m(`Trapezium\na=${a}, b=${b}, h=${h}\nArea=?`,(a+b)*h/2,"A=½(a+b)h");}
  else if(s==="cube_vol"){const a=rand(2,12);m(`Cube side=${a}\nVolume=?`,a*a*a,"V=s³");}
  else if(s==="cuboid_vol"){const l=rand(3,12),b=rand(2,10),h=rand(2,8);m(`Cuboid\n${l}×${b}×${h}\nVolume=?`,l*b*h,"V=l×b×h");}
  else if(s==="cylinder_vol"){const r=rand(3,9),h=rand(4,14);m(`Cylinder\nr=${r}, h=${h}\nVol=?`,Math.round(PI*r*r*h),"V=πr²h");}
  else if(s==="cylinder_area"){const r=rand(3,9),h=rand(4,14);m(`Cylinder\nr=${r}, h=${h}\nTotal SA=?`,Math.round(2*PI*r*(r+h)),"2πr(r+h)");}
  else if(s==="cone_vol"){const r=rand(3,8),h=rand(6,15);m(`Cone\nr=${r}, h=${h}\nVol=?`,Math.round(PI*r*r*h/3),"V=⅓πr²h");}
  else if(s==="cone_area"){const r=rand(3,8),l=rand(6,15);m(`Cone\nr=${r}, slant=${l}\nSA=?`,Math.round(PI*r*(r+l)),"πr(r+l)");}
  else if(s==="sphere_vol"){const r=rand(2,8);m(`Sphere r=${r}\nVol=?`,Math.round(4/3*PI*r*r*r),"V=4/3πr³");}
  else if(s==="sphere_area"){const r=rand(2,8);m(`Sphere r=${r}\nSurface Area=?`,Math.round(4*PI*r*r),"A=4πr²");}
  else if(s==="prism_vol"){const b=rand(2,10)*2,h=rand(2,8),l=rand(4,12);m(`Tri. Prism\nb=${b},h=${h},l=${l}\nVol=?`,b*h/2*l,"V=½bhl");}
  else{const b=rand(3,10),h=rand(4,12);m(`Sq. Pyramid\nbase=${b}, h=${h}\nVol=?`,Math.round(b*b*h/3),"V=⅓b²h");}
  return{display,ans:String(ans),hint,type:"mensur"};
}

const SEAT_NAMES=["A","B","C","D","E","F","G","H"];
function genSeating(lvl){
  const n=Math.min(5+Math.floor(lvl/1.5),8);
  const isCircular=lvl>=2&&rand(0,1)===1;
  const arr=shuffle(SEAT_NAMES.slice(0,n));
  const t=rand(0,isCircular?6:6);
  let question,ans,hl=[],options=null;
  if(t===0){const i1=rand(0,n-3),i2=rand(i1+2,n-1);ans=String(i2-i1-1);question=`How many sit between ${arr[i1]} and ${arr[i2]}?`;hl=[i1,i2];}
  else if(t===1){const p=rand(1,n);ans=arr[p-1];const s=["st","nd","rd","th","th","th","th","th"][p-1];question=`Who is ${p}${s} from the left?`;hl=[p-1];}
  else if(t===2){const i=rand(0,n-1);ans=String(n-i);question=`What is ${arr[i]}'s position from the right?`;hl=[i];}
  else if(t===3){const i=rand(0,n-2);ans=arr[i+1];question=`Who sits immediately to the right of ${arr[i]}?`;hl=[i,i+1];const nonImm=arr.filter((_,j)=>j!==i+1&&j!==i);options=shuffle([ans,...shuffle(nonImm).slice(0,3)]);}
  else if(t===4){const i=rand(1,n-1);ans=arr[i-1];question=`Who sits immediately to the left of ${arr[i]}?`;hl=[i-1,i];const nonImm=arr.filter((_,j)=>j!==i-1&&j!==i);options=shuffle([ans,...shuffle(nonImm).slice(0,3)]);}
  else if(t===5){const i=rand(1,n-1);ans=arr[i-1];question=`Who is to the left of ${arr[i]}?`;hl=Array.from({length:i},(_,j)=>j).concat(i);const rightSide=arr.filter((_,j)=>j>i);const leftSide=arr.filter((_,j)=>j<i-1);options=shuffle([ans,...shuffle([...rightSide,...leftSide]).slice(0,3)]);}
  else{const i=rand(0,n-2);ans=arr[i+1];question=`Who is to the right of ${arr[i]}?`;hl=[i,...Array.from({length:n-i-1},(_,j)=>i+1+j)];const leftSide=arr.filter((_,j)=>j<i);const rightSide=arr.filter((_,j)=>j>i+1);options=shuffle([ans,...shuffle([...leftSide,...rightSide]).slice(0,3)]);}
  if(isCircular){const i=rand(0,n-1);const r=(i+1)%n;ans=arr[r];question=`[Circular] Clockwise neighbour of ${arr[i]}?`;hl=[i,r];options=null;}
  return{type:"seating",arrangement:arr,hl,question,display:question,ans,circular:isCircular,seatOptions:options};
}

const MN=["Ram","Raj","Arun","Suresh","Mohan","Arjun","Vivek","Tarun","Rohit","Dev"];
const FN=["Sita","Priya","Anita","Sunita","Meena","Kavya","Rekha","Neha","Pooja","Tara"];
const ALL_RELATIONS=["Father","Mother","Son","Daughter","Brother","Sister","Uncle","Aunt","Grandfather","Grandmother","Nephew","Niece","Cousin","Grandson","Granddaughter","Husband","Wife"];
function genBloodRelation(lvl){
  const m=()=>pick(MN);const f=()=>pick(FN);
  const templates=[
    ()=>{const p1=m(),p2=f();return{nodes:[{id:"A",name:p1,sex:"M"},{id:"B",name:p2,sex:"F"}],edges:[{from:"A",to:"B",rel:"="}],qs:[{q:`How is ${p1} related to ${p2}?`,a:"Husband",from:"A",to:"B"},{q:`How is ${p2} related to ${p1}?`,a:"Wife",from:"B",to:"A"}]};},
    ()=>{const fa=m(),mo=f(),ch=m();return{nodes:[{id:"FA",name:fa,sex:"M"},{id:"MO",name:mo,sex:"F"},{id:"CH",name:ch,sex:"M"}],edges:[{from:"FA",to:"MO",rel:"="},{from:"FA",to:"CH",rel:"↓"},{from:"MO",to:"CH",rel:"↓"}],qs:[{q:`How is ${fa} related to ${ch}?`,a:"Father",from:"FA",to:"CH"},{q:`How is ${mo} related to ${ch}?`,a:"Mother",from:"MO",to:"CH"},{q:`How is ${ch} related to ${fa}?`,a:"Son",from:"CH",to:"FA"}]};},
    ()=>{const gf=m(),gm=f(),fa=m(),ch=m();return{nodes:[{id:"GF",name:gf,sex:"M"},{id:"GM",name:gm,sex:"F"},{id:"FA",name:fa,sex:"M"},{id:"CH",name:ch,sex:"M"}],edges:[{from:"GF",to:"GM",rel:"="},{from:"GF",to:"FA",rel:"↓"},{from:"GM",to:"FA",rel:"↓"},{from:"FA",to:"CH",rel:"↓"}],qs:[{q:`How is ${gf} related to ${ch}?`,a:"Grandfather",from:"GF",to:"CH"},{q:`How is ${gm} related to ${ch}?`,a:"Grandmother",from:"GM",to:"CH"},{q:`How is ${ch} related to ${gf}?`,a:"Grandson",from:"CH",to:"GF"}]};},
    ()=>{const fa=m(),mo=f(),br=m(),si=f(),ch=m();return{nodes:[{id:"FA",name:fa,sex:"M"},{id:"MO",name:mo,sex:"F"},{id:"BR",name:br,sex:"M"},{id:"SI",name:si,sex:"F"},{id:"CH",name:ch,sex:"M"}],edges:[{from:"FA",to:"MO",rel:"="},{from:"FA",to:"BR",rel:"↓"},{from:"MO",to:"BR",rel:"↓"},{from:"FA",to:"SI",rel:"↓"},{from:"MO",to:"SI",rel:"↓"},{from:"BR",to:"SI",rel:"—"},{from:"BR",to:"CH",rel:"↓"}],qs:[{q:`How is ${si} related to ${br}?`,a:"Sister",from:"SI",to:"BR"},{q:`How is ${si} related to ${ch}?`,a:"Aunt",from:"SI",to:"CH"},{q:`How is ${ch} related to ${si}?`,a:"Nephew",from:"CH",to:"SI"}]};},
    ()=>{const gf=m(),gm=f(),fa1=m(),fa2=m(),c1=m(),c2=f();return{nodes:[{id:"GF",name:gf,sex:"M"},{id:"GM",name:gm,sex:"F"},{id:"F1",name:fa1,sex:"M"},{id:"F2",name:fa2,sex:"M"},{id:"C1",name:c1,sex:"M"},{id:"C2",name:c2,sex:"F"}],edges:[{from:"GF",to:"GM",rel:"="},{from:"GF",to:"F1",rel:"↓"},{from:"GM",to:"F1",rel:"↓"},{from:"GF",to:"F2",rel:"↓"},{from:"GM",to:"F2",rel:"↓"},{from:"F1",to:"F2",rel:"—"},{from:"F1",to:"C1",rel:"↓"},{from:"F2",to:"C2",rel:"↓"}],qs:[{q:`How is ${c2} related to ${c1}?`,a:"Cousin",from:"C2",to:"C1"},{q:`How is ${fa2} related to ${c1}?`,a:"Uncle",from:"F2",to:"C1"},{q:`How is ${gf} related to ${c1}?`,a:"Grandfather",from:"GF",to:"C1"}]};},
  ];
  const byLvl=[[0,1],[1,2],[2,3],[3,4],[3,4,4]][Math.min(lvl,4)];
  const tpl=templates[pick(byLvl)]();
  const chosen=pick(tpl.qs);
  const wrongs=shuffle(ALL_RELATIONS.filter(r=>r!==chosen.a)).slice(0,3);
  return{type:"blood",nodes:tpl.nodes,edges:tpl.edges,display:chosen.q,ans:chosen.a,options:shuffle([chosen.a,...wrongs]),fromId:chosen.from,toId:chosen.to};
}

function genChain(lvl){
  const pools=[
    [()=>{const a=rand(10,25),b=rand(2,5),c=rand(2,8);return{d:`(${a}+${b})×${c}`,a:(a+b)*c};},()=>{const a=rand(5,15),b=rand(2,6),c=rand(3,8);return{d:`${a}×${b}+${c}`,a:a*b+c};},],
    [()=>{const a=rand(12,25),b=rand(11,15),c=rand(5,40);const r=a*b-c;return r>0?{d:`${a}×${b}−${c}`,a:r}:null;},()=>{const a=rand(5,12),b=rand(3,9),c=rand(4,10),d=rand(3,8);return{d:`${a}×${b}+${c}×${d}`,a:a*b+c*d};},()=>{const base=rand(2,10)*100,r=pick([10,20,25]);return{d:`${base}+${r}% of ${base}`,a:base+base*r/100};},],
    [()=>{const a=rand(15,30),b=rand(2,8);return{d:`${a}²−${b}²`,a:a*a-b*b};},()=>{const cp=rand(2,15)*100,r=pick([10,20,25]),loss=rand(0,1);const sp=loss?cp-cp*r/100:cp+cp*r/100;return{d:`CP=₹${cp}, ${loss?"Loss":"Profit"} ${r}%\nSP=?`,a:sp};},],
    [()=>{const a=rand(51,99),b=rand(51,99);return{d:`${a}×${b}`,a:a*b};},()=>{const p=rand(2,20)*500,r=pick([5,8,10,12]),y=rand(2,4);return{d:`P=₹${p},r=${r}%\nSI for ${y}yr=?`,a:p*r*y/100};},],
    [()=>{const a=rand(99,120),b=rand(99,120);return{d:`${a}×${b}`,a:a*b};},()=>{const p=rand(5,20)*1000,r=pick([10,15,20]);return{d:`P=₹${p},r=${r}%\nCI(2yr)=?`,a:Math.round(p*Math.pow(1+r/100,2))};},],
  ];
  const pool=pools[Math.min(lvl,4)];
  let v=null,tries=0;
  while(!v&&tries<30){v=pick(pool)();tries++;}
  if(!v)v={d:"12×5+8",a:68};
  return{display:v.d,ans:String(Math.abs(Math.round(v.a))),type:"chain"};
}

// ─── MODES ────────────────────────────────────────────────────────────────────
const MODES=[
  {id:"arith",   label:"Speed Calc",     sub:"Add · Sub · Mul · Div",           icon:"⚡",timer:[11,10,9,8,6],   gen:genArith},
  {id:"table",   label:"Tables Drill",   sub:"2×2 up to 70×70",                icon:"⊞",timer:[9,8,7,6,5],     gen:genTable},
  {id:"div",     label:"Division",       sub:"Fast division drills",             icon:"÷",timer:[9,8,7,6,5],    gen:genDivision},
  {id:"sqcb",    label:"Sq · Cb · Root", sub:"Squares, cubes, √ and ∛",        icon:"√",timer:[10,9,8,7,6],   gen:genSqCb},
  {id:"chain",   label:"Chain Maths",    sub:"Multi-step · SI/CI · P&L",        icon:"∞",timer:[14,13,12,11,10],gen:genChain},
  {id:"pctRatio",label:"% & Ratio",      sub:"Fractions · % · Ratio",           icon:"%",timer:[12,11,10,9,8],  gen:genPctRatio},
  {id:"mensur",  label:"Mensuration",    sub:"Area · Volume · SA — all shapes", icon:"⬡",timer:[16,15,14,13,12],gen:genMensuration},
  {id:"series",  label:"Number Series",  sub:"Find missing · Spot wrong number",icon:"∿",timer:[14,13,12,11,10],gen:genSeries},
  {id:"seating", label:"Seat Logic",     sub:"Linear & Circular arrangement",   icon:"≡",timer:[13,12,11,10,9], gen:genSeating},
  {id:"blood",   label:"Blood Relations",sub:"Family tree — decode the relation",icon:"♡",timer:[18,16,14,13,12],gen:genBloodRelation},
];

// ─── ANIMAL AVATARS ───────────────────────────────────────────────────────────
const AVATARS=[
  {id:"owl",emoji:"🦉",bg:"#2C3558"},
  {id:"fox",emoji:"🦊",bg:"#7A3410"},
  {id:"cat",emoji:"🐱",bg:"#4A3060"},
  {id:"bear",emoji:"🐻",bg:"#3D2B1F"},
  {id:"lion",emoji:"🦁",bg:"#6B4C00"},
];
function AnimalAvatar({id,size=32}){
  const a=AVATARS.find(x=>x.id===id)||AVATARS[0];
  return(
    <div style={{width:size,height:size,borderRadius:99,background:a.bg,
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:Math.round(size*0.52),flexShrink:0,
      border:"2px solid rgba(255,255,255,0.1)"}}>
      {a.emoji}
    </div>
  );
}

// ─── Learn sections ───────────────────────────────────────────────────────────
const LEARN_SECTIONS=[
  {id:"tables",   label:"Tables 1–50",     icon:"⊞",color:GOLD,sub:"Times tables from 1 to 50"},
  {id:"fractions",label:"Fraction ↔ %",    icon:"%", color:GOLD,sub:"All exam shortcuts in one place"},
  {id:"squares",  label:"Squares & Cubes", icon:"√", color:GOLD,sub:"Squares 1–50 · Cubes 1–30 · Roots"},
  {id:"mensur",   label:"Mensuration",     icon:"⬡",color:GOLD,sub:"Every formula with shapes"},
  {id:"ratios",   label:"Ratio Tricks",    icon:"∶", color:GOLD,sub:"Ratio shortcuts & key values"},
  {id:"vedic",    label:"Vedic Maths",     icon:"∞", color:GOLD,sub:"Fast calculation tricks & shortcuts"},
];

// ─── Utility components ───────────────────────────────────────────────────────
function Bar({value,max,color,height=4}){
  return(
    <div style={{height,background:"rgba(128,128,128,0.15)",borderRadius:99,overflow:"hidden"}}>
      <div style={{width:`${Math.min(100,Math.max(0,value/max*100))}%`,height:"100%",
        background:color,borderRadius:99,transition:"width 0.5s ease",
        boxShadow:`0 0 6px ${color}88`}}/>
    </div>
  );
}

function Seats({arr,hl,circular,T}){
  return(
    <div style={{padding:"4px 0 8px"}}>
      {circular&&<div style={{textAlign:"center",fontSize:9,color:GOLD,fontWeight:700,letterSpacing:1.5,marginBottom:5}}>◯ CIRCULAR</div>}
      <div style={{display:"flex",gap:5,justifyContent:"center",flexWrap:"wrap"}}>
        {arr.map((name,i)=>{
          const isEnd=hl.length>=2&&(i===hl[0]||i===hl[hl.length-1]);
          const isMid=hl.includes(i)&&!isEnd;
          return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:34,height:34,borderRadius:circular?99:8,
                background:isEnd?GOLD:isMid?"rgba(200,144,28,0.12)":T.inputBg,
                border:`2px solid ${isEnd?GOLD:isMid?"rgba(200,144,28,0.4)":T.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:13,
                color:isEnd?"#111":isMid?GOLD:T.text}}>{name}</div>
              <span style={{fontSize:8,color:T.muted,fontWeight:600}}>{i+1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BloodDiagram({nodes,edges,fromId,toId,T}){
  if(!nodes?.length)return null;
  const parentEdges=edges.filter(e=>e.rel==="↓");
  const pointedAt=new Set(parentEdges.map(e=>e.to));
  const roots=nodes.filter(n=>!pointedAt.has(n.id));
  const genMap={};
  roots.forEach(n=>{genMap[n.id]=0;});
  const queue=[...roots];
  while(queue.length){
    const cur=queue.shift();
    parentEdges.filter(e=>e.from===cur.id).forEach(e=>{
      const child=nodes.find(n=>n.id===e.to);
      if(child&&genMap[child.id]===undefined){genMap[child.id]=(genMap[cur.id]||0)+1;queue.push(child);}
    });
  }
  nodes.forEach(n=>{if(genMap[n.id]===undefined)genMap[n.id]=0;});
  const maxGen=Math.max(...Object.values(genMap));
  const genGroups=Array.from({length:maxGen+1},(_,gi)=>nodes.filter(n=>genMap[n.id]===gi));
  const marriedPairs=edges.filter(e=>e.rel==="=").map(e=>({a:e.from,b:e.to}));

  const NodeBox=({node})=>{
    const hi=node.id===fromId||node.id===toId;
    const isMale=node.sex==="M";
    return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:38}}>
        <div style={{width:32,height:32,borderRadius:isMale?7:99,
          background:hi?(isMale?"rgba(74,158,255,0.15)":"rgba(255,107,138,0.13)"):T.inputBg,
          border:`2px solid ${hi?(isMale?BLUE:PINK):T.border}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:11,fontWeight:700,color:hi?(isMale?BLUE:PINK):T.muted,
          boxShadow:hi?`0 0 8px ${isMale?BLUE:PINK}44`:"none"}}>
          {isMale?"♂":"♀"}
        </div>
        <span style={{fontSize:8,color:hi?T.text:T.sub,fontWeight:hi?700:500,
          maxWidth:38,textAlign:"center",lineHeight:1.1}}>{node.name}</span>
      </div>
    );
  };

  const renderRow=(gen)=>{
    const rendered=new Set();
    const items=[];
    gen.forEach(n=>{
      if(rendered.has(n.id))return;
      const pair=marriedPairs.find(p=>p.a===n.id||p.b===n.id);
      const partnerId=pair?(pair.a===n.id?pair.b:pair.a):null;
      const partner=partnerId?gen.find(g=>g.id===partnerId):null;
      if(partner){
        rendered.add(n.id);rendered.add(partner.id);
        items.push(<div key={n.id} style={{display:"flex",alignItems:"center",gap:3}}>
          <NodeBox node={n}/>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
            <span style={{fontSize:10,color:GOLD,fontWeight:900,lineHeight:1}}>═</span>
            <span style={{fontSize:7,color:T.muted}}>wed</span>
          </div>
          <NodeBox node={partner}/>
        </div>);
      }else{rendered.add(n.id);items.push(<NodeBox key={n.id} node={n}/>);}
    });
    return<div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"flex-end",flexWrap:"wrap"}}>{items}</div>;
  };

  return(
    <div style={{marginBottom:5}}>
      {genGroups.map((gen,gi)=>(
        <div key={gi}>
          {renderRow(gen)}
          {gi<genGroups.length-1&&<div style={{display:"flex",justifyContent:"center",margin:"2px 0"}}><span style={{color:T.muted,fontSize:10}}>│</span></div>}
        </div>
      ))}
      <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:5,flexWrap:"wrap"}}>
        {[["♂ □","Male",BLUE],["♀ ○","Female",PINK],["═","Married",GOLD],["│","Parent↓Child",T.muted]].map(([s,l,c])=>(
          <span key={l} style={{fontSize:8,color:T.sub}}><span style={{color:c,fontWeight:700}}>{s}</span> {l}</span>
        ))}
      </div>
    </div>
  );
}

function BloodOptions({options,onTap,disabled,T,feedback,correctAns,selected}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {options.map(opt=>{
        let bg=T.card2,border=T.border,color=T.text;
        if(feedback){if(opt===correctAns){bg="rgba(77,199,88,0.13)";border=GREEN;color=GREEN;}else if(opt===selected){bg="rgba(217,82,82,0.13)";border=RED;color=RED;}}
        return(<button key={opt} onClick={()=>!disabled&&onTap(opt)} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:12,padding:"13px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:13,color,cursor:disabled?"default":"pointer",textAlign:"center",transition:"all 0.18s"}}>{opt}</button>);
      })}
    </div>
  );
}

function Numpad({onKey,disabled,T}){
  const bg=T?.card2||"#2C2D38";
  const border=T?.border||"rgba(255,255,255,0.09)";
  const tc=disabled?(T?.muted||"rgba(255,255,255,0.2)"):(T?.text||"#F0F0F0");
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {["1","2","3","4","5","6","7","8","9"].map(k=>(
        <button key={k} onClick={()=>!disabled&&onKey(k)} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:13,padding:"14px 0",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:26,color:tc,cursor:disabled?"default":"pointer"}}>{k}</button>
      ))}
      <div/>
      <button onClick={()=>!disabled&&onKey("0")} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:13,padding:"14px 0",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:26,color:tc,cursor:disabled?"default":"pointer"}}>0</button>
      <button onClick={()=>!disabled&&onKey("⌫")} style={{background:"rgba(200,144,28,0.1)",border:"1.5px solid rgba(200,144,28,0.25)",borderRadius:13,padding:"14px 0",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:20,color:disabled?"rgba(200,144,28,0.3)":GOLD,cursor:disabled?"default":"pointer"}}>⌫</button>
    </div>
  );
}

// ── CUSTOM TABLE BUILDER ──────────────────────────────────────────────────────
function CustomTableBuilder({T,onStart}){
  const [tableFrom,setTableFrom]=useState(11);
  const [tableTo,setTableTo]=useState(20);
  const [byFrom,setByFrom]=useState(2);
  const [byTo,setByTo]=useState(9);
  const [count,setCount]=useState(20);
  const [includeReverse,setIncludeReverse]=useState(false);
  const [preview,setPreview]=useState([]);

  // Generate preview examples
  useEffect(()=>{
    const examples=[];
    for(let i=0;i<4;i++){
      const a=rand(tableFrom,tableTo);
      const b=rand(byFrom,byTo);
      examples.push(`${a} × ${b} = ${a*b}`);
    }
    setPreview(examples);
  },[tableFrom,tableTo,byFrom,byTo]);

  const SliderRow=({label,value,min,max,onChange,step=1})=>(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:11,color:T.sub,fontWeight:600}}>{label}</span>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,color:GOLD}}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:GOLD,cursor:"pointer"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
        <span style={{fontSize:9,color:T.muted}}>{min}</span>
        <span style={{fontSize:9,color:T.muted}}>{max}</span>
      </div>
    </div>
  );

  return(
    <div>
      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:10}}>TABLE RANGE</div>
      <SliderRow label="Tables from" value={tableFrom} min={2} max={Math.min(tableTo,98)} onChange={v=>setTableFrom(v)}/>
      <SliderRow label="Tables to" value={tableTo} min={Math.max(tableFrom,3)} max={100} onChange={v=>setTableTo(v)}/>

      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:10,marginTop:4}}>MULTIPLY BY</div>
      <SliderRow label="From" value={byFrom} min={2} max={Math.min(byTo,98)} onChange={v=>setByFrom(v)}/>
      <SliderRow label="To" value={byTo} min={Math.max(byFrom,3)} max={100} onChange={v=>setByTo(v)}/>

      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:10,marginTop:4}}>SESSION</div>
      <div style={{display:"flex",gap:7,marginBottom:10}}>
        {[10,20,30,50].map(n=>(
          <button key={n} onClick={()=>setCount(n)} style={{
            flex:1,padding:"9px 0",borderRadius:9,
            background:count===n?GOLD:T.card2,
            border:`1px solid ${count===n?GOLD:T.border}`,
            color:count===n?"#111":T.text,fontWeight:700,fontSize:13,
          }}>{n}</button>
        ))}
      </div>

      <button onClick={()=>setIncludeReverse(!includeReverse)} style={{
        display:"flex",alignItems:"center",gap:10,width:"100%",
        background:includeReverse?"rgba(200,144,28,0.1)":T.inputBg,
        border:`1px solid ${includeReverse?GOLD:T.border}`,
        borderRadius:10,padding:"10px 13px",marginBottom:14,cursor:"pointer",
      }}>
        <div style={{width:18,height:18,borderRadius:4,
          background:includeReverse?GOLD:T.card2,
          border:`2px solid ${includeReverse?GOLD:T.muted}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:11,color:"#111",flexShrink:0}}>
          {includeReverse?"✓":""}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:T.text,textAlign:"left"}}>Include reverse (÷)</div>
          <div style={{fontSize:10,color:T.sub,textAlign:"left"}}>Mix in division questions too</div>
        </div>
      </button>

      {/* Preview */}
      <div style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",marginBottom:14}}>
        <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:7}}>PREVIEW</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {preview.map((p,i)=>(
            <div key={i} style={{fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:T.sub}}>
              {p.split("=")[0]}= <span style={{color:GOLD}}>?</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={()=>onStart({tableFrom,tableTo,byFrom,byTo,count,includeReverse})} style={{
        width:"100%",background:GOLD,borderRadius:12,padding:"14px",
        fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,color:"#111",
        letterSpacing:0.5,
      }}>START {count} QUESTIONS →</button>
    </div>
  );
}

// ── CUSTOM SERIES BUILDER ─────────────────────────────────────────────────────
const SERIES_PATTERN_LABELS=[
  {key:"ap_simple",    label:"AP — Simple",           desc:"3, 7, 11, 15, __"},
  {key:"ap_large",     label:"AP — Large numbers",     desc:"37, 74, 111, __"},
  {key:"ap_negative",  label:"AP — Decreasing",        desc:"100, 93, 86, __"},
  {key:"ap_double",    label:"AP — Double interleaved",desc:"2, 3, 4, 6, 6, 9, __"},
  {key:"gp_x2",        label:"GP × 2",                desc:"3, 6, 12, 24, __"},
  {key:"gp_x3",        label:"GP × 3",                desc:"2, 6, 18, 54, __"},
  {key:"gp_x4",        label:"GP × 4",                desc:"1, 4, 16, 64, __"},
  {key:"gp_half",      label:"GP ÷ (decreasing)",     desc:"96, 48, 24, 12, __"},
  {key:"sq_basic",     label:"Squares n²",             desc:"1, 4, 9, 16, 25, __"},
  {key:"sq_plus_k",    label:"Squares n² + k",         desc:"3, 6, 11, 18, 27, __"},
  {key:"sq_plus_n",    label:"n² + n",                 desc:"2, 6, 12, 20, 30, __"},
  {key:"cb_basic",     label:"Cubes n³",               desc:"1, 8, 27, 64, __"},
  {key:"diff2_const",  label:"2nd diff constant",      desc:"1, 2, 4, 7, 11, __"},
  {key:"diff2_gp",     label:"Diff is GP (×2)",        desc:"1, 3, 7, 15, 31, __"},
  {key:"prime_seq",    label:"Prime numbers",          desc:"2, 3, 5, 7, 11, __"},
  {key:"prime_diff",   label:"Diff is prime",          desc:"1, 3, 6, 11, 18, __"},
  {key:"skip_prime",   label:"Skip-one primes",        desc:"2, 5, 11, 17, 23, __"},
  {key:"mult_special", label:"Multiples of 7/11/37",   desc:"7, 14, 21, 28, __"},
  {key:"fibonacci",    label:"Fibonacci-like",         desc:"1, 2, 3, 5, 8, 13, __"},
  {key:"n_np1",        label:"n × (n+1)",              desc:"2, 6, 12, 20, 30, __"},
  {key:"triangular",   label:"Triangular numbers",     desc:"1, 3, 6, 10, 15, __"},
];

function CustomSeriesBuilder({T,onStart}){
  const [selected,setSelected]=useState([]);
  const [includeWrong,setIncludeWrong]=useState(true);
  const [count,setCount]=useState(20);

  const toggle=(key)=>{
    setSelected(prev=>prev.includes(key)?prev.filter(k=>k!==key):[...prev,key]);
  };
  const allSelected=selected.length===SERIES_PATTERN_LABELS.length;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700}}>SELECT PATTERNS</div>
        <button onClick={()=>setSelected(allSelected?[]:SERIES_PATTERN_LABELS.map(p=>p.key))}
          style={{background:"none",fontSize:11,color:GOLD,fontWeight:700,cursor:"pointer"}}>
          {allSelected?"Deselect all":"Select all"}
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12,maxHeight:300,overflowY:"auto"}}>
        {SERIES_PATTERN_LABELS.map(p=>{
          const on=selected.includes(p.key);
          return(
            <button key={p.key} onClick={()=>toggle(p.key)} style={{
              display:"flex",alignItems:"center",gap:10,
              background:on?"rgba(200,144,28,0.08)":T.inputBg,
              border:`1px solid ${on?GOLD:T.border}`,
              borderRadius:9,padding:"9px 12px",textAlign:"left",cursor:"pointer",
              transition:"all 0.15s",
            }}>
              <div style={{width:16,height:16,borderRadius:4,flexShrink:0,
                background:on?GOLD:T.card2,border:`2px solid ${on?GOLD:T.muted}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:10,color:"#111"}}>{on?"✓":""}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text}}>{p.label}</div>
                <div style={{fontSize:10,color:T.muted,fontFamily:"'Barlow Condensed',sans-serif"}}>{p.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={()=>setIncludeWrong(!includeWrong)} style={{
        display:"flex",alignItems:"center",gap:10,width:"100%",
        background:includeWrong?"rgba(217,82,82,0.08)":T.inputBg,
        border:`1px solid ${includeWrong?RED:T.border}`,
        borderRadius:10,padding:"10px 13px",marginBottom:10,cursor:"pointer",
      }}>
        <div style={{width:18,height:18,borderRadius:4,background:includeWrong?RED:T.card2,
          border:`2px solid ${includeWrong?RED:T.muted}`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>{includeWrong?"✓":""}</div>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:T.text,textAlign:"left"}}>Include wrong-number questions</div>
          <div style={{fontSize:10,color:T.sub,textAlign:"left"}}>Mix in "find the odd one out" too</div>
        </div>
      </button>

      <div style={{display:"flex",gap:7,marginBottom:12}}>
        {[10,20,30].map(n=>(
          <button key={n} onClick={()=>setCount(n)} style={{
            flex:1,padding:"9px 0",borderRadius:9,
            background:count===n?GOLD:T.card2,border:`1px solid ${count===n?GOLD:T.border}`,
            color:count===n?"#111":T.text,fontWeight:700,fontSize:13,
          }}>{n} Qs</button>
        ))}
      </div>

      <button
        disabled={selected.length===0}
        onClick={()=>onStart({patterns:selected,includeWrong,count})}
        style={{
          width:"100%",background:selected.length>0?GOLD:"rgba(200,144,28,0.3)",
          borderRadius:12,padding:"14px",
          fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,
          color:selected.length>0?"#111":"rgba(255,255,255,0.3)",
          cursor:selected.length>0?"pointer":"default",
        }}>
        {selected.length===0?"SELECT A PATTERN FIRST":`START ${count} QUESTIONS →`}
      </button>
    </div>
  );
}

// ── CUSTOM ARITH BUILDER ──────────────────────────────────────────────────────
function CustomArithBuilder({T,onStart}){
  const [ops,setOps]=useState(["+","-","×","÷"]);
  const [digits,setDigits]=useState(2);
  const [terms,setTerms]=useState(2);
  const [count,setCount]=useState(20);

  const toggleOp=(op)=>setOps(prev=>prev.includes(op)?prev.filter(o=>o!==op):[...prev,op]);

  const genCustomArith=useCallback(()=>{
    if(ops.length===0)return{display:"10+5",ans:"15",type:"arith"};
    const o=pick(ops);
    const max=Math.pow(10,digits)-1;
    const min=Math.pow(10,digits-1);
    let display,ans;
    if(o==="+"){
      const nums=Array.from({length:terms},()=>rand(min,max));
      ans=nums.reduce((a,b)=>a+b,0);
      display=nums.join(" + ");
    }else if(o==="-"){
      const a=rand(min*terms,max*terms);
      const subs=Array.from({length:terms-1},()=>rand(min,Math.floor(a/(terms))));
      ans=a-subs.reduce((x,y)=>x+y,0);
      display=`${a} − ${subs.join(" − ")}`;
      if(ans<0){display=`${a} − ${subs[0]}`;ans=a-subs[0];}
    }else if(o==="×"){
      const a=rand(min,max);const b=rand(2,digits===1?9:digits===2?19:99);
      ans=a*b;display=`${a} × ${b}`;
    }else{
      const b=rand(2,digits===1?9:19);ans=rand(min,max);const a=ans*b;
      display=`${a} ÷ ${b}`;
    }
    return{display,ans:String(Math.abs(Math.round(ans))),type:"arith"};
  },[ops,digits,terms]);

  return(
    <div>
      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:8}}>OPERATIONS</div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {["+","−","×","÷"].map((op,i)=>{
          const key=["+","-","×","÷"][i];
          const on=ops.includes(key);
          return(
            <button key={key} onClick={()=>toggleOp(key)} style={{
              flex:1,padding:"12px 0",borderRadius:10,
              background:on?"rgba(200,144,28,0.12)":T.inputBg,
              border:`1.5px solid ${on?GOLD:T.border}`,
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
              color:on?GOLD:T.muted,cursor:"pointer",
            }}>{op}</button>
          );
        })}
      </div>
      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:8}}>DIGITS PER NUMBER</div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {[1,2,3,4].map(d=>(
          <button key={d} onClick={()=>setDigits(d)} style={{
            flex:1,padding:"10px 0",borderRadius:9,
            background:digits===d?GOLD:T.card2,border:`1px solid ${digits===d?GOLD:T.border}`,
            color:digits===d?"#111":T.text,fontWeight:700,fontSize:13,
          }}>{d}-digit</button>
        ))}
      </div>
      <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:8}}>TERMS</div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {[2,3].map(n=>(
          <button key={n} onClick={()=>setTerms(n)} style={{
            flex:1,padding:"10px 0",borderRadius:9,
            background:terms===n?GOLD:T.card2,border:`1px solid ${terms===n?GOLD:T.border}`,
            color:terms===n?"#111":T.text,fontWeight:700,fontSize:13,
          }}>{n} numbers</button>
        ))}
      </div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {[10,20,30].map(n=>(
          <button key={n} onClick={()=>setCount(n)} style={{
            flex:1,padding:"9px 0",borderRadius:9,
            background:count===n?GOLD:T.card2,border:`1px solid ${count===n?GOLD:T.border}`,
            color:count===n?"#111":T.text,fontWeight:700,fontSize:13,
          }}>{n} Qs</button>
        ))}
      </div>
      <button disabled={ops.length===0} onClick={()=>onStart({gen:genCustomArith,count})} style={{
        width:"100%",background:ops.length>0?GOLD:"rgba(200,144,28,0.3)",borderRadius:12,padding:"14px",
        fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,
        color:ops.length>0?"#111":"rgba(255,255,255,0.3)",cursor:ops.length>0?"pointer":"default",
      }}>{ops.length===0?"SELECT OPERATIONS":"START "+count+" QUESTIONS →"}</button>
    </div>
  );
}

// ── CUSTOM SCREEN ─────────────────────────────────────────────────────────────
function CustomScreen({T,onStartTableDrill,onStartSeries,onStartArith}){
  const [section,setSection]=useState(null);
  const tabs=[
    {id:"table",  label:"Table Drill",   icon:"⊞", desc:"Pick exact range"},
    {id:"arith",  label:"Arithmetic",    icon:"⚡", desc:"Mix ops & digits"},
    {id:"series", label:"Number Series", icon:"∿", desc:"Pick pattern types"},
  ];
  if(!section) return(
    <div className="su" style={{padding:"14px 15px 8px"}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,marginBottom:4,color:T.text}}>
        Custom <span style={{color:GOLD}}>Practice</span>
      </div>
      <p style={{fontSize:12,color:T.sub,marginBottom:14,lineHeight:1.5}}>
        Build your own drill. Choose exactly what you want to practice.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setSection(tab.id)} style={{
            display:"flex",alignItems:"center",gap:13,
            background:T.card,border:`1px solid ${T.border}`,
            borderRadius:14,padding:"14px 15px",textAlign:"left",width:"100%",
            transition:"border-color 0.15s",boxShadow:"none",
          }}
          onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(200,144,28,0.3)"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{width:42,height:42,borderRadius:11,flexShrink:0,
              background:"rgba(200,144,28,0.1)",border:"1px solid rgba(200,144,28,0.2)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:GOLD}}>
              {tab.icon}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:T.text}}>{tab.label}</div>
              <div style={{fontSize:10,color:T.sub,marginTop:1}}>{tab.desc}</div>
            </div>
            <span style={{color:T.muted,fontSize:18,marginLeft:"auto"}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  const cur=tabs.find(t=>t.id===section);
  return(
    <div className="su" style={{padding:"14px 15px 8px"}}>
      <button onClick={()=>setSection(null)} style={{background:"none",color:GOLD,fontSize:13,fontWeight:700,marginBottom:13,padding:0,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>← {cur.label}</button>
      {section==="table"&&<CustomTableBuilder T={T} onStart={onStartTableDrill}/>}
      {section==="arith"&&<CustomArithBuilder T={T} onStart={onStartArith}/>}
      {section==="series"&&<CustomSeriesBuilder T={T} onStart={onStartSeries}/>}
    </div>
  );
}

// ── BLITZ MODE ────────────────────────────────────────────────────────────────
function BlitzScreen({T,dark,onExit,blitzBests,onNewBest}){
  const BLITZ_MODES=[
    {id:"table",label:"Tables",icon:"⊞",gen:()=>genTable(1)},
    {id:"arith", label:"Calc",  icon:"⚡",gen:()=>genArith(1)},
    {id:"sqcb",  label:"Sq/Cb",icon:"√", gen:()=>genSqCb(1)},
    {id:"chain", label:"Chain", icon:"∞", gen:()=>genChain(1)},
    {id:"mixed", label:"Mixed", icon:"★", gen:()=>pick([genArith,genTable,genSqCb,genDivision].map(f=>f(1)))||genArith(1)},
  ];

  const [selectedMode,setSelectedMode]=useState(null);
  const [phase,setPhase]=useState("select");
  const [countdown,setCountdown]=useState(3);
  const [timeLeft,setTimeLeft]=useState(60);
  const [q,setQ]=useState(null);
  const [typed,setTyped]=useState("");
  const [score,setScore]=useState(0);
  const [wrong,setWrong]=useState(0);
  const [flash,setFlash]=useState(null);
  const timerRef=useRef(null);
  const cdRef=useRef(null);

  // ── All derived values (computed unconditionally) ──
  const acc=score+wrong>0?Math.round(score/(score+wrong)*100):0;
  const modeKey=selectedMode||"mixed";
  const prevBest=(blitzBests&&blitzBests[modeKey])||0;
  const isNewBest=phase==="done"&&score>prevBest;
  const currentModeName=BLITZ_MODES.find(m=>m.id===selectedMode)?.label||"";

  // ── Hooks (all unconditional) ──
  useEffect(()=>{
    if(phase==="done"&&isNewBest&&onNewBest)onNewBest(modeKey,score);
  },[phase,isNewBest]);

  useEffect(()=>{
    const h=e=>{
      if(phase!=="playing")return;
      if(e.key>="0"&&e.key<="9"){
        const nt=typed+e.key;setTyped(nt);
        if(q?.ans&&nt.length===q.ans.length)doSubmit(nt);
      } else if(e.key==="Backspace"){
        setTyped(p=>p.slice(0,-1));
      } else if(e.key==="Enter"&&typed.length>0){
        doSubmit(typed);
      }
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[phase,typed,q]);

  useEffect(()=>()=>{
    clearInterval(timerRef.current);
    clearInterval(cdRef.current);
  },[]);

  // ── Functions ──
  function makeNextQ(mid){
    const mo=BLITZ_MODES.find(m=>m.id===(mid||selectedMode));
    if(mo){setQ(mo.gen());}
    setTyped("");
  }

  function startCountdown(mid){
    clearInterval(cdRef.current);
    setSelectedMode(mid);setPhase("countdown");setCountdown(3);
    cdRef.current=setInterval(()=>{
      setCountdown(p=>{
        if(p<=1){clearInterval(cdRef.current);startGame(mid);return 0;}
        return p-1;
      });
    },1000);
  }

  function startGame(mid){
    clearInterval(timerRef.current);
    setPhase("playing");setTimeLeft(60);setScore(0);setWrong(0);setTyped("");
    makeNextQ(mid);
    timerRef.current=setInterval(()=>{
      setTimeLeft(p=>{
        if(p<=0.12){clearInterval(timerRef.current);setPhase("done");return 0;}
        return+(p-0.1).toFixed(1);
      });
    },100);
  }

  function doSubmit(val){
    if(phase!=="playing"||!q)return;
    const ok=val.trim()===q.ans.trim();
    setFlash(ok?"correct":"wrong");
    setTimeout(()=>setFlash(null),280);
    if(ok)setScore(s=>s+1);else setWrong(w=>w+1);
    makeNextQ(selectedMode);
  }

  function handleNumKey(k){
    if(phase!=="playing")return;
    if(k==="⌫"){setTyped(p=>p.slice(0,-1));return;}
    const nt=typed+k;setTyped(nt);
    if(q?.ans&&nt.length===q.ans.length)doSubmit(nt);
  }

  // ── Single return with conditional rendering ──
  return(
    <div style={{minHeight:"calc(100vh - 50px)",display:"flex",flexDirection:"column"}}>
      {phase==="select"&&(
        <div style={{padding:"16px 15px",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={onExit} style={{background:"none",color:T.sub,fontSize:22,cursor:"pointer",lineHeight:1}}>←</button>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:T.text}}>
                60s <span style={{color:GOLD}}>Blitz</span>
              </div>
              <div style={{fontSize:11,color:T.sub}}>Answer as many as you can in 60 seconds</div>
            </div>
          </div>
          {/* Personal bests row */}
          {Object.keys(blitzBests||{}).length>0&&(
            <div style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 13px",marginBottom:12}}>
              <div style={{fontSize:9,color:T.muted,fontWeight:700,letterSpacing:1.5,marginBottom:7}}>YOUR BESTS</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(blitzBests).map(([m,b])=>(
                  <div key={m} style={{background:T.card,borderRadius:8,padding:"5px 10px",display:"flex",gap:5,alignItems:"center"}}>
                    <span style={{fontSize:11,color:T.sub,textTransform:"capitalize"}}>{m}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:GOLD}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {BLITZ_MODES.map(m=>(
              <button key={m.id} onClick={()=>startCountdown(m.id)} style={{
                display:"flex",alignItems:"center",gap:13,
                background:T.card,border:`1px solid ${T.border}`,
                borderRadius:14,padding:"14px 15px",textAlign:"left",width:"100%",
              }}>
                <div style={{width:42,height:42,borderRadius:11,flexShrink:0,
                  background:"rgba(200,144,28,0.1)",border:"1px solid rgba(200,144,28,0.2)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:GOLD}}>
                  {m.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:T.text}}>{m.label} Blitz</div>
                  {(blitzBests||{})[m.id]&&<div style={{fontSize:10,color:T.muted,marginTop:1}}>Best: {blitzBests[m.id]}</div>}
                </div>
                <span style={{color:T.muted,fontSize:18}}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase==="countdown"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{fontSize:11,color:T.sub,letterSpacing:2,fontWeight:700}}>GET READY</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:96,color:GOLD,lineHeight:1,
            textShadow:`0 0 60px ${GOLD}55`}}>
            {countdown}
          </div>
          <div style={{fontSize:13,color:T.sub}}>{currentModeName} Blitz</div>
        </div>
      )}

      {phase==="playing"&&(
        <div style={{display:"flex",flexDirection:"column",padding:"10px 13px 8px",gap:8,flex:1}}>
          {/* Timer bar + time */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{flex:1,height:8,background:"rgba(128,128,128,0.15)",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:99,
                width:`${(timeLeft/60)*100}%`,
                background:timeLeft>30?GREEN:timeLeft>10?GOLD:RED,
                transition:"width 0.1s linear,background 0.3s",
                boxShadow:`0 0 8px ${timeLeft>30?GREEN:timeLeft>10?GOLD:RED}88`}}/>
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,
              color:timeLeft>30?GREEN:timeLeft>10?GOLD:RED,minWidth:38,textAlign:"right",flexShrink:0}}>
              {Math.ceil(timeLeft)}s
            </div>
          </div>
          {/* Score row */}
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            {[[score,"CORRECT",GREEN],[wrong,"WRONG",RED],[score+wrong,"TOTAL",GOLD]].map(([v,l,c])=>(
              <div key={l} style={{flex:1,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:10,padding:"7px",textAlign:"center"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:c}}>{v}</div>
                <div style={{fontSize:8,color:T.muted,fontWeight:700,letterSpacing:0.5}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Question card */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
            background:flash==="correct"?"rgba(77,199,88,0.12)":flash==="wrong"?"rgba(217,82,82,0.12)":T.card,
            border:`2px solid ${flash==="correct"?GREEN:flash==="wrong"?RED:T.border}`,
            borderRadius:16,padding:"16px 14px",
            transition:"background 0.15s,border-color 0.15s",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,${GOLD},transparent)`}}/>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
              fontSize:q?.display?.length>15?26:q?.display?.length>8?36:50,
              textAlign:"center",color:T.text,lineHeight:1.2}}>
              {q?.display||"..."}<span style={{color:GOLD}}> = ?</span>
            </div>
          </div>
          {/* Answer box */}
          <div style={{background:T.inputBg,border:`2px solid ${typed?GOLD:T.border}`,
            borderRadius:12,padding:"8px 14px",display:"flex",alignItems:"center",
            justifyContent:"space-between",flexShrink:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
              fontSize:28,letterSpacing:3,color:typed?T.text:T.muted}}>
              {typed||"_ _ _"}
            </div>
            <div style={{fontSize:9,color:T.muted,fontWeight:600}}>TYPE FAST</div>
          </div>
          {/* Numpad */}
          <div style={{flexShrink:0}}><Numpad onKey={handleNumKey} disabled={false} T={T}/></div>
        </div>
      )}

      {phase==="done"&&(
        <div className="su" style={{padding:"24px 18px",display:"flex",flexDirection:"column",gap:13,alignItems:"center",flex:1}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:72,lineHeight:1,
              color:score>=30?GREEN:score>=15?GOLD:RED,
              textShadow:`0 0 50px ${score>=30?GREEN:score>=15?GOLD:RED}33`}}>
              {score}
            </div>
            <div style={{fontSize:11,color:T.sub,letterSpacing:2,fontWeight:700,marginTop:4}}>CORRECT IN 60 SECONDS</div>
            {isNewBest&&<div style={{marginTop:6,background:"rgba(200,144,28,0.15)",border:"1px solid rgba(200,144,28,0.35)",borderRadius:8,padding:"4px 14px",display:"inline-block",fontSize:11,color:GOLD,fontWeight:800}}>🏆 NEW PERSONAL BEST!</div>}
            {!isNewBest&&prevBest>0&&<div style={{marginTop:4,fontSize:11,color:T.muted}}>Best: {prevBest} · Gap: {prevBest-score}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,width:"100%"}}>
            {[[score,"Correct",GREEN],[wrong,"Wrong",RED],[`${acc}%`,"Accuracy",GOLD]].map(([v,l,c])=>(
              <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:0.5,marginTop:2}}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:12,padding:"11px 13px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:11,color:T.sub,marginBottom:4}}>Share your score</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:T.text}}>
              🎯 I scored {score} in 60s on CalcMind {currentModeName} Blitz! #MxPrime
            </div>
          </div>
          <div style={{display:"flex",gap:8,width:"100%"}}>
            <button onClick={()=>startCountdown(selectedMode)} style={{flex:2,background:GOLD,borderRadius:12,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,color:"#111"}}>RETRY</button>
            <button onClick={onExit} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,color:T.sub}}>HOME</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LEARN SCREEN ──────────────────────────────────────────────────────────────
function LearnScreen({T}){
  const [sec,setSec]=useState(null);
  const [tableN,setTableN]=useState(1);
  const secObj=LEARN_SECTIONS.find(s=>s.id===sec);

  if(!sec) return(
    <div className="su" style={{padding:"14px 15px 8px"}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,marginBottom:4,color:T.text}}>Learn <span style={{color:GOLD}}>Reference</span></div>
      <p style={{fontSize:12,color:T.sub,marginBottom:12,lineHeight:1.5}}>Quick study cards. Tap to open.</p>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {LEARN_SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setSec(s.id)} style={{display:"flex",alignItems:"center",gap:12,background:T.card,border:`1px solid ${T.border}`,borderRadius:13,padding:"13px 15px",textAlign:"left",width:"100%",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD+"44"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:"rgba(200,144,28,0.1)",border:"1px solid rgba(200,144,28,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:17,color:GOLD}}>{s.icon}</div>
            <div><div style={{fontWeight:700,fontSize:13,color:T.text}}>{s.label}</div><div style={{fontSize:10,color:T.sub,marginTop:1}}>{s.sub}</div></div>
            <span style={{color:T.muted,fontSize:18,marginLeft:"auto"}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  const Entry=({text})=><div style={{padding:"8px 13px",borderBottom:`1px solid ${T.border}`,fontSize:12,fontWeight:600,color:T.text}}>{text}</div>;
  const Group=({title,entries})=>(
    <div style={{marginBottom:10}}>
      <div style={{fontSize:9,fontWeight:800,letterSpacing:1.5,color:GOLD,marginBottom:6}}>{title.toUpperCase()}</div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
        {entries.map((e,i)=><Entry key={i} text={e}/>)}
      </div>
    </div>
  );

  return(
    <div className="su" style={{padding:"14px 15px 8px"}}>
      <button onClick={()=>setSec(null)} style={{background:"none",color:GOLD,fontSize:13,fontWeight:700,marginBottom:12,padding:0,display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>← {secObj?.label}</button>
      {sec==="tables"&&(<>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
          {Array.from({length:50},(_,i)=>(
            <button key={i} onClick={()=>setTableN(i+1)} style={{width:30,height:26,borderRadius:6,fontSize:11,fontWeight:700,background:tableN===i+1?GOLD:T.card2,border:`1px solid ${tableN===i+1?GOLD:T.border}`,color:tableN===i+1?"#111":T.text,cursor:"pointer"}}>{i+1}</button>
          ))}
        </div>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"13px"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:17,color:GOLD,marginBottom:9}}>Table of {tableN}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
            {Array.from({length:20},(_,i)=>(
              <div key={i} style={{padding:"5px 8px",borderRadius:6,background:T.inputBg,fontSize:12,fontWeight:600,color:T.text,fontFamily:"'Barlow Condensed',sans-serif"}}>
                {tableN}×{i+1} = <span style={{color:GOLD,fontWeight:900}}>{tableN*(i+1)}</span>
              </div>
            ))}
          </div>
        </div>
      </>)}
      {sec==="fractions"&&[
        {title:"Halves & Thirds",entries:["1/2 = 50%","1/3 = 33.33%","2/3 = 66.67%"]},
        {title:"Quarters & Fifths",entries:["1/4 = 25%","3/4 = 75%","1/5 = 20%","2/5 = 40%","3/5 = 60%","4/5 = 80%"]},
        {title:"Sixths & Sevenths",entries:["1/6 = 16.67%","5/6 = 83.33%","1/7 = 14.28%","2/7 = 28.57%","3/7 = 42.86%","4/7 = 57.14%","6/7 = 85.71%"]},
        {title:"Eighths",entries:["1/8 = 12.5%","3/8 = 37.5%","5/8 = 62.5%","7/8 = 87.5%"]},
        {title:"Ninths & Tenths",entries:["1/9 = 11.11%","2/9 = 22.22%","4/9 = 44.44%","1/10 = 10%","3/10 = 30%","7/10 = 70%","9/10 = 90%"]},
        {title:"Beyond",entries:["1/11 = 9.09%","1/12 = 8.33%","1/15 = 6.67%","2/15 = 13.33%","1/16 = 6.25%"]},
      ].map((g,i)=><Group key={i} {...g}/>)}
      {sec==="squares"&&[
        {title:"Squares 1–25",entries:Array.from({length:25},(_,i)=>`${i+1}² = ${(i+1)**2}`)},
        {title:"Squares 26–50",entries:Array.from({length:25},(_,i)=>`${i+26}² = ${(i+26)**2}`)},
        {title:"Cubes 1–15",entries:Array.from({length:15},(_,i)=>`${i+1}³ = ${(i+1)**3}`)},
        {title:"Cubes 16–30",entries:Array.from({length:15},(_,i)=>`${i+16}³ = ${(i+16)**3}`)},
        {title:"Square Roots",entries:["√4=2","√9=3","√16=4","√25=5","√36=6","√49=7","√64=8","√81=9","√100=10","√121=11","√144=12","√169=13","√196=14","√225=15","√256=16","√289=17","√324=18","√361=19","√400=20"]},
        {title:"Cube Roots",entries:["∛8=2","∛27=3","∛64=4","∛125=5","∛216=6","∛343=7","∛512=8","∛729=9","∛1000=10","∛1331=11","∛1728=12","∛2197=13","∛2744=14","∛3375=15"]},
      ].map((g,i)=><Group key={i} {...g}/>)}
      {sec==="mensur"&&[
        {title:"2D — Area",entries:["Rectangle: l×b","Square: s²","Triangle: ½bh","Trapezium: ½(a+b)h","Rhombus: d₁×d₂÷2","Circle: πr²","Parallelogram: b×h"]},
        {title:"2D — Perimeter",entries:["Rectangle: 2(l+b)","Square: 4s","Triangle: a+b+c","Circle: 2πr","Rhombus: 4a"]},
        {title:"3D — Volume",entries:["Cube: s³","Cuboid: l×b×h","Cylinder: πr²h","Cone: ⅓πr²h","Sphere: 4/3πr³","Tri. Prism: ½bhl","Sq. Pyramid: ⅓b²h"]},
        {title:"3D — Surface Area",entries:["Cube: 6s²","Cuboid: 2(lb+bh+hl)","Cylinder: 2πr(r+h)","Cone: πr(r+l)","Sphere: 4πr²","Hemisphere: 3πr²"]},
      ].map((g,i)=><Group key={i} {...g}/>)}
      {sec==="ratios"&&[
        {title:"Key Ratios → %",entries:["1:2→33.3%:66.7%","1:3→25%:75%","2:3→40%:60%","3:4→42.9%:57.1%","3:5→37.5%:62.5%","4:5→44.4%:55.6%"]},
        {title:"Ratio Rules",entries:["a:b → a/(a+b) of total","Compound: a:b × c:d = ac:bd","Simplify: divide both by GCD","If A:B=3:5, A=3/8, B=5/8 of total"]},
        {title:"Speed Tricks",entries:["A:B=2:3, A=40 → B=60","A:B=5:8, total=260 → A=100","5:7 diff=20 → unit=10 → A=50,B=70"]},
      ].map((g,i)=><Group key={i} {...g}/>)}
      {sec==="vedic"&&[
        {title:"Square any 2-digit: (a+b)²",entries:["Split into tens+units: 24 → a=20,b=4","a²+2ab+b² = 400+160+16 = 576","Or: (n±d)²=n²±2nd+d²","97² = (100-3)² = 10000-600+9 = 9409"]},
        {title:"Square ending in 5",entries:["n5² → n×(n+1) then append 25","35² → 3×4=12 → 1225","75² → 7×8=56 → 5625","95² → 9×10=90 → 9025"]},
        {title:"Multiply by 11",entries:["Write first & last digit","Sum adjacent pairs for middle","67×11 → 6_(6+7)_7 = 737","89×11 → 8_(17)_9 = 979 (carry)"]},
        {title:"Base-100 multiplication",entries:["97×96: deficits=3,4","Left: 97-4=93, Right: 3×4=12","Answer: 9312","98×97=9506, 99×93=9207"]},
        {title:"×25, ×50, ×125",entries:["×25 = ÷4 × 100: 48×25=1200","×50 = ÷2 × 100: 36×50=1800","×125 = ÷8 × 1000: 32×125=4000","×5 = ÷2 × 10: 124×5=620"]},
        {title:"Subtract from 10ⁿ",entries:["Each digit from 9, last from 10","1000−356: 9-3=6,9-5=4,10-6=4 → 644","10000−2345 → 7655","Works for any power of 10"]},
        {title:"Digit sum verification",entries:["23×14=322: (2+3)×(1+4)=25→7, 3+2+2=7 ✓","If mismatch → error found","Digital root: sum digits until single digit","9 always cancels out (cast out 9s)"]},
        {title:"Complement addition",entries:["+99 = +100−1: 456+99=555","−99 = −100+1: 634−99=535","+998 = +1000−2: 347+998=1345","Scales to any 9s pattern"]},
      ].map((g,i)=><Group key={i} {...g}/>)}
    </div>
  );
}

// ── PROFILE MODAL ─────────────────────────────────────────────────────────────
function ProfileModal({profile,onClose,onSave,T,user,signIn,signOut}){
  const [name,setName]=useState(profile.name||"");
  const [goal,setGoal]=useState(profile.goal||"IBPS PO");
  const [av,setAv]=useState(profile.avatar||"owl");
  const goals=["IBPS PO","SBI PO","SSC CGL","RBI Grade B","CAT","Other"];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.hdr,borderRadius:"18px 18px 0 0",padding:"16px 18px 32px",width:"100%",maxWidth:480}}>
        <div style={{width:32,height:3,background:T.border,borderRadius:99,margin:"0 auto 14px"}}/>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:T.text,marginBottom:14}}>Edit <span style={{color:GOLD}}>Profile</span></div>

        <div style={{background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          {user ? (
            <div>
              <div style={{fontSize:12, fontWeight:700, color:T.text}}>{user.displayName || "Google User"}</div>
              <div style={{fontSize:10, color:T.sub}}>{user.email}</div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:12, fontWeight:700, color:T.text}}>Not logged in</div>
              <div style={{fontSize:10, color:T.sub}}>Log in to join leaderboard</div>
            </div>
          )}
          <button onClick={user ? signOut : signIn} style={{padding:"6px 12px", borderRadius:8, background:user ? T.inputBg : GOLD, border:`1px solid ${user ? T.border : GOLD}`, color:user ? T.text : "#111", fontSize:11, fontWeight:700}}>
            {user ? "Sign Out" : "Sign In with Google"}
          </button>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:14}}>
          {AVATARS.map(a=>(
            <button key={a.id} onClick={()=>setAv(a.id)} style={{padding:3,borderRadius:99,cursor:"pointer",border:`2.5px solid ${av===a.id?GOLD:"transparent"}`,background:"none"}}>
              <AnimalAvatar id={a.id} size={46}/>
            </button>
          ))}
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:4}}>YOUR NAME</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter name..."
            style={{width:"100%",background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 13px",fontSize:14,color:T.text,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:4}}>TARGET EXAM</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {goals.map(g=>(
              <button key={g} onClick={()=>setGoal(g)} style={{padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:700,background:goal===g?GOLD:T.card2,border:`1px solid ${goal===g?GOLD:T.border}`,color:goal===g?"#111":T.text}}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onSave({name,goal,avatar:av});onClose();}} style={{flex:2,background:GOLD,borderRadius:11,padding:"12px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900,color:"#111"}}>SAVE</button>
          <button onClick={onClose} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:11,padding:"12px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:900,color:T.sub}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [dark,setDark]=useState(()=>LS.get("cm_dark",true));
  const T=THEMES[dark?"dark":"light"];

  const { user, signIn, signOut } = useAuth();
  const { leaderboard, submitScore, refresh } = useLeaderboard();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(() => LS.get("cm_show_install", true));

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      LS.set("cm_show_install", false);
    }
    setInstallPrompt(null);
  };

  const [tab,setTab]=useState("home");
  const [modeId,setModeId]=useState(null);
  const [customConfig,setCustomConfig]=useState(null);
  const [showProfile,setShowProfile]=useState(false);
  const [profile,setProfile]=useState(()=>LS.get("cm_profile",{name:"",goal:"IBPS PO",avatar:"owl"}));
  const [showBlitz,setShowBlitz]=useState(false);
  const [confirmReset,setConfirmReset]=useState(false);
  const [confirmExit,setConfirmExit]=useState(false);

  const [lvl,setLvl]=useState(1);
  const [q,setQ]=useState(null);
  const [typed,setTyped]=useState("");
  const [bloodSel,setBloodSel]=useState(null);
  const [phase,setPhase]=useState("idle");
  const [feedback,setFeedback]=useState(null);
  const [t,setT]=useState(0);
  const [streak,setStreak]=useState(0);
  const [wrongStreak,setWrongStreak]=useState(0);
  const [bestStreak,setBestStreak]=useState(0);
  const [score,setScore]=useState({c:0,w:0});
  const [hist,setHist]=useState([]);
  const [qCount,setQCount]=useState(0);
  const [sessionMax,setSessionMax]=useState(100);
  const [showLvlChange,setShowLvlChange]=useState(null);
  const [totalXP,setTotalXP]=useState(()=>LS.get("cm_xp",0));
  const [blitzBests,setBlitzBests]=useState(()=>LS.get("cm_blitz",{}));
  const [modeStats,setModeStats]=useState(()=>{
    const saved=LS.get("cm_stats",null);
    if(saved)return saved;
    const s={};MODES.forEach(m=>{s[m.id]={attempts:0,correct:0,totalTime:0,avgTime:0};});return s;
  });

  // ── Persist on change ──────────────────────────────────────────────────────
  useEffect(()=>LS.set("cm_dark",dark),[dark]);
  useEffect(()=>LS.set("cm_profile",profile),[profile]);
  useEffect(()=>LS.set("cm_xp",totalXP),[totalXP]);
  useEffect(()=>LS.set("cm_stats",modeStats),[modeStats]);
  useEffect(()=>LS.set("cm_blitz",blitzBests),[blitzBests]);

  // ── Back Button Handling ──────────────────────────────────────────────────
  useEffect(() => {
    const handlePopState = (e) => {
      if (tab !== 'home' || showBlitz) {
        stopAll();
        setTab('home');
        setPhase('idle');
        setShowBlitz(false);
        // Stay on home, don't exit
        window.history.pushState({ tab: 'home' }, '');
      } else {
        // We are already on home, show exit prompt
        setConfirmExit(true);
        window.history.pushState({ tab: 'home' }, '');
      }
    };

    // Initial state
    if (window.history.state?.tab !== 'home') {
      window.history.pushState({ tab: 'home' }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tab, showBlitz, phase]);

  const timerRef=useRef(null);
  const nextRef=useRef(null);
  const qStart=useRef(Date.now());

  const modeObj=MODES.find(m=>m.id===modeId);
  function getTimer(mid,l){
    const mo=MODES.find(m=>m.id===(mid??modeId));
    if(!mo)return 10;
    const arr=mo.timer;
    return Array.isArray(arr)?arr[Math.min(l??lvl,arr.length-1)]:arr;
  }
  function stopAll(){clearInterval(timerRef.current);clearTimeout(nextRef.current);}

  function makeQ(mid,l){
    if(customConfig){
      if(customConfig.type==="table")return genCustomTable(customConfig);
      if(customConfig.type==="series"){
        const patternPool=customConfig.patterns||[];
        const includeWrong=customConfig.includeWrong;
        if(includeWrong&&Math.random()<0.4)return makeWrongSeries();
        if(patternPool.length>0)return genSeries(2,pick(patternPool));
        return genSeries(2);
      }
      if(customConfig.type==="arith")return customConfig.gen();
    }
    return MODES.find(m=>m.id===(mid??modeId))?.gen(l??lvl)??genArith(0);
  }

  function nextQ(mid,l){
    stopAll();
    const newQ=makeQ(mid,l);
    setQ(newQ);setTyped("");setBloodSel(null);setFeedback(null);setPhase("playing");
    qStart.current=Date.now();
    const tLimit=customConfig?12:getTimer(mid??modeId,l??lvl);
    setT(tLimit);
  }

  function startNormalGame(mid){
    stopAll();
    setModeId(mid);setCustomConfig(null);
    setLvl(1);setStreak(0);setWrongStreak(0);setBestStreak(0);
    setScore({c:0,w:0});setHist([]);setQCount(0);setSessionMax(100);setShowLvlChange(null);
    setTab("game");setPhase("idle");setTyped("");setBloodSel(null);setFeedback(null);
    setTimeout(()=>nextQ(mid,1),80);
  }

  function startCustomTableGame(cfg){
    stopAll();
    setModeId("customTable");setCustomConfig({...cfg,type:"table"});
    setLvl(0);setStreak(0);setWrongStreak(0);setBestStreak(0);
    setScore({c:0,w:0});setHist([]);setQCount(0);setSessionMax(cfg.count);setShowLvlChange(null);
    setTab("game");setPhase("idle");setTyped("");setBloodSel(null);setFeedback(null);
    setTimeout(()=>nextQ("customTable",0),80);
  }

  function startCustomSeriesGame(cfg){
    stopAll();
    setModeId("series");setCustomConfig({...cfg,type:"series"});
    setLvl(2);setStreak(0);setWrongStreak(0);setBestStreak(0);
    setScore({c:0,w:0});setHist([]);setQCount(0);setSessionMax(cfg.count);setShowLvlChange(null);
    setTab("game");setPhase("idle");setTyped("");setBloodSel(null);setFeedback(null);
    setTimeout(()=>nextQ("series",2),80);
  }

  function startCustomArithGame(cfg){
    stopAll();
    setModeId("arith");setCustomConfig({...cfg,type:"arith"});
    setLvl(0);setStreak(0);setWrongStreak(0);setBestStreak(0);
    setScore({c:0,w:0});setHist([]);setQCount(0);setSessionMax(cfg.count);setShowLvlChange(null);
    setTab("game");setPhase("idle");setTyped("");setBloodSel(null);setFeedback(null);
    setTimeout(()=>nextQ("arith",0),80);
  }

  useEffect(()=>{
    if(phase!=="playing")return;
    timerRef.current=setInterval(()=>{
      setT(prev=>{
        if(prev<=0.12){clearInterval(timerRef.current);submitAnswer("__timeout__");return 0;}
        return+(prev-0.1).toFixed(1);
      });
    },100);
    return()=>clearInterval(timerRef.current);
  },[phase,q]);

  function submitAnswer(val){
    if(phase!=="playing")return;
    stopAll();setPhase("feedback");
    const correctAns=q?.ans??"";
    const ok=val.trim().toLowerCase()===correctAns.trim().toLowerCase()&&val!=="__timeout__";
    const elapsed=(Date.now()-qStart.current)/1000;
    const ns=ok?streak+1:0,nw=ok?0:wrongStreak+1;
    setFeedback(ok?"correct":"wrong");
    setStreak(ns);setWrongStreak(nw);setBestStreak(b=>Math.max(b,ns));
    const nc=score.c+(ok?1:0),nWr=score.w+(ok?0:1);
    setScore({c:nc,w:nWr});
    const nH=[...hist,{ok}];setHist(nH);
    const nQ=qCount+1;setQCount(nQ);
    if(ok) {
      const xpGained = Math.round(LVL_XP[Math.min(lvl,4)]*(ns>=5?2:ns>=3?1.5:1));
      setTotalXP(x=>x+xpGained);
      submitScore(user, xpGained);
    }
    if(!customConfig&&modeId){
      setModeStats(prev=>{
        const ms={...prev[modeId]};if(!ms)return prev;
        ms.attempts+=1;if(ok)ms.correct+=1;ms.totalTime+=elapsed||0;
        ms.avgTime=ms.attempts>0?+(ms.totalTime/ms.attempts).toFixed(1):0;
        return{...prev,[modeId]:ms};
      });
    }
    let newLvl=lvl;
    const floor=Math.min(4,Math.floor(nQ/15));
    if(!customConfig){
      if(ok&&ns>0&&ns%3===0&&lvl<4){newLvl=Math.min(4,lvl+1);setShowLvlChange("up");setTimeout(()=>setShowLvlChange(null),1400);}
      else if(!ok&&nw>=2&&lvl>0){newLvl=Math.max(floor,lvl-1);setShowLvlChange("down");setTimeout(()=>setShowLvlChange(null),1400);}
      newLvl=Math.max(newLvl,floor);if(newLvl!==lvl)setLvl(newLvl);
    }
    nextRef.current=setTimeout(()=>{
      if(nQ>=sessionMax){setTab("result");setPhase("idle");}
      else nextQ(modeId,newLvl);
    },ok?600:1050);
  }

  function onKey(k){
    if(phase!=="playing")return;
    if(k==="⌫"){setTyped(p=>p.slice(0,-1));return;}
    const nt=typed+k;setTyped(nt);
    if(q?.ans&&nt.length===q.ans.length)submitAnswer(nt);
  }

  useEffect(()=>{
    const h=e=>{
      if(tab!=="game"||phase!=="playing")return;
      if(e.key>="0"&&e.key<="9")onKey(e.key);
      else if(e.key==="Backspace")onKey("⌫");
      else if(e.key==="Enter"&&typed.length>0)submitAnswer(typed);
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[tab,phase,typed,q,lvl,streak,wrongStreak,score,hist,qCount,sessionMax,customConfig,modeId]);

  const total=score.c+score.w;
  const acc=total>0?Math.round(score.c/total*100):0;
  const currentTimerMax=customConfig?12:getTimer(modeId,lvl);
  const tPct=Math.max(0,(t/currentTimerMax)*100);
  const tColor=tPct>60?GOLD:tPct>30?"#D4A830":RED;
  const rank=getRank(totalXP);
  const nextR=nextRank(totalXP);
  const qLines=(q?.display??"").split("\n");
  const isBlood=q?.type==="blood";
  const isLetter=q?.type==="seating"&&/^[A-H]$/.test(q?.ans??"");
  const weakModes=Object.entries(modeStats).filter(([,s])=>s.attempts>=5)
    .map(([id,s])=>({id,acc:s.attempts>0?Math.round(s.correct/s.attempts*100):0,label:MODES.find(m=>m.id===id)?.label}))
    .sort((a,b)=>a.acc-b.acc).slice(0,3);

  if(showBlitz) return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Outfit','Segoe UI',sans-serif",maxWidth:480,margin:"0 auto",transition:"background 0.25s"}}>
      <div style={{padding:"11px 15px",background:T.hdr,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:T.text}}>Calc<span style={{color:GOLD}}>Mind</span> <span style={{color:GOLD,fontSize:16}}>⚡ Blitz</span></div>
        <button onClick={()=>setDark(d=>!d)} style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",fontSize:13,color:T.sub}}>{dark?"☀":"🌙"}</button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}><BlitzScreen T={T} dark={dark} onExit={()=>setShowBlitz(false)}
        blitzBests={blitzBests}
        onNewBest={(mode,s)=>setBlitzBests(prev=>({...prev,[mode]:s}))}/></div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Outfit','Segoe UI',sans-serif",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",transition:"background 0.25s,color 0.25s"}}>

      {showProfile&&<ProfileModal profile={profile} T={T} onClose={()=>setShowProfile(false)} onSave={p=>setProfile(p)} user={user} signIn={signIn} signOut={signOut}/>}

      {/* Confirm reset modal */}
      {confirmReset&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
          <div style={{background:T.hdr,borderRadius:16,padding:"22px 20px",width:"100%",maxWidth:360}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:T.text,marginBottom:8}}>Reset all progress?</div>
            <div style={{fontSize:13,color:T.sub,marginBottom:18,lineHeight:1.5}}>This will clear your XP, stats, streaks and blitz bests. Cannot be undone.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{
                const fresh={};MODES.forEach(m=>{fresh[m.id]={attempts:0,correct:0,totalTime:0,avgTime:0};});
                setModeStats(fresh);setTotalXP(0);setBlitzBests({});setBestStreak(0);
                LS.set("cm_stats",fresh);LS.set("cm_xp",0);LS.set("cm_blitz",{});
                setConfirmReset(false);
              }} style={{flex:1,background:RED,borderRadius:10,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#fff"}}>RESET</button>
              <button onClick={()=>setConfirmReset(false)} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:T.sub}}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation modal */}
      {confirmExit&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
          <div style={{background:T.hdr,borderRadius:16,padding:"22px 20px",width:"100%",maxWidth:360}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:T.text,marginBottom:8}}>Exit CalcMind?</div>
            <div style={{fontSize:13,color:T.sub,marginBottom:18,lineHeight:1.5}}>Are you sure you want to close the app?</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{
                setConfirmExit(false);
                // Standard way to "exit" a PWA or web page
                window.close();
                // Fallback for browsers that block window.close()
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "about:blank";
                }
              }} style={{flex:1,background:GOLD,borderRadius:10,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:"#111"}}>EXIT</button>
              <button onClick={()=>setConfirmExit(false)} style={{flex:1,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:T.sub}}>STAY</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"10px 15px",background:T.hdr,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:dark?"none":"0 1px 8px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setShowProfile(true)} style={{background:"none",padding:0,cursor:"pointer",flexShrink:0}}>
            <AnimalAvatar id={profile.avatar||"owl"} size={34}/>
          </button>
          <div>
            <button onClick={()=>{if(tab==="game"){stopAll();setTab("home");setPhase("idle");}}} style={{background:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,letterSpacing:-0.5,color:T.text,padding:0}}>
              <span>Calc</span><span style={{color:GOLD}}>Mind</span>
            </button>
            {profile.name&&<div style={{fontSize:9,color:T.muted,fontWeight:600,marginTop:-1}}>{profile.name} · {profile.goal}</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {tab==="game"&&(<>
            {streak>=3&&<span style={{color:GOLD,fontWeight:800,fontSize:12}}>🔥{streak}</span>}
            {!customConfig&&<div style={{fontSize:9,fontWeight:800,letterSpacing:1,padding:"3px 7px",borderRadius:5,background:`${LVL_COLORS[Math.min(lvl,4)]}18`,border:`1px solid ${LVL_COLORS[Math.min(lvl,4)]}44`,color:LVL_COLORS[Math.min(lvl,4)]}}>{LVL_NAMES[Math.min(lvl,4)].toUpperCase()}</div>}
            <span style={{fontSize:10,color:T.sub,fontWeight:600}}>{total}/{sessionMax}</span>
          </>)}
          <button onClick={()=>setShowBlitz(true)} style={{background:"rgba(200,144,28,0.1)",border:"1px solid rgba(200,144,28,0.25)",borderRadius:8,padding:"4px 9px",fontSize:11,fontWeight:700,color:GOLD}}>⚡ Blitz</button>
          <button onClick={()=>setDark(d=>!d)} style={{background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",fontSize:13,color:T.sub}}>{dark?"☀":"🌙"}</button>
          <div onClick={()=>setTab(tab==="rank"?"home":"rank")} style={{display:"flex",alignItems:"center",gap:4,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:8,padding:"4px 8px",cursor:"pointer"}}>
            <span style={{fontSize:12}}>{rank.icon}</span>
            <span style={{fontSize:11,fontWeight:700,color:rank.color}}>{totalXP}</span>
          </div>
        </div>
      </div>

      {showLvlChange&&tab==="game"&&(
        <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",background:showLvlChange==="up"?LVL_COLORS[Math.min(lvl,4)]:RED,color:"#111",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,letterSpacing:0.5,padding:"8px 18px",borderRadius:12,animation:"lvlAnim 1.4s ease forwards",zIndex:99,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
          {showLvlChange==="up"?`▲ ${LVL_NAMES[Math.min(lvl,4)].toUpperCase()}`:`▼ ${LVL_NAMES[Math.min(lvl,4)].toUpperCase()}`}
        </div>
      )}

      {/* BOTTOM NAV */}
      {tab!=="game"&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.navBg,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:20,boxShadow:dark?"none":"0 -1px 8px rgba(0,0,0,0.05)"}}>
          {[["home","⊞","Practice"],["custom","✎","Custom"],["learn","◎","Learn"],["stats","▤","Stats"],["rank","★","Rank"]].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px 0 8px",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:16,color:tab===id?GOLD:T.muted}}>{icon}</span>
              <span style={{fontSize:8,fontWeight:700,letterSpacing:0.5,color:tab===id?GOLD:T.muted}}>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",paddingBottom:tab==="game"?0:64}}>

        {/* ── HOME ── */}
        {tab==="home"&&(
          <div className="su" style={{padding:"14px 15px 8px"}}>
            {/* PWA Install Banner */}
            {showInstallBanner && installPrompt && (
              <div style={{background:T.card2, border:`1px solid ${GOLD}`, borderRadius:12, padding:"12px 14px", marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:`0 2px 12px ${GOLD}33`}}>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{fontSize:20}}>📱</div>
                  <div>
                    <div style={{fontSize:13, fontWeight:700, color:T.text}}>Install App</div>
                    <div style={{fontSize:10, color:T.sub}}>Play offline, faster access</div>
                  </div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:6}}>
                  <button onClick={handleInstall} style={{padding:"6px 12px", background:GOLD, borderRadius:8, color:"#111", fontSize:11, fontWeight:800}}>INSTALL</button>
                  <button onClick={()=>{setShowInstallBanner(false); LS.set("cm_show_install",false);}} style={{padding:"6px", background:"none", border:"none", color:T.muted, fontSize:14}}>&times;</button>
                </div>
              </div>
            )}
            {/* Rank card */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 14px",marginBottom:11,display:"flex",alignItems:"center",gap:11,boxShadow:dark?"none":"0 2px 10px rgba(0,0,0,0.06)"}}>
              <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:`${rank.color}18`,border:`2px solid ${rank.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:rank.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900}}>{rank.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:rank.color}}>{rank.label}</div>
                {nextR&&<div style={{fontSize:10,color:T.sub,marginTop:1}}>{nextR.min-totalXP} XP → {nextR.label}</div>}
                {nextR&&<div style={{marginTop:4}}><Bar value={totalXP-rank.min} max={nextR.min-rank.min} color={rank.color} height={3}/></div>}
              </div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:24,color:GOLD,letterSpacing:-1}}>{totalXP}<span style={{fontSize:10,color:T.sub,fontWeight:500}}> XP</span></div>
            </div>

            {/* Blitz banner */}
            <button onClick={()=>setShowBlitz(true)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:12,marginBottom:11,
              background:"linear-gradient(135deg,rgba(200,144,28,0.15),rgba(200,144,28,0.05))",
              border:`1px solid rgba(200,144,28,0.3)`,borderRadius:14,padding:"12px 14px",
              textAlign:"left",transition:"opacity 0.15s",
            }}>
              <div style={{fontSize:24}}>⚡</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:GOLD}}>60-second Blitz Mode</div>
                <div style={{fontSize:10,color:T.sub,marginTop:1}}>Answer as many as possible. Beat your high score.</div>
              </div>
              <span style={{color:GOLD,fontSize:18}}>›</span>
            </button>

            {weakModes.length>0&&(
              <div style={{background:T.weakBg,border:`1px solid ${T.weakBorder}`,borderRadius:12,padding:"10px 12px",marginBottom:11}}>
                <div style={{fontSize:9,fontWeight:800,letterSpacing:1.5,color:RED,marginBottom:6}}>NEEDS PRACTICE</div>
                {weakModes.map(w=>(
                  <div key={w.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:T.sub}}>{w.label}</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:50}}><Bar value={w.acc} max={100} color={w.acc<50?RED:GOLD} height={3}/></div>
                      <span style={{fontSize:11,fontWeight:700,color:w.acc<50?RED:GOLD,width:30,textAlign:"right"}}>{w.acc}%</span>
                      <button onClick={()=>startNormalGame(w.id)} style={{background:RED+"22",border:`1px solid ${RED}44`,borderRadius:6,padding:"2px 7px",fontSize:9,color:RED,fontWeight:700}}>DRILL</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:6}}>ALL MODES</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {MODES.map((m,i)=>{
                const ms=modeStats[m.id];
                const mAcc=ms.attempts>0?Math.round(ms.correct/ms.attempts*100):null;
                return(
                  <button key={m.id} onClick={()=>startNormalGame(m.id)} style={{display:"flex",alignItems:"center",gap:11,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px",textAlign:"left",width:"100%",transition:"border-color 0.15s",boxShadow:dark?"none":"0 1px 5px rgba(0,0,0,0.05)"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(200,144,28,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                    <div style={{width:34,height:34,borderRadius:8,flexShrink:0,background:i%2===0?"rgba(200,144,28,0.1)":T.inputBg,border:`1px solid ${i%2===0?"rgba(200,144,28,0.18)":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,color:i%2===0?GOLD:T.sub}}>{m.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:T.text}}>{m.label}</div>
                      <div style={{fontSize:9,color:T.sub,marginTop:1}}>{m.sub}</div>
                    </div>
                    {mAcc!==null&&<div style={{fontSize:11,fontWeight:800,color:mAcc>=80?GREEN:mAcc>=55?GOLD:RED}}>{mAcc}%</div>}
                    <span style={{color:T.muted,fontSize:17}}>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CUSTOM ── */}
        {tab==="custom"&&(
          <CustomScreen T={T}
            onStartTableDrill={startCustomTableGame}
            onStartSeries={startCustomSeriesGame}
            onStartArith={startCustomArithGame}/>
        )}

        {tab==="learn"&&<LearnScreen T={T}/>}

        {/* ── STATS ── */}
        {tab==="stats"&&(
          <div className="su" style={{padding:"14px 15px 8px"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,marginBottom:11,color:T.text}}>Your <span style={{color:GOLD}}>Stats</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
              {[[totalXP,"Total XP",GOLD],[rank.label,"Rank",rank.color],[bestStreak,"Best Streak",GREEN],[Object.values(modeStats).reduce((a,s)=>a+s.attempts,0),"Solved",BLUE]].map(([v,l,c])=>(
                <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 10px",boxShadow:dark?"none":"0 1px 5px rgba(0,0,0,0.05)"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:0.5,marginTop:2}}>{l.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Blitz Bests */}
            {Object.keys(blitzBests).length>0&&(
              <div style={{marginBottom:11}}>
                <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:6}}>⚡ BLITZ PERSONAL BESTS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {Object.entries(blitzBests).map(([mode,best])=>(
                    <div key={mode} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:T.sub,fontWeight:600,textTransform:"capitalize"}}>{mode}</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:20,color:GOLD}}>{best}</span>
                        <span style={{fontSize:9,color:T.muted}}>60s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{fontSize:9,color:T.muted,letterSpacing:2,fontWeight:700,marginBottom:6}}>PER MODE</div>
            {MODES.map(m=>{
              const ms=modeStats[m.id];
              const mAcc=ms.attempts>0?Math.round(ms.correct/ms.attempts*100):0;
              return(
                <div key={m.id} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:11,padding:"9px 12px",marginBottom:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:ms.attempts>0?4:0}}>
                    <span style={{fontWeight:600,fontSize:12,color:T.text}}>{m.label}</span>
                    <div style={{display:"flex",gap:9,alignItems:"center"}}>
                      <span style={{fontSize:10,color:T.sub}}>{ms.attempts}</span>
                      <span style={{fontSize:11,fontWeight:800,color:mAcc>=80?GREEN:mAcc>=55?GOLD:ms.attempts>0?RED:T.muted}}>{ms.attempts>0?`${mAcc}%`:"—"}</span>
                      {ms.avgTime>0&&<span style={{fontSize:9,color:T.muted}}>{ms.avgTime}s avg</span>}
                    </div>
                  </div>
                  {ms.attempts>0&&<Bar value={mAcc} max={100} color={mAcc>=80?GREEN:mAcc>=55?GOLD:RED} height={3}/>}
                </div>
              );
            })}

            {/* Reset */}
            <button onClick={()=>setConfirmReset(true)} style={{marginTop:14,width:"100%",background:"none",border:`1px solid ${T.border}`,borderRadius:10,padding:"10px",fontSize:12,color:T.muted,fontWeight:600,cursor:"pointer"}}>
              Reset all progress
            </button>
          </div>
        )}

        {/* ── RANK & LEADERBOARD ── */}
        {tab==="rank"&&(
          <div className="su" style={{padding:"14px 15px 8px"}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:T.text}}>Global <span style={{color:GOLD}}>Leaderboard</span></div>
              <button onClick={refresh} style={{background:T.inputBg, border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 8px", fontSize:12, color:T.sub}}>↻ Refresh</button>
            </div>
            
            {!user && (
              <div style={{background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px", marginBottom:14, textAlign:'center'}}>
                <div style={{fontSize:13, fontWeight:700, color:T.text, marginBottom:4}}>Log in to join the leaderboard</div>
                <div style={{fontSize:11, color:T.sub, marginBottom:10}}>Compare your XP with other players around the world.</div>
                <button onClick={signIn} style={{padding:"8px 16px", background:GOLD, borderRadius:8, color:"#111", fontSize:12, fontWeight:800}}>SIGN IN</button>
              </div>
            )}

            <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:16}}>
              {leaderboard.length === 0 ? (
                <div style={{textAlign:'center', padding:"20px", color:T.muted, fontSize:12}}>Leaderboard Empty or Loading...</div>
              ) : (
                leaderboard.map((player, idx) => {
                  const isMe = user && player.id === user.uid;
                  const plRank = idx + 1;
                  const rObj = getRank(player.xp || 0);
                  return (
                    <div key={player.id} style={{background:isMe?`${GOLD}18`:T.card, border:`1px solid ${isMe?GOLD:T.border}`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:11}}>
                      <div style={{width:22, fontSize:12, fontWeight:800, color:plRank<=3?GOLD:T.muted, textAlign:'center'}}>#{plRank}</div>
                      <AnimalAvatar id={player.avatar || "owl"} size={32}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:700, fontSize:13, color:isMe?GOLD:T.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{player.name}</div>
                        <div style={{fontSize:10, color:rObj.color, marginTop:1}}>{rObj.label}</div>
                      </div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:T.text}}>{player.xp} <span style={{fontSize:9, color:T.sub, fontWeight:500}}>XP</span></div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:1,marginBottom:8,marginTop:12}}>RANKS</div>
            <div style={{display:'flex', gap:6, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none'}}>
              {RANKS.map(r => (
                <div key={r.label} style={{background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"8px 12px", minWidth:100, flexShrink:0}}>
                  <div style={{fontSize:16, color:r.color, marginBottom:4}}>{r.icon}</div>
                  <div style={{fontSize:11, fontWeight:700, color:T.text}}>{r.label}</div>
                  <div style={{fontSize:9, color:T.sub}}>{r.min} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GAME ── */}
        {tab==="game"&&q&&(
          <div style={{display:"flex",flexDirection:"column",padding:"10px 13px 9px",gap:7,height:"calc(100vh - 48px)"}}>
            {/* Level bar */}
            {!customConfig&&(
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <div style={{flex:1}}><Bar value={qCount%QS_PER_LEVEL} max={QS_PER_LEVEL} color={LVL_COLORS[Math.min(lvl,4)]} height={3}/></div>
                <span style={{fontSize:9,color:T.sub,flexShrink:0,fontWeight:600}}>{qCount%QS_PER_LEVEL}/{QS_PER_LEVEL}</span>
              </div>
            )}
            {/* Session progress bar (custom) */}
            {customConfig&&(
              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <div style={{flex:1}}><Bar value={total} max={sessionMax} color={GOLD} height={3}/></div>
                <span style={{fontSize:9,color:T.sub,flexShrink:0,fontWeight:600}}>{total}/{sessionMax}</span>
              </div>
            )}
            {/* Timer */}
            <div style={{height:3,background:T.inputBg,borderRadius:99,overflow:"hidden",flexShrink:0}}>
              <div style={{height:"100%",background:tColor,borderRadius:99,width:`${tPct}%`,transition:"width 0.1s linear,background 0.4s",boxShadow:`0 0 7px ${tColor}77`}}/>
            </div>

            {/* Q card */}
            <div key={q.display+total} className="su" style={{background:T.card,border:`1.5px solid ${feedback==="correct"?GREEN:feedback==="wrong"?RED:T.border}`,borderRadius:16,padding:"12px 12px",flexShrink:0,position:"relative",overflow:"hidden",transition:"border-color 0.18s",boxShadow:dark?"none":"0 2px 10px rgba(0,0,0,0.06)"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${customConfig?GOLD:LVL_COLORS[Math.min(lvl,4)]},transparent)`}}/>
              {q.type==="seating"&&<Seats arr={q.arrangement} hl={q.hl} circular={q.circular} T={T}/>}
              {isBlood&&<BloodDiagram nodes={q.nodes} edges={q.edges} fromId={q.fromId} toId={q.toId} T={T}/>}
              {q.seqVis&&(
                <div>
                  {q.isWrongType&&<div style={{textAlign:"center",fontSize:10,color:RED,fontWeight:800,letterSpacing:1,marginBottom:5}}>FIND THE WRONG NUMBER</div>}
                  <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:6}}>
                    {q.seqVis.map((v,i)=>{
                      const isMissing=!q.isWrongType&&i===q.missingIdx;
                      const isWrong=q.isWrongType&&i===q.wrongIdx;
                      return(
                        <div key={i} onClick={q.isWrongType&&phase==="playing"?()=>submitAnswer(String(v)):undefined}
                          style={{minWidth:34,height:34,borderRadius:8,padding:"0 4px",
                            background:isMissing?"rgba(200,144,28,0.13)":isWrong&&feedback?"rgba(217,82,82,0.13)":T.inputBg,
                            border:`2px solid ${isMissing?GOLD:isWrong&&feedback?RED:T.border}`,
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,
                            color:isMissing?GOLD:isWrong&&feedback?RED:T.text,
                            cursor:q.isWrongType&&phase==="playing"?"pointer":"default"}}>
                          {isMissing?"?":v}
                        </div>
                      );
                    })}
                  </div>
                  {q.isWrongType&&phase==="playing"&&<div style={{textAlign:"center",fontSize:9,color:T.muted}}>↑ Tap the wrong number</div>}
                </div>
              )}
              <div style={{textAlign:"center"}}>
                {qLines.map((line,li)=>(
                  <div key={li} style={{fontFamily:li===0&&!q.seqVis&&!isBlood&&q.type!=="seating"?"'Barlow Condensed',sans-serif":"inherit",fontWeight:li===0&&!q.seqVis&&!isBlood?900:500,fontSize:li===0&&!q.seqVis&&!isBlood&&q.type!=="seating"?(line.length>22?18:line.length>14?26:42):13,color:li===0?T.text:T.sub,lineHeight:1.25,marginBottom:li<qLines.length-1?3:0}}>
                    {line}{li===qLines.length-1&&!q.seqVis&&!isBlood&&q.type!=="seating"&&<span style={{color:GOLD}}> = ?</span>}
                  </div>
                ))}
                {q.hint&&<div style={{marginTop:5,display:"inline-block",background:"rgba(200,144,28,0.08)",border:"1px solid rgba(200,144,28,0.16)",borderRadius:6,padding:"2px 8px",fontSize:10,color:"rgba(200,144,28,0.75)",fontWeight:600}}>{q.hint}</div>}
              </div>
            </div>

            {/* Answer box */}
            {!isBlood&&!q.isWrongType&&(
              <div style={{background:feedback==="correct"?"rgba(77,199,88,0.09)":feedback==="wrong"?"rgba(217,82,82,0.09)":T.inputBg,border:`2px solid ${feedback==="correct"?GREEN:feedback==="wrong"?RED:T.border}`,borderRadius:12,padding:"9px 15px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,transition:"all 0.18s"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:30,letterSpacing:2,color:feedback==="correct"?GREEN:feedback==="wrong"?RED:typed?T.text:T.muted}}>
                  {feedback==="correct"?`✓ ${q.ans}`:feedback==="wrong"?`✗  ${q.ans}`:typed||"_ _ _"}
                </div>
                {feedback&&<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:12,color:feedback==="correct"?GREEN:RED}}>{feedback==="correct"?`+${LVL_XP[Math.min(lvl,4)]} XP`:typed||"—"}</span>}
              </div>
            )}
            {isBlood&&feedback&&(
              <div style={{background:feedback==="correct"?"rgba(77,199,88,0.09)":"rgba(217,82,82,0.09)",border:`2px solid ${feedback==="correct"?GREEN:RED}`,borderRadius:12,padding:"9px 15px",flexShrink:0,textAlign:"center"}}>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:feedback==="correct"?GREEN:RED}}>{feedback==="correct"?"✓ Correct!":"✗ "+q.ans}</span>
              </div>
            )}
            {q.isWrongType&&feedback&&(
              <div style={{background:feedback==="correct"?"rgba(77,199,88,0.09)":"rgba(217,82,82,0.09)",border:`2px solid ${feedback==="correct"?GREEN:RED}`,borderRadius:12,padding:"9px 15px",flexShrink:0,textAlign:"center"}}>
                <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:feedback==="correct"?GREEN:RED}}>{feedback==="correct"?`✓ ${q.ans} was wrong`:`✗ Wrong was ${q.ans}, not ${typed}`}</span>
              </div>
            )}

            {/* Input */}
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              {isBlood
                ?<BloodOptions options={q.options} correctAns={q.ans} selected={bloodSel} feedback={feedback} disabled={phase!=="playing"} T={T} onTap={k=>{if(phase!=="playing")return;setBloodSel(k);submitAnswer(k);}}/>
                :q.type==="seating"&&q.seatOptions
                  ?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {q.seatOptions.map(opt=>{
                      let bg=T.card2,border=T.border,color=T.text;
                      if(feedback){if(opt===q.ans){bg="rgba(77,199,88,0.13)";border=GREEN;color=GREEN;}else if(opt===typed){bg="rgba(217,82,82,0.13)";border=RED;color=RED;}}
                      return<button key={opt} onClick={()=>{if(phase!=="playing")return;setTyped(opt);submitAnswer(opt);}} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:12,padding:"14px 8px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color,cursor:phase!=="playing"?"default":"pointer",transition:"all 0.18s",textAlign:"center"}}>{opt}</button>;
                    })}
                  </div>
                :isLetter
                  ?<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min((q.arrangement||[]).length,4)},1fr)`,gap:7}}>
                    {(q.arrangement||[]).map(k=>(
                      <button key={k} onClick={()=>phase==="playing"&&(setTyped(k),submitAnswer(k))} style={{background:T.card2,border:`1.5px solid ${T.border}`,borderRadius:11,padding:"15px 0",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:T.text}}>{k}</button>
                    ))}
                  </div>
                :q.isWrongType
                  ?<div style={{textAlign:"center",padding:"8px 0"}}>
                    {!feedback&&<div style={{fontSize:11,color:T.muted}}>↑ Tap the wrong number in the sequence above</div>}
                  </div>
                  :<Numpad onKey={onKey} disabled={phase!=="playing"} T={T}/>
              }
            </div>

            {/* Dots */}
            <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",flexShrink:0}}>
              {Array.from({length:Math.min(total+1,sessionMax)},(_,i)=>{
                const h=hist[i];
                return<div key={i} style={{width:i===total?8:5,height:i===total?8:5,borderRadius:99,background:!h?T.inputBg:h.ok?GREEN:RED,border:i===total?`1.5px solid ${GOLD}`:"none",boxShadow:i===total?`0 0 4px ${GOLD}66`:"none",transition:"all 0.2s"}}/>;
              })}
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {tab==="result"&&(
          <div className="su" style={{padding:"26px 17px",display:"flex",flexDirection:"column",gap:13,alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:72,lineHeight:1,color:acc>=80?GREEN:acc>=55?GOLD:RED,textShadow:`0 0 50px ${acc>=80?GREEN:acc>=55?GOLD:RED}33`}}>{acc}%</div>
              <div style={{fontSize:10,color:T.sub,letterSpacing:2.5,fontWeight:700,marginTop:4}}>
                ACCURACY · {customConfig?"CUSTOM":MODES.find(m=>m.id===modeId)?.label?.toUpperCase()}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,width:"100%"}}>
              {[[score.c,"Correct",GREEN],[score.w,"Wrong",RED],[bestStreak,"Best 🔥",GOLD]].map(([v,l,c])=>(
                <div key={l} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 8px",textAlign:"center",boxShadow:dark?"none":"0 1px 6px rgba(0,0,0,0.05)"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:T.sub,fontWeight:700,letterSpacing:0.5,marginTop:2}}>{l.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",width:"100%"}}>
              {hist.map((h,i)=><div key={i} style={{width:11,height:11,borderRadius:99,background:h.ok?GREEN:RED,boxShadow:`0 0 4px ${h.ok?GREEN:RED}55`}}/>)}
            </div>
            <div style={{display:"flex",gap:7,width:"100%"}}>
              <button onClick={()=>{
                if(customConfig?.type==="table")startCustomTableGame(customConfig);
                else if(customConfig?.type==="series")startCustomSeriesGame(customConfig);
                else if(customConfig?.type==="arith")startCustomArithGame(customConfig);
                else startNormalGame(modeId);
              }} style={{flex:2,background:GOLD,borderRadius:12,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,color:"#111"}}>RETRY</button>
              <button onClick={()=>setTab("home")} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,color:T.sub}}>HOME</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
