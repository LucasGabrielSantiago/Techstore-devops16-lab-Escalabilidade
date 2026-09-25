// ==========================================
// TechStore - Teste de carga (k6)
//
// Roda na MESMA rede do Compose (funciona em PowerShell, Git Bash, Linux e Mac):
//   docker run --rm --network techstore_default -e BASE_URL=http://nginx \
//     -v "${PWD}/loadtest:/scripts" grafana/k6 run /scripts/load-test.js
//
// Perfis (variável PROFILE):
//   smoke -> 5 usuários por 20s (usado no CI, só valida que aguenta)
//   load  -> sobe até 50 usuários (padrão, usado na comparação 2 vs 5 réplicas)
// ==========================================
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const PROFILE = __ENV.PROFILE || "load";

const profiles = {
    smoke: [
        { duration: "20s", target: 5 }
    ],
    load: [
        { duration: "20s", target: 10 },  // demanda normal
        { duration: "40s", target: 50 },  // pico
        { duration: "20s", target: 50 },  // sustenta o pico
        { duration: "20s", target: 0 }    // demanda cai
    ]
};

export const options = {
    stages: profiles[PROFILE],
    thresholds: {
        http_req_failed: ["rate<0.01"],        // menos de 1% de erro, senão o teste FALHA
        http_req_duration: ["p(95)<2000"]      // 95% das requisições abaixo de 2s
    }
};

const LOAD_USER = { name: "Load Test", email: "k6@techstore.local", password: "k6-senha-123" };

// Executa uma vez antes do teste: garante que o usuário de carga existe
export function setup() {
    // 400 = usuário já existe (execuções seguintes). Não conta como falha no http_req_failed.
    const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(LOAD_USER), {
        headers: { "Content-Type": "application/json" },
        responseCallback: http.expectedStatuses(201, 400)
    });
    check(res, { "usuário de teste pronto (201 ou já existe)": (r) => r.status === 201 || r.status === 400 });
}

export default function () {
    // 70% leitura de catálogo (depende do banco) / 30% login (bcrypt = uso intenso de CPU)
    if (Math.random() < 0.7) {
        const res = http.get(`${BASE_URL}/api/products`, { tags: { endpoint: "products" } });
        check(res, { "GET /products 200": (r) => r.status === 200 });
    } else {
        const res = http.post(
            `${BASE_URL}/api/auth/login`,
            JSON.stringify({ email: LOAD_USER.email, password: LOAD_USER.password }),
            { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } }
        );
        check(res, { "POST /login 200": (r) => r.status === 200 });
    }
    sleep(0.5);
}
