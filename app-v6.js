(() => {
"use strict";

const K={habits:"rotina-v1",settings:"rotina-settings-v1",profile:"rotina-profile-v1",notes:"rotina-notes-board-v1"};
const today=new Date();
let month=new Date(today.getFullYear(),today.getMonth(),1);
let selectedDate=new Date(today);
let selectedHabitId=null;
let editingId=null;
let currentSession=null;
let authMode="login";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const getData=()=>read(K.habits,{habits:[]});
const getSettings=()=>read(K.settings,{theme:"obsidian",motivation:true});
const getProfile=()=>read(K.profile,{name:"Minha rotina",email:""});
const saveProfileLocal=p=>write(K.profile,p);
const dateKey=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+day};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const uuid=()=>crypto.randomUUID();
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v));
const normalized=h=>({...h,frequency:h.frequency||"daily",days:Array.isArray(h.days)?h.days:[],weeklyTarget:Number(h.weeklyTarget)||3,category:h.category||"Rotina",time:h.time||"",goalValue:h.goalValue??"",goalUnit:h.goalUnit||"vez",completions:h.completions||{}});
const frequencyText=h=>{h=normalized(h);return h.frequency==="specific"?(h.days.length?"Dias: "+h.days.map(d=>["","Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][d]).join(", "):"Dias específicos"):h.frequency==="weekly"?h.weeklyTarget+"x por semana":"Todos os dias"};
const goalText=h=>{h=normalized(h);return h.goalValue!==""?h.goalValue+" "+h.goalUnit:(h.goal||"Sem meta definida")};
const scheduled=(h,d)=>{h=normalized(h);if(d>today)return false;return h.frequency==="specific"?h.days.includes(d.getDay()||7):true};
const streak=h=>{h=normalized(h);let n=0,d=new Date(today),created=new Date(h.createdAt||today);created.setHours(0,0,0,0);while(d>=created){if(scheduled(h,d)){if(h.completions[dateKey(d)])n++;else break}d.setDate(d.getDate()-1)}return n};

function setSync(text,kind="idle"){$("#syncStatus").innerHTML=`<i></i><em>${text}</em>`;$("[id=supabaseSettingStatus]")?.replaceChildren(document.createTextNode(text.toUpperCase()))}
function authRedirect(){return window.location.origin+window.location.pathname}
function setAuthMessage(message,type=""){$("#authMessage").textContent=message||"";$("#authMessage").className="auth-message"+(type?" "+type:"")}
function setAuthMode(mode){
 authMode=mode;
 const reset=mode==="reset",signup=mode==="signup";
 $("#authTitle").textContent=reset?"Crie uma nova senha":signup?"Crie sua conta":"Entre na sua rotina.";
 $("#authSubtitle").textContent=reset?"Defina uma nova senha para continuar.":signup?"Crie seu espaço pessoal e sincronize sua evolução.":"Seus hábitos, notas e evolução acompanhados em qualquer dispositivo.";
 $("#authNameWrap").classList.toggle("hidden",!signup);
 $("#authConfirmWrap").classList.toggle("hidden",!reset);
 $("#authSubmit").textContent=reset?"Atualizar senha":signup?"Criar conta":"Entrar";
 $("#authSwitch").classList.toggle("hidden",reset);
 $("#authSwitch").textContent=signup?"Já tenho uma conta":"Criar uma conta";
 $("#forgotPassword").classList.toggle("hidden",signup||reset);
 $("#authEmail").disabled=reset;
 setAuthMessage("");
}
function showAuth(){closeAll();$("#appShell").hidden=true;$("#authScreen").hidden=false;document.body.classList.add("auth-locked");setAuthMode(authMode==="reset"?"reset":"login")}
function showApp(){$("#authScreen").hidden=true;$("#appShell").hidden=false;document.body.classList.remove("auth-locked")}

async function signIn(){
 if(!window.SUPABASE_READY){setAuthMessage("Supabase não está configurado.","error");return}
 const email=$("#authEmail").value.trim(),password=$("#authPassword").value;
 if(!email||!password)return setAuthMessage("Preencha e-mail e senha.","error");
 $("#authSubmit").disabled=true;setAuthMessage("Entrando...");
 const {data,error}=await window.supabaseClient.auth.signInWithPassword({email,password});
 $("#authSubmit").disabled=false;
 if(error){setAuthMessage("Não foi possível entrar. Verifique seus dados.","error");console.error(error);return}
 if(data.session) await enterApp(data.session);
}
async function signUp(){
 const email=$("#authEmail").value.trim(),password=$("#authPassword").value,name=$("#authName").value.trim()||"Minha rotina";
 if(password.length<6)return setAuthMessage("A senha precisa ter pelo menos 6 caracteres.","error");
 $("#authSubmit").disabled=true;setAuthMessage("Criando sua conta...");
 const {data,error}=await window.supabaseClient.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:authRedirect()}});
 $("#authSubmit").disabled=false;
 if(error){setAuthMessage(error.message||"Não foi possível criar a conta.","error");return}
 if(data.session) await enterApp(data.session);
 else setAuthMessage("Conta criada. Confira seu e-mail para confirmar o acesso.","success");
}
async function resetRequest(){
 const email=$("#authEmail").value.trim();if(!email)return setAuthMessage("Informe seu e-mail.","error");
 $("#authSubmit").disabled=true;setAuthMessage("Enviando instruções...");
 const {error}=await window.supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:authRedirect()});
 $("#authSubmit").disabled=false;
 if(error){setAuthMessage(error.message||"Não foi possível enviar o e-mail.","error");return}
 setAuthMessage("Enviamos um link para redefinir sua senha.","success");
}
async function updatePassword(){
 const p=$("#authPassword").value,c=$("#authConfirm").value;
 if(p.length<6)return setAuthMessage("A senha precisa ter pelo menos 6 caracteres.","error");
 if(p!==c)return setAuthMessage("As senhas não coincidem.","error");
 const {error}=await window.supabaseClient.auth.updateUser({password:p});
 if(error){setAuthMessage("Não foi possível atualizar a senha.","error");return}
 setAuthMode("login");$("#authPassword").value="";$("#authConfirm").value="";setAuthMessage("Senha atualizada. Entre novamente.","success");await window.supabaseClient.auth.signOut({scope:"local"});
}
async function handleAuthSubmit(e){
 e.preventDefault();
 if(authMode==="login")return signIn();
 if(authMode==="signup")return signUp();
 if(authMode==="forgot")return resetRequest();
 return updatePassword();
}
async function signOut(){if(window.SUPABASE_READY)await window.supabaseClient.auth.signOut({scope:"local"});currentSession=null;localStorage.removeItem(K.habits);localStorage.removeItem(K.notes);showAuth();setAuthMode("login")}

async function migrateLocalData(user){
 const local=getData(),localNotes=read(K.notes,[]);
 if(!local.habits.length&&!localNotes.length)return;
 setSync("Migrando...");
 const idMap=new Map();
 for(const raw of local.habits){
  const h=normalized(raw),remoteId=isUuid(h.id)?h.id:uuid();idMap.set(h.id,remoteId);
  const row={id:remoteId,user_id:user.id,name:h.name,icon:h.icon,category:h.category,time:h.time||null,goal_value:h.goalValue===""?null:Number(h.goalValue),goal_unit:h.goalUnit||null,frequency:h.frequency,days:h.days,weekly_target:h.weeklyTarget,created_at:h.createdAt||new Date().toISOString()};
  const {error}=await window.supabaseClient.from("habits").upsert(row,{onConflict:"id"});if(error)throw error;
  const completionRows=Object.keys(h.completions).filter(k=>h.completions[k]).map(k=>({habit_id:remoteId,user_id:user.id,completed_on:k}));
  if(completionRows.length){const {error:ce}=await window.supabaseClient.from("habit_completions").upsert(completionRows,{onConflict:"habit_id,completed_on"});if(ce)throw ce}
 }
 if(localNotes.length){const rows=localNotes.map(n=>({id:isUuid(n.id)?n.id:uuid(),user_id:user.id,text:n.text||"",color:n.color||"yellow",x:Math.round(n.x||40),y:Math.round(n.y||40),created_at:new Date().toISOString()}));const {error}=await window.supabaseClient.from("notes").upsert(rows,{onConflict:"id"});if(error)throw error}
 saveProfileLocal(getProfile());const p=getProfile();await window.supabaseClient.from("profiles").upsert({id:user.id,display_name:p.name||user.user_metadata?.display_name||"Minha rotina",email:user.email||p.email||null},{onConflict:"id"});await window.supabaseClient.from("user_settings").upsert({user_id:user.id,theme:getSettings().theme||"obsidian",motivation:getSettings().motivation!==false},{onConflict:"user_id"});
}

async function loadRemote(){
 if(!currentSession||!window.SUPABASE_READY)return;
 const user=currentSession.user;
 setSync("Sincronizando...","sync");
 const [hr,cr,nr,pr,sr]=await Promise.all([
  window.supabaseClient.from("habits").select("*").eq("user_id",user.id).order("created_at",{ascending:true}),
  window.supabaseClient.from("habit_completions").select("habit_id,completed_on").eq("user_id",user.id),
  window.supabaseClient.from("notes").select("*").eq("user_id",user.id).order("created_at",{ascending:true}),
  window.supabaseClient.from("profiles").select("*").eq("id",user.id).maybeSingle(),
  window.supabaseClient.from("user_settings").select("*").eq("user_id",user.id).maybeSingle()
 ]);
 if(hr.error)throw hr.error;if(cr.error)throw cr.error;if(nr.error)throw nr.error;
 if(!hr.data.length&&!nr.data.length&&(getData().habits.length||read(K.notes,[]).length)){await migrateLocalData(user);return loadRemote()}
 const completions={};cr.data.forEach(c=>{(completions[c.habit_id]??=[]).push(c.completed_on)});
 const localHabits=hr.data.map(h=>({id:h.id,name:h.name,icon:h.icon,category:h.category,time:h.time||"",goalValue:h.goal_value??"",goalUnit:h.goal_unit||"vez",goal:h.goal_value!==null&&h.goal_value!==undefined?h.goal_value+" "+(h.goal_unit||"vez"):"",frequency:h.frequency,days:h.days||[],weeklyTarget:h.weekly_target||3,createdAt:h.created_at,completions:Object.fromEntries((completions[h.id]||[]).map(d=>[d,true]))}));
 write(K.habits,{habits:localHabits});
 write(K.notes,(nr.data||[]).map(n=>({id:n.id,text:n.text,color:n.color,x:n.x,y:n.y})));
 if(pr.data)write(K.profile,{name:pr.data.display_name||"Minha rotina",email:pr.data.email||user.email||""});else write(K.profile,{name:user.user_metadata?.display_name||"Minha rotina",email:user.email||""});
 if(sr.data)write(K.settings,{theme:sr.data.theme||"obsidian",motivation:sr.data.motivation!==false});
 setSync("Sincronizado","ok");
}

async function enterApp(session){
 currentSession=session;showApp();
 try{await loadRemote();showView("today")}catch(e){console.error(e);setSync("Offline","error");showView("today")}
}
async function remoteUpsertHabit(h){
 if(!currentSession||!window.SUPABASE_READY)return;
 const {error}=await window.supabaseClient.from("habits").upsert({id:h.id,user_id:currentSession.user.id,name:h.name,icon:h.icon,category:h.category,time:h.time||null,goal_value:h.goalValue===""?null:Number(h.goalValue),goal_unit:h.goalUnit||null,frequency:h.frequency,days:h.days||[],weekly_target:h.weeklyTarget||3,created_at:h.createdAt||new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"id"});
 if(error)throw error;
}
async function remoteToggle(h,dateKeyValue){
 if(!currentSession||!window.SUPABASE_READY)return;
 const q=window.supabaseClient.from("habit_completions");
 if(h.completions[dateKeyValue]){const {error}=await q.upsert({habit_id:h.id,user_id:currentSession.user.id,completed_on:dateKeyValue},{onConflict:"habit_id,completed_on"});if(error)throw error}
 else{const {error}=await q.delete().eq("habit_id",h.id).eq("user_id",currentSession.user.id).eq("completed_on",dateKeyValue);if(error)throw error}
}
async function remoteDeleteHabit(id){if(!currentSession||!window.SUPABASE_READY)return;const {error}=await window.supabaseClient.from("habits").delete().eq("id",id).eq("user_id",currentSession.user.id);if(error)throw error}
async function remoteSaveProfile(p){if(!currentSession||!window.SUPABASE_READY)return;const {error}=await window.supabaseClient.from("profiles").upsert({id:currentSession.user.id,display_name:p.name||"Minha rotina",email:p.email||currentSession.user.email||null,updated_at:new Date().toISOString()},{onConflict:"id"});if(error)throw error}
async function remoteSaveSettings(s){if(!currentSession||!window.SUPABASE_READY)return;const {error}=await window.supabaseClient.from("user_settings").upsert({user_id:currentSession.user.id,theme:s.theme,motivation:s.motivation,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)throw error}
async function remoteSaveNote(n){if(!currentSession||!window.SUPABASE_READY)return;const {error}=await window.supabaseClient.from("notes").upsert({id:n.id,user_id:currentSession.user.id,text:n.text,color:n.color,x:Math.round(n.x),y:Math.round(n.y),updated_at:new Date().toISOString()},{onConflict:"id"});if(error)throw error}
async function remoteDeleteNote(id){if(!currentSession||!window.SUPABASE_READY)return;const {error}=await window.supabaseClient.from("notes").delete().eq("id",id).eq("user_id",currentSession.user.id);if(error)throw error}


const habitModalMarkup=()=>`<span class="eyebrow">${editingId?"EDITAR HÁBITO":"NOVO HÁBITO"}</span><h2>${editingId?"Ajuste seu hábito":"Que hábito você quer construir?"}</h2><form id="habitForm">
<label>Nome<input id="habitName" maxlength="60" placeholder="Ex.: Acordar às 06:30" required></label>
<div class="form-grid"><label>Categoria<input id="habitCategory" maxlength="30" list="catList" placeholder="Saúde"><datalist id="catList"><option>Rotina</option><option>Saúde</option><option>Estudos</option><option>Trabalho</option><option>Exercício</option><option>Bem-estar</option><option>Finanças</option></datalist></label><label>Ícone<select id="habitIcon"><option>☀️</option><option>📚</option><option>🏃</option><option>💧</option><option>🧘</option><option>🛌</option><option>✍️</option><option>🎯</option><option>💪</option><option>🧠</option></select></label></div>
<div class="form-grid"><label>Horário<input id="habitTime" type="time"></label><label>Meta<input id="habitGoalValue" type="number" min="0" step="1" placeholder="1"></label></div>
<label>Unidade<select id="habitGoalUnit"><option value="vez">vez</option><option value="vezes">vezes</option><option value="minutos">minutos</option><option value="páginas">páginas</option><option value="copos">copos</option><option value="km">km</option><option value="horas">horas</option></select></label>
<label>Frequência<select id="habitFrequency"><option value="daily">Todos os dias</option><option value="specific">Dias específicos</option><option value="weekly">Meta semanal</option></select></label>
<div class="days-wrap" id="specificDaysWrap"><span class="field-label">Dias da semana</span><div class="day-picker"><label><input type="checkbox" value="1">Seg</label><label><input type="checkbox" value="2">Ter</label><label><input type="checkbox" value="3">Qua</label><label><input type="checkbox" value="4">Qui</label><label><input type="checkbox" value="5">Sex</label><label><input type="checkbox" value="6">Sáb</label><label><input type="checkbox" value="7">Dom</label></div></div>
<div class="days-wrap" id="weeklyWrap"><label>Quantas vezes por semana?<input id="weeklyTarget" type="number" min="1" max="7" value="3"></label></div>
<div class="modal-footer"><button type="button" class="danger-btn" id="deleteHabitModal" style="display:${editingId?"block":"none"}">Excluir</button><button type="submit" class="primary-btn" id="habitSubmit">${editingId?"Salvar alterações":"Criar hábito"}</button></div></form>`;
const profileModalMarkup=()=>`<span class="eyebrow">PERFIL</span><h2>Seu espaço pessoal</h2><form id="profileForm"><label>Nome<input id="profileName" maxlength="40" placeholder="Seu nome"></label><label>E-mail<input id="profileEmail" type="email" maxlength="100" placeholder="voce@email.com"></label><button class="primary-btn" type="submit">Salvar perfil</button></form>`;
function closeModal(){const m=$("#globalModal");if(m)m.hidden=true;$("#globalModalContent").innerHTML=""}
function openModal(content,small){$("#globalModalBox").className=small?"modal small-modal":"modal";$("#globalModalContent").innerHTML=content;$("#globalModal").hidden=false}
function toggleFrequency(){const f=$("#habitFrequency")?.value;$("#specificDaysWrap")?.classList.toggle("show",f==="specific");$("#weeklyWrap")?.classList.toggle("show",f==="weekly")}
function openHabit(id=null){editingId=id;openModal(habitModalMarkup(),false);$("#habitFrequency").value="daily";if(id){const raw=getData().habits.find(x=>x.id===id);if(!raw)return;const h=normalized(raw);$("#habitName").value=h.name;$("#habitCategory").value=h.category;$("#habitIcon").value=h.icon||"☀️";$("#habitTime").value=h.time;$("#habitGoalValue").value=h.goalValue;$("#habitGoalUnit").value=h.goalUnit;$("#habitFrequency").value=h.frequency;$("#weeklyTarget").value=h.weeklyTarget;$$('#specificDaysWrap input').forEach(x=>x.checked=h.days.includes(Number(x.value)));}toggleFrequency();$("#habitName").focus()}
function openProfile(){const p=getProfile();openModal(profileModalMarkup(),true);$("#profileName").value=p.name==="Minha rotina"?"":p.name;$("#profileEmail").value=p.email||currentSession?.user?.email||"";$("#profileName").focus()}
function showView(v){closeModal();$("#sidebar")?.classList.remove("mobile-open");$$(".view").forEach(x=>x.classList.toggle("active-view",x.id===v+"View"));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));const names={today:["HOJE","Sua rotina","Um dia de cada vez."],calendar:["HISTÓRICO","Calendário","Veja o que você construiu ao longo do tempo."],habits:["SEU SISTEMA","Hábitos","Defina como quer praticar cada hábito."],evolution:["EVOLUÇÃO","Evolução","Consistência, sequência e histórico."],notes:["ESPAÇO PESSOAL","Notas","Ideias, planos, aprendizados e lembretes."],settings:["PREFERÊNCIAS","Configurações","Deixe o app com a sua cara."],account:["PERFIL","Conta","Seu espaço pessoal no Rotina."]};const n=names[v]||names.today;$("#eyebrow").textContent=n[0];$("#pageTitle").textContent=n[1];$("#pageSubtitle").textContent=n[2];$("#addHabitButton").style.display=["today","calendar","habits"].includes(v)?"inline-flex":"none";renderAll()}
function showView(v){closeAll();$("#sidebar")?.classList.remove("mobile-open");$$(".view").forEach(x=>x.classList.toggle("active-view",x.id===v+"View"));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));const names={today:["HOJE","Sua rotina","Um dia de cada vez."],calendar:["HISTÓRICO","Calendário","Veja o que você construiu ao longo do tempo."],habits:["SEU SISTEMA","Hábitos","Defina como quer praticar cada hábito."],evolution:["EVOLUÇÃO","Evolução","Consistência, sequência e histórico."],notes:["ESPAÇO PESSOAL","Notas","Ideias, planos, aprendizados e lembretes."],settings:["PREFERÊNCIAS","Configurações","Deixe o app com a sua cara."],account:["PERFIL","Conta","Seu espaço pessoal no Rotina."]};const n=names[v]||names.today;$("#eyebrow").textContent=n[0];$("#pageTitle").textContent=n[1];$("#pageSubtitle").textContent=n[2];$("#addHabitButton").style.display=["today","calendar","habits"].includes(v)?"inline-flex":"none";renderAll()}
function renderToday(){const d=getData(),list=d.habits.map(normalized).filter(h=>scheduled(h,today)),k=dateKey(today),done=list.filter(h=>h.completions[k]).length,total=list.length,p=total?Math.round(done/total*100):0;$("#todayDate").textContent=today.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"});$("#dailyMessage").textContent=getSettings().motivation?["Consistência não precisa ser perfeita. Só precisa continuar.","Um pequeno passo hoje já conta.","Seu futuro é construído nas escolhas de hoje.","Faça o que importa, depois repita."][today.getDate()%4]:"Sua rotina de hoje está aqui.";$("#metricHabits").textContent=total;$("#metricDone").textContent=done;$("#metricStreak").textContent=list.length?Math.max(...list.map(streak)):0;$("#habitCount").textContent=total+" "+(total===1?"hábito":"hábitos");$("#progressPercent").textContent=p+"%";$("#progressRing").style.setProperty("--progress",p+"%");const box=$("#habitList");box.innerHTML="";$("#emptyState").classList.toggle("hidden",!!list.length);list.forEach(h=>{const yes=!!h.completions[k],e=document.createElement("article");e.className="habit-card";e.innerHTML=`<div class="habit-icon">${esc(h.icon)}</div><div class="habit-info"><strong>${esc(h.name)}</strong><span>${esc(goalText(h))} · <span class="streak">🔥 ${streak(h)} dias</span></span></div><button type="button" class="check ${yes?"done":""}" data-action="today-toggle" data-id="${esc(h.id)}">${yes?"✓":"○"}</button>`;box.appendChild(e)})}
function renderHabits(){const d=getData(),box=$("#allHabits");box.innerHTML="";$("#emptyHabits").classList.toggle("hidden",!!d.habits.length);d.habits.map(normalized).forEach(h=>{const e=document.createElement("article");e.className="habit-overview";e.innerHTML=`<main><div class="habit-icon">${esc(h.icon)}</div><div><strong>${esc(h.name)}</strong><div class="mini-label">🔥 ${streak(h)} DIAS</div><span class="frequency-badge">${esc(h.category)} · ${esc(frequencyText(h))}</span></div></main><div class="habit-actions"><button class="evolution-button" type="button" data-action="evolution" data-id="${esc(h.id)}">Evolução ↗</button><button class="edit-button" type="button" data-action="edit" data-id="${esc(h.id)}">Editar</button><button class="delete-button" type="button" data-action="delete" data-id="${esc(h.id)}">Excluir</button></div>`;box.appendChild(e)})}
function renderCalendar(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),start=(first.getDay()+6)%7,d=getData();$("#calendarMonthTitle").textContent=month.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});const g=document.createElement("div");g.className="calendar-grid";["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].forEach(x=>{const e=document.createElement("div");e.className="weekday";e.textContent=x;g.appendChild(e)});for(let i=0;i<start;i++)g.appendChild(document.createElement("div"));for(let n=1;n<=last.getDate();n++){const dt=new Date(y,m,n),k=dateKey(dt),b=document.createElement("button");b.type="button";b.className="calendar-day-btn"+(k===dateKey(today)?" today":"")+(k===dateKey(selectedDate)?" selected":"");b.innerHTML=`<div class="day-number">${n}</div><div class="day-dots">${d.habits.map(h=>`<span class="dot ${h.completions?.[k]?"done":""}"></span>`).join("")}</div>`;b.addEventListener("click",()=>{selectedDate=new Date(dt);renderCalendar()});g.appendChild(b)}$("#calendar").replaceChildren(g);renderSelectedDay()}
function renderSelectedDay(){const d=getData(),k=dateKey(selectedDate),done=d.habits.filter(h=>h.completions?.[k]).length,total=d.habits.length,p=total?Math.round(done/total*100):0;$("#selectedDateTitle").textContent=selectedDate.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});$("#selectedProgress").textContent=p+"% • "+done+"/"+total;const box=$("#selectedDayHabits");box.innerHTML="";d.habits.map(normalized).forEach(h=>{const yes=!!h.completions[k],e=document.createElement("div");e.className="selected-habit";e.innerHTML=`<div class="selected-habit-main"><div class="habit-icon">${esc(h.icon)}</div><div><div class="selected-habit-name">${esc(h.name)}</div><div class="mini-label">${esc(goalText(h))}</div></div></div><button type="button" class="check ${yes?"done":""}" data-action="date-toggle" data-id="${esc(h.id)}" data-date="${k}">${yes?"✓":"○"}</button>`;box.appendChild(e)})}
function renderEvolution(){const d=getData(),h=normalized(d.habits.find(x=>x.id===selectedHabitId)||d.habits[0]);if(!h){$("#evolutionEmpty").classList.remove("hidden");$("#evolutionContent").classList.add("hidden");return}$("#evolutionEmpty").classList.add("hidden");$("#evolutionContent").classList.remove("hidden");const s=stats(h);$("#evolutionTitle").textContent=h.name;$("#evolutionName").textContent=h.name;$("#evolutionIcon").textContent=h.icon;$("#evolutionCategory").textContent=h.category.toUpperCase();$("#evolutionSchedule").textContent=[frequencyText(h),h.time?"às "+h.time:"",goalText(h)].filter(Boolean).join(" · ");$("#statStreak").textContent=s.current;$("#statBest").textContent=s.best;$("#statRate").textContent=s.rate+"%";$("#statTotal").textContent=s.total;const heat=$("#heatmap");heat.innerHTML="";for(let i=29;i>=0;i--){const dt=new Date(today);dt.setDate(dt.getDate()-i);const c=document.createElement("div");c.className="heat-cell"+(scheduled(h,dt)?" scheduled":"")+(h.completions[dateKey(dt)]?" done":"");heat.appendChild(c)}$("#evolutionDetails").innerHTML=[[ "Frequência",frequencyText(h) ],[ "Horário",h.time||"Sem horário" ],[ "Meta",goalText(h) ],[ "Categoria",h.category ],[ "Últimos 30 dias",s.done30+" de "+s.expected ],[ "Criado em",h.createdAt?new Date(h.createdAt).toLocaleDateString("pt-BR"):"—" ]].map(r=>`<div class="detail-row"><span>${esc(r[0])}</span><strong>${esc(r[1])}</strong></div>`).join("")}
function stats(h){h=normalized(h);const total=Object.values(h.completions).filter(Boolean).length;let current=0,best=0,d=new Date(today),created=new Date(h.createdAt||today);created.setHours(0,0,0,0);while(d>=created){if(scheduled(h,d)){if(h.completions[dateKey(d)])current++;else break}d.setDate(d.getDate()-1)}let run=0;for(let x=new Date(created);x<=today;x.setDate(x.getDate()+1)){if(scheduled(h,x)){if(h.completions[dateKey(x)])run++;else run=0;best=Math.max(best,run)}}let expected=0,done30=0;for(let i=0;i<30;i++){const x=new Date(today);x.setDate(x.getDate()-i);if(scheduled(h,x)){expected++;if(h.completions[dateKey(x)])done30++}}return{total,current,best,expected,done30,rate:Math.min(100,Math.round(done30/Math.max(1,expected)*100))}}
function renderNotes(){const items=read(K.notes,[]),canvas=$("#notesCanvas");canvas.querySelectorAll(".note-card").forEach(x=>x.remove());$("#canvasEmpty").classList.toggle("hidden",items.length>0);items.forEach(n=>{const c=document.createElement("article");c.className="note-card "+n.color;c.dataset.id=n.id;c.style.left=n.x+"px";c.style.top=n.y+"px";c.innerHTML=`<span class="note-pin"></span><button class="note-delete" type="button" data-action="delete-note">×</button><textarea maxlength="500" placeholder="Escreva uma ideia...">${esc(n.text)}</textarea>`;canvas.appendChild(c);c.querySelector("textarea").addEventListener("input",e=>{const b=read(K.notes,[]),item=b.find(x=>x.id===n.id);if(item){item.text=e.target.value;write(K.notes,b);setSync("Salvando...");clearTimeout(c._saveTimer);c._saveTimer=setTimeout(async()=>{try{await remoteSaveNote(item);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}},500)}});let dragging=false,dx=0,dy=0;c.addEventListener("pointerdown",e=>{if(e.target.tagName==="TEXTAREA"||e.target.closest(".note-delete"))return;dragging=true;dx=e.clientX-c.offsetLeft;dy=e.clientY-c.offsetTop;c.setPointerCapture?.(e.pointerId)});c.addEventListener("pointermove",e=>{if(!dragging)return;const r=canvas.getBoundingClientRect();c.style.left=Math.max(5,Math.min(e.clientX-r.left-dx,r.width-c.offsetWidth-5))+"px";c.style.top=Math.max(5,Math.min(e.clientY-r.top-dy,r.height-c.offsetHeight-5))+"px"});c.addEventListener("pointerup",async()=>{if(!dragging)return;dragging=false;const b=read(K.notes,[]),item=b.find(x=>x.id===n.id);if(item){item.x=parseInt(c.style.left,10);item.y=parseInt(c.style.top,10);write(K.notes,b);try{await remoteSaveNote(item);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}}})})}
function addNote(){const b=read(K.notes,[]),colors=["yellow","peach","green","blue"],n={id:uuid(),text:"",color:colors[b.length%4],x:50+(b.length%5)*42,y:55+(b.length%4)*38};b.push(n);write(K.notes,b);renderNotes();remoteSaveNote(n).catch(console.error);setTimeout(()=>$("#notesCanvas .note-card:last-child textarea")?.focus(),0)}
function renderSettings(){const s=getSettings();$("#themeSelect").value=s.theme;$("#motivationToggle").checked=s.motivation;applyTheme(s.theme)}
function renderProfile(){const p=getProfile();$("#profileNameText").textContent=p.name||"Minha rotina";$("#profileEmailText").textContent=p.email||currentSession?.user?.email||"Perfil";$("#accountAvatar").textContent=(p.name||"R").trim().charAt(0).toUpperCase()}
function applyTheme(t){document.body.classList.remove("theme-paper","theme-midnight");if(t==="paper")document.body.classList.add("theme-paper");if(t==="midnight")document.body.classList.add("theme-midnight")}
function renderAll(){renderToday();renderHabits();renderNotes();renderSettings();renderProfile();if($("#calendarView").classList.contains("active-view"))renderCalendar();if($("#evolutionView").classList.contains("active-view"))renderEvolution()}
function prevMonth(){month.setMonth(month.getMonth()-1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()}
function nextMonth(){month.setMonth(month.getMonth()+1);selectedDate=new Date(month.getFullYear(),month.getMonth(),1);renderCalendar()}
function clearNotes(){if(confirm("Limpar todas as notas?")){const ids=read(K.notes,[]).map(n=>n.id);localStorage.removeItem(K.notes);renderNotes();Promise.all(ids.map(remoteDeleteNote)).catch(console.error)}}

function bind(){
  // Auth
  $("#authForm")?.addEventListener("submit",handleAuthSubmit);
  $("#authEmail")?.addEventListener("input",()=>setAuthMessage(""));
  $("#authSwitch")?.addEventListener("click",()=>{if(authMode==="forgot")setAuthMode("login");else setAuthMode(authMode==="signup"?"login":"signup")});
  $("#forgotPassword")?.addEventListener("click",()=>handleForgot());
  $("#resendConfirm")?.addEventListener("click",async()=>{
    const email=$("#authEmail")?.value.trim();
    if(!email)return setAuthMessage("Informe seu e-mail.","error");
    const btn=$("#resendConfirm");btn.disabled=true;
    const {error}=await window.supabaseClient.auth.resend({type:"signup",email,options:{emailRedirectTo:location.origin+location.pathname}});
    btn.disabled=false;
    if(error)return setAuthMessage("Não foi possível reenviar agora. Tente novamente.","error");
    setAuthMessage("Novo e-mail de confirmação enviado.","success");
  });

  // One delegated interaction layer for static and dynamically-rendered controls
  document.addEventListener("click",async e=>{
    const openHabit=e.target.closest("[data-open-habit]");
    if(openHabit){e.preventDefault();return openHabitFn();}
    const nav=e.target.closest(".nav-item[data-view]");
    if(nav){e.preventDefault();return showView(nav.dataset.view);}
    const actionEl=e.target.closest("[data-action]");
    if(actionEl){e.preventDefault();await handleAction(actionEl);return;}
    if(e.target.closest("#brandHome"))return showView("today");
    if(e.target.closest("#mobileMenu"))return $("#sidebar")?.classList.toggle("mobile-open");
    if(e.target.closest("#globalModalClose"))return closeModal();
    if(e.target.closest("#editProfile"))return openProfile();
    if(e.target.closest("#signOut"))return signOut();
    if(e.target.closest("#prevMonth")){month.setMonth(month.getMonth()-1);selectedDate=new Date(month);return renderCalendar();}
    if(e.target.closest("#nextMonth")){month.setMonth(month.getMonth()+1);selectedDate=new Date(month);return renderCalendar();}
    if(e.target.closest("#evolutionBack"))return showView("habits");
    if(e.target.closest("#evolutionEdit"))return selectedHabitId&&openHabit(selectedHabitId);
    if(e.target.closest("[data-add-note]"))return addNote();
    if(e.target.closest("[data-clear-notes]"))return clearNotes();
    if(e.target.closest("#clearData"))return clearLocal();
  });

  document.addEventListener("change",async e=>{
    if(e.target.id==="habitFrequency")return toggleFrequency();
    if(e.target.id==="themeSelect"){const s=getSettings();s.theme=e.target.value;write(K.settings,s);applyTheme(s.theme);try{await remoteSaveSettings(s)}catch(err){console.error(err)}return;}
    if(e.target.id==="motivationToggle"){const s=getSettings();s.motivation=e.target.checked;write(K.settings,s);renderToday();try{await remoteSaveSettings(s)}catch(err){console.error(err)}return;}
  });

  document.addEventListener("submit",async e=>{
    if(e.target.id==="habitForm"){e.preventDefault();return saveHabitForm(e.target);}
    if(e.target.id==="profileForm"){e.preventDefault();return saveProfileForm(e.target);}
  });

  $("#globalModal")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
}

function openHabitFn(id=null){return openHabit(id)}

async function handleAction(el){
  const a=el.dataset.action,id=el.dataset.id;
  if(a==="toggle"||a==="date-toggle"){
    const k=a==="toggle"?dateKey(today):el.dataset.date;
    const d=getData(),h=d.habits.find(x=>x.id===id);if(!h)return;
    h.completions=h.completions||{};h.completions[k]=!h.completions[k];if(!h.completions[k])delete h.completions[k];
    write(K.habits,d);renderAll();setSync("Salvando...","sync");
    try{await remoteToggle(h,k);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}
    return;
  }
  if(a==="edit")return openHabit(id);
  if(a==="evolution"){selectedHabitId=id;return showView("evolution")}
  if(a==="delete"){
    if(!confirm("Excluir este hábito e todo o histórico?"))return;
    const d=getData();d.habits=d.habits.filter(x=>x.id!==id);write(K.habits,d);renderAll();
    try{await remoteDeleteHabit(id);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}
    return;
  }
  if(a==="delete-note"){
    const card=el.closest(".note-card"),nid=card?.dataset.id;if(!nid)return;
    write(K.notes,read(K.notes,[]).filter(n=>n.id!==nid));renderNotes();
    try{await remoteDeleteNote(nid);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}
  }
}

async function saveHabitForm(form){
  const d=getData(),name=$("#habitName").value.trim(),frequency=$("#habitFrequency").value,days=$$("#specificDaysWrap input:checked").map(x=>Number(x.value));
  if(!name)return;
  if(frequency==="specific"&&!days.length){alert("Escolha pelo menos um dia.");return}
  const base={name,icon:$("#habitIcon").value,category:$("#habitCategory").value.trim()||"Rotina",time:$("#habitTime").value,goalValue:$("#habitGoalValue").value,goalUnit:$("#habitGoalUnit").value,goal:$("#habitGoalValue").value?$("#habitGoalValue").value+" "+$("#habitGoalUnit").value:"",frequency,days,weeklyTarget:Number($("#weeklyTarget").value)||3};
  let h;
  if(editingId){h=d.habits.find(x=>x.id===editingId);if(!h)return;Object.assign(h,base)}
  else{h={id:uuid(),...base,createdAt:new Date().toISOString(),completions:{}};d.habits.push(h)}
  write(K.habits,d);closeModal();renderAll();setSync("Salvando...","sync");
  try{await remoteUpsertHabit(norm(h));await replaceCompletionsForHabit(norm(h));setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}
}

async function saveProfileForm(form){
  const p={name:$("#profileName").value.trim()||"Minha rotina",email:$("#profileEmail").value.trim()};
  write(K.profile,p);closeModal();renderProfile();
  try{await remoteSaveProfile(p);setSync("Sincronizado","ok")}catch(err){console.error(err);setSync("Erro","error")}
}

async function clearLocal(){if(confirm("Apagar todos os dados locais? Os dados da sua conta continuam no Supabase.")){Object.values(K).forEach(k=>localStorage.removeItem(k));location.reload()}}
function handleForgot(){authMode="forgot";$("#authTitle").textContent="Redefina sua senha";$("#authSubtitle").textContent="Enviaremos um link para seu e-mail.";$("#authNameWrap").classList.add("hidden");$("#authConfirmWrap").classList.add("hidden");$("#authEmail").disabled=false;$("#authPassword").parentElement.classList.add("hidden");$("#authSubmit").textContent="Enviar link";$("#authSwitch").classList.remove("hidden");$("#authSwitch").textContent="Voltar para entrar";$("#forgotPassword").classList.add("hidden");setAuthMessage("")}
const originalSetAuthMode=setAuthMode;
setAuthMode=function(mode){if(mode==="forgot"){return handleForgot()}$("#authPassword").parentElement.classList.remove("hidden");return originalSetAuthMode(mode)};
function watchAuth(){
 if(!window.SUPABASE_READY){setAuthMessage("Supabase não foi carregado. Verifique a configuração.","error");return}
 window.supabaseClient.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{if(event==="PASSWORD_RECOVERY"){authMode="reset";showAuth();originalSetAuthMode("reset")}else if(session&&!currentSession){await enterApp(session)}else if(!session&&currentSession){currentSession=null;showAuth();setAuthMode("login")}},0)});
}
async function boot(){bind();applyTheme(getSettings().theme);watchAuth();if(!window.SUPABASE_READY){showAuth();return}const {data,error}=await window.supabaseClient.auth.getSession();if(error||!data.session)showAuth();else await enterApp(data.session)}
boot();
})();