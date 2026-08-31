"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, Copy, Check } from "lucide-react";
import { API_SCOPES, SCOPE_DESCRIPTIONS, type ApiScope } from "@/lib/integrations/scopes";
import { createApiKey, revokeApiKey } from "@/src/server/services/api-keys/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type KeyInfo = { id: string; name: string; prefix: string; scopes: string[]; createdAt: string; expiresAt: string | null; neverExpires: boolean; revokedAt: string | null; lastUsedAt: string | null; expired: boolean };
const date = (value: string) => new Date(value).toISOString().slice(0, 10);

export function ApiKeysManager({ blogId, keys }: { blogId: string; keys: KeyInfo[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [days, setDays] = useState("90");
  const [neverExpires, setNeverExpires] = useState(false);
  const [scopes, setScopes] = useState<ApiScope[]>(["content:read", "content:write"]);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<KeyInfo | null>(null);

  function create(event: React.FormEvent) {
    event.preventDefault(); setError("");
    startTransition(async () => {
      try {
        const result = await createApiKey(blogId, { name, scopes, neverExpires, ...(neverExpires ? {} : { expiresInDays: Number(days) }) });
        if (result.error) { setError(result.error); return; }
        setToken(result.token ?? null); setCopied(false); setName(""); router.refresh();
      } catch { setError("Unable to create the key. Refresh the list before trying again."); }
    });
  }
  function revoke() {
    if (!revoking) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await revokeApiKey(blogId, revoking.id);
        if (result.error) { setError(result.error); return; }
        setRevoking(null); router.refresh();
      } catch { setError("Unable to revoke the key. Try again."); }
    });
  }

  return <>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}
    {token && <Card className="border-emerald-600/40">
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Copy your key now</CardTitle>
        <CardDescription>This is the only time the full key is displayed. Store it in your client’s secret storage. Do not commit or share it.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><div className="flex gap-2">
        <Input aria-label="New API key (shown once)" value={token} readOnly className="font-mono text-xs" autoComplete="off" spellCheck={false} />
        <Button variant="outline" aria-label="Copy API key" onClick={async () => {
          try { await navigator.clipboard.writeText(token); setCopied(true); } catch { setError("Clipboard unavailable. Select and copy the key manually."); }
        }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
      </div><Button variant="outline" onClick={() => setToken(null)}>I saved the key — dismiss</Button></CardContent>
    </Card>}
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
      <Card><CardHeader><CardTitle>Create an API key</CardTitle><CardDescription>One key per client. Start with draft-only access and grant additional permissions only when needed.</CardDescription></CardHeader>
        <CardContent><form onSubmit={create} className="space-y-6">
          <div className="space-y-2"><Label htmlFor="key-name">Name</Label><Input id="key-name" placeholder="Editorial assistant" value={name} onChange={e => setName(e.target.value)} maxLength={80} required disabled={pending} /></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1"><Label htmlFor="key-never-expires">Never expires</Label><p id="key-never-expires-help" className="text-xs text-muted-foreground">The key stays active until you revoke it.</p></div>
              <Switch id="key-never-expires" aria-describedby="key-never-expires-help" checked={neverExpires} onCheckedChange={setNeverExpires} disabled={pending} />
            </div>
            <div className="space-y-2"><Label htmlFor="key-expiry">Expires in days</Label><Input id="key-expiry" type="number" min={1} max={365} required={!neverExpires} value={days} onChange={e => setDays(e.target.value)} disabled={pending || neverExpires} /></div>
          </div>
          <fieldset className="space-y-3" disabled={pending}><legend className="mb-3 text-sm font-medium">Permissions</legend>
            {API_SCOPES.map(scope => <label key={scope} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-foreground" checked={scopes.includes(scope)} onChange={e => setScopes(current => e.target.checked ? [...current, scope] : current.filter(s => s !== scope))} />
              <span><span className="block font-mono text-xs">{scope}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{SCOPE_DESCRIPTIONS[scope]}</span></span>
            </label>)}
          </fieldset>
          <Button type="submit" disabled={pending || scopes.length === 0 || !!token}><KeyRound className="mr-2 h-4 w-4" />{pending ? "Working…" : "Create key"}</Button>
        </form></CardContent>
      </Card>
      <aside className="space-y-4 text-sm text-muted-foreground"><h2 className="font-medium text-foreground">Private by design</h2>
        <p>Only the blog owner can create, list or revoke keys. Keys cannot manage members, issue other keys or access another blog.</p>
        <p>Keys expire in 1–365 days, or never expire if you enable that option. Revocation blocks subsequent requests immediately; work already authorized may finish.</p>
        <p>120 authenticated requests per minute per key, shared across REST and MCP. Up to 25 active keys per blog.</p>
      </aside>
    </div>
    <section className="space-y-4"><h2 className="text-xl font-semibold">Your API keys</h2>
      {keys.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No API keys yet. Create a key to connect your first client.</div> :
        <div className="divide-y rounded-xl border">{keys.map(key => {
          const expired = key.expired;
          const state = key.revokedAt ? "Revoked" : expired ? "Expired" : "Active";
          return <div key={key.id} className="space-y-3 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div>
            <div className="flex flex-wrap items-center gap-3"><h3 className="font-medium">{key.name}</h3><span className="rounded-full bg-muted px-2 py-1 text-xs">{state}</span></div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{key.prefix}…</p>
          </div>{!key.revokedAt && !expired && <Button variant="outline" size="sm" disabled={pending} onClick={() => setRevoking(key)}>Revoke</Button>}</div>
            <div className="flex flex-wrap gap-2">{key.scopes.map(scope => <span key={scope} className="rounded bg-muted px-2 py-1 font-mono text-xs">{scope}</span>)}</div>
            <p className="text-xs text-muted-foreground">Created {date(key.createdAt)} · {key.neverExpires ? "Never expires" : key.expiresAt ? `Expires ${date(key.expiresAt)}` : "Expired"} · Last used {key.lastUsedAt ? date(key.lastUsedAt) : "never"} (UTC)</p>
          </div>;
        })}</div>}
      {keys.length === 100 && <p className="text-xs text-muted-foreground">Showing the 100 most recent keys.</p>}
    </section>
    <Dialog open={!!revoking} onOpenChange={open => { if (!open && !pending) setRevoking(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Revoke {revoking?.name}?</DialogTitle><DialogDescription>Connected clients will lose access. This cannot be undone; create a new key to reconnect them.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setRevoking(null)}>Cancel</Button><Button variant="destructive" disabled={pending} onClick={revoke}>Revoke key</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
