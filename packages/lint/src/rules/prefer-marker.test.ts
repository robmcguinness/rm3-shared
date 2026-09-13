import { RuleTester } from 'oxlint/plugins-dev';

import { preferMarkerRule } from './prefer-marker.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const error = { messageId: 'separatorRow' };

tester.run('rm3-shadcn/prefer-marker', preferMarkerRule, {
  invalid: [
    {
      code: '<div className="flex items-center gap-3 py-2"><Separator className="flex-1" /><span className="text-xs">Today</span><Separator className="flex-1" /></div>',
      errors: [error],
    },
    { code: '<div><Separator />Today<Separator /></div>', errors: [error] },
    { code: '<div><Separator />{label}<Separator /></div>', errors: [error] },
    {
      code: '<div className="flex items-center"><Separator className="flex-1" /><span>or</span></div>',
      errors: [error],
    },
    {
      code: '<div className="flex items-center"><span>or</span><Separator className={cn("flex-1")} /></div>',
      errors: [error],
    },
  ],
  valid: [
    '<Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>',
    // A separator beside content is a section break.
    '<div><Separator /><p>x</p></div>',
    '<div><span>a</span><Separator /><span>b</span></div>',
    '<div><Separator /><Separator /></div>',
    // Sections, not a label, between the separators.
    '<Card><CardHeader /><Separator /><CardContent /><Separator /><CardFooter /></Card>',
    '<div><Separator /><div>a</div><Separator /></div>',
    // Toolbar dividers.
    '<div><Button /><Separator orientation="vertical" /><span>3</span><Separator orientation="vertical" /><Button /></div>',
    // Nothing beside the stretched separator.
    '<div><Separator className="flex-1" /></div>',
  ],
});
