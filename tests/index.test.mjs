import test from 'node:test';
import assert from 'node:assert/strict';
import { createFocusNavigation } from '../dist/esm/index.js';

test('roving focus skips disabled and emits exactly one tab stop', () => {
  const f = createFocusNavigation([{ id: 'a' }, { id: 'b', disabled: true }, { id: 'c' }]);
  assert.equal(f.move('next'), 'c');
  assert.equal(f.move('next'), 'c');
  assert.deepEqual(f.snapshot(), {
    active: 'c',
    items: [
      { id: 'a', tabIndex: -1 },
      { id: 'b', tabIndex: -1 },
      { id: 'c', tabIndex: 0 },
    ],
  });
});
test('wrapping RTL roving and first last semantics', () => {
  const f = createFocusNavigation([{ id: 'a' }, { id: 'b' }], { rtl: true, wrap: true });
  assert.equal(f.move('right'), 'b');
  assert.equal(f.move('right'), 'a');
  assert.equal(f.move('last'), 'b');
  assert.equal(f.move('first'), 'a');
});
test('grid directions preserve columns and do not cross rows without wrap', () => {
  const f = createFocusNavigation(
    ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id })),
    { mode: 'grid', columns: 3 },
  );
  f.set('c');
  assert.equal(f.move('right'), 'c');
  assert.equal(f.move('down'), 'f');
  assert.equal(f.move('up'), 'c');
  assert.equal(f.move('left'), 'b');
  assert.equal(f.move('next'), 'c');
});
test('disabled grid candidates skip along same direction with bounded wrap cycle', () => {
  const f = createFocusNavigation(
    [{ id: 'a' }, { id: 'b' }, { id: 'c', disabled: true }, { id: 'd' }, { id: 'e' }, { id: 'f' }],
    { mode: 'grid', columns: 2, wrap: true },
  );
  assert.equal(f.move('down'), 'e');
  assert.equal(f.move('down'), 'a');
  assert.equal(f.move('previous'), 'f');
});
test('spatial selection uses center direction and cross-axis penalty with stable ties', () => {
  const f = createFocusNavigation(
    [
      { id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 } },
      { id: 'b', rect: { x: 20, y: 0, width: 10, height: 10 } },
      { id: 'c', rect: { x: 10, y: 30, width: 10, height: 10 } },
      { id: 'd', disabled: true, rect: { x: 11, y: 0, width: 10, height: 10 } },
    ],
    { mode: 'spatial' },
  );
  assert.equal(f.move('right'), 'b');
  assert.equal(f.move('down'), 'c');
  assert.equal(f.move('left'), 'a');
});
test('dynamic replacement and detached inputs preserve valid active ID', () => {
  const source = [{ id: 'a' }, { id: 'b' }];
  const f = createFocusNavigation(source);
  source[0].disabled = true;
  f.set('a');
  f.snapshot().items[0].id = 'bad';
  f.replace([{ id: 'a', disabled: true }, { id: 'b' }]);
  assert.equal(f.snapshot().active, 'b');
  f.replace([{ id: 'a', disabled: true }]);
  assert.equal(f.move('next'), null);
  assert.equal(f.snapshot().items[0].tabIndex, -1);
});
test('invalid item, mode, rectangle and active target reject atomically', () => {
  assert.throws(() => createFocusNavigation([], { columns: 0 }), TypeError);
  assert.throws(() => createFocusNavigation([{ id: 'a' }], { mode: 'spatial' }), TypeError);
  assert.throws(
    () => createFocusNavigation([{ id: 'a', rect: { x: NaN, y: 0, width: 1, height: 1 } }]),
    TypeError,
  );
  const f = createFocusNavigation([{ id: 'a' }]);
  assert.throws(() => f.replace([{ id: 'x' }, { id: 'x' }]), TypeError);
  assert.equal(f.snapshot().active, 'a');
  assert.throws(() => f.set('missing'), TypeError);
  assert.throws(() => f.move('tab'), TypeError);
});
test('spatial wrap chooses opposite extreme on exhausted axis', () => {
  const f = createFocusNavigation(
    [
      { id: 'a', rect: { x: 0, y: 0, width: 1, height: 1 } },
      { id: 'b', rect: { x: 10, y: 0, width: 1, height: 1 } },
    ],
    { mode: 'spatial', wrap: true },
  );
  assert.equal(f.move('left'), 'b');
  assert.equal(f.move('right'), 'a');
});
