// ==========================================
// TechStore - cliente da API
// ==========================================

// Servido pelo Nginx (docker compose): mesma origem, basta "/api".
// Aberto direto do disco ou pelo Live Server do VS Code: aponta para o Nginx em localhost:8080.
var API_BASE = (location.protocol === 'file:' || location.port === '5500')
  ? 'http://localhost:8080/api'
  : '/api';

// Faz a requisição e devolve { ok, status, data, instance }
// "instance" = hostname do container que respondeu (cabeçalho X-Instance)
function apiRequest(method, path, body) {
  var options = { method: method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return fetch(API_BASE + path, options)
    .then(function (res) {
      var instance = res.headers.get('X-Instance');
      document.dispatchEvent(new CustomEvent('api:instance', { detail: instance }));
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data, instance: instance };
      });
    });
}

var api = {
  health:   function ()                { return apiRequest('GET',  '/health'); },
  login:    function (email, password) { return apiRequest('POST', '/auth/login', { email: email, password: password }); },
  register: function (name, email, password) {
    return apiRequest('POST', '/auth/register', { name: name, email: email, password: password });
  },
  products: function ()                { return apiRequest('GET',  '/products'); }
};
