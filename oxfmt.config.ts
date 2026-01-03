import { rm3Fmt } from '@rm3/oxfmt-config';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...rm3Fmt,
  // Claude loads everything under `skills/` verbatim, so reflowing that
  // markdown would rewrite prompt text the plugin ships. `.fetch-skill-cache/`
  // is downloaded third-party content. Both are repo-local, so they stay out of
  // the shared `rm3Fmt` and live only here.
  ignorePatterns: [...rm3Fmt.ignorePatterns, '.fetch-skill-cache', 'skills'],
});
