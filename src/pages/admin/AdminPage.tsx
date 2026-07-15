import { useEffect, useState } from 'react';
import { searchApi } from '../../api/search';
import { adminApi } from '../../api/admin';
import type { User } from '../../api/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { SearchBar } from '../../components/shared/SearchBar';
import { Pagination } from '../../components/shared/Pagination';
import { ShieldCheck, ArrowUpCircle } from 'lucide-react';

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const limit = 10;
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await searchApi.search<User>('users', { q: query, limit, offset });
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setHasMore(res.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query, offset, limit]);

  const handleUpgrade = async (userId: string, currentTier: string) => {
    const newTier = currentTier === 'free' ? 'paid' : 'free';
    try {
      await adminApi.upgradeUser(userId, newTier);
      toast({ title: 'Success', description: `User tier updated to ${newTier}` });
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update user', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <ShieldCheck className="mr-2 h-8 w-8 text-primary" />
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground">Manage users and system settings.</p>
      </div>

      <div className="bg-card rounded-md border">
        <div className="p-4 border-b">
          <SearchBar onSearch={(q) => { setQuery(q); setOffset(0); }} placeholder="Search users by email..." />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={u.tier === 'paid' ? 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}>
                      {u.tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role !== 'admin' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleUpgrade(u.id, u.tier)}
                      >
                        <ArrowUpCircle className="h-4 w-4 mr-2" />
                        Toggle Tier
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination 
          offset={offset} 
          limit={limit} 
          total={total} 
          hasMore={hasMore} 
          onPageChange={setOffset} 
        />
      </div>
    </div>
  );
}
