// ==========================================
// TechStore - cliente da API e sessão do usuário
// ==========================================

// Servido pelo Nginx (docker compose): mesma origem, basta "/api".
// Aberto direto do disco ou pelo Live Server do VS Code: aponta para o Nginx em localhost:8080.
var API_BASE = (location.protocol === 'file:' || location.port === '5500')
  ? 'http://localhost:8080/api'
  : '/api';

// ---------- Sessão (token JWT + dados do usuário) ----------
// "Manter conectado" marcado -> localStorage (sobrevive ao fechar o navegador)
// desmarcado                 -> sessionStorage (some ao fechar a aba)
var session = (function () {
  var TOKEN = 'techstore:token';
  var USER = 'techstore:user';

  function read(key) {
    try { return localStorage.getItem(key) || sessionStorage.getItem(key); }
    catch (_) { return null; }
  }

  return {
    token: function () { return read(TOKEN); },
    user: function () {
      try { return JSON.parse(read(USER)); } catch (_) { return null; }
    },
    save: function (token, user, remember) {
      this.clear();
      try {
        var storage = remember ? localStorage : sessionStorage;
        storage.setItem(TOKEN, token);
        storage.setItem(USER, JSON.stringify(user));
      } catch (_) {}
    },
    clear: function () {
      try {
        [localStorage, sessionStorage].forEach(function (s) {
          s.removeItem(TOKEN);
          s.removeItem(USER);
        });
      } catch (_) {}
    }
  };
})();

// ---------- Requisições ----------
// Devolve { ok, status, data, instance }
// "instance" = hostname do container que respondeu (cabeçalho X-Instance)
// Envia o token automaticamente (exceto em login/cadastro).
// Se a API responder 401 a uma chamada que levou token, a sessão expirou:
// limpa o token e volta para a tela de login.
function apiRequest(method, path, body, options) {
  var useAuth = !(options && options.auth === false);
  var token = useAuth ? session.token() : null;
  var init = { method: method, headers: {} };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (token) init.headers['Authorization'] = 'Bearer ' + token;

  return fetch(API_BASE + path, init)
    .then(function (res) {
      var instance = res.headers.get('X-Instance');
      document.dispatchEvent(new CustomEvent('api:instance', { detail: instance }));

      if (res.status === 401 && token) {
        session.clear();
        location.replace('index.html?expirou=1');
      }

      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data, instance: instance };
      });
    });
}

var api = {
  health:   function ()                { return apiRequest('GET',  '/health', undefined, { auth: false }); },
  login:    function (email, password) {
    return apiRequest('POST', '/auth/login', { email: email, password: password }, { auth: false });
  },
  register: function (name, email, password) {
    return apiRequest('POST', '/auth/register', { name: name, email: email, password: password }, { auth: false });
  },
  me:       function ()                { return apiRequest('GET',  '/auth/me'); },
  products: function ()                { return apiRequest('GET',  '/products', undefined, { auth: false }); }
};
