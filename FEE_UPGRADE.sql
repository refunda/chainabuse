-- ============================================================================
-- FEE_UPGRADE.sql — Verification Fee system (global setting + per-client override)
--
-- 100% ADDITIVE & IDEMPOTENT: safe to run multiple times.
--   * No DROPs, no RENAMEs, no UPDATEs to existing rows.
--   * Every new column defaults to NULL, and NULL means "use the fallback":
--       client override -> global setting -> built-in default (7% / current text).
--   * Nothing changes for any client until the admin actively saves a value.
--
-- Column meanings (identical on both tables):
--   verification_fee_percent        numeric  fee % (NULL = fall through)
--   verification_fee_preset         text     'preset_1'..'preset_4' | 'custom' | NULL
--   verification_fee_custom_message text     admin's own text (only used with 'custom')
--   verification_fee_message        text     DENORMALIZED final resolved text —
--                                            clients read ONLY this column.
-- ============================================================================

-- 1) GLOBAL SETTINGS — admin_settings (single-row table, read by all clients).
--    The table already exists in this project; CREATE IF NOT EXISTS is only a
--    safety net for fresh installs and is a no-op on the live database.
create table if not exists public.admin_settings (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid,
    btc_wallet_address text,
    eth_wallet_address text,
    usdt_wallet_address text,
    usdc_wallet_address text,
    sol_wallet_address text,
    created_at timestamptz default now()
);

alter table public.admin_settings add column if not exists verification_fee_percent numeric;
alter table public.admin_settings add column if not exists verification_fee_preset text;
alter table public.admin_settings add column if not exists verification_fee_custom_message text;
alter table public.admin_settings add column if not exists verification_fee_message text;

-- 2) PER-CLIENT OVERRIDE — profiles. NULL columns = "Use global default".
--    verification_fee_percent already exists in this project; IF NOT EXISTS
--    keeps the statement safe either way.
alter table public.profiles add column if not exists verification_fee_percent numeric;
alter table public.profiles add column if not exists verification_fee_preset text;
alter table public.profiles add column if not exists verification_fee_custom_message text;
alter table public.profiles add column if not exists verification_fee_message text;
