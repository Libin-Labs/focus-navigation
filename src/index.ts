export interface FocusItem {
  id: string;
  disabled?: boolean;
  rect?: { x: number; y: number; width: number; height: number };
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
  snapshot(): { active: string | null; items: { id: string; tabIndex: 0 | -1 }[] };
}
export function createFocusNavigation(
  initial: readonly FocusItem[],
  options: FocusOptions = {},
): FocusNavigation {
  const mode = options.mode ?? 'roving';
  const columns = options.columns ?? 1;
  const wrap = options.wrap ?? false;
  const rtl = options.rtl ?? false;
  if (
    !['roving', 'grid', 'spatial'].includes(mode) ||
    !Number.isSafeInteger(columns) ||
    columns < 1 ||
    typeof wrap !== 'boolean' ||
    typeof rtl !== 'boolean'
  )
    throw new TypeError('Invalid focus options');
  let items: FocusItem[] = [];
  let active: string | null = null;
  function replace(next: readonly FocusItem[]): void {
    if (next.length > 100000) throw new RangeError('Too many focus items');
    const ids = new Set<string>();
    const copy = next.map((item) => {
      if (
        typeof item.id !== 'string' ||
        !item.id ||
        ids.has(item.id) ||
        (item.disabled !== undefined && typeof item.disabled !== 'boolean')
      )
        throw new TypeError('Invalid item ID');
      ids.add(item.id);
      if (mode === 'spatial' && !item.rect) throw new TypeError('Spatial mode requires rectangles');
      const r = item.rect;
      if (
        r &&
        (![r.x, r.y, r.width, r.height, r.x + r.width, r.y + r.height].every(Number.isFinite) ||
          r.width < 0 ||
          r.height < 0)
      )
        throw new TypeError('Invalid rectangle');
      return r ? { ...item, rect: { ...r } } : { ...item };
    });
    items = copy;
    if (!items.some((i) => i.id === active && !i.disabled))
      active = items.find((i) => !i.disabled)?.id ?? null;
  }
  replace(initial);
  return {
    replace,
    set(id) {
      if (!items.some((i) => i.id === id && !i.disabled))
        throw new TypeError('Unknown or disabled item');
      active = id;
    },
    snapshot: () => ({
      active,
      items: items.map((i) => ({ id: i.id, tabIndex: i.id === active ? 0 : -1 })),
    }),
    move(direction) {
      if (!['next', 'previous', 'left', 'right', 'up', 'down', 'first', 'last'].includes(direction))
        throw new TypeError('Invalid direction');
      const enabled = items.filter((i) => !i.disabled);
      if (!enabled.length) return null;
      if (direction === 'first' || direction === 'last')
        active = (direction === 'first' ? enabled[0]! : enabled.at(-1)!).id;
      else if (mode === 'spatial' && ['left', 'right', 'up', 'down'].includes(direction)) {
        const origin = items.find((i) => i.id === active)!.rect!;
        const horizontal = direction === 'left' || direction === 'right';
        const sign = direction === 'left' || direction === 'up' ? -1 : 1;
        const cx = origin.x + origin.width / 2,
          cy = origin.y + origin.height / 2;
        const ranked = enabled
          .filter((i) => i.id !== active)
          .map((i) => {
            const r = i.rect!;
            const dx = r.x + r.width / 2 - cx,
              dy = r.y + r.height / 2 - cy;
            return {
              id: i.id,
              primary: (horizontal ? dx : dy) * sign,
              cross: Math.abs(horizontal ? dy : dx),
            };
          })
          .filter((i) => i.primary > 0)
          .sort((a, b) => a.primary + a.cross * 2 - (b.primary + b.cross * 2));
        if (ranked[0]) active = ranked[0].id;
        else if (wrap) {
          const sorted = [...enabled].sort((a, b) => {
            const ar = a.rect!,
              br = b.rect!;
            return (
              sign *
              (horizontal
                ? ar.x + ar.width / 2 - (br.x + br.width / 2)
                : ar.y + ar.height / 2 - (br.y + br.height / 2))
            );
          });
          active = sorted[0]!.id;
        }
      } else {
        const sequential = direction === 'next' || direction === 'previous' || mode === 'roving';
        const pool = sequential ? enabled : items;
        let step = direction === 'previous' || direction === 'left' || direction === 'up' ? -1 : 1;
        if (rtl && (direction === 'left' || direction === 'right')) step *= -1;
        if (!sequential && (direction === 'up' || direction === 'down')) step *= columns;
        const start = pool.findIndex((i) => i.id === active);
        let index = start;
        const seen = new Set<number>([start]);
        for (let count = 0; count < pool.length; count++) {
          const next = index + step;
          if (
            !wrap &&
            (next < 0 ||
              next >= pool.length ||
              (!sequential &&
                Math.abs(step) === 1 &&
                Math.floor(next / columns) !== Math.floor(index / columns)))
          )
            break;
          index = ((next % pool.length) + pool.length) % pool.length;
          if (seen.has(index)) break;
          seen.add(index);
          if (!pool[index]!.disabled) {
            active = pool[index]!.id;
            break;
          }
        }
      }
      return active;
    },
  };
}
