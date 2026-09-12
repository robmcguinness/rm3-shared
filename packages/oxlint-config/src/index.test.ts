import type { AllowWarnDeny, DummyRule } from 'oxlint';

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';

import reactDoctorPlugin, {
  NEXTJS_RULES,
  PREACT_RULES,
  REACT_NATIVE_RULES,
  RECOMMENDED_RULES,
  TANSTACK_QUERY_RULES,
  TANSTACK_START_RULES,
} from 'oxlint-plugin-react-doctor';
import { REACT_DOCTOR_RULES } from 'oxlint-plugin-react-doctor/core';

import rm3NodePlugin from '@rm3/lint/node';
import rm3TailwindPlugin from '@rm3/lint/tailwind';

import {
  nodeRulesOff,
  nodeRulesOn,
  nodeTestRulesOff,
  reactDoctorCapabilityRules,
  reactDoctorFrameworkRules,
  reactDoctorJsPlugin,
  reactDoctorOxlintCounterparts,
  reactDoctorRules,
  reactDoctorRulesCoveredByOxlint,
  reactDoctorRulesOff,
  reactPlugins,
  reactRules,
  rm3Config,
  rm3NodeJsPlugin,
  rm3TailwindJsPlugin,
  shadcnRulesOff,
  tailwindRulesOn,
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
 * All oxlint rules keyed by config name. `pnpm run test` puts the
 * package's `node_modules/.bin` on PATH, so the pinned oxlint is the one that
 * answers.
 */
function readOxlintRules(): Map<string, OxlintRuleListing> {
  const stdout = execFileSync('oxlint', ['--rules', '--format=json'], { encoding: 'utf8' });
  // SAFETY: `oxlint --rules --format=json` prints an array of rule listings, and
  // the three fields read below have been stable since oxlint 1.0.
  const listing = JSON.parse(stdout) as OxlintRuleListing[];

  return new Map(
    listing.map((rule) => [
      rule.scope === 'eslint' ? rule.value : `${rule.scope.replaceAll('_', '-')}/${rule.value}`,
      rule,
    ]),
  );
}

const readOxlintReactRules = (): Map<string, OxlintRuleListing> =>
  new Map(
    [...readOxlintRules().values()]
      .filter((rule) => OXLINT_SCOPES.has(rule.scope))
      .map((rule) => [rule.value, rule]),
  );

const isRuleTuple = (setting: DummyRule): setting is [AllowWarnDeny, ...unknown[]] =>
  Array.isArray(setting);

const isOn = (value: AllowWarnDeny | undefined): boolean =>
  value === 'warn' || value === 'error' || value === 1 || value === 2;

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
  test('points at the pinned plugin, resolved from rm3-shared', () => {
    assert.equal(reactDoctorJsPlugin.name, reactDoctorPlugin.meta.name);
    assert.ok(reactDoctorJsPlugin.specifier.startsWith('file://'));
    assert.match(reactDoctorJsPlugin.specifier, /oxlint-plugin-react-doctor/);
  });
});

describe('reactDoctorRules', () => {
  test("is a subset of react-doctor's recommended set, at react-doctor's severities", () => {
    const expected = readRecommendedMinusPorted();
    for (const [key, severity] of Object.entries(reactDoctorRules)) {
      assert.ok(key in expected, `${key} is not recommended, or oxlint already runs it`);
      if (!(key in reactDoctorRulesOff) && !(key in reactDoctorRulesCoveredByOxlint)) {
        assert.equal(severity, expected[key], `${key} severity drifted from react-doctor`);
      }
    }
  });

  test('accounts for every recommended rule it leaves out', () => {
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

  test('names only rules the plugin registers for standalone oxlint', () => {
    const everyKey = [
      ...Object.keys(reactDoctorRules),
      ...Object.values(reactDoctorFrameworkRules).flatMap((bucket) => Object.keys(bucket)),
      ...Object.values(reactDoctorCapabilityRules).flatMap((bucket) => Object.keys(bucket)),
    ];
    for (const key of everyKey) {
      assert.ok(ruleId(key) in reactDoctorPlugin.rules, `${key} is not a plugin rule`);
    }
  });

  test('keeps the effect rules on, since oxlint has no port of them', () => {
    assert.equal(reactDoctorRules['react-doctor/no-derived-state'], 'warn');
    assert.equal(reactDoctorRules['react-doctor/no-adjust-state-on-prop-change'], 'warn');
    // `disabledWhen: ['react:18']`: automatic batching made the chain harmless.
    assert.ok(!('react-doctor/no-chain-state-updates' in reactDoctorRules));
  });

  test('assumes React 19', () => {
    // Requires React 18+, so still on.
    assert.equal(reactDoctorRules['react-doctor/no-react-dom-deprecated-apis'], 'warn');
    // Disabled on React 19+, where ref cleanups are valid.
    assert.ok(!('react-doctor/no-ref-callback-cleanup-before-react-19' in reactDoctorRules));
  });

  test('leaves environment-gated rules to the capability buckets', () => {
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

  test('turns off in each bucket only rules the base set turns on', () => {
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
  test("matches react-doctor's own per-framework sets", () => {
    assert.deepEqual(reactDoctorFrameworkRules.nextjs, NEXTJS_RULES);
    assert.deepEqual(reactDoctorFrameworkRules.preact, PREACT_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['react-native'], REACT_NATIVE_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['tanstack-query'], TANSTACK_QUERY_RULES);
    assert.deepEqual(reactDoctorFrameworkRules['tanstack-start'], TANSTACK_START_RULES);
  });
});

describe('reactRules', () => {
  test('runs every recommended rule that reactDoctorRules leaves to oxlint', () => {
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

  test('names only rules that exist in oxlint', () => {
    // Catches a typo or a rule oxlint dropped in a bump.
    const oxlintRules = readOxlintReactRules();
    for (const oxlintKey of Object.keys(reactRules)) {
      const id = oxlintKey.slice(oxlintKey.indexOf('/') + 1);
      assert.ok(oxlintRules.has(id), `${oxlintKey} is not an oxlint rule`);
    }
  });
});

describe('rm3Config', () => {
  test('includes every React plugin and react-doctor by default', () => {
    for (const plugin of reactPlugins) {
      assert.ok(rm3Config.plugins?.includes(plugin), `${plugin} is missing`);
    }
    assert.equal(reactDoctorJsPlugin.name, 'react-doctor');
    assert.ok(rm3Config.jsPlugins?.includes(reactDoctorJsPlugin));
  });

  test('includes the React and react-doctor rules without shadowing decisions', () => {
    for (const rules of [reactRules, reactDoctorRules]) {
      assert.deepEqual(
        Object.fromEntries(Object.keys(rules).map((key) => [key, rm3Config.rules?.[key]])),
        rules,
      );
    }
  });
});

describe('reactDoctorRulesCoveredByOxlint', () => {
  test('turns off only recommended rules', () => {
    for (const [key, severity] of Object.entries(reactDoctorRulesCoveredByOxlint)) {
      assert.equal(severity, 'off');
      assert.equal(reactDoctorRules[key], 'off');
      assert.ok(key in RECOMMENDED_RULES, `${key} is not recommended`);
    }
  });

  test('keeps every oxlint counterpart enabled', () => {
    const listings = readOxlintRules();
    for (const [doctorKey, oxlintKey] of Object.entries(reactDoctorOxlintCounterparts)) {
      const listing = listings.get(oxlintKey);
      assert.ok(listing, `${doctorKey} counterpart ${oxlintKey} does not exist`);
      // eslint's core rules are always available; only other scopes need a plugin.
      assert.ok(
        listing.scope === 'eslint' ||
          rm3Config.plugins?.some((plugin) => plugin === listing.scope.replaceAll('_', '-')),
        `${oxlintKey} plugin is not enabled`,
      );
      const setting = rm3Config.rules?.[oxlintKey];
      const severity = setting !== undefined && isRuleTuple(setting) ? setting[0] : setting;
      const category = Object.entries<AllowWarnDeny>({ ...rm3Config.categories }).find(
        ([name]) => name === listing.category,
      )?.[1];
      assert.ok(
        severity === undefined ? isOn(category) : isOn(severity),
        `${doctorKey} is off but ${oxlintKey} is not enabled`,
      );
    }
  });

  test('mirrors the no-await-in-loop decision', () => {
    assert.equal(
      rm3Config.rules?.['no-await-in-loop'],
      'off',
      'Move react-doctor/async-await-in-loop out of reactDoctorRulesOff if rm3 turns no-await-in-loop back on',
    );
    assert.equal(reactDoctorRulesOff['react-doctor/async-await-in-loop'], 'off');
  });
});

describe('nodeRules', () => {
  const RM3_NODE_PREFIX = 'rm3-node/';

  test('names only rules that exist in oxlint or in the rm3-node plugin', () => {
    // Catches a typo or a rule oxlint dropped in a bump.
    const oxlintRules = readOxlintRules();
    for (const key of [...Object.keys(nodeRulesOn), ...Object.keys(nodeRulesOff)]) {
      if (key.startsWith(RM3_NODE_PREFIX)) {
        assert.ok(
          key.slice(RM3_NODE_PREFIX.length) in rm3NodePlugin.rules,
          `${key} is not an rm3-node plugin rule`,
        );
      } else {
        assert.ok(oxlintRules.has(key), `${key} is not an oxlint rule`);
      }
    }
  });

  test('names every rm3-node plugin rule', () => {
    for (const id of Object.keys(rm3NodePlugin.rules)) {
      assert.ok(`${RM3_NODE_PREFIX}${id}` in nodeRulesOn, `rm3-node/${id} is not enabled`);
    }
    assert.equal(rm3NodeJsPlugin.name, rm3NodePlugin.meta?.name);
    assert.ok(rm3NodeJsPlugin.specifier.startsWith('file://'));
    assert.ok(rm3Config.jsPlugins?.includes(rm3NodeJsPlugin), 'rm3-node is not in jsPlugins');
  });

  test('opts in only rules whose category rm3Config turns off', () => {
    // A rule from an enabled category is already on; naming it again is
    // either a no-op or a severity change that should be recorded elsewhere.
    const oxlintRules = readOxlintRules();
    const enabledCategories = new Set(Object.keys(rm3Config.categories ?? {}));
    for (const key of Object.keys(nodeRulesOn)) {
      const listing = oxlintRules.get(key);
      if (listing !== undefined) {
        assert.ok(
          !enabledCategories.has(listing.category),
          `${key} is already on via the ${listing.category} category`,
        );
      }
    }
  });

  test('turns off in the test override only rules the base set turns on', () => {
    for (const key of Object.keys(nodeTestRulesOff)) {
      assert.ok(key in nodeRulesOn, `the test override relaxes ${key}, which is not on`);
    }
    const testOverride = rm3Config.overrides?.find((override) =>
      override.files.includes('**/*.test.ts'),
    );
    assert.ok(testOverride, 'no **/*.test.ts override');
    for (const [key, setting] of Object.entries(nodeTestRulesOff)) {
      assert.deepEqual(testOverride.rules?.[key], setting, `${key} is not in the test override`);
    }
  });

  test('keeps top-level await allowed, since unicorn recommends it', () => {
    const listing = readOxlintRules().get('unicorn/prefer-top-level-await');
    assert.ok(listing, 'unicorn/prefer-top-level-await does not exist');
    const category = Object.entries<AllowWarnDeny>({ ...rm3Config.categories }).find(
      ([name]) => name === listing.category,
    )?.[1];
    assert.ok(isOn(category), 'prefer-top-level-await is off');
    assert.equal(nodeRulesOff['node/no-top-level-await'], 'off');
    assert.ok(!('node/no-top-level-await' in nodeRulesOn));
  });

  test('requires fire-and-forget promises to end in .catch', () => {
    const setting = rm3Config.rules?.['typescript/no-floating-promises'];
    assert.ok(setting !== undefined && isRuleTuple(setting));
    assert.deepEqual(setting, ['error', { ignoreVoid: false }]);
  });

  test('includes the Node rules without shadowing decisions', () => {
    assert.deepEqual(
      Object.fromEntries(Object.keys(nodeRulesOff).map((key) => [key, rm3Config.rules?.[key]])),
      nodeRulesOff,
    );
    for (const key of Object.keys(nodeRulesOn)) {
      assert.ok(key in nodeRulesOff || rm3Config.rules?.[key] !== undefined, `${key} missing`);
    }
  });
});

describe('tailwindRules', () => {
  const RM3_TAILWIND_PREFIX = 'rm3-tailwind/';

  test('names only rules the rm3-tailwind plugin registers', () => {
    for (const key of Object.keys(tailwindRulesOn)) {
      assert.ok(key.startsWith(RM3_TAILWIND_PREFIX), `${key} is not an rm3-tailwind rule`);
      assert.ok(
        key.slice(RM3_TAILWIND_PREFIX.length) in rm3TailwindPlugin.rules,
        `${key} is not an rm3-tailwind plugin rule`,
      );
    }
  });

  test('names every rm3-tailwind plugin rule', () => {
    for (const id of Object.keys(rm3TailwindPlugin.rules)) {
      assert.ok(
        `${RM3_TAILWIND_PREFIX}${id}` in tailwindRulesOn,
        `rm3-tailwind/${id} is not enabled`,
      );
    }
    assert.equal(rm3TailwindJsPlugin.name, rm3TailwindPlugin.meta?.name);
    assert.ok(rm3TailwindJsPlugin.specifier.startsWith('file://'));
    assert.ok(
      rm3Config.jsPlugins?.includes(rm3TailwindJsPlugin),
      'rm3-tailwind is not in jsPlugins',
    );
  });

  test('includes the Tailwind rules without shadowing decisions', () => {
    for (const [key, setting] of Object.entries(tailwindRulesOn)) {
      assert.deepEqual(rm3Config.rules?.[key], setting, `${key} missing`);
    }
  });

  test('turns every rm3-tailwind rule off over vendored shadcn primitives', () => {
    // The primitives use `rounded-[...]` and friends; `shadcn add` overwrites edits.
    const off = new Map(Object.entries(shadcnRulesOff));
    for (const id of Object.keys(rm3TailwindPlugin.rules)) {
      assert.equal(off.get(`${RM3_TAILWIND_PREFIX}${id}`), 'off', `rm3-tailwind/${id} is on`);
    }
  });
});
