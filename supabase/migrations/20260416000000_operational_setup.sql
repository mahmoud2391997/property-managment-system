-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- pg_cron jobs (unschedule-then-reschedule so re-runs are safe)
SELECT cron.unschedule('apply-late-payment-charges')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'apply-late-payment-charges');
SELECT cron.unschedule('auto-resolve-pending-tickets')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-resolve-pending-tickets');
SELECT cron.unschedule('daily-financial-warehouse')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-financial-warehouse');
SELECT cron.unschedule('generate-contract-rentals')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-contract-rentals');
SELECT cron.unschedule('generate-recurring-expenses')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-recurring-expenses');

SELECT cron.schedule('apply-late-payment-charges',  '0 16 * * *',   'SELECT apply_late_payment_charges()');
SELECT cron.schedule('auto-resolve-pending-tickets','0 */12 * * *', 'SELECT public.auto_resolve_stale_pending_tickets()');
SELECT cron.schedule('daily-financial-warehouse',   '0 */5 * * *',  'SELECT run_all_orgs_financial_warehouse()');
SELECT cron.schedule('generate-contract-rentals',   '0 16 * * *',   'SELECT public.generate_contract_rental_expenses()');
SELECT cron.schedule('generate-recurring-expenses', '0 17 * * *',   'SELECT generate_recurring_expenses();');
