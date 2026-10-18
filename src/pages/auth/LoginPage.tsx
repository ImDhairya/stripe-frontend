import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { ShieldCheck, ArrowRight, Lock, Store, Sparkles } from 'lucide-react';

const isEvaluatorMode = import.meta.env.VITE_EVALUATOR_MODE !== 'false';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(data);
      toast({ title: 'Success', description: 'Logged in successfully.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to login', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, pass: string, roleName: string) => {
    setValue('email', email);
    setValue('password', pass);
    try {
      setIsLoading(true);
      await login({ email, password: pass });
      toast({ title: 'Welcome to PayGate', description: `Authenticated as ${roleName}.` });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Connection Error', description: error.message || 'Failed to authenticate', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- MODE 1: EVALUATOR SANDBOX (Temporary 2-Month Evaluation Mode) ---
  if (isEvaluatorMode) {
    return (
      <AuthLayout>
        <Card className="w-full relative z-10 bg-card/95 backdrop-blur-sm border-border shadow-2xl max-w-md mx-auto">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium w-fit mx-auto">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Assessor Evaluation Environment
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              PayGate Sandbox Access
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Live payment gateway prototype. No password or approval required—click below to enter immediately.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Main Hero: Platform Admin (High prominence) */}
            <div className="p-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-[1px] shadow-lg shadow-indigo-500/10">
              <div className="bg-card rounded-[11px] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Platform Admin
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium border border-indigo-500/30">
                          RECOMMENDED
                        </span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Full system access • Paid tier unlocked
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unlocks Executive Dashboard, Architecture Stress-Tester (Idempotency Replay & Tamper Defense), Live Telemetry, Audit Trail, and User Tier Management.
                </p>

                <Button
                  type="button"
                  size="lg"
                  onClick={() => handleDemoLogin('admin@paygate.com', 'Admin@12345', 'Platform Admin')}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Connecting as Admin...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Enter as Platform Admin</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Tiny, subtle Merchant option (Not gathering attention) */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleDemoLogin('merchant@paygate.com', 'Merchant@12345', 'Merchant Store')}
                disabled={isLoading}
                className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Store className="h-3 w-3" />
                <span>Or preview restricted Merchant Store view</span>
              </button>
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-4 flex flex-col items-center justify-center border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <Lock className="h-3 w-3 text-muted-foreground/60" />
              <span>Authenticates via real JWTs on live <code className="font-mono text-[10px] bg-muted px-1 rounded">/api/v1/auth/login</code></span>
            </div>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  // --- MODE 2: STANDARD PRODUCTION AUTH (Toggled when VITE_EVALUATOR_MODE=false) ---
  return (
    <AuthLayout>
      <Card className="w-full relative z-10 bg-card border-border shadow-2xl max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border border-border/60 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              1-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin@paygate.com', 'Admin@12345', 'Platform Admin')}
                disabled={isLoading}
                className="text-xs h-9 border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400 font-medium flex flex-col items-center justify-center py-1"
              >
                <span>Admin (Paid Tier)</span>
                <span className="text-[10px] text-muted-foreground font-mono">admin@paygate.com</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('merchant@paygate.com', 'Merchant@12345', 'Merchant Store')}
                disabled={isLoading}
                className="text-xs h-9 border-border hover:bg-muted/80 font-medium flex flex-col items-center justify-center py-1"
              >
                <span>Merchant Store</span>
                <span className="text-[10px] text-muted-foreground font-mono">merchant@paygate.com</span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or with credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 text-center text-sm text-muted-foreground">
          <div>
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
