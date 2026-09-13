import { RuleTester } from 'oxlint/plugins-dev';

import { noButtonLoadingPropRule } from './no-button-loading-prop.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'loadingProp' };

tester.run('rm3-shadcn/no-button-loading-prop', noButtonLoadingPropRule, {
  invalid: [
    { code: '<Button isLoading>Save</Button>', errors: [error] },
    { code: '<Button isPending={pending}>Save</Button>', errors: [error] },
    { code: '<Button loading />', errors: [error] },
    { code: '<Button pending={true} />', errors: [error] },
    { code: '<InputGroupButton loading>Go</InputGroupButton>', errors: [error] },
    { code: '<SidebarMenuButton isLoading />', errors: [error] },
    { code: '<AlertDialogAction isPending>Delete</AlertDialogAction>', errors: [error] },
    { code: '<Button isLoading isPending />', errors: [error, error] },
  ],
  valid: [
    '<Button disabled><Spinner data-icon="inline-start" />Saving</Button>',
    '<Button disabled={pending}>Save</Button>',
    // A spread may carry anything; the linter cannot see it.
    '<Button {...props} />',
    // Not a shadcn button.
    '<LoadingButton loading />',
    '<Skeleton loading />',
    // A data attribute is a styling hook, not a prop the component lacks.
    '<Button data-loading />',
    '<Button aria-busy={pending} />',
  ],
});
