-- Atomic increment for kit import counts.
--
-- The previous incrementImportCount() did a read-then-write in app code, which
-- loses updates under concurrent imports. This RPC does the increment in a
-- single statement so the count stays accurate.

create or replace function increment_kit_import_count(p_kit_id uuid)
returns void
language sql
as $$
  update layout_public_kit
  set import_count = import_count + 1
  where id = p_kit_id;
$$;
