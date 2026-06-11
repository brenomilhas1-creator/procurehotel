# Setup & Deployment — ProcureHotel

## 1. Pré-requisitos

- **Docker 24+** e **Docker Compose v2**
- (alternativa dev) **Python 3.11+**, **Node 20+**, **Postgres 16** com pgvector, **Redis 7**

## 2. Quick start com Docker

```bash
git clone <repo>
cd procurehotel

cp .env.example .env
# editar .env (OPENAI_API_KEY obrigatório para IA; resto tem defaults)

docker compose up -d --build

# correr migrações + seed
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

Acesso:
- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000/api/v1>
- Swagger: <http://localhost:8000/docs>

Credenciais seed:
- ADMIN: `admin@procurehotel.pt` / `admin12345`
- USER:  `user@procurehotel.pt`  / `user12345`

## 3. Setup em modo dev (sem Docker)

### 3.1. Postgres + pgvector

```bash
docker run -d --name procurehotel-db \
  -e POSTGRES_USER=procurehotel \
  -e POSTGRES_PASSWORD=procurehotel \
  -e POSTGRES_DB=procurehotel \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Aplicar init scripts (opcional, mas recomendado)
docker exec -i procurehotel-db psql -U procurehotel -d procurehotel < docs/db/init/01-extensions.sql
```

### 3.2. Redis

```bash
docker run -d --name procurehotel-redis -p 6379:6379 redis:7-alpine
```

### 3.3. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .   # ou instalar requirements do Dockerfile
cp .env.example .env
# ajustar DATABASE_URL e REDIS_URL para apontar para 127.0.0.1

alembic upgrade head
python -m app.scripts.seed
uvicorn app.main:app --reload --port 8000
```

### 3.4. Frontend

```bash
cd frontend
pnpm install   # ou npm install / yarn
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
pnpm dev
```

## 4. Configuração IA

A plataforma funciona **sem** `OPENAI_API_KEY`, usando parsers determinísticos (regex) e fallback OCR. Para qualidade máxima:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
OPENAI_TEMPERATURE=0.1
OPENAI_MAX_TOKENS=2048
```

## 5. Deploy em VPS Linux

### 5.1. Stack base

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Firewall
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable

# Nginx reverse proxy
apt install -y nginx certbot python3-certbot-nginx
```

### 5.2. Configurar domínio + TLS

```bash
certbot --nginx -d app.procurehotel.pt
```

### 5.3. Deploy

```bash
git clone <repo> /opt/procurehotel
cd /opt/procurehotel
cp .env.example .env
nano .env   # ajustar segredos

docker compose -f docker-compose.yml up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

### 5.4. Nginx config exemplo (`/etc/nginx/sites-available/procurehotel`)

```nginx
server {
    listen 80;
    server_name app.procurehotel.pt;
    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
    }
}
```

### 5.5. Backups

```bash
# Backup diário Postgres
0 3 * * * docker exec procurehotel-db pg_dump -U procurehotel procurehotel | gzip > /backups/db-$(date +\%F).sql.gz

# Manter últimos 14 dias
0 4 * * * find /backups -name "db-*.sql.gz" -mtime +14 -delete
```

### 5.6. Updates

```bash
cd /opt/procurehotel
git pull
docker compose build --pull
docker compose up -d
docker compose exec backend alembic upgrade head
```

## 6. Variáveis de ambiente (resumo)

| Var | Default | Descrição |
| --- | --- | --- |
| `APP_ENV` | development | development \| staging \| production \| test |
| `DATABASE_URL` | postgres://... | URL async do SQLAlchemy |
| `JWT_SECRET` | — | **MUDE em produção!** string longa aleatória |
| `OPENAI_API_KEY` | — | Para IA. Sistema degrada graciosamente sem ela |
| `OCR_ENGINE` | docling | `docling` ou `tesseract` |
| `TESSERACT_LANG` | por+eng | Idiomas OCR |
| `MAX_UPLOAD_MB` | 25 | Limite de upload |
| `BCRYPT_ROUNDS` | 12 | Custo do hash |

## 7. Testes

```bash
cd backend
pytest
```

## 8. Próximos passos (pós-MVP)

- [ ] `slowapi` para rate limit
- [ ] Background jobs (Celery/Arq) para OCR pesado
- [ ] pgvector embeddings em `product_aliases` para matching semântico
- [ ] WebSockets para notificações de alertas de preço
- [ ] Sentry/OpenTelemetry
