(() => {
  const api = (window.PULSE_API_BASE || "").replace(/\/$/, "");
  const status = document.getElementById("status");
  const guildSelect = document.getElementById("guildSelect");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  let csrf = "";
  const safe = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function configured(){return api && !api.includes("SET-YOUR-API-HOST") && /^https:\/\//i.test(api)}
  async function get(path){const r=await fetch(api+path,{credentials:"include",headers:{"Accept":"application/json"}});if(!r.ok)throw new Error(r.status===401?"Please sign in with Discord.":(await r.text()).slice(0,180)||`Request failed (${r.status})`);return r.json()}
  function table(headers, rows){if(!rows.length)return '<p class="dash-empty">No records found.</p>';return `<table class="dash-table"><thead><tr>${headers.map(x=>`<th>${safe(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${safe(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`}
  function setStatus(msg){status.textContent=msg}
  async function loadData(){const gid=guildSelect.value;if(!gid)return;setStatus("Loading server data…");try{const [l,r,rb,a]=await Promise.all([get(`/api/guilds/${gid}/logs?limit=50`),get(`/api/guilds/${gid}/roles`),get(`/api/guilds/${gid}/roblox-mappings`),get(`/api/guilds/${gid}/announcement-settings`)]);
      document.getElementById("logs").innerHTML=table(["Case","Action","User ID","Moderator ID","Reason","Created"],(l.logs||[]).map(x=>[x.case_date&&x.case_no?`${x.case_date}-${String(x.case_no).padStart(2,"0")}`:x.id,x.action,x.user_id,x.moderator_id,x.reason,x.created_at?new Date(Number(x.created_at)*1000).toLocaleString():"—"]));
      document.getElementById("roles").innerHTML=table(["Role","Position","Role ID"],(r.roles||[]).map(x=>[x.name,x.position,x.id]));
      document.getElementById("roblox").innerHTML=`<h3>Rank mappings</h3>${table(["Roblox group","Rank ID","Discord role ID"],(rb.rank_mappings||[]).map(x=>[x.group_id,x.rank,x.discord_role_id]))}<h3 style="margin-top:20px">Group bindings</h3>${table(["Roblox group","Discord role ID"],(rb.group_bindings||[]).map(x=>[x.group_id,x.discord_role_id]))}`;
      document.getElementById("announcements").innerHTML=`<p><b>Announcement opt-ins:</b> ${safe(a.opted_in_count||0)}</p><p><b>Opt-in panel channel:</b> ${safe(a.opt_in_panel_channel_id||"Not configured")}</p><h3>Recent SSU sessions</h3>${table(["Session","Host ID","Channel ID","Started","Ended"],(a.ssu_sessions||[]).map(x=>[x.id,x.host_id,x.channel_id,x.started_at?new Date(Number(x.started_at)*1000).toLocaleString():"—",x.ended_at?new Date(Number(x.ended_at)*1000).toLocaleString():"In progress"]))}`;
      setStatus("Connected. Data shown is read-only.");
    }catch(e){setStatus(e.message||"Could not load dashboard data.")}}
  async function init(){if(!configured()){setStatus("Setup required: edit dashboard-config.js and replace SET-YOUR-API-HOST with your secure HTTPS API address.");loginBtn.disabled=true;return}loginBtn.disabled=false;try{const me=await get("/api/me");csrf=me.csrf||"";loginBtn.hidden=true;logoutBtn.hidden=false;const g=await get("/api/guilds");guildSelect.innerHTML="";for(const item of g.guilds||[]){const o=document.createElement("option");o.value=item.id;o.textContent=item.name;guildSelect.appendChild(o)}guildSelect.disabled=!g.guilds?.length;if(!g.guilds?.length){guildSelect.innerHTML='<option>No manageable servers with the bot</option>';setStatus("No servers found where you have Manage Server/Administrator and the bot is present.");return}await loadData()}catch(e){loginBtn.hidden=false;logoutBtn.hidden=true;guildSelect.disabled=true;setStatus(e.message||"Sign in to continue.")}}
  loginBtn.addEventListener("click",()=>{if(configured())location.href=api+"/api/login"});
  logoutBtn.addEventListener("click",async()=>{try{await fetch(api+"/api/logout",{method:"POST",credentials:"include",headers:{"X-Pulse-CSRF":csrf}})}catch{}location.reload()});
  guildSelect.addEventListener("change",loadData);init();
})();
