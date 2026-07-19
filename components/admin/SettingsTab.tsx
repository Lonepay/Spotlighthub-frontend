'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { admin, AdminSettings } from '@/lib/admin';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Percent, Search, Trash2, Activity, AlertTriangle, Copy, Check, Download, ChevronLeft, ChevronRight, User as UserIcon, CreditCard, Ticket as TicketIcon, ShieldAlert, SlidersHorizontal, ShieldCheck, Lock, Crown } from 'lucide-react';

type SettingsForm = Partial<AdminSettings> & { flutterwave_webhook_secret_hash?: string };

const ACTIVITY_CATEGORY_META: Record<string, { label: string; icon: any }> = {
  user: { label: 'Users', icon: UserIcon },
  admin: { label: 'Admin actions', icon: ShieldAlert },
  payment: { label: 'Payments', icon: CreditCard },
  ticket: { label: 'Tickets', icon: TicketIcon },
  settings: { label: 'Settings', icon: SlidersHorizontal },
};

type SubTab = 'general' | 'seo' | 'webhooks' | 'cache' | 'activity' | 'errors' | 'staff';
const VALID_SUB_TABS: SubTab[] = ['general', 'seo', 'webhooks', 'cache', 'activity', 'errors', 'staff'];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  'super-admin': 'Super Admin',
  developer: 'Developer',
};

export function SettingsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const isDeveloperActor = authUser?.role === 'developer';
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
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [clearingErrorLogs, setClearingErrorLogs] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [invitingStaff, setInvitingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'admin', password: '' });

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
    if (subTab === 'staff') refreshStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  const refreshStaff = async () => {
    setLoadingStaff(true);
    try {
      const data = await admin.getUsers({ role: 'staff' });
      setStaffList(data.data || data);
    } finally {
      setLoadingStaff(false);
    }
  };

  const canChangeRoleOf = (u: any) => {
    if (u.role === 'developer') return false;
    if (u.role === 'super-admin') return isDeveloperActor;
    return true;
  };

  const canDeleteStaff = (u: any) => {
    if (u.role === 'developer') return false;
    if (u.role === 'super-admin') return isDeveloperActor;
    return true;
  };

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

  const handleClearErrorLogs = async () => {
    if (!confirm('Clear all error logs? This cannot be undone.')) return;
    setClearingErrorLogs(true);
    try {
      await admin.clearErrorLogs();
      setErrorLogs([]);
    } finally {
      setClearingErrorLogs(false);
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

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOgImage(true);
    try {
      const updated = await admin.uploadOgImage(file);
      setSettings(updated);
      setForm(updated);
    } catch {
      alert('Failed to upload image');
    } finally {
      setUploadingOgImage(false);
      e.target.value = '';
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
      <TabsContent value="general" className="space-y-4">
        <h2 className="font-display font-bold text-lg">General &amp; Fees</h2>
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
            </div>
            <div>
              <Label htmlFor="flat-fee">Flat fee per order (₦)</Label>
              <Input
                id="flat-fee"
                type="number"
                step="1"
                min={0}
                value={form.platform_flat_fee ?? ''}
                onChange={(e) => setForm({ ...form, platform_flat_fee: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Charged on every paid ticket order — percentage + this flat amount. Free events are never charged.
              </p>
            </div>
            <div>
              <Label>Who covers the platform fee?</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, fee_payer: 'organizer' })}
                  className={`rounded-none border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                    (form.fee_payer ?? 'organizer') === 'organizer' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  Organizer
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">Deducted from the organizer&apos;s payout. Buyers pay the listed price.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, fee_payer: 'attendee' })}
                  className={`rounded-none border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                    form.fee_payer === 'attendee' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  Attendee
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">Added on top at checkout. Organizer gets the full listed price.</p>
                </button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4 max-w-md">
            <h3 className="font-display font-semibold">Payouts</h3>
            <div>
              <Label htmlFor="low-balance">Low balance alert threshold (₦)</Label>
              <Input
                id="low-balance"
                type="number"
                min={0}
                value={form.low_balance_threshold ?? ''}
                onChange={(e) => setForm({ ...form, low_balance_threshold: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Admins get emailed when the Paystack payout balance drops below this.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-withdrawals">Automate withdrawals</Label>
                <p className="text-xs text-muted-foreground">Verified organizers get paid automatically via Paystack.</p>
              </div>
              <input
                id="auto-withdrawals"
                type="checkbox"
                className="w-5 h-5"
                checked={form.auto_withdrawals_enabled ?? false}
                onChange={(e) => setForm({ ...form, auto_withdrawals_enabled: e.target.checked })}
              />
            </div>
            <div>
              <Label htmlFor="auto-min">Minimum amount for automation (₦)</Label>
              <Input
                id="auto-min"
                type="number"
                min={0}
                value={form.auto_withdrawal_minimum ?? ''}
                onChange={(e) => setForm({ ...form, auto_withdrawal_minimum: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only verified (blue-tick) organizers requesting at least this much get auto-paid; everyone else stays in manual review.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <h2 className="font-display font-bold text-lg">SEO</h2>
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
              <Label htmlFor="og_image">Social share image</Label>
              {settings.og_image_url && (
                <img
                  src={settings.og_image_url}
                  alt="Social share preview"
                  className="mt-2 mb-2 w-full max-w-xs rounded-lg border border-border object-cover aspect-[1200/630]"
                />
              )}
              <input
                id="og_image"
                type="file"
                accept="image/*"
                onChange={handleOgImageUpload}
                disabled={uploadingOgImage}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {uploadingOgImage ? 'Uploading...' : 'Recommended 1200×630px. Shown when the site is shared on social media.'}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-6">
        <h2 className="font-display font-bold text-lg">Webhooks</h2>

        <Card>
          <CardContent className="pt-6 space-y-4 max-w-lg">
            <h3 className="font-display font-semibold">Payment Gateways</h3>
            <p className="text-xs text-muted-foreground -mt-2">
              Turn a gateway off to hide it from checkout and reject any attempt to use it. At least one must stay on.
            </p>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Flutterwave</p>
                <p className="text-xs text-muted-foreground">{form.flutterwave_enabled ?? true ? 'Available at checkout' : 'Hidden from checkout'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.flutterwave_enabled ?? true}
                onClick={() => setForm({ ...form, flutterwave_enabled: !(form.flutterwave_enabled ?? true) })}
                className={`relative w-12 h-7 rounded-full transition-colors ${(form.flutterwave_enabled ?? true) ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${(form.flutterwave_enabled ?? true) ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Paystack</p>
                <p className="text-xs text-muted-foreground">{form.paystack_enabled ?? true ? 'Available at checkout' : 'Hidden from checkout'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.paystack_enabled ?? true}
                onClick={() => setForm({ ...form, paystack_enabled: !(form.paystack_enabled ?? true) })}
                className={`relative w-12 h-7 rounded-full transition-colors ${(form.paystack_enabled ?? true) ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${(form.paystack_enabled ?? true) ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

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
              <PasswordInput
                id="webhook_secret"
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

      <TabsContent value="cache" className="space-y-4">
        <h2 className="font-display font-bold text-lg">Cache</h2>
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

      <TabsContent value="activity" className="space-y-4">
        <h2 className="font-display font-bold text-lg">Activity Logs</h2>
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
                className="h-10 rounded-none border border-input bg-background px-2 text-sm"
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

      <TabsContent value="errors" className="space-y-4">
        <h2 className="font-display font-bold text-lg">Error Logs</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Most recent entries from the backend&apos;s laravel.log, newest first.</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={refreshErrors}>Refresh</Button>
                <Button variant="outline" size="sm" onClick={() => admin.downloadErrorLogsExport('csv')}>
                  <Download className="w-4 h-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => admin.downloadErrorLogsExport('pdf')}>
                  <Download className="w-4 h-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearErrorLogs} disabled={clearingErrorLogs} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" /> {clearingErrorLogs ? 'Clearing...' : 'Clear'}
                </Button>
              </div>
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

      <TabsContent value="staff" className="space-y-4">
        <h2 className="font-display font-bold text-lg">Roles &amp; Staff Management</h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Hierarchy: Developer &gt; Super Admin &gt; Admin. The developer account can never be deleted or demoted by anyone.
          The super-admin account can only be deleted or demoted by the developer.
        </p>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold">Staff accounts</h3>
              <Button size="sm" onClick={() => setInvitingStaff((v) => !v)}>
                {invitingStaff ? 'Cancel' : 'Add staff'}
              </Button>
            </div>

            {invitingStaff && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 grid md:grid-cols-2 gap-3">
                <Input placeholder="Name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                <Input placeholder="Email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                <select
                  className="h-11 rounded-none border border-input bg-background px-4 text-sm"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                  {isDeveloperActor && <option value="developer">Developer</option>}
                </select>
                <PasswordInput placeholder="Password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} />
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    onClick={async () => {
                      try {
                        await admin.createUser(newStaff as any);
                        setNewStaff({ name: '', email: '', role: 'admin', password: '' });
                        setInvitingStaff(false);
                        await refreshStaff();
                      } catch {
                        alert('Failed to create staff account');
                      }
                    }}
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {loadingStaff && <p className="text-muted-foreground text-sm">Loading...</p>}
              {!loadingStaff && staffList.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">No staff accounts found.</p>
              )}
              {staffList.map((u) => {
                const locked = !canChangeRoleOf(u);
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {u.name}
                          {u.role === 'developer' && <Crown className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />}
                          {u.role === 'super-admin' && <Crown className="w-3.5 h-3.5 text-slate-400" fill="currentColor" />}
                          {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        className="h-9 rounded-none border border-input bg-background px-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        value={u.role}
                        disabled={locked}
                        title={locked ? "This account's role is protected" : undefined}
                        onChange={async (e) => {
                          try {
                            await admin.updateUserRole(u.id, e.target.value as any);
                            await refreshStaff();
                          } catch (err: any) {
                            alert(err?.response?.data?.message || 'Failed to update role');
                          }
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="super-admin">Super Admin</option>
                        {(isDeveloperActor || u.role === 'developer') && <option value="developer">Developer</option>}
                      </select>
                      <Badge variant="outline" className="hidden sm:inline-flex">
                        <ShieldCheck className="w-3 h-3 mr-1" /> {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!canDeleteStaff(u)}
                        title={!canDeleteStaff(u) ? "This account is protected and can't be deleted" : undefined}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:hover:bg-transparent"
                        onClick={async () => {
                          if (!confirm(`Delete ${u.name}?`)) return;
                          try {
                            await admin.deleteUser(u.id);
                            await refreshStaff();
                          } catch (e: any) {
                            alert(e?.response?.data?.message || 'Failed to delete');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
