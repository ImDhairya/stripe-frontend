import { useEffect, useState } from 'react';
import { webhooksApi, type WebhookEndpoint } from '../../api/webhooks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Webhook, Trash2, Power, PowerOff, Plus } from 'lucide-react';

export function WebhookPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const fetchEndpoints = async () => {
    try {
      const res: any = await webhooksApi.list();
      setEndpoints(res.data?.endpoints || []);
    } catch (error) {
      console.error('Failed to fetch endpoints', error);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsCreating(true);
    try {
      await webhooksApi.create(newUrl);
      setNewUrl('');
      toast({ title: 'Success', description: 'Webhook endpoint created successfully.' });
      fetchEndpoints();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create webhook', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await webhooksApi.update(id, newStatus);
      toast({ title: 'Success', description: `Webhook set to ${newStatus}.` });
      fetchEndpoints();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    try {
      await webhooksApi.delete(id);
      toast({ title: 'Success', description: 'Webhook deleted.' });
      fetchEndpoints();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete webhook', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Webhook className="mr-2 h-8 w-8 text-indigo-500" />
          Webhooks
        </h2>
        <p className="text-muted-foreground">Manage your event listeners and callback URLs.</p>
      </div>

      <div className="bg-card border p-4 rounded-lg shadow-sm">
        <form onSubmit={handleCreate} className="flex space-x-2">
          <Input 
            type="url" 
            placeholder="https://your-domain.com/webhook" 
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Secret (Hidden)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No webhook endpoints configured.
                </TableCell>
              </TableRow>
            ) : (
              endpoints.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-mono text-sm max-w-[200px] truncate" title={ep.url}>
                    {ep.url}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ep.status === 'active' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-gray-500'}>
                      {ep.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    whsec_***
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggle(ep.id, ep.status)}
                        title={ep.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {ep.status === 'active' ? <PowerOff className="h-4 w-4 text-amber-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(ep.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
