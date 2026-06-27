-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Add embedding column to safety_tips
alter table public.safety_tips
  add column if not exists embedding vector(384);

-- Add embedding column to city_safety
alter table public.city_safety
  add column if not exists embedding vector(384);

-- Add embedding column to guide_reviews
alter table public.guide_reviews
  add column if not exists embedding vector(384);

-- HNSW index for fast similarity search
create index if not exists safety_tips_embedding_idx
  on public.safety_tips using hnsw (embedding vector_cosine_ops);

create index if not exists city_safety_embedding_idx
  on public.city_safety using hnsw (embedding vector_cosine_ops);

create index if not exists guide_reviews_embedding_idx
  on public.guide_reviews using hnsw (embedding vector_cosine_ops);

-- Unified RAG search function
-- Searches across all three tables, returns top K chunks
create or replace function public.rag_search(
  query_embedding vector(384),
  match_count int default 8,
  filter_city text default null
)
returns table (
  source text,
  city text,
  content text,
  category text,
  severity text,
  score float
)
language sql stable
as $$
  -- safety tips
  select
    'tip' as source,
    st.city,
    st.tip as content,
    st.category,
    st.severity,
    1 - (st.embedding <=> query_embedding) as score
  from public.safety_tips st
  where st.embedding is not null
    and (filter_city is null or lower(st.city) = lower(filter_city))
  union all
  -- city safety summaries
  select
    'city_safety' as source,
    cs.city,
    concat(
      'Safety scores for ', cs.city, ': ',
      'Overall ', cs.overall_score, '/10, ',
      'Night ', cs.night_score, '/10, ',
      'Transport ', cs.transport_score, '/10, ',
      'Solo traveller ', cs.solo_traveller_score, '/10. ',
      cs.summary
    ) as content,
    'scores' as category,
    'info' as severity,
    1 - (cs.embedding <=> query_embedding) as score
  from public.city_safety cs
  where cs.embedding is not null
    and (filter_city is null or lower(cs.city) = lower(filter_city))
  union all
  -- guide reviews
  select
    'review' as source,
    gr.city,
    concat('Traveller review (', gr.rating, '/5 stars): ', gr.comment) as content,
    'review' as category,
    'info' as severity,
    1 - (gr.embedding <=> query_embedding) as score
  from public.guide_reviews gr
  where gr.embedding is not null
    and gr.comment is not null
    and (filter_city is null or lower(gr.city) = lower(filter_city))
  order by score desc
  limit match_count;
$$;

grant execute on function public.rag_search to anon, authenticated;
