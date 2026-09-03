(() => {
  'use strict';

  const S = window.DPV3_SCHEMA;
  const STORAGE_KEY = 'magnit-dp-v3-new-workspaces-v1';
  const INTRO_KEY = 'magnit-dp-v3-new-intro-v1';
  const MAX_WORKSPACES = 5;
  const MAX_SKU = S.TEMPLATE.skuCapacity;
  const MAX_DEFECTS = 6;
  const pages = [
    ['shipment','Приёмка','Общие данные'],
    ['products','Товары','До 12 SKU'],
    ['checklist','Чек-лист','Шаги 0–10'],
    ['quality','Качество','Массы и дефекты'],
    ['export','Выгрузка','Excel V3 1:1'],
  ];

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const content = $('#content');
  const workspaceTabs = $('#workspaceTabs');
  const workflow = $('#workflow');
  const saveLabel = $('#saveLabel');
  const importInput = $('#importExcelInput');
  const busy = $('#busy');
  const toastStack = $('#toastStack');

  function uid(prefix='id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function nowHHMM() { const d=new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  function esc(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function attr(v='') { return esc(v).replace(/`/g,'&#96;'); }
  function num(v) { const n=Number(String(v ?? '').replace(',','.')); return Number.isFinite(n)?n:0; }
  function hasValue(v) { return v !== null && v !== undefined && String(v).trim() !== ''; }
  function fmtNum(v, digits=3) { return num(v).toLocaleString('ru-RU',{maximumFractionDigits:digits}); }
  function percent(part,total) { return num(total)>0 ? num(part)*100/num(total) : 0; }
  function toast(message,type='') {
    const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; toastStack.append(el);
    setTimeout(()=>el.remove(),4200);
  }
  function setBusy(on,title='Формируем Excel V3',text='Открываем мастер-шаблон…') {
    busy.hidden=!on; $('#busyTitle').textContent=title; $('#busyText').textContent=text;
  }

  function defaultSku() {
    return {
      id:uid('sku'), code:'', name:'', vpt:'', sampleMass:'', defectMass:'', nonstandardMass:'', debrisMass:'', caliberMass:'',
      mprPercent:'3.4', brixValues:'', apmError:'no', comment:'', requiresColor:false, requiresDensity:false, requiresBrix:false,
      checklist:{}, defects:[]
    };
  }
  function defaultWorkspace(index=1) {
    return {
      id:uid('acc'),
      shipment:{requestNumber:'',rc:'',date:todayISO(),supplier:'',format:'Онлайн',mokk:'',dpId:'',connectionTime:'',reportEnd:''},
      skus:[defaultSku()],
      ui:{page:'shipment',skuIndex:0,step:0},
      createdAt:new Date().toISOString(),
      label:`Приёмка ${index}`
    };
  }
  function defaultRoot() { const w=defaultWorkspace(1); return {version:1,activeId:w.id,workspaces:[w]}; }

  function normalizeSku(raw={}) {
    const sku={...defaultSku(),...raw};
    sku.checklist = raw.checklist && typeof raw.checklist==='object' ? raw.checklist : {};
    sku.defects = Array.isArray(raw.defects) ? raw.defects.slice(0,MAX_DEFECTS) : [];
    if (!hasValue(sku.mprPercent)) sku.mprPercent='3.4';
    return sku;
  }
  function normalizeWorkspace(raw,index) {
    const base=defaultWorkspace(index+1);
    return {
      ...base,...raw,
      shipment:{...base.shipment,...(raw.shipment||{})},
      skus:(Array.isArray(raw.skus)&&raw.skus.length?raw.skus:[defaultSku()]).slice(0,MAX_SKU).map(normalizeSku),
      ui:{...base.ui,...(raw.ui||{})}
    };
  }
  function loadRoot() {
    try {
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if (!raw?.workspaces?.length) return defaultRoot();
      const workspaces=raw.workspaces.slice(0,MAX_WORKSPACES).map(normalizeWorkspace);
      return {version:1,activeId:workspaces.some(w=>w.id===raw.activeId)?raw.activeId:workspaces[0].id,workspaces};
    } catch { return defaultRoot(); }
  }
  let rootState=loadRoot();
  let saveTimer=null;
  function save() {
    clearTimeout(saveTimer); saveLabel.textContent='Сохраняем…';
    saveTimer=setTimeout(()=>{
      localStorage.setItem(STORAGE_KEY,JSON.stringify(rootState));
      saveLabel.textContent='Сохранено локально';
    },120);
  }
  function active() { return rootState.workspaces.find(w=>w.id===rootState.activeId)||rootState.workspaces[0]; }
  function sku() { const w=active(); w.ui.skuIndex=Math.min(w.ui.skuIndex,w.skus.length-1); return w.skus[w.ui.skuIndex]; }

  function isApplicable(item,q) { return !q.feature || Boolean(item?.[q.feature]); }
  function qAnswered(item,q) {
    if (!isApplicable(item,q)) return true;
    const a=item.checklist?.[q.code]||{};
    if (q.type==='number') return hasValue(a.value);
    return a.status==='yes'||a.status==='no';
  }
  function qNeedsTime(q,a) {
    if (S.QUESTIONS_WITHOUT_TIME.has(q.code)||q.noTime) return false;
    if (q.code==='7.4' && num(a?.value)<=0) return false;
    return true;
  }
  function qComplete(item,q) {
    if (!qAnswered(item,q)) return false;
    const a=item.checklist?.[q.code]||{};
    if (a.status==='no' && !String(a.comment||'').trim()) return false;
    if (qNeedsTime(q,a) && !a.time) return false;
    return true;
  }

  function progress(w) {
    const sh=w.shipment;
    const shipReq=['requestNumber','rc','date','supplier','format','mokk','dpId','connectionTime'];
    const shipDone=shipReq.filter(k=>hasValue(sh[k])).length;
    const prodTotal=w.skus.length*2, prodDone=w.skus.reduce((n,s)=>n+Number(hasValue(s.code))+Number(hasValue(s.name)),0);
    let qTotal=0,qDone=0;
    w.skus.forEach(item=>S.QUESTIONS.forEach(q=>{if(isApplicable(item,q)){qTotal++;if(qComplete(item,q))qDone++;}}));
    let qualTotal=0,qualDone=0;
    w.skus.forEach(item=>{
      const keys=['vpt','sampleMass','defectMass','nonstandardMass','debrisMass','caliberMass','mprPercent'];
      if(item.requiresBrix) keys.push('brixValues');
      qualTotal+=keys.length; qualDone+=keys.filter(k=>hasValue(item[k])).length;
    });
    const expDone=hasValue(sh.reportEnd)?1:0;
    return {
      shipment:[shipDone,shipReq.length],products:[prodDone,prodTotal],checklist:[qDone,qTotal],quality:[qualDone,qualTotal],export:[expDone,1]
    };
  }
  function pct([done,total]) { return total?Math.round(done*100/total):0; }

  function renderChrome() {
    const w=active(); const p=progress(w);
    workspaceTabs.innerHTML=rootState.workspaces.map((x,i)=>{
      const label=x.shipment.rc||x.label||`Приёмка ${i+1}`; const sub=x.shipment.requestNumber?`№ ${x.shipment.requestNumber}`:`${x.skus.length} SKU`;
      return `<button class="workspace-tab ${x.id===w.id?'active':''}" data-workspace="${x.id}"><strong>${esc(label)}</strong><span>${esc(sub)}</span><i>${pct(progress(x).checklist)}%</i></button>`;
    }).join('');
    $('[data-action="add-workspace"]')?.toggleAttribute('disabled',rootState.workspaces.length>=MAX_WORKSPACES);
    workflow.innerHTML=pages.map(([id,title,sub],i)=>{
      const pair=p[id],complete=pct(pair)===100;
      return `<button class="workflow-item ${w.ui.page===id?'active':''} ${complete?'complete':''}" data-page="${id}"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${title}</strong><small>${sub}</small></div><em>${complete?'✓':`${pair[0]}/${pair[1]}`}</em></button>`;
    }).join('');
  }

  function pageHead(kicker,title,text,actions='') {
    return `<header class="page-head"><div><span class="kicker">${kicker}</span><h1>${title}</h1><p>${text}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</header>`;
  }
  function templateBanner() {
    return `<div class="template-banner"><div class="master"><span>Единственный мастер-шаблон</span><strong>v.05/01-PILOT.2 · schema 1.2-pilot</strong></div><div><span>Ёмкость</span><strong>12 SKU</strong></div><div><span>Разметка</span><strong>5 + 5 + 2</strong></div><div><span>Экспорт</span><strong>1:1</strong></div></div>`;
  }
  function rcOptions(value) {
    return `<option value="">Выберите РЦ</option>`+S.RC_LIST.map(x=>`<option ${x===value?'selected':''}>${esc(x)}</option>`).join('');
  }
  function field(label,key,value,type='text',extra='') {
    return `<div class="field"><label class="required">${label}</label><input class="input" type="${type}" data-shipment="${key}" value="${attr(value||'')}" ${extra}></div>`;
  }

  function renderShipment() {
    const w=active(),sh=w.shipment;
    return `${pageHead('01 · Приёмка','Данные поставки','Все общие реквизиты записываются в строки каждого активного SKU нового листа «Чек лист_ДП_Отчет».',`<button class="btn btn-ghost" data-action="import">Импортировать заявку</button>`)}
      ${templateBanner()}
      <section class="panel"><header class="panel-head"><div><h2>Общие данные</h2><p>Поля C–K нового V3. МОКК и ДП заполняются вручную.</p></div></header><div class="panel-body grid grid-4">
        ${field('№ заявки','requestNumber',sh.requestNumber)}
        <div class="field"><label class="required">РЦ</label><select class="select" data-shipment="rc">${rcOptions(sh.rc)}</select></div>
        ${field('Дата','date',sh.date,'date')}
        ${field('Поставщик','supplier',sh.supplier)}
        ${field('Формат приёмки','format',sh.format)}
        ${field('МОКК','mokk',sh.mokk)}
        ${field('ДП (ID)','dpId',sh.dpId)}
        <div class="field"><label class="required">Время подключения</label><div class="input-group"><input class="input" type="time" data-shipment="connectionTime" value="${attr(sh.connectionTime)}"><button class="btn btn-ghost" data-action="now-shipment" data-target="connectionTime">Сейчас</button></div><span class="hint">Выгружается точно в D2.</span></div>
      </div></section>
      <section class="panel"><header class="panel-head"><div><h2>Что изменилось в V3</h2><p>Сайт больше не содержит маршрутов экспорта в старый шаблон.</p></div></header><div class="panel-body grid grid-3">
        <div class="metric"><span>Строки товаров</span><strong>5–16</strong></div><div class="metric"><span>SKU-блоки чек-листа</span><strong>J…CI</strong></div><div class="metric"><span>Техническая схема</span><strong>paired 5+5+2</strong></div>
      </div></section>`;
  }

  function skuToolbar(w) {
    return `<div class="sku-toolbar">${w.skus.map((x,i)=>`<button class="sku-chip ${i===w.ui.skuIndex?'active':''}" data-select-sku="${i}"><strong>${esc(x.name||`SKU ${i+1}`)}</strong><span>${esc(x.code||'код не указан')}</span></button>`).join('')}${w.skus.length<MAX_SKU?'<button class="sku-chip add" data-action="add-sku">＋</button>':''}</div>`;
  }
  function renderProducts() {
    const w=active();
    return `${pageHead('02 · Товары',`Товарные позиции · ${w.skus.length}/${MAX_SKU}`,'Новая схема рассчитана на 12 SKU. Каждая позиция получает собственный 7-колоночный блок чек-листа в Excel.',`<button class="btn btn-primary" data-action="add-sku" ${w.skus.length>=MAX_SKU?'disabled':''}>+ Добавить SKU</button>`)}
      ${skuToolbar(w)}
      <div class="product-list">${w.skus.map((x,i)=>`<article class="product-card ${i===w.ui.skuIndex?'active':''}" data-select-sku="${i}">
        <div class="product-card-head"><div class="product-number">${i+1}</div><div class="product-title"><strong>${esc(x.name||'Новый товар')}</strong><span>${esc(x.code||'Код товара не указан')}</span></div><div class="product-card-actions">${w.skus.length>1?`<button class="btn btn-danger btn-small" data-action="remove-sku" data-index="${i}">Удалить</button>`:''}</div></div>
        <div class="grid grid-2"><div class="field"><label>Код товара</label><input class="input" data-sku-field="code" data-index="${i}" value="${attr(x.code)}" placeholder="Код SKU"></div><div class="field"><label>Название товара</label><input class="input" data-sku-field="name" data-index="${i}" value="${attr(x.name)}" placeholder="Наименование"></div></div>
        <div class="feature-row">
          <label class="feature-toggle"><input type="checkbox" data-sku-feature="requiresColor" data-index="${i}" ${x.requiresColor?'checked':''}> Цветность</label>
          <label class="feature-toggle"><input type="checkbox" data-sku-feature="requiresDensity" data-index="${i}" ${x.requiresDensity?'checked':''}> Плотность</label>
          <label class="feature-toggle"><input type="checkbox" data-sku-feature="requiresBrix" data-index="${i}" ${x.requiresBrix?'checked':''}> Brix</label>
        </div>
      </article>`).join('')}</div>`;
  }

  function stepCompletion(item,stepId) {
    const qs=S.QUESTIONS.filter(q=>q.step===stepId&&isApplicable(item,q));
    return qs.length&&qs.every(q=>qComplete(item,q));
  }
  function answer(item,code) { return item.checklist?.[code]||{}; }
  function renderQuestion(item,q) {
    const a=answer(item,q), withoutTime=S.QUESTIONS_WITHOUT_TIME.has(q.code)||q.noTime, error=a.status==='no'&&!String(a.comment||'').trim();
    const mainControl=q.type==='number'
      ? `<div class="number-control"><input class="input" type="number" min="0" step="1" data-q-value="${q.code}" value="${attr(a.value??'')}" placeholder="0"><span>${q.unit||''}</span></div>`
      : `<div class="question-controls"><button class="status-btn yes ${a.status==='yes'?'active':''}" data-q-status="${q.code}" data-status="yes">Да</button><button class="status-btn no ${a.status==='no'?'active':''}" data-q-status="${q.code}" data-status="no">Нет</button></div>`;
    const time=withoutTime?`<span class="no-time">без тайм-кода</span>`:`<div class="time-control"><input class="input" type="time" data-q-time="${q.code}" value="${attr(a.time||'')}" ${q.code==='7.4'&&num(a.value)<=0?'disabled':''}><button class="clock-btn" data-q-now="${q.code}" title="Текущее время">◷</button></div>`;
    return `<article class="question ${error?'has-error':''}"><div class="question-main"><div class="question-code">${q.code}</div><div class="question-text"><strong>${esc(q.text)}</strong><small>${esc(S.QUESTION_HINTS[q.code]||'')}</small></div>${mainControl}${time}</div><div class="question-comment"><div></div><input class="input" data-q-comment="${q.code}" value="${attr(a.comment||'')}" placeholder="${a.status==='no'?'Комментарий обязателен при ответе «Нет»':'Комментарий ДП при необходимости'}"></div></article>`;
  }
  function renderChecklist() {
    const w=active(),item=sku(),step=w.ui.step;
    const applicableQs=S.QUESTIONS.filter(q=>q.step===step&&isApplicable(item,q));
    return `${pageHead('03 · Чек-лист',`Контроль · ${esc(item.name||`SKU ${w.ui.skuIndex+1}`)}`,'Статусы и время записываются непосредственно в 7-колоночный блок выбранного SKU. 8.0.1 и 8.0.2 — только Да/Нет, без времени.',`<button class="btn btn-ghost" data-action="copy-step">Скопировать шаг на остальные SKU</button>`)}
      ${skuToolbar(w)}
      <div class="step-strip">${S.STEP_GROUPS.map(st=>`<button class="step-pill ${st.id===step?'active':''} ${stepCompletion(item,st.id)?'complete':''}" data-step="${st.id}">${st.id}. ${esc(st.short)}</button>`).join('')}</div>
      <section class="panel"><header class="panel-head"><div><h2>${step}. ${esc(S.STEP_GROUPS.find(x=>x.id===step)?.title||'Шаг')}</h2><p>${applicableQs.length} контрольных пунктов для текущего SKU.</p></div><div class="page-actions"><button class="btn btn-ghost btn-small" data-action="fill-step-yes">Все «Да»</button></div></header><div class="panel-body question-list">${applicableQs.length?applicableQs.map(q=>renderQuestion(item,q)).join(''):'<div class="empty">Для этого SKU данный шаг не применяется. Включите соответствующий параметр на странице «Товары».</div>'}</div></section>`;
  }

  function massCard(label,key,value,sub='кг/шт') { return `<div class="mass-card"><label>${label}</label><input class="input" type="number" min="0" step="0.001" data-quality-field="${key}" value="${attr(value)}" placeholder="0"><small>${sub}</small></div>`; }
  function renderDefectRows(item) {
    if (!item.defects.length) return '<div class="empty">Дефекты не добавлены. Это корректно, если по факту их нет.</div>';
    return `<div class="defect-table">${item.defects.map((d,i)=>`<div class="defect-row"><div class="defect-index">${i+1}</div><input class="input" data-defect-field="type" data-defect="${i}" value="${attr(d.type||'')}" placeholder="Тип дефекта"><input class="input" data-defect-field="visual" data-defect="${i}" value="${attr(d.visual||'')}" placeholder="Визуальная оценка по камере"><input class="input" type="number" min="0" step="1" data-defect-field="count" data-defect="${i}" value="${attr(d.count??'')}" placeholder="Кол-во"><input class="input" data-defect-field="comment" data-defect="${i}" value="${attr(d.comment||'')}" placeholder="Комментарий ДП"><button class="defect-remove" data-action="remove-defect" data-defect="${i}">×</button></div>`).join('')}</div>`;
  }
  function renderQuality() {
    const w=active(),item=sku();
    const total=num(item.defectMass)+num(item.nonstandardMass)+num(item.debrisMass)+num(item.caliberMass), sample=num(item.sampleMass), conflict=sample>0&&total>sample+.00001;
    return `${pageHead('04 · Качество',`Показатели · ${esc(item.name||`SKU ${w.ui.skuIndex+1}`)}`,'Заполняются только исходные показатели V3. Проценты, счётчики ошибок и время рассчитывает сам Excel-шаблон.',`<button class="btn btn-ghost" data-action="add-defect" ${item.defects.length>=MAX_DEFECTS?'disabled':''}>+ Дефект</button>`)}
      ${skuToolbar(w)}
      <section class="panel"><header class="panel-head"><div><h2>Показатели товара</h2><p>Колонки L–R и X нового шаблона.</p></div></header><div class="panel-body">
        <div class="mass-grid">${massCard('ВПТ','vpt',item.vpt,'°C / значение')}${massCard('Масса выборки','sampleMass',item.sampleMass)}${massCard('Брак','defectMass',item.defectMass)}${massCard('Нестандарт','nonstandardMass',item.nonstandardMass)}${massCard('Осыпь / листья / капуста / земля','debrisMass',item.debrisMass)}${massCard('Некалибр','caliberMass',item.caliberMass)}${massCard('% брака по МПР','mprPercent',item.mprPercent,'%')}${item.requiresBrix?`<div class="mass-card"><label>Brix</label><input class="input" data-quality-field="brixValues" value="${attr(item.brixValues)}" placeholder="9.9\\8.9\\10.6"><small>значения через \\</small></div>`:''}</div>
        <div class="mass-summary"><div class="metric ${conflict?'bad':''}"><span>Категории всего</span><strong>${fmtNum(total)} кг</strong></div><div class="metric"><span>Брак</span><strong>${percent(item.defectMass,item.sampleMass).toFixed(2)}%</strong></div><div class="metric"><span>Нестандарт</span><strong>${percent(item.nonstandardMass,item.sampleMass).toFixed(2)}%</strong></div><div class="metric"><span>Некалибр</span><strong>${percent(item.caliberMass,item.sampleMass).toFixed(2)}%</strong></div><div class="metric"><span>Осыпь</span><strong>${percent(item.debrisMass,item.sampleMass).toFixed(2)}%</strong></div></div>
        ${conflict?'<div class="issue error" style="margin-top:10px">Сумма категорий превышает массу выборки.</div>':''}
      </div></section>
      <section class="panel"><header class="panel-head"><div><h2>Ошибки в АРМ ДП</h2><p>Колонки AA–AB.</p></div></header><div class="panel-body grid grid-2"><div class="field"><label>Были ошибки в АРМ ДП</label><select class="select" data-quality-field="apmError"><option value="no" ${item.apmError!=='yes'?'selected':''}>Нет</option><option value="yes" ${item.apmError==='yes'?'selected':''}>Да</option></select></div><div class="field"><label>Комментарий</label><input class="input" data-quality-field="comment" value="${attr(item.comment)}" placeholder="Комментарий по поставке / АРМ"></div></div></section>
      <section class="panel"><header class="panel-head"><div><h2>Мини-чек-лист оценки качества</h2><p>Ровно 6 строк Excel: тип дефекта → визуальная оценка → количество → комментарий.</p></div><button class="btn btn-primary btn-small" data-action="add-defect" ${item.defects.length>=MAX_DEFECTS?'disabled':''}>+ Добавить</button></header><div class="panel-body">${renderDefectRows(item)}</div></section>`;
  }

  function validationIssues(w) {
    const issues=[]; const sh=w.shipment;
    [['requestNumber','№ заявки'],['rc','РЦ'],['date','Дата'],['supplier','Поставщик'],['format','Формат'],['mokk','МОКК'],['dpId','ДП (ID)'],['connectionTime','Время подключения']].forEach(([k,l])=>{if(!hasValue(sh[k]))issues.push(`Приёмка: не заполнено «${l}».`)});
    w.skus.forEach((item,i)=>{
      if(!hasValue(item.code))issues.push(`SKU ${i+1}: нет кода товара.`); if(!hasValue(item.name))issues.push(`SKU ${i+1}: нет названия товара.`);
      ['vpt','sampleMass','defectMass','nonstandardMass','debrisMass','caliberMass','mprPercent'].forEach(k=>{if(!hasValue(item[k]))issues.push(`SKU ${i+1}: не заполнено поле «${k}».`)});
      if(item.requiresBrix&&!hasValue(item.brixValues))issues.push(`SKU ${i+1}: включён Brix, но значение не заполнено.`);
      if(num(item.sampleMass)>0 && num(item.defectMass)+num(item.nonstandardMass)+num(item.debrisMass)+num(item.caliberMass)>num(item.sampleMass)+.00001)issues.push(`SKU ${i+1}: сумма категорий больше массы выборки.`);
      S.QUESTIONS.forEach(q=>{
        if(!isApplicable(item,q))return; const a=item.checklist?.[q.code]||{};
        if(!qAnswered(item,q))issues.push(`SKU ${i+1}, ${q.code}: нет ответа.`);
        else if(a.status==='no'&&!String(a.comment||'').trim())issues.push(`SKU ${i+1}, ${q.code}: при «Нет» нужен комментарий.`);
        if(qAnswered(item,q)&&qNeedsTime(q,a)&&!a.time)issues.push(`SKU ${i+1}, ${q.code}: не указан тайм-код.`);
      });
    });
    if(!hasValue(sh.reportEnd))issues.push('Не указано окончание заполнения отчёта.');
    return issues;
  }
  function renderExport() {
    const w=active(),sh=w.shipment,issues=validationIssues(w),p=progress(w);
    return `${pageHead('05 · Выгрузка','Проверка и Excel V3','Файл создаётся из присланного мастер-шаблона. Листы, формулы и схема 5+5+2 сохраняются; сайт заполняет только исходные ячейки.',`<button class="btn btn-primary" data-action="export">Выгрузить V3</button>`)}
      <div class="review-grid"><section class="panel"><header class="panel-head"><div><h2>Сводка приёмки</h2><p>${w.skus.length} SKU · ${esc(sh.rc||'РЦ не выбран')}</p></div></header><div class="panel-body review-list">
        <div class="review-row"><span>№ заявки</span><strong>${esc(sh.requestNumber||'—')}</strong></div><div class="review-row"><span>Поставщик</span><strong>${esc(sh.supplier||'—')}</strong></div><div class="review-row"><span>МОКК</span><strong>${esc(sh.mokk||'—')}</strong></div><div class="review-row"><span>ДП (ID)</span><strong>${esc(sh.dpId||'—')}</strong></div><div class="review-row"><span>Чек-лист</span><strong>${p.checklist[0]} / ${p.checklist[1]}</strong></div>
        <div class="field"><label>Окончание приёмки / заполнения отчёта</label><div class="input-group"><input class="input" type="time" data-shipment="reportEnd" value="${attr(sh.reportEnd)}"><button class="btn btn-ghost" data-action="now-shipment" data-target="reportEnd">Сейчас</button></div><span class="hint">Выгружается в I75; итоговые длительности считает V3.</span></div>
      </div></section>
      <aside><div class="export-card"><span class="kicker" style="color:#ff8e92">Точный экспорт</span><h2 style="margin:7px 0 0">Новый V3 · 1:1</h2><p>Никакого старого template.xlsx, старых строк или конвертации структуры.</p><button class="btn btn-primary" data-action="export">Сформировать Excel</button><div class="export-map"><span>Товары<b>rows 5–16</b></span><span>Чек-лист<b>J…CI</b></span><span>Дефекты<b>66–71</b></span></div></div></aside></div>
      <section class="panel"><header class="panel-head"><div><h2>Контроль заполнения</h2><p>${issues.length?`Найдено замечаний: ${issues.length}`:'Критичных пропусков не найдено.'}</p></div></header><div class="panel-body">${issues.length?`<div class="issues">${issues.slice(0,40).map(x=>`<div class="issue">${esc(x)}</div>`).join('')}${issues.length>40?`<div class="issue">… ещё ${issues.length-40}</div>`:''}</div>`:'<div class="ok-box">✓ Чек-лист готов к выгрузке в новый V3.</div>'}</div></section>`;
  }

  function renderPage() {
    renderChrome(); const page=active().ui.page;
    content.innerHTML = page==='shipment'?renderShipment():page==='products'?renderProducts():page==='checklist'?renderChecklist():page==='quality'?renderQuality():renderExport();
  }

  function setPage(page) { if(!pages.some(p=>p[0]===page))return; active().ui.page=page; save(); renderPage(); window.scrollTo({top:0,behavior:'smooth'}); }
  function selectSku(index) { const w=active(); w.ui.skuIndex=Math.max(0,Math.min(Number(index)||0,w.skus.length-1)); save(); renderPage(); }

  function updateQuestionStatus(code,status) {
    const item=sku(),q=S.QUESTIONS.find(x=>x.code===code); if(!q)return;
    const a=item.checklist[code] ||= {};
    a.status = a.status===status ? '' : status;
    if (qNeedsTime(q,a) && a.status && !a.time) a.time=nowHHMM();
    if (!a.status) { a.time=''; if(!a.comment)a.comment=''; }
    save(); renderPage();
  }
  function updateQuestionValue(code,value,shouldRender=true) {
    const item=sku(),q=S.QUESTIONS.find(x=>x.code===code); const a=item.checklist[code] ||= {};
    a.value=value;
    if (hasValue(value) && qNeedsTime(q,a) && !a.time) a.time=nowHHMM();
    if (code==='7.4' && num(value)<=0) a.time='';
    save(); if(shouldRender) renderPage();
  }

  function copyStep() {
    const w=active(),source=sku(),step=w.ui.step,qs=S.QUESTIONS.filter(q=>q.step===step);
    w.skus.forEach((target,i)=>{if(i===w.ui.skuIndex)return; qs.forEach(q=>{if(isApplicable(target,q)&&isApplicable(source,q)&&source.checklist?.[q.code])target.checklist[q.code]={...source.checklist[q.code]};});});
    save(); toast('Шаг скопирован на остальные применимые SKU.','success'); renderPage();
  }
  function fillStepYes() {
    const w=active(),item=sku(),qs=S.QUESTIONS.filter(q=>q.step===w.ui.step&&isApplicable(item,q));
    qs.forEach(q=>{const a=item.checklist[q.code] ||= {}; if(q.type==='yesno'){a.status='yes'; if(qNeedsTime(q,a)&&!a.time)a.time=nowHHMM();} else if(!hasValue(a.value)){a.value='0'; if(qNeedsTime(q,a))a.time=nowHHMM();}});
    save(); renderPage();
  }

  async function exportExcel() {
    const w=active(),issues=validationIssues(w);
    if (issues.length && !confirm(`В чек-листе ${issues.length} замечаний. Всё равно сформировать Excel V3?`)) return;
    try {
      setBusy(true,'Формируем Excel V3','Проверяем мастер-шаблон v.05/01-PILOT.2…');
      const buffer=await window.DPV3_EXPORTER.exportBuffer(JSON.parse(JSON.stringify(w)),window.V3_TEMPLATE_BASE64);
      setBusy(true,'Excel V3 готов','Сохраняем файл без старой структуры…');
      const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      const safe=(w.shipment.requestNumber||'приемка').replace(/[^0-9a-zа-яё_-]+/gi,'_');
      a.href=url;a.download=`DP_V3_${safe}_${w.shipment.date||todayISO()}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
      toast('Новый Excel V3 сформирован.','success');
    } catch(e) { console.error(e); toast(`Ошибка выгрузки: ${e.message||e}`,'error'); }
    finally { setBusy(false); }
  }

  function normalizeHeader(v) { return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').replace(/[()]/g,'').trim(); }
  const IMPORT_HEADERS = {
    requestNumber:['№ заявки','номер заявки','заявка'],rc:['рц','распределительный центр'],date:['дата','дата проверки'],supplier:['поставщик'],
    code:['код товара','код sku','sku','код'],name:['название товара','наименование товара','товар'],format:['формат приемки','формат приёмки','формат'],
    vpt:['впт','температура','внутриплодная температура'],sampleMass:['м выборки кг/шт','масса выборки','м выборки'],defectMass:['м брака кг/шт','масса брака','м брака'],
    nonstandardMass:['нестандарт масса кг/шт','масса нестандарта','нестандарт'],debrisMass:['м осыпи/листьев/капусты/земли','масса осыпи','осыпь'],caliberMass:['м калибра','масса калибра','некалибр'],
    mprPercent:['% брака по мпр','брак по мпр'],brixValues:['brix','сахар brix'],apmError:['ошибки в арм дп указываем если были ошибки','ошибки в арм дп'],comment:['комментарий']
  };
  function plainCell(value) {
    if(value===null||value===undefined)return '';
    if(value instanceof Date)return value;
    if(typeof value==='object'){
      if('result' in value)return plainCell(value.result); if('text' in value)return value.text;
      if(Array.isArray(value.richText))return value.richText.map(x=>x.text).join('');
    }
    return value;
  }
  function dateToISO(v) {
    if(v instanceof Date)return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
    const s=String(v??'').trim(); const m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/); if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; return s.match(/^\d{4}-\d{2}-\d{2}$/)?s:'';
  }
  function findImportSheet(workbook) {
    let best=null;
    workbook.eachSheet(ws=>{
      const limit=Math.min(ws.rowCount||30,30);
      for(let r=1;r<=limit;r++){
        const row=ws.getRow(r),headers={}; let hits=0;
        row.eachCell({includeEmpty:false},(cell,col)=>{
          const h=normalizeHeader(plainCell(cell.value));
          for(const [key,variants] of Object.entries(IMPORT_HEADERS)) if(variants.some(v=>h===normalizeHeader(v))){if(!headers[key]){headers[key]=col;hits++;}}
        });
        if(!best||hits>best.hits)best={ws,row:r,headers,hits};
      }
    });
    return best&&best.hits>=3?best:null;
  }
  async function importExcel(file) {
    try {
      setBusy(true,'Импорт Excel','Ищем поля заявки и товарные позиции…');
      const wb=new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer()); const found=findImportSheet(wb);
      if(!found)throw new Error('Не удалось распознать таблицу: слишком мало знакомых заголовков.');
      const current=active(),targetReq=String(current.shipment.requestNumber||'').trim(); const records=[];
      for(let r=found.row+1;r<=found.ws.rowCount;r++){
        const row=found.ws.getRow(r),rec={}; Object.entries(found.headers).forEach(([k,c])=>rec[k]=plainCell(row.getCell(c).value));
        if(!String(rec.code||rec.name||'').trim())continue;
        if(targetReq&&found.headers.requestNumber&&String(rec.requestNumber||'').trim()!==targetReq)continue;
        records.push(rec); if(records.length>=MAX_SKU)break;
      }
      if(!records.length)throw new Error(targetReq?'По указанному № заявки строки не найдены.':'Товарные строки не найдены.');
      const first=records[0];
      if(!current.shipment.requestNumber&&first.requestNumber)current.shipment.requestNumber=String(first.requestNumber).trim();
      if(first.rc)current.shipment.rc=String(first.rc).replace(/^РЦ\s+/i,'').trim();
      if(first.date){const d=dateToISO(first.date);if(d)current.shipment.date=d;}
      if(first.supplier)current.shipment.supplier=String(first.supplier).trim();
      if(first.format)current.shipment.format=String(first.format).trim();
      // МОКК и ДП (ID) принципиально не импортируем: это ручные реквизиты текущей проверки.
      current.skus=records.map(rec=>{
        const x=defaultSku();
        ['code','name','vpt','sampleMass','defectMass','nonstandardMass','debrisMass','caliberMass','mprPercent','brixValues','comment'].forEach(k=>{if(hasValue(rec[k]))x[k]=String(rec[k]).trim();});
        if(hasValue(rec.apmError))x.apmError=/^(да|yes|1|true)$/i.test(String(rec.apmError).trim())?'yes':'no';
        if(hasValue(x.brixValues))x.requiresBrix=true;
        return x;
      });
      current.ui.skuIndex=0;save();renderPage();toast(`Импортировано SKU: ${current.skus.length}. МОКК и ДП оставлены для ручного ввода.`,'success');
    } catch(e) { console.error(e);toast(`Импорт: ${e.message||e}`,'error'); }
    finally { setBusy(false); importInput.value=''; }
  }

  document.addEventListener('click',e=>{
    const t=e.target.closest('button,[data-select-sku],[data-workspace]'); if(!t)return;
    if(t.dataset.workspace){rootState.activeId=t.dataset.workspace;save();renderPage();return;}
    if(t.dataset.page){setPage(t.dataset.page);return;}
    if(t.dataset.selectSku!==undefined){selectSku(t.dataset.selectSku);return;}
    if(t.dataset.step!==undefined){active().ui.step=Number(t.dataset.step);save();renderPage();return;}
    if(t.dataset.qStatus){updateQuestionStatus(t.dataset.qStatus,t.dataset.status);return;}
    if(t.dataset.qNow){const a=sku().checklist[t.dataset.qNow] ||= {};a.time=nowHHMM();save();renderPage();return;}
    const action=t.dataset.action;
    if(action==='add-workspace'){
      if(rootState.workspaces.length>=MAX_WORKSPACES)return toast('Одновременно доступно до 5 приёмок.','error');
      const w=defaultWorkspace(rootState.workspaces.length+1);rootState.workspaces.push(w);rootState.activeId=w.id;save();renderPage();return;
    }
    if(action==='add-sku'){
      const w=active();if(w.skus.length>=MAX_SKU)return toast('V3 рассчитан максимум на 12 SKU.','error');w.skus.push(defaultSku());w.ui.skuIndex=w.skus.length-1;save();renderPage();return;
    }
    if(action==='remove-sku'){
      const w=active(),i=Number(t.dataset.index);if(w.skus.length<=1)return;if(!confirm(`Удалить SKU ${i+1}?`))return;w.skus.splice(i,1);w.ui.skuIndex=Math.min(w.ui.skuIndex,w.skus.length-1);save();renderPage();return;
    }
    if(action==='import'){importInput.click();return;}
    if(action==='export'){exportExcel();return;}
    if(action==='now-shipment'){active().shipment[t.dataset.target]=nowHHMM();save();renderPage();return;}
    if(action==='copy-step'){copyStep();return;}
    if(action==='fill-step-yes'){fillStepYes();return;}
    if(action==='add-defect'){const item=sku();if(item.defects.length<MAX_DEFECTS){item.defects.push({type:'',visual:'',count:'',comment:''});save();renderPage();}return;}
    if(action==='remove-defect'){sku().defects.splice(Number(t.dataset.defect),1);save();renderPage();return;}
  });

  document.addEventListener('input',e=>{
    const el=e.target,w=active();
    if(el.dataset.shipment){w.shipment[el.dataset.shipment]=el.value;save();return;}
    if(el.dataset.skuField){w.skus[Number(el.dataset.index)][el.dataset.skuField]=el.value;save();return;}
    if(el.dataset.qValue){updateQuestionValue(el.dataset.qValue,el.value,false);return;}
    if(el.dataset.qTime){const a=sku().checklist[el.dataset.qTime] ||= {};a.time=el.value;save();return;}
    if(el.dataset.qComment){const a=sku().checklist[el.dataset.qComment] ||= {};a.comment=el.value;save();return;}
    if(el.dataset.qualityField){sku()[el.dataset.qualityField]=el.value;save();return;}
    if(el.dataset.defectField){const d=sku().defects[Number(el.dataset.defect)];if(d){d[el.dataset.defectField]=el.value;save();}return;}
  });
  document.addEventListener('change',e=>{
    const el=e.target,w=active();
    if(el.dataset.shipment){w.shipment[el.dataset.shipment]=el.value;save();renderChrome();return;}
    if(el.dataset.qValue){updateQuestionValue(el.dataset.qValue,el.value,true);return;}
    if(el.dataset.skuFeature){w.skus[Number(el.dataset.index)][el.dataset.skuFeature]=el.checked;save();renderPage();return;}
    if(el.dataset.qualityField){sku()[el.dataset.qualityField]=el.value;save();if(w.ui.page==='quality')renderPage();return;}
  });
  importInput.addEventListener('change',()=>{const f=importInput.files?.[0];if(f)importExcel(f);});

  // Intro
  const intro=$('#intro'),app=$('#app'),introConsent=$('#introConsent'),introEnter=$('#introEnter');
  if(localStorage.getItem(INTRO_KEY)==='1'){app.hidden=false;renderPage();}
  else {intro.hidden=false;introConsent.addEventListener('change',()=>introEnter.disabled=!introConsent.checked);introEnter.addEventListener('click',()=>{localStorage.setItem(INTRO_KEY,'1');intro.hidden=true;app.hidden=false;renderPage();});}
})();
