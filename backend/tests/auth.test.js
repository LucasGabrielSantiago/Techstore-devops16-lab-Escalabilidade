// ==========================================
// Testes de autenticação (cadastro, login JWT, rotas protegidas)
// e prova de que o token vale em TODAS as réplicas.
//
// Uso: API_URL=http://localhost:8080 EXPECTED_INSTANCES=3 npm run test:auth
// ==========================================
require("dotenv").config();

const BASE_URL = process.env.API_URL || "http://localhost:8080";
const EXPECTED = Number(process.env.EXPECTED_INSTANCES || 1);
const J = { "Content-Type": "application/json" };

let failures = 0;
const check = (ok, label, extra = "") => {
    console.log(`${ok ? "✔" : "❌"} ${label}${extra ? " — " + extra : ""}`);
    if (!ok) failures++;
};

const call = async (method, path, { body, token } = {}) => {
    const headers = { ...J };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(BASE_URL + "/api" + path, {
        method, headers, body: body && JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, instance: res.headers.get("x-instance") };
};

async function run() {
    console.log(`\n🔐 Testando autenticação em ${BASE_URL}\n`);

    const email = `teste-${Date.now()}@techstore.local`;
    const password = "senha-teste-123";

    // Cadastro
    let r = await call("POST", "/auth/register", { body: { name: "Teste CI", email, password } });
    check(r.status === 201, "cadastro de usuário novo → 201", `status ${r.status}`);

    r = await call("POST", "/auth/register", { body: { name: "Teste CI", email, password } });
    check(r.status === 400, "cadastro com e-mail repetido → 400", r.data.message);

    r = await call("POST", "/auth/register", { body: { name: "X", email: "invalido", password } });
    check(r.status === 400, "cadastro com e-mail inválido → 400", r.data.message);

    r = await call("POST", "/auth/register", { body: { name: "X", email: `c-${email}`, password: "123" } });
    check(r.status === 400, "cadastro com senha curta → 400", r.data.message);

    // Login
    r = await call("POST", "/auth/login", { body: { email, password: "errada" } });
    check(r.status === 401, "login com senha errada → 401");

    r = await call("POST", "/auth/login", { body: { email, password } });
    const token = r.data.token;
    check(r.status === 200 && typeof token === "string", "login correto → 200 com token");

    // /me
    r = await call("GET", "/auth/me");
    check(r.status === 401, "GET /auth/me sem token → 401");

    r = await call("GET", "/auth/me", { token: "token-invalido" });
    check(r.status === 401, "GET /auth/me com token inválido → 401");

    r = await call("GET", "/auth/me", { token });
    check(r.status === 200 && r.data.user && r.data.user.email === email, "GET /auth/me com token → 200 e usuário certo");

    // Rotas protegidas de produtos
    const novo = { name: "Produto de teste CI", price: 10.5, stock: 1 };
    r = await call("POST", "/products", { body: novo });
    check(r.status === 401, "criar produto sem token → 401");

    r = await call("POST", "/products", { body: novo, token });
    const productId = r.data.product && r.data.product.id;
    check(r.status === 201 && productId, "criar produto com token → 201");

    if (productId) {
        r = await call("DELETE", `/products/${productId}`);
        check(r.status === 401, "apagar produto sem token → 401");
        r = await call("DELETE", `/products/${productId}`, { token });
        check(r.status === 200, "apagar produto com token → 200");
    }

    r = await call("GET", "/products");
    check(r.status === 200, "listar produtos continua público → 200");

    // O token gerado numa réplica precisa valer em todas
    const instances = {};
    let allOk = true;
    for (let i = 0; i < 30; i++) {
        const m = await call("GET", "/auth/me", { token });
        if (m.status !== 200) allOk = false;
        instances[m.instance] = (instances[m.instance] || 0) + 1;
    }
    const distinct = Object.keys(instances).length;
    console.table(instances);
    check(allOk, "30 chamadas a /auth/me com o mesmo token → todas 200");
    check(distinct >= EXPECTED, `token aceito por ${distinct} réplica(s) diferentes`, `esperado ≥ ${EXPECTED}`);

    console.log(failures === 0 ? "\n🎉 Autenticação aprovada!" : `\n❌ ${failures} verificação(ões) falharam.`);
    process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
    console.error("❌ Não foi possível conectar à API:", err.message);
    process.exit(1);
});
