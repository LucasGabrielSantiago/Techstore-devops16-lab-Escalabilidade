(function(){
  // Já está logado? Vai direto para o painel.
  if (session.token()) {
    location.replace('painel.html');
    return;
  }

  var toggleVis = document.getElementById('toggleVis');
  var senha = document.getElementById('senha');
  var emailInput = document.getElementById('login');
  var eyeIcon = document.getElementById('eyeIcon');
  var statusEl = document.getElementById('status');
  var instanceEl = document.getElementById('instance');
  var pressed = false;

  function setStatus(msg, isError){
    statusEl.style.color = isError ? '#ff6b6b' : 'var(--blue-store)';
    statusEl.textContent = msg;
  }

  // Mensagens vindas de outras páginas (?cadastro=ok, ?expirou=1, ?saiu=1)
  var params = new URLSearchParams(location.search);
  if (params.get('cadastro') === 'ok') {
    setStatus('Conta criada! Entre com seu e-mail e senha.', false);
    if (params.get('email')) emailInput.value = params.get('email');
    senha.focus();
  } else if (params.get('expirou')) {
    setStatus('Sua sessão expirou. Entre novamente.', true);
  } else if (params.get('saiu')) {
    setStatus('Você saiu da sua conta.', false);
  }
  if (location.search) history.replaceState(null, '', location.pathname);

  // Mostra qual réplica da API atendeu a última requisição
  document.addEventListener('api:instance', function(e){
    if(e.detail) instanceEl.textContent = e.detail;
  });

  // Ao abrir a página, verifica se a API está no ar
  api.health()
    .then(function(r){ if(!r.ok) throw new Error(); })
    .catch(function(){
      instanceEl.textContent = 'offline';
      setStatus('API indisponível no momento. Tente novamente em instantes.', true);
    });

  toggleVis.addEventListener('click', function(){
    pressed = !pressed;
    senha.type = pressed ? 'text' : 'password';
    toggleVis.setAttribute('aria-pressed', String(pressed));
    toggleVis.setAttribute('aria-label', pressed ? 'Ocultar senha' : 'Mostrar senha');
    eyeIcon.innerHTML = pressed
      ? '<path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 4.24A9.7 9.7 0 0 1 12 4c7 0 11 7 11 7a13.2 13.2 0 0 1-3.2 3.9M6.6 6.6C3.9 8.3 2 11 2 11s4 7 11 7c1.4 0 2.6-.25 3.7-.66"/>'
      : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>';
  });

  document.getElementById('forgotLink').addEventListener('click', function(e){
    e.preventDefault();
    setStatus('Recuperação de senha ainda não disponível.', false);
  });

  document.getElementById('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    var btn = document.getElementById('submitBtn');
    var emailVal = emailInput.value.trim();
    var senhaVal = senha.value;
    var remember = document.querySelector('input[name="remember"]').checked;

    if(!emailVal || !senhaVal){
      setStatus('Preencha e-mail e senha para continuar.', true);
      return;
    }

    btn.dataset.state = 'loading';
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    setStatus('', false);

    api.login(emailVal, senhaVal)
      .then(function(r){
        if(!r.ok){
          setStatus(r.data.message || 'Não foi possível entrar.', true);
          return false;
        }
        // Guarda o token JWT; ele vai junto em cada chamada à API
        session.save(r.data.token, r.data.user, remember);
        location.href = 'painel.html';
        return true;
      })
      .catch(function(){
        setStatus('Não foi possível conectar à API.', true);
        return false;
      })
      .then(function(redirecting){
        if (redirecting) return;
        btn.dataset.state = '';
        btn.disabled = false;
        btn.textContent = 'Entrar';
      });
  });
})();
