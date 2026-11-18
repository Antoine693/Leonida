import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, UserCog, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeonidaLogo } from "@/components/hr/leonida-logo";
import { supabase } from "@/integrations/supabase/client";
import { activateCollaboratorAccount } from "@/lib/auth.functions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { cn } from "@/lib/utils";
import fibreHero from "@/assets/fibre-hero.jpg";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect:
      typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//")
        ? s["redirect"]
        : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/tableau-de-bord" });
  },
  head: () => ({
    meta: [
      { title: "Connexion — Leonida HR" },
      { name: "description", content: "Connectez-vous au SIRH interne de Leonida avec votre email professionnel." },
      { property: "og:title", content: "Connexion — Leonida HR" },
      { property: "og:description", content: "Accès sécurisé au SIRH Leonida : RH, managers et collaborateurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const DEMO_ICONS = { RH_ADMIN: UserCog, MANAGER: Users, COLLABORATEUR: UserRound } as const;
const DEMO_LABELS = { RH_ADMIN: "RH_ADMIN", MANAGER: "MANAGER", COLLABORATEUR: "COLLABORATEUR" } as const;

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const activate = useServerFn(activateCollaboratorAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(rawEmail: string, pwd: string, key: string) {
    const mail = rawEmail.trim().toLowerCase();
    setPending(key);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email: mail, password: pwd });
      if (error && /invalid login credentials/i.test(error.message)) {
        // First sign-in of a collaborator from the HR file: create the account, then retry.
        const res = await activate({ data: { email: mail, password: pwd } });
        if (res.status === "activated") {
          ({ error } = await supabase.auth.signInWithPassword({ email: mail, password: pwd }));
        } else if (res.status === "unknown") {
          toast.error("Aucun collaborateur ne correspond à cet email.");
          return;
        } else if (res.status === "error") {
          toast.error("Activation du compte impossible. Réessayez dans un instant.");
          return;
        }
      }
      if (error) {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }
      toast.success("Connexion réussie");
      if (search.redirect) navigate({ href: search.redirect, replace: true });
      else navigate({ to: "/tableau-de-bord", replace: true });
    } catch {
      toast.error("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setPending(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    void signIn(email, password, "form");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:flex lg:flex-col">
        <img
          src={fibreHero}
          alt=""
          width={1024}
          height={1536}
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-navy opacity-80" />
        <div className="absolute inset-0 bg-grid-signal opacity-40" />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          <LeonidaLogo className="text-navy-foreground" />
          <div className="max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-signal">SIRH interne</p>
            <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
              Les talents qui font tourner <span className="text-gradient-signal">le réseau</span>.
            </h1>
            <p className="mt-5 text-base text-navy-muted">
              Réseaux, fibre et cloud télécom : un seul espace pour gérer les collaborateurs, les temps et les absences
              de Leonida.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-navy-muted">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-signal" /> Droits contrôlés côté serveur
            </span>
            <span>100 collaborateurs · 9 services</span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <LeonidaLogo className="mb-10 lg:hidden" />
          <h2 className="text-3xl font-semibold">Connexion</h2>
          <p className="mt-2 text-sm text-muted-foreground">Utilisez votre email professionnel Leonida.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@leonida.fr"
                  className="h-11 pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="h-11 w-full shadow-glow" disabled={pending !== null}>
              {pending === "form" ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Se connecter
            </Button>
          </form>

          <div className="mt-10">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Accès rapide démo
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4 grid gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = DEMO_ICONS[acc.role];
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => signIn(acc.email, DEMO_PASSWORD, acc.role)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-card transition",
                      "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift disabled:opacity-60",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary group-hover:bg-gradient-signal group-hover:text-primary-foreground">
                      {pending === acc.role ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {acc.name}{" "}
                        <span className="ml-1 font-mono text-[10px] font-bold tracking-wider text-primary">
                          {DEMO_LABELS[acc.role]}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{acc.title}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Mot de passe de démo commun à tous les comptes :{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{DEMO_PASSWORD}</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
