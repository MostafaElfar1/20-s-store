-- Optional Arabic text for products. If empty, the store falls back to the English fields.
alter table public.products
  add column if not exists name_ar text check (name_ar is null or char_length(name_ar) <= 200),
  add column if not exists description_ar text,
  add column if not exists category_ar text;
