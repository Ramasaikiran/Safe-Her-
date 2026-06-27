-- ══════════════════════════════════════════════════════════════
-- Auto-embed triggers
-- Every INSERT or UPDATE on safety_tips / city_safety / guide_reviews
-- automatically calls the embed-row edge function via pg_net.
-- Zero manual steps — RAG trains itself.
-- ══════════════════════════════════════════════════════════════

-- Enable pg_net (HTTP from Postgres triggers)
create extension if not exists pg_net with schema extensions;

-- ── Trigger function ─────────────────────────────────────────
create or replace function public.trigger_embed_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  edge_url text;
  service_key text;
  payload jsonb;
begin
  -- Only embed if content columns changed or embedding is null
  if TG_OP = 'UPDATE' and NEW.embedding is not null then
    -- Re-embed only when content actually changed
    if TG_TABLE_NAME = 'safety_tips' and OLD.tip = NEW.tip then
      return NEW;
    end if;
    if TG_TABLE_NAME = 'city_safety' and OLD.summary is not distinct from NEW.summary
      and OLD.overall_score = NEW.overall_score then
      return NEW;
    end if;
    if TG_TABLE_NAME = 'guide_reviews' and OLD.comment is not distinct from NEW.comment then
      return NEW;
    end if;
  end if;

  -- Build payload
  payload := jsonb_build_object(
    'table',  TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb
  );

  -- Get project URL and service key from Supabase vault (set automatically)
  edge_url    := current_setting('app.supabase_url', true) || '/functions/v1/embed-row';
  service_key := current_setting('app.service_role_key', true);

  -- Fire and forget — async HTTP call to edge function
  perform extensions.http_post(
    url     := edge_url,
    body    := payload::text,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_key
    )
  );

  return NEW;
end;
$$;

-- ── Attach to safety_tips ────────────────────────────────────
drop trigger if exists auto_embed_safety_tips on public.safety_tips;
create trigger auto_embed_safety_tips
  after insert or update of tip, city, category
  on public.safety_tips
  for each row execute function public.trigger_embed_row();

-- ── Attach to city_safety ────────────────────────────────────
drop trigger if exists auto_embed_city_safety on public.city_safety;
create trigger auto_embed_city_safety
  after insert or update of summary, overall_score, night_score, transport_score, solo_traveller_score
  on public.city_safety
  for each row execute function public.trigger_embed_row();

-- ── Attach to guide_reviews ──────────────────────────────────
drop trigger if exists auto_embed_guide_reviews on public.guide_reviews;
create trigger auto_embed_guide_reviews
  after insert or update of comment, rating
  on public.guide_reviews
  for each row execute function public.trigger_embed_row();

-- ── Set app settings so trigger can find the edge URL ────────
-- Run these two lines with YOUR actual values:
-- alter database postgres set app.supabase_url = 'https://YOUR-REF.supabase.co';
-- alter database postgres set app.service_role_key = 'YOUR-SERVICE-ROLE-KEY';
