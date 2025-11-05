# BnB Backend

## Översikt
Detta är en lättviktig backend byggd med Hono och Node.js. Den hanterar användarautentisering, fastighetsannonser och bokningar, samt lagring av bilder via Supabase Storage.  
Apiet är anpassat för att användas med frontend-appen på `http://localhost:3000`.

---

## Installation och start
```bash
npm install
npm run dev

Servern startar som standard på http://localhost:5177.

HONO_PORT=5177
SUPABASE_URL=
SUPABASE_ANON_KEY=

Funktioner

Publik lista över aktiva boenden med sökfunktion.

Detaljsida med galleri och lightbox.

Gäst kan boka och se sina bokningar.

Värd kan skapa, redigera och ta bort annonser.

Bilduppladdning via backend till Supabase Storage.

Inloggning och utloggning via Supabase Auth.

Klient- och server-sidiga fetchar med token och cookies.

Användning

Starta backend och frontend.

Registrera ett konto via /register.

Logga in med samma uppgifter.

Skapa en annons om du är värd, eller boka om du är gäst.

Kontrollera dina egna bokningar eller annonser under respektive flik.
