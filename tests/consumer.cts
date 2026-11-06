import { createFocusNavigation } from '@lp-labs/focus-navigation';

const focus = createFocusNavigation(
  [{ id: 'one' }, { id: 'disabled', disabled: true }, { id: 'two' }],
  { wrap: true },
);
if (focus.move('next') !== 'two') throw new Error('Disabled skip failed');
if (focus.move('next') !== 'one') throw new Error('Wrap failed');
if (focus.snapshot().items[0]?.tabIndex !== 0) throw new Error('Tab plan failed');

// @ts-expect-error invalid public API input must be rejected
createFocusNavigation([], { mode: 'browser' });
