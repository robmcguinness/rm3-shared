import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, it } from 'node:test';

import reactDoctorPlugin, {
  NEXTJS_RULES,
  PREACT_RULES,
  REACT_NATIVE_RULES,
  RECOMMENDED_RULES,
  TANSTACK_QUERY_RULES,
  TANSTACK_START_RULES,
} from 'oxlint-plugin-react-doctor';
import { REACT_DOCTOR_RULES } from 'oxlint-plugin-react-doctor/core';

import {
  reactDoctorCapabilityRules,
  reactDoctorFrameworkRules,
  reactDoctorJsPlugin,
  reactDoctorRules,
  reactDoctorRulesOff,
  reactRules,
  rm3Config,
} from './index.ts';

/** oxlint scope names use underscores, plugin names do not. */
const OXLINT_SCOPES = new Set(['jsx_a11y', 'react', 'react_perf']);

const REACT_DOCTOR_PREFIX = 'react-doctor/';

/** One entry of `oxlint --rules --format=json`. Only three fields matter here. */
interface OxlintRuleListing {
  category: string;
  scope: string;
  value: string;
}

/**
 * oxlint's React-plugin rules keyed by rule id. `pnpm run test` puts the
 * package's `node_modules/.bin` on PATH, so the pinned oxlint is the one that
 * answers.
 */
function readOxlintReactRules(): Map<string, OxlintRuleListing> {
  const stdout = execFileSync('oxlint', ['--rules', '--format=json'], { encoding: 'utf8' });
  // SAFETY: `oxlint --rules --format=json` prints an array of rule listings, and
  // the three fields read below have been stable since oxlint 1.0.
  const listing = JSON.parse(stdout) as OxlintRuleListing[];

  return new Map(
    listing.filter((rule) => OXLINT_SCOPES.has(rule.scope)).map((rule) => [rule.value, rule]),
  );
}

const ruleId = (key: string): string => key.slice(REACT_DOCTOR_PREFIX.length);

const metadata = new Map(REACT_DOCTOR_RULES.map((entry) => [entry.key, entry.rule]));

/** Keys of `map` whose value is not `'off'`. */
const onKeys = (map: Record<string, string>): string[] =>
  Object.keys(map).filter((key) => map[key] !== 'off');

/**
 * react-doctor's recommended set minus the rules oxlint also ships. This is
 * what the exports below have to cover between them.
 */
function readRecommendedMinusPorted(): Record<string, string> {
  const oxlintRuleIds = new Set(readOxlintReactRules().keys());
  return Object.fromEntries(
    Object.entries(RECOMMENDED_RULES).filter(([key]) => !oxlintRuleIds.has(ruleId(key))),
  );
}

describe('reactDoctorJsPlugin', () => {
  it('points at the pinned plugin, resolved from rm3-shared', () => {
    assert.equal(reactDoctorJsPlugin.name, reactDoctorPlugin.meta.name);
    assert.ok(reactDoctorJsPlugin.specifier.startsWith('file://'));
    assert.match(reactDoctorJsPlugin.specifier, /oxlint-plugin-react-doctor/);
  });
});

describe('reactDoctorRules', () => {
  it("is a subset of react-doctor's recommended set, at react-doctor's severities", () => {
    const expected = readRecommendedMinusPorted();
    for (const [key, severity] of Object.entries(reactDoctorRules)) {
      assert.ok(key in expected, `${key} is not recommended, or oxlint already runs it`);
      if (!(key in reactDoctorRulesOff)) {
        assert.equal(severity, expected[key], `${key} severity drifted from react-doctor`);
      }
    }
  });

  it('accounts for every recommended rule it leaves out', () => {
    const expected = readRecommendedMinusPorted();
    const inCapabilityBucket = new Set(
      Object.values(reactDoctorCapabilityRules).flatMap((bucket) => onKeys(bucket)),
    );

    // A react-doctor bump that adds a recommended rule fails here, in this
    // repo, rather than in a consumer's `pnpm check`.
    for (const key of Object.keys(expected)) {
      if (key in reactDoctorRules || inCapabilityBucket.has(key)) {
        continue;
      }
      const disabledWhen = metadata.get(key)?.disabledWhen ?? [];
      assert.ok(
        disabledWhen.some((capability) => capability.startsWith('react:')),
        `${key} is recommended but nothing in @rm3/oxlint-config names it`,
      );
    }
  });

  it('names only rules the plugin registers for standalone oxlint', () => {
    const everyKey = [
      ...Object.keys(reactDoctorRules),
      ...Object.values(reactDoctorFrameworkRules).flatMap((bucket) => Object.keys(bucket)),
      ...Object.values(reactDoctorCapabilityRules).flatMap((bucket) => Object.keys(bucket)),
    ];
    for (const key of everyKey) {
      assert.ok(ruleId(key) in reactDoctorPlugin.rules, `${key} is not a plugin rule`);
    }
  });

  it('keeps the effect rules on, since oxlint has no port of them', () => {
    assert.equal(reactDoctorRules['react-doctor/no-derived-state'], 'warn');
    assert.equal(reactDoctorRules['react-doctor/no-adjust-state-on-prop-change'], 'warn');
    // `disabledWhen: ['react:18']`: automatic batching made the chain harmless.
    assert.ok(!('react-doctor/no-chain-state-updates' in reactDoctorRules));
  });

  it('assumes React 19', () => {
    // Requires React 18+, so still on.
    assert.equal(reactDoctorRules['react-doctor/no-react-dom-deprecated-apis'], 'warn');
    // Disabled on React 19+, where ref cleanups are valid.
    assert.ok(!('react-doctor/no-ref-callback-cleanup-before-react-19' in reactDoctorRules));
  });

  it('leaves environment-gated rules to the capability buckets', () => {
    assert.ok(!('react-doctor/react-compiler-no-manual-memoization' in reactDoctorRules));
    assert.ok(!('react-doctor/no-hydration-branch-on-browser-global' in reactDoctorRules));
    assert.equal(
      reactDoctorCapabilityRules['react-compiler'][
        'react-doctor/react-compiler-no-manual-memoization'
      ],
      'warn',
    );
    assert.equal(
      reactDoctorCapabilityRules.ssr['react-doctor/no-hydration-branch-on-browser-global'],
      'error',
    );
  });

  it('turns off in each bucket only rules the base set turns on', () => {
    for (const [capability, bucket] of Object.entries(reactDoctorCapabilityRules)) {
      for (const [key, severity] of Object.entries(bucket)) {
        if (severity === 'off') {
          assert.ok(key in reactDoctorRules, `${capability} turns off ${key}, which is not on`);
        }
      }
    }
  });
});

describe('reactDoctorFrameworkRules', () => {
  it("matches react-doctor's own per-framework sets", () => {
    assert.deepEqual(reactDoctorFrameworkRules.nextjs, NEXTJS_RULES);
    assert.deepEqual(reactDoctorFrameworkRules.preact, PREACT_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['react-native'], REACT_NATIVE_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['tanstack-query'], TANSTACK_QUERY_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['tanstack-start'], TANSTACK_START_RULES);
  });
});

describe('reactRules', () => {
  it('runs every recommended rule that reactDoctorRules leaves to oxlint', () => {
    const oxlintRules = readOxlintReactRules();
    // `rm3Config.categories` lists only the categories that are on.
    const enabledCategories = new Set(Object.keys(rm3Config.categories ?? {}));
    const named = new Set(Object.keys(reactRules));

    for (const key of Object.keys(RECOMMENDED_RULES)) {
      const listing = oxlintRules.get(ruleId(key));
      if (listing === undefined) {
        continue;
      }
      // `jsx_a11y` -> `jsx-a11y`, `react_perf` -> `react-perf`: the plugin name.
      const oxlintKey = `${listing.scope.replaceAll('_', '-')}/${ruleId(key)}`;
      assert.ok(
        enabledCategories.has(listing.category) || named.has(oxlintKey),
        `${key} is left to oxlint, but oxlint's ${listing.category} category is off ` +
          `and reactRules does not name ${oxlintKey}`,
      );
    }
  });

  it('names only rules that exist in oxlint', () => {
    // Catches a typo or a rule oxlint dropped in a bump.
    const oxlintRules = readOxlintReactRules();
    for (const oxlintKey of Object.keys(reactRules)) {
      const id = oxlintKey.slice(oxlintKey.indexOf('/') + 1);
      assert.ok(oxlintRules.has(id), `${oxlintKey} is not an oxlint rule`);
    }
  });
});
