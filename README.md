# Configuración del Frontend (Next.js) — Renacer

## Variables de entorno

Copiar `.env.example` a `.env.local` (desarrollo).

```env
# Servidor (secretos — NO exponer al navegador en Vercel)
BACKEND_URL=http://localhost:3333
SAAS_API_KEY=your-saas-api-key

# WebSocket (URL pública de Render — no es secreto)
NEXT_PUBLIC_WS_URL=http://localhost:3333

# Públicas
NEXT_PUBLIC_CLINIC_SLUG=consultorio-renacer
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante:** `SAAS_API_KEY` debe coincidir con `SAAS_API_KEY` del backend. Nunca usar `NEXT_PUBLIC_*` para secretos.

### Arquitectura API (BFF Proxy)

El navegador **nunca** llama a Render directamente para REST:

```
Navegador → /api/backend/* (Vercel, mismo origen)
         → Render (servidor inyecta x-api-key)
```

- Sin CORS en peticiones REST
- Sin `x-api-key` en DevTools
- JWT vía `Authorization: Bearer` reenviado por el proxy

WebSocket (Socket.IO) conecta directo a `NEXT_PUBLIC_WS_URL` (requiere CORS en Render).

OAuth Google: `/api/auth/google` (redirect servidor).

## CORS en producción (Vercel + Render)

**Render (backend):**

```env
CORS_ORIGINS=https://renacer-omega.vercel.app,https://renacer.com,https://www.renacer.com
NODE_ENV=production
FRONTEND_URL=https://renacer-omega.vercel.app
```

**Vercel (frontend):** ver `.env.production.example`

## Desarrollo

```bash
npm install
npm run dev
```

Frontend: `http://localhost:3000`
