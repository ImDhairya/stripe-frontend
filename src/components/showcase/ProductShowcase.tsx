import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Shield, Webhook, Activity, Layers, RefreshCw, Database, Eye } from 'lucide-react';

interface Slide {
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  features: { icon: string; label: string; detail: string }[];
  codeSnippet?: string;
  codeLanguage?: string;
  diagram?: string;
  accentGradient: string;
}

const SLIDES: Slide[] = [
  {
    tag: 'PAYMENT ENGINE',
    tagColor: 'from-blue-500 to-cyan-400',
    title: 'Full Payment Lifecycle',
    subtitle: 'Create → Authorize → Capture → Refund — every state transition enforced by a formal state machine. Dual processor support: real Stripe SDK or deterministic dummy simulator.',
    features: [
      { icon: '⚡', label: 'Stripe + Dummy Processors', detail: 'Strategy pattern abstraction — swap processors without touching business logic' },
      { icon: '🔄', label: '7-State Machine', detail: 'requires_payment_method → processing → authorized → succeeded → refunded' },
      { icon: '💳', label: 'Live Status Sync', detail: 'GET /payments/:id live-queries Stripe API to reconcile pending states' },
      { icon: '🔁', label: 'Partial & Full Refunds', detail: 'Tracks refundedAmount, auto-transitions to refunded when fully refunded' },
    ],
    codeSnippet: `// Formal state machine enforcement
const VALID_TRANSITIONS = {
  requires_payment_method: ["processing", "failed", "cancelled"],
  processing: ["authorized", "succeeded", "failed"],
  authorized: ["succeeded", "cancelled"],  // capture or void
  succeeded: ["refunded"],                 // only refund allowed
  failed: [],                              // terminal
  refunded: [],                            // terminal
};

// Every mutation validates before executing
validateStateTransition(payment.status, "succeeded");`,
    accentGradient: 'from-blue-600/20 via-cyan-600/10 to-transparent',
  },
  {
    tag: 'API PROTECTION',
    tagColor: 'from-amber-500 to-orange-400',
    title: 'Production-Grade Middleware',
    subtitle: 'Six custom middleware layers protect every API call. Redis-backed rate limiting, SHA-256 idempotency with response replay, and tiered quota enforcement.',
    features: [
      { icon: '🛡️', label: 'Sliding Window Rate Limit', detail: 'Redis sorted sets — 30 req/min free, 300 req/min paid' },
      { icon: '🔑', label: 'Idempotency Keys', detail: 'SHA-256 body hash + response caching — replay exact responses on retry' },
      { icon: '📊', label: 'Monthly Quotas', detail: '100 payments/$5K free tier — counters only increment on 2xx responses' },
      { icon: '🚫', label: 'Conflict Detection', detail: 'Same key + different payload = 409, different user = 403, in-flight = 409' },
    ],
    codeSnippet: `// Redis sliding window (single MULTI transaction)
const multi = redis.multi();
multi.zremrangebyscore(key, 0, windowStart);
multi.zadd(key, now, \`\${now}-\${Math.random()}\`);
multi.zcard(key);  // → requestCount
multi.expire(key, 60);

// Idempotency: SHA-256 hash of request body
const hash = crypto.createHash("sha256")
  .update(JSON.stringify(req.body))
  .digest("hex");

// Response headers on every request
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1752591400`,
    accentGradient: 'from-amber-600/20 via-orange-600/10 to-transparent',
  },
  {
    tag: 'WEBHOOK SYSTEM',
    tagColor: 'from-emerald-500 to-green-400',
    title: 'Bidirectional Webhook Pipeline',
    subtitle: 'Inbound Stripe events with signature verification and deduplication. Outbound HMAC-signed delivery to user endpoints with BullMQ retry and exponential backoff.',
    features: [
      { icon: '📥', label: 'Inbound: Stripe → PayGate', detail: 'Signature verification → Postgres dedup (23505) → BullMQ queue → 3 retries' },
      { icon: '📤', label: 'Outbound: PayGate → User', detail: 'HMAC-SHA256 signed payloads mimicking Stripe signature format' },
      { icon: '♻️', label: 'Exponential Backoff', detail: 'Failed deliveries retry with 1s → 2s → 4s delay, tracked in webhook_events' },
      { icon: '🔐', label: 'Per-Endpoint Secrets', detail: 'Auto-generated secrets, signature = HMAC(timestamp.payload, secret)' },
    ],
    codeSnippet: `// Inbound: Deduplicate with Postgres unique constraint
await db.insert(stripeEvents).values({
  id: event.id,        // evt_1Ox3...
  type: event.type,    // invoice.payment_failed
  processed: false
});
// catch error code 23505 → already received, skip

// Outbound: HMAC-SHA256 signing
const signature = crypto
  .createHmac("sha256", endpoint.secret)
  .update(\`\${timestamp}.\${payload}\`)
  .digest("hex");

headers: { "Stripe-Signature": \`t=\${ts},v1=\${sig}\` }`,
    accentGradient: 'from-emerald-600/20 via-green-600/10 to-transparent',
  },
  {
    tag: 'AUTH & RBAC',
    tagColor: 'from-violet-500 to-purple-400',
    title: 'Dual-Token Auth + Tiered RBAC',
    subtitle: 'Short-lived access JWT + rotating refresh tokens stored in Redis. Two-dimensional access control: role-based (user/admin) × tier-based (free/paid).',
    features: [
      { icon: '🎫', label: 'JWT + Refresh Rotation', detail: 'Access token (short) + Refresh token (30d) with single-use JTI in Redis' },
      { icon: '🔄', label: 'Silent Token Refresh', detail: 'Frontend auto-refreshes on 401 — queues concurrent requests, retries all' },
      { icon: '👤', label: 'Role × Tier Matrix', detail: 'requireRole("admin") + requireTier("paid") — orthogonal middleware guards' },
      { icon: '🔒', label: 'Argon2 + HTTP-Only Cookies', detail: 'Password hashing with Argon2, tokens in HTTP-only cookies (no XSS)' },
    ],
    codeSnippet: `// Access control matrix
┌─────────────┬──────────┬──────────┬─────────┐
│ Resource     │ Free     │ Paid     │ Admin   │
├─────────────┼──────────┼──────────┼─────────┤
│ Payments     │ dummy    │ stripe   │ all     │
│ Rate Limit   │ 30/min   │ 300/min  │ 300/min │
│ Quotas       │ 100/mo   │ 10K/mo   │ 10K/mo  │
│ Webhooks     │ ✗        │ ✓        │ ✓       │
│ Admin Panel  │ ✗        │ ✗        │ ✓       │
└─────────────┴──────────┴──────────┴─────────┘

// Refresh token rotation (single-use JTI)
await redis.del(\`refresh_token:\${userId}:\${oldJti}\`);
const newToken = await issueRefreshToken(userId);`,
    accentGradient: 'from-violet-600/20 via-purple-600/10 to-transparent',
  },
  {
    tag: 'OBSERVABILITY',
    tagColor: 'from-rose-500 to-pink-400',
    title: 'Full Observability Stack',
    subtitle: 'OpenTelemetry distributed tracing, Prometheus custom metrics with /metrics endpoint, structured Pino logging, and BullMQ queue depth monitoring — ready for Grafana dashboards.',
    features: [
      { icon: '📡', label: 'OpenTelemetry Tracing', detail: 'Auto-instrumented traces exported to Jaeger via OTLP HTTP collector' },
      { icon: '📈', label: 'Prometheus Metrics', detail: 'HTTP duration histograms, error counters, webhook lag gauge, queue depth' },
      { icon: '📋', label: 'Structured Logging', detail: 'Pino JSON logs with named loggers per component — queryable in any log aggregator' },
      { icon: '⏱️', label: 'Queue Monitoring', detail: 'BullMQ job counts polled every 5s → failed_payment_retry_queue_depth gauge' },
    ],
    codeSnippet: `// Custom Prometheus metrics
http_request_duration_seconds{
  method="POST", route="/payments", code="201"
}  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]

webhook_processing_lag_seconds    → Gauge
failed_payment_retry_queue_depth  → Gauge
app_error_rates_total{type, component} → Counter

// OpenTelemetry setup
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://jaeger:4318/v1/traces"
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: "paygate-backend",
});`,
    accentGradient: 'from-rose-600/20 via-pink-600/10 to-transparent',
  },
  {
    tag: 'ARCHITECTURE',
    tagColor: 'from-sky-500 to-indigo-400',
    title: 'System Architecture',
    subtitle: 'Express API + separate BullMQ worker process. PostgreSQL with Drizzle ORM (9 tables, cascading FKs), Redis for caching/queues/rate-limits. Nightly cron wipes the DB for sandbox mode.',
    features: [
      { icon: '🏗️', label: 'Component-Based Backend', detail: '9 domain components: users, payments, refunds, subscriptions, webhooks, admin, search' },
      { icon: '⚙️', label: '3 BullMQ Workers', detail: 'Inbound Stripe events, outbound webhook delivery, nightly DB cleanup cron' },
      { icon: '🗄️', label: '9 PostgreSQL Tables', detail: 'Full FK graph with CASCADE deletes, UUID PKs, JSONB metadata, enum types' },
      { icon: '🔍', label: 'Universal Search', detail: 'GET /search/:resource — paginated, sortable, date-filtered across all entities' },
    ],
    diagram: `┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  Dashboard │ Payments │ Webhooks │ Admin │ Checkout  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT + Cookies)
┌──────────────────────▼──────────────────────────────┐
│              Express.js API Server                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ │Rate Limit│→│Idempotent│→│  Quota   │→│ Handler │ │
│ └──────────┘ └──────────┘ └──────────┘ └────┬────┘ │
│                                              │      │
│  ┌─────────────────┐    ┌──────────────────┐ │      │
│  │ Stripe Processor│    │ Dummy Processor  │ │      │
│  └────────┬────────┘    └────────┬─────────┘ │      │
└───────────┼──────────────────────┼───────────┼──────┘
            │                      │           │
     ┌──────▼──────┐        ┌─────▼─────┐  ┌──▼──────┐
     │  Stripe API │        │ In-Memory │  │PostgreSQL│
     └─────────────┘        └───────────┘  │ 9 tables │
                                           └──┬──────┘
┌──────────────────────────────────────────────┼──────┐
│               BullMQ Workers (Redis)         │      │
│  ┌────────────┐ ┌───────────┐ ┌────────────┐ │      │
│  │  Inbound   │ │ Outbound  │ │   Nightly  │ │      │
│  │  Stripe    │ │ Webhooks  │ │  Cleanup   │ │      │
│  └────────────┘ └───────────┘ └────────────┘ │      │
└──────────────────────────────────────────────┘      │
┌─────────────────────────────────────────────────────┐
│  Observability: OpenTelemetry → Jaeger │ Prometheus  │
└─────────────────────────────────────────────────────┘`,
    accentGradient: 'from-sky-600/20 via-indigo-600/10 to-transparent',
  },
];

const ICON_MAP: Record<string, any> = {
  'PAYMENT ENGINE': Zap,
  'API PROTECTION': Shield,
  'WEBHOOK SYSTEM': Webhook,
  'AUTH & RBAC': Layers,
  'OBSERVABILITY': Eye,
  'ARCHITECTURE': Database,
};

export function ProductShowcase({ onClose }: { onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 left, 1 right, 0 initial
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const goTo = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? 1 : -1);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  }, [currentSlide, isAnimating]);

  const next = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) goTo(currentSlide + 1);
  }, [currentSlide, goTo]);

  const prev = useCallback(() => {
    if (currentSlide > 0) goTo(currentSlide - 1);
  }, [currentSlide, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  const slide = SLIDES[currentSlide];
  const SlideIcon = ICON_MAP[slide.tag] || Zap;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(222 47% 11%) 50%, hsl(230 40% 14%) 100%)' }}
    >
      {/* Ambient glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.accentGradient} transition-all duration-700`} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] opacity-20 transition-all duration-700"
        style={{ background: `linear-gradient(to right, ${slide.tagColor.includes('blue') ? '#3b82f6' : slide.tagColor.includes('amber') ? '#f59e0b' : slide.tagColor.includes('emerald') ? '#10b981' : slide.tagColor.includes('violet') ? '#8b5cf6' : slide.tagColor.includes('rose') ? '#f43f5e' : '#0ea5e9'}, transparent)` }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <span className="font-bold text-xl tracking-tight text-white">PayGate</span>
          <span className="text-xs text-white/40 font-mono">/ System Overview</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main content area */}
      <div className="absolute inset-0 top-16 bottom-20 flex overflow-hidden">
        <div className={`w-full flex transition-all duration-300 ${isAnimating ? (direction > 0 ? 'opacity-0 translate-x-[-20px]' : 'opacity-0 translate-x-[20px]') : 'opacity-100 translate-x-0'}`}>
          <div className="w-full flex flex-col lg:flex-row gap-6 px-6 lg:px-12 py-6 overflow-y-auto">
            {/* Left panel: Info */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              {/* Tag */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${slide.tagColor} text-white text-xs font-bold tracking-widest`}>
                  <SlideIcon className="w-3.5 h-3.5" />
                  {slide.tag}
                </div>
                <span className="text-white/30 text-xs font-mono">{String(currentSlide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-base lg:text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
                {slide.subtitle}
              </p>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slide.features.map((feature, i) => (
                  <div
                    key={i}
                    className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-default"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{feature.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/90 mb-1">{feature.label}</div>
                        <div className="text-xs text-white/45 leading-relaxed">{feature.detail}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel: Code/Diagram */}
            <div className="flex-1 flex items-center justify-center min-w-0 lg:max-w-[50%]">
              <div className="w-full max-w-2xl">
                {/* Terminal window */}
                <div className="rounded-xl border border-white/[0.08] bg-[hsl(222,50%,6%)] shadow-2xl overflow-hidden">
                  {/* Terminal header */}
                  <div className="h-10 bg-white/[0.04] border-b border-white/[0.06] flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-xs text-white/30 font-mono">
                      {slide.diagram ? 'architecture.txt' : 'implementation.ts'}
                    </span>
                  </div>
                  {/* Code content */}
                  <div className="p-5 overflow-x-auto">
                    <pre className="text-[11px] sm:text-xs leading-[1.7] font-mono text-white/70 whitespace-pre">
                      {slide.diagram || slide.codeSnippet}
                    </pre>
                  </div>
                </div>

                {/* Tech badges */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {currentSlide === 0 && ['Stripe SDK', 'Drizzle ORM', 'PostgreSQL', 'TypeScript'].map(t => <TechBadge key={t} label={t} />)}
                  {currentSlide === 1 && ['Redis', 'SHA-256', 'Sorted Sets', 'MULTI/EXEC'].map(t => <TechBadge key={t} label={t} />)}
                  {currentSlide === 2 && ['BullMQ', 'HMAC-SHA256', 'Exponential Backoff', 'Dedup'].map(t => <TechBadge key={t} label={t} />)}
                  {currentSlide === 3 && ['jose (JWT)', 'Argon2', 'Redis TTL', 'HTTP-Only'].map(t => <TechBadge key={t} label={t} />)}
                  {currentSlide === 4 && ['OpenTelemetry', 'Prometheus', 'Pino', 'Jaeger'].map(t => <TechBadge key={t} label={t} />)}
                  {currentSlide === 5 && ['Express.js', 'Node.js ≥22', 'Render', 'Vite + React'].map(t => <TechBadge key={t} label={t} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-between px-6 lg:px-12 z-20 border-t border-white/[0.06] bg-black/20 backdrop-blur-sm">
        {/* Slide indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => {
            const Icon = ICON_MAP[s.tag] || Zap;
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  i === currentSlide
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{s.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Nav arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {currentSlide === SLIDES.length - 1 ? (
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-500/20"
            >
              Get Started →
            </button>
          ) : (
            <button
              onClick={next}
              className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TechBadge({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-white/40 tracking-wide">
      {label}
    </span>
  );
}
