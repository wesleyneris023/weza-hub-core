import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — WEZA HUB" },
      { name: "description", content: "Acesso seguro ao painel administrativo do WEZA HUB." },
      { property: "og:title", content: "Acesso administrativo — WEZA HUB" },
      { property: "og:description", content: "Acesso seguro ao painel administrativo do WEZA HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return setErrorMessage("Informe email e senha.");

    setLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErrorMessage("Não foi possível entrar. Verifique suas credenciais.");
    await navigate({ to: "/" });
  }

  return (
    <main className="app-background grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
      <section className="relative z-10 w-full max-w-sm rounded-xl border border-glass-border bg-surface-glass p-6 shadow-soft backdrop-blur-xl" aria-labelledby="auth-title">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-brand-gradient text-brand-foreground"><LockKeyhole className="size-5" /></div>
          <div><p className="font-display font-bold">WEZA HUB</p><p className="text-xs text-muted-foreground">Área administrativa</p></div>
        </div>
        <h1 id="auth-title" className="font-display text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use sua conta administrativa.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          {errorMessage ? <p role="alert" className="text-sm text-destructive">{errorMessage}</p> : null}
          <Button className="w-full" type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : null}{loading ? "Entrando" : "Entrar"}</Button>
        </form>
      </section>
    </main>
  );
}
