/* tasks.js — Tasks page: CRUD, priorities, filters, Kanban / List, drag & drop */
const Tasks={
  q:'',pri:'all',view:Store.get('tasksView','kanban'),
  all(){return Store.get('tasks',[])},
  save(a){Store.set('tasks',a);App.updateChrome()},
  list(){const q=this.q.toLowerCase();return this.all().filter(x=>(this.pri==='all'||x.priority===this.pri)&&(!q||(x.title+' '+seedText(x,'title')+' '+x.subject+' '+subjName(x.subject)).toLowerCase().includes(q)))},
  card(x){return `<div class="tcard" draggable="true" data-id="${x.id}"><div class="r"><span class="tag ${x.priority}">${t(x.priority)}</span><button class="icon-btn" style="width:28px;height:28px" data-act="taskMenu" data-id="${x.id}">${ic('ellipsis')}</button></div>
    <h4>${esc(seedText(x,'title'))}</h4><p>${esc(subjName(x.subject))}</p>
    <div class="f"><span>${ic('calendar')}${D.rel(x.due)}</span><span>${x.status!=='done'?`<button data-act="taskNext" data-id="${x.id}" title="${t('moveNext')}">${ic('chevron-right')}</button>`:''}<button data-act="taskDel" data-id="${x.id}" title="${t('delete')}">${ic('trash-2')}</button></span></div></div>`},
  board(){const L=this.list();
    if(this.view==='list')return L.length?`<div class="list"><div class="lrow h"><span></span><span>${t('title').toUpperCase()}</span><span>${t('subject').toUpperCase()}</span><span>${t('priority').toUpperCase()}</span><span>${t('due').toUpperCase()}</span><span>${t('status').toUpperCase()}</span><span></span></div>${L.map(x=>`<div class="lrow"><button class="chk ${x.status==='done'?'on':''}" data-act="taskTick" data-id="${x.id}">${ic('check')}</button><b class="hd ${x.status==='done'?'done':''}" style="font-weight:600;cursor:pointer" data-act="taskEdit" data-id="${x.id}">${esc(seedText(x,'title'))}</b><span class="muted">${esc(subjName(x.subject))}</span><span><span class="tag ${x.priority}">${t(x.priority)}</span></span><span class="muted">${D.rel(x.due)}</span><span class="muted">${t('st_'+x.status)}</span><span style="display:flex;gap:4px"><button class="icon-btn" style="width:28px;height:28px" data-act="taskEdit" data-id="${x.id}">${ic('pencil')}</button><button class="icon-btn" style="width:28px;height:28px" data-act="taskDel" data-id="${x.id}">${ic('trash-2')}</button></span></div>`).join('')}</div>`:`<div class="card empty">${t('noTasks')}</div>`;
    const cols=[['todo','var(--pu)'],['progress','var(--bl)'],['done','var(--gr)']];
    return `<div class="board">${cols.map(([s,c])=>{const items=L.filter(x=>x.status===s);
      return `<div><div class="col-h"><i class="d" style="background:${c}"></i><b>${t('st_'+s)}</b><span>${items.length}</span><button data-act="taskNew" data-s="${s}">${ic('plus')}</button></div>
      <div class="col" data-col="${s}">${items.map(x=>this.card(x)).join('')}</div>${s!=='done'?`<button class="add-dash" data-act="taskNew" data-s="${s}">${ic('plus')}${t('addTask')}</button>`:''}</div>`}).join('')}</div>`},
  render(){return `<div class="page-h"><div><h1>${t('myTasks')}</h1><p>${t('tasksSub')}</p></div><button class="btn btn-p" data-act="taskNew">${ic('plus')}${t('addTask')}</button></div>
    <div class="toolbar"><label class="sbox"><i data-lucide="search"></i><input id="tq" value="${esc(this.q)}" placeholder="${t('searchTasks')}"></label>
    <button class="btn btn-g" data-act="taskFilter">${ic('list-filter')}${t('filter')}${this.pri!=='all'?` · ${t(this.pri)}`:''}</button>
    <div class="seg" style="margin-left:auto"><button data-act="taskView" data-v="kanban" class="${this.view==='kanban'?'on':''}">${ic('kanban')}</button><button data-act="taskView" data-v="list" class="${this.view==='list'?'on':''}">${ic('list')}</button></div></div>
    <div id="tboard">${this.board()}</div>`},
  mount(v){$('#tq',v).oninput=e=>{this.q=e.target.value;this.refresh()}},
  refresh(){const b=$('#tboard');if(b){b.innerHTML=this.board();lucide.createIcons()}App.updateChrome()},
  form(id,status='todo'){const x=id?this.all().find(i=>i.id===id):{title:'',subject:'',priority:'medium',status,due:D.today()};
    const subs=['Mathematics','english','russia','Literature','Chemistry'];
    Modal.form(id?t('editTask'):t('newTask'),[{n:'title',l:t('title'),req:1},{n:'subject',l:t('subject'),list:'subs'},
      {n:'priority',l:t('priority'),type:'select',opts:['high','medium','low'].map(p=>[p,t(p)])},{n:'due',l:t('due'),type:'date',req:1},
      {n:'status',l:t('status'),type:'select',opts:['todo','progress','done'].map(p=>[p,t('st_'+p)])}],
      id?{...x,title:seedText(x,'title')}:x,{extra:`<datalist id="subs">${subs.map(s=>`<option value="${s}">`).join('')}</datalist>`,
      onDelete:id?()=>this.del(id):null,
      onSave:o=>{const a=this.all();
        if(id){const i=a.findIndex(z=>z.id===id),old=a[i];if(old.status!=='done'&&o.status==='done')logActivity('task',o.title);
          a[i]={...old,...o,edited:old.edited||o.title!==seedText(old,'title')};toast(t('taskSaved'))}
        else{a.push({id:Store.uid(),...o});if(o.status==='done')logActivity('task',o.title);toast(t('taskAdded'))}
        this.save(a);this.rerender()}})},
  del(id){this.save(this.all().filter(x=>x.id!==id));toast(t('taskDeleted'));this.rerender()},
  rerender(){App.page==='tasks'?this.refresh():App.render()},
  move(id,s){const a=this.all(),x=a.find(i=>i.id===id);if(!x||x.status===s)return;if(s==='done')logActivity('task',seedText(x,'title'));x.status=s;this.save(a);this.rerender()}
};
Actions.taskNew=a=>Tasks.form(null,a.dataset.s||'todo');
Actions.taskEdit=a=>Tasks.form(a.dataset.id);
Actions.taskDel=a=>Tasks.del(a.dataset.id);
Actions.taskNext=a=>{const x=Tasks.all().find(i=>i.id===a.dataset.id);Tasks.move(x.id,x.status==='todo'?'progress':'done')};
Actions.taskTick=a=>{const x=Tasks.all().find(i=>i.id===a.dataset.id);Tasks.move(x.id,x.status==='done'?'todo':'done')};
Actions.taskView=a=>{Tasks.view=a.dataset.v;Store.set('tasksView',Tasks.view);App.render()};
Actions.taskMenu=a=>{const id=a.dataset.id;Menu.show(a,[{l:t('edit'),i:'pencil',fn:()=>Tasks.form(id)},{l:t('delete'),i:'trash-2',danger:1,fn:()=>Tasks.del(id)}])};
Actions.taskFilter=a=>Menu.show(a,['all','high','medium','low'].map(p=>({l:p==='all'?t('all'):t(p),check:Tasks.pri===p,fn:()=>{Tasks.pri=p;App.render()}})));
/* drag & drop between Kanban columns */
document.addEventListener('dragstart',e=>{const c=e.target.closest?.('.tcard');if(c){e.dataTransfer.setData('text/plain',c.dataset.id);c.classList.add('drag')}});
document.addEventListener('dragend',e=>{e.target.classList?.remove('drag');$$('.col.over').forEach(c=>c.classList.remove('over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest?.('.col');if(c){e.preventDefault();$$('.col.over').forEach(x=>x!==c&&x.classList.remove('over'));c.classList.add('over')}});
document.addEventListener('drop',e=>{const c=e.target.closest?.('.col');if(c){e.preventDefault();Tasks.move(e.dataTransfer.getData('text/plain'),c.dataset.col)}});
