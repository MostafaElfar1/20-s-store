-- TEST DATA ONLY (run after migration 012). Run once to see the storefront working, then delete it from Products later.
with p as (
  insert into public.products (name, description, price, category, featured, is_active,
                               notes_top, notes_heart, notes_base, occasions, usage)
  values ('Test Fragrance', 'Sample product for testing the store. Delete me.', 900, 'Unisex', true, true,
          array['Bergamot', 'Lemon'], array['Rose', 'Jasmine'], array['Vanilla', 'Musk'],
          array['daily', 'evening'], 'Best on warm evenings.')
  returning id
)
insert into public.product_variants (product_id, size_ml, price, stock_quantity)
select id, 50, 900, 10 from p
union all select id, 100, 1400, 6 from p;
