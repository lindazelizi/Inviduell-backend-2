# Database setup (Supabase)

Om du sätter upp projektet från grunden:

1. Öppna Supabase SQL Editor
2. Kör filerna i denna ordning:
   1. 010_schema_and_constraints.sql
   2. 020_rls_policies.sql
   3. 030_functions.sql
   4. 040_storage_policies.sql

Detta skapar tabeller, constraints, RLS-policies, funktionen `booked_ranges()`
och rättigheter för bucket 'properties' i Supabase Storage.
# Testdata
Om du vill fylla databasen med exempeldata efter att ha kört schema-filerna:

-- Lägg in properties:
\i properties-seed.sql

-- Lägg in bookings:
\i bookings-seed.sql

# Alternativt (om du använder Supabase):
Kopiera innehållet från respektive seed-fil in i SQL Editor och kör.

# Arkiv
Gamla schemafiler (properties.sql, bookings.sql) finns i mappen _archive/ 
och används inte längre i projektet.