import { RuleTester } from 'oxlint/plugins-dev';

import { noBaseApiMismatchRule } from './no-base-api-mismatch.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const otherApi = { messageId: 'otherApi' };
const stringValue = { messageId: 'stringValue' };
const singleArray = { messageId: 'singleArray' };
const numberValue = { messageId: 'numberValue' };
const missingType = { messageId: 'missingType' };
const bothApis = { messageId: 'bothApis' };
const radix = [{ base: 'radix' }];

tester.run('rm3-shadcn/no-base-api-mismatch', noBaseApiMismatchRule, {
  invalid: [
    // Base UI (the default).
    { code: '<DialogTrigger asChild><Button /></DialogTrigger>', errors: [otherApi] },
    { code: '<SelectContent position="popper" />', errors: [otherApi] },
    { code: '<ToggleGroup type="single" value="a" />', errors: [otherApi, stringValue] },
    {
      code: '<Accordion type="single" collapsible defaultValue="a" />',
      errors: [otherApi, otherApi, stringValue],
    },
    { code: '<Accordion defaultValue={"a"} />', errors: [stringValue] },
    { code: '<Slider defaultValue={[50]} />', errors: [singleArray] },
    { code: '<Slider value={[value]} />', errors: [singleArray] },
    { code: '<Button asChild render={<a />} />', errors: [bothApis] },
    { code: '<Button asChild render={<a />} />', errors: [bothApis], options: radix },
    // Radix.
    { code: '<Button render={<a href="/" />} />', errors: [otherApi], options: radix },
    { code: '<SelectContent alignItemWithTrigger={false} />', errors: [otherApi], options: radix },
    { code: '<Accordion multiple />', errors: [missingType, otherApi], options: radix },
    { code: '<Accordion defaultValue={["a"]} />', errors: [missingType], options: radix },
    { code: '<ToggleGroup multiple />', errors: [otherApi], options: radix },
    { code: '<Select multiple />', errors: [otherApi], options: radix },
    {
      code: '<Select itemToStringValue={(item) => item.id} />',
      errors: [otherApi],
      options: radix,
    },
    { code: '<Slider defaultValue={50} />', errors: [numberValue], options: radix },
  ],
  valid: [
    // Base UI.
    '<DialogTrigger render={<Button />} />',
    '<Accordion defaultValue={["a"]} />',
    '<Accordion multiple defaultValue={["a", "b"]} />',
    '<ToggleGroup defaultValue={["daily"]} />',
    '<Slider defaultValue={50} />',
    '<Slider defaultValue={[20, 80]} />',
    '<SelectContent alignItemWithTrigger={false} />',
    '<Select items={items} />',
    // Base UI's `Select.Value` takes `placeholder` as well; the null item is a preference.
    '<SelectValue placeholder="Pick one" />',
    // Not read: a variable.
    '<ToggleGroup value={value} />',
    '<Slider value={values} />',
    '<Accordion defaultValue={open} />',
    // Radix.
    { code: '<DialogTrigger asChild><Button /></DialogTrigger>', options: radix },
    { code: '<Accordion type="single" collapsible defaultValue="a" />', options: radix },
    { code: '<ToggleGroup type="multiple" defaultValue={["a"]} />', options: radix },
    { code: '<SelectContent position="popper" />', options: radix },
    { code: '<SelectValue placeholder="Pick one" />', options: radix },
    { code: '<Slider defaultValue={[50]} />', options: radix },
    { code: '<Accordion {...props} />', options: radix },
    // A function render is react-hook-form's Controller, not Base UI.
    { code: '<Controller render={({ field }) => <Input {...field} />} />', options: radix },
    { code: '<Button render={renderLink} />', options: radix },
  ],
});
