(() => {
  const api = (window.PULSE_DASHBOARD_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");
  const status = document.getElementById("status");
  const guildSelect = document.getElementById("guildSelect");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  let csrf = "";
  let currentData = null;
  let searchText = "";
  let isLoading = false;
  const safe = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function configured(){return api && !api.includes("SET-YOUR-API-HOST") && /^https:\/\//i.test(api)}
  async function get(path){const r=await fetch(api+path,{credentials:"include",headers:{"Accept":"application/json"}});if(!r.ok)throw new Error(r.status===401?"Please sign in with Discord.":(await r.text()).slice(0,180)||`Request failed (${r.status})`);return r.json()}
  function table(headers, rows){if(!rows.length)return '<p class="dash-empty">No records found.</p>';return `<table class="dash-table"><thead><tr>${headers.map(x=>`<th>${safe(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${safe(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
  function setStatus(msg){status.textContent=msg}
  async function writeMapping(method, payload) {
    const gid = guildSelect.value;
    if (!gid || !csrf) throw new Error("Sign in before changing mappings.");
    const response = await fetch(api+`/api/guilds/${encodeURIComponent(gid)}/roblox-mappings`, {
      method, credentials:"include", headers:{"Content-Type":"application/json", "X-Pulse-CSRF":csrf},
      body:JSON.stringify(payload)
    });
    if (!response.ok) throw new Error((await response.text()).slice(0,250) || `Request failed (${response.status})`);
    return response.json();
  }
  const mappingEditor = document.createElement("section");
  mappingEditor.style.cssText="margin:16px 0;padding:16px;border:1px solid #294366;border-radius:10px";
  mappingEditor.innerHTML=`<h3>Manage Roblox mappings</h3><p class="dash-muted">Changes affect the next Roblox /update sync; they do not immediately change member roles.</p>
  <form id="mappingForm" style="display:grid;gap:9px">
  <label>Mapping type <select id="mappingKind" class="dash-select"><option value="rank">Specific Roblox rank</option><option value="group">Any member of group</option></select></label>
  <label>Roblox group ID <input id="mappingGroup" required type="number" min="1" step="1" placeholder="Roblox group ID" class="dash-select"></label>
  <label id="mappingRankLabel">Roblox rank ID (1–255) <input id="mappingRank" type="number" min="1" max="255" step="1" required class="dash-select"></label>
  <label>Discord role <select id="mappingRole" required class="dash-select"><option value="">Choose a role</option></select></label>
  <button class="button secondary dash-button" type="submit">Add mapping</button></form>
  <p id="mappingFeedback" class="dash-muted" role="status"></p>`;
  document.getElementById("roblox").before(mappingEditor);
  const mappingForm = document.getElementById("mappingForm");
  const mappingKind = document.getElementById("mappingKind");
  const mappingRankLabel = document.getElementById("mappingRankLabel");
  const mappingFeedback = document.getElementById("mappingFeedback");
  mappingKind.addEventListener("change",()=>{mappingRankLabel.hidden=mappingKind.value!=="rank";document.getElementById("mappingRank").required=mappingKind.value==="rank";});
  mappingForm.addEventListener("submit",async e=>{
    e.preventDefault(); const payload={kind:mappingKind.value,group_id:document.getElementById("mappingGroup").value,
      rank:document.getElementById("mappingRank").value,discord_role_id:document.getElementById("mappingRole").value};
    mappingFeedback.textContent="Saving…";
    try { await writeMapping("POST",payload); mappingFeedback.textContent="Mapping saved."; await loadData(); }
    catch(err){mappingFeedback.textContent=err.message;}
  });
  document.getElementById("roblox").addEventListener("click",async e=>{
    const btn=e.target.closest("button[data-map]"); if(!btn)return;
    const payload=JSON.parse(btn.dataset.map);
    if(!confirm("Remove this Roblox mapping? This may affect roles on the next sync."))return;
    mappingFeedback.textContent="Removing…";
    try{await writeMapping("DELETE",payload);mappingFeedback.textContent="Mapping removed.";await loadData();}
    catch(err){mappingFeedback.textContent=err.message;}
  });

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:14px";
  const refreshBtn = document.createElement("button");
  refreshBtn.className = "button secondary dash-button";
  refreshBtn.textContent = "↻ Refresh data";
  refreshBtn.disabled = true;
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search logs, roles and mappings…";
  search.setAttribute("aria-label", "Search dashboard data");
  search.style.cssText = "background:#0a172d;color:#fff;border:1px solid #294366;border-radius:8px;padding:10px;flex:1;min-width:200px";
  search.disabled = true;
  controls.append(refreshBtn, search);
  status.before(controls);
  const summary = document.createElement("p");
  summary.className = "dash-muted";
  controls.after(summary);
  function matching(row) { return !searchText || row.some(v => String(v ?? "").toLowerCase().includes(searchText)); }
  function filtered(rows) { return rows.filter(matching); }
  function render() {
    if (!currentData) return;
    const {l,r,rb,a} = currentData;
    const logs = (l.logs||[]).map(x=>[x.case_date&&x.case_no?`${x.case_date}-${String(x.case_no).padStart(2,"0")}`:x.id,x.action,x.user_id,x.moderator_id,x.reason,x.created_at?new Date(Number(x.created_at)*1000).toLocaleString():"—"]);
    const roles = (r.roles||[]).map(x=>[x.name,x.position,x.id]);
    const ranks = (rb.rank_mappings||[]).map(x=>[x.group_id,x.rank,x.discord_role_id]);
    const bindings = (rb.group_bindings||[]).map(x=>[x.group_id,x.discord_role_id]);
    const sessions = (a.ssu_sessions||[]).map(x=>[x.id,x.host_id,x.channel_id,x.started_at?new Date(Number(x.started_at)*1000).toLocaleString():"—",x.ended_at?new Date(Number(x.ended_at)*1000).toLocaleString():"In progress"]);
    document.getElementById("logs").innerHTML=table(["Case","Action","User ID","Moderator ID","Reason","Created"],filtered(logs));
    document.getElementById("roles").innerHTML=table(["Role","Position","Role ID"],filtered(roles));
    const mappingTable = (kind, data) => {
      if (!data.length) return '<p class="dash-empty">No mappings found.</p>';
      return `<div class="dash-scroll"><table class="dash-table"><thead><tr><th>Group</th>${kind==="rank"?"<th>Rank</th>":""}<th>Discord role</th><th>Action</th></tr></thead><tbody>${data.map(x=>{
        const payload={kind,group_id:x.group_id,discord_role_id:x.discord_role_id};if(kind==="rank")payload.rank=x.rank;
        const roleName=(r.roles||[]).find(z=>z.id===x.discord_role_id)?.name||x.discord_role_id;
        return `<tr><td>${safe(x.group_id)}</td>${kind==="rank"?`<td>${safe(x.rank)}</td>`:""}<td>${safe(roleName)}</td><td><button class="button secondary dash-button" data-map='${safe(JSON.stringify(payload))}'>Remove</button></td></tr>`;
      }).join("")}</tbody></table></div>`;
    };
    document.getElementById("roblox").innerHTML=`<h3>Rank mappings</h3>${mappingTable("rank",(rb.rank_mappings||[]).filter(x=>matching([x.group_id,x.rank,x.discord_role_id])))}<h3>Group bindings</h3>${mappingTable("group",(rb.group_bindings||[]).filter(x=>matching([x.group_id,x.discord_role_id])))}`;
    const roleSelect=document.getElementById("mappingRole"), previous=roleSelect.value;
    roleSelect.innerHTML='<option value="">Choose a role</option>'+(r.roles||[]).filter(x=>!x.managed && x.name!=="@everyone").map(x=>`<option value="${safe(x.id)}">${safe(x.name)}</option>`).join("");
    roleSelect.value=previous;
    document.getElementById("announcements").innerHTML=`<p><b>Announcement opt-ins:</b> ${safe(a.opted_in_count||0)}</p><p><b>Opt-in panel channel:</b> ${safe(a.opt_in_panel_channel_id||"Not configured")}</p><h3>Recent SSU sessions</h3>${table(["Session","Host ID","Channel ID","Started","Ended"],filtered(sessions))}`;
    summary.textContent=`${filtered(logs).length} moderation cases · ${filtered(roles).length} roles · ${filtered(ranks).length+filtered(bindings).length} mappings · ${filtered(sessions).length} SSU sessions`;
  }
  async function loadData(){
    const gid=guildSelect.value;
    if(!gid||isLoading)return;
    isLoading=true;refreshBtn.disabled=true;setStatus("Loading server data…");
    try {
      const [l,r,rb,a]=await Promise.all([get(`/api/guilds/${encodeURIComponent(gid)}/logs?limit=100`),get(`/api/guilds/${encodeURIComponent(gid)}/roles`),get(`/api/guilds/${encodeURIComponent(gid)}/roblox-mappings`),get(`/api/guilds/${encodeURIComponent(gid)}/announcement-settings`)]);
      currentData={l,r,rb,a};search.disabled=false;render();
      setStatus("Connected. Last refreshed: "+new Date().toLocaleTimeString()+" · Read-only data.");
    } catch(e) {setStatus(e.message||"Could not load dashboard data.");}
    finally {isLoading=false;refreshBtn.disabled=false;}
  }
  refreshBtn.addEventListener("click",loadData);
  search.addEventListener("input",()=>{searchText=search.value.trim().toLowerCase();render();});
  async function init(){if(!configured()){setStatus("Setup required: edit dashboard-config.js and replace SET-YOUR-API-HOST with your secure HTTPS API address.");loginBtn.disabled=true;return}loginBtn.disabled=false;try{const me=await get("/api/me");csrf=me.csrf||"";loginBtn.hidden=true;logoutBtn.hidden=false;const g=await get("/api/guilds");guildSelect.innerHTML="";for(const item of g.guilds||[]){const o=document.createElement("option");o.value=item.id;o.textContent=item.name;guildSelect.appendChild(o)}guildSelect.disabled=!g.guilds?.length;if(!g.guilds?.length){guildSelect.innerHTML='<option>No manageable servers with the bot</option>';setStatus("No servers found where you have Manage Server/Administrator and the bot is present.");return}await loadData()}catch(e){loginBtn.hidden=false;logoutBtn.hidden=true;guildSelect.disabled=true;setStatus(e.message||"Sign in to continue.")}}
  loginBtn.addEventListener("click",()=>{if(configured())location.href=api+"/api/login"});
  logoutBtn.addEventListener("click",async()=>{try{await fetch(api+"/api/logout",{method:"POST",credentials:"include",headers:{"X-Pulse-CSRF":csrf}})}catch{}location.reload()});
  guildSelect.addEventListener("change",()=>{currentData=null;summary.textContent="";loadData();});init();
})();
