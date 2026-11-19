const STORAGE_KEY = 'trace_flood_response_demo_v1';
const noticeKey = 'trace_demo_notice_dismissed_v1';
const TEAM_LIST = [
  {name:'Food & essentials', icon:'◒', desc:'Food packs and essential supplies'},
  {name:'Safe shelter', icon:'⌂', desc:'Temporary shelter and evacuation'},
  {name:'Medical response', icon:'＋', desc:'First aid and urgent care referrals'},
  {name:'Water & sanitation', icon:'◌', desc:'Safe water and hygiene support'}
];
const STATUS_LABELS = {pending_review:'Needs review', approved:'Approved', assigned:'Assigned', delivered:'Support delivered', follow_up:'Follow-up needed', closed:'Closed'};
const NEED_ICONS = {'Food':'◒','Safe shelter':'⌂','Medical care':'＋','Clean water':'◌','Evacuation':'↗','Other':'···'};
const CASES = [
  {id:'TR-2601', zone:'Khilgaon', location:'Near the community clinic, Block C', household:'3–5 people', needs:['Medical care','Clean water'], priority:'urgent', status:'pending_review', note:'Two residents have fever and the drinking water was contaminated after water entered the home. One older adult needs help reaching a clinic.', consent:true, team:'', createdAt:Date.now()-1000*60*28, history:['Report captured by Field Ops']},
  {id:'TR-2602', zone:'Badda', location:'North of the canal footbridge', household:'6–8 people', needs:['Safe shelter','Food'], priority:'high', status:'assigned', note:'The ground floor is flooded. The family is staying on the roof and needs safe shelter and food packs.', consent:true, team:'Safe shelter', createdAt:Date.now()-1000*60*76, history:['Report captured by Field Ops','Reviewed and assigned to Safe shelter']},
  {id:'TR-2603', zone:'Demra', location:'Near the market road', household:'3–5 people', needs:['Food','Clean water'], priority:'standard', status:'delivered', note:'Food and safe drinking water requested for the household. Access is possible by foot from the main road.', consent:true, team:'Food & essentials', createdAt:Date.now()-1000*60*60*3, history:['Report captured by Field Ops','Food and water delivered']},
  {id:'TR-2604', zone:'Jatrabari', location:'Community school shelter, east entrance', household:'1–2 people', needs:['Medical care'], priority:'high', status:'follow_up', note:'A resident with a leg injury is at the school shelter. Initial first aid was provided; clinic transport still needs confirmation.', consent:true, team:'Medical response', createdAt:Date.now()-1000*60*60*5, history:['Report captured by Field Ops','First aid noted','Follow-up requested for clinic transport']},
  {id:'TR-2605', zone:'Khilgaon', location:'Near the bus depot', household:'6–8 people', needs:['Evacuation','Safe shelter'], priority:'urgent', status:'assigned', note:'Water is rising near the house. Household includes a person with limited mobility and requests evacuation support.', consent:true, team:'Safe shelter', createdAt:Date.now()-1000*60*60*6, history:['Report captured by Field Ops','Reviewed and assigned to Safe shelter']},
  {id:'TR-2606', zone:'Badda', location:'Community centre, lane 4', household:'3–5 people', needs:['Clean water'], priority:'standard', status:'closed', note:'Safe drinking water requested. Bottled water was provided and the household confirmed receipt.', consent:true, team:'Water & sanitation', createdAt:Date.now()-1000*60*60*22, history:['Report captured by Field Ops','Water delivered','Case closed after confirmation']}
];

let cases = loadCases();
let activeView = 'overview';
let caseFilter = 'all';
let lastDraft = null;
let toastTimer;

function loadCases(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(CASES);
  } catch { return structuredClone(CASES); }
}
function persist(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); }
  catch { showToast('Browser storage is unavailable. This change may not persist.'); }
}
function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function formatTime(timestamp){
  const delta = Math.max(0, Date.now()-timestamp);
  if(delta < 60*60*1000) return `${Math.max(1,Math.floor(delta/60000))} min ago`;
  if(delta < 24*60*60*1000) return `${Math.floor(delta/(60*60*1000))} hr ago`;
  return new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(timestamp));
}
function titleCase(value=''){return value.charAt(0).toUpperCase()+value.slice(1);}
function countByStatus(statuses){return cases.filter(c=>statuses.includes(c.status)).length;}
function needsList(){
  const totals = new Map();
  cases.filter(c=>c.status!=='closed').forEach(c=>(c.needs||[]).forEach(n=>totals.set(n,(totals.get(n)||0)+1)));
  return [...totals.entries()].sort((a,b)=>b[1]-a[1]);
}
function render(){
  renderCounts();
  renderOverview();
  renderCases();
  renderResponse();
  updateConnection();
}
function renderCounts(){
  document.getElementById('nav-case-count').textContent = countByStatus(['pending_review']);
  document.getElementById('filter-count-all').textContent = cases.length;
  document.getElementById('filter-count-pending').textContent = countByStatus(['pending_review']);
  document.getElementById('filter-count-open').textContent = countByStatus(['approved','assigned','delivered','follow_up']);
  document.getElementById('filter-count-closed').textContent = countByStatus(['closed']);
}
function renderOverview(){
  const assisted = countByStatus(['delivered','closed']);
  const openCases = cases.filter(c=>c.status!=='closed');
  const stats = [
    {label:'Reports logged',value:cases.length,foot:'All household reports',icon:'▤',kind:''},
    {label:'Needs review',value:countByStatus(['pending_review']),foot:'Waiting for a worker',icon:'◷',kind:'alert'},
    {label:'Support delivered',value:assisted,foot:'Confirmed in this exercise',icon:'✓',kind:'good'},
    {label:'Areas with open cases',value:new Set(openCases.map(c=>c.zone)).size,foot:'Of 4 exercise areas',icon:'⌖',kind:''}
  ];
  document.getElementById('stats-grid').innerHTML = stats.map(s=>`<article class="stat-card ${s.kind}"><div class="stat-top"><span>${s.label}</span><span class="stat-icon">${s.icon}</span></div><div class="stat-value">${s.value}</div><div class="stat-foot">${s.foot}</div></article>`).join('');
  const byZone = Object.fromEntries(['Khilgaon','Badda','Demra','Jatrabari'].map(z=>[z,cases.filter(c=>c.zone===z&&c.status!=='closed').length]));
  Object.entries(byZone).forEach(([zone,count])=>{
    const node=document.getElementById(`zone-count-${zone}`); if(node){node.textContent=count;node.classList.toggle('urgent',cases.some(c=>c.zone===zone&&c.priority==='urgent'&&c.status!=='closed'));}
  });
  document.querySelectorAll('[data-zone-filter]').forEach(node=>node.classList.remove('selected'));
  const urgent = cases.filter(c=>c.status!=='closed'&&c.priority==='urgent').length;
  document.getElementById('priority-count').textContent = urgent;
  const priority = cases.filter(c=>c.status!=='closed').sort((a,b)=>priorityRank(a.priority)-priorityRank(b.priority)||a.createdAt-b.createdAt).slice(0,4);
  document.getElementById('priority-list').innerHTML = priority.length ? priority.map(c=>`<article class="priority-item" data-open-case="${escapeHtml(c.id)}"><span class="priority-symbol">${NEED_ICONS[c.needs?.[0]]||'⌖'}</span><span class="priority-item-copy"><strong>${escapeHtml(c.id)} <span class="priority-tag ${priorityClass(c.priority)}">${escapeHtml(titleCase(c.priority))}</span></strong><small>${escapeHtml(c.zone)} · ${(c.needs||[]).slice(0,2).map(escapeHtml).join(', ')}</small></span><span class="chevron">›</span></article>`).join('') : '<div class="priority-empty">No open cases yet.</div>';
  const totals = needsList().slice(0,4); const max = Math.max(1,...totals.map(x=>x[1]));
  document.getElementById('needs-bars').innerHTML = totals.length ? totals.map(([need,count])=>`<div class="need-bar-item"><div class="need-bar-label"><span>${escapeHtml(need)}</span><strong>${count}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(7,count/max*100)}%"></div></div></div>`).join('') : '<div class="subtle-label">No needs recorded.</div>';
  document.querySelectorAll('[data-open-case]').forEach(el=>el.addEventListener('click',()=>openCase(el.dataset.openCase)));
}
function priorityRank(value){return value==='urgent'?0:value==='high'?1:2;}
function priorityClass(value){return `priority-${escapeHtml(value||'standard')}`;}
function caseRow(c){
  return `<article class="case-row" data-open-case="${escapeHtml(c.id)}">
    <div class="case-id-wrap"><strong>${escapeHtml(c.id)}</strong><small>${formatTime(c.createdAt)}</small></div>
    <div class="case-area">${escapeHtml(c.zone)}<small>${escapeHtml(c.location)}</small></div>
    <div class="case-needs">${(c.needs||[]).slice(0,2).map(n=>`<span class="need-chip">${escapeHtml(n)}</span>`).join('')}</div>
    <span class="case-status status-${escapeHtml(c.status)}">${escapeHtml(STATUS_LABELS[c.status]||c.status)}</span>
    <span class="priority-label ${priorityClass(c.priority)}">${escapeHtml(c.priority)}</span>
  </article>`;
}
function renderCases(){
  const query=(document.getElementById('case-search')?.value||'').trim().toLowerCase();
  const filtered=cases.filter(c=>{
    const inFilter=caseFilter==='all'||(caseFilter==='pending'&&c.status==='pending_review')||(caseFilter==='open'&&['approved','assigned','delivered','follow_up'].includes(c.status))||(caseFilter==='closed'&&c.status==='closed');
    const haystack=`${c.id} ${c.zone} ${c.location} ${(c.needs||[]).join(' ')} ${c.note}`.toLowerCase();
    return inFilter&&haystack.includes(query);
  }).sort((a,b)=>priorityRank(a.priority)-priorityRank(b.priority)||b.createdAt-a.createdAt);
  document.getElementById('case-list').innerHTML=filtered.map(caseRow).join('');
  document.getElementById('empty-cases').classList.toggle('hidden',filtered.length!==0);
  document.querySelectorAll('#case-list [data-open-case]').forEach(el=>el.addEventListener('click',()=>openCase(el.dataset.openCase)));
}
function renderResponse(){
  const open=cases.filter(c=>c.status!=='closed');
  const icons=['◒','⌂','＋','◌'];
  document.getElementById('team-grid').innerHTML=TEAM_LIST.map((t,i)=>{
    const assigned=open.filter(c=>c.team===t.name);
    const active=assigned.filter(c=>['assigned','follow_up'].includes(c.status)).length;
    const delivered=assigned.filter(c=>c.status==='delivered').length;
    const total=assigned.length;
    const percent=Math.min(100,total?Math.round(total/6*100):0);
    return `<article class="team-card"><div class="team-card-top"><span class="team-icon">${icons[i]}</span><span class="team-capacity">${active} active</span></div><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.desc)}</p><div class="team-metric"><strong>${total}</strong><span>routed · ${delivered} delivered</span></div><div class="team-progress"><span style="width:${percent}%"></span></div></article>`;
  }).join('');
  const assigned=cases.filter(c=>c.team&&c.status!=='closed');
  const rows=assigned.map(c=>`<div class="work-row"><strong>${escapeHtml(c.id)}</strong><span>${escapeHtml(c.team)}</span><span>${escapeHtml(c.zone)}</span><span class="case-status status-${escapeHtml(c.status)}">${escapeHtml(STATUS_LABELS[c.status])}</span></div>`).join('');
  document.getElementById('team-worklist').innerHTML=assigned.length?'<div class="work-row head"><span>CASE</span><span>TEAM</span><span>AREA</span><span>STATUS</span></div>'+rows:'<div class="work-empty">No cases have been routed yet.</div>';
}
function setView(view){
  const valid=['overview','intake','cases','response','route-map'];
  if(!valid.includes(view)) return;
  activeView=view;
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.route===view));
  const title={'overview':'Overview','intake':'New intake','cases':'Case queue','response':'Response teams','route-map':'Route map'}[view];
  document.getElementById('current-crumb').textContent=title;
  window.location.hash=view;
  window.scrollTo({top:0,behavior:'smooth'});
  if(view==='cases') renderCases();
}
function showToast(message){
  const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);
}
function updateConnection(){
  const chip=document.querySelector('.local-save-chip');
  if(!chip)return;
  chip.innerHTML=navigator.onLine?'<span class="save-dot"></span> Saved on this device':'<span class="save-dot offline"></span> Offline · saved on this device';
}
function analyzeNote(){
  const note=document.getElementById('field-note').value.trim();
  const checked=[...document.querySelectorAll('input[name="need"]:checked')].map(input=>input.value);
  if(note.length<8){showToast('Add a short field note first.');return;}
  const text=note.toLowerCase();
  const rules=[['Food',['food','hungry','meal','rice','ration']],['Safe shelter',['shelter','roof','home','house','displaced','stay']],['Medical care',['medical','clinic','injur','fever','sick','medicine','pregnant','breath']],['Clean water',['water','drink','thirst','contaminat']],['Evacuation',['evacuat','trapped','rescue','rising','stranded']]];
  const inferred=rules.filter(([,words])=>words.some(word=>text.includes(word))).map(([need])=>need);
  const needs=[...new Set([...checked,...inferred])];
  let priority='standard';
  if(/trapped|rescue|not breathing|critical|stranded|rising fast|immediate danger/.test(text)) priority='urgent';
  else if(/injur|fever|medical|clinic|medicine|pregnant|elderly|child|no food|no water/.test(text)) priority='high';
  lastDraft={needs,priority,summary:note.length>180?`${note.slice(0,177)}…`:note};
  const node=document.getElementById('draft-result');
  node.innerHTML=`<div class="draft-row"><span>Suggested urgency</span><strong class="priority-label ${priorityClass(priority)}">${escapeHtml(titleCase(priority))}</strong></div><div class="draft-row"><span>Suggested needs</span><strong>${needs.length?needs.map(escapeHtml).join(', '):'No match · choose manually'}</strong></div><div class="draft-row"><span>Draft summary</span><strong>${escapeHtml(lastDraft.summary)}</strong></div><div class="draft-warning">Rule-based demo suggestion. Review and correct every item before saving.</div>`;
  node.classList.remove('hidden');document.getElementById('draft-placeholder').classList.add('hidden');document.getElementById('save-case').disabled=false;
  showToast('Draft ready for your review.');
}
function saveIntake(event){
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  if(!lastDraft){showToast('Create and review a draft before saving.');return;}
  const needs=[...document.querySelectorAll('input[name="need"]:checked')].map(input=>input.value);
  if(!needs.length){showToast('Select at least one requested support type.');return;}
  const caseId=`TR-${String(Math.floor(2607+Math.random()*9000))}`;
  const c={id:caseId,zone:document.getElementById('zone').value,location:document.getElementById('location').value.trim(),household:document.getElementById('household-size').value,needs,priority:lastDraft.priority,status:'pending_review',note:document.getElementById('field-note').value.trim(),consent:true,team:'',createdAt:Date.now(),history:['Report captured by Field Ops','Rule-based draft created · pending human review']};
  cases.unshift(c);persist();form.reset();lastDraft=null;
  document.getElementById('draft-result').classList.add('hidden');document.getElementById('draft-placeholder').classList.remove('hidden');document.getElementById('save-case').disabled=true;document.getElementById('char-count').textContent='0 / 800';
  render();setView('cases');openCase(caseId);showToast(`${caseId} saved for human review.`);
}
function openCase(id){
  const c=cases.find(item=>item.id===id);if(!c)return;
  const needs=(c.needs||[]).map(n=>`<span class="need-chip">${escapeHtml(n)}</span>`).join(' ');
  let actions='';
  if(c.status==='pending_review'){
    actions=`<select id="assign-team"><option value="">Choose response team</option>${TEAM_LIST.map(t=>`<option ${c.team===t.name?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</select><button class="button button-primary" data-case-action="assign">Approve & route</button>`;
  }else if(['assigned','follow_up'].includes(c.status)){
    actions=`<button class="button button-primary" data-case-action="delivered">Mark support delivered</button><button class="button button-secondary" data-case-action="follow">Request follow-up</button>`;
  }else if(c.status==='delivered'){
    actions=`<button class="button button-primary" data-case-action="close">Close after confirmation</button><button class="button button-secondary" data-case-action="follow">Request follow-up</button>`;
  }else{
    actions='<span class="subtle-label">This case is closed.</span>';
  }
  document.getElementById('modal-content').innerHTML=`<div class="modal-eyebrow">CASE RECORD · ${escapeHtml(c.zone.toUpperCase())}</div><div class="modal-title-row"><div><h2 id="modal-title">${escapeHtml(c.id)}</h2><p>${escapeHtml(c.location)} · ${escapeHtml(c.household)}</p></div><span class="case-status status-${escapeHtml(c.status)}">${escapeHtml(STATUS_LABELS[c.status])}</span></div><div class="modal-grid"><div class="modal-field"><small>Suggested priority · human review</small><strong class="priority-label ${priorityClass(c.priority)}">${escapeHtml(titleCase(c.priority))}</strong></div><div class="modal-field"><small>Assigned team</small><strong>${escapeHtml(c.team||'Not assigned')}</strong></div><div class="modal-field"><small>Requested support</small><strong>${needs||'None listed'}</strong></div><div class="modal-field"><small>Household</small><strong>${escapeHtml(c.household)}</strong></div></div><div class="case-modal-note">${escapeHtml(c.note)}</div><div class="modal-actions">${actions}</div><p class="modal-history">${(c.history||[]).map(escapeHtml).join(' · ')}</p>`;
  document.getElementById('case-modal').classList.remove('hidden');
  document.querySelectorAll('[data-case-action]').forEach(btn=>btn.addEventListener('click',()=>updateCase(c.id,btn.dataset.caseAction)));
}
function updateCase(id,action){
  const c=cases.find(item=>item.id===id);if(!c)return;
  if(action==='assign'){
    const team=document.getElementById('assign-team').value;
    if(!team){showToast('Choose a response team before routing.');return;}
    c.team=team;c.status='assigned';c.history.push(`Reviewed and assigned to ${team}`);
  }else if(action==='delivered'){
    c.status='delivered';c.history.push('Support delivery marked by Field Ops');
  }else if(action==='follow'){
    c.status='follow_up';c.history.push('Follow-up requested by Field Ops');
  }else if(action==='close'){
    c.status='closed';c.history.push('Case closed after confirmation');
  }
  persist();render();openCase(id);showToast('Case updated.');
}
function dismissModal(){document.getElementById('case-modal').classList.add('hidden');}

document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.route)));
document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.go)));
document.querySelectorAll('.filter-tab').forEach(button=>button.addEventListener('click',()=>{
  caseFilter=button.dataset.filter;document.querySelectorAll('.filter-tab').forEach(tab=>tab.classList.toggle('active',tab===button));renderCases();
}));
document.querySelectorAll('[data-zone-filter]').forEach(button=>button.addEventListener('click',()=>{
  setView('cases');caseFilter='all';document.querySelectorAll('.filter-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.filter==='all'));
  document.getElementById('case-search').value=button.dataset.zoneFilter;renderCases();showToast(`Showing ${button.dataset.zoneFilter} cases.`);
}));
document.getElementById('case-search').addEventListener('input',renderCases);
document.getElementById('analyze-note').addEventListener('click',analyzeNote);
document.getElementById('intake-form').addEventListener('submit',saveIntake);
document.getElementById('field-note').addEventListener('input',event=>{
  document.getElementById('char-count').textContent=`${event.target.value.length} / 800`;
  if(lastDraft){lastDraft=null;document.getElementById('save-case').disabled=true;document.getElementById('draft-result').classList.add('hidden');document.getElementById('draft-placeholder').classList.remove('hidden');}
});
document.getElementById('close-modal').addEventListener('click',dismissModal);
document.getElementById('case-modal').addEventListener('click',event=>{if(event.target.id==='case-modal')dismissModal();});
document.getElementById('dismiss-banner').addEventListener('click',()=>{document.querySelector('.prototype-banner').remove();try{sessionStorage.setItem(noticeKey,'1');}catch{}});
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
window.addEventListener('keydown',event=>{if(event.key==='Escape')dismissModal();});
const firstView=(window.location.hash||'').replace('#','');
if(firstView) setView(firstView);
try{if(sessionStorage.getItem(noticeKey)==='1')document.querySelector('.prototype-banner').remove();}catch{}
render();
