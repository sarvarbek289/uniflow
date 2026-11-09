/* notes.js — Notes: CRUD, search, categories, pinning */
const Notes={
  q:'',cat:'all',
  all(){return Store.get('notes',[])},
  cats:[['english','var(--pu)'],['Mathematics','var(--bl)'],['russia','var(--or)'],['Personal','var(--gr)']],
  when(ts){const m=Math.round((Date.now()-ts)/6e4);if(m<60)return t('ago',{x:Math.max(1,m)+t('u_m')});const h=Math.round(m/60);
    if(h<24)return t('ago',{x:h+t('u_h')});if(h<48)return t('yesterday');return D.fmt(D.iso(new Date(ts)))},
  list(){const q=this.q.toLowerCase();return this.all().filter(n=>(this.cat==='all'||(this.cat==='pinned'?n.pinned:n.cat===this.cat))&&(!q||(n.title+' '+n.body+' '+seedText(n,'title')+' '+seedText(n,'body')).toLowerCase().includes(q)))
    .sort((a,b)=>(b.pinned-a.pinned)||b.updated-a.updated)},
  grid(){const L=this.list();return L.length?L.map(n=>`<div class="card ncard" data-act="noteEdit" data-id="${n.id}"><div class="r"><span class="tag cat-${n.cat.toLowerCase()}">${esc(subjName(n.cat)).toUpperCase()}</span><button class="pinb ${n.pinned?'on':''}" data-act="notePin" data-id="${n.id}" title="${n.pinned?t('unpin'):t('pin')}">${ic('pin')}</button></div>
    <h4>${esc(seedText(n,'title'))}</h4><p>${esc(seedText(n,'body'))}</p><div class="f">${t('edited',{w:this.when(n.updated)})}</div></div>`).join(''):`<div class="empty" style="grid-column:1/-1">${t('noNotes')}</div>`},
  render(){const A=this.all(),on=k=>this.cat===k?'on':'';
    return `<div class="page-h"><div><h1>${t('notes')}</h1><p>${t('notesSub')}</p></div><button class="btn btn-p" data-act="noteNew">${ic('plus')}${t('newNote')}</button></div>
    <div class="notes-l"><div class="nside"><label class="sbox" style="margin-bottom:14px"><i data-lucide="search"></i><input id="nq" value="${esc(this.q)}" placeholder="${t('searchNotes')}"></label>
      <button class="nf ${on('all')}" data-act="noteCat" data-c="all">${ic('file-text')}${t('allNotes')}<em>${A.length}</em></button>
      <button class="nf ${on('pinned')}" data-act="noteCat" data-c="pinned">${ic('pin')}${t('pinned')}<em>${A.filter(n=>n.pinned).length}</em></button>
      <div class="nav-label" style="margin:22px 10px 10px">${t('categories')}</div>
      ${this.cats.map(([c,col])=>`<button class="nf ${on(c)}" data-act="noteCat" data-c="${c}"><i class="d" style="background:${col}"></i>${esc(subjName(c))}<em>${A.filter(n=>n.cat===c).length}</em></button>`).join('')}</div>
    <div class="ngrid" id="ngrid">${this.grid()}</div></div>`},
  mount(v){$('#nq',v).oninput=e=>{this.q=e.target.value;$('#ngrid').innerHTML=this.grid();lucide.createIcons()}},
  form(id){const n=id?this.all().find(x=>x.id===id):{title:'',body:'',cat:this.cats.some(c=>c[0]===this.cat)?this.cat:'Psychology'};
    Modal.form(id?t('editNote'):t('newNote'),[{n:'title',l:t('title'),req:1},{n:'cat',l:t('category'),type:'select',opts:this.cats.map(c=>[c[0],subjName(c[0])])},{n:'body',l:t('content'),type:'textarea'}],
      id?{...n,title:seedText(n,'title'),body:seedText(n,'body')}:n,{onDelete:id?()=>{Store.set('notes',this.all().filter(x=>x.id!==id));toast(t('noteDeleted'));App.render()}:null,
      onSave:o=>{const a=this.all();
        if(id){const i=a.findIndex(x=>x.id===id);a[i]={...a[i],...o,edited:true,updated:Date.now()}}else{a.push({id:Store.uid(),...o,pinned:false,updated:Date.now()});logActivity('note',o.title)}
        Store.set('notes',a);toast(t('noteSaved'));App.render()}})}
};
Actions.noteNew=()=>Notes.form();
Actions.noteEdit=(a,e)=>{if(e.target.closest('.pinb'))return;Notes.form(a.dataset.id)};
Actions.notePin=(a,e)=>{e.stopPropagation();const L=Notes.all(),n=L.find(x=>x.id===a.dataset.id);n.pinned=!n.pinned;Store.set('notes',L);App.render()};
Actions.noteCat=a=>{Notes.cat=a.dataset.c;App.render()};
