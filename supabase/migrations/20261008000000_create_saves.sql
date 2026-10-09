-- LifeQuest : une sauvegarde de partie par joueur.
-- La partie est stockée comme un document JSON : elle n'est lue et écrite que d'un bloc,
-- par son seul propriétaire, et aucune requête ne la filtre de l'intérieur.

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  -- Compteur d'écritures : sert au verrouillage optimiste entre appareils.
  revision   integer not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  -- Garde-fous : une partie normale pèse quelques dizaines de Ko.
  constraint saves_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint saves_state_size check (octet_length(state::text) <= 262144)
);

comment on table public.saves is 'Sauvegarde LifeQuest de chaque joueur (document JSON validé côté client par zod).';

-- Horodatage tenu par la base, pas par le client.
create or replace function public.touch_saves_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists saves_touch_updated_at on public.saves;
create trigger saves_touch_updated_at
  before update on public.saves
  for each row execute function public.touch_saves_updated_at();

-- Sécurité au niveau des lignes : chaque joueur n'accède qu'à SA ligne.
alter table public.saves enable row level security;

drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own" on public.saves
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own" on public.saves
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own" on public.saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves_delete_own" on public.saves;
create policy "saves_delete_own" on public.saves
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Les visiteurs non connectés n'ont aucun droit.
revoke all on public.saves from anon;
grant select, insert, update, delete on public.saves to authenticated;
