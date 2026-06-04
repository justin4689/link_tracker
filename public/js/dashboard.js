// ---- State ----
let allLinks  = [];
let allClicks = [];
let todayCount = 0;

// ---- Init ----
document.getElementById('current-date').textContent =
  new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

// ---- API ----
async function loadStats() {
  try {
    const res  = await fetch('/api/stats');
    const data = await res.json();
    allLinks   = data.links        || [];
    allClicks  = data.recent       || [];
    todayCount = data.todayClicks  || 0;
    updateStatCards();
    renderLinksSummary();
  } catch (e) {
    console.error('Erreur chargement stats:', e);
  }
}

// ---- Stat cards ----
function updateStatCards() {
  const totalClicks = allLinks.reduce((s, l) => s + (l.clicks || 0), 0);
  document.getElementById('s-total').textContent       = totalClicks;
  document.getElementById('s-total-delta').textContent = `↑ +${todayCount} aujourd'hui`;
  document.getElementById('s-links').textContent       = allLinks.length;

  const countries = new Set(allClicks.map(c => c.country).filter(c => c && c !== 'Inconnu'));
  document.getElementById('s-countries').textContent       = countries.size;
  document.getElementById('s-countries-delta').textContent = [...countries].slice(0, 3).join(', ') || '—';

  const mobileCount   = allClicks.filter(c => c.device === 'mobile').length;
  const mobilePercent = allClicks.length ? Math.round(mobileCount / allClicks.length * 100) : 0;
  document.getElementById('s-mobile').textContent       = mobilePercent + '%';
  document.getElementById('s-mobile-delta').textContent = mobilePercent >= 50 ? 'mobile dominant' : 'desktop dominant';
}

// ---- Liens résumé (dashboard) ----
function renderLinksSummary() {
  if (!allLinks.length) {
    document.getElementById('links-summary').innerHTML =
      '<p style="color:var(--muted);font-size:13px;padding:16px 0;">Aucun lien créé pour l\'instant.</p>';
    return;
  }
  const max = Math.max(...allLinks.map(l => l.clicks || 0), 1);
  document.getElementById('links-summary').innerHTML = allLinks.map(l => `
    <div class="link-row">
      <div style="min-width:0; flex:1;">
        <div class="link-name">${l.campaign || 'sans-nom'}</div>
        <div class="link-url">${window.location.host}/track/${l.id}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((l.clicks || 0) / max * 100)}%"></div></div>
      </div>
      <div class="link-meta">
        <div style="text-align:right;">
          <div class="link-count">${l.clicks || 0}</div>
          <div class="link-count-label">clics</div>
        </div>
        <span class="badge badge-success">actif</span>
      </div>
    </div>
  `).join('');
}

// ---- Liens complets ----
function renderLinksFull() {
  if (!allLinks.length) {
    document.getElementById('links-full').innerHTML =
      '<p style="color:var(--muted);font-size:13px;padding:16px 0;">Aucun lien créé pour l\'instant.</p>';
    return;
  }
  document.getElementById('links-full').innerHTML = allLinks.map(l => `
    <div class="link-row">
      <div style="min-width:0; flex:1;">
        <div class="link-name">${l.campaign || 'sans-nom'}</div>
        <div class="link-url">${window.location.host}/track/${l.id} → ${l.destination}</div>
        <div style="font-size:11px; color:var(--muted); margin-top:2px;">Créé le ${new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
      </div>
      <div class="link-meta">
        <div style="text-align:right;">
          <div class="link-count">${l.clicks || 0}</div>
          <div class="link-count-label">clics</div>
        </div>
        <button class="btn" style="font-size:12px;padding:5px 12px;" onclick="showDetail('${l.id}')">Voir détails</button>
        <button class="copy-btn" onclick="copyText('${window.location.origin}/track/${l.id}', this)">Copier</button>
        <span class="badge badge-success">actif</span>
      </div>
    </div>
  `).join('');
}

// ---- Journal clics ----
function renderClicksFull() {
  const totalClicks = allLinks.reduce((s, l) => s + (l.clicks || 0), 0);
  document.getElementById('click-count-badge').textContent = totalClicks + ' clics';
  if (!allClicks.length) {
    document.getElementById('clicks-full-table').innerHTML =
      '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:24px;">Aucun clic enregistré.</td></tr>';
    return;
  }
  document.getElementById('clicks-full-table').innerHTML = allClicks.map(c => `
    <tr>
      <td class="mono">${c.ip}</td>
      <td>${c.country}</td>
      <td>${c.city}</td>
      <td>${c.browser}</td>
      <td>${c.os}</td>
      <td>${c.device === 'mobile' ? '📱 Mobile' : '🖥 Desktop'}</td>
      <td><span class="badge badge-info">${c.link_id}</span></td>
      <td style="color:var(--muted);font-size:12px;">${new Date(c.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</td>
    </tr>
  `).join('');
}

// ---- Navigation ----
function showTab(tab) {
  ['dashboard', 'links', 'clics', 'detail'].forEach(t => {
    document.getElementById('page-' + t).style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navIdx = ['dashboard', 'links', 'clics'].indexOf(tab);
  if (navIdx >= 0) document.querySelectorAll('.nav-item')[navIdx]?.classList.add('active');
  if (tab === 'links') renderLinksFull();
  if (tab === 'clics') renderClicksFull();
}

// ---- Page détail lien ----
async function showDetail(linkId) {
  showTab('detail');
  document.getElementById('detail-title').textContent = 'Chargement…';
  document.getElementById('detail-sub').textContent   = '';

  try {
    const res  = await fetch(`/api/links/${linkId}/clicks`);
    const data = await res.json();

    document.getElementById('detail-title').textContent = data.link.campaign || 'sans-nom';
    document.getElementById('detail-sub').textContent   =
      `${data.link.destination} · créé le ${new Date(data.link.created_at).toLocaleDateString('fr-FR')}`;

    const trackUrl = `${window.location.origin}/track/${linkId}`;
    const copyBtn  = document.getElementById('detail-copy-btn');
    copyBtn.onclick = () => navigator.clipboard.writeText(trackUrl).then(() => {
      copyBtn.textContent = '✓ Copié !';
      setTimeout(() => copyBtn.textContent = 'Copier le lien', 2000);
    });

    document.getElementById('detail-total').textContent = data.clicks.length;
    const countries = new Set(data.clicks.map(c => c.country).filter(c => c && c !== 'Inconnu'));
    document.getElementById('detail-countries').textContent = countries.size;
    const mobile = data.clicks.filter(c => c.device === 'mobile').length;
    document.getElementById('detail-mobile').textContent =
      data.clicks.length ? Math.round(mobile / data.clicks.length * 100) + '%' : '0%';
    const browsers = new Set(data.clicks.map(c => c.browser).filter(c => c && c !== 'Inconnu'));
    document.getElementById('detail-browsers').textContent = browsers.size;

    // Journal clics
    document.getElementById('detail-clicks-table').innerHTML = data.clicks.length
      ? data.clicks.map(c => `
          <tr>
            <td class="mono">${c.ip}</td>
            <td>${c.country}</td>
            <td>${c.city}</td>
            <td>${c.browser}</td>
            <td>${c.os}</td>
            <td>${c.device === 'mobile' ? '📱 Mobile' : '🖥 Desktop'}</td>
            <td style="color:var(--muted);font-size:12px;">${new Date(c.created_at).toLocaleString('fr-FR')}</td>
          </tr>`).join('')
      : '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:24px;">Aucun clic pour ce lien.</td></tr>';

  } catch (e) {
    console.error('Erreur chargement détail:', e);
  }
}

// ---- Modal ----
function openModal() {
  document.getElementById('modal').classList.add('open');
  document.getElementById('result-box').classList.remove('open');
  document.getElementById('input-dest').value     = '';
  document.getElementById('input-campaign').value = '';
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

async function createLink() {
  const dest = document.getElementById('input-dest').value.trim();
  const camp = document.getElementById('input-campaign').value.trim() || 'sans-nom';
  if (!dest) { alert('Veuillez entrer une URL de destination.'); return; }

  const btn     = document.querySelector('#modal .btn-primary');
  btn.textContent = 'Création…';
  btn.disabled    = true;

  try {
    const res  = await fetch('/api/links', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ destination: dest, campaign: camp })
    });
    const data = await res.json();
    document.getElementById('result-url').textContent = data.url;
    document.getElementById('result-box').classList.add('open');
    await loadStats();
  } catch (e) {
    alert('Erreur lors de la création du lien.');
  } finally {
    btn.textContent = 'Générer le lien';
    btn.disabled    = false;
  }
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copié!';
    setTimeout(() => btn.textContent = 'Copier', 2000);
  });
}

function copyLink() {
  const url = document.getElementById('result-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('#result-box .copy-btn');
    btn.textContent = '✓ Copié !';
    setTimeout(() => btn.textContent = 'Copier le lien', 2000);
  });
}

// ---- Démarrage ----
loadStats();
setInterval(loadStats, 30000);
