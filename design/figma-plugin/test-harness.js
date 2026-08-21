/*
 * Offline stub of the Figma Plugin API, used to execute code.js and catch
 * runtime errors before running it in the real editor. Not part of the plugin.
 *   node test-harness.js
 */
var fs = require('fs');
var vm = require('vm');

var stats = { pages: [], frames: 0, rects: 0, texts: 0, components: 0, reactions: 0, errors: [] };
var idc = 0;

function baseNode(type) {
  var n = {
    id: type + ':' + (++idc),
    type: type,
    name: '',
    x: 0, y: 0, width: 100, height: 100,
    opacity: 1,
    fills: [], strokes: [], strokeWeight: 1, cornerRadius: 0,
    children: [],
    clipsContent: false,
    resize: function (w, h) { this.width = w; this.height = h; },
    appendChild: function (c) {
      if (!c) throw new Error('appendChild(undefined)');
      this.children.push(c); c.parent = this;
    },
    findOne: function (fn) {
      for (var i = 0; i < this.children.length; i++) if (fn(this.children[i])) return this.children[i];
      return null;
    },
    setReactionsAsync: function (r) {
      if (!Array.isArray(r)) throw new Error('reactions must be array');
      r.forEach(function (x) {
        if (!x.trigger) throw new Error('reaction missing trigger');
        if (!x.actions && !x.action) throw new Error('reaction missing actions');
        if (x.actions && !x.actions[0].destinationId) throw new Error('reaction missing destinationId');
      });
      stats.reactions += r.length;
      return Promise.resolve();
    }
  };
  return n;
}

var figma = {
  createFrame: function () { stats.frames++; return baseNode('FRAME'); },
  createRectangle: function () { stats.rects++; return baseNode('RECTANGLE'); },
  createComponent: function () { stats.components++; return baseNode('COMPONENT'); },
  createText: function () {
    stats.texts++;
    var t = baseNode('TEXT');
    t._chars = '';
    t.fontName = null;
    t.textAutoResize = 'NONE';
    Object.defineProperty(t, 'characters', {
      get: function () { return this._chars; },
      set: function (v) {
        if (this.fontName === null) throw new Error('characters set before fontName');
        if (typeof v !== 'string') throw new Error('characters must be a string, got ' + typeof v);
        this._chars = v;
      }
    });
    return t;
  },
  createPage: function () {
    var p = baseNode('PAGE');
    stats.pages.push(p);
    return p;
  },
  loadFontAsync: function (f) {
    if (!f || !f.family || !f.style) throw new Error('bad font ' + JSON.stringify(f));
    return Promise.resolve();
  },
  currentPage: null,
  viewport: { scrollAndZoomIntoView: function (nodes) {
    if (!Array.isArray(nodes)) throw new Error('scrollAndZoomIntoView needs an array');
  } },
  notify: function (m) { console.log('  [notify] ' + m); },
  closePlugin: function (m) { console.log('  [closePlugin] ' + (m || '')); }
};

var code = fs.readFileSync(__dirname + '/code.js', 'utf8');
var ctx = vm.createContext({ figma: figma, console: console, Promise: Promise, parseInt: parseInt, String: String, Math: Math, Array: Array, Object: Object, JSON: JSON });

try {
  vm.runInContext(code, ctx, { filename: 'code.js' });
} catch (e) {
  console.error('SYNC THROW: ' + e.message);
  console.error(e.stack);
  process.exit(1);
}

setTimeout(function () {
  console.log('');
  console.log('  pages      : ' + stats.pages.length + ' (' + stats.pages.map(function (p) { return p.name; }).join(', ') + ')');
  console.log('  frames     : ' + stats.frames);
  console.log('  components : ' + stats.components);
  console.log('  rectangles : ' + stats.rects);
  console.log('  text nodes : ' + stats.texts);
  console.log('  prototype  : ' + stats.reactions + ' links');
  console.log('');
  if (stats.frames < 20) { console.error('FAIL: expected at least 20 frames'); process.exit(1); }
  if (stats.components < 9) { console.error('FAIL: expected at least 9 components'); process.exit(1); }
  if (stats.reactions < 8) { console.error('FAIL: expected at least 8 prototype links'); process.exit(1); }
  console.log('  ALL CHECKS PASSED');
}, 500);
