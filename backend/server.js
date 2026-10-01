const app = require("./app"); // Importando a instância do aplicativo Express do arquivo app.js

// Sem JWT_SECRET não há como assinar nem validar tokens: melhor falhar já na subida
// (o healthcheck acusa o problema) do que subir uma réplica que não consegue autenticar.
if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET não definida. Configure-a no .env (a mesma em todas as réplicas).");
    process.exit(1);
}
const db = require("./db");

// Definindo a porta do servidor a partir das variáveis de ambiente ou usando a porta padrão 3000
const PORT = process.env.PORT || 3000;

// Iniciando o servidor e ouvindo na porta definida
const server = app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 TechStore API iniciada");
    console.log(`📍 http://localhost:${PORT}`); // Exibe a URL do servidor no console
    console.log("=================================");
});

// Desligamento gracioso: quando o Docker remove uma réplica (scale down),
// ele envia SIGTERM. Paramos de aceitar conexões, terminamos as requisições
// em andamento e fechamos o pool do banco antes de sair.
const shutdown = (signal) => {
    console.log(`${signal} recebido, encerrando a réplica...`);
    server.close(async () => {
        await db.end().catch(() => {});
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref(); // não espera para sempre
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
