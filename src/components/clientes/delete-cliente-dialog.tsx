import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ClienteListItem, ClienteRelatedCounts } from "@/lib/clientes.query";

export interface DeleteClienteDialogProps {
  cliente?: ClienteListItem;
  related?: ClienteRelatedCounts;
  checking: boolean;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteClienteDialog({ cliente, related, checking, deleting, onOpenChange, onConfirm }: DeleteClienteDialogProps) {
  const hasLinks = related ? Object.values(related).some((count) => count > 0) : false;
  return (
    <AlertDialog open={Boolean(cliente)} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-glass-border bg-background">
        <AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>A exclusão de <strong>{cliente?.nome}</strong> é permanente e pode ser impedida caso existam registros relacionados.</AlertDialogDescription></AlertDialogHeader>
        {hasLinks ? <Alert variant="destructive"><AlertTriangle className="size-4" /><AlertTitle>Cliente com registros vinculados</AlertTitle><AlertDescription>Trate os vínculos de websites, assinaturas, pagamentos, manutenções ou faturamentos antes da exclusão. O histórico financeiro não será apagado.</AlertDescription></Alert> : null}
        <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); onConfirm(); }} disabled={checking || deleting || hasLinks} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{checking ? "Verificando..." : deleting ? "Excluindo..." : "Excluir cliente"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}