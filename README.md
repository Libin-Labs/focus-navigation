# @lp-labs/focus-navigation

Roving, grid and supplied-rectangle spatial focus navigation plans with disabled and wrap rules.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 439. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/focus-navigation
```

CommonJS: `const { createFocusNavigation } = require('@lp-labs/focus-navigation')`.

## Quickstart

```js
import { createFocusNavigation } from '@lp-labs/focus-navigation';

const focus = createFocusNavigation(
  [{ id: 'one' }, { id: 'disabled', disabled: true }, { id: 'two' }],
  { wrap: true },
);
if (focus.move('next') !== 'two') throw new Error('Disabled skip failed');
if (focus.move('next') !== 'one') throw new Error('Wrap failed');
if (focus.snapshot().items[0]?.tabIndex !== 0) throw new Error('Tab plan failed');
```

## API, customization and contracts

`createFocusNavigation(items, options?)` copies up to 100000 items and optional rectangles.
IDs must be unique and nonempty. Rectangles have finite x/y and nonnegative finite width/height
with finite right/bottom. Options: mode 'roving' (default), 'grid', 'spatial'; columns positive
safe integer (default 1); wrap false; rtl false. Spatial mode requires every rectangle.
Options are captured at construction. The first enabled item initially owns the active ID;
an all-disabled/empty set has null.

`move(direction)` accepts next, previous, first, last, left, right, up, down.
Next/previous traverse enabled source order in all modes; first/last choose enabled endpoints.
Roving directions traverse enabled order; RTL reverses horizontal left/right only.
Grid up/down stride columns through original slots, skipping disabled candidates along that
stride; horizontal moves do not cross rows unless wrap is enabled. Wrapped grid arithmetic
is modulo item count, including incomplete last rows, and stops on a repeated index.
Spatial directions use rectangle centers in physical coordinates (RTL does not change them);
eligible forward candidates minimize primary distance + 2 * perpendicular distance, source
order breaking ties. If wrapping and none is forward, choose the opposite axis extreme.

`set(id)` activates an enabled ID. `replace(items)` validates atomically, retaining active
only if still enabled, else selecting the first enabled ID. `snapshot()` returns a detached
active ID and one tabIndex:0 entry (or none), every other entry -1. Your renderer decides how
and whether to apply it; the library never calls focus().

Invalid options, IDs, rectangles, direction or set target throw TypeError; item limit throws
RangeError. Moves cost O(N log N) spatial worst case, O(N) otherwise; replace/snapshot O(N),
memory O(N). This is navigation, not selection-model multi-selection or accessibility validation.

## Complete public declarations

```ts
export interface FocusItem {
  id: string;
  disabled?: boolean;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
export type Direction = 'next' | 'previous' | 'left' | 'right' | 'up' | 'down' | 'first' | 'last';
export interface FocusOptions {
  mode?: 'roving' | 'grid' | 'spatial';
  columns?: number;
  wrap?: boolean;
  rtl?: boolean;
}
export interface FocusNavigation {
  move(direction: Direction): string | null;
  set(id: string): void;
  replace(items: readonly FocusItem[]): void;
  snapshot(): {
    active: string | null;
    items: {
      id: string;
      tabIndex: 0 | -1;
    }[];
  };
}
export declare function createFocusNavigation(
  initial: readonly FocusItem[],
  options?: FocusOptions,
): FocusNavigation;
```

## Scope and performance

Deterministic active-ID and tab-index plans; no browser focusing, DOM measurement, focus containment or security claim.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
