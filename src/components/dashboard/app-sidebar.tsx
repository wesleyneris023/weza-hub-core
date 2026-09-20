import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
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
  to?: "/dashboard" | "/clientes" | "/websites" | "/vendas" | "/assinaturas" | "/pagamentos" | "/manutencao" | "/faturamento";
}

const managementItems: NavItem[] = [
  { label: "Clientes", icon: Users, to: "/clientes" },
  { label: "Websites", icon: Globe2, to: "/websites" },
  { label: "Vendas", icon: ShoppingBag, to: "/vendas" },
  { label: "Assinaturas", icon: RefreshCcw, to: "/assinaturas" },
  { label: "Pagamentos", icon: CreditCard, to: "/pagamentos" },
  { label: "Manutenção", icon: Wrench, to: "/manutencao" },
  { label: "Faturamento", icon: ReceiptText, to: "/faturamento" },
];

export interface AppSidebarProps { mobileOpen: boolean; onClose: () => void; }

function Brand() {
  return <div className="flex items-center gap-3 px-2"><div className="grid size-10 place-items-center rounded-xl bg-brand-gradient font-display text-xl font-bold text-brand-foreground shadow-brand">W</div><div><div className="font-display text-xl font-bold tracking-tight text-slate-100">WEZA <span className="font-medium text-blue-400">HUB</span></div><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-500">Sites. Clientes. Resultados.</p></div></div>;
}

function NavigationItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  if (item.to) return <Link to={item.to} activeOptions={{ exact: true }} className="flex h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&.active]:border-blue-400/15 [&.active]:bg-blue-600/80 [&.active]:font-semibold [&.active]:text-white [&.active>svg]:text-white [&.active]:shadow-[0_8px_24px_-12px_rgba(37,99,235,.8)]"><Icon className="size-4 text-primary"/><span>{item.label}</span></Link>;
  return <Button variant="ghost" disabled className="h-10 w-full justify-start rounded-lg px-3 font-medium text-muted-foreground disabled:opacity-100" aria-label={`${item.label}, disponível em breve`}><Icon className="size-4 text-subtle"/><span>{item.label}</span><span className="ml-auto text-[11px] font-medium text-muted-foreground">Em breve</span></Button>;
}

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const dashboard: NavItem = { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" };
  return <>{mobileOpen && <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden" onClick={onClose}/>}
    <aside aria-label="Navegação principal" aria-modal={mobileOpen ? "true" : undefined} role={mobileOpen ? "dialog" : undefined} className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-glass-border bg-sidebar-glass px-4 py-5 backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center justify-between"><Brand/><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar menu" className="lg:hidden"><X/></Button></div>
      <nav className="mt-8 flex-1 overflow-y-auto"><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Panorama</p><NavigationItem item={dashboard}/><p className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Gestão</p><div className="space-y-1">{managementItems.map(item=><NavigationItem key={item.label} item={item}/>)}</div></nav>
      <div className="mt-4 overflow-hidden rounded-xl border border-blue-400/15 bg-gradient-to-br from-[#10264a] to-[#0b1729] p-4 shadow-soft"><div className="flex items-center gap-2 text-blue-300"><BadgeDollarSign className="size-4"/><p className="font-display text-sm font-semibold text-slate-100">Sua operação, em um só lugar</p></div><p className="mt-2 text-xs leading-relaxed text-slate-400">Organize clientes, projetos e resultados com a WEZA.</p><div className="mt-4 h-1 rounded-full bg-white/10"><div className="h-1 w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" /></div><p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Weza Technologies</p></div>
    </aside></>;
}
