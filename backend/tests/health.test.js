require("dotenv").config();

// Pode apontar para a API direto (padrão) ou para o Nginx: API_URL=http://localhost:8080
const BASE_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

// Função para executar o teste de health check
async function runTest() {

    console.log("\n🧪 Iniciando testes da TechStore API...\n");

    try {
        const health = await fetch(`${BASE_URL}/api/health`);
        if (health.status !== 200) {
            console.error(`❌ /api/health falhou! Status recebido: ${health.status}`);
            process.exit(1);
        }
        const body = await health.json();
        console.log("✔ /api/health respondeu com status 200");
        console.log(`✔ Aplicação: ${body.application} v${body.version}`);
        console.log(`✔ Instância: ${body.instance}`);

        const ready = await fetch(`${BASE_URL}/api/ready`);
        if (ready.status !== 200) {
            console.error(`❌ /api/ready falhou (banco inacessível?). Status: ${ready.status}`);
            process.exit(1);
        }
        console.log("✔ /api/ready: banco de dados acessível");

        const products = await fetch(`${BASE_URL}/api/products`);
        if (products.status !== 200 || !Array.isArray(await products.json())) {
            console.error(`❌ /api/products falhou. Status: ${products.status}`);
            process.exit(1);
        }
        console.log("✔ /api/products retornou a lista de produtos");

        console.log("\n🎉 Health Check aprovado!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Não foi possível conectar à API.");
        console.error(error.message);
        process.exit(1);
    }
}

runTest();
