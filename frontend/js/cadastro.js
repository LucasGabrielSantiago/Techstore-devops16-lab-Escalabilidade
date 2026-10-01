(function(){
  // Já está logado? Não precisa criar conta.
  if (session.token()) {
    location.replace('painel.html');
    return;
  }

  var form = document.getElementById('signupForm');
  var statusEl = document.getElementById('status');
  var instanceEl = document.getElementById('instance');
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setStatus(msg, isError){
    statusEl.style.color = isError ? '#ff6b6b' : 'var(--blue-store)';
    statusEl.textContent = msg;
  }

  // Mostra qual réplica da API atendeu a última requisição
  document.addEventListener('api:instance', function(e){
    if (e.detail) instanceEl.textContent = e.detail;
  });

  api.health().catch(function(){
    instanceEl.textContent = 'offline';
    setStatus('API indisponível no momento. Tente novamente em instantes.', true);
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var nome = document.getElementById('nome').value.trim();
    var email = document.getElementById('email').value.trim();
    var senha = document.getElementById('senha').value;
    var confirmar = document.getElementById('confirmar').value;
    var btn = document.getElementById('submitBtn');

    // Validação no navegador (a API valida de novo: nunca confie só no frontend)
    if (!nome || !email || !senha || !confirmar) return setStatus('Preencha todos os campos.', true);
    if (!EMAIL_REGEX.test(email))                return setStatus('Informe um e-mail válido.', true);
    if (senha.length < 6)                        return setStatus('A senha deve ter no mínimo 6 caracteres.', true);
    if (senha !== confirmar)                     return setStatus('As senhas não conferem.', true);

    btn.dataset.state = 'loading';
    btn.disabled = true;
    btn.textContent = 'Criando conta…';
    setStatus('', false);

    api.register(nome, email, senha)
      .then(function(r){
        if (!r.ok) {
          setStatus(r.data.message || 'Não foi possível criar a conta.', true);
          return false;
        }
        location.href = 'index.html?cadastro=ok&email=' + encodeURIComponent(email);
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
        btn.textContent = 'Criar conta';
      });
  });
})();
