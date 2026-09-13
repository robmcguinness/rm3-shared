import { RuleTester } from 'oxlint/plugins-dev';

import { preferSkeletonRule } from './prefer-skeleton.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'rawPulse' };

tester.run('rm3-shadcn/prefer-skeleton', preferSkeletonRule, {
  invalid: [
    { code: '<div className="animate-pulse rounded bg-muted h-4" />', errors: [error] },
    { code: '<div className="animate-pulse"><div className="h-4" /></div>', errors: [error] },
    { code: '<span className={cn("animate-pulse", className)} />', errors: [error] },
    { code: '<div className="motion-safe:animate-pulse" />', errors: [error] },
    { code: '<div className={`animate-pulse ${extra}`} />', errors: [error] },
  ],
  valid: [
    '<Skeleton className="h-4 w-3/4" />',
    '<div className="animate-spin" />',
    '<Spinner />',
    // A component that pulses is a live indicator, not a placeholder.
    '<Badge className="animate-pulse">Live</Badge>',
    '<div className="shimmer">Thinking…</div>',
    '<div className="rounded bg-muted h-4" />',
  ],
});
