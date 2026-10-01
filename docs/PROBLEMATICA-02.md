# Problemática 02 — Crescimento e Escalabilidade

## Arquitetura

```
                     ┌──────────── Docker Compose (rede techstore_default) ────────────┐
Cliente ──► :8080 ──►│ Nginx ──► app (réplica 1) ─┐                                     │
                     │       ├─► app (réplica 2) ─┼──► PostgreSQL ──► volume pgdata     │
                     │       └─► app (réplica N) ─┘                                     │
                     └─────────────────────────────────────────────────────────────────┘

git push ──► GitHub Actions: build ► sobe ambiente ► testes ► balanceamento ► k6 ──► Docker Hub
```

| Componente | Papel | Por que |
|---|---|---|
| API Node (Docker) | Regra de negócio, **stateless** | Sem estado local, qualquer réplica atende qualquer requisição |
| PostgreSQL | Estado compartilhado | Antes os dados ficavam em JSON dentro de cada container: com 2+ réplicas cada uma teria dados diferentes e escritas simultâneas corromperiam o arquivo |
| Nginx | Ponto de entrada único + balanceamento | Réplicas não publicam porta; o Nginx descobre as réplicas pelo DNS do Docker a cada 5s |
| Docker Compose | Ambiente declarado em código | Um comando sobe tudo igual em qualquer máquina |
| GitHub Actions | Automação | Todo push valida build, saúde, balanceamento e carga |
| k6 | Teste de carga | Mede o ganho real da escala |

## Como executar

Pré-requisito: Docker (com Compose v2).

```bash
cp .env.example .env            # ajuste DB_PASSWORD
docker compose up -d --build    # sobe banco + 2 réplicas + Nginx
docker compose ps               # todos devem estar "healthy"
```

Frontend em `http://localhost:8080` e API em `http://localhost:8080/api/health`.
Recarregue algumas vezes: o campo `instance` e o "Servido por" da tela de login mudam.

### Escalar

```bash
docker compose up -d --no-recreate --scale app=5   # aumenta
docker compose up -d --no-recreate --scale app=2   # reduz (réplicas saem com desligamento gracioso)
```

O Nginx passa a usar as novas réplicas em até 5s, sem reiniciar.

### Autoscaling simulado (Linux, Mac ou Git Bash/WSL no Windows)

```bash
./scripts/autoscale.sh    # mede CPU média das réplicas e escala entre 2 e 5
```

### Teste de carga

```bash
docker run --rm --network techstore_default -e BASE_URL=http://nginx \
  -v "${PWD}/loadtest:/scripts" grafana/k6 run /scripts/load-test.js
```

### Parar

```bash
docker compose down        # mantém os dados (volume pgdata)
docker compose down -v     # apaga também o banco
```

## Roteiro da demonstração (pitch)

1. `docker compose up -d` → mostrar `docker compose ps` com 2 réplicas healthy.
2. Abrir a tela de login e recarregar → "Servido por" alternando = balanceamento funcionando.
3. Cadastrar usuário e logar em seguida → funciona mesmo caindo em réplicas diferentes (graças ao banco compartilhado).
4. Rodar k6 com **2 réplicas** e anotar p95 e req/s.
5. `--scale app=5` (ou deixar o `autoscale.sh` rodando durante o teste) → rodar k6 de novo → comparar.
6. Reduzir para 2 → mostrar que nenhuma requisição falha no scale down.
7. Mostrar o pipeline verde no GitHub Actions e a imagem no Docker Hub.

## Resultados (preencher com os números da equipe)

| Cenário | Réplicas | p95 (ms) | req/s | Erros |
|---|---|---|---|---|
| Pico | 2 | | | |
| Pico | 5 | | | |

## Autenticação (JWT) e escalabilidade

O login usa **token JWT** em vez de sessão guardada na memória da API:

- Com várias réplicas, uma sessão em memória existiria só na réplica que fez o login. Quando o Nginx
  mandasse o usuário para outra réplica, ele "cairia".
- O JWT carrega quem é o usuário e é assinado com `JWT_SECRET`. **Qualquer réplica valida o token sozinha**,
  então a API continua *stateless*.
- **Todas as réplicas precisam da mesma `JWT_SECRET`** (vem do `.env`). Sem ela, o Compose não sobe e a API
  se recusa a iniciar.
- O teste `npm run test:auth` (também no pipeline) confirma que o mesmo token é aceito pelas 3 réplicas.

| Rota | Acesso |
|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Público |
| `GET /api/products` | Público (catálogo e teste de carga) |
| `GET /api/auth/me`, `POST/PUT/DELETE /api/products` | Exige token |

## Limitações

- **Uma única máquina:** as réplicas dividem a CPU do mesmo host. O limite de 0.5 CPU por réplica simula servidores pequenos para o ganho ser mensurável.
- **Autoscaling simulado:** o Compose não escala sozinho. O script imita o que o Kubernetes HPA faz de forma nativa.
- **Banco é ponto único de falha** e não escala junto com a API.
- **Deploy local:** o pipeline publica a imagem, mas a atualização do ambiente (`docker compose pull && docker compose up -d`) é manual.

## Evoluções futuras

- Kubernetes (k3s/minikube) com HPA para autoscaling real e múltiplos nós.
- Réplica de leitura e backup automatizado do PostgreSQL.
- Runner self-hosted para deploy contínuo no servidor.
- Métricas com Prometheus + Grafana para decidir a escala por dados.
