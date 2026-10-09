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
    document.getElementById("roblox").innerHTML=`<h3>Rank mappings</h3>${table(["Roblox group","Rank ID","Discord role ID"],filtered(ranks))}<h3 style="margin-top:20px">Group bindings</h3>${table(["Roblox group","Discord role ID"],filtered(bindings))}`;
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
