-- Link a payment to one exact invoice. Existing records remain unlinked.
-- The composite FK prevents associating a payment with another client's invoice.
CREATE UNIQUE INDEX IF NOT EXISTS faturamentos_id_cliente_uidx
  ON public.faturamentos (id, cliente_id);

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS faturamento_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pagamentos_faturamento_cliente_fkey'
      AND conrelid = 'public.pagamentos'::regclass
  ) THEN
    ALTER TABLE public.pagamentos
      ADD CONSTRAINT pagamentos_faturamento_cliente_fkey
      FOREIGN KEY (faturamento_id, cliente_id)
      REFERENCES public.faturamentos (id, cliente_id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pagamentos_faturamento_id_uidx
  ON public.pagamentos (faturamento_id)
  WHERE faturamento_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_pagamento_faturamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_valor numeric;
  v_invoice_assinatura_id uuid;
BEGIN
  -- When the link is changed/removed, reopen the former invoice (or mark it
  -- overdue). The unique index guarantees no second payment remains linked.
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
    SELECT valor, assinatura_id
      INTO v_invoice_valor, v_invoice_assinatura_id
      FROM public.faturamentos
     WHERE id = NEW.faturamento_id
       AND cliente_id = NEW.cliente_id;

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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pagamento_faturamento ON public.pagamentos;
CREATE TRIGGER trg_sync_pagamento_faturamento
AFTER INSERT OR UPDATE OF faturamento_id, cliente_id, assinatura_id, valor, status, data_pagamento
ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.sync_pagamento_faturamento();
