#!/usr/bin/env bash
# ==========================================
# TechStore - Autoscaling SIMULADO para Docker Compose
#
# O Docker Compose NÃO faz autoscaling. Este script imita o que um
# orquestrador (ex.: Kubernetes HPA) faria: mede a CPU média das réplicas
# e chama "docker-compose --scale" para aumentar ou reduzir.
#
# Uso (na raiz do projeto):  ./scripts/autoscale.sh
# Parar: Ctrl+C
# ==========================================
set -euo pipefail

SERVICE="${SERVICE:-app}"
MIN_REPLICAS="${MIN_REPLICAS:-1}"
MAX_REPLICAS="${MAX_REPLICAS:-5}"
# CPU% do "docker stats": 100% = 1 núcleo. Com limite de 0.5 CPU, o máximo por réplica é ~50%.
SCALE_UP_CPU="${SCALE_UP_CPU:-35}"
SCALE_DOWN_CPU="${SCALE_DOWN_CPU:-10}"
INTERVAL="${INTERVAL:-10}"   # segundos entre medições
COOLDOWN="${COOLDOWN:-30}"   # espera após escalar, para a métrica estabilizar

log() { echo "[$(date +%H:%M:%S)] $*"; }

scale_to() {
    log "⚙️  Escalando $SERVICE para $1 réplicas..."
    docker-compose up -d --no-deps --no-recreate --scale "$SERVICE=$1" "$SERVICE" >/dev/null
    log "✅ Agora com $1 réplicas. Aguardando ${COOLDOWN}s (cooldown)."
    sleep "$COOLDOWN"
}

log "Autoscaler iniciado: min=$MIN_REPLICAS max=$MAX_REPLICAS sobe>${SCALE_UP_CPU}% desce<${SCALE_DOWN_CPU}%"

while true; do
    ids=$(docker-compose ps -q "$SERVICE")
    count=$(echo "$ids" | grep -c . || true)

    if [ "$count" -eq 0 ]; then
        log "Nenhuma réplica de $SERVICE rodando. Suba o ambiente com: docker-compose up -d"
        sleep "$INTERVAL"; continue
    fi

    # CPU média entre as réplicas
    avg=$(docker stats --no-stream --format '{{.CPUPerc}}' $ids \
          | tr -d '%' | awk '{ s += $1 } END { printf "%.1f", s / NR }')

    log "réplicas=$count  CPU média=${avg}%"

    if awk -v a="$avg" -v t="$SCALE_UP_CPU" 'BEGIN { exit !(a > t) }' && [ "$count" -lt "$MAX_REPLICAS" ]; then
        scale_to $((count + 1))
    elif awk -v a="$avg" -v t="$SCALE_DOWN_CPU" 'BEGIN { exit !(a < t) }' && [ "$count" -gt "$MIN_REPLICAS" ]; then
        scale_to $((count - 1))
    else
        sleep "$INTERVAL"
    fi
done
