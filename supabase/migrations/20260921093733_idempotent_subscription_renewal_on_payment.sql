-- Reproduces the migration already applied to the linked Supabase project
-- (version 20260921093733). Keep this file in sync with the remote migration
-- history so future environments can recreate the same payment/subscription logic.
-- Existing payment history is not backfilled or replayed.

ALTER TABLE public.faturamentos
  ADD COLUMN IF NOT EXISTS renovacao_processada_em timestamptz;

CREATE OR REPLACE FUNCTION public.sync_pagamento_faturamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_invoice_valor numeric;
  v_invoice_assinatura_id uuid;
  v_invoice_vencimento date;
  v_invoice_renovacao_processada_em timestamptz;
  v_periodo text;
  v_processar_renovacao boolean := false;
BEGIN
  -- If the payment is moved away from a former invoice, reopen that invoice.
  -- The renewal marker is deliberately retained to prevent a second renewal.
  IF TG_OP = 'UPDATE'
     AND OLD.faturamento_id IS NOT NULL
     AND OLD.faturamento_id IS DISTINCT FROM NEW.faturamento_id THEN
    UPDATE public.faturamentos
       SET status = CASE WHEN data_vencimento < CURRENT_DATE THEN 'atrasado' ELSE 'aberto' END,
           data_pagamento = NULL,
           updated_at = now()
     WHERE id = OLD.faturamento_id
       AND cliente_id = OLD.cliente_id
       AND status <> 'cancelado';
  END IF;

  IF NEW.faturamento_id IS NOT NULL THEN
    SELECT f.valor, f.assinatura_id, f.data_vencimento, f.renovacao_processada_em
      INTO v_invoice_valor, v_invoice_assinatura_id, v_invoice_vencimento, v_invoice_renovacao_processada_em
      FROM public.faturamentos f
     WHERE f.id = NEW.faturamento_id
       AND f.cliente_id = NEW.cliente_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Faturamento vinculado não encontrado para este cliente.';
    END IF;

    IF NEW.valor IS DISTINCT FROM v_invoice_valor THEN
      RAISE EXCEPTION 'O valor do pagamento deve ser igual ao valor integral do faturamento.';
    END IF;

    IF NEW.assinatura_id IS DISTINCT FROM v_invoice_assinatura_id THEN
      RAISE EXCEPTION 'A assinatura do pagamento deve corresponder à assinatura do faturamento.';
    END IF;

    UPDATE public.faturamentos
       SET status = CASE
             WHEN NEW.status = 'pago' THEN 'pago'
             WHEN NEW.status = 'cancelado' THEN 'cancelado'
             WHEN NEW.status = 'atrasado' OR data_vencimento < CURRENT_DATE THEN 'atrasado'
             ELSE 'aberto'
           END,
           data_pagamento = CASE WHEN NEW.status = 'pago' THEN NEW.data_pagamento ELSE NULL END,
           updated_at = now()
     WHERE id = NEW.faturamento_id
       AND cliente_id = NEW.cliente_id;

    -- Claim this invoice's renewal exactly once, and only on a new transition
    -- into paid. Existing paid history is not backfilled or replayed.
    IF NEW.status = 'pago'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'pago')
       AND v_invoice_assinatura_id IS NOT NULL THEN
      UPDATE public.faturamentos
         SET renovacao_processada_em = now(),
             updated_at = now()
       WHERE id = NEW.faturamento_id
         AND cliente_id = NEW.cliente_id
         AND renovacao_processada_em IS NULL
      RETURNING true INTO v_processar_renovacao;

      IF v_processar_renovacao THEN
        SELECT p.periodo_cobranca
          INTO v_periodo
          FROM public.assinaturas a
          JOIN public.planos p ON p.id = a.plano_id
         WHERE a.id = v_invoice_assinatura_id
           AND a.cliente_id = NEW.cliente_id
           AND a.status NOT IN ('cancelada', 'suspensa');

        IF FOUND THEN
          UPDATE public.assinaturas a
             SET status = 'ativa',
                 proximo_vencimento = GREATEST(
                   COALESCE(a.proximo_vencimento, v_invoice_vencimento),
                   CASE v_periodo
                     WHEN 'anual' THEN (v_invoice_vencimento + interval '1 year')::date
                     ELSE (v_invoice_vencimento + interval '1 month')::date
                   END
                 ),
                 updated_at = now()
           WHERE a.id = v_invoice_assinatura_id
             AND a.cliente_id = NEW.cliente_id
             AND a.status NOT IN ('cancelada', 'suspensa');
        END IF;
      END IF;
    END IF;

  ELSIF NEW.assinatura_id IS NOT NULL
        AND NEW.status = 'pago'
        AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'pago') THEN
    -- A direct payment activates a subscription but does not shift its due date:
    -- without an invoice, there is no billing period to renew idempotently.
    UPDATE public.assinaturas
       SET status = 'ativa',
           updated_at = now()
     WHERE id = NEW.assinatura_id
       AND cliente_id = NEW.cliente_id
       AND status NOT IN ('cancelada', 'suspensa');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_pagamento_faturamento ON public.pagamentos;
CREATE TRIGGER trg_sync_pagamento_faturamento
AFTER INSERT OR UPDATE OF faturamento_id, cliente_id, assinatura_id, valor, status, data_pagamento
ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.sync_pagamento_faturamento();
