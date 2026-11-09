/* calendar.js — month / week calendar with manageable events */
const Cal={
  y:new Date().getFullYear(),m:new Date().getMonth(),view:Store.get('calView','month'),ref:D.today(),
  evs(){return Store.get('events',[])},
  days(){ // array of ISO dates to show
    if(this.view==='week'){const b=D.parse(this.ref);b.setDate(b.getDate()-D.wd(b));return [...Array(7)].map((_,i)=>D.add(i,b))}
    const f=new Date(this.y,this.m,1),s=new Date(f);s.setDate(1-D.wd(f));const n=Math.ceil((D.wd(f)+new Date(this.y,this.m+1,0).getDate())/7)*7;
    return [...Array(n)].map((_,i)=>D.add(i,s))},
  title(){if(this.view==='month')return t('monthsLong')[this.m]+' '+this.y;const d=this.days(),a=D.parse(d[0]),b=D.parse(d[6]);return `${t('months')[a.getMonth()]} ${a.getDate()} – ${t('months')[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`},
  render(){const td=D.today(),ev=this.evs(),days=this.days();
    return `<div class="page-h"><div><h1>${t('calendar')}</h1><p>${t('calSub')}</p></div><button class="btn btn-p" data-act="evNew" data-d="${td}">${ic('plus')}${t('newEvent')}</button></div>
    <div class="card cal ${this.view==='week'?'wk':''}"><div class="cal-h"><button class="icon-btn bd" data-act="calNav" data-n="-1">${ic('chevron-left')}</button><button class="icon-btn bd" data-act="calNav" data-n="1">${ic('chevron-right')}</button>
      <h3>${this.title()}</h3><button class="btn btn-g" style="height:38px" data-act="calToday">${t('todayBtn')}</button>
      <div class="seg"><button class="${this.view==='month'?'on':''}" data-act="calView" data-v="month">${t('month')}</button><button class="${this.view==='week'?'on':''}" data-act="calView" data-v="week">${t('week')}</button></div></div>
      <div class="cgrid">${t('dow').map(d=>`<div class="cdow">${d.toUpperCase()}</div>`).join('')}${days.map(d=>{const dd=D.parse(d),out=this.view==='month'&&dd.getMonth()!==this.m,list=ev.filter(e=>e.date===d).sort((a,b)=>a.time.localeCompare(b.time)),max=this.view==='week'?99:3;
        return `<div class="cday ${d===td?'td':''} ${out?'out':''}" data-act="evNew" data-d="${d}"><span class="n">${dd.getDate()}</span>${list.slice(0,max).map(e=>`<button class="ev ${e.type}" data-act="evEdit" data-id="${e.id}" title="${esc(seedText(e,'title'))}">${this.view==='week'?`<small>${D.time(e.time).join(' ').trim()}</small>`:''}${esc(seedText(e,'title'))}</button>`).join('')}${list.length>max?`<div class="moretxt">${t('more',{n:list.length-max})}</div>`:''}</div>`}).join('')}</div></div>`},
  form(id,date){const x=id?this.evs().find(e=>e.id===id):{title:'',date,time:'09:00',type:'class'};
    Modal.form(id?t('editEvent'):t('newEvent'),[{n:'title',l:t('title'),req:1},{n:'date',l:t('date'),type:'date',req:1},{n:'time',l:t('time'),type:'time',req:1},
      {n:'type',l:t('type'),type:'select',opts:['class','study','meeting','deadline'].map(k=>[k,t(k)])}],id?{...x,title:seedText(x,'title')}:x,
      {onDelete:id?()=>this.del(id):null,onSave:o=>{const a=this.evs();
        if(id){const i=a.findIndex(e=>e.id===id),old=a[i];a[i]={...old,...o,edited:old.edited||o.title!==seedText(old,'title')}}else a.push({id:Store.uid(),...o});
        Store.set('events',a);toast(t('evSaved'));const d=D.parse(o.date);this.y=d.getFullYear();this.m=d.getMonth();this.ref=o.date;App.render()}})},
  del(id){Store.set('events',this.evs().filter(e=>e.id!==id));toast(t('evDeleted'));App.render()}
};
Actions.evNew=(a,e)=>{if(e.target.closest('.ev'))return;Cal.form(null,a.dataset.d)};
Actions.evEdit=(a,e)=>{e.stopPropagation();Cal.form(a.dataset.id)};
Actions.calView=a=>{Cal.view=a.dataset.v;Store.set('calView',Cal.view);const d=D.parse(Cal.ref);Cal.y=d.getFullYear();Cal.m=d.getMonth();App.render()};
Actions.calToday=()=>{const n=new Date();Cal.y=n.getFullYear();Cal.m=n.getMonth();Cal.ref=D.today();App.render()};
Actions.calNav=a=>{const n=+a.dataset.n;if(Cal.view==='week'){Cal.ref=D.add(7*n,D.parse(Cal.ref));const d=D.parse(Cal.ref);Cal.y=d.getFullYear();Cal.m=d.getMonth()}
  else{const d=new Date(Cal.y,Cal.m+n,1);Cal.y=d.getFullYear();Cal.m=d.getMonth();Cal.ref=D.iso(d)}App.render()};
