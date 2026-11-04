/* @ds-bundle: {"format":4,"namespace":"IndieRidge","components":[{"name":"Button"},{"name":"Price"},{"name":"VariantPicker"},{"name":"Swatches"},{"name":"ProductCard"},{"name":"Accordion"},{"name":"EmailSignup"},{"name":"Marquee"},{"name":"JumboText"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function pick(value, fallback) { return value === undefined ? fallback : value; }

  function Button(props) {
    var variant = props.variant || 'primary', size = props.size || 'lg';
    var rest = Object.assign({}, props);
    ['variant', 'size', 'fullWidth', 'className', 'children', 'href'].forEach(function (k) { delete rest[k]; });
    var cls = cx('ir', 'ir-btn', 'ir-btn--' + variant, variant === 'primary' && 'ir-btn--' + size, props.fullWidth && 'ir-btn--full', props.className);
    if (props.href) return h('a', Object.assign({ href: props.href, className: cls }, rest), props.children);
    return h('button', Object.assign({ type: 'button', className: cls }, rest), props.children);
  }

  function money(amount) {
    var n = Number(amount);
    var text = n % 1 === 0 ? String(n) : n.toFixed(2);
    return h('span', { className: 'ir-price__item' }, h('span', { className: 'ir-price__cur', 'aria-hidden': 'true' }, '$'), text);
  }

  function Price(props) {
    var size = props.size || 'sm';
    var onSale = props.compareAt != null && Number(props.compareAt) > Number(props.amount);
    var hidden = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' };
    var kids = [];
    if (onSale) {
      var c = Number(props.compareAt);
      kids.push(h('s', { key: 'r', className: 'ir-price__compare' }, h('span', { style: hidden }, 'Regular price '), '$ ' + (c % 1 === 0 ? c : c.toFixed(2))));
      kids.push(h('span', { key: 's' }, h('span', { style: hidden }, 'Sale price '), money(props.amount)));
    } else {
      kids.push(h('span', { key: 'p' }, money(props.amount)));
    }
    return h('div', { className: cx('ir', 'ir-price', 'ir-price--' + size, props.className) }, kids);
  }

  function useChoice(props) {
    var s = useState(props.defaultValue);
    var controlled = props.value !== undefined;
    var value = controlled ? props.value : s[0];
    function choose(v) { if (!controlled) s[1](v); if (props.onChange) props.onChange(v); }
    return [value, choose];
  }

  function normalize(o) { return typeof o === 'string' ? { value: o, label: o } : o; }

  function VariantPicker(props) {
    var c = useChoice(props), value = c[0], choose = c[1];
    return h('div', { className: cx('ir', 'ir-variants', props.className), role: 'radiogroup', 'aria-label': props.label },
      props.label ? h('p', { className: 'ir-variants__legend', style: { margin: 0 } }, props.label + ':') : null,
      h('div', { className: 'ir-variants__options' }, (props.options || []).map(function (o) {
        o = normalize(o);
        var unavailable = o.available === false;
        return h('button', {
          key: o.value, type: 'button', role: 'radio', className: 'ir-chip',
          'aria-checked': String(value === o.value), disabled: unavailable,
          'aria-label': unavailable ? o.label + ' (sold out)' : o.label,
          onClick: function () { choose(o.value); }
        }, o.label);
      })));
  }

  function Swatches(props) {
    var c = useChoice(props), value = c[0], choose = c[1];
    var current = (props.options || []).filter(function (o) { return o.value === value; })[0];
    return h('div', { className: cx('ir', 'ir-swatches', props.className), role: 'radiogroup', 'aria-label': props.label || 'Color' },
      h('p', { className: 'ir-swatches__legend' }, (props.label || 'Color') + ':'),
      h('p', { className: 'ir-swatches__name' }, current ? current.label : ''),
      h('div', { className: 'ir-swatches__options' }, (props.options || []).map(function (o) {
        var unavailable = o.available === false;
        return h('button', {
          key: o.value, type: 'button', role: 'radio', className: 'ir-swatch', title: o.label,
          'aria-checked': String(value === o.value), 'aria-label': o.label + (unavailable ? ' (sold out)' : ''),
          disabled: unavailable, onClick: function () { choose(o.value); }
        }, o.image ? h('img', { src: o.image, alt: '' }) : h('span', { style: { background: o.color } }));
      })));
  }

  var STAR = 'M8 .9l2.1 4.6 5 .5-3.8 3.3 1.1 4.9L8 11.7l-4.4 2.5 1.1-4.9L.9 6l5-.5z';
  function Rating(props) {
    var pct = Math.max(0, Math.min(5, props.value || 0)) / 5;
    var stars = [];
    for (var i = 0; i < 5; i++) {
      var fill = Math.max(0, Math.min(1, pct * 5 - i));
      var id = 'ir-star-' + i + '-' + Math.round(fill * 100);
      stars.push(h('svg', { key: i, viewBox: '0 0 16 16', 'aria-hidden': 'true' },
        h('defs', null, h('linearGradient', { id: id }, h('stop', { offset: fill, style: { stopColor: 'var(--rating-star)' } }), h('stop', { offset: fill, style: { stopColor: 'var(--hairline)' } }))),
        h('path', { d: STAR, fill: 'url(#' + id + ')' })));
    }
    return h('span', { className: 'ir-rating' },
      h('span', { className: 'ir-rating__stars', role: 'img', 'aria-label': 'Rated ' + Number(props.value).toFixed(1) + ' out of 5' }, stars),
      props.count != null ? h('span', { className: 'ir-rating__count' }, '(' + props.count + ')') : null);
  }

  function ProductCard(props) {
    var Tag = props.href ? 'a' : 'div';
    return h(Tag, { className: cx('ir', 'ir-card', props.className), href: props.href },
      h('div', { className: 'ir-card__media' },
        (props.isNew || props.feature) ? h('span', { className: 'ir-card__badges' },
          props.isNew ? h('span', { className: 'ir-badge ir-badge--new' }, 'New') : null,
          props.feature ? h('span', { className: 'ir-badge ir-badge--feature' }, props.feature) : null) : null,
        props.image ? h('img', { src: props.image, alt: props.imageAlt || props.title, loading: 'lazy' }) : null),
      h('span', { className: 'ir-card__title' }, props.title, props.spec ? h('sup', null, props.spec) : null),
      props.subtitle ? h('div', { className: 'ir-card__desc' }, props.subtitle) : null,
      h(Price, { className: 'ir-card__price', amount: props.price, compareAt: props.compareAt }),
      props.rating != null ? h('div', { className: 'ir-card__rating' }, h(Rating, { value: props.rating, count: props.reviewCount })) : null);
  }

  function Accordion(props) {
    return h('div', { className: cx('ir', 'ir-accordion', props.className) }, (props.items || []).map(function (it, i) {
      return h('details', { key: it.title + i, open: it.open },
        h('summary', null, h('h2', { className: 'ir-accordion__title' }, it.title), props.icon === 'plus' ? h('span', { className: 'ir-accordion__icon', 'aria-hidden': 'true' }) : null),
        h('div', { className: 'ir-accordion__content' }, it.content));
    }));
  }

  function EmailSignup(props) {
    var s = useState(''), email = s[0], setEmail = s[1];
    var d = useState(false), done = d[0], setDone = d[1];
    function submit(e) { e.preventDefault(); if (props.onSubmit) props.onSubmit(email); setDone(true); }
    return h('form', { className: cx('ir', 'ir-signup', props.className), onSubmit: submit, noValidate: true },
      props.heading ? h('p', { className: 'ir-signup__heading' }, props.heading) : null,
      h('div', { className: 'ir-signup__row' },
        h('input', { className: 'ir-signup__input', type: 'email', required: true, value: email, 'aria-label': 'Email address',
          placeholder: pick(props.placeholder, 'Enter your email here'), onChange: function (e) { setEmail(e.target.value); setDone(false); } }),
        h(Button, { type: 'submit', size: 'md', className: 'ir-signup__btn' }, pick(props.buttonLabel, 'Submit'))),
      done ? h('p', { className: 'ir-signup__note', role: 'status' }, pick(props.successMessage, 'Thanks for signing up.')) : null);
  }

  function Marquee(props) {
    var items = props.items || [];
    function row(hidden, k) {
      return h('div', { key: k, className: 'ir-marquee__track', 'aria-hidden': hidden ? 'true' : undefined },
        items.map(function (it, i) {
          var label = typeof it === 'string' ? it : it.label;
          return h('span', { key: i, className: 'ir-marquee__item' }, it.href ? h('a', { href: it.href, tabIndex: hidden ? -1 : undefined }, label) : label);
        }));
    }
    var style = props.duration ? { '--ir-marquee-duration': props.duration + 's' } : undefined;
    if (props.static) return h('div', { className: cx('ir', 'ir-marquee', 'ir-marquee--static', props.className) }, row(false, 'a'));
    return h('div', { className: cx('ir', 'ir-marquee', props.className), style: style }, row(false, 'a'), row(true, 'b'));
  }

  function JumboText(props) {
    var align = props.align || 'left';
    var title = h('h1', { className: 'ir-jumbo__title' }, props.title);
    var sub = props.subtitle ? h('p', { className: 'ir-jumbo__sub' }, props.subtitle) : null;
    return h('section', { className: cx('ir', 'ir-jumbo', align !== 'left' && 'ir-jumbo--' + align, props.className), style: { minHeight: props.height || 520 } },
      props.image ? h('img', { className: 'ir-jumbo__img', src: props.image, alt: props.imageAlt || '' }) : null,
      h('div', { className: 'ir-jumbo__text' },
        props.href ? h('a', { href: props.href }, title) : title,
        props.href && sub ? h('a', { href: props.href }, sub) : sub));
  }

  var api = { Button: Button, Price: Price, VariantPicker: VariantPicker, Swatches: Swatches, ProductCard: ProductCard, Accordion: Accordion, EmailSignup: EmailSignup, Marquee: Marquee, JumboText: JumboText, Rating: Rating };
  window.IndieRidge = Object.assign(window.IndieRidge || {}, api);
})();
