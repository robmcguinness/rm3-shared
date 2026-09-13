import { RuleTester } from 'oxlint/plugins-dev';

import { requireFieldStatePairingRule } from './require-field-state-pairing.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const controlMissingState = { messageId: 'controlMissingState' };
const fieldMissingState = { messageId: 'fieldMissingState' };

tester.run('rm3-shadcn/require-field-state-pairing', requireFieldStatePairingRule, {
  invalid: [
    {
      code: '<Field data-invalid><FieldLabel>Email</FieldLabel><Input /></Field>',
      errors: [controlMissingState],
    },
    {
      code: '<Field data-invalid={!!error}><Input /><FieldError /></Field>',
      errors: [controlMissingState],
    },
    { code: '<Field data-disabled><Checkbox /></Field>', errors: [controlMissingState] },
    {
      code: '<Field data-invalid><InputGroup><InputGroupInput /></InputGroup></Field>',
      errors: [controlMissingState],
    },
    {
      code: '<Field data-invalid><Select><SelectTrigger /></Select></Field>',
      errors: [controlMissingState],
    },
    // The wrong attribute on the control.
    {
      code: '<Field data-disabled><Input aria-invalid /></Field>',
      errors: [controlMissingState, fieldMissingState],
    },
    { code: '<Field><Input aria-invalid /></Field>', errors: [fieldMissingState] },
    { code: '<Field><FieldLabel /><Checkbox disabled /></Field>', errors: [fieldMissingState] },
    {
      code: '<Field><FieldContent><Input aria-invalid={!!error} /></FieldContent></Field>',
      errors: [fieldMissingState],
    },
    // A control in a nested Field belongs to the nested Field.
    {
      code: '<Field data-invalid><Field><Input aria-invalid /></Field></Field>',
      errors: [fieldMissingState],
    },
  ],
  valid: [
    '<Field data-invalid><FieldLabel>Email</FieldLabel><Input aria-invalid /></Field>',
    '<Field data-invalid={!!error}><Input aria-invalid={!!error} /><FieldError /></Field>',
    '<Field data-disabled><Select disabled><SelectTrigger /></Select></Field>',
    '<Field data-invalid data-disabled><Input aria-invalid disabled /></Field>',
    '<Field data-invalid>{items.map((item) => <Checkbox key={item} aria-invalid />)}</Field>',
    '<Field data-invalid><Input aria-invalid={false} /></Field>',
    // Content the linter cannot see.
    '<Field data-invalid>{children}</Field>',
    '<Field data-invalid><EmailInput /></Field>',
    '<Field data-invalid><Input {...register("email")} /></Field>',
    '<Field {...fieldProps}><Input aria-invalid /></Field>',
    // No control to carry the attribute.
    '<Field data-invalid><FieldLabel>Email</FieldLabel><FieldError /></Field>',
    // No Field.
    '<Input aria-invalid />',
    '<div><Input disabled /></div>',
    // The nested Field owns its own control; the outer pairs with the outer control.
    '<Field data-invalid><Field><Input /></Field><Input aria-invalid /></Field>',
    // A prop, not a child.
    '<Field data-invalid render={<Input />} />',
  ],
});
