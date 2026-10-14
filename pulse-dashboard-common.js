const API=(window.PULSE_DASHBOARD_CONFIG?.apiBaseUrl||'').replace(/\/$/,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function apiGet(path){const r=await fetch(API+path,{credentials:'include'});if(!r.ok)throw new Error(r.status===401?'Please sign in with Discord.':(await r.text()).slice(0,180)||`HTTP ${r.status}`);return r.json()}
function login(){location.href=API+'/api/login'}
function iconFor(g){return g.icon?`<img alt="" src="https://cdn.discordapp.com/icons/${encodeURIComponent(g.id)}/${encodeURIComponent(g.icon)}.png?size=128">`:esc(g.name.slice(0,1).toUpperCase())}
function renderSidebar(guilds){document.getElementById('sidebarServers').innerHTML=guilds.filter(g=>g.dashboard_access).map(g=>`<a class="side-link" href="server-dashboard.html?guild=${encodeURIComponent(g.id)}">${esc(g.name)}</a>`).join('')||'<div class="muted tiny">No manageable servers</div>'}
