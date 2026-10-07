#!/usr/bin/env bash
#
# install.sh — instala as dependências do projeto de forma reprodutível.
#
# Uso:
#   ./scripts/install.sh          # npm ci se houver lockfile, senão npm install
#   ./scripts/install.sh --fresh  # remove node_modules antes de instalar
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FRESH=0
for arg in "$@"; do
  case "$arg" in
    --fresh|-f) FRESH=1 ;;
    --help|-h)
      sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 1 ;;
  esac
done

# Checagem de requisito: Node >= 22.18 (type stripping nativo p/ npm run check).
if ! command -v node >/dev/null 2>&1; then
  echo "Erro: Node.js não encontrado no PATH." >&2
  exit 1
fi

NODE_VER="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_VER%%.*}"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Erro: Node $NODE_VER detectado; o projeto requer >= 22.18." >&2
  exit 1
fi
echo "Node $NODE_VER OK."

if [ "$FRESH" -eq 1 ] && [ -d node_modules ]; then
  echo "Removendo node_modules (--fresh) ..."
  rm -rf node_modules
fi

# npm ci exige lockfile e é determinístico; cai para npm install se faltar.
if [ -f package-lock.json ]; then
  echo "Instalando com 'npm ci' (reprodutível) ..."
  npm ci
else
  echo "Lockfile ausente; instalando com 'npm install' ..."
  npm install
fi

echo "Dependências instaladas."
echo "Vulnerabilidades reais (produção): verifique com 'npm audit --omit=dev'."
