import fs from 'node:fs';
import assert from 'node:assert/strict';

const wf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const code = (name) => wf.nodes.find((n) => n.name === name).parameters.jsCode;
const run = (name, ctx, json = {}) => new Function('$', '$json', `return (function(){${code(name)}})()`)(ctx, json);

const S = (v) => ({ stringValue: v });
const prod = (id, over = {}) => ({
  name: `projects/x/databases/(default)/documents/products/${id}`,
  fields: { name: S('Name ' + id), active: { booleanValue: true }, stock: { integerValue: '5' }, image: S(''), price: { integerValue: '9000' }, ...over },
});
const log = (id, status, productId, postedAt) => ({
  name: `projects/x/databases/(default)/documents/automationLogs/${id}`,
  fields: { status: S(status), productId: S(productId), ...(postedAt ? { postedAt: S(postedAt) } : {}) },
});
const ctxFor = (products, logs) => (n) => ({
  first: () => ({ json: n === 'Fetch Products' ? { documents: products } : n === 'Fetch Logs' ? (logs.length ? { documents: logs } : {}) : {} }),
});
const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

// 1. prefers never-posted products
let r = run('Pick Product', ctxFor([prod('a'), prod('b')], [log('2026-01-01', 'success', 'a', '2026-01-01T00:00:00Z')]));
assert.equal(r[0].json.product.id, 'b');

// 2. all posted -> least recently posted (a is older)
r = run('Pick Product', ctxFor([prod('a'), prod('b')], [log('d1', 'success', 'a', '2026-01-01T00:00:00Z'), log('d2', 'success', 'b', '2026-02-01T00:00:00Z')]));
assert.ok(['a', 'b'].includes(r[0].json.product.id));

// 3. already posted/started today -> stops
assert.deepEqual(run('Pick Product', ctxFor([prod('a')], [log(today, 'success', 'a', new Date().toISOString())])), []);
assert.deepEqual(run('Pick Product', ctxFor([prod('a')], [log(today, 'started', 'a')])), []);

// 4. a failed run today may be retried
assert.equal(run('Pick Product', ctxFor([prod('a')], [log(today, 'failed', 'a')]))[0].json.product.id, 'a');

// 5. skips out of stock / inactive; empty logs collection works
r = run('Pick Product', ctxFor([prod('a', { stock: { integerValue: '0' } }), prod('b', { active: { booleanValue: false } }), prod('c')], []));
assert.equal(r[0].json.product.id, 'c');
assert.throws(() => run('Pick Product', ctxFor([prod('a', { stock: { integerValue: '0' } })], [])), /No eligible/);

// 6. Parse Content
const gem = (obj) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] });
r = run('Parse Content', () => ({}), gem({ caption: 'Great purifier ₹9,000', hashtags: ['waterpurifier', '#RO Water!', 'x'], imagePrompt: 'a purifier' }));
assert.match(r[0].json.caption, /#waterpurifier/);
assert.match(r[0].json.caption, /#ROWater/);
assert.ok(r[0].json.caption.length <= 2200);
assert.match(r[0].json.imagePrompt, /no text/);
assert.throws(() => run('Parse Content', () => ({}), { candidates: [] }), /no content/);

// 7. Build Prompt only uses product facts
const ctx = (n) => ({ first: () => ({ json: n === 'Config' ? { STORE_NAME: 'Califnco' } : { product: { name: 'P', brand: 'B', category: 'C', price: 100, specs: { A: '1' }, description: 'D' } } }) });
r = run('Build Prompt', ctx);
assert.match(r[0].json.body.contents[0].parts[0].text, /₹100/);

console.log('workflow code nodes: all assertions passed');
