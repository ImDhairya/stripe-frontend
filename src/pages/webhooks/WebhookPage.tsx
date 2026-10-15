import { useEffect, useState, useRef } from 'react';
import { webhooksApi, type WebhookEndpoint, type WebhookEventItem } from '../../api/webhooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import {
  Webhook,
  Trash2,
  Power,
  PowerOff,
  Plus,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  RefreshCw,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

export function WebhookPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  const pollingRef = useRef<any>(null);

  const fetchEndpoints = async () => {
    try {
      const endpointsList = await webhooksApi.list();
      setEndpoints(Array.isArray(endpointsList) ? endpointsList : []);
    } catch (error) {
      console.error('Failed to fetch endpoints', error);
      setEndpoints([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventList = await webhooksApi.getEvents();
      const list = Array.isArray(eventList) ? eventList : [];
      setEvents(list);

      const hasPending = list.some((e) => e.status === 'pending');
      setIsPolling(hasPending);
    } catch (error) {
      console.error('Failed to fetch webhook events', error);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEndpoints();
    fetchEvents();
  }, []);

  // Auto-polling when pending events exist
  useEffect(() => {
    if (isPolling) {
      pollingRef.current = setInterval(() => {
        fetchEvents();
      }, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPolling]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsCreating(true);
    try {
      await webhooksApi.create(newUrl, newDescription || undefined);
      setNewUrl('');
      setNewDescription('');
      toast({ title: 'Success', description: 'Webhook endpoint registered successfully.' });
      await fetchEndpoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSandbox = async () => {
    setIsCreatingSandbox(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      const placeholderUrl = `${baseUrl}/api/v1/webhook-endpoints/sandbox-receiver/temp`;
      const created = await webhooksApi.create(placeholderUrl, 'Built-in Sandbox HMAC Receiver');
      const realUrl = `${baseUrl}/api/v1/webhook-endpoints/sandbox-receiver/${created.id}`;
      await webhooksApi.update(created.id, { url: realUrl });

      toast({
        title: 'Sandbox Receiver Created!',
        description: 'Now verifying HMAC signatures on-cluster with zero third-party tools.',
      });
      await fetchEndpoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize sandbox receiver',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    try {
      await webhooksApi.update(id, { isActive: nextActive });
      toast({
        title: 'Status Updated',
        description: `Endpoint is now ${nextActive ? 'active' : 'inactive'}.`,
      });
      await fetchEndpoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update webhook',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    try {
      await webhooksApi.delete(id);
      toast({ title: 'Success', description: 'Webhook endpoint deleted.' });
      await fetchEndpoints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (id: string, mode: 'success' | 'fail_3_times') => {
    setTestingEndpointId(id);
    try {
      await webhooksApi.testEndpoint(id, mode);
      toast({
        title: mode === 'success' ? 'Test Event Enqueued' : 'Failure Simulation Enqueued',
        description:
          mode === 'success'
            ? 'Enqueued for immediate delivery (expecting 200 OK).'
            : 'Enqueued with 3 deliberate failures before exponential backoff retry succeeds.',
      });
      await fetchEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run webhook test',
        variant: 'destructive',
      });
    } finally {
      setTestingEndpointId(null);
    }
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Webhook className="h-8 w-8 text-indigo-500" />
            Webhook Command Center
          </h2>
          <p className="text-muted-foreground">
            Manage HMAC-SHA256 signed event dispatching with exponential backoff and BullMQ retries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCreateSandbox}
            disabled={isCreatingSandbox}
            className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2"
          >
            <Cpu className="h-4 w-4" />
            {isCreatingSandbox ? 'Creating...' : '1-Click Sandbox Receiver'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              fetchEndpoints();
              fetchEvents();
            }}
            title="Refresh All"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Add Custom Endpoint Form */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Register New Webhook Endpoint</CardTitle>
          <CardDescription>
            Outbound events will be POSTed with header <code className="text-primary font-mono text-xs">Paygate-Signature</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
            <Input
              type="url"
              placeholder="https://your-service.com/api/webhooks"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Description (e.g. Production Billing Server)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="md:w-72"
            />
            <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Adding...' : 'Add Endpoint'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Endpoints Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Configured Endpoints</CardTitle>
          <CardDescription>
            All active endpoints receive transactional event envelopes signed by a unique HMAC secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Target URL & Description</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>HMAC Secret</TableHead>
                <TableHead className="text-right">Actions & Tests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(endpoints) || endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No webhook endpoints registered yet. Click "1-Click Sandbox Receiver" above to test immediately!
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((ep) => {
                  const isRevealed = revealedSecrets[ep.id] || false;
                  const isTesting = testingEndpointId === ep.id;

                  return (
                    <TableRow key={ep.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-foreground truncate max-w-md">
                          {ep.url}
                        </div>
                        {ep.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {ep.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            ep.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {ep.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                            {isRevealed
                              ? ep.secret
                              : `${ep.secret.slice(0, 8)}••••••••••••••••••••••••`}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => toggleSecret(ep.id)}
                            title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => copyToClipboard(ep.secret, 'HMAC Secret')}
                            title="Copy Secret"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!ep.isActive || isTesting}
                            onClick={() => handleTest(ep.id, 'success')}
                            className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            title="Send standard 200 OK test payload"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Test 200
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!ep.isActive || isTesting}
                            onClick={() => handleTest(ep.id, 'fail_3_times')}
                            className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            title="Simulate 3 failures before succeeding"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Test Fail x3
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleToggle(ep.id, ep.isActive)}
                            title={ep.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {ep.isActive ? (
                              <PowerOff className="h-4 w-4 text-amber-500" />
                            ) : (
                              <Power className="h-4 w-4 text-emerald-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(ep.id)}
                            title="Delete Endpoint"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Live Delivery Logs Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              Live Webhook Delivery Log
            </CardTitle>
            <CardDescription>
              Real-time audit of outbound dispatch jobs enqueued into BullMQ with HMAC signatures.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isPolling ? (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10 flex items-center gap-1.5 animate-pulse">
                <Clock className="h-3 w-3" />
                Retrying / Auto-polling
              </Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Idle / Ready
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchEvents} className="text-xs flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Event ID</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Error / Diagnostic</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(events) || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No outbound deliveries recorded yet. Trigger a payment or test button above!
                  </TableCell>
                </TableRow>
              ) : (
                events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {evt.id.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {evt.eventType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {evt.status === 'succeeded' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" /> Succeeded
                        </Badge>
                      ) : evt.status === 'pending' ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit animate-pulse">
                          <Clock className="h-3 w-3" /> Pending (Retry)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" /> Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {evt.attempts} attempt{evt.attempts !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={evt.lastError || ''}>
                      {evt.lastError ? (
                        <span className="text-red-400 font-mono">{evt.lastError}</span>
                      ) : (
                        <span className="text-emerald-500/80">Delivered (HTTP 200)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(evt)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inspect Payload & HMAC Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              Inspect Webhook Event & HMAC Envelope
            </DialogTitle>
            <DialogDescription>
              Cryptographically verified payload sent via BullMQ background worker.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg border">
                <div>
                  <span className="text-xs text-muted-foreground">Event ID:</span>
                  <div className="font-mono text-xs font-semibold">{selectedEvent.id}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Event Type:</span>
                  <div className="font-mono text-xs font-semibold text-primary">
                    {selectedEvent.eventType}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Delivery Status:</span>
                  <div className="text-xs font-medium capitalize mt-0.5">{selectedEvent.status}</div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total Attempts:</span>
                  <div className="text-xs font-medium mt-0.5">{selectedEvent.attempts}</div>
                </div>
                {selectedEvent.lastError && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Last Recorded Error:</span>
                    <div className="font-mono text-xs text-red-400 bg-red-950/20 p-1.5 rounded mt-0.5">
                      {selectedEvent.lastError}
                    </div>
                  </div>
                )}
                {selectedEvent.nextAttemptAt && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Next Scheduled Retry:</span>
                    <div className="text-xs text-amber-400 mt-0.5">
                      {new Date(selectedEvent.nextAttemptAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Canonical JSON Payload
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(selectedEvent.payload, null, 2),
                        'Payload JSON'
                      )
                    }
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy JSON
                  </Button>
                </div>
                <pre className="font-mono text-xs bg-muted/70 p-3 rounded-lg border overflow-x-auto text-foreground max-h-60">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  HMAC Verification Contract
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Receivers must read header <code className="text-primary font-mono">Paygate-Signature</code> formatted as <code className="text-primary font-mono">t=timestamp,v1=signature</code>.
                </p>
                <pre className="font-mono text-[11px] bg-background/50 p-2 rounded text-muted-foreground overflow-x-auto">
{`// Verification implementation (Node.js):
const signedPayload = \`\${timestamp}.\${rawBody}\`;
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(signedPayload)
  .digest('hex');
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);`}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
