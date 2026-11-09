/* storage.js — LocalStorage layer, date helpers, shared utilities, seed data */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ic=(n,c='')=>`<i data-lucide="${n}" class="${c}"></i>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Actions={};

const Store={
  p:'uniflow.v1.',
  get(k,d){try{const v=localStorage.getItem(this.p+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(this.p+k,JSON.stringify(v))}catch(e){}},
  uid:()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),
  reset(){Object.keys(localStorage).filter(k=>k.startsWith(Store.p)&&k!==Store.p+'lang').forEach(k=>localStorage.removeItem(k));Store.init()},
  init(){
    if(this.get('seeded'))return;
    const d=n=>D.add(n),now=Date.now(),H=36e5;
    this.set('tasks',[
      {id:Store.uid(),k:'s_t1',title:'Review calculus problem set',subject:'Mathematics',priority:'medium',status:'todo',due:d(1)},
      {id:Store.uid(),k:'s_t2',title:'Prepare slides for team project',subject:'Business',priority:'high',status:'todo',due:d(4)},
      {id:Store.uid(),k:'s_t3',title:'Finish research paper outline',subject:'Psychology',priority:'high',status:'progress',due:d(0)},
      {id:Store.uid(),k:'s_t4',title:'Submit chemistry lab report',subject:'Chemistry',priority:'medium',status:'progress',due:d(8)},
      {id:Store.uid(),k:'s_t5',title:'Read chapters 8–10',subject:'Literature',priority:'low',status:'done',due:d(6)}]);
    const E=(k,title,n,time,type)=>({id:Store.uid(),k,title,date:d(n),time,type});
    this.set('events',[
      E('s_e1','Advanced Psychology',0,'09:00','class'),E('s_e2','Calculus focus session',0,'11:30','study'),E('s_e3','Business project sync',0,'14:00','meeting'),
      E('s_e4','Calculus quiz',-5,'10:00','class'),E('s_e5','Library study',-7,'16:00','study'),E('s_e6','Research paper',-2,'23:59','deadline'),
      E('s_e7','Lab report due',2,'23:59','deadline'),E('s_e8','Team sync',3,'15:00','meeting'),E('s_e9','Calculus exam',5,'09:00','deadline'),
      E('s_e10','Group project',6,'13:00','study'),E('s_e11','Essay due',9,'23:59','deadline'),E('s_e12','Review session',11,'17:00','study')]);
    this.set('notes',[
      {id:Store.uid(),k:'s_n1',title:'Cognitive Psychology — Chapter 6',body:'Memory is the process of encoding, storing, and retrieving information. Key concepts include working memory and cognitive load.',cat:'Psychology',pinned:true,updated:now-2*H},
      {id:Store.uid(),k:'s_n2',title:'Calculus formula sheet',body:'Fundamental theorem of calculus, derivative rules, and common integral patterns for the upcoming quiz.',cat:'Mathematics',pinned:true,updated:now-26*H},
      {id:Store.uid(),k:'s_n3',title:'Business project ideas',body:'Explore sustainable campus delivery, peer mentorship platform, and smart resource sharing concepts.',cat:'Business',pinned:false,updated:now-12*24*H},
      {id:Store.uid(),k:'s_n4',title:'Reading list — Summer',body:'The Creative Act, Deep Work, Tomorrow and Tomorrow and Tomorrow, and The Design of Everyday Things.',cat:'Personal',pinned:false,updated:now-14*24*H}]);
    this.set('activity',[
      {kind:'task',sub:'Literature reading notes',ts:now-12*6e4},{kind:'focus',sub:'25 min • Calculus',ts:now-1*H},
      {kind:'note',sub:'Psychology chapter 6',ts:now-3*H},{kind:'record',sub:'7.2 focused hours',ts:now-24*H}]);
    this.set('study',[2.8,4.6,3.4,6,4.2,7.2,5.6]);
    this.set('lastWeek',[2.2,3.9,3.1,4.8,3.6,5.9,4.4]);
    this.set('subjects',{Psychology:12.5,Mathematics:8.4,Business:6.8,Literature:4.8});
    this.set('weeks',[{d:3,t:6},{d:4,t:6},{d:3,t:5}]);
    this.set('settings',{first:'Alex',last:'Morgan',email:'alex@uniflow.app',uni:'University of Washington',avatar:'',
      notif:{task:true,classes:true,weekly:false},theme:'dark',goal:40,dur:{focus:25,short:5,long:15}});
    this.set('sessions',{date:D.today(),count:4});
    this.set('seeded',1);
  }
};

const D={
  iso(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')},
  add(n,b=new Date()){const d=new Date(b);d.setDate(d.getDate()+n);return D.iso(d)},
  parse(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)},
  today(){return D.iso()},
  wd(d=new Date()){return (d.getDay()+6)%7},
  fmt(s){const d=D.parse(s);return t('months')[d.getMonth()]+' '+d.getDate()},
  rel(s){return s===D.today()?t('today'):s===D.add(1)?t('tomorrow'):D.fmt(s)},
  time(hm){const [h,m]=hm.split(':').map(Number);if(Lang.cur==='uz')return [hm,''];
    return [String(h%12||12).padStart(2,'0')+':'+String(m).padStart(2,'0'),h<12?'AM':'PM']},
  ago(ts){const m=Math.round((Date.now()-ts)/6e4);
    if(m<60)return Math.max(m,1)+t('u_m');const h=Math.round(m/60);if(h<24)return h+t('u_h');
    return Math.round(h/24)+t('u_d')}
};
function logActivity(kind,sub){const a=Store.get('activity',[]);a.unshift({kind,sub,ts:Date.now()});Store.set('activity',a.slice(0,30))}
/* seeded items keep a translation key (k); once the user edits them they show their own text */
const seedText=(o,f)=>{if(o.k&&!o.edited){const v=t(o.k+(f==='body'?'_b':''));if(v!==o.k+(f==='body'?'_b':''))return v}return o[f]};
const subjName=s=>{const k='sub_'+String(s).toLowerCase(),v=t(k);return v===k?s:v};
