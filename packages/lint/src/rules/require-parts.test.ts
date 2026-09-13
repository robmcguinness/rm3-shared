import { RuleTester } from 'oxlint/plugins-dev';

import { requirePartsRule } from './require-parts.ts';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } });
const title = { messageId: 'missingTitle' };
const fallback = { messageId: 'missingFallback' };

tester.run('rm3-shadcn/require-parts', requirePartsRule, {
  invalid: [
    { code: '<DialogContent><p>Hi</p></DialogContent>', errors: [title] },
    { code: '<DialogContent />', errors: [title] },
    {
      code: '<DialogContent><DialogHeader><DialogDescription>Update.</DialogDescription></DialogHeader></DialogContent>',
      errors: [title],
    },
    { code: '<DialogContent>{items.map((i) => <Row key={i} />)}</DialogContent>', errors: [title] },
    { code: '<DialogContent>{open && <Form />}</DialogContent>', errors: [title] },
    { code: '<SheetContent side="right"><SheetHeader /></SheetContent>', errors: [title] },
    { code: '<DrawerContent><DrawerHeader /></DrawerContent>', errors: [title] },
    { code: '<AlertDialogContent><AlertDialogFooter /></AlertDialogContent>', errors: [title] },
    // The nested dialog's title does not count for the outer one.
    {
      code: '<DialogContent><Dialog><DialogContent><DialogTitle>Inner</DialogTitle></DialogContent></Dialog></DialogContent>',
      errors: [title],
    },
    { code: '<Avatar><AvatarImage src="/a.png" alt="" /></Avatar>', errors: [fallback] },
    { code: '<Avatar />', errors: [fallback] },
    { code: '<Avatar className="size-8"><AvatarImage src={src} /></Avatar>', errors: [fallback] },
  ],
  valid: [
    '<DialogContent><DialogHeader><DialogTitle>Edit</DialogTitle></DialogHeader></DialogContent>',
    '<DialogContent><DialogTitle className="sr-only">Edit</DialogTitle><Form /></DialogContent>',
    '<DialogContent>{open ? <DialogTitle>A</DialogTitle> : <DialogTitle>B</DialogTitle>}</DialogContent>',
    '<DialogContent>{[<DialogTitle key="t">A</DialogTitle>]}</DialogContent>',
    '<DialogContent><>{<DialogTitle>A</DialogTitle>}</></DialogContent>',
    '<SheetContent><SheetTitle>Filters</SheetTitle></SheetContent>',
    '<DrawerContent><DrawerHeader><DrawerTitle>Move</DrawerTitle></DrawerHeader></DrawerContent>',
    '<AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sure?</AlertDialogTitle></AlertDialogHeader></AlertDialogContent>',
    '<Avatar><AvatarImage src="/a.png" alt="" /><AvatarFallback>JD</AvatarFallback></Avatar>',
    '<Avatar><AvatarFallback>JD</AvatarFallback></Avatar>',
    // Content the linter cannot see.
    '<DialogContent>{children}</DialogContent>',
    '<DialogContent>{props.children}</DialogContent>',
    '<DialogContent>{renderBody()}</DialogContent>',
    '<DialogContent {...props} />',
    '<DialogContent children={body} />',
    '<DialogContent><EditProfileDialogBody /></DialogContent>',
    '<DialogContent><DialogBody /></DialogContent>',
    '<Avatar><UserAvatarImage /></Avatar>',
    // Look-alikes.
    '<Dialog><DialogTrigger /></Dialog>',
    '<div><AvatarImage src="/a.png" /></div>',
  ],
});
