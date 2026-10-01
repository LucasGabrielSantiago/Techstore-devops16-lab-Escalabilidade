# 🎨 TechStore - Frontend

Telas de cadastro, login e painel da TechStore, integradas à API.

## 🛠️ Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript puro (sem framework e sem etapa de build)
- Fontes: Space Grotesk e Inter (Google Fonts)

## 📁 Estrutura

```
frontend/
├── index.html       # login
├── cadastro.html    # criar conta
├── painel.html      # página após o login (exige token)
├── css/style.css    # visual base (login e cadastro)
├── css/painel.css   # visual do painel
├── js/api.js        # cliente da API + sessão (token JWT); envia o token e trata 401
├── js/main.js       # tela de login
├── js/cadastro.js   # tela de cadastro
├── js/painel.js     # painel: usuário logado, produtos, réplicas e "Sair"
├── js/products.js   # renderização dos cards de produto
└── images/          # techstore-mark.png (símbolo), favicon.png, logo completo
```

## 🔐 Fluxo do usuário

```
cadastro.html ──(conta criada)──▶ index.html ──(login OK, token salvo)──▶ painel.html
                                      ▲                                        │
                                      └────────(Sair ou token expirado)────────┘
```

- **Login:** a API devolve um **token JWT**. "Manter conectado" guarda o token no `localStorage`
  (sobrevive ao fechar o navegador); desmarcado, no `sessionStorage`.
- **Cada chamada à API** leva o cabeçalho `Authorization: Bearer <token>`.
- **Se a API responder 401** (token inválido ou expirado), o `api.js` apaga o token e volta para o login.
- **Quem já está logado** e abre o login ou o cadastro vai direto para o painel.

## 🚀 Como Rodar o Frontend Localmente

**Com Docker (recomendado):** na raiz do projeto, rode `docker compose up -d --build` e acesse
http://localhost:8080. O Nginx serve o frontend e encaminha `/api/*` para as réplicas da API.

**Com Live Server (VS Code), para editar o visual:** mantenha o `docker compose` rodando e abra o
`index.html` com o Live Server (porta 5500). O `api.js` detecta isso e aponta para `http://localhost:8080/api`.

## 🔌 Integração

| Ação | Endpoint |
|---|---|
| Carregar as páginas | `GET /api/health` |
| Criar conta | `POST /api/auth/register` |
| Entrar | `POST /api/auth/login` (devolve `token` e `user`) |
| Confirmar o login no painel | `GET /api/auth/me` (exige token) |
| Listar produtos | `GET /api/products` |

## ⚖️ Balanceamento visível

- **"Servido por"** mostra qual réplica da API atendeu a última requisição.
- No painel, **"Réplicas que validaram seu login"** lista cada réplica que aceitou o mesmo token.
  Clique em **Atualizar** algumas vezes: a lista cresce, provando que o login (JWT) funciona
  em qualquer réplica, sem sessão guardada na memória da API.
