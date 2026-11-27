/* Shared presentation only. No data, authentication or RPC behavior lives here. */
(() => {
 const content=document.querySelector('#content');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const motions=new Set();
 reduced.addEventListener('change',()=>{if(reduced.matches)for(const effect of motions)effect.cancel();});
 const seen=new WeakSet();let generation=0,timer,loading,exit,quiet=false;
 const animate=(node,frames,options={})=>{
  if(!node||reduced.matches||!node.animate)return null;
  const effect=node.animate(frames,{duration:220,easing:'cubic-bezier(.2,.7,.2,1)',...options});motions.add(effect);effect.finished.then(()=>motions.delete(effect),()=>motions.delete(effect));return effect;
 };
 function indicator(){
  const nav=document.querySelector('#nav'),active=nav.querySelector('[aria-current]');if(!active)return;
  let marker=nav.querySelector('.nav-selection');
  if(!marker){marker=document.createElement('i');marker.className='nav-selection';marker.setAttribute('aria-hidden','true');nav.prepend(marker);}
  marker.style.width=active.offsetWidth+'px';marker.style.height=active.offsetHeight+'px';
  marker.style.transform=`translate(${active.offsetLeft}px,${active.offsetTop}px)`;
 }
 function stopLoading(){clearTimeout(timer);loading?.remove();loading=null;exit?.cancel();exit=null;content.removeAttribute('data-loading');}
 window.AdminUI={
  begin(id,isQuiet){generation=id;quiet=isQuiet;stopLoading();indicator();if(isQuiet)return;
   exit=animate(content,[{opacity:1,transform:'translateY(0)'},{opacity:.65,transform:'translateY(-3px)'}],{duration:120,fill:'forwards'});
   timer=setTimeout(()=>{
    loading=document.createElement('div');loading.className='workspace-loading';loading.setAttribute('role','status');loading.setAttribute('aria-label','Loading workspace');
    loading.innerHTML='<span>Loading workspace</span><div class="skeleton-line"></div><div class="skeleton-cards"><i></i><i></i><i></i></div><div class="skeleton-table"></div>';
    content.setAttribute('data-loading','');loading.style.top=content.offsetTop+'px';loading.style.left=content.offsetLeft+'px';loading.style.width=content.offsetWidth+'px';content.before(loading);
   },250);
  },
  end(id){if(id!==generation)return;stopLoading();indicator();if(!quiet){animate(document.querySelector('main>header h1'),[{opacity:.5,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});animate(content,[{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}]);}enhance();},
  async closeDialog(dialog){const effect=animate(dialog,[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(4px) scale(.985)'}],{duration:120});await effect?.finished.catch(()=>{});dialog.close();},
 };
 function enhanceEditor(form){
  if(form.dataset.composed)return;form.dataset.composed='true';
  const frame=document.createElement('div');frame.className='editor-layout';form.before(frame);frame.append(form);
  const rail=document.createElement('aside');rail.className='editor-inspector';rail.setAttribute('aria-label','Meal preview and publishing');
  const status=document.querySelector('.meal-editor-status');
  rail.innerHTML='<span class="eyebrow">LIVE PREVIEW</span><img class="inspector-photo" alt="Meal preview"><h3 class="inspector-title"></h3><p class="inspector-meta"></p><p class="inspector-description"></p><hr><span class="eyebrow">PUBLICATION</span><p class="inspector-status"></p><p class="inspector-hint">Draft edits remain private until you publish.</p><div class="inspector-actions"><button form="meal-form" name="action" value="save">Save draft</button><button form="meal-form" name="action" value="publish" class="primary">Publish changes</button></div><small>Online compatible apps receive published updates live.</small>';
  rail.querySelector('.inspector-status').textContent=status?.textContent||'New draft';frame.append(rail);
  const saved=document.createElement('p');saved.className='inspector-hint';saved.textContent=document.querySelector('.meal-editor-saved')?.textContent||'Not saved yet';rail.querySelector('.inspector-actions').before(saved);
  const refresh=()=>{const value=name=>form.elements.namedItem(name)?.value||'';const photo=rail.querySelector('img');photo.src=value('image');photo.hidden=!value('image');rail.querySelector('h3').textContent=value('title')||'Untitled meal';rail.querySelector('.inspector-meta').textContent=[value('time'),value('servings'),value('difficulty')].filter(Boolean).join(' · ');rail.querySelector('.inspector-description').textContent=value('subtitle')||'Your meal description appears here.';};
  form.addEventListener('input',refresh);form.addEventListener('change',refresh);refresh();
  // Organize existing inputs without replacing their nodes, handlers or submitted values.
  const nodes=[...form.children];let section;
  for(const node of nodes){
   if(node.matches('h3,fieldset')){
    if(node.tagName==='FIELDSET'){node.classList.add('editor-block');section=null;continue;}
    section=document.createElement('section');section.className='editor-block';node.before(section);section.append(node);continue;
   }
   if(section&&!node.matches('.filters:last-of-type,#meal-error,button'))section.append(node);
  }
  const category=document.createElement('section');category.className='editor-block editor-categories';category.innerHTML='<h3>Categories and cuisine</h3>';
  for(const name of ['cuisine','tags','primaryTag','tagColor']){const label=form.elements.namedItem(name)?.closest('label');if(label)category.append(label);}
  const ingredientBlock=form.querySelector('fieldset');if(ingredientBlock)ingredientBlock.before(category);else form.append(category);
  const photoBlock=form.querySelector('#meal-photo-preview')?.closest('.editor-block');const remove=form.querySelector('#remove-meal-photo');if(photoBlock&&remove)photoBlock.append(remove);
  form.querySelector('.editor-block')?.classList.add('editor-basic');
  const navigation=document.createElement('nav');navigation.className='editor-anchors';navigation.setAttribute('aria-label','Meal sections');
  form.querySelectorAll('.editor-block').forEach((block,index)=>{
   block.id='meal-section-'+index;const heading=block.querySelector('h3,legend');if(!heading)return;
   const button=document.createElement('button');button.type='button';button.textContent=heading.textContent;button.onclick=()=>{block.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});block.querySelector('input,textarea,select')?.focus({preventScroll:true});};navigation.append(button);
  });frame.before(navigation);
 }
 function enhance(){
  const form=content.querySelector('#meal-form');if(form)enhanceEditor(form);
  const groups=content.querySelectorAll('.metrics .card,.meal-tile,.analytics-pair>.panel,.settings-grid>.panel,.table-wrap,.analytics-grid>.panel,.editor-block');
  let index=0;for(const node of groups){if(seen.has(node))continue;seen.add(node);if(!quiet)animate(node,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{delay:Math.min(index++*25,150),duration:240});}
  content.querySelectorAll('.chart-day,.volume-column').forEach(node=>{node.title=node.textContent.trim().replace(/\s+/g,' ');});
  indicator();
 }
 let scheduled=false;new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance();});}).observe(content,{childList:true,subtree:true});
 new MutationObserver(records=>{for(const record of records){const dialog=record.target;if(dialog instanceof HTMLDialogElement&&dialog.open)animate(dialog,[{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}]);}}).observe(document.body,{attributes:true,attributeFilter:['open'],subtree:true});
 const notice=document.querySelector('#notice');new MutationObserver(()=>{if(notice.textContent&&!/^Loading/.test(notice.textContent))animate(notice,[{opacity:0,transform:'translateY(-3px)'},{opacity:1,transform:'translateY(0)'}],{duration:180});
 if(notice.classList.contains('error')&&!notice.querySelector('button')){const retry=document.createElement('button');retry.textContent='Retry';retry.type='button';retry.onclick=()=>document.querySelector('#refresh').click();notice.append(' ',retry);}
 }).observe(notice,{childList:true});
 window.addEventListener('resize',indicator);document.querySelector('#collapse').addEventListener('click',()=>requestAnimationFrame(indicator));
 document.addEventListener('click',event=>{const summary=event.target.closest('.meal-actions summary');if(summary){const menu=summary.nextElementSibling;requestAnimationFrame(()=>{if(summary.parentElement.open)animate(menu,[{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'translateY(0)'}],{duration:160});});}});
})();
