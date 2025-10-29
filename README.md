# Inviduell-backend-2
# BnB Backend (Hono + TypeScript + Supabase)

API-backend för en enkel BnB-hanteringsapp (likt Airbnb).  
Byggd i **TypeScript** med **Hono** och **Supabase** (Postgres + Auth + RLS).

## Funktioner

- **Auth:** Cookie-baserad inloggning via Supabase (SSR-klient)  
- **Properties:** CRUD. Endast ägare får skapa/uppdatera/radera (RLS)  
- **Bookings:** CRUD. **total_price** beräknas automatiskt = pris/natt × antal nätter  
- **RLS:** Policies i Supabase skyddar rader per användare/ägare  
- **Strikt typning:** Inga `any`; delade typer i `src/types`

---

## Kom igång

### 1) Krav

- Node 20+
- Supabase-projekt (URL + anon key)
- Postman/Insomnia för test (valfritt)

### 2) Miljövariabler

Skapa en `.env` i projektroten:

```bash
HONO_PORT=5177

# Från Supabase (Project Settings → API)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...

# (valfritt) om du kör lokalt med annan origin i frontend
CORS_ORIGIN=http://localhost:5173

npm install
npm run dev
# API: http://localhost:5177