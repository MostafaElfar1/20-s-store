-- TEST DATA ONLY. Run once to see the storefront working, then delete it from Products later.
insert into public.products (name, brand, description, price, stock_quantity, volume_ml, category, featured, is_active)
values ('Test Fragrance', 'Test Brand', 'Sample product for testing the store. Delete me.', 1200, 10, 100, 'Test', true, true);
