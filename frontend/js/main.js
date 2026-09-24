  var toggleVis = document.getElementById('toggleVis');
  var senha = document.getElementById('senha');
  var eyeIcon = document.getElementById('eyeIcon');
  var pressed = false;

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
    var status = document.getElementById('status');
    status.textContent = 'Enviaremos instruções de recuperação para o e-mail cadastrado.';
  });

  document.getElementById('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    var btn = document.getElementById('submitBtn');
    var status = document.getElementById('status');
    var loginVal = document.getElementById('login').value.trim();
    var senhaVal = senha.value;

    if(!loginVal || !senhaVal){
      status.style.color = '#ff6b6b';
      status.textContent = 'Preencha login e senha para continuar.';
      return;
    }

    btn.dataset.state = 'loading';
    btn.textContent = 'Entrando…';
    status.style.color = 'var(--blue-store)';
    status.textContent = '';

    setTimeout(function(){
      btn.dataset.state = '';
      btn.textContent = 'Entrar';
      status.textContent = 'Formulário pronto para integração com seu backend de autenticação.';
    }, 900);
  });