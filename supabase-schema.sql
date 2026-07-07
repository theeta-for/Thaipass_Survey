create table if not exists public.survey_responses (
  id uuid primary key,
  timestamp timestamptz not null,
  deleted_at timestamptz,
  answers jsonb not null,
  other_answers jsonb not null default '{}'::jsonb
);

alter table public.survey_responses enable row level security;

-- Public survey visitors can submit responses.
create policy "Allow public survey submissions"
on public.survey_responses
for insert
to anon
with check (true);

-- Internal results currently use the client-side password gate.
-- Replace this with real backend authentication before production.
create policy "Allow internal dashboard reads"
on public.survey_responses
for select
to anon
using (true);

create policy "Allow internal dashboard updates"
on public.survey_responses
for update
to anon
using (true)
with check (true);

create policy "Allow internal dashboard deletes"
on public.survey_responses
for delete
to anon
using (true);
