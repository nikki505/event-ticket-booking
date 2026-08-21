/*
 * Event Ticket Booking System - Figma design generator
 * IFN636 Assessment 1 | Nikhittha Mukkala (N12202665)
 *
 * Builds three pages:
 *   01 - Design System   reusable components + colour/type scale
 *   02 - Wireframes      low-fidelity layouts for the design phase
 *   03 - Hi-fi Screens   both roles, all states, prototype-linked
 *
 * Frame names carry the requirement ID (e.g. "R10 - Book Tickets") so the
 * traceability matrix in docs/06-system-design.md can reference them directly.
 */

// ---------------------------------------------------------------- tokens ----

var C = {
  bg:      'F6F8FA',
  surface: 'FFFFFF',
  border:  'D0D7DE',
  line:    'E7ECF0',
  text:    '1F2328',
  muted:   '656D76',
  primary: '1F6FEB',
  primaryD:'0D419D',
  success: '1A7F37',
  successBg:'DAFBE1',
  danger:  'CF222E',
  dangerBg:'FFEBE9',
  warn:    '9A6700',
  warnBg:  'FFF8C5',
  wire:    'C9D1D9',
  wireBg:  'EFF2F5'
};

function rgb(h) {
  return {
    r: parseInt(h.substr(0, 2), 16) / 255,
    g: parseInt(h.substr(2, 2), 16) / 255,
    b: parseInt(h.substr(4, 2), 16) / 255
  };
}
function solid(h) { return [{ type: 'SOLID', color: rgb(h) }]; }

var F = {
  reg:  { family: 'Inter', style: 'Regular' },
  med:  { family: 'Inter', style: 'Medium' },
  semi: { family: 'Inter', style: 'Semi Bold' },
  bold: { family: 'Inter', style: 'Bold' }
};

// --------------------------------------------------------------- helpers ----

function mkFrame(parent, name, x, y, w, h, fill) {
  var f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.x = x; f.y = y;
  f.fills = solid(fill || C.bg);
  f.clipsContent = true;
  if (parent) parent.appendChild(f);
  return f;
}

function mkRect(parent, x, y, w, h, opts) {
  opts = opts || {};
  var r = figma.createRectangle();
  r.x = x; r.y = y;
  r.resize(w, Math.max(1, h));
  r.fills = opts.fill ? solid(opts.fill) : solid(C.surface);
  if (opts.stroke) {
    r.strokes = solid(opts.stroke);
    r.strokeWeight = opts.strokeWeight || 1;
  } else {
    r.strokes = [];
  }
  r.cornerRadius = opts.radius === undefined ? 8 : opts.radius;
  if (opts.name) r.name = opts.name;
  if (parent) parent.appendChild(r);
  return r;
}

function mkText(parent, str, x, y, opts) {
  opts = opts || {};
  var t = figma.createText();
  t.fontName = opts.font || F.reg;
  t.characters = String(str);
  t.fontSize = opts.size || 14;
  t.fills = solid(opts.color || C.text);
  t.x = x; t.y = y;
  if (opts.width) {
    t.textAutoResize = 'HEIGHT';
    t.resize(opts.width, t.height);
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  if (opts.align) t.textAlignHorizontal = opts.align;
  if (opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
  if (parent) parent.appendChild(t);
  return t;
}

// ------------------------------------------------------- design system ------

var COMPONENTS = {};

function buildDesignSystem(page) {
  mkText(page, 'Event Ticket Booking System - Design System', 0, -120,
    { font: F.bold, size: 32 });
  mkText(page, 'Reusable components and the type/colour scale used across every screen.\n' +
               'Consistent hierarchy: page title 28 semi-bold, section 18 semi-bold, body 14 regular, meta 12 muted.',
    0, -74, { size: 14, color: C.muted, width: 900, lineHeight: 20 });

  // ---- colour swatches
  var swY = 0;
  mkText(page, 'Colour', 0, swY, { font: F.semi, size: 18 });
  var swatches = [
    ['Primary', C.primary], ['Text', C.text], ['Muted', C.muted],
    ['Success', C.success], ['Danger', C.danger], ['Warning', C.warn],
    ['Border', C.border], ['Background', C.bg]
  ];
  for (var i = 0; i < swatches.length; i++) {
    var sx = i * 110;
    mkRect(page, sx, swY + 32, 96, 56, { fill: swatches[i][1], stroke: C.border, radius: 6 });
    mkText(page, swatches[i][0], sx, swY + 94, { size: 12, color: C.muted });
    mkText(page, '#' + swatches[i][1], sx, swY + 110, { size: 11, color: C.muted });
  }

  // ---- Button component (3 variants as separate components)
  var btnY = 190;
  mkText(page, 'Button', 0, btnY, { font: F.semi, size: 18 });
  var variants = [
    ['Button / Primary', C.primary, 'FFFFFF', null],
    ['Button / Secondary', C.surface, C.text, C.border],
    ['Button / Danger', C.danger, 'FFFFFF', null]
  ];
  for (var v = 0; v < variants.length; v++) {
    var comp = figma.createComponent();
    comp.name = variants[v][0];
    comp.resize(160, 44);
    comp.x = v * 200; comp.y = btnY + 32;
    comp.fills = solid(variants[v][1]);
    comp.cornerRadius = 8;
    if (variants[v][3]) { comp.strokes = solid(variants[v][3]); comp.strokeWeight = 1; }
    var lbl = mkText(comp, 'Button', 0, 13, { font: F.med, size: 14, color: variants[v][2], width: 160, align: 'CENTER' });
    lbl.name = 'label';
    page.appendChild(comp);
    COMPONENTS[variants[v][0]] = comp;
  }

  // ---- TextField component (default + error)
  var tfY = 320;
  mkText(page, 'Text field', 0, tfY, { font: F.semi, size: 18 });

  var tf = figma.createComponent();
  tf.name = 'Field / Default';
  tf.resize(360, 70);
  tf.x = 0; tf.y = tfY + 32;
  tf.fills = [];
  mkText(tf, 'Label', 0, 0, { font: F.med, size: 13, color: C.text }).name = 'label';
  mkRect(tf, 0, 22, 360, 44, { fill: C.surface, stroke: C.border, radius: 8 }).name = 'box';
  mkText(tf, 'Placeholder', 12, 36, { size: 14, color: C.muted }).name = 'value';
  page.appendChild(tf);
  COMPONENTS['Field / Default'] = tf;

  var tfe = figma.createComponent();
  tfe.name = 'Field / Error';
  tfe.resize(360, 92);
  tfe.x = 420; tfe.y = tfY + 32;
  tfe.fills = [];
  mkText(tfe, 'Label', 0, 0, { font: F.med, size: 13, color: C.text }).name = 'label';
  mkRect(tfe, 0, 22, 360, 44, { fill: C.surface, stroke: C.danger, radius: 8 }).name = 'box';
  mkText(tfe, 'Invalid value', 12, 36, { size: 14, color: C.text }).name = 'value';
  mkText(tfe, 'Error message explaining the problem', 0, 72, { size: 12, color: C.danger }).name = 'error';
  page.appendChild(tfe);
  COMPONENTS['Field / Error'] = tfe;

  // ---- Badge component
  var bY = 450;
  mkText(page, 'Status badge', 0, bY, { font: F.semi, size: 18 });
  var badges = [
    ['Badge / Confirmed', C.successBg, C.success, 'CONFIRMED'],
    ['Badge / Cancelled', C.dangerBg, C.danger, 'CANCELLED'],
    ['Badge / SoldOut', C.warnBg, C.warn, 'SOLD OUT']
  ];
  for (var b = 0; b < badges.length; b++) {
    var bc = figma.createComponent();
    bc.name = badges[b][0];
    bc.resize(110, 24);
    bc.x = b * 140; bc.y = bY + 32;
    bc.fills = solid(badges[b][1]);
    bc.cornerRadius = 12;
    mkText(bc, badges[b][3], 0, 5, { font: F.semi, size: 11, color: badges[b][2], width: 110, align: 'CENTER' }).name = 'label';
    page.appendChild(bc);
    COMPONENTS[badges[b][0]] = bc;
  }

  // ---- Event card component
  var cY = 560;
  mkText(page, 'Event card', 0, cY, { font: F.semi, size: 18 });
  var card = figma.createComponent();
  card.name = 'Card / Event';
  card.resize(340, 168);
  card.x = 0; card.y = cY + 32;
  card.fills = solid(C.surface);
  card.strokes = solid(C.border);
  card.strokeWeight = 1;
  card.cornerRadius = 10;
  mkText(card, 'Event title', 16, 16, { font: F.semi, size: 16 }).name = 'title';
  mkText(card, 'Venue - Date', 16, 42, { size: 13, color: C.muted }).name = 'meta';
  mkText(card, '$0.00', 16, 68, { font: F.semi, size: 15 }).name = 'price';
  mkText(card, '0 of 0 seats left', 16, 94, { size: 12, color: C.muted }).name = 'seats';
  mkRect(card, 16, 116, 308, 36, { fill: C.primary, radius: 8 }).name = 'cta';
  mkText(card, 'Book tickets', 16, 127, { font: F.med, size: 13, color: 'FFFFFF', width: 308, align: 'CENTER' }).name = 'ctaLabel';
  page.appendChild(card);
  COMPONENTS['Card / Event'] = card;

  mkText(page, 'Why these components: every screen below is assembled from this set, so a change to a button or\n' +
               'field style propagates everywhere. That is what keeps the visual hierarchy consistent across 16 screens.',
    0, 780, { size: 13, color: C.muted, width: 900, lineHeight: 19 });
}

// -------------------------------------------------------------- renderer ----

var PAD = 48;
var W = 1200, H = 860;

function navBar(frame, role, active) {
  mkRect(frame, 0, 0, W, 64, { fill: C.surface, stroke: C.line, radius: 0 });
  mkText(frame, 'EventTix', PAD, 22, { font: F.bold, size: 17, color: C.primary });
  var items = role === 'ORGANISER'
    ? ['My Events', 'Create Event']
    : (role === 'ATTENDEE' ? ['Browse Events', 'My Bookings'] : []);
  var x = PAD + 130;
  for (var i = 0; i < items.length; i++) {
    var on = items[i] === active;
    mkText(frame, items[i], x, 24, { font: on ? F.semi : F.reg, size: 14, color: on ? C.text : C.muted });
    x += items[i].length * 8 + 40;
  }
  if (role) {
    mkText(frame, role === 'ORGANISER' ? 'Nikhittha (Organiser)' : 'Sam (Attendee)',
      W - PAD - 170, 24, { size: 13, color: C.muted, width: 170, align: 'RIGHT' });
  }
}

// Mini-DSL renderer. Each element advances a cursor.
function render(frame, els, startY, wire) {
  var y = startY;
  var cw = W - PAD * 2;
  for (var i = 0; i < els.length; i++) {
    var e = els[i], k = e[0];

    if (k === 'h1') {
      mkText(frame, e[1], PAD, y, { font: F.semi, size: 28, color: wire ? C.muted : C.text });
      y += 46;
    } else if (k === 'h2') {
      mkText(frame, e[1], PAD, y, { font: F.semi, size: 18, color: wire ? C.muted : C.text });
      y += 32;
    } else if (k === 'p') {
      mkText(frame, e[1], PAD, y, { size: 14, color: C.muted, width: e[2] || 720, lineHeight: 21 });
      y += (e[2] === undefined ? 24 : 24) + (String(e[1]).length > 90 ? 21 : 0);
    } else if (k === 'field') {
      var err = e[3];
      mkText(frame, e[1], PAD, y, { font: F.med, size: 13 });
      mkRect(frame, PAD, y + 22, 420, 44,
        { fill: wire ? C.wireBg : C.surface, stroke: err ? C.danger : (wire ? C.wire : C.border) });
      mkText(frame, e[2] || 'Placeholder', PAD + 12, y + 36,
        { size: 14, color: e[2] ? C.text : C.muted });
      y += 78;
      if (err) { mkText(frame, err, PAD, y - 10, { size: 12, color: C.danger }); y += 14; }
    } else if (k === 'btn') {
      var variant = e[2] || 'primary';
      var fill = variant === 'primary' ? C.primary : (variant === 'danger' ? C.danger : C.surface);
      var fg = variant === 'secondary' ? C.text : 'FFFFFF';
      mkRect(frame, PAD, y, 180, 44,
        { fill: wire ? C.wire : fill, stroke: variant === 'secondary' ? C.border : null });
      mkText(frame, e[1], PAD, y + 13, { font: F.med, size: 14, color: wire ? C.text : fg, width: 180, align: 'CENTER' });
      if (e[3]) {
        mkRect(frame, PAD + 200, y, 160, 44, { fill: wire ? C.wireBg : C.surface, stroke: C.border });
        mkText(frame, e[3], PAD + 200, y + 13, { font: F.med, size: 14, color: C.text, width: 160, align: 'CENTER' });
      }
      y += 64;
    } else if (k === 'cards') {
      var list = e[1];
      for (var c = 0; c < list.length; c++) {
        var cx = PAD + (c % 3) * 368;
        var cy = y + Math.floor(c / 3) * 190;
        var d = list[c];
        mkRect(frame, cx, cy, 340, 168, { fill: wire ? C.wireBg : C.surface, stroke: wire ? C.wire : C.border, radius: 10 });
        if (wire) {
          mkRect(frame, cx + 16, cy + 16, 200, 14, { fill: C.wire, radius: 3 });
          mkRect(frame, cx + 16, cy + 42, 260, 10, { fill: C.wire, radius: 3 });
          mkRect(frame, cx + 16, cy + 116, 308, 36, { fill: C.wire, radius: 8 });
        } else {
          mkText(frame, d[0], cx + 16, cy + 16, { font: F.semi, size: 16, width: 300 });
          mkText(frame, d[1], cx + 16, cy + 42, { size: 13, color: C.muted, width: 300 });
          mkText(frame, d[2], cx + 16, cy + 68, { font: F.semi, size: 15 });
          var sold = d[4] === 'sold';
          mkText(frame, d[3], cx + 16, cy + 94, { size: 12, color: sold ? C.warn : C.muted });
          mkRect(frame, cx + 16, cy + 116, 308, 36, { fill: sold ? C.line : C.primary, radius: 8 });
          mkText(frame, sold ? 'Sold out' : 'Book tickets', cx + 16, cy + 127,
            { font: F.med, size: 13, color: sold ? C.muted : 'FFFFFF', width: 308, align: 'CENTER' });
        }
      }
      y += Math.ceil(list.length / 3) * 190 + 8;
    } else if (k === 'empty') {
      mkRect(frame, PAD, y, cw, 220, { fill: wire ? C.wireBg : C.surface, stroke: wire ? C.wire : C.border, radius: 10 });
      mkText(frame, e[1], PAD, y + 76, { font: F.semi, size: 18, width: cw, align: 'CENTER' });
      mkText(frame, e[2], PAD, y + 106, { size: 14, color: C.muted, width: cw, align: 'CENTER' });
      mkRect(frame, PAD + cw / 2 - 90, y + 142, 180, 42, { fill: wire ? C.wire : C.primary, radius: 8 });
      mkText(frame, e[3], PAD + cw / 2 - 90, y + 154, { font: F.med, size: 14, color: wire ? C.text : 'FFFFFF', width: 180, align: 'CENTER' });
      y += 244;
    } else if (k === 'banner') {
      var kind = e[1];
      var bgc = kind === 'error' ? C.dangerBg : (kind === 'success' ? C.successBg : C.warnBg);
      var fgc = kind === 'error' ? C.danger : (kind === 'success' ? C.success : C.warn);
      var lines = String(e[2]).split('\n').length;
      mkRect(frame, PAD, y, cw, 30 + lines * 20, { fill: bgc, stroke: fgc, radius: 8 });
      mkText(frame, e[2], PAD + 16, y + 15, { font: F.med, size: 14, color: fgc, width: cw - 32, lineHeight: 20 });
      y += 30 + lines * 20 + 20;
    } else if (k === 'table') {
      var cols = e[1], rows = e[2];
      mkRect(frame, PAD, y, cw, 44, { fill: wire ? C.wire : C.line, radius: 0 });
      var colw = cw / cols.length;
      for (var q = 0; q < cols.length; q++) {
        mkText(frame, cols[q], PAD + q * colw + 14, y + 14, { font: F.semi, size: 13 });
      }
      y += 44;
      for (var r2 = 0; r2 < rows.length; r2++) {
        mkRect(frame, PAD, y, cw, 48, { fill: wire ? C.wireBg : C.surface, stroke: C.line, radius: 0 });
        for (var q2 = 0; q2 < rows[r2].length; q2++) {
          var cell = rows[r2][q2];
          var isBadge = cell === 'CONFIRMED' || cell === 'CANCELLED';
          if (isBadge && !wire) {
            var ok = cell === 'CONFIRMED';
            mkRect(frame, PAD + q2 * colw + 14, y + 12, 104, 24, { fill: ok ? C.successBg : C.dangerBg, radius: 12 });
            mkText(frame, cell, PAD + q2 * colw + 14, y + 18, { font: F.semi, size: 11, color: ok ? C.success : C.danger, width: 104, align: 'CENTER' });
          } else {
            mkText(frame, cell, PAD + q2 * colw + 14, y + 16, { size: 13, color: q2 === 0 ? C.text : C.muted });
          }
        }
        y += 48;
      }
      y += 20;
    } else if (k === 'dialog') {
      mkRect(frame, 0, 64, W, H - 64, { fill: '1F2328', radius: 0 }).opacity = 0.45;
      var dw = 460, dx = (W - dw) / 2, dy = 260;
      mkRect(frame, dx, dy, dw, 230, { fill: C.surface, radius: 12 });
      mkText(frame, e[1], dx + 28, dy + 28, { font: F.semi, size: 19, width: dw - 56 });
      mkText(frame, e[2], dx + 28, dy + 64, { size: 14, color: C.muted, width: dw - 56, lineHeight: 21 });
      mkRect(frame, dx + 28, dy + 150, 180, 44, { fill: C.danger, radius: 8 });
      mkText(frame, e[3], dx + 28, dy + 163, { font: F.med, size: 14, color: 'FFFFFF', width: 180, align: 'CENTER' });
      mkRect(frame, dx + 228, dy + 150, 140, 44, { fill: C.surface, stroke: C.border, radius: 8 });
      mkText(frame, 'Keep it', dx + 228, dy + 163, { font: F.med, size: 14, width: 140, align: 'CENTER' });
      y += 0;
    } else if (k === 'note') {
      mkText(frame, e[1], PAD, H - 52, { size: 12, color: C.muted, width: cw, lineHeight: 18 });
    } else if (k === 'gap') {
      y += e[1] || 20;
    }
  }
  return y;
}

// --------------------------------------------------------------- screens ----

function buildWireframes(page) {
  mkText(page, '02 - Low-fidelity wireframes', 0, -120, { font: F.bold, size: 32 });
  mkText(page, 'Produced during the design phase, before the high-fidelity prototype. Purpose is layout,\n' +
               'navigation flow and information hierarchy - deliberately greyscale so that discussion stays\n' +
               'on structure rather than colour choices.',
    0, -74, { size: 14, color: C.muted, width: 900, lineHeight: 20 });

  var defs = [
    ['W-01 Login', null, [['h1', 'Sign in'], ['field', 'Email', ''], ['field', 'Password', ''],
      ['btn', 'Sign in', 'primary', 'Register'],
      ['note', 'Entry point for both roles. Role is stored on the account, so one login screen serves both.']]],
    ['W-02 Event Listing', 'ATTENDEE', [['h1', 'Upcoming events'],
      ['cards', [[], [], [], [], [], []]],
      ['note', 'Grid of event cards. Sold-out cards keep their position but disable the action.']]],
    ['W-03 Event Detail + Book', 'ATTENDEE', [['h1', 'Event detail'], ['p', 'Venue, date, price, seats remaining'],
      ['field', 'Quantity', ''], ['btn', 'Book tickets', 'primary'],
      ['note', 'Quantity is bounded 1-10 in the UI, but the server is authoritative (N1).']]],
    ['W-04 Organiser Dashboard', 'ORGANISER', [['h1', 'My events'],
      ['table', ['Event', 'Date', 'Seats', 'Status'], [[], [], []]],
      ['btn', 'Create event', 'primary'],
      ['note', 'Only events owned by the signed-in organiser appear here (R6 AC2).']]],
    ['W-05 Create Event', 'ORGANISER', [['h1', 'Create event'], ['field', 'Title', ''], ['field', 'Venue', ''],
      ['field', 'Date and time', ''], ['field', 'Capacity', ''], ['field', 'Price', ''],
      ['btn', 'Publish event', 'primary', 'Cancel']]],
    ['W-06 My Bookings', 'ATTENDEE', [['h1', 'My bookings'],
      ['table', ['Event', 'Qty', 'Reference', 'Status'], [[], [], []]],
      ['note', 'Cancelled bookings stay listed rather than disappearing (R12 AC3).']]]
  ];

  for (var i = 0; i < defs.length; i++) {
    var fx = (i % 3) * (W + 100);
    var fy = Math.floor(i / 3) * (H + 130);
    var fr = mkFrame(page, defs[i][0], fx, fy, W, H, C.bg);
    navBar(fr, defs[i][1], null);
    render(fr, defs[i][2], 110, true);
  }
}

function buildHiFi(page) {
  mkText(page, '03 - High-fidelity screens', 0, -120, { font: F.bold, size: 32 });
  mkText(page, 'Both roles, and for each key screen the normal, empty, validation-error and success states.\n' +
               'Frame names carry the requirement ID so the traceability matrix can point straight at them.',
    0, -74, { size: 14, color: C.muted, width: 980, lineHeight: 20 });

  var S = [];

  S.push(['R1 - Register', null, [
    ['h1', 'Create your account'],
    ['p', 'Choose the role you need. Organisers publish events; attendees book tickets.'],
    ['field', 'Email', 'nikhittha@example.com'],
    ['field', 'Password', '••••••••••'],
    ['field', 'Role', 'Attendee'],
    ['btn', 'Create account', 'primary', 'Sign in instead'],
    ['note', 'R1 - normal state. Role selected at registration and stored on the user record.']
  ]]);

  S.push(['R1 - Register (validation errors)', null, [
    ['h1', 'Create your account'],
    ['banner', 'error', 'Please correct the highlighted fields.'],
    ['field', 'Email', 'nikhittha@example.com', 'That email is already registered'],
    ['field', 'Password', '••••', 'Password must be at least 8 characters'],
    ['field', 'Role', 'Not selected', 'Select a role'],
    ['btn', 'Create account', 'primary'],
    ['note', 'R1 AC2/AC3/AC5 - every rule is enforced server-side; the client mirrors it only for speed (N1).']
  ]]);

  S.push(['R2 - Login', null, [
    ['h1', 'Sign in'],
    ['field', 'Email', 'sam@example.com'],
    ['field', 'Password', '••••••••••'],
    ['btn', 'Sign in', 'primary', 'Create account'],
    ['note', 'R2 - one login screen for both roles; the account carries the role.']
  ]]);

  S.push(['R2 - Login (error)', null, [
    ['h1', 'Sign in'],
    ['banner', 'error', 'Email or password is incorrect'],
    ['field', 'Email', 'sam@example.com'],
    ['field', 'Password', '••••••••'],
    ['btn', 'Sign in', 'primary'],
    ['note', 'D-006: the same message is shown whether the email is unknown or the password is wrong, so the\nscreen cannot be used to discover which addresses are registered.']
  ]]);

  S.push(['R9 - Event Listing', 'ATTENDEE', [
    ['h1', 'Upcoming events'],
    ['cards', [
      ['Semester Welcome Night', 'QUT Gardens Point - 12 Sep 2026, 6:00pm', '$15.00', '48 of 120 seats left'],
      ['Indie Music Showcase', 'The Triffid, Newstead - 19 Sep 2026, 7:30pm', '$32.50', '9 of 200 seats left'],
      ['Tech Careers Fair', 'Brisbane Convention Centre - 24 Sep 2026, 10:00am', '$0.00', '0 of 300 seats left', 'sold'],
      ['Sunset Rooftop Yoga', 'Emporium Rooftop - 28 Sep 2026, 5:30pm', '$22.00', '14 of 40 seats left'],
      ['Data Science Meetup', 'Fortitude Valley - 2 Oct 2026, 6:00pm', '$0.00', '61 of 80 seats left'],
      ['Night Markets Launch', 'South Bank - 9 Oct 2026, 4:00pm', '$8.00', '112 of 400 seats left']
    ]],
    ['note', 'R9 - normal state. Past and cancelled events are excluded by the query (AC2); a sold-out card keeps\nits place but disables its action (AC3).']
  ]]);

  S.push(['R9 - Event Listing (empty state)', 'ATTENDEE', [
    ['h1', 'Upcoming events'],
    ['empty', 'No upcoming events just yet',
      'When an organiser publishes an event it will appear here.', 'Refresh'],
    ['note', 'R9 AC4 - an empty result gets an explanation, never a blank page.']
  ]]);

  S.push(['R10 - Book Tickets', 'ATTENDEE', [
    ['h1', 'Indie Music Showcase'],
    ['p', 'The Triffid, Newstead  -  19 September 2026, 7:30pm  -  $32.50 per ticket'],
    ['banner', 'warn', 'Only 9 seats remain for this event.'],
    ['field', 'Quantity (1-10)', '2'],
    ['btn', 'Book tickets', 'primary', 'Back'],
    ['note', 'R10 - the quantity bound is shown in the label, checked in the client, and enforced again on the server.']
  ]]);

  S.push(['R10 - Booking Success', 'ATTENDEE', [
    ['h1', 'Booking confirmed'],
    ['banner', 'success', 'Your booking reference is  ETB-7Q4M-2XKD'],
    ['p', 'Indie Music Showcase  -  2 tickets  -  The Triffid, Newstead  -  19 September 2026, 7:30pm'],
    ['gap', 10],
    ['btn', 'View my bookings', 'primary', 'Browse more'],
    ['note', 'R10 AC1/AC5 - the reference is generated server-side and is unique per booking.']
  ]]);

  S.push(['R11 - Sold Out / Capacity Conflict', 'ATTENDEE', [
    ['h1', 'Tech Careers Fair'],
    ['banner', 'error', 'Only 2 seats remain for this event.\nReduce your quantity and try again.'],
    ['field', 'Quantity (1-10)', '3', 'You asked for 3 but only 2 remain'],
    ['btn', 'Book tickets', 'primary'],
    ['note', 'R11 - this is the state produced when the atomic conditional update matches no document. No booking\nrow is created, so a rejected attempt leaves nothing behind (US-10 AC5).']
  ]]);

  S.push(['R6 - Organiser Dashboard', 'ORGANISER', [
    ['h1', 'My events'],
    ['table', ['Event', 'Date', 'Seats remaining', 'Status'], [
      ['Semester Welcome Night', '12 Sep 2026', '48 of 120', 'PUBLISHED'],
      ['Indie Music Showcase', '19 Sep 2026', '9 of 200', 'PUBLISHED'],
      ['Winter Film Night', '4 Aug 2026', '0 of 60', 'CANCELLED']
    ]],
    ['btn', 'Create event', 'primary'],
    ['note', 'R6 - only events owned by this organiser are listed (AC2). Cancelled events remain visible to their\nowner, marked CANCELLED (R8 AC4).']
  ]]);

  S.push(['R6 - Organiser Dashboard (empty)', 'ORGANISER', [
    ['h1', 'My events'],
    ['empty', 'You have not published an event yet',
      'Create your first event and it will appear here and in the public listing.', 'Create event'],
    ['note', 'R6 AC3 - the empty state explains the next action rather than showing an empty table.']
  ]]);

  S.push(['R5 - Create Event', 'ORGANISER', [
    ['h1', 'Create event'],
    ['field', 'Title', 'Semester Welcome Night'],
    ['field', 'Venue', 'QUT Gardens Point'],
    ['field', 'Date and time', '12 Sep 2026, 6:00pm'],
    ['field', 'Capacity', '120'],
    ['field', 'Price (AUD)', '15.00'],
    ['btn', 'Publish event', 'primary', 'Cancel'],
    ['note', 'R5 - on success the event appears in both the organiser list and the public listing (AC1).']
  ]]);

  S.push(['R5 - Create Event (validation errors)', 'ORGANISER', [
    ['h1', 'Create event'],
    ['banner', 'error', 'Please correct the highlighted fields.'],
    ['field', 'Title', 'AB', 'Title must be between 3 and 120 characters'],
    ['field', 'Date and time', '4 Aug 2026, 6:00pm', 'Event date must be in the future'],
    ['field', 'Capacity', '0', 'Capacity must be a whole number of at least 1'],
    ['field', 'Price (AUD)', '-5.00', 'Price cannot be negative'],
    ['btn', 'Publish event', 'primary'],
    ['note', 'R5 AC2/AC3/AC4 - all four rules come from the validation table in docs/01 section 1.10.']
  ]]);

  S.push(['R7 - Edit Event', 'ORGANISER', [
    ['h1', 'Edit event'],
    ['p', 'Semester Welcome Night  -  112 of 120 seats already booked'],
    ['field', 'Venue', 'QUT Kelvin Grove'],
    ['field', 'Capacity', '100', 'Capacity cannot be lower than the 112 seats already booked'],
    ['btn', 'Save changes', 'primary', 'Discard'],
    ['note', 'R7 AC2/AC4 - a capacity change adjusts seats remaining by the DELTA rather than overwriting it,\nso existing bookings are never silently lost.']
  ]]);

  S.push(['R8 - Cancel Event Confirm', 'ORGANISER', [
    ['h1', 'My events'],
    ['table', ['Event', 'Date', 'Seats remaining', 'Status'], [
      ['Semester Welcome Night', '12 Sep 2026', '48 of 120', 'PUBLISHED']
    ]],
    ['dialog', 'Cancel this event?',
      'It will stop accepting bookings and disappear from the public listing. Existing bookings are kept.',
      'Yes, cancel event'],
    ['note', 'R8 - a soft delete (D-005). The row is never removed, because every booking still references it.']
  ]]);

  S.push(['R12 - My Bookings', 'ATTENDEE', [
    ['h1', 'My bookings'],
    ['table', ['Event', 'Qty', 'Reference', 'Status'], [
      ['Indie Music Showcase', '2', 'ETB-7Q4M-2XKD', 'CONFIRMED'],
      ['Semester Welcome Night', '1', 'ETB-3HB8-9WQP', 'CONFIRMED'],
      ['Winter Film Night', '3', 'ETB-5KD2-1VNM', 'CANCELLED']
    ]],
    ['note', 'R12 - cancelled bookings stay in the list marked CANCELLED rather than vanishing (AC3), which keeps\nthe seat arithmetic auditable.']
  ]]);

  S.push(['R12 - My Bookings (empty)', 'ATTENDEE', [
    ['h1', 'My bookings'],
    ['empty', 'No bookings yet',
      'Once you book tickets your reference will appear here.', 'Browse events'],
    ['note', 'R12 AC4 - empty state links onward to the listing.']
  ]]);

  S.push(['R13 - Cancel Booking Confirm', 'ATTENDEE', [
    ['h1', 'My bookings'],
    ['table', ['Event', 'Qty', 'Reference', 'Status'], [
      ['Indie Music Showcase', '2', 'ETB-7Q4M-2XKD', 'CONFIRMED']
    ]],
    ['dialog', 'Cancel this booking?',
      'Your 2 seats will be released back to the event straight away. This cannot be undone.',
      'Yes, cancel booking'],
    ['note', 'R13 AC4 - nothing changes unless the attendee confirms. The seats are returned exactly once (AC2).']
  ]]);

  S.push(['R14 - Attendee List', 'ORGANISER', [
    ['h1', 'Indie Music Showcase - attendees'],
    ['p', 'Confirmed seats: 191 of 200   |   Remaining: 9   |   Cross-check: capacity minus remaining = 191'],
    ['table', ['Attendee', 'Qty', 'Reference', 'Status'], [
      ['sam@example.com', '2', 'ETB-7Q4M-2XKD', 'CONFIRMED'],
      ['jo@example.com', '4', 'ETB-8PL1-6TRC', 'CONFIRMED'],
      ['alex@example.com', '3', 'ETB-2WQ9-4HGD', 'CANCELLED']
    ]],
    ['note', 'R14 AC4 - the confirmed total must equal capacity minus seats remaining. That equality is a deliberate\ncross-check on the stored counter (decision D-004, risk RSK-06).']
  ]]);

  var frames = {};
  for (var i = 0; i < S.length; i++) {
    var fx = (i % 4) * (W + 100);
    var fy = Math.floor(i / 4) * (H + 130);
    var fr = mkFrame(page, S[i][0], fx, fy, W, H, C.bg);
    navBar(fr, S[i][1], null);
    render(fr, S[i][2], 110, false);
    frames[S[i][0]] = fr;
  }
  return frames;
}

// ------------------------------------------------------------- prototype ----

function link(from, to) {
  if (!from || !to) return;
  var reaction = {
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE',
      destinationId: to.id,
      navigation: 'NAVIGATE',
      transition: null,
      preserveScrollPosition: false
    }]
  };
  try {
    if (from.setReactionsAsync) { from.setReactionsAsync([reaction]); }
    else { from.reactions = [reaction]; }
  } catch (err) {
    try {
      from.reactions = [{
        trigger: { type: 'ON_CLICK' },
        action: { type: 'NODE', destinationId: to.id, navigation: 'NAVIGATE', transition: null, preserveScrollPosition: false }
      }];
    } catch (e2) { /* prototype link unavailable in this API version */ }
  }
}

function wireFlows(f) {
  // W1 - attendee path: login -> listing -> book -> success -> my bookings
  link(f['R2 - Login'], f['R9 - Event Listing']);
  link(f['R9 - Event Listing'], f['R10 - Book Tickets']);
  link(f['R10 - Book Tickets'], f['R10 - Booking Success']);
  link(f['R10 - Booking Success'], f['R12 - My Bookings']);
  // W1 - organiser path: login -> dashboard -> create -> dashboard -> attendees
  link(f['R1 - Register'], f['R6 - Organiser Dashboard']);
  link(f['R6 - Organiser Dashboard'], f['R5 - Create Event']);
  link(f['R5 - Create Event'], f['R6 - Organiser Dashboard']);
  link(f['R7 - Edit Event'], f['R6 - Organiser Dashboard']);
  link(f['R8 - Cancel Event Confirm'], f['R6 - Organiser Dashboard']);
  link(f['R14 - Attendee List'], f['R6 - Organiser Dashboard']);
  // W2 - cancel and release
  link(f['R12 - My Bookings'], f['R13 - Cancel Booking Confirm']);
}

// ------------------------------------------------------------------ main ----

function main() {
  return Promise.all([
    figma.loadFontAsync(F.reg),
    figma.loadFontAsync(F.med),
    figma.loadFontAsync(F.semi),
    figma.loadFontAsync(F.bold)
  ]).then(function () {
    var ds = figma.createPage(); ds.name = '01 - Design System';
    figma.currentPage = ds;
    buildDesignSystem(ds);

    var wf = figma.createPage(); wf.name = '02 - Wireframes (lo-fi)';
    figma.currentPage = wf;
    buildWireframes(wf);

    var hi = figma.createPage(); hi.name = '03 - Hi-fi Screens';
    figma.currentPage = hi;
    var frames = buildHiFi(hi);
    wireFlows(frames);

    figma.currentPage = hi;
    figma.viewport.scrollAndZoomIntoView(hi.children);
    figma.notify('Design generated: 3 pages, 25 frames, 9 components.', { timeout: 6000 });
    figma.closePlugin('Done - check pages 01, 02 and 03.');
  }).catch(function (err) {
    figma.notify('Error: ' + err.message, { error: true, timeout: 8000 });
    figma.closePlugin('Failed: ' + err.message);
  });
}

main();
