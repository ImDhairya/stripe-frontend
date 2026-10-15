import { useEffect, useState, useCallback } from 'react';
import { searchApi } from '../../api/search';
import { adminApi } from '../../api/admin';
import type { User } from '../../api/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { SearchBar } from '../../components/shared/SearchBar';
import { Pagination } from '../../components/shared/Pagination';
import { ShieldCheck, ArrowUpCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const limit = 10;
  const { toast } = useToast();

  const toggleSort = () => {
    setSort((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setOffset(0);
  };

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setOffset(0);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await searchApi.search<User>('users', { q: query, limit, offset, sort });
      setUsers(res.data || []);
      setTotal(res.pagination?.total ?? (res as any).total ?? 0);
      setHasMore(res.pagination?.hasMore ?? (res as any).hasMore ?? false);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [query, offset, limit, sort]);

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
        <div className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <SearchBar onSearch={handleSearch} placeholder="Search users by email..." />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className="flex items-center gap-1.5 text-xs font-medium"
              title="Toggle ascending / descending date sort"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
              {sort === 'desc' ? 'Newest First (Desc)' : 'Oldest First (Asc)'}
            </Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead
                onClick={toggleSort}
                className="cursor-pointer select-none hover:text-primary transition-colors"
                title="Click to toggle sorting order"
              >
                <div className="flex items-center gap-1">
                  <span>Created</span>
                  {sort === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-muted-foreground text-sm">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
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
