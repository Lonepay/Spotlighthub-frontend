'use client';

import { useEffect, useState } from 'react';
import { admin, PatchAudit, PatchMajor, PatchStatus } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/Loader';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';

/**
 * Admin → Settings → Patch. Read-only by design: the server never updates
 * itself from a button. Updates run via patch.bat on a developer machine,
 * which writes the report shown here once deployed.
 */
export function PatchTab() {
  const [status, setStatus] = useState<PatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setStatus(await admin.getPatchStatus());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const report = status?.report ?? null;
  const failingChecks = status?.checks.filter((c) => !c.ok) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display font-bold text-lg">Patch</h2>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {loading && <div className="py-8 flex justify-center"><Loader size={28} /></div>}
      {!loading && failed && (
        <Card><CardContent className="pt-6 text-sm text-destructive">Couldn&apos;t load patch status.</CardContent></Card>
      )}

      {!loading && status && (
        <>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold">Live server</h3>
              <div className="grid sm:grid-cols-4 gap-3 text-sm">
                <Fact label="PHP" value={status.server.php_version} />
                <Fact label="Laravel" value={status.server.laravel_version} />
                <Fact label="Environment" value={status.server.environment} />
                <Fact
                  label="Pending migrations"
                  value={String(status.server.pending_migrations.length)}
                  alert={status.server.pending_migrations.length > 0}
                />
              </div>
              {status.server.pending_migrations.length > 0 && (
                <ul className="font-mono text-xs text-muted-foreground space-y-0.5">
                  {status.server.pending_migrations.map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Last server patch</h3>
                {status.server_patch && <ServerPatchBadge result={status.server_patch.result} />}
              </div>
              {status.server_patch ? (
                <>
                  <p className="text-sm">{status.server_patch.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(status.server_patch.ran_at).toLocaleString()} · {status.server_patch.mode}
                    {status.server_patch.git_commit && ` · commit ${status.server_patch.git_commit}`}
                    {' · '}Laravel {status.server_patch.laravel_version}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Never run on this server. Run <code className="font-mono">bash patch-server.sh apply</code> from the backend folder.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Security configuration</h3>
                {failingChecks.length === 0
                  ? <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">All passing</Badge>
                  : <Badge variant="destructive">{failingChecks.length} to fix</Badge>}
              </div>
              <ul className="space-y-2">
                {status.checks.map((c) => (
                  <li key={c.key} className="flex items-start gap-2 text-sm">
                    {c.ok
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />}
                    <div>
                      <p className="font-medium">{c.label}</p>
                      {!c.ok && <p className="text-muted-foreground">{c.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {!report ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No patch report yet. Run <code className="font-mono">patch.bat</code> on a developer machine, then deploy.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">Dependency audit</h3>
                    <span className="text-xs text-muted-foreground">
                      Last run {new Date(report.generated_at).toLocaleString()} by {report.generated_by} ({report.mode})
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <AuditBlock
                      title={`Backend · Laravel ${report.backend.laravel ?? '?'}`}
                      audit={report.backend.audit}
                      before={report.backend.audit_before}
                      step={report.backend.tests}
                      stepLabel="Tests"
                    />
                    <AuditBlock
                      title={`Frontend · Next ${report.frontend.next ?? '?'}`}
                      audit={report.frontend.audit}
                      before={report.frontend.audit_before}
                      step={report.frontend.build}
                      stepLabel="Build"
                    />
                  </div>
                  {report.notes.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                      {report.notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">Major upgrades available</h3>
                  <p className="text-sm text-muted-foreground">
                    Not applied automatically — majors change APIs and need a planned upgrade on a branch.
                  </p>
                  <MajorsTable side="Backend" majors={report.backend.majors} />
                  <MajorsTable side="Frontend" majors={report.frontend.majors} />
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <h3 className="font-semibold flex items-center gap-2"><Terminal className="w-4 h-4" /> How to patch</h3>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>On a developer machine, double-click <code className="font-mono">patch.bat</code> in the project root.</li>
                <li>Choose <strong>2) Update</strong>. It backs up lock files, updates within safe version ranges, runs the backend tests and frontend build, and rolls back anything that fails.</li>
                <li>Commit the lock files and <code className="font-mono">backend/storage/app/patch-report.json</code>, then deploy the code.</li>
                <li>
                  On the server (SSH or cPanel Terminal), in the backend folder, run{' '}
                  <code className="font-mono">bash patch-server.sh apply</code>. It backs up the database and packages, puts the site in maintenance, installs exactly the tested versions, migrates, health-checks, and rolls back automatically on failure.
                  Add <code className="font-mono">--pull</code> if the server folder is a git checkout.
                </li>
              </ol>
              <p className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Updating is deliberately not possible from this page — a hijacked admin account must never be able to run code on the server.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ServerPatchBadge({ result }: { result: string }) {
  if (result === 'success') return <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">Applied</Badge>;
  if (result === 'check_only') return <Badge variant="secondary">Check only</Badge>;
  if (result === 'rolled_back') return <Badge variant="destructive">Failed · rolled back</Badge>;
  return <Badge variant="destructive">Needs attention</Badge>;
}

function Fact({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono font-medium ${alert ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  );
}

function AuditBlock({ title, audit, before, step, stepLabel }: {
  title: string; audit: PatchAudit; before: PatchAudit | null; step: string; stepLabel: string;
}) {
  const severe = audit.critical + audit.high;
  return (
    <div className="p-4 rounded-lg border border-border space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-sm">{title}</p>
        {audit.total === 0
          ? <Badge variant="outline" className="text-emerald-600 border-emerald-600/40">Clean</Badge>
          : <Badge variant={severe > 0 ? 'destructive' : 'secondary'}>{audit.total} advisories</Badge>}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={audit.critical ? 'text-destructive font-semibold' : 'text-muted-foreground'}>Critical {audit.critical}</span>
        <span className={audit.high ? 'text-destructive' : 'text-muted-foreground'}>High {audit.high}</span>
        <span className="text-muted-foreground">Medium {audit.medium}</span>
        <span className="text-muted-foreground">Low {audit.low}</span>
        {audit.unknown > 0 && <span className="text-muted-foreground">Unrated {audit.unknown}</span>}
      </div>
      {before && before.total !== audit.total && (
        <p className="text-xs text-muted-foreground">Was {before.total} before this run.</p>
      )}
      {audit.packages.length > 0 && (
        <p className="text-xs font-mono text-muted-foreground break-all">{audit.packages.join(', ')}</p>
      )}
      <p className="text-xs text-muted-foreground">{stepLabel}: {step}</p>
    </div>
  );
}

function MajorsTable({ side, majors }: { side: string; majors: PatchMajor[] }) {
  if (majors.length === 0) return <p className="text-xs text-muted-foreground">{side}: up to date.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-1 pr-4 font-medium">{side} package</th>
            <th className="py-1 pr-4 font-medium">Current</th>
            <th className="py-1 font-medium">Latest</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {majors.map((m) => (
            <tr key={m.name} className="border-t border-border">
              <td className="py-1.5 pr-4">{m.name}</td>
              <td className="py-1.5 pr-4">{m.current}</td>
              <td className="py-1.5">{m.latest}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
