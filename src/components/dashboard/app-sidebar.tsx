import type { ComponentType } from "react";
import {
  BadgeDollarSign,
  CreditCard,
  Globe2,
  LayoutDashboard,
  ReceiptText,
  RefreshCcw,
  ShoppingBag,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  available?: boolean;
}

const managementItems: NavItem[] = [
  { label: "Clientes", icon: Users },
  { label: "Websites", icon: Globe2 },
  { label: "Vendas", icon: ShoppingBag },
  { label: "Assinaturas", icon: RefreshCcw },
  { label: "Pagamentos", icon: CreditCard },
  { label: "Manutenção", icon: Wrench },
  { label: "Faturamento", icon: ReceiptText },
];

export interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid size-9 place-items-center rounded-xl bg-brand-gradient font-display text-lg font-bold text-brand-foreground shadow-brand">
        W
      </div>
      <div className="font-display text-lg font-bold">
        WEZA <span className="text-primary">HUB</span>
      </div>
    </div>
  );
}

function NavigationItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-sm",
        item.available
          ? "bg-surface-strong font-semibold text-foreground shadow-soft ring-1 ring-primary/15"
          : "font-medium text-muted-foreground",
      )}
    >
      <Icon className={cn("size-4", item.available ? "text-primary" : "text-subtle")} />
      <span>{item.label}</span>
      {!item.available && <span className="ml-auto text-[10px] font-medium text-subtle">Em breve</span>}
    </div>
  );
}

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const dashboard: NavItem = { label: "Dashboard", icon: LayoutDashboard, available: true };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-glass-border bg-sidebar-glass px-4 py-5 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <Brand />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar menu" className="lg:hidden">
            <X />
          </Button>
        </div>

        <nav className="mt-8 flex-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Panorama</p>
          <NavigationItem item={dashboard} />
          <p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Gestão</p>
          <div className="space-y-1">
            {managementItems.map((item) => <NavigationItem key={item.label} item={item} />)}
          </div>
        </nav>

        <div className="mt-4 rounded-xl border border-glass-border bg-surface-soft p-4 shadow-soft">
          <div className="flex items-center gap-2 text-primary">
            <BadgeDollarSign className="size-4" />
            <p className="font-display text-sm font-semibold">Estrutura preparada</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Pronta para receber a conexão de dados na próxima etapa.</p>
        </div>
      </aside>
    </>
  );
}