/* global supabase */
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value ? new Date(value).toLocaleString() : '—';
const statuses = {submitted:'New',under_review:'In Progress',replied:'Waiting for User',resolved:'Resolved',closed:'Closed'};
const kinds = {contact:'Contact Support',bug:'Bug Reports',feature:'Feature Suggestions'};
const sections = ['Overview','Reports & Support','Users','Meals & Recipes','Products & Ingredients','AI & Usage','Analytics','Activity Log','Settings'];
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
  } catch(error) { $('#auth-error').textContent=error.message; }
  finally {button.disabled=false;}
};
$('#logout').onclick=async()=> {
  const {error}=await client.auth.signOut();
  if(error) return notice('Sign out failed. Please retry.',true);
  deny('');
};
client?.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT') deny('');});
$('#collapse').onclick=()=>{
  document.body.classList.toggle('compact');
  $('#collapse').setAttribute('aria-expanded',String(!document.body.classList.contains('compact')));
};
$('#refresh').onclick=()=>render();
$('#close-viewer').onclick=()=>$('#viewer').close();
$('#nav').innerHTML=sections.map((label,i)=>`<a href="#${i}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z','M3 4h18v13H8l-5 4z','M16 21v-3a4 4 0 0 0-8 0v3M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8','M5 3v7h5V3M7 10v11M18 3v18','M3 8l9-5 9 5v12H3z','M4 12h16M12 4v16','M4 20V8M12 20V3M20 20v-9','M5 4h14v17H5zM8 9h8M8 14h8','M4 7h16M4 17h16M8 4v6M16 14v6'][i]}"/></svg><span>${escapeHTML(label)}</span></a>`).join('');
function route() {
 const parts=location.hash.slice(1).split('/');
 return {section:Number(parts[0])||0,user:parts[1],ticket:parts[2]};
}
window.addEventListener('hashchange',()=>{page=0;render();});
async function render(quiet=false) {
 if(!authorized)return;
 if(quiet && document.activeElement?.closest('form'))return;
 const id=++generation, routeState=route();
 $('#title').textContent=sections[routeState.section]||'Overview';
 $('#nav').querySelectorAll('a').forEach((a,i)=>{if(i===routeState.section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 $('#content').setAttribute('aria-busy','true');
 if(!quiet)notice('Loading…');
 try {
  const view=routeState.section===0?'overview':routeState.ticket?'ticket':'inbox';
  if(routeState.section>1){$('#content').innerHTML='<div class="panel"><h2>Coming soon</h2><p>This section is planned for a future release.</p></div>';notice('');return;}
  const data=await rpc('admin_support_read',{options:{...filters,page,view,user:routeState.user||filters.user,ticket:routeState.ticket}});
  if(id!==generation||!authorized)return;
  if(view==='overview')overview(data);
  else if(view==='ticket')await detail(data,routeState,id,quiet);
  else inbox(data);
  if(!quiet)notice('Up to date');
 }catch(error){if(id===generation)notice(error.message,true);}
 finally {if(id===generation)$('#content').setAttribute('aria-busy','false');}
}
function overview(data) {
 $('#content').innerHTML=`<div class="cards">${card('Registered users',data.users)}${card('New registrations',data.new_users,'Last 7 days')}${card('Support requests',data.total)}${card('Requiring attention',data.unanswered)}${card('In Progress',data.statuses.under_review||0)}${card('Resolved',data.statuses.resolved||0)}</div><div class="categories"><button data-quick="submitted">New reports</button><button data-quick="attention">Unanswered requests</button><button data-quick="replied">Waiting for user</button></div><div class="panel"><h2>Support analytics</h2><div class="cards">${Object.entries(kinds).map(([key,label])=>card(label,data.categories[key]||0)).join('')}${card('Average first reply',data.response_hours===null?'Not available':Number(data.response_hours).toFixed(1)+' h')}${card('Average resolution',data.resolution_hours===null?'Not available':Number(data.resolution_hours).toFixed(1)+' h','Tracked since admin migration')}</div><h2>Submission days</h2><p>${data.daily.length?data.daily.map(d=>escapeHTML(d.day)+': '+d.n).join(' · '):'No submissions yet.'}</p></div><div class="panel"><h2>Recent activity</h2><ul class="activity">${data.activity.map(a=>`<li><div><b>${escapeHTML(a.action)}</b><span>${escapeHTML(a.detail)}</span></div><time>${date(a.happened)}</time></li>`).join('')||'<li>No activity yet.</li>'}</ul></div>`;
 document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{filters=b.dataset.quick==='attention'?{attention:'true'}:{status:b.dataset.quick};location.hash='1';});
 $('#nav a[href="#1"] span').textContent='Reports & Support'+(data.unanswered?' · '+data.unanswered:'');
}
function inbox(data) {
 $('#content').innerHTML=`<div class="cards">${card('Total requests',Object.values(data.statuses).reduce((a,b)=>a+b,0))}${Object.entries(statuses).map(([key,label])=>card(label,data.statuses[key]||0)).join('')}</div><div class="categories">${[['','All Requests'],...Object.entries(kinds)].map(([key,label])=>`<button data-kind="${key}" aria-pressed="${(filters.kind||'')===key}">${label}</button>`).join('')}</div><form id="filters" class="filters"><label>Search<input name="search" value="${escapeHTML(filters.search||'')}" placeholder="Title, message or user"></label><label>Status<select name="status">${options({'':'All statuses',...statuses},filters.status)}</select></label><label>Priority<select name="priority">${options({'':'All priorities',low:'Low',normal:'Normal',high:'High',urgent:'Urgent'},filters.priority)}</select></label><label>Submitted since<input type="date" name="after" value="${escapeHTML(filters.after||'')}"></label><label>User ID<input name="user" placeholder="User UUID" value="${escapeHTML(filters.user||'')}"></label><label>Sort<select name="sort">${options({newest:'Newest',oldest:'Oldest',activity:'Last activity'},filters.sort)}</select></label><button>Apply</button><button type="button" id="clear">Reset</button></form><div class="table-wrap"><table><thead><tr><th>Request</th><th>Category</th><th>User</th><th>Submitted</th><th>Last activity</th><th>Priority</th><th>Status</th></tr></thead><tbody>${data.rows.map(r=>`<tr><td><a href="#1/${r.user_id}/${r.request_id}">${!r.admin_read_at?'<i class="unread" aria-label="Unread"></i>':''}${escapeHTML(r.subject)}</a>${r.needs_admin?'<small> · Needs attention</small>':''}</td><td>${kinds[r.kind]}</td><td>${escapeHTML(r.name||r.email||r.user_id)}</td><td>${date(r.created_at)}</td><td>${date(r.updated_at)}</td><td class="${r.priority==='urgent'?'urgent':''}">${escapeHTML(r.priority)}</td><td><span class="badge">${statuses[r.status]}</span></td></tr>`).join('')||'<tr><td colspan="7">No requests match your filters.</td></tr>'}</tbody></table></div><div class="pager"><button id="previous" ${page===0?'disabled':''}>Previous</button><span>${data.count} requests · Page ${page+1}</span><button id="next" ${(page+1)*25>=data.count?'disabled':''}>Next</button></div>`;
 $('#filters').onsubmit=event=>{event.preventDefault();filters={...filters,...Object.fromEntries(new FormData(event.target))};page=0;render();};
 $('#clear').onclick=()=>{filters={};page=0;render();};
 document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{filters.kind=b.dataset.kind;page=0;render();});
 $('#previous').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};
}
async function detail(data,state,id,quiet) {
 const r=data.request;
 if(quiet&&currentTicket===r.request_id&&document.activeElement?.closest('form'))return;
 currentTicket=r.request_id;
 const draft=$('#composer textarea')?.value||'';
 const draftMode=$('#mode')?.value||'reply';
 $('#content').innerHTML=`<a href="#1">← Back to reports</a><div class="detail"><div><h1>${escapeHTML(r.subject)}</h1><p>${kinds[r.kind]} · ${date(r.created_at)}</p><article class="message"><b>${escapeHTML(data.user.name||data.user.email||'Customer')}</b><hr>${escapeHTML(r.message)}${r.reproduction_steps?'<hr><b>Steps to reproduce</b><p>'+escapeHTML(r.reproduction_steps)+'</p>':''}</article><div id="attachments"></div><div>${data.messages.map(m=>`<article class="message ${m.author==='support'?'official':''}"><b>${m.author==='support'?'Tamaddi Support':'Customer'}</b><p>${escapeHTML(m.body)}</p><time>${date(m.created_at)}</time></article>`).join('')}</div><div class="panel"><h2>Status history</h2>${data.events.map(e=>`<p>${statuses[e.status]} · ${date(e.created_at)}</p>`).join('')||'<p>No status changes yet.</p>'}</div><div class="panel"><h2>Internal notes</h2>${data.notes.map(n=>`<div class="message internal">${escapeHTML(n.body)}<time>${date(n.created_at)}</time></div>`).join('')||'<p>No internal notes.</p>'}</div><form id="composer" class="panel"><label>Message type<select id="mode">${options({reply:'Official reply',note:'Private internal note'},draftMode)}</select></label><label>Message<textarea required maxlength="4000" name="body">${escapeHTML(draft)}</textarea></label><p id="privacy">Internal notes stay private. Replies appear in the user’s request.</p><button class="primary">Send</button></form></div><aside><div class="panel metadata"><h2>Request information</h2><b>${escapeHTML(data.user.name||'Customer')}</b><p>${escapeHTML(data.user.email||'No email')}<br>${escapeHTML(data.user.id)}</p><small>Account created</small><p>${date(data.user.created_at)}</p><label>Status<select id="status">${options(statuses,r.status)}</select></label><button id="save-status">Save status</button><label>Priority<select id="priority">${options({low:'Low',normal:'Normal',high:'High',urgent:'Urgent'},r.priority)}</select></label><button id="save-priority">Save priority</button><hr><small>Created</small><p>${date(r.created_at)}</p><small>Updated</small><p>${date(r.updated_at)}</p></div></aside></div>`;
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
 $('#mode').onchange=()=>{pendingId=null;};
 $('#composer').onsubmit=async event=>{
  event.preventDefault();const form=event.target;const body=form.elements.body.value.trim();if(!body)return;
  const button=form.querySelector('button');button.disabled=true;pendingId??=crypto.randomUUID();
  try{await write($('#mode').value,body,pendingId);pendingId=null;form.reset();await render();notice('Message saved successfully');}
  catch(error){notice(error.message,true);button.disabled=false;}
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
  const image=document.createElement('img');image.alt='Attached screenshot';image.src=url;button.prepend(image);
  button.onclick=()=>{$('#large-image').src=url;$('#viewer').showModal();};
  $('#attachments').append(button);
 }
}
setInterval(async()=>{
 if(!authorized||document.hidden||polling)return;
 polling=true;
 try {await render(true);}finally{polling=false;}
},15000);
authenticate();
