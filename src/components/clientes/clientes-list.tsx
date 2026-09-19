import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClienteListItem } from "@/lib/clientes.query";

export interface ClientesListProps {
  items: ClienteListItem[];
  isLoading: boolean;
  onView: (cliente: ClienteListItem) => void;
  onEdit: (cliente: ClienteListItem) => void;
  onDelete: (cliente: ClienteListItem) => void;
}

function Actions({
  cliente,
  onView,
  onEdit,
  onDelete,
}: Omit<ClientesListProps, "items" | "isLoading"> & { cliente: ClienteListItem }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações de ${cliente.nome}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onView(cliente)}>
          <Eye />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(cliente)}>
          <Pencil />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onDelete(cliente)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "ativo" ? "default" : "secondary"}>
      {status === "ativo" ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export function ClientesList(props: ClientesListProps) {
  if (props.isLoading)
    return (
      <div className="space-y-3 p-5" aria-label="Carregando clientes">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <p className="text-sm text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Websites</TableHead>
              <TableHead className="text-center">Assinaturas</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.items.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{cliente.nome}</p>
                  {cliente.empresa ? (
                    <p className="mt-0.5 text-xs text-muted-foreground lg:hidden">
                      {cliente.empresa}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>{cliente.empresa || "—"}</TableCell>
                <TableCell className="max-w-48 truncate">{cliente.email || "—"}</TableCell>
                <TableCell>{cliente.telefone || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={cliente.status} />
                </TableCell>
                <TableCell className="text-center">{cliente.websitesCount}</TableCell>
                <TableCell className="text-center">{cliente.assinaturasCount}</TableCell>
                <TableCell>
                  <Actions
                    cliente={cliente}
                    onView={props.onView}
                    onEdit={props.onEdit}
                    onDelete={props.onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y divide-border md:hidden">
        {props.items.map((cliente) => (
          <article key={cliente.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">{cliente.nome}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {cliente.empresa || cliente.email || "Sem informações adicionais"}
                </p>
              </div>
              <StatusBadge status={cliente.status} />
              <Actions
                cliente={cliente}
                onView={props.onView}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Telefone</dt>
                <dd className="mt-1 truncate">{cliente.telefone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">E-mail</dt>
                <dd className="mt-1 truncate">{cliente.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Websites</dt>
                <dd className="mt-1 font-medium">{cliente.websitesCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Assinaturas</dt>
                <dd className="mt-1 font-medium">{cliente.assinaturasCount}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
