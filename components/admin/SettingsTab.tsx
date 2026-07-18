'use client';

import { useState, useEffect } from 'react';
import { admin, AdminSettings } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Percent, Search, Trash2, Activity, AlertTriangle, Copy, Check } from 'lucide-react';

type SettingsForm = Partial<AdminSettings> & { flutterwave_webhook_secret_hash?: string };

export function SettingsTab() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subTab, setSubTab] = useState<'general' | 'seo' | 'webhooks' | 'cache' | 'activity' | 'errors'>('general');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityFilter, setActivityFilter] = useState('');
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
  }, []);

  useEffect(() => {
    if (subTab === 'activity') refreshActivity();
    if (subTab === 'errors') refreshErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const refreshActivity = async () => {
    setLoadingLogs(true);
    try {
      const data = await admin.getActivityLogs({ action: activityFilter || undefined });
      setActivityLogs(data.data || data);
    } finally {
      setLoadingLogs(false);
    }
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

      <TabsContent value="webhooks">
        <Card>
          <CardContent className="pt-6 space-y-4 max-w-lg">
            <div>
              <Label>Flutterwave webhook URL</Label>
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
            <div className="flex gap-2">
              <Input
                placeholder="Filter by action (e.g. login, payment)"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && refreshActivity()}
              />
              <Button variant="outline" onClick={refreshActivity}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingLogs && <p className="text-muted-foreground text-sm">Loading...</p>}
              {!loadingLogs && activityLogs.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No activity recorded yet.</p>
              )}
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-border pb-2 last:border-0">
                  <Activity className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-xs text-muted-foreground">{log.user?.name ?? 'System'}</span>
                      <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    {log.description && <p className="text-sm mt-1">{log.description}</p>}
                  </div>
                </div>
              ))}
            </div>
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
