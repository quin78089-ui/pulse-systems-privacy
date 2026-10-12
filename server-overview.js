/* Pulse Systems V1.4: authenticated read-only server overview. */
(() => {
  const select = document.getElementById('guildSelect');
  const status = document.getElementById('pulseOverviewStatus');
  const metrics = ['pulseOpenTickets', 'pulseClosedTickets', 'pulseXpMembers'].map(id => document.getElementById(id));
  if (!select || !status || metrics.some(el => !el)) return;
  const base = String(window.PULSE_API_BASE || window.PULSE_API_URL || '').replace(/\/$/, '');
  let generation = 0;
  const number = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';
  async function refresh() {
    const current = ++generation;
    const guild = select.value;
    if (!guild || !/^\d+$/.test(guild)) {
      metrics.forEach(el => el.textContent = '—');
      status.textContent = 'Sign in and select a server to view statistics.';
      return;
    }
    if (!/^https:\/\//i.test(base)) {
      status.textContent = 'Configure a secure dashboard API URL to load statistics.';
      return;
    }
    status.textContent = 'Loading server statistics…';
    try {
      const response = await fetch(`${base}/api/guilds/${encodeURIComponent(guild)}/overview`, {credentials:'include', cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (current !== generation) return;
      const tickets = data.tickets || {};
      metrics[0].textContent = number(tickets.open ?? 0);
      metrics[1].textContent = number(tickets.closed ?? 0);
      metrics[2].textContent = number((data.xp || {}).members ?? 0);
      status.textContent = 'Statistics updated. All currently available core features are free.';
    } catch (error) {
      if (current !== generation) return;
      metrics.forEach(el => el.textContent = '—');
      status.textContent = 'Statistics unavailable. Check your dashboard API connection and sign-in.';
    }
  }
  select.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('focus', refresh);
  setTimeout(refresh, 1200);
})();
