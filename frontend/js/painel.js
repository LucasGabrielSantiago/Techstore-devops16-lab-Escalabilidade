(function(){
  // Sem token: esta página é só para quem está logado
  if (!session.token()) {
    location.replace('index.html');
    return;
  }

  var userNameEl = document.getElementById('userName');
  var userEmailEl = document.getElementById('userEmail');
  var instanceEl = document.getElementById('instance');
  var seenEl = document.getElementById('instancesSeen');
  var grid = document.getElementById('productGrid');
  var countEl = document.getElementById('productsCount');
  var statusEl = document.getElementById('status');
  var refreshBtn = document.getElementById('refreshBtn');
  var seen = {};

  function setStatus(msg, isError){
    statusEl.style.color = isError ? '#ff6b6b' : 'var(--blue-store)';
    statusEl.textContent = msg;
  }

  function showUser(user){
    if (!user) return;
    userNameEl.textContent = user.name;
    userEmailEl.textContent = user.email;
  }

  // Mostra qual réplica respondeu a última requisição
  document.addEventListener('api:instance', function(e){
    if (e.detail) instanceEl.textContent = e.detail;
  });

  // Mostra na hora o que já temos salvo; a confirmação vem do /api/auth/me
  showUser(session.user());

  // Confirma o login com a API. Cada chamada pode cair em outra réplica:
  // a lista de réplicas que aceitaram o token prova que o JWT é stateless.
  function checkSession(){
    return api.me().then(function(r){
      if (!r.ok) return; // 401: o api.js já limpou a sessão e voltou para o login
      showUser(r.data.user);
      if (r.instance) {
        seen[r.instance] = true;
        seenEl.textContent = Object.keys(seen).join(', ');
      }
    });
  }

  function loadProducts(){
    refreshBtn.disabled = true;
    setStatus('', false);
    return api.products()
      .then(function(r){
        if (!r.ok) throw new Error();
        products.render(grid, r.data);
        var n = r.data.length;
        countEl.textContent = n === 1 ? '1 produto no catálogo' : n + ' produtos no catálogo';
      })
      .catch(function(){
        countEl.textContent = '';
        setStatus('Não foi possível carregar os produtos.', true);
      })
      .then(function(){ refreshBtn.disabled = false; });
  }

  refreshBtn.addEventListener('click', function(){
    checkSession().then(loadProducts);
  });

  document.getElementById('logoutBtn').addEventListener('click', function(){
    session.clear();
    location.replace('index.html?saiu=1');
  });

  checkSession()
    .catch(function(){ setStatus('Não foi possível conectar à API.', true); })
    .then(loadProducts);
})();
