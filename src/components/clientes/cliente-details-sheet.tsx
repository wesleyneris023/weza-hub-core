import { Building2, CreditCard, Globe2, ReceiptText, RefreshCcw, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClienteDetail } from "@/lib/clientes.query";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export interface ClienteDetailsSheetProps {
  open: boolean;
  cliente?: ClienteDetail | undefined;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDetailsSheet({
  open,
  cliente,
  isLoading,
  onOpenChange,
}: ClienteDetailsSheetProps) {
  const summaries = cliente
    ? ([
        ["Websites", cliente.related.websites, Globe2],
        ["Assinaturas", cliente.related.assinaturas, RefreshCcw],
        ["Pagamentos", cliente.related.pagamentos, CreditCard],
        ["Manutenções", cliente.related.manutencoes, Wrench],
        ["Faturamentos", cliente.related.faturamentos, ReceiptText],
      ] as const)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-glass-border bg-background sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display">Detalhes do cliente</SheetTitle>
          <SheetDescription>Informações cadastrais e resumo da operação.</SheetDescription>
        </SheetHeader>
        {isLoading || !cliente ? (
          <div className="mt-7 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="mt-7 space-y-7">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold">{cliente.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {cliente.empresa || "Sem empresa informada"}
                </p>
              </div>
              <Badge
                variant={cliente.status === "ativo" ? "default" : "secondary"}
                className="ml-auto"
              >
                {cliente.status === "ativo" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <dl className="grid gap-5 rounded-lg border border-glass-border bg-surface-soft p-4 sm:grid-cols-2">
              <Detail label="E-mail" value={cliente.email} />
              <Detail label="Telefone" value={cliente.telefone} />
              <Detail label="Documento" value={cliente.documento} />
              <Detail label="Status" value={cliente.status === "ativo" ? "Ativo" : "Inativo"} />
              <Detail
                label="Data de cadastro"
                value={dateTime.format(new Date(cliente.created_at))}
              />
              <Detail
                label="Última atualização"
                value={dateTime.format(new Date(cliente.updated_at))}
              />
              <div className="sm:col-span-2">
                <Detail label="Observações" value={cliente.observacoes} />
              </div>
            </dl>
            <section>
              <h3 className="font-display text-base font-bold">Resumo relacionado</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {summaries.map(([label, count, Icon]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-glass-border bg-surface-soft p-3"
                  >
                    <Icon className="size-4 text-primary" />
                    <p className="mt-3 font-display text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Os acessos aos módulos relacionados estarão disponíveis nas próximas etapas.
              </p>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
