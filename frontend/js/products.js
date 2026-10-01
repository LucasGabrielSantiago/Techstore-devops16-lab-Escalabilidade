// ==========================================
// TechStore - renderização da lista de produtos
// Usa textContent (nunca innerHTML) com dados vindos da API,
// para que um nome de produto não consiga injetar HTML/script na página.
// ==========================================
var products = (function () {
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function card(p) {
    var article = el('article', 'product-card');
    article.appendChild(el('h2', 'product-name', p.name));

    var hasDesc = p.description && String(p.description).trim();
    article.appendChild(el('p', 'product-desc' + (hasDesc ? '' : ' empty'), hasDesc ? p.description : 'Sem descrição.'));

    var bottom = el('div', 'product-bottom');
    bottom.appendChild(el('span', 'product-price', brl.format(Number(p.price) || 0)));
    var stock = Number(p.stock) || 0;
    bottom.appendChild(el('span', 'stock' + (stock > 0 ? '' : ' out'), stock > 0 ? stock + ' em estoque' : 'Esgotado'));
    article.appendChild(bottom);
    return article;
  }

  function render(container, list) {
    container.textContent = '';
    if (!list.length) {
      container.appendChild(el('div', 'empty-state', 'Nenhum produto cadastrado ainda.'));
      return;
    }
    list.forEach(function (p) { container.appendChild(card(p)); });
  }

  return { render: render };
})();
