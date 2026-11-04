// Renders a design-canvas template (<template id="tpl">) with React, so the prototype runs as a plain static page.
// Template syntax: {{path}} holes, <sc-if value>, <sc-for list as>, <x-import component-from-global-scope>.
(function () {
  var h = React.createElement;

  function DCLogic(props) { React.Component.call(this, props); this.state = {}; }
  DCLogic.prototype = Object.create(React.Component.prototype);
  DCLogic.prototype.constructor = DCLogic;
  DCLogic.prototype.render = function () { return build(window.DC_TEMPLATE, this.renderVals()); };
  window.DCLogic = DCLogic;

  var HOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  var lookup = function (path, scope) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, scope); };
  var interp = function (s, scope) { return s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); }); };
  var camel = function (s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); };

  var EVENTS = { onclick: 'onClick', onscroll: 'onScroll', onsubmit: 'onSubmit', onchange: 'onChange', oninput: 'onInput' };
  var RENAME = { 'class': 'className', 'for': 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', playsinline: 'playsInline', colspan: 'colSpan', rowspan: 'rowSpan', autoplay: 'autoPlay' };
  var BOOL = { readOnly: 1, disabled: 1, open: 1, controls: 1, muted: 1, loop: 1, playsInline: 1, autoPlay: 1, checked: 1, required: 1 };
  var NO_TEXT = { table: 1, thead: 1, tbody: 1, tr: 1, ul: 1, ol: 1, select: 1 };

  function styleObj(s) {
    var o = {};
    s.split(';').forEach(function (d) {
      var i = d.indexOf(':'); if (i < 0) return;
      var k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (!k) return;
      o[k.indexOf('--') === 0 ? k : camel(k)] = v;
    });
    return o;
  }

  function attrs(el, scope) {
    var p = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i], name = a.name, raw = a.value, m = HOLE.exec(raw);
      var val = m ? lookup(m[1], scope) : interp(raw, scope);
      if (EVENTS[name]) { if (typeof val === 'function') p[EVENTS[name]] = val; continue; }
      var key = RENAME[name] || (name.indexOf('aria-') === 0 || name.indexOf('data-') === 0 ? name : (el.namespaceURI === 'http://www.w3.org/2000/svg' ? camel(name) : name));
      if (key === 'style') { p.style = styleObj(String(val)); continue; }
      if (BOOL[key]) { if (val === false || val === 'false' || val == null) continue; val = true; }
      if (val === false || val == null) continue;
      p[key] = val;
    }
    return p;
  }

  function kids(node, scope, parentTag) {
    var out = [];
    node.childNodes.forEach(function (c, i) {
      var r = build(c, scope, parentTag);
      if (r == null) return;
      if (Array.isArray(r)) r.forEach(function (x) { out.push(x); }); else out.push(r);
    });
    return out.map(function (x, i) { return React.isValidElement(x) && x.key == null ? React.cloneElement(x, { key: i }) : x; });
  }

  function build(node, scope, parentTag) {
    if (node.nodeType === 11) return h(React.Fragment, null, kids(node, scope));
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (parentTag && NO_TEXT[parentTag] && !t.trim()) return null;
      return t.indexOf('{{') >= 0 ? interp(t, scope) : t;
    }
    if (node.nodeType !== 1) return null;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-if') { var m = HOLE.exec(node.getAttribute('value') || ''); return m && lookup(m[1], scope) ? kids(node, scope, parentTag) : null; }
    if (tag === 'sc-for') {
      var lm = HOLE.exec(node.getAttribute('list') || ''), list = (lm && lookup(lm[1], scope)) || [], as = node.getAttribute('as');
      return list.map(function (item, i) { var s = Object.assign({}, scope); s[as] = item; s.$index = i; return h(React.Fragment, { key: i }, kids(node, s, parentTag)); });
    }
    if (tag === 'x-import') {
      var Comp = lookup(node.getAttribute('component-from-global-scope'), window), cp = {};
      for (var i = 0; i < node.attributes.length; i++) {
        var a = node.attributes[i]; if (a.name === 'component-from-global-scope' || a.name.indexOf('hint-') === 0) continue;
        var hm = HOLE.exec(a.value); cp[camel(a.name)] = hm ? lookup(hm[1], scope) : interp(a.value, scope);
      }
      var text = node.textContent.trim();
      return h(Comp, cp, text ? interp(text, scope) : undefined);
    }
    var p = attrs(node, scope);
    if (tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr') return h(tag, p);
    return h(tag, p, kids(node.tagName === 'TEMPLATE' ? node.content : node, scope, tag));
  }

  window.mountDC = function (Component, props) {
    window.DC_TEMPLATE = document.getElementById('tpl').content;
    ReactDOM.createRoot(document.getElementById('root')).render(h(Component, props));
  };
})();
