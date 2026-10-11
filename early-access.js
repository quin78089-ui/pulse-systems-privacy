/* Pulse Systems V1.3: read-only dashboard summary, using existing Discord session. */
(() => {
  const output = document.getElementById('pulseEarlyAccessStats');
  const select = document.getElementById('guildSelect');
  if (!output || !select) return;
  const api = String(window.PULSE_API_BASE || window.PULSE_API_URL || '').replace(/\/$/, '');
  async function refresh() {
    const guild = select.value;
    if (!guild || !/^https:\/\//.test(api)) return;
    try {
      const response = await fetch(`${api}/api/guilds/${encodeURIComponent(guild)}/early-access`, {credentials:'include'});
      if (!response.ok) throw new Error(`Summary unavailable (${response.status})`);
      const data = await response.json();
      const tickets = data.tickets || {};
      output.textContent = `Free Early Access · Open tickets: ${tickets.open || 0} · Closed tickets: ${tickets.closed || 0} · XP members: ${(data.xp || {}).members || 0}`;
    } catch (error) { output.textContent = 'Early Access summary unavailable. Other dashboard features are unaffected.'; }
  }
  select.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', () => {if (!document.hidden) refresh();});
  setTimeout(refresh, 1500);
})();
