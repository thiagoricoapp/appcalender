const KEY="rotina-v1", SETTINGS="rotina-settings-v1", PROFILE="rotina-profile-v1", NOTES="rotina-notes-v1";
const today=new Date(); let month=new Date(today.getFullYear(),today.getMonth(),1); let selectedDate=new Date(today); let selectedHabitId=null; let editingHabitId=null;
const msgs=["Consistência não precisa ser perfeita. Só precisa continuar.","Um pequeno passo hoje já conta para a pessoa que você quer se tornar.","Você não precisa fazer tudo. Só precisa manter o que importa.","Seu futuro é construído nas pequenas escolhas de hoje.","Volte para o caminho. Recomeçar também faz parte."];
const $=s=>document.querySelector(s);
const data=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{habits:[]}}catch{return{habits:[]}}};
const getSettings=()=>{try{return JSON.parse(localStorage.getItem(SETTINGS))||{theme:"paper",motivation:true}}catch{return{theme:"paper",motivation:true}}};
const getProfile=()=>{try{return JSON.parse(localStorage.getItem(PROFILE))||{name:"Minha rotina",email:""}}catch{return{name:"Minha rotina",email:""}}};
const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function streak(h){let n=0,d=new Date(today);while(h.completions?.[key(d)]){n++;d.setDate(d.getDate()-1)}return n}
function renderToday(){let d=data(),k=key(today),done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length,p=total?Math.round(done/total*100):0;$("#greeting").textContent=today.getHours()<12?"BOM DIA":today.getHours()<18?"BOA TARDE":"BOA NOITE";$("#todayDate").textContent=today.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});const s=getSettings();$("#dailyMessage").textContent=s.motivation?msgs[today.getDate()%msgs.length]:"Sua rotina de hoje está aqui. Um hábito de cada vez.";$("#habitCount").textContent=total+" "+(total===1?"hábito":"hábitos");$("#progressPercent").textContent=p+"%";$("#progressRing").style.setProperty("--progress",p+"%");let box=$("#habitList");box.innerHTML="";$("#emptyState").classList.toggle("hidden",!!total);d.habits.forEach(h=>{let e=document.createElement("article");e.className="habit-card";let yes=!!h.completions?.[k];e.innerHTML=`<div class="habit-icon">${h.icon}</div><div class="habit-info"><strong>${esc(h.name)}</strong><span>${esc(h.goal||"Todos os dias")} · <span class="streak">🔥 ${streak(h)} dias</span></span></div><button class="check ${yes?"done":""}">${yes?"✓":"○"}</button>`;e.querySelector(".check").onclick=()=>toggle(h.id);box.appendChild(e)})}
function toggle(id){let d=data(),h=d.habits.find(x=>x.id===id),k=key(today);if(!h)return;h.completions=h.completions||{};h.completions[k]=!h.completions[k];if(!h.completions[k])delete h.completions[k];save(d);renderAll()}
function normalizedHabit(h){return {...h,frequency:h.frequency||"daily",days:Array.isArray(h.days)?h.days:[],weeklyTarget:Number(h.weeklyTarget)||3,category:h.category||"Rotina",time:h.time||"",goalValue:h.goalValue??"",goalUnit:h.goalUnit||"vez"}}
function frequencyText(h){h=normalizedHabit(h);if(h.frequency==="specific")return h.days.length?`Dias: ${h.days.map(d=>["","Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][d]).join(", ")}`:"Dias específicos";if(h.frequency==="weekly")return `${h.weeklyTarget}x por semana`;return "Todos os dias"}
function isScheduled(h,date){h=normalizedHabit(h);if(date>today)return false;if(h.frequency==="specific"){let day=date.getDay()||7;return h.days.includes(day)}return true}
function goalText(h){h=normalizedHabit(h);if(h.goalValue!==""&&h.goalValue!==null)return `${h.goalValue} ${h.goalUnit}`;return h.goal||"Sem meta definida"}
function renderHabits(){
 let d=data(),b=$("#allHabits");b.innerHTML="";$("#emptyHabits").classList.toggle("hidden",!!d.habits.length);
 d.habits.forEach(raw=>{let h=normalizedHabit(raw),e=document.createElement("div");e.className="habit-overview";
 e.innerHTML=`<main><div class="habit-icon">${h.icon}</div><div><strong>${esc(h.name)}</strong><div class="mini-label">🔥 ${streak(h)} DIAS DE SEQUÊNCIA</div><span class="frequency-badge">${esc(h.category)} · ${esc(frequencyText(h))}</span></div></main><div class="habit-actions"><button class="evolution-button" type="button">Evolução ↗</button><button class="edit-button" type="button">Editar</button><button class="delete-button" type="button">Excluir</button></div>`;
 e.querySelector(".evolution-button").onclick=()=>{selectedHabitId=h.id;view("evolution")};
 e.querySelector(".edit-button").onclick=()=>openHabit(h.id);
 e.querySelector(".delete-button").onclick=()=>{if(confirm("Excluir este hábito e seu histórico?")){d.habits=d.habits.filter(x=>x.id!==h.id);if(selectedHabitId===h.id)selectedHabitId=null;save(d);renderAll()}};
 b.appendChild(e)
 })
}
function renderCalendar(){
 let y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7,d=data();
 $("#calendarMonthTitle").textContent=month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
 let g=document.createElement("div");g.className="calendar-grid";
 ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].forEach(x=>{let e=document.createElement("div");e.className="weekday";e.textContent=x;g.appendChild(e)});
 for(let i=0;i<start;i++)g.appendChild(document.createElement("div"));
 for(let n=1;n<=last.getDate();n++){
  let dt=new Date(y,m,n),k=key(dt),e=document.createElement("button");
  e.type="button";e.className="calendar-day-btn"+(k===key(today)?" today":"")+(k===key(selectedDate)?" selected":"");
  let done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length;
  e.innerHTML=`<div class="day-number">${n}</div><div class="day-dots">${d.habits.map(h=>`<span class="dot ${h.completions?.[k]?"done":""}"></span>`).join("")}</div>`;
  e.title=total?`${done} de ${total} hábitos concluídos`:"Nenhum hábito";
  e.onclick=()=>{selectedDate=new Date(dt);renderCalendar();renderSelectedDay()};
  g.appendChild(e)
 }
 $("#calendar").innerHTML="";$("#calendar").appendChild(g);renderSelectedDay()
}
function renderSelectedDay(){
 let d=data(),k=key(selectedDate),done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length,p=total?Math.round(done/total*100):0;
 $("#selectedDateTitle").textContent=selectedDate.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 $("#selectedProgress").textContent=`${p}% • ${done}/${total}`;
 let box=$("#selectedDayHabits");box.innerHTML="";
 if(!total){box.innerHTML='<div class="no-habits-day">Você ainda não criou hábitos.</div>';return}
 d.habits.forEach(h=>{let e=document.createElement("div");e.className="selected-habit";let yes=!!h.completions?.[k];e.innerHTML=`<div class="selected-habit-main"><div class="habit-icon">${h.icon}</div><div><div class="selected-habit-name">${esc(h.name)}</div><div class="mini-label" style="margin-top:3px">${esc(h.goal||"Todos os dias")}</div></div></div><button class="check ${yes?"done":""}" type="button">${yes?"✓":"○"}</button>`;e.querySelector(".check").onclick=()=>toggleOnDate(h.id,k);box.appendChild(e)})
}
function toggleOnDate(id,k){let d=data(),h=d.habits.find(x=>x.id===id);if(!h)return;h.completions=h.completions||{};h.completions[k]=!h.completions[k];if(!h.completions[k])delete h.completions[k];save(d);renderCalendar()}
function calcStats(h){
 h=normalizedHabit(h);let completed=Object.keys(h.completions||{}).filter(k=>h.completions[k]).sort(),total=completed.length;
 let current=0,d=new Date(today);
 if(h.frequency==="weekly"){
  let cursor=new Date(today);
  while(true){let start=new Date(cursor),day=start.getDay()||7;start.setDate(start.getDate()-day+1);let end=new Date(start);end.setDate(end.getDate()+6);let count=Object.keys(h.completions||{}).filter(k=>h.completions[k]).filter(k=>{let p=k.split("-").map(Number),dt=new Date(p[0],p[1]-1,p[2]);return dt>=start&&dt<=end}).length;if(count>=h.weeklyTarget){current++;cursor=new Date(start);cursor.setDate(cursor.getDate()-1)}else break}
 }else{while(d>=new Date(h.createdAt||today)){if(isScheduled(h,d)){if(h.completions?.[key(d)])current++;else break}d.setDate(d.getDate()-1)}}
 let best=0,run=0,prev=null;
 completed.forEach(k=>{let p=k.split("-").map(Number),dt=new Date(p[0],p[1]-1,p[2]);if(prev){let delta=Math.round((dt-prev)/86400000);if(delta===1)run++;else run=1}else run=1;best=Math.max(best,run);prev=dt});
 let scheduled=0,done30=0;
 for(let i=0;i<30;i++){let dt=new Date(today);dt.setDate(dt.getDate()-i);if(isScheduled(h,dt)){scheduled++;if(h.completions?.[key(dt)])done30++}}
 let rate=h.frequency==="weekly"?Math.min(100,Math.round((done30/Math.max(1,h.weeklyTarget*Math.ceil(30/7)))*100)):Math.round(done30/Math.max(1,scheduled)*100);
 return {total,current,best,rate,done30,scheduled}
}
function renderEvolution(){
 let d=data(),h=normalizedHabit(d.habits.find(x=>x.id===selectedHabitId)||d.habits[0]),empty=$("#evolutionEmpty"),content=$("#evolutionContent");
 if(!h){empty.classList.remove("hidden");content.classList.add("hidden");$("#evolutionTitle").textContent="Selecione um hábito";return}
 selectedHabitId=h.id;empty.classList.add("hidden");content.classList.remove("hidden");
 let st=calcStats(h);$("#evolutionTitle").textContent=h.name;$("#evolutionName").textContent=h.name;$("#evolutionIcon").textContent=h.icon;$("#evolutionCategory").textContent=(h.category||"Rotina").toUpperCase();$("#evolutionSchedule").textContent=[frequencyText(h),h.time?"às "+h.time:"",goalText(h)].filter(Boolean).join(" · ");$("#statStreak").textContent=st.current;$("#statBest").textContent=st.best;$("#statRate").textContent=st.rate+"%";$("#statTotal").textContent=st.total;
 let heat=$("#heatmap");heat.innerHTML="";for(let i=29;i>=0;i--){let dt=new Date(today);dt.setDate(dt.getDate()-i),done=!!h.completions?.[key(dt)],cell=document.createElement("div");cell.className="heat-cell"+(isScheduled(h,dt)?" scheduled":"")+(done?" done":"");cell.dataset.tip=dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" · "+(done?"concluído":"não concluído");heat.appendChild(cell)}
 let rows=[["Frequência",frequencyText(h)],["Horário",h.time||"Sem horário"],["Meta",goalText(h)],["Categoria",h.category||"Rotina"],["Últimos 30 dias",st.done30+" realizados de "+st.scheduled+" previstos"],["Criado em",h.createdAt?new Date(h.createdAt).toLocaleDateString("pt-BR"):"—"]];$("#evolutionDetails").innerHTML=rows.map(r=>`<div class="detail-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></div>`).join("")
}
const NOTES_DATA="rotina-notes-board-v1";
function getBoard(){try{return JSON.parse(localStorage.getItem(NOTES_DATA))||[]}catch{return[]}}
function saveBoard(items){localStorage.setItem(NOTES_DATA,JSON.stringify(items))}
function renderNotes(){
 const board=getBoard(),canvas=$("#notesCanvas");canvas.querySelectorAll(".note-card").forEach(x=>x.remove());
 $("#canvasEmpty").classList.toggle("hidden",board.length>0);
 $("#notesDate").textContent=today.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});
 board.forEach(n=>mountNote(n));
}
function mountNote(note){
 const card=document.createElement("article");card.className="note-card "+note.color;card.dataset.id=note.id;
 card.style.left=note.x+"px";card.style.top=note.y+"px";
 card.innerHTML=`<span class="note-pin"></span><button class="note-delete" title="Excluir">×</button><textarea maxlength="500" placeholder="Escreva uma ideia...">${esc(note.text)}</textarea>`;
 $("#notesCanvas").appendChild(card);
 card.querySelector(".note-delete").onclick=()=>{saveBoard(getBoard().filter(x=>x.id!==note.id));renderNotes()};
 card.querySelector("textarea").addEventListener("input",e=>{let all=getBoard(),item=all.find(x=>x.id===note.id);if(item){item.text=e.target.value;saveBoard(all);$("#notesStatus").textContent="Salvo agora";clearTimeout(window.boardTimer);window.boardTimer=setTimeout(()=>$("#notesStatus").textContent="Salvo automaticamente",700)}});
 let dragging=false,dx=0,dy=0;
 const down=e=>{if(e.target.tagName==="TEXTAREA"||e.target.closest(".note-delete"))return;dragging=true;card.setPointerCapture?.(e.pointerId);dx=e.clientX-card.offsetLeft;dy=e.clientY-card.offsetTop};
 const move=e=>{if(!dragging)return;let rect=$("#notesCanvas").getBoundingClientRect(),x=Math.max(6,Math.min(e.clientX-rect.left-dx,rect.width-card.offsetWidth-6)),y=Math.max(6,Math.min(e.clientY-rect.top-dy,rect.height-card.offsetHeight-6));card.style.left=x+"px";card.style.top=y+"px"};
 const up=()=>{if(!dragging)return;dragging=false;let all=getBoard(),item=all.find(x=>x.id===note.id);if(item){item.x=parseInt(card.style.left);item.y=parseInt(card.style.top);saveBoard(all)}};
 card.addEventListener("pointerdown",down);card.addEventListener("pointermove",move);card.addEventListener("pointerup",up);card.addEventListener("pointercancel",up);
}
function addNote(){
 const canvas=$("#notesCanvas"),colors=["yellow","peach","green","blue"],board=getBoard(),offset=(board.length%4)*22;
 const note={id:Date.now().toString(),text:"",color:colors[board.length%colors.length],x:50+offset+(board.length%5)*38,y:55+offset+(board.length%4)*35};
 board.push(note);saveBoard(board);renderNotes();setTimeout(()=>{const card=canvas.querySelector(`.note-card[data-id="${note.id}"] textarea`);card?.focus()},0)
}
function renderSettings(){let s=getSettings();$("#themeSelect").value=s.theme;$("#motivationToggle").checked=s.motivation;applyTheme(s.theme)}
function renderProfile(){let p=getProfile();$("#profileNameText").textContent=p.name||"Minha rotina";$("#profileEmailText").textContent=p.email||"Perfil local";$("#avatar").textContent=(p.name||"R").trim().charAt(0).toUpperCase()}
function applyTheme(theme){document.body.classList.remove("theme-night","theme-sage");if(theme==="night")document.body.classList.add("theme-night");if(theme==="sage")document.body.classList.add("theme-sage")}
function renderAll(){renderToday();renderHabits();renderNotes();renderSettings();renderProfile();if($("#calendarView").classList.contains("active-view"))renderCalendar();if($("#evolutionView").classList.contains("active-view"))renderEvolution()}
function view(v){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active-view"));$("#"+v+"View").classList.add("active-view");document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));$("#pageTitle").textContent={today:"Sua rotina de hoje",calendar:"Seu calendário",habits:"Seus hábitos",evolution:"Evolução do hábito",notes:"Notas da sua rotina",settings:"Configurações",account:"Sua conta"}[v];$("#addHabitButton").style.display=["today","calendar","habits"].includes(v)?"inline-flex":"none";renderAll()}
function toggleFrequencyFields(){let f=$("#habitFrequency").value;$("#specificDaysWrap").classList.toggle("show",f==="specific");$("#weeklyWrap").classList.toggle("show",f==="weekly")}
function openHabit(id=null){editingHabitId=id;$("#habitModalLabel").textContent=id?"EDITAR HÁBITO":"NOVO HÁBITO";$("#habitModalTitle").textContent=id?"Ajuste seu hábito":"Que hábito você quer construir?";$("#habitSubmit").textContent=id?"Salvar alterações":"Criar hábito";$("#deleteHabitFromModal").style.display=id?"inline-block":"none";$("#habitForm").reset();$("#habitFrequency").value="daily";toggleFrequencyFields();if(id){let raw=data().habits.find(x=>x.id===id);if(!raw)return;let h=normalizedHabit(raw);$("#habitName").value=h.name;$("#habitIcon").value=h.icon;$("#habitCategory").value=h.category;$("#habitTime").value=h.time;$("#habitGoalValue").value=h.goalValue;$("#habitGoalUnit").value=h.goalUnit;$("#habitFrequency").value=h.frequency;$("#weeklyTarget").value=h.weeklyTarget;document.querySelectorAll("#specificDaysWrap input").forEach(x=>x.checked=h.days.includes(Number(x.value)));toggleFrequencyFields()}$("#modalBackdrop").classList.remove("hidden");$("#habitName").focus()}
function closeHabit(){$("#modalBackdrop").classList.add("hidden");$("#habitForm").reset();editingHabitId=null;toggleFrequencyFields()}function openProfile(){$("#profileModalBackdrop").classList.remove("hidden");let p=getProfile();$("#profileName").value=p.name==="Minha rotina"?"":p.name;$("#profileEmail").value=p.email||"";$("#profileName").focus()}function closeProfile(){$("#profileModalBackdrop").classList.add("hidden")}
document.querySelectorAll(".nav-item").forEach(x=>x.onclick=()=>view(x.dataset.view));
$("#addHabitButton").onclick=openHabit;$("#emptyAddButton").onclick=openHabit;$("#emptyAddButton2").onclick=openHabit;$("#closeModal").onclick=closeHabit;$("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeHabit()};
$("#prevMonth").onclick=()=>{month.setMonth(month.getMonth()-1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()};$("#nextMonth").onclick=()=>{month.setMonth(month.getMonth()+1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()};
$("#habitFrequency").onchange=toggleFrequencyFields;
$("#habitForm").onsubmit=e=>{e.preventDefault();let d=data(),name=$("#habitName").value.trim();if(!name)return;let frequency=$("#habitFrequency").value,days=[...document.querySelectorAll("#specificDaysWrap input:checked")].map(x=>Number(x.value));if(frequency==="specific"&&!days.length){alert("Escolha pelo menos um dia da semana.");return}let base={name,icon:$("#habitIcon").value,category:$("#habitCategory").value.trim()||"Rotina",time:$("#habitTime").value,goalValue:$("#habitGoalValue").value,goalUnit:$("#habitGoalUnit").value,goal:$("#habitGoalValue").value?$("#habitGoalValue").value+" "+$("#habitGoalUnit").value:"",frequency,days,weeklyTarget:Number($("#weeklyTarget").value)||3};if(editingHabitId){let h=d.habits.find(x=>x.id===editingHabitId);if(h)Object.assign(h,base)}else d.habits.push({id:Date.now().toString(),...base,createdAt:new Date().toISOString(),completions:{}});save(d);closeHabit();renderAll()};
$("#noteAddButton").onclick=addNote;$("#canvasFirstNote").onclick=addNote;$("#noteClearButton").onclick=()=>{if(confirm("Limpar todas as notas do quadro?")){localStorage.removeItem(NOTES_DATA);renderNotes()}};
$("#themeSelect").onchange=e=>{let s=getSettings();s.theme=e.target.value;localStorage.setItem(SETTINGS,JSON.stringify(s));applyTheme(s.theme)};
$("#motivationToggle").onchange=e=>{let s=getSettings();s.motivation=e.target.checked;localStorage.setItem(SETTINGS,JSON.stringify(s));renderToday()};
$("#clearData").onclick=()=>{if(confirm("Isso apagará hábitos, progresso e notas deste navegador. Continuar?")){localStorage.removeItem(KEY);localStorage.removeItem(NOTES);localStorage.removeItem(NOTES_DATA);localStorage.removeItem(PROFILE);localStorage.removeItem(SETTINGS);renderAll();view("today")}};
$("#deleteHabitFromModal").onclick=()=>{if(editingHabitId&&confirm("Excluir este hábito e todo o histórico?")){let d=data();d.habits=d.habits.filter(x=>x.id!==editingHabitId);if(selectedHabitId===editingHabitId)selectedHabitId=null;save(d);closeHabit();renderAll()}};$("#evolutionBack").onclick=()=>view("habits");$("#evolutionEdit").onclick=()=>openHabit(selectedHabitId);$("#editProfile").onclick=openProfile;$("#closeProfileModal").onclick=closeProfile;$("#profileModalBackdrop").onclick=e=>{if(e.target.id==="profileModalBackdrop")closeProfile()};$("#profileForm").onsubmit=e=>{e.preventDefault();localStorage.setItem(PROFILE,JSON.stringify({name:$("#profileName").value.trim()||"Minha rotina",email:$("#profileEmail").value.trim()}));closeProfile();renderProfile()};
applyTheme(getSettings().theme);renderAll();