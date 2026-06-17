# Uptime Monitoring Setup

## Recomendação: UptimeRobot (free tier)

- 50 monitores grátis
- Ping a cada 5 minutos
- Alertas por email/SMS/webhook
- Página pública de status (opcional)

## Como configurar

### 1. Criar conta
https://uptimerobot.com (free)

### 2. Adicionar monitores

| Tipo | URL / Host | Intervalo |
|---|---|---|
| HTTP(s) | `https://compra-facil-hoteis.vercel.app/pt-PT/login` | 5 min |
| HTTP(s) | `https://compra-facil-hoteis.vercel.app/pt-PT/status` | 5 min |
| Ping | `https://compra-facil-hoteis.vercel.app` | 5 min |
| Keyword | `https://compra-facil-hoteis.vercel.app/pt-PT/status` (deve conter "Tudo OK") | 5 min |
| Port | `db.fpjhvyydavssrzrkvlbd.supabase.co:5432` (opcional) | 5 min |

### 3. Configurar alertas

- Email: `admin@fourpoint.pt`
- Webhook (opcional, para Slack/Discord): criar webhook
- SMS (grátis até 1 contacto): opcional

### 4. Página pública (opcional)

UptimeRobot oferece página de status pública em:
`https://stats.uptimerobot.com/xxxxx`

Ou usa o nosso próprio `/status` que já mostra tudo.

## Alternativas gratuitas

| Serviço | Free tier | URL |
|---|---|---|
| UptimeRobot | 50 monitores, 5 min | https://uptimerobot.com |
| BetterStack | 10 monitores, 3 min | https://betterstack.com |
| Cronitor | 5 monitores | https://cronitor.io |
| Healthchecks.io | 20 monitores | https://healthchecks.io |
| Oh Dear | 10 URLs | https://ohdear.app |

## Script de healthcheck (alternativa self-hosted)

Se quiseres um monitor próprio sem serviços externos:

```bash
#!/bin/bash
# Em qualquer servidor, correr a cada 5 min via cron
URL="https://compra-facil-hoteis.vercel.app/pt-PT/status"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$STATUS" != "200" ]; then
  echo "ALERTA: Site down! HTTP $STATUS em $(date)"
  # Enviar email via SendGrid/Mailgun/etc
fi
```

## Configurar para já

1. Vai a https://uptimerobot.com
2. Cria conta (1 min)
3. Clica "Add New Monitor":
   - Type: HTTP(s)
   - Friendly name: Compra Facil Hoteis
   - URL: `https://compra-facil-hoteis.vercel.app`
   - Monitoring interval: 5 minutes
4. Clica "Create Monitor"
5. Vai a "My Settings" → "Alert Contacts" → adiciona `admin@fourpoint.pt`
6. Activa "Email" e pronto — recebes email se o site cair por 2 ciclos consecutivos (10 min)
