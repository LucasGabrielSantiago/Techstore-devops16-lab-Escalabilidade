# 🎨 TechStore - Frontend

Tela de login da TechStore, integrada à API.

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript puro (sem framework e sem etapa de build)
- Fontes: Space Grotesk e Inter (Google Fonts)

## 📁 Estrutura

```
frontend/
├── index.html
├── css/style.css
├── js/api.js        # cliente da API (fetch) — lê o cabeçalho X-Instance
├── js/main.js       # comportamento da tela de login
├── js/products.js   # (reservado para a tela de produtos)
└── images/          # techstore-mark.png (símbolo), favicon.png, logo completo
```

## 🚀 Como Rodar o Frontend Localmente

**Com Docker (recomendado):** na raiz do projeto, rode `docker compose up -d --build` e acesse
http://localhost:8080. O Nginx serve o frontend e encaminha `/api/*` para as réplicas da API.

**Com Live Server (VS Code), para editar o visual:** mantenha o `docker compose` rodando e abra o
`index.html` com o Live Server (porta 5500). O `api.js` detecta isso e aponta para `http://localhost:8080/api`.

## 🔌 Integração

| Ação | Endpoint |
|---|---|
| Carregar a página | `GET /api/health` |
| Entrar | `POST /api/auth/login` |

"Servido por", no rodapé do painel esquerdo, mostra qual réplica da API atendeu a última requisição.
É assim que o balanceamento de carga aparece durante a demonstração.
