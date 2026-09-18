import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente, ClienteInput } from "@/lib/clientes.query";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  empresa: z.string(),
  email: z.string().trim().refine((value) => !value || z.string().email().safeParse(value).success, "Informe um e-mail válido."),
  telefone: z.string(),
  documento: z.string(),
  status: z.enum(["ativo", "inativo"]),
  observacoes: z.string(),
});

type ClienteFormValues = z.infer<typeof schema>;

const emptyValues: ClienteFormValues = { nome: "", empresa: "", email: "", telefone: "", documento: "", status: "ativo", observacoes: "" };

function toValues(cliente?: Cliente): ClienteFormValues {
  if (!cliente) return emptyValues;
  return {
    nome: cliente.nome,
    empresa: cliente.empresa ?? "",
    email: cliente.email ?? "",
    telefone: cliente.telefone ?? "",
    documento: cliente.documento ?? "",
    status: cliente.status === "inativo" ? "inativo" : "ativo",
    observacoes: cliente.observacoes ?? "",
  };
}

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

export interface ClienteFormSheetProps {
  open: boolean;
  cliente?: Cliente;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ClienteInput) => Promise<void>;
}

export function ClienteFormSheet({ open, cliente, isSaving, onOpenChange, onSubmit }: ClienteFormSheetProps) {
  const form = useForm<ClienteFormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues, mode: "onChange" });

  useEffect(() => {
    if (open) form.reset(toValues(cliente));
  }, [cliente, form, open]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({
      nome: values.nome.trim(),
      empresa: optional(values.empresa), email: optional(values.email), telefone: optional(values.telefone),
      documento: optional(values.documento), status: values.status, observacoes: optional(values.observacoes),
    });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-glass-border bg-background sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display">{cliente ? "Editar cliente" : "Novo cliente"}</SheetTitle>
          <SheetDescription>{cliente ? "Atualize as informações cadastrais." : "Cadastre um cliente para organizar sua operação."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            <FormField control={form.control} name="nome" render={({ field }) => <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input autoFocus placeholder="Nome do cliente" {...field} /></FormControl><FormMessage /></FormItem>} />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="empresa" render={({ field }) => <FormItem><FormLabel>Empresa</FormLabel><FormControl><Input placeholder="Empresa" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
              <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="cliente@empresa.com" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="telefone" render={({ field }) => <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="Telefone" {...field} /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="documento" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>Documento</FormLabel><FormControl><Input placeholder="CPF ou CNPJ" {...field} /></FormControl><FormMessage /></FormItem>} />
            </div>
            <FormField control={form.control} name="observacoes" render={({ field }) => <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea rows={5} placeholder="Informações adicionais" {...field} /></FormControl><FormMessage /></FormItem>} />
            <SheetFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={!form.formState.isValid || isSaving}>{isSaving ? "Salvando..." : "Salvar cliente"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}