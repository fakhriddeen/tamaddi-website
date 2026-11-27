/* Shared catalog editor. Drafts and publishing always cross the administrator RPC boundary. */
let mealCollectionTab = 'meals';
async function renderMealManager(current) {
 const rows=await rpc('admin_meal_catalog');
 if(!current())return;
 document.body.classList.add('meals-workspace');
 const status=row=>row.visible&&row.published?'published':row.published?'archived':'draft';
 const cuisine=recipe=>recipe.cuisine||recipe.tags.find(tag=>['Uzbek','Italian','Turkish','Korean','Japanese','Chinese','Indian','Mexican','French'].includes(tag))||'Other';
 const cuisines=[...new Set(rows.map(row=>cuisine(row.draft)))].sort();
 const categories=[...new Set(rows.flatMap(row=>row.draft.tags))].sort();
 const search=(platformFilters.search||'').toLowerCase();
 const filtered=rows.filter(row=>row.draft.title.toLowerCase().includes(search)&&(!platformFilters.status||status(row)===platformFilters.status)&&(!platformFilters.cuisine||cuisine(row.draft)===platformFilters.cuisine)&&(!platformFilters.category||row.draft.tags.includes(platformFilters.category)));
 filtered.sort((a,b)=>platformFilters.sort==='alphabetical'?a.draft.title.localeCompare(b.draft.title):platformFilters.sort==='oldest'?new Date(a.updated_at)-new Date(b.updated_at):new Date(b.updated_at)-new Date(a.updated_at));
 const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
 $('#content').innerHTML=`<nav class="meal-subnav" aria-label="Meal collection"><button type="button" data-meal-tab="meals" aria-pressed="${mealCollectionTab==='meals'}">${icon('utensils')} Meals</button><button type="button" data-meal-tab="categories" aria-pressed="${mealCollectionTab==='categories'}">${icon('layout-grid')} Categories</button><button type="button" data-meal-tab="cuisines" aria-pressed="${mealCollectionTab==='cuisines'}">${icon('globe')} Cuisines</button><button id="import-meals">${icon('import')} Import</button></nav><div class="meal-summary">${[['Total meals',rows.length,'cooking-pot','total'],['Published',rows.filter(r=>status(r)==='published').length,'circle-check','published'],['Drafts',rows.filter(r=>status(r)==='draft').length,'pencil','draft'],['Archived',rows.filter(r=>status(r)==='archived').length,'archive','archived']].map(([label,value,name,state])=>`<div class="meal-stat ${state}">${icon(name)}<div><strong>${value}</strong><span>${label}</span></div></div>`).join('')}<button id="new-meal" class="meal-primary">+ New meal</button></div><form id="meal-search" class="meal-toolbar"><label class="meal-search-field">${icon('search')}<input name="search" type="search" placeholder="Search meals…" aria-label="Search meals" value="${safe(platformFilters.search||'')}"></label><select name="status" aria-label="Publication status">${options({'':'All statuses',published:'Published',draft:'Draft',archived:'Archived'},platformFilters.status)}</select><select name="cuisine" aria-label="Cuisine">${options({'':'All cuisines',...Object.fromEntries(cuisines.map(v=>[v,v]))},platformFilters.cuisine)}</select><select name="category" aria-label="Category">${options({'':'All categories',...Object.fromEntries(categories.map(v=>[v,v]))},platformFilters.category)}</select><select name="sort" aria-label="Sort meals">${options({newest:'Latest',oldest:'Oldest',alphabetical:'A–Z'},platformFilters.sort)}</select><button class="meal-search-submit">Search</button><button type="button" id="meal-view" aria-label="Switch collection view">${icon('layout-grid')}${icon('list')}</button></form><div class="meal-collection ${platformFilters.list?'meal-list':''}">${filtered.map(row=>`<article class="meal-tile"><div class="meal-photo"><img src="${safe(row.draft.image)}" alt="${safe(row.draft.title)}" loading="lazy"><span class="meal-status ${status(row)}">${icon(status(row)==='published'?'circle-check':'circle-dot')}${status(row)}</span><details class="meal-actions"><summary aria-label="Actions for ${safe(row.draft.title)}">${icon('ellipsis')}</summary><div><button data-edit-meal="${safe(row.id)}">Edit meal</button><button data-preview-meal="${safe(row.id)}">Preview meal</button><button data-duplicate-meal="${safe(row.id)}">Duplicate meal</button>${row.visible&&row.published?`<button data-unpublish-meal="${safe(row.id)}">Unpublish</button>`:''}</div></details></div><div class="meal-caption"><h2>${safe(row.draft.title)}</h2><p>${safe(cuisine(row.draft))}<span>·</span>${icon('clock')} ${safe(row.draft.time)}</p><button class="meal-edit-link" aria-label="Edit ${safe(row.draft.title)}" data-edit-meal="${safe(row.id)}">${icon('square-pen')}</button></div></article>`).join('')||'<div class="panel meal-empty"><h2>No meals found</h2><p>Adjust your filters, create a meal, or import your existing catalog as private drafts.</p></div>'}</div>`;
 if(mealCollectionTab!=='meals') {
  const isCuisine=mealCollectionTab==='cuisines', values=isCuisine?cuisines:categories;
  const panel=document.createElement('section');panel.className='meal-taxonomy';panel.setAttribute('aria-label',isCuisine?'Cuisines':'Categories');
  panel.innerHTML=values.map(value=>`<button type="button" data-taxonomy="${safe(value)}">${icon(isCuisine?'globe':'layout-grid')}<strong>${safe(value)}</strong><span>${rows.filter(row=>isCuisine?cuisine(row.draft)===value:row.draft.tags.includes(value)).length} meals</span>${icon('arrow-up-right')}</button>`).join('')||'<p>No collection groups yet. Add cuisine and categories in the meal editor.</p>';
  $('#meal-search').before(panel);$('#meal-search').hidden=true;document.querySelector('.meal-collection').hidden=true;
  panel.querySelectorAll('button').forEach(button=>button.onclick=()=>{platformFilters[isCuisine?'cuisine':'category']=button.dataset.taxonomy;mealCollectionTab='meals';render();});
 }
 document.querySelectorAll('[data-meal-tab]').forEach(button=>button.onclick=()=>{mealCollectionTab=button.dataset.mealTab;render();});
 window.lucide?.createIcons();
 $('#meal-search').onsubmit=event=>{event.preventDefault();const focused=document.activeElement?.name==='search';const caret=event.target.elements.search.selectionStart;platformFilters={...platformFilters,...Object.fromEntries(new FormData(event.target))};render().then(()=>{if(focused&&$('#meal-search [name=search]')){const input=$('#meal-search [name=search]');input.focus();input.setSelectionRange(caret,caret);}});};
 $('#meal-search').onchange=()=>$('#meal-search').requestSubmit();
 const searchForm=$('#meal-search');let searchTimer;$('#meal-search [name=search]').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(!searchForm.isConnected)return;$('#meal-search').requestSubmit();},450);};
 $('#meal-view').onclick=()=>{platformFilters.list=!platformFilters.list;render();};
 $('#new-meal').onclick=()=>editMeal(null);
 document.querySelectorAll('[data-edit-meal]').forEach(button=>button.onclick=()=>editMeal(rows.find(row=>row.id===button.dataset.editMeal)));
 document.querySelectorAll('[data-preview-meal]').forEach(button=>button.onclick=()=>showPreview(rows.find(row=>row.id===button.dataset.previewMeal).draft));
 document.querySelectorAll('[data-duplicate-meal]').forEach(button=>button.onclick=()=>{const source=rows.find(row=>row.id===button.dataset.duplicateMeal);editMeal({draft:{...source.draft,id:crypto.randomUUID(),title:source.draft.title+' (copy)'},revision:0});});
 document.querySelectorAll('[data-unpublish-meal]').forEach(button=>button.onclick=async()=>{
  const row=rows.find(row=>row.id===button.dataset.unpublishMeal);
  if(!await mealConfirm('Unpublish meal?','This removes the meal from browsing. Saved meals and historical references remain available.','Unpublish'))return;
  button.disabled=true;try{await rpc('admin_save_meal',{meal_id:row.id,content:row.draft,expected_revision:row.revision,operation:'unpublish'});await render();notice('Meal unpublished. Saved references preserved.');}catch(error){notice(error.message,true);button.disabled=false;}
 });
 $('#import-meals').onclick=async event=>{
  const button=event.currentTarget;
  if(!await mealConfirm('Import missing meals?', 'Only missing bundled recipes will be added as private drafts. Existing meals and publications stay intact.', 'Import meals'))return;
  button.disabled=true;
  try {
   const response=await fetch('/admin/catalog.json');if(!response.ok)throw Error('Bundled catalog unavailable.');
   const catalog=await response.json();const existing=new Set(rows.map(row=>row.id));let count=0;
   for(const recipe of catalog.recipes){
    if(existing.has(recipe.id))continue;
    const content={...recipe,image:new URL(recipe.image,location.origin).href};delete content.browsable;
    // Seed as drafts. Import never publishes or replaces an existing administrator edit.
    await rpc('admin_save_meal',{meal_id:content.id,content,expected_revision:0,operation:'save'});count++;
   }
   notice(`Imported ${count} private drafts. Review and publish each meal when ready.`);await render();
  }catch(error){notice(error.message,true);button.disabled=false;}
 };
 function editMeal(row){
  const recipe=row?.draft||{id:crypto.randomUUID(),title:'',uzbekName:'',subtitle:'',time:'30 min',servings:'2 ppl',difficulty:'Easy',image:'',tags:['Quick'],primaryTag:'Quick',tagColor:'#86868B',keyIngredients:[],ingredientBaseServings:1,ingredientAmounts:{}};
  $('#content').innerHTML='<div id="meal-editor"></div>';
  $('#meal-editor').innerHTML=`<section class="panel meal-edit-workspace"><button type="button" id="back-meals">← Back to Meals & Recipes</button><p class="meal-editor-status">${row?status(row):'New draft'} · Revision ${row?.revision||0}</p><p class="meal-editor-saved">${row?.updated_at?'Last saved '+safe(date(row.updated_at)):'Not saved yet'}</p><h2>${row?safe(recipe.title):'New meal'}</h2><p>Saving a draft does not change the published meal. Ingredients and quantities use the base servings below.</p><div class="meal-editor-top"><span>Private draft workspace</span><div><button form="meal-form" name="action" value="save">Save draft</button><button form="meal-form" name="action" value="publish" class="meal-primary">Publish changes</button></div></div><form id="meal-form" class="meal-editor-form"><h3>Basic information</h3>${field('title','Meal name','text',recipe.title)}${field('uzbekName','Alternative name','text',recipe.uzbekName||'')}<label>Description<textarea name="subtitle" required maxlength="2000">${safe(recipe.subtitle)}</textarea></label><div class="filters">${field('time','Preparation time','text',recipe.time)}${field('servings','Servings label','text',recipe.servings)}<label>Difficulty<select name="difficulty">${options({Easy:'Easy',Moderate:'Moderate',Advanced:'Advanced'},recipe.difficulty)}</select></label></div><h3>Meal photograph</h3><img id="meal-photo-preview" class="meal-editor-photo" src="${safe(recipe.image)}" alt="Current meal photograph">${field('image','Photo URL (HTTPS)','url',recipe.image)}<label>Upload photo (JPEG, PNG or WebP, maximum 5 MB)<input id="meal-photo" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" id="remove-meal-photo">Remove photograph</button><p id="photo-status" role="status"></p>${field('cuisine','Cuisine','text',recipe.cuisine||cuisine(recipe))}${field('tags','Categories, separated by commas','text',recipe.tags.join(', '))}${field('primaryTag','Category label','text',recipe.primaryTag||'')}${field('tagColor','Category color','color',recipe.tagColor||'#86868B')}<fieldset><legend>Ingredients and quantities</legend><div id="meal-ingredient-rows"></div><button type="button" id="add-meal-ingredient">+ Add ingredient</button></fieldset>${field('ingredientBaseServings','Base servings for quantities','number',recipe.ingredientBaseServings||1)}<fieldset><legend>Preparation instructions</legend><div id="meal-steps"></div><button type="button" id="add-meal-step">+ Add step</button></fieldset><button type="button" id="preview-draft">Preview meal</button><div class="filters"><button name="action" value="save">Save draft</button><button name="action" value="publish">Publish changes</button>${row?.published?'<button name="action" value="unpublish">Unpublish</button>':''}<button type="button" id="close-meal-editor">Close</button></div><p id="meal-error" role="alert"></p></form></section>`;
  $('#meal-editor').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  function addIngredient(name='',quantity='',unit='g') {
   const line=document.createElement('div');line.className='meal-ingredient-row';
   line.innerHTML=`<label>Ingredient<input data-ingredient-name value="${safe(name)}" maxlength="160" required></label><label>Quantity<input data-ingredient-quantity type="number" min="0" step="any" value="${safe(quantity??'')}" placeholder="Unknown"></label><label>Unit<input data-ingredient-unit value="${safe(unit)}" maxlength="30"></label><button type="button" aria-label="Remove ingredient">Remove</button>`;
   line.querySelector('button').onclick=()=>{line.remove();dirty=true;};
   const reorder=document.createElement('div');reorder.innerHTML='<button type="button" aria-label="Move ingredient up">↑</button><button type="button" aria-label="Move ingredient down">↓</button>';reorder.children[0].onclick=()=>move(line,-1);reorder.children[1].onclick=()=>move(line,1);line.append(reorder);$('#meal-ingredient-rows').append(line);
  }
  for(const name of recipe.keyIngredients) addIngredient(name,recipe.ingredientAmounts?.[name]?.quantity,recipe.ingredientAmounts?.[name]?.unit||'g');
  if(!recipe.keyIngredients.length)addIngredient();
  $('#add-meal-ingredient').onclick=()=>{addIngredient();dirty=true;};
  const suggestions=document.createElement('datalist');suggestions.id='shared-ingredient-names';suggestions.innerHTML=[...new Set(rows.flatMap(row=>row.draft.keyIngredients))].sort().map(name=>`<option value="${safe(name)}">`).join('');$('#meal-form').append(suggestions);$('#meal-ingredient-rows').addEventListener('focusin',event=>{if(event.target.matches('[data-ingredient-name]'))event.target.setAttribute('list','shared-ingredient-names');});
  const form=$('#meal-form');let dirty=false;
  const editorHash=location.hash;
  window.mealEditorGuard=async()=>{if(dirty&&!await mealConfirm('You have unsaved changes.','Discard your changes and leave this meal?','Discard changes','Continue editing')){history.replaceState(null,'',editorHash);return false;}cleanup();return true;};
  form.addEventListener('input',()=>{dirty=true;});
  const leave=async()=>{if(dirty&&!await mealConfirm('You have unsaved changes.','Discard your changes and return to the collection?','Discard changes','Continue editing'))return;cleanup();await render();};
  $('#close-meal-editor').onclick=leave;$('#back-meals').onclick=leave;
  const unload=event=>{if(dirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',unload);
  const navigate=event=>{const link=event.target.closest('a[href]');if(!link||!dirty)return;event.preventDefault();event.stopImmediatePropagation();mealConfirm('You have unsaved changes.','Discard your changes and leave this meal?','Discard changes','Continue editing').then(ok=>{if(ok){cleanup();location.href=link.href;}});};
  document.addEventListener('click',navigate,true);
  function cleanup(){window.mealEditorGuard=null;dirty=false;window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);}
  $('#remove-meal-photo').onclick=()=>{form.elements.image.value='';$('#meal-photo-preview').removeAttribute('src');dirty=true;form.dispatchEvent(new Event('input',{bubbles:true}));};
  form.elements.image.oninput=()=>{$('#meal-photo-preview').src=form.elements.image.value;};
  function move(line,delta){const sibling=delta<0?line.previousElementSibling:line.nextElementSibling;if(sibling){if(delta<0)line.parentNode.insertBefore(line,sibling);else line.parentNode.insertBefore(sibling,line);dirty=true;}}
  function addStep(text=''){
   const line=document.createElement('div');line.className='meal-step';line.innerHTML=`<label>Step<textarea data-step required>${safe(text)}</textarea></label><div><button type="button" aria-label="Move step up">↑</button><button type="button" aria-label="Move step down">↓</button><button type="button" aria-label="Remove step">Remove</button></div>`;
   const buttons=line.querySelectorAll('button');buttons[0].onclick=()=>move(line,-1);buttons[1].onclick=()=>move(line,1);buttons[2].onclick=()=>{line.remove();dirty=true;};$('#meal-steps').append(line);
  }
  (recipe.instructions||[]).forEach(addStep);$('#add-meal-step').onclick=()=>{addStep();dirty=true;};
  $('#preview-draft').onclick=()=>showPreview(readContent());
  function readContent(){const values=Object.fromEntries(new FormData(form));return {...recipe,cuisine:values.cuisine.trim(),instructions:[...form.querySelectorAll('[data-step]')].map(input=>input.value.trim()).filter(Boolean),title:values.title.trim(),uzbekName:values.uzbekName.trim(),subtitle:values.subtitle.trim(),time:values.time.trim(),servings:values.servings.trim(),difficulty:values.difficulty,image:values.image.trim(),tags:values.tags.split(',').map(v=>v.trim()).filter(Boolean),primaryTag:values.primaryTag.trim(),tagColor:values.tagColor,keyIngredients:[...form.querySelectorAll('[data-ingredient-name]')].map(input=>input.value.trim()).filter(Boolean),ingredientBaseServings:Number(values.ingredientBaseServings),ingredientAmounts:Object.fromEntries([...form.querySelectorAll('.meal-ingredient-row')].map(line=>[line.querySelector('[data-ingredient-name]').value.trim(),{quantity:line.querySelector('[data-ingredient-quantity]').value===''?null:Number(line.querySelector('[data-ingredient-quantity]').value),unit:line.querySelector('[data-ingredient-unit]').value.trim()}]))};}

  let uploading=false;
  $('#meal-photo').onchange=async event=>{
   const file=event.target.files[0];if(!file)return;
   const status=$('#photo-status');
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880){status.textContent='Choose a JPEG, PNG or WebP image under 5 MB.';return;}
   uploading=true;status.textContent='Uploading photo…';
   try{
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const path=recipe.id+'/'+crypto.randomUUID()+'.'+ext;
    const {error}=await client.storage.from('meal-photos').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;
    $('#meal-form [name=image]').value=client.storage.from('meal-photos').getPublicUrl(path).data.publicUrl;
    dirty=true;$('#meal-photo-preview').src=$('#meal-form [name=image]').value;form.dispatchEvent(new Event('input',{bubbles:true}));
    status.textContent='Photo uploaded. Save or publish the meal to use it.';
   }catch(error){status.textContent='Upload failed: '+error.message;}finally{uploading=false;}
  };
  $('#meal-form').onsubmit=async event=>{
   event.preventDefault();const form=event.target;const errorBox=$('#meal-error');errorBox.textContent='';
   if(uploading){errorBox.textContent='Wait for the photo upload to finish.';return;}
   const operation=event.submitter?.value||'save';
   const buttons=document.querySelectorAll('#meal-form button,button[form="meal-form"]');buttons.forEach(button=>button.disabled=true);
   try{
    const content=readContent();
    if(operation!=='unpublish'&&(!content.title||!content.subtitle||!content.time||!content.servings||!content.keyIngredients.length||!content.image.startsWith('https://')||!(content.ingredientBaseServings>0)))throw Error('Complete the meal details, ingredients, HTTPS photo and positive base servings.');
    const messages={save:['Save changes as draft?','Changes stay private. Users continue seeing the last published version.','Save draft'],publish:['Publish meal updates?','Compatible Tamaddi apps will receive these changes after synchronization.','Publish changes'],unpublish:['Unpublish meal?','The meal disappears from browsing. Saved meals and history remain available.','Unpublish']};
    if(!await mealConfirm(...messages[operation])){buttons.forEach(button=>button.disabled=false);return;}
    await rpc('admin_save_meal',{meal_id:recipe.id,content,expected_revision:row?.revision||0,operation});
    notice(operation==='publish'?'Meal published. Updated apps will sync it shortly.':operation==='unpublish'?'Meal removed from browsing. Saved references remain available.':'Private draft saved.');
    cleanup();await render();notice(operation==='save'?'Private draft saved.':operation==='publish'?'Meal published. Compatible apps will synchronize shortly.':'Meal unpublished.');
   }catch(error){errorBox.textContent=error.message;buttons.forEach(button=>button.disabled=false);}
  };
 }
}

function mealConfirm(title,message,accept,cancel='Cancel') {
 return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='meal-dialog';dialog.innerHTML=`<h2>${safe(title)}</h2><p>${safe(message)}</p><div><button data-cancel>${safe(cancel)}</button><button data-accept class="meal-primary">${safe(accept)}</button></div>`;document.body.append(dialog);const finish=async result=>{await window.AdminUI?.closeDialog(dialog);if(dialog.open)dialog.close();dialog.remove();resolve(result);};dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-accept]').onclick=()=>finish(true);dialog.oncancel=event=>{event.preventDefault();finish(false);};dialog.showModal();});
}
function showPreview(recipe){
 const dialog=document.createElement('dialog');dialog.className='meal-dialog meal-app-preview';dialog.innerHTML=`<button class="preview-close">Close preview</button><img src="${safe(recipe.image)}" alt="${safe(recipe.title)}"><h2>${safe(recipe.title)}</h2><p>${safe(recipe.time)} · ${safe(recipe.servings)}</p><p>${safe(recipe.subtitle)}</p><h3>Ingredients</h3><ul>${recipe.keyIngredients.map(name=>`<li>${safe(name)} ${safe(recipe.ingredientAmounts?.[name]?.quantity??'')} ${safe(recipe.ingredientAmounts?.[name]?.unit||'')}</li>`).join('')}</ul><h3>Preparation</h3><ol>${(recipe.instructions||[]).map(step=>`<li>${safe(step)}</li>`).join('')}</ol><p>App-style preview · personal ingredient overrides are not shown.</p>`;dialog.querySelector('button').onclick=async()=>{await window.AdminUI?.closeDialog(dialog);if(dialog.open)dialog.close();dialog.remove();};dialog.oncancel=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
}
