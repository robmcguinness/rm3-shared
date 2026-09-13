import { RuleTester } from 'oxlint/plugins-dev';

import { noOverlayZIndexRule } from './no-overlay-z-index.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'overlayZIndex' };

tester.run('rm3-shadcn/no-overlay-z-index', noOverlayZIndexRule, {
  invalid: [
    { code: '<DialogContent className="z-50" />', errors: [error] },
    { code: '<PopoverContent className="w-80 z-[999]" />', errors: [error] },
    { code: '<TooltipContent className="md:z-10" />', errors: [error] },
    { code: '<SheetContent className={cn("z-50", className)} />', errors: [error] },
    { code: '<DropdownMenuContent className={`z-50 ${extra}`} />', errors: [error] },
    { code: '<DialogOverlay className={open ? "z-40" : "z-50"} />', errors: [error, error] },
    { code: '<Ui.DialogContent className="z-50" />', errors: [error] },
  ],
  valid: [
    '<DialogContent className="max-w-md" />',
    '<PopoverContent className="w-80" />',
    '<DialogContent className={cn("max-w-md", className)} />',
    '<DialogContent />',
    // Not an overlay.
    '<div className="fixed right-4 top-4 z-50" />',
    '<Card className="z-10" />',
    '<DialogTrigger className="z-10" />',
    '<Dialog className="z-10" />',
    '<Sidebar className="z-10" />',
  ],
});
