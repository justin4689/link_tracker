async function loadUsers() {
  const res   = await fetch('/admin/api/users');
  const data  = await res.json();
  const users = data.users || [];

  document.getElementById('user-count').textContent = users.length + ' utilisateur' + (users.length > 1 ? 's' : '');

  document.getElementById('users-table').innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:500;">${u.username}</td>
      <td>
        <span class="badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}">
          ${u.role === 'admin' ? 'Admin' : 'Utilisateur'}
        </span>
      </td>
      <td>${u.link_count}</td>
      <td style="color:var(--muted); font-size:12px;">${new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        ${u.role !== 'admin' ? `
          <button class="copy-btn" style="color:var(--danger-text); border-color:var(--danger-text);"
            onclick="deleteUser(${u.id}, '${u.username}')">
            Supprimer
          </button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function createUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value.trim();
  const errEl    = document.getElementById('create-error');
  const okEl     = document.getElementById('create-success');

  errEl.style.display = 'none';
  okEl.style.display  = 'none';

  const res  = await fetch('/admin/api/users', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    errEl.textContent   = data.error;
    errEl.style.display = 'block';
    return;
  }

  okEl.textContent    = `Utilisateur "${data.username}" créé avec succès.`;
  okEl.style.display  = 'block';
  document.getElementById('new-username').value = '';
  document.getElementById('new-password').value = '';
  loadUsers();
}

async function deleteUser(id, username) {
  if (!confirm(`Supprimer "${username}" et toutes ses données ?`)) return;

  const res = await fetch(`/admin/api/users/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadUsers();
  } else {
    const data = await res.json();
    alert(data.error);
  }
}

function confirmReset() {
  document.getElementById('reset-modal').classList.add('open');
}

async function resetDb() {
  const res = await fetch('/admin/api/reset', { method: 'POST' });
  document.getElementById('reset-modal').classList.remove('open');
  if (res.ok) {
    alert('Base de données réinitialisée.');
    loadUsers();
  }
}

document.getElementById('reset-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('reset-modal'))
    document.getElementById('reset-modal').classList.remove('open');
});

loadUsers();
