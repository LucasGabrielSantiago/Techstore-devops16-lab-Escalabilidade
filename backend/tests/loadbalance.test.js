// Verifica se o Nginx está distribuindo as requisições entre as réplicas.
// Faz N requisições ao /api/health e conta quantas instâncias diferentes responderam.
// Uso: API_URL=http://localhost:8080 EXPECTED_INSTANCES=2 npm run test:lb
require("dotenv").config();

const BASE_URL = process.env.API_URL || "http://localhost:8080";
const EXPECTED = Number(process.env.EXPECTED_INSTANCES || 2);
const REQUESTS = Number(process.env.REQUESTS || 30);

async function run() {
    console.log(`\n⚖️  Testando balanceamento em ${BASE_URL} (${REQUESTS} requisições)...\n`);

    const counts = {};
    for (let i = 0; i < REQUESTS; i++) {
        const res = await fetch(`${BASE_URL}/api/health`);
        const { instance } = await res.json();
        counts[instance] = (counts[instance] || 0) + 1;
    }

    console.table(counts);
    const distinct = Object.keys(counts).length;

    if (distinct < EXPECTED) {
        console.error(`❌ Esperava ${EXPECTED} instâncias, apenas ${distinct} responderam.`);
        process.exit(1);
    }
    console.log(`✔ ${distinct} instâncias atendendo requisições. Balanceamento OK!`);
}

run().catch((err) => {
    console.error("❌ Erro:", err.message);
    process.exit(1);
});
