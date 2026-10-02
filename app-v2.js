(() => {
"use strict";

const KEYS={habits:"rotina-v1",settings:"rotina-settings-v1",profile:"rotina-profile-v1",notes:"rotina-notes-board-v1"};
const today=new Date();
let month=new Date(today.getFullYear(),today.getMonth(),1);
let selectedDate=new Date(today);
let selectedHabitId=null;
let editingHabitId=null;

const messages=[
 "Consistência não precisa ser perfeita. Só precisa continuar.",
 "Um pequeno passo hoje já conta para a pessoa que você quer se tornar.",
 "Você não precisa fazer tudo. Só precisa manter o que importa.",
 "Seu futuro é construído nas pequenas escolhas de hoje.",
 "Volte para o caminho. Recomeçar também faz parte."
];

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));

function read(key,fallback){
 try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}
}
function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
function getData(){return read(KEYS.habits,{habits:[]})}
function getSettings(){return read(KEYS.settings,{theme:"paper",motivation:true})}
function getProfile(){return read(KEYS.profile,{name:"Minha rotina",email:""})}
function key(date){return date.toISOString().slice(0,10)}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function normalize(h){
 return {
  ...h,
  frequency:h.frequency||"daily",
  days:Array.isArray(h.days)?h.days:[],
  weeklyTarget:Number(h.weeklyTarget)||3,
  category:h.category||"Rotina",
  time:h.time||"",
  goalValue:h.goalValue??"",
  goalUnit:h.goalUnit||"vez",
  completions:h.completions||{}
 };
}
function frequencyText(h){
 h=normalize(h);
 if(h.frequency==="specific"){
  return h.days.length ? "Dias: "+h.days.map(d=>["","Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][d]).join(", ") : "Dias específicos";
 }
 if(h.frequency==="weekly") return h.weeklyTarget+"x por semana";
 return "Todos os dias";
}
function goalText(h){
 h=normalize(h);
 return h.goalValue!=="" ? h.goalValue+" "+h.goalUnit : (h.goal||"Sem meta definida");
}
function scheduled(h,date){
 h=normalize(h);
 if(date>today) return false;
 if(h.frequency==="specific") return h.days.includes(date.getDay()||7);
 return true;
}
function streak(h){
 h=normalize(h);
 let count=0;
 let date=new Date(today);
 const created=new Date(h.createdAt||today);
 created.setHours(0,0,0,0);
 while(date>=created){
  if(scheduled(h,date)){
   if(h.completions[key(date)]) count++;
   else break;
  }
  date.setDate(date.getDate()-1);
 }
 return count;
}

function setModal(modal,open){
 if(modal) modal.hidden=!open;
}
function closeHabit(){
 editingHabitId=null;
 setModal($("#modalBackdrop"),false);
 if($("#habitForm")) $("#habitForm").reset();
 toggleFrequencyFields();
}
function closeProfile(){setModal($("#profileModalBackdrop"),false)}
function closeModals(){closeHabit();closeProfile()}

function openHabit(id=null){
 closeProfile();
 editingHabitId=id;
 const form=$("#habitForm");
 if(!form) return;
 form.reset();
 $("#habitModalLabel").textContent=id?"EDITAR HÁBITO":"NOVO HÁBITO";
 $("#habitModalTitle").textContent=id?"Ajuste seu hábito":"Que hábito você quer construir?";
 $("#habitSubmit").textContent=id?"Salvar alterações":"Criar hábito";
 $("#deleteHabitFromModal").style.display=id?"inline-block":"none";
 $("#habitFrequency").value="daily";
 toggleFrequencyFields();
 if(id){
  const raw=getData().habits.find(h=>h.id===id);
  if(!raw) return;
  const h=normalize(raw);
  $("#habitName").value=h.name;
  $("#habitIcon").value=h.icon||"☀️";
  $("#habitCategory").value=h.category;
  $("#habitTime").value=h.time;
  $("#habitGoalValue").value=h.goalValue;
  $("#habitGoalUnit").value=h.goalUnit;
  $("#habitFrequency").value=h.frequency;
  $("#weeklyTarget").value=h.weeklyTarget;
  $$("#specificDaysWrap input").forEach(x=>x.checked=h.days.includes(Number(x.value)));
  toggleFrequencyFields();
 }
 setModal($("#modalBackdrop"),true);
 $("#habitName")?.focus();
}

function openProfile(){
 closeHabit();
 const p=getProfile();
 $("#profileName").value=p.name==="Minha rotina"?"":p.name;
 $("#profileEmail").value=p.email||"";
 setModal($("#profileModalBackdrop"),true);
 $("#profileName")?.focus();
}

function toggleFrequencyFields(){
 const f=$("#habitFrequency")?.value;
 $("#specificDaysWrap")?.classList.toggle("show",f==="specific");
 $("#weeklyWrap")?.classList.toggle("show",f==="weekly");
}

function showView(view){
 closeModals();
 $$(".view").forEach(section=>section.classList.toggle("active-view",section.id===view+"View"));
 $$(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.view===view));
 const titles={today:"Sua rotina de hoje",calendar:"Seu calendário",habits:"Seus hábitos",evolution:"Evolução do hábito",notes:"Notas da sua rotina",settings:"Configurações",account:"Sua conta"};
 $("#pageTitle").textContent=titles[view]||"Rotina";
 $("#addHabitButton").style.display=["today","calendar","habits"].includes(view)?"inline-flex":"none";
 renderAll();
}

function renderToday(){
 const d=getData(),todayKey=key(today);
 const list=d.habits.map(normalize).filter(h=>scheduled(h,today));
 const done=list.filter(h=>h.completions[todayKey]).length;
 const total=list.length;
 const percent=total?Math.round(done/total*100):0;
 $("#greeting").textContent=today.getHours()<12?"BOM DIA":today.getHours()<18?"BOA TARDE":"BOA NOITE";
 $("#todayDate").textContent=today.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});
 $("#dailyMessage").textContent=getSettings().motivation?messages[today.getDate()%messages.length]:"Sua rotina de hoje está aqui. Um hábito de cada vez.";
 $("#habitCount").textContent=total+" "+(total===1?"hábito":"hábitos");
 $("#progressPercent").textContent=percent+"%";
 $("#progressRing").style.setProperty("--progress",percent+"%");
 const box=$("#habitList");
 box.innerHTML="";
 $("#emptyState").classList.toggle("hidden",!!list.length);
 list.forEach(h=>{
  const e=document.createElement("article");
  const doneToday=!!h.completions[todayKey];
  e.className="habit-card";
  e.innerHTML=`<div class="habit-icon">${esc(h.icon)}</div><div class="habit-info"><strong>${esc(h.name)}</strong><span>${esc(goalText(h))} · <span class="streak">🔥 ${streak(h)} dias</span></span></div><button class="check ${doneToday?"done":""}" type="button" data-action="toggle-today" data-id="${esc(h.id)}">${doneToday?"✓":"○"}</button>`;
  box.appendChild(e);
 });
}

function renderHabits(){
 const d=getData(),box=$("#allHabits");
 box.innerHTML="";
 $("#emptyHabits").classList.toggle("hidden",!!d.habits.length);
 d.habits.map(normalize).forEach(h=>{
  const e=document.createElement("div");
  e.className="habit-overview";
  e.innerHTML=`<main><div class="habit-icon">${esc(h.icon)}</div><div><strong>${esc(h.name)}</strong><div class="mini-label">🔥 ${streak(h)} DIAS DE SEQUÊNCIA</div><span class="frequency-badge">${esc(h.category)} · ${esc(frequencyText(h))}</span></div></main><div class="habit-actions"><button class="evolution-button" type="button" data-action="evolution" data-id="${esc(h.id)}">Evolução ↗</button><button class="edit-button" type="button" data-action="edit-habit" data-id="${esc(h.id)}">Editar</button><button class="delete-button" type="button" data-action="delete-habit" data-id="${esc(h.id)}">Excluir</button></div>`;
  box.appendChild(e);
 });
}

function renderCalendar(){
 const y=month.getFullYear(),m=month.getMonth();
 const first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7,d=getData();
 $("#calendarMonthTitle").textContent=month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
 const grid=document.createElement("div");grid.className="calendar-grid";
 ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].forEach(day=>{
  const cell=document.createElement("div");cell.className="weekday";cell.textContent=day;grid.appendChild(cell);
 });
 for(let i=0;i<start;i++)grid.appendChild(document.createElement("div"));
 for(let n=1;n<=last.getDate();n++){
  const date=new Date(y,m,n),k=key(date),button=document.createElement("button");
  const done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length;
  button.type="button";
  button.className="calendar-day-btn"+(k===key(today)?" today":"")+(k===key(selectedDate)?" selected":"");
  button.innerHTML=`<div class="day-number">${n}</div><div class="day-dots">${d.habits.map(h=>`<span class="dot ${h.completions?.[k]?"done":""}"></span>`).join("")}</div>`;
  button.title=total?done+" de "+total+" hábitos concluídos":"Nenhum hábito";
  button.addEventListener("click",()=>{selectedDate=new Date(date);renderCalendar();renderSelectedDay()});
  grid.appendChild(button);
 }
 $("#calendar").replaceChildren(grid);
 renderSelectedDay();
}
function renderSelectedDay(){
 const d=getData(),k=key(selectedDate),done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length,p=total?Math.round(done/total*100):0;
 $("#selectedDateTitle").textContent=selectedDate.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 $("#selectedProgress").textContent=`${p}% • ${done}/${total}`;
 const box=$("#selectedDayHabits");box.innerHTML="";
 if(!total){box.innerHTML='<div class="no-habits-day">Você ainda não criou hábitos.</div>';return}
 d.habits.map(normalize).forEach(h=>{
  const yes=!!h.completions[k],e=document.createElement("div");e.className="selected-habit";
  e.innerHTML=`<div class="selected-habit-main"><div class="habit-icon">${esc(h.icon)}</div><div><div class="selected-habit-name">${esc(h.name)}</div><div class="mini-label" style="margin-top:3px">${esc(goalText(h))}</div></div></div><button class="check ${yes?"done":""}" data-action="toggle-date" data-id="${esc(h.id)}" data-date="${k}" type="button">${yes?"✓":"○"}</button>`;
  box.appendChild(e);
 });
}

function toggleHabit(id,dateKey){
 const d=getData(),h=d.habits.find(x=>x.id===id);
 if(!h)return;
 h.completions=h.completions||{};
 h.completions[dateKey]=!h.completions[dateKey];
 if(!h.completions[dateKey])delete h.completions[dateKey];
 write(KEYS.habits,d);
 renderAll();
}

function stats(h){
 h=normalize(h);
 const completed=Object.keys(h.completions).filter(k=>h.completions[k]).sort();
 let total=completed.length,current=0,best=0;
 if(h.frequency==="weekly"){
  const weekStart=d=>{const x=new Date(d),dow=x.getDay()||7;x.setDate(x.getDate()-dow+1);return key(x)};
  const counts={};
  completed.forEach(k=>{const p=k.split("-").map(Number),wk=weekStart(new Date(p[0],p[1]-1,p[2]));counts[wk]=(counts[wk]||0)+1});
  let cursor=new Date(today);
  while((counts[weekStart(cursor)]||0)>=h.weeklyTarget){current++;cursor.setDate(cursor.getDate()-7)}
  let run=0,previous=null;
  Object.keys(counts).sort().forEach(wk=>{if(counts[wk]>=h.weeklyTarget){const p=wk.split("-").map(Number),dt=new Date(p[0],p[1]-1,p[2]);if(previous&&Math.round((dt-previous)/86400000)===7)run++;else run=1;best=Math.max(best,run);previous=dt}else{run=0;previous=null}});
 }else{
  let d=new Date(today),created=new Date(h.createdAt||today);created.setHours(0,0,0,0);
  while(d>=created){if(scheduled(h,d)){if(h.completions[key(d)])current++;else break}d.setDate(d.getDate()-1)}
  let run=0;
  for(let d=new Date(created);d<=today;d.setDate(d.getDate()+1)){if(scheduled(h,d)){if(h.completions[key(d)])run++;else run=0;best=Math.max(best,run)}}
 }
 let expected=0,done30=0;
 for(let i=0;i<30;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(scheduled(h,d)){expected++;if(h.completions[key(d)])done30++}}
 if(h.frequency==="weekly")expected=h.weeklyTarget*Math.ceil(30/7);
 return {total,current,best,expected,done30,rate:Math.min(100,Math.round(done30/Math.max(1,expected)*100))};
}

function renderEvolution(){
 const d=getData(),raw=d.habits.find(h=>h.id===selectedHabitId)||d.habits[0],empty=$("#evolutionEmpty"),content=$("#evolutionContent");
 if(!raw){empty.classList.remove("hidden");content.classList.add("hidden");$("#evolutionTitle").textContent="Selecione um hábito";return}
 const h=normalize(raw);selectedHabitId=h.id;
 empty.classList.add("hidden");content.classList.remove("hidden");
 const s=stats(h);
 $("#evolutionTitle").textContent=h.name;$("#evolutionName").textContent=h.name;$("#evolutionIcon").textContent=h.icon;$("#evolutionCategory").textContent=h.category.toUpperCase();
 $("#evolutionSchedule").textContent=[frequencyText(h),h.time?"às "+h.time:"",goalText(h)].filter(Boolean).join(" · ");
 $("#statStreak").textContent=s.current;$("#statBest").textContent=s.best;$("#statRate").textContent=s.rate+"%";$("#statTotal").textContent=s.total;
 const heat=$("#heatmap");heat.innerHTML="";
 for(let i=29;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const done=!!h.completions[key(d)],cell=document.createElement("div");cell.className="heat-cell"+(scheduled(h,d)?" scheduled":"")+(done?" done":"");cell.dataset.tip=d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" · "+(done?"concluído":"não concluído");heat.appendChild(cell)}
 const rows=[["Frequência",frequencyText(h)],["Horário",h.time||"Sem horário"],["Meta",goalText(h)],["Categoria",h.category],["Últimos 30 dias",s.done30+" realizados de "+s.expected+" esperados"],["Criado em",h.createdAt?new Date(h.createdAt).toLocaleDateString("pt-BR"):"—"]];
 $("#evolutionDetails").innerHTML=rows.map(r=>`<div class="detail-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></div>`).join("");
}

function renderNotes(){
 const items=read(KEYS.notes,[]),canvas=$("#notesCanvas");
 canvas.querySelectorAll(".note-card").forEach(x=>x.remove());
 $("#canvasEmpty").classList.toggle("hidden",items.length>0);
 $("#notesDate").textContent=today.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});
 items.forEach(addNoteCard);
}
function saveNotes(items){write(KEYS.notes,items)}
function addNoteCard(note){
 const card=document.createElement("article");card.className="note-card "+note.color;card.dataset.id=note.id;card.style.left=note.x+"px";card.style.top=note.y+"px";
 card.innerHTML=`<span class="note-pin"></span><button class="note-delete" title="Excluir" data-action="delete-note">×</button><textarea maxlength="500" placeholder="Escreva uma ideia...">${esc(note.text)}</textarea>`;
 $("#notesCanvas").appendChild(card);
 card.querySelector("textarea").addEventListener("input",e=>{const b=read(KEYS.notes,[]),n=b.find(x=>x.id===note.id);if(n){n.text=e.target.value;saveNotes(b);$("#notesStatus").textContent="Salvo agora";clearTimeout(window.noteTimer);window.noteTimer=setTimeout(()=>$("#notesStatus").textContent="Salvo automaticamente",700)}});
 let dragging=false,dx=0,dy=0;
 card.addEventListener("pointerdown",e=>{if(e.target.tagName==="TEXTAREA"||e.target.closest(".note-delete"))return;dragging=true;dx=e.clientX-card.offsetLeft;dy=e.clientY-card.offsetTop;card.setPointerCapture?.(e.pointerId)});
 card.addEventListener("pointermove",e=>{if(!dragging)return;const rect=$("#notesCanvas").getBoundingClientRect();card.style.left=Math.max(5,Math.min(e.clientX-rect.left-dx,rect.width-card.offsetWidth-5))+"px";card.style.top=Math.max(5,Math.min(e.clientY-rect.top-dy,rect.height-card.offsetHeight-5))+"px"});
 card.addEventListener("pointerup",()=>{if(!dragging)return;dragging=false;const b=read(KEYS.notes,[]),n=b.find(x=>x.id===note.id);if(n){n.x=parseInt(card.style.left,10);n.y=parseInt(card.style.top,10);saveNotes(b)}});
}
function addNote(){
 const b=read(KEYS.notes,[]),colors=["yellow","peach","green","blue"],index=b.length;
 const note={id:Date.now().toString(),text:"",color:colors[index%colors.length],x:55+(index%5)*38,y:55+(index%4)*35};
 b.push(note);saveNotes(b);renderNotes();
 setTimeout(()=>$("#notesCanvas .note-card:last-child textarea")?.focus(),0);
}

function renderSettings(){
 const s=getSettings();$("#themeSelect").value=s.theme;$("#motivationToggle").checked=s.motivation;applyTheme(s.theme);
}
function renderProfile(){
 const p=getProfile();$("#profileNameText").textContent=p.name||"Minha rotina";$("#profileEmailText").textContent=p.email||"Perfil local";$("#avatar").textContent=(p.name||"R").trim().charAt(0).toUpperCase();
}
function applyTheme(theme){document.body.classList.remove("theme-night","theme-sage");if(theme==="night")document.body.classList.add("theme-night");if(theme==="sage")document.body.classList.add("theme-sage")}
function renderAll(){renderToday();renderHabits();renderNotes();renderSettings();renderProfile();if($("#calendarView").classList.contains("active-view"))renderCalendar();if($("#evolutionView").classList.contains("active-view"))renderEvolution()}

function prevMonth(){month.setMonth(month.getMonth()-1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()}
function nextMonth(){month.setMonth(month.getMonth()+1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()}
function clearNotes(){if(confirm("Limpar todas as notas do quadro?")){localStorage.removeItem(KEYS.notes);renderNotes()}}
function clearLocal(){if(confirm("Isso apagará hábitos, progresso, notas, perfil e configurações deste navegador. Continuar?")){Object.values(KEYS).forEach(k=>localStorage.removeItem(k));selectedHabitId=null;showView("today")}}

function bind(){
 $$(".nav-item").forEach(n=>n.addEventListener("click",()=>showView(n.dataset.view)));
 $("#habitFrequency")?.addEventListener("change",toggleFrequencyFields);
 $("#habitForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const d=getData(),name=$("#habitName").value.trim(),frequency=$("#habitFrequency").value,days=$$("#specificDaysWrap input:checked").map(x=>Number(x.value));
  if(!name)return;
  if(frequency==="specific"&&!days.length){alert("Escolha pelo menos um dia da semana.");return}
  const base={name,icon:$("#habitIcon").value,category:$("#habitCategory").value.trim()||"Rotina",time:$("#habitTime").value,goalValue:$("#habitGoalValue").value,goalUnit:$("#habitGoalUnit").value,goal:$("#habitGoalValue").value?$("#habitGoalValue").value+" "+$("#habitGoalUnit").value:"",frequency,days,weeklyTarget:Number($("#weeklyTarget").value)||3};
  if(editingHabitId){const h=d.habits.find(x=>x.id===editingHabitId);if(h)Object.assign(h,base)}else d.habits.push({id:Date.now().toString(),...base,createdAt:new Date().toISOString(),completions:{}});
  write(KEYS.habits,d);closeHabit();renderAll();
 });
 $("#profileForm")?.addEventListener("submit",e=>{e.preventDefault();write(KEYS.profile,{name:$("#profileName").value.trim()||"Minha rotina",email:$("#profileEmail").value.trim()});closeProfile();renderProfile()});
 $("#deleteHabitFromModal")?.addEventListener("click",()=>{if(!editingHabitId)return;if(confirm("Excluir este hábito e todo o histórico?")){const d=getData();d.habits=d.habits.filter(x=>x.id!==editingHabitId);write(KEYS.habits,d);closeHabit();renderAll()}});
 $("#themeSelect")?.addEventListener("change",e=>{const s=getSettings();s.theme=e.target.value;write(KEYS.settings,s);applyTheme(s.theme)});
 $("#motivationToggle")?.addEventListener("change",e=>{const s=getSettings();s.motivation=e.target.checked;write(KEYS.settings,s);renderToday()});
 $("#notesCanvas")?.addEventListener("click",e=>{const action=e.target.closest("[data-action]")?.dataset.action;if(action==="delete-note"){const id=e.target.closest(".note-card").dataset.id;saveNotes(read(KEYS.notes,[]).filter(n=>n.id!==id));renderNotes()}});
 document.addEventListener("click",e=>{
  const el=e.target.closest("[data-action]");
  if(!el)return;
  const action=el.dataset.action,id=el.dataset.id;
  if(action==="toggle-today")toggleHabit(id,key(today));
  else if(action==="toggle-date")toggleHabit(id,el.dataset.date);
  else if(action==="select-day"){const p=el.dataset.date.split("-").map(Number);selectedDate=new Date(p[0],p[1]-1,p[2]);renderCalendar()}
  else if(action==="edit-habit")openHabit(id);
  else if(action==="evolution"){selectedHabitId=id;showView("evolution")}
  else if(action==="delete-habit"){if(confirm("Excluir este hábito e todo o histórico?")){const d=getData();d.habits=d.habits.filter(x=>x.id!==id);write(KEYS.habits,d);if(selectedHabitId===id)selectedHabitId=null;renderAll()}}
 });
 window.openHabit=openHabit;window.closeHabit=closeHabit;window.openProfile=openProfile;window.closeProfile=closeProfile;window.showView=showView;window.prevMonth=prevMonth;window.nextMonth=nextMonth;window.addNote=addNote;window.clearNotes=clearNotes;window.clearLocal=clearLocal;
}
function init(){bind();applyTheme(getSettings().theme);showView("today")}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();