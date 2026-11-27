/* global supabase */
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value ? new Date(value).toLocaleString() : '—';
const statuses = {submitted:'New',under_review:'In Progress',replied:'Waiting for User',resolved:'Resolved',closed:'Closed'};
const kinds = {contact:'Contact Support',bug:'Bug Reports',feature:'Feature Suggestions'};
const sections = ['Overview','Reports & Support','Users','Meals & Recipes','Products & Ingredients','AI & Usage','Analytics','Activity Log','Settings'];
$('#today').textContent = new Date().toLocaleDateString(undefined, { weekday:'short', month:'long', day:'numeric' });
const config = window.TAMADDI_ADMIN;
const client = config?.url && config?.key ? supabase.createClient(config.url, config.key, {auth:{storage:sessionStorage,storageKey:'tamaddi-admin',detectSessionInUrl:false}}) : null;
let authorized = false, generation = 0, filters = {}, page = 0, currentTicket = null, polling = false;
const notice = (message, error=false) => { $('#notice').textContent=message; $('#notice').classList.toggle('error',error); };
const options = (values, selected) => Object.entries(values).map(([key,label])=>`<option value="${escapeHTML(key)}" ${key===selected?'selected':''}>${escapeHTML(label)}</option>`).join('');
const card = (label,value,note='')=>`<div class="card">${escapeHTML(label)}<strong>${escapeHTML(value)}</strong><small>${escapeHTML(note)}</small></div>`;
async function rpc(name,args={}) {
  const {data,error}=await client.rpc(name,args);
  if(error) {
    if(error.code==='42501'||error.code==='PGRST301') deny('Your administrator session is unavailable. Sign in again.');
    throw new Error(error.message);
  }
  return data;
}
function deny(message='Administrator access required.') {
  authorized=false; generation++;
  $('#shell').hidden=true; $('#login').hidden=false; $('#content').replaceChildren();
  $('#auth-error').textContent=message;
}
async function authenticate() {
  if(!client) { $('#auth-error').textContent='Admin connection is not configured. Set the website Supabase build variables.'; return; }
  const {data:{session}}=await client.auth.getSession();
  if(!session) return deny('');
  try {
    if(!await rpc('is_tamaddi_admin')) return deny();
    authorized=true; $('#login').hidden=true; $('#shell').hidden=false;
    $('#profile').textContent=session.user.email;
    const preferences=await rpc('admin_support_read',{options:{view:'settings'}});
    autoRefresh=preferences.inbox_refresh;
    await render();
  } catch(error) { deny(error.message); }
}
$('#sign-in').onsubmit=async event=>{
  event.preventDefault();
  const button=event.target.querySelector('button'); button.disabled=true;
  try {
    if(!client) throw Error('Supabase connection is not configured.');
    const form=new FormData(event.target);
    const {error}=await client.auth.signInWithPassword({email:form.get('email'),password:form.get('password')});
    if(error) throw error;
    event.target.reset(); await authenticate();
    if(authorized)await rpc('admin_platform_write',{operation:'login'});
  } catch(error) { $('#auth-error').textContent=error.message; }
  finally {button.disabled=false;}
};
$('#logout').onclick=async()=> {
  if(window.mealEditorGuard&&!await window.mealEditorGuard())return;
  const {error}=await client.auth.signOut();
  if(error) return notice('Sign out failed. Please retry.',true);
  deny('');
};
client?.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT') deny('');});
$('#collapse').onclick=()=>{
  document.body.classList.toggle('compact');
  $('#collapse').setAttribute('aria-expanded',String(!document.body.classList.contains('compact')));
};
$('#refresh').onclick=async()=>{if(window.mealEditorGuard&&!await window.mealEditorGuard())return;render();};
$('#close-viewer').onclick=()=>$('#viewer').close();
$('#nav').innerHTML=sections.map((label,i)=>`<a href="#${i}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z','M3 4h18v13H8l-5 4z','M16 21v-3a4 4 0 0 0-8 0v3M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8','M5 3v7h5V3M7 10v11M18 3v18','M3 8l9-5 9 5v12H3z','M4 12h16M12 4v16','M4 20V8M12 20V3M20 20v-9','M5 4h14v17H5zM8 9h8M8 14h8','M4 7h16M4 17h16M8 4v6M16 14v6'][i]}"/></svg><span>${escapeHTML(label)}</span></a>`).join('');
$('#nav a[href="#1"]').addEventListener('click',()=>{
 filters={};page=0;if(location.hash==='#1')render();
});
function route() {
 const parts=location.hash.slice(1).split('/');
 return {section:Number(parts[0])||0,user:parts[1],ticket:parts[2]};
}
window.addEventListener('hashchange',async()=>{if(window.mealEditorGuard&&!await window.mealEditorGuard())return;page=0;render();});
async function render(quiet=false) {
 if(!authorized)return;
 if(quiet && (document.activeElement?.closest('form') || document.querySelector('#meal-form')))return;
 const id=++generation, routeState=route();
 window.AdminUI?.begin(id,quiet);
 document.body.classList.toggle('meals-workspace',routeState.section===3);
 document.querySelector('.page-description').textContent=['Keep track of users, support and activity across Tamaddi.','Manage customer requests and conversations.','Manage app users and review their activity.','Manage meals, ingredients and recipes in Tamaddi.','Explore ingredients and the meals that use them.','Monitor AI requests, usage and performance.','Understand growth and support trends.','Review administrative actions and important events.','Manage your account and workspace preferences.'][routeState.section]||'Tamaddi administration';
 $('#title').textContent=sections[routeState.section]||'Overview';
 $('#nav').querySelectorAll('a').forEach((a,i)=>{if(i===routeState.section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#content').setAttribute('aria-busy','true');
 delete $('#content').dataset.section;
 if(!quiet)notice('Loading…');
 try {
  const view=routeState.section===0?'overview':routeState.ticket?'ticket':'inbox';
  if(routeState.section>1){await renderPlatform(routeState,id);if(id===generation){$('#content').dataset.section=String(routeState.section);notice('Up to date');}return;}
  const data=await rpc('admin_support_read',{options:{...filters,page,view,user:routeState.user||filters.user,ticket:routeState.ticket}});
  if(id!==generation||!authorized)return;
  if(view==='overview')await overview(data,id);
  else if(view==='ticket')await detail(data,routeState,id,quiet);
  else inbox(data);
  $('#content').dataset.section=String(routeState.section);
  if(!quiet)notice('Up to date');
 }catch(error){if(id===generation)notice(error.message,true);}
 finally {if(id===generation){$('#content').setAttribute('aria-busy','false');polishAdmin();window.AdminUI?.end(id);}}
}
let overviewDays = 7;
async function overview(data,id) {
 const start = new Date(); start.setDate(start.getDate()-overviewDays+1);
 const report = await rpc('admin_support_read',{options:{view:'analytics',after:start.toISOString().slice(0,10)}});
 if(id !== generation)return;
 data.daily=(report.days||[]).map(day=>({day:day.day,n:day.requests}));
 const maxDaily = Math.max(1, ...data.daily.map(day => Number(day.n)));
 const totalCategories = Object.values(data.categories).reduce((sum, n) => sum + Number(n), 0);
 $('#content').innerHTML = `
  <div class="welcome"><div><h2>Your workspace, at a glance.</h2><p>Stay close to your customers and keep support moving.</p></div><a href="#1" class="primary button-link">Open support inbox ↗</a></div>
  <div class="cards metrics">
   ${card('Registered users',data.users,'Across Tamaddi')}
   ${card('New registrations',data.new_users,'In the last 7 days')}
   ${card('Support requests',data.total,'All conversations')}
   ${card('Requiring attention',data.unanswered,'Ready for your response')}
   ${card('In Progress',data.statuses.under_review||0,'Currently under review')}
   ${card('Resolved',data.statuses.resolved||0,'Completed requests')}
  </div>
  <div class="quick-actions"><span>Jump back in</span><button data-quick="submitted">New reports <b>↗</b></button><button data-quick="attention">Unanswered <b>↗</b></button><button data-quick="replied">Waiting for user <b>↗</b></button></div>
  <div class="analytics-grid">
   <section class="panel"><div class="panel-heading"><div><h2>Support volume</h2><p>Submissions by day</p></div><label class="chart-range">Range<select id="overview-range">${options({7:"7 days",30:"30 days"},String(overviewDays))}</select></label></div>
    <div class="volume-chart" role="img" aria-label="Support submissions by date">
     ${data.daily.length ? data.daily.map(day=>`<div class="volume-column"><span>${escapeHTML(day.n)}</span><div class="volume-track"><i style="height:${Number(day.n)/maxDaily*100}%"></i></div><small>${escapeHTML(new Date(day.day+'T00:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}))}</small></div>`).join('') : '<p class="empty">No submissions yet. New requests will appear here.</p>'}
    </div>
   </section>
   <section class="panel category-breakdown"><div class="panel-heading"><div><h2>Request breakdown</h2><p>What customers are reaching out about</p></div></div>
    ${Object.entries(kinds).map(([key,label])=>`<div class="category-row"><div><span>${label}</span><b>${data.categories[key]||0}</b></div><progress max="${Math.max(1,totalCategories)}" value="${data.categories[key]||0}" aria-label="${label}"></progress></div>`).join('')}
    <div class="response-metrics"><div><small>Average first reply</small><strong>${data.response_hours===null?'—':Number(data.response_hours).toFixed(1)+' h'}</strong></div><div><small>Average resolution</small><strong>${data.resolution_hours===null?'—':Number(data.resolution_hours).toFixed(1)+' h'}</strong></div></div><p class="footnote">Resolution time is tracked from the admin migration. A dash means insufficient data.</p>
   </section>
  </div>
  <section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>The latest across your workspace</p></div><span class="live-label">Updated automatically</span></div>
   <ul class="activity">${data.activity.map(a=>`<li><span class="activity-icon" aria-hidden="true">${a.action==='Registration'?'♙':a.action.includes('reply')?'↗':a.action.includes('status')?'✓':'▤'}</span><div><b>${escapeHTML(a.action)}</b><span>${escapeHTML(a.detail)}</span></div><time>${date(a.happened)}</time></li>`).join('')||'<li>No activity yet.</li>'}</ul>
  </section>`;
 $('#overview-range').onchange=()=>{overviewDays=Number($('#overview-range').value);render();};
 document.querySelectorAll('[data-quick]').forEach(button=>button.onclick=()=>{
  filters=button.dataset.quick==='attention'?{attention:'true'}:{status:button.dataset.quick};
  location.hash='1';
 });
 $('#nav a[href="#1"] span').innerHTML='Reports &amp; Support'+(data.unanswered?'<b class="nav-badge">'+escapeHTML(data.unanswered)+'</b>':'');
}
function inbox(data) {
 $('#content').innerHTML=`<div class="cards">${card('Total requests',Object.values(data.statuses).reduce((a,b)=>a+b,0))}${Object.entries(statuses).map(([key,label])=>card(label,data.statuses[key]||0)).join('')}</div><div class="categories">${[['','All Requests'],...Object.entries(kinds)].map(([key,label])=>`<button data-kind="${key}" aria-pressed="${(filters.kind||'')===key}">${label}</button>`).join('')}</div><form id="filters" class="filters"><label>Search<input name="search" value="${escapeHTML(filters.search||'')}" placeholder="Title, message or user"></label><label>Status<select name="status">${options({'':'All statuses',...statuses},filters.status)}</select></label><label>Priority<select name="priority">${options({'':'All priorities',low:'Low',normal:'Normal',high:'High',urgent:'Urgent'},filters.priority)}</select></label><label>Submitted since<input type="date" name="after" value="${escapeHTML(filters.after||'')}"></label><label>User ID<input name="user" placeholder="User UUID" value="${escapeHTML(filters.user||'')}"></label><label>Sort<select name="sort">${options({newest:'Newest',oldest:'Oldest',activity:'Last activity'},filters.sort)}</select></label><button>Apply</button><button type="button" id="clear">Reset</button></form><div class="table-wrap"><table><thead><tr><th>Request</th><th>Category</th><th>User</th><th>Submitted</th><th>Last activity</th><th>Priority</th><th>Status</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td><a href="#1/${r.user_id}/${r.request_id}">${!r.admin_read_at?'<i class="unread" aria-label="Unread"></i>':''}${escapeHTML(r.subject)}</a>${r.needs_admin?'<small> · Needs attention</small>':''}</td><td>${kinds[r.kind]}</td><td><b>${escapeHTML(r.name||r.email||r.user_id)}</b><small>${escapeHTML(r.email||'')}</small><small>${escapeHTML(r.app_platform||'Platform unavailable')} · ${r.app_version?'v'+escapeHTML(r.app_version):'Version not recorded'}</small></td><td>${date(r.created_at)}</td><td>${date(r.updated_at)}</td><td class="${r.priority==='urgent'?'urgent':''}">${escapeHTML(r.priority)}</td><td><span class="badge">${statuses[r.status]}</span></td></tr>`).join('')||'<tr><td colspan="7">No requests match your filters.</td></tr>'}</tbody></table></div><div class="pager"><button id="previous" ${page===0?'disabled':''}>Previous</button><span>${data.count} requests · Page ${page+1}</span><button id="next" ${(page+1)*25>=data.count?'disabled':''}>Next</button></div>`;
 $('#filters').onsubmit=event=>{event.preventDefault();filters={...filters,...Object.fromEntries(new FormData(event.target))};page=0;render();};
 $('#clear').onclick=()=>{filters={};page=0;render();};
 document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{filters.kind=b.dataset.kind;page=0;render();});
 $('#previous').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};
}
async function detail(data,state,id,quiet) {
 const r=data.request;
 if(quiet&&currentTicket===r.request_id&&document.activeElement?.closest('form'))return;
 const sameTicket=currentTicket===r.request_id;
 const draft=sameTicket?($('#composer textarea')?.value||''):'';
 const draftMode=sameTicket?($('#mode')?.value||'reply'):'reply';
 currentTicket=r.request_id;
 $('#content').innerHTML=`<a href="#1">← Back to reports</a><div class="detail"><div><h1>${escapeHTML(r.subject)}</h1><p>${kinds[r.kind]} · ${date(r.created_at)}</p><article class="message"><b>${escapeHTML(data.user.name||data.user.email||'Customer')}</b><hr>${escapeHTML(r.message)}${r.reproduction_steps?'<hr><b>Steps to reproduce</b><p>'+escapeHTML(r.reproduction_steps)+'</p>':''}</article><div id="attachments"></div><div>${data.messages.map(m=>`<article class="message ${m.author==='support'?'official':''}"><b>${m.author==='support'?'Tamaddi Support':'Customer'}</b><p>${escapeHTML(m.body)}</p><time>${date(m.created_at)}</time></article>`).join('')}</div><div class="panel"><h2>Status history</h2>${data.events.map(e=>`<p>${statuses[e.status]} · ${date(e.created_at)}</p>`).join('')||'<p>No status changes yet.</p>'}</div><div class="panel"><h2>Internal notes</h2>${data.notes.map(n=>`<div class="message internal">${escapeHTML(n.body)}<time>${date(n.created_at)}</time></div>`).join('')||'<p>No internal notes.</p>'}</div><form id="composer" class="panel"><label>Message type<select id="mode">${options({reply:'Official reply',note:'Private internal note'},draftMode)}</select></label><label>Message<textarea required maxlength="4000" name="body">${escapeHTML(draft)}</textarea></label><p id="privacy">Internal notes stay private. Replies appear in the user’s request.</p><button class="primary">Send</button></form></div><aside><div class="panel metadata"><h2>Request information</h2><b>${escapeHTML(data.user.name||'Customer')}</b><p>${escapeHTML(data.user.email||'No email')}<br>${escapeHTML(data.user.id)}</p><small>Submitted app version</small><p>${escapeHTML(r.app_platform||'Unknown platform')} · ${escapeHTML(r.app_version||'Not recorded')}${r.app_build?' (build '+escapeHTML(r.app_build)+')':''}</p><small>Account created</small><p>${date(data.user.created_at)}</p><label>Status<select id="status">${options(statuses,r.status)}</select></label><button id="save-status">Save status</button><label>Priority<select id="priority">${options({low:'Low',normal:'Normal',high:'High',urgent:'Urgent'},r.priority)}</select></label><button id="save-priority">Save priority</button><hr><small>Created</small><p>${date(r.created_at)}</p><small>Updated</small><p>${date(r.updated_at)}</p></div></aside></div>`;
 const workspace = $('.detail');
 workspace.classList.add('support-workspace');
 const conversation = workspace.firstElementChild;
 conversation.classList.add('conversation');
 const metadata = workspace.lastElementChild;
 metadata.classList.add('customer-details');
 const notes = [...conversation.querySelectorAll('.panel')].find(panel => panel.querySelector('h2')?.textContent === 'Internal notes');
 if (notes) { notes.classList.add('notes-panel'); metadata.append(notes); }
 const history = [...conversation.querySelectorAll('.panel')].find(panel => panel.querySelector('h2')?.textContent === 'Status history');
 if (history) {
   const disclosure = document.createElement('details');
   disclosure.className = 'history-disclosure';
   const summary = document.createElement('summary');
   summary.textContent = 'Status history';
   history.querySelector('h2').remove();
   disclosure.append(summary, history);
   conversation.insertBefore(disclosure, $('#composer'));
 }
 const heading = document.createElement('div');
 heading.className = 'conversation-heading';
 heading.append(conversation.querySelector('h1'), conversation.querySelector(':scope > p'));
 const badges = document.createElement('div');
 badges.className = 'conversation-badges';
 badges.innerHTML = '<span class="badge">' + statuses[r.status] + '</span><span class="priority-label">' + escapeHTML(r.priority) + ' priority</span>';
 heading.append(badges);
 conversation.prepend(heading);
 $('#composer').classList.add('reply-composer');
 const sendButton = $('#composer button');
 sendButton.textContent = 'Send reply ↗';
 const updateComposerMode = () => {
   const internal = $('#mode').value === 'note';
   $('#composer').classList.toggle('note-mode', internal);
   sendButton.textContent = internal ? 'Save internal note' : 'Send reply ↗';
   $('#privacy').textContent = internal ? 'Private · Only administrators can see this note.' : 'Your reply will appear in the customer’s Tamaddi conversation.';
 };
 updateComposerMode();
 const requestRail = document.createElement('section');
 requestRail.className = 'request-rail';
 requestRail.setAttribute('aria-label', 'Support request navigation');
 requestRail.innerHTML = '<div class="rail-heading"><h2>Conversations</h2><a href="#1">All reports ↗</a></div><form id="rail-filter"><label>Find a request<input name="search" placeholder="Search title, message or user" value="'+escapeHTML(filters.search||'')+'"></label><label>Category<select name="kind">'+options({'':'All categories',...kinds},filters.kind)+'</select></label><label>Status<select name="status">'+options({'':'All statuses',...statuses},filters.status)+'</select></label><button>Filter inbox</button></form><div id="rail-requests" aria-live="polite">Loading conversations…</div>';
 workspace.prepend(requestRail);
 $('#rail-filter').onsubmit = event => {
   event.preventDefault();
   filters = {...filters,...Object.fromEntries(new FormData(event.target))};
   page = 0;
   render();
 };
 const fillRail = async () => {
   try {
     const listing = await rpc('admin_support_read', {options:{...filters,page,view:'inbox'}});
     if(id !== generation) return;
     $('#rail-requests').innerHTML = listing.rows.map(row => '<a class="request-preview '+(row.request_id===r.request_id&&row.user_id===r.user_id?'selected':'')+'" href="#1/'+row.user_id+'/'+row.request_id+'"><div><b>'+escapeHTML(row.subject)+'</b>'+(!row.admin_read_at?'<i class="unread" aria-label="Unread"></i>':'')+'</div><p>'+escapeHTML(row.name||row.email||'Customer')+'</p><footer><span>'+statuses[row.status]+'</span><time>'+escapeHTML(new Date(row.updated_at).toLocaleDateString())+'</time></footer></a>').join('') || '<p class="empty">No matching requests.</p>';
     const pager = document.createElement('div');
     pager.className='rail-pagination';
     const prev=document.createElement('button'), next=document.createElement('button');
     prev.textContent='Previous'; next.textContent='Next';
     prev.disabled=page===0; next.disabled=(page+1)*25>=listing.count;
     prev.onclick=()=>{page--;fillRail();};next.onclick=()=>{page++;fillRail();};
     pager.append(prev,next);$('#rail-requests').append(pager);
   } catch(error) { if(id===generation) $('#rail-requests').textContent=error.message; }
 };
 void fillRail();
 const write=async(operation,value,operationId=null)=>rpc('admin_support_write',{customer:r.user_id,ticket:r.request_id,operation,value,operation_id:operationId});
 const save=async(button,operation,value)=>{
  button.disabled=true;
  try {await write(operation,value);await render();notice('Saved successfully');}
  catch(error){notice(error.message,true);button.disabled=false;}
 };
 $('#save-status').onclick=event=>save(event.target,'status',$('#status').value);
 $('#save-priority').onclick=event=>save(event.target,'priority',$('#priority').value);
 let pendingId=null;
 $('#composer textarea').oninput=()=>{pendingId=null;};
 $('#mode').onchange=()=>{pendingId=null;updateComposerMode();};
 const sendFeedback=document.createElement('p');
 sendFeedback.className='send-feedback';sendFeedback.setAttribute('role','status');
 $('#composer').append(sendFeedback);
 let sending=false;
 $('#composer').onsubmit=async event=>{
  event.preventDefault();
  if(sending)return;
  const form=event.currentTarget;
  const field=form.querySelector('textarea[name="body"]');
  const button=form.querySelector('button[type="submit"],button.primary');
  const mode=form.querySelector('#mode');
  try {
   const body=field.value.trim();
   if(!body){sendFeedback.textContent='Write a message before sending.';field.focus();return;}
   sending=true;button.disabled=true;field.readOnly=true;mode.disabled=true;
   sendFeedback.classList.remove('error');
   sendFeedback.textContent=mode.value==='note'?'Saving private note…':'Sending reply…';
   if(!pendingId){
    if(typeof crypto.randomUUID==='function')pendingId=crypto.randomUUID();
    else {
     const bytes=crypto.getRandomValues(new Uint8Array(16));
     bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
     const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
     pendingId=[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
    }
   }
   await write(mode.value,body,pendingId);
   const stored=await rpc('admin_support_read',{options:{view:'ticket',user:r.user_id,ticket:r.request_id}});
   const records=mode.value==='note'?stored.notes:stored.messages;
   if(!records.some(message=>message.id===pendingId))throw Error('The message could not be confirmed. Retry to check again without creating a duplicate.');
   pendingId=null;field.value='';field.defaultValue='';
   await render();
   notice('Message saved successfully');
  } catch(error) {
   sendFeedback.classList.add('error');
   sendFeedback.textContent='Could not send: '+error.message+' Your draft is preserved.';
   notice(error.message,true);
  } finally {
   sending=false;button.disabled=false;field.readOnly=false;mode.disabled=false;
  }
 };
 if(!quiet)await write('read',null);
 let url=data.legacy;
 if(r.screenshot_path) {
  const result=await client.storage.from('support-screenshots').createSignedUrl(r.screenshot_path,60);
  if(result.error)throw result.error;
  url=result.data.signedUrl;
 }
 if(id!==generation)return;
 if(url) {
  const button=document.createElement('button');button.className='attachment';button.type='button';button.textContent='Open screenshot';
  const caption=document.createElement('span');caption.textContent='Screenshot attachment · Open preview';button.textContent='';button.append(caption);
  const image=document.createElement('img');image.alt='Attached screenshot';image.src=url;button.prepend(image);
  button.onclick=()=>{$('#large-image').src=url;$('#viewer').showModal();};
  $('#attachments').append(button);
 }
}
setInterval(async()=>{
 if(!authorized||!autoRefresh||document.hidden||polling)return;
 polling=true;
 try {await render(true);}finally{polling=false;}
},15000);
