(function(){
  var toggleVis = document.getElementById('toggleVis');
  var senha = document.getElementById('senha');
  var eyeIcon = document.getElementById('eyeIcon');
  var statusEl = document.getElementById('status');
  var instanceEl = document.getElementById('instance');
  var pressed = false;

  function setStatus(msg, isError){
    statusEl.style.color = isError ? '#ff6b6b' : 'var(--blue-store)';
    statusEl.textContent = msg;
  }

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
    var emailVal = document.getElementById('login').value.trim();
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
          return;
        }
        // "Manter conectado": localStorage sobrevive ao fechar o navegador; sessionStorage não
        var storage = remember ? localStorage : sessionStorage;
        try { storage.setItem('techstore:user', JSON.stringify(r.data.user)); } catch(_) {}

        setStatus('Bem-vindo, ' + r.data.user.name + '! Atendido pela instância ' + r.instance + '.', false);
        senha.value = '';
      })
      .catch(function(){
        setStatus('Não foi possível conectar à API.', true);
      })
      .then(function(){
        btn.dataset.state = '';
        btn.disabled = false;
        btn.textContent = 'Entrar';
      });
  });
})();
