'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { admin, AdminSettings } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Percent, Search, Trash2, Activity, AlertTriangle, Copy, Check, Download, ChevronLeft, ChevronRight, User as UserIcon, CreditCard, Ticket as TicketIcon, ShieldAlert, SlidersHorizontal } from 'lucide-react';

type SettingsForm = Partial<AdminSettings> & { flutterwave_webhook_secret_hash?: string };

const ACTIVITY_CATEGORY_META: Record<string, { label: string; icon: any }> = {
  user: { label: 'Users', icon: UserIcon },
  admin: { label: 'Admin actions', icon: ShieldAlert },
  payment: { label: 'Payments', icon: CreditCard },
  ticket: { label: 'Tickets', icon: TicketIcon },
  settings: { label: 'Settings', icon: SlidersHorizontal },
};

type SubTab = 'general' | 'seo' | 'webhooks' | 'cache' | 'activity' | 'errors';
const VALID_SUB_TABS: SubTab[] = ['general', 'seo', 'webhooks', 'cache', 'activity', 'errors'];

export function SettingsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub') as SubTab | null;
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subTab, setSubTabState] = useState<SubTab>(
    subParam && VALID_SUB_TABS.includes(subParam) ? subParam : 'general'
  );

  const setSubTab = (tab: SubTab) => {
    setSubTabState(tab);
    router.replace(`/admin?tab=settings&sub=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (subParam && VALID_SUB_TABS.includes(subParam) && subParam !== subTab) {
      setSubTabState(subParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subParam]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [activityFrom, setActivityFrom] = useState('');
  const [activityTo, setActivityTo] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const [activityMeta, setActivityMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [activityCategories, setActivityCategories] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    admin.getSettings().then((data) => {
      setSettings(data);
      setForm(data);
    });
    admin.getActivityLogActions().then((actions) => {
      setActivityCategories(Array.from(new Set(actions.map((a) => a.split('.')[0]))));
    });
  }, []);

  useEffect(() => {
    if (subTab === 'activity') refreshActivity(1);
    if (subTab === 'errors') refreshErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const activityFilters = (page: number) => ({
    search: activitySearch || undefined,
    category: activityCategory || undefined,
    from: activityFrom || undefined,
    to: activityTo || undefined,
    page,
  });

  const refreshActivity = async (page: number = activityPage) => {
    setLoadingLogs(true);
    try {
      const data = await admin.getActivityLogs(activityFilters(page));
      setActivityLogs(data.data || data);
      setActivityMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    } finally {
      setLoadingLogs(false);
    }
  };

  const searchActivity = () => {
    setActivityPage(1);
    refreshActivity(1);
  };

  const goToActivityPage = (page: number) => {
    setActivityPage(page);
    refreshActivity(page);
  };

  const refreshErrors = async () => {
    setLoadingLogs(true);
    try {
      const data = await admin.getErrorLogs(100);
      setErrorLogs(data.entries);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await admin.updateSettings(form);
      setSettings(updated);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await admin.clearCache();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2000);
    } finally {
      setClearingCache(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!settings?.flutterwave_webhook_url) return;
    navigator.clipboard.writeText(settings.flutterwave_webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!settings) {
    return <div className="text-muted-foreground text-center py-12">Loading settings...</div>;
  }

  return (
    <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
      <TabsList>
        <TabsTrigger value="general">General &amp; Fees</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        <TabsTrigger value="cache">Cache</TabsTrigger>
        <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        <TabsTrigger value="errors">Error Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-md">
            <div>
              <Label htmlFor="fee">Platform fee percentage</Label>
              <div className="relative">
                <Input
                  id="fee"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={form.platform_fee_percentage ?? ''}
                  onChange={(e) => setForm({ ...form, platform_fee_percentage: parseFloat(e.target.value) })}
                  className="pr-8"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform commission used in admin financial reporting (Overview revenue breakdown). Doesn&apos;t change what buyers pay at checkout.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-lg">
            <div>
              <Label htmlFor="site_title">Site title</Label>
              <Input
                id="site_title"
                value={form.site_title ?? ''}
                onChange={(e) => setForm({ ...form, site_title: e.target.value })}
                placeholder="Spotlighticket — Tickets for events, movies & locations"
              />
            </div>
            <div>
              <Label htmlFor="site_description">Meta description</Label>
              <textarea
                id="site_description"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                value={form.site_description ?? ''}
                onChange={(e) => setForm({ ...form, site_description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="site_keywords">Keywords</Label>
              <Input
                id="site_keywords"
                value={form.site_keywords ?? ''}
                onChange={(e) => setForm({ ...form, site_keywords: e.target.value })}
                placeholder="events, tickets, movies, Nigeria"
              />
            </div>
            <div>
              <Label htmlFor="og_image">Social share image URL</Label>
              <Input
                id="og_image"
                value={form.og_image_url ?? ''}
                onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
                placeholder="https://.../og-image.jpg"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">Flutterwave</h3>
              <Badge variant={settings.has_flutterwave_webhook_secret ? 'default' : 'outline'}>
                {settings.has_flutterwave_webhook_secret ? 'Custom secret set' : 'Using FLW_SECRET_KEY'}
              </Badge>
            </div>
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={settings.flutterwave_webhook_url} />
                <Button type="button" variant="outline" size="icon" onClick={copyWebhookUrl}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paste this into Flutterwave Dashboard → Settings → Webhooks as the redirect/webhook URL.
              </p>
            </div>
            <div>
              <Label htmlFor="webhook_secret">Webhook secret hash</Label>
              <Input
                id="webhook_secret"
                type="password"
                placeholder={settings.has_flutterwave_webhook_secret ? '•••••••• set — enter a new value to replace' : 'Not set — falls back to FLW_SECRET_KEY'}
                value={form.flutterwave_webhook_secret_hash ?? ''}
                onChange={(e) => setForm({ ...form, flutterwave_webhook_secret_hash: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must exactly match the &quot;Secret hash&quot; configured in Flutterwave&apos;s dashboard.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">Paystack</h3>
              <Badge variant={settings.has_paystack_secret_key ? 'default' : 'destructive'}>
                {settings.has_paystack_secret_key ? 'Configured' : 'Not configured'}
              </Badge>
            </div>
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={settings.paystack_webhook_url} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(settings.paystack_webhook_url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Same URL as Flutterwave above — one endpoint handles both gateways, routed by their signature header. Paste this into Paystack Dashboard → Settings → API Keys &amp; Webhooks.
              </p>
            </div>
            {!settings.has_paystack_secret_key && (
              <p className="text-xs text-destructive">
                No <code>PAYSTACK_SECRET_KEY</code> is set in the backend&apos;s .env, so incoming Paystack webhooks will be rejected. Paystack checkout is unavailable until this is set.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Unlike Flutterwave, Paystack doesn&apos;t support a separate configurable webhook secret — it signs requests with your account&apos;s secret key directly. Set <code>PAYSTACK_PUBLIC_KEY</code> / <code>PAYSTACK_SECRET_KEY</code> in the backend&apos;s .env, then restart the backend.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="cache">
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-md">
            <p className="text-sm text-muted-foreground">
              Clears the application, config, route, and view caches on the backend. Use this after changing settings that don&apos;t seem to take effect, or after a deploy.
            </p>
            <Button onClick={handleClearCache} disabled={clearingCache} variant="outline">
              <Trash2 className="w-4 h-4" /> {clearingCache ? 'Clearing...' : cacheCleared ? 'Cleared' : 'Clear caches'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search description, action, or user..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchActivity()}
                className="w-64"
              />
              <select
                className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
                value={activityCategory}
                onChange={(e) => { setActivityCategory(e.target.value); setActivityPage(1); refreshActivity(1); }}
              >
                <option value="">All categories</option>
                {activityCategories.map((cat) => (
                  <option key={cat} value={cat}>{ACTIVITY_CATEGORY_META[cat]?.label ?? cat}</option>
                ))}
              </select>
              <Input
                type="date"
                value={activityFrom}
                onChange={(e) => setActivityFrom(e.target.value)}
                className="w-40"
                aria-label="From date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={activityTo}
                onChange={(e) => setActivityTo(e.target.value)}
                className="w-40"
                aria-label="To date"
              />
              <Button variant="outline" size="icon" onClick={searchActivity}>
                <Search className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 ml-auto">
                <Button variant="outline" size="sm" onClick={() => admin.downloadExport('activity-logs', 'csv', activityFilters(1))}>
                  <Download className="w-4 h-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => admin.downloadExport('activity-logs', 'pdf', activityFilters(1))}>
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingLogs && <p className="text-muted-foreground text-sm">Loading...</p>}
              {!loadingLogs && activityLogs.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No activity matches these filters.</p>
              )}
              {activityLogs.map((log) => {
                const category = log.action.split('.')[0];
                const Icon = ACTIVITY_CATEGORY_META[category]?.icon ?? Activity;
                return (
                  <div key={log.id} className="flex items-start gap-3 border-b border-border pb-2 last:border-0">
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-xs text-muted-foreground">{log.user?.name ?? 'System'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                        {log.ip_address && <span className="text-xs text-muted-foreground">· {log.ip_address}</span>}
                      </div>
                      {log.description && <p className="text-sm mt-1">{log.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {activityMeta && activityMeta.last_page > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Page {activityMeta.current_page} of {activityMeta.last_page} ({activityMeta.total} total)
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={activityMeta.current_page <= 1}
                    onClick={() => goToActivityPage(activityMeta.current_page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={activityMeta.current_page >= activityMeta.last_page}
                    onClick={() => goToActivityPage(activityMeta.current_page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="errors">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Most recent entries from the backend&apos;s laravel.log, newest first.</p>
              <Button variant="outline" size="sm" onClick={refreshErrors}>Refresh</Button>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs">
              {loadingLogs && <p className="text-muted-foreground">Loading...</p>}
              {!loadingLogs && errorLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No log entries found.</p>
              )}
              {errorLogs.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 border-b border-border pb-2 last:border-0">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-destructive shrink-0" />
                  <pre className="whitespace-pre-wrap break-all">{entry}</pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
