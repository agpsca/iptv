#!/usr/bin/env bash
#
# cleanup.sh — remove artefatos de build, cache e dependências do projeto.
#
# Uso:
#   ./scripts/cleanup.sh               # limpa TUDO: build/cache + node_modules
#   ./scripts/cleanup.sh --cache-only  # só build/cache (preserva node_modules)
#   ./scripts/cleanup.sh --lockfile    # limpa tudo e também remove package-lock.json
#
set -euo pipefail

# Raiz do projeto (um nível acima de scripts/), independente de onde é chamado.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CACHE_ONLY=0
DROP_LOCK=0
for arg in "$@"; do
  case "$arg" in
    --cache-only|-c) CACHE_ONLY=1 ;;
    --lockfile|-l)   DROP_LOCK=1 ;;
    --help|-h)
      sed -n '2,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 1 ;;
  esac
done

remove() {
  if [ -e "$1" ]; then
    rm -rf "$1"
    echo "  removido: $1"
  fi
}

echo "Limpando artefatos de build/cache em $ROOT ..."
remove ".next"
remove "out"
remove "build"
remove "coverage"
remove ".vercel"
# Arquivos *.tsbuildinfo e logs de debug na raiz.
find . -maxdepth 1 -name "*.tsbuildinfo" -exec rm -f {} + 2>/dev/null || true
find . -maxdepth 1 -name "*-debug.log*" -exec rm -f {} + 2>/dev/null || true

if [ "$CACHE_ONLY" -eq 1 ]; then
  echo "Modo --cache-only: node_modules preservado."
else
  echo "Removendo dependências ..."
  remove "node_modules"
  if [ "$DROP_LOCK" -eq 1 ]; then
    remove "package-lock.json"
  fi
fi

echo "Cleanup concluído."
