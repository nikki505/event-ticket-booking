#!/usr/bin/env node
/**
 * Generates docs/diagrams/event-ticket-booking.drawio — a multi-page draw.io file
 * holding the SysML and UML views described in docs/06-system-design.md.
 *
 * Written as a generator rather than hand-authored XML so that a change to the design
 * (for example one requested during the demonstration) can be re-applied consistently
 * across every page by editing one data structure and re-running:
 *
 *     node docs/diagrams/generate-drawio.js
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- helpers

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Multi-line label: draw.io renders <br> inside html=1 labels. */
const lines = (...ls) => ls.join('<br>');

const PALETTE = {
  block:   'fillColor=#dae8fc;strokeColor=#6c8ebf;',
  req:     'fillColor=#d5e8d4;strokeColor=#82b366;',
  derived: 'fillColor=#ffe6cc;strokeColor=#d79b00;',
  actor:   'fillColor=#ffffff;strokeColor=#000000;',
  store:   'fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;',
  danger:  'fillColor=#f8cecc;strokeColor=#b85450;',
  accent:  'fillColor=#e1d5e7;strokeColor=#9673a6;',
};

function node(id, label, x, y, w, h, style = '') {
  return {
    kind: 'node',
    id,
    xml:
      `<mxCell id="${id}" value="${esc(label)}" ` +
      `style="rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;spacingTop=4;${style}" ` +
      `vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

function ellipse(id, label, x, y, w, h, style = '') {
  return {
    kind: 'node',
    id,
    xml:
      `<mxCell id="${id}" value="${esc(label)}" ` +
      `style="ellipse;whiteSpace=wrap;html=1;${style}" ` +
      `vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

function actor(id, label, x, y) {
  return {
    kind: 'node',
    id,
    xml:
      `<mxCell id="${id}" value="${esc(label)}" ` +
      `style="shape=umlActor;verticalLabelPosition=bottom;html=1;verticalAlign=top;" ` +
      `vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="30" height="60" as="geometry"/></mxCell>`,
  };
}

function rhombus(id, label, x, y, w, h, style = '') {
  return {
    kind: 'node',
    id,
    xml:
      `<mxCell id="${id}" value="${esc(label)}" ` +
      `style="rhombus;whiteSpace=wrap;html=1;${style}" ` +
      `vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`,
  };
}

function edge(id, from, to, label = '', style = '') {
  return {
    kind: 'edge',
    id,
    xml:
      `<mxCell id="${id}" value="${esc(label)}" ` +
      `style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;fontSize=10;${style}" ` +
      `edge="1" parent="1" source="${from}" target="${to}"><mxGeometry relative="1" as="geometry"/></mxCell>`,
  };
}

const dashed = 'dashed=1;';
const openArrow = 'endArrow=open;endFill=0;';
const noArrow = 'endArrow=none;';

function page(name, id, cells) {
  return (
    `  <diagram name="${esc(name)}" id="${id}">\n` +
    `    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" ` +
    `connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="826" math="0" shadow="0">\n` +
    `      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n` +
    cells.map((c) => '        ' + c.xml).join('\n') +
    `\n      </root>\n    </mxGraphModel>\n  </diagram>\n`
  );
}

// ---------------------------------------------------------------- page 1: use case

const useCase = [
  node('ucbox', 'Event Ticket Booking System', 260, 40, 420, 620,
    'fillColor=none;strokeColor=#666666;verticalAlign=top;fontStyle=1;'),
  actor('aOrg', 'Organiser', 90, 260),
  actor('aAtt', 'Attendee', 760, 260),

  ellipse('uc1', 'Register / Log in', 380, 70, 180, 50),
  ellipse('uc2', 'Create event', 300, 140, 160, 45),
  ellipse('uc3', 'Update event', 300, 200, 160, 45),
  ellipse('uc4', 'Cancel event', 300, 260, 160, 45),
  ellipse('uc5', 'View my events', 300, 320, 160, 45),
  ellipse('uc6', 'View attendees', 300, 380, 160, 45),

  ellipse('uc7', 'Browse events', 490, 140, 160, 45),
  ellipse('uc8', 'Book tickets', 490, 200, 160, 45),
  ellipse('uc9', 'View my bookings', 490, 260, 160, 45),
  ellipse('uc10', 'Cancel booking', 490, 320, 160, 45),

  ellipse('uc11', lines('Verify capacity', '(shared invariant)'), 380, 500, 190, 60, PALETTE.derived),

  edge('e1', 'aOrg', 'uc1', '', noArrow),
  edge('e2', 'aOrg', 'uc2', '', noArrow),
  edge('e3', 'aOrg', 'uc3', '', noArrow),
  edge('e4', 'aOrg', 'uc4', '', noArrow),
  edge('e5', 'aOrg', 'uc5', '', noArrow),
  edge('e6', 'aOrg', 'uc6', '', noArrow),
  edge('e7', 'aAtt', 'uc1', '', noArrow),
  edge('e8', 'aAtt', 'uc7', '', noArrow),
  edge('e9', 'aAtt', 'uc8', '', noArrow),
  edge('e10', 'aAtt', 'uc9', '', noArrow),
  edge('e11', 'aAtt', 'uc10', '', noArrow),
  edge('e12', 'uc8', 'uc11', '«include»', dashed + openArrow),
  edge('e13', 'uc10', 'uc11', '«include»', dashed + openArrow),

  node('ucNote',
    lines('Verify capacity is included by BOTH booking and cancellation.',
      'One shared mechanism guards the capacity change in both',
      'directions - this is requirement R11.1.'),
    700, 500, 320, 70, PALETTE.store),
];

// ---------------------------------------------------------------- page 2: SysML requirements

const requirements = [
  node('r0', lines('«requirement»', '<b>Event Ticket Booking</b>', 'id = R0',
    'Manage events and bookings', 'without overselling'), 420, 40, 240, 90, PALETTE.req),

  node('rA', lines('«requirement»', '<b>Access Control</b>', 'id = R1-R4'), 60, 200, 200, 70, PALETTE.req),
  node('rE', lines('«requirement»', '<b>Event Management</b>', 'id = R5-R8'), 290, 200, 200, 70, PALETTE.req),
  node('rB', lines('«requirement»', '<b>Booking</b>', 'id = R9-R11'), 520, 200, 200, 70, PALETTE.req),
  node('rM', lines('«requirement»', '<b>Booking Management</b>', 'id = R12-R14'), 750, 200, 200, 70, PALETTE.req),

  node('r11', lines('«requirement»', '<b>No Overbooking</b>', 'id = R11',
    'Reject bookings beyond', 'remaining capacity'), 480, 340, 220, 90, PALETTE.req),
  node('r13', lines('«requirement»', '<b>Release on Cancel</b>', 'id = R13',
    'Cancelling returns seats', 'exactly once'), 750, 340, 220, 90, PALETTE.req),

  node('r111', lines('«requirement»', '<b>Atomic Seat Decrement</b>', 'id = R11.1',
    'The seat count must change in a', 'SINGLE conditional update'), 590, 520, 250, 90, PALETTE.derived),

  node('vt', lines('«verify»', '<b>US-10 AC4</b>',
    'Two simultaneous last-seat bookings:', 'exactly one succeeds'), 890, 520, 240, 80, PALETTE.accent),

  edge('q1', 'r0', 'rA'),
  edge('q2', 'r0', 'rE'),
  edge('q3', 'r0', 'rB'),
  edge('q4', 'r0', 'rM'),
  edge('q5', 'rB', 'r11'),
  edge('q6', 'rM', 'r13'),
  edge('q7', 'r11', 'r111', '«deriveReqt»', dashed + openArrow),
  edge('q8', 'r13', 'r111', '«deriveReqt»', dashed + openArrow),
  edge('q9', 'vt', 'r111', '«verify»', dashed + openArrow),

  node('reqNote',
    lines('<b>R11.1 is DERIVED, not requested.</b>',
      'R11 and R13 are both unsatisfiable under concurrent',
      'requests unless the seat count changes atomically.',
      'Deriving it explicitly turns "be careful" into something',
      'a test can prove - see US-10 AC4.'),
    60, 500, 320, 110, PALETTE.store),
];

// ---------------------------------------------------------------- page 3: SysML BDD

const bdd = [
  node('bSys', lines('«block»', '<b>EventTicketBookingSystem</b>'), 450, 40, 240, 50, PALETTE.block),

  node('bWeb', lines('«block»', '<b>WebClient</b>', '---', 'parts: Router, AuthContext',
    'ops: render, callApi'), 130, 170, 220, 90, PALETTE.block),
  node('bApi', lines('«block»', '<b>ApiServer</b>', '---', 'parts: AuthMw, Guards, Validator',
    'ops: handleRequest'), 450, 170, 240, 90, PALETTE.block),
  node('bStore', lines('«block»', '<b>DataStore</b>', '---',
    'ops: findOneAndUpdate, insert'), 790, 170, 220, 90, PALETTE.block),

  node('cAuth', lines('«block»', '<b>AuthController</b>', '---', 'register, login'), 330, 330, 190, 70, PALETTE.block),
  node('cEvent', lines('«block»', '<b>EventController</b>', '---',
    'create, listMine, listPublic,', 'update, cancel, listBookings'), 540, 330, 210, 80, PALETTE.block),
  node('cBook', lines('«block»', '<b>BookingController</b>', '---',
    'create, listMine, cancel'), 770, 330, 200, 70, PALETTE.block),

  node('mUser', lines('«block»', '<b>User</b>', '---', 'email : String {unique}',
    'passwordHash : String', 'role : ORGANISER | ATTENDEE'), 130, 500, 230, 100, PALETTE.store),
  node('mEvent', lines('«block»', '<b>Event</b>', '---', 'title, venue, startsAt',
    'capacity : Integer', 'seatsRemaining : Integer', 'price : Decimal',
    'status : PUBLISHED | CANCELLED'), 420, 500, 240, 130, PALETTE.store),
  node('mBook', lines('«block»', '<b>Booking</b>', '---', 'reference : String {unique}',
    'quantity : Integer {1..10}', 'status : CONFIRMED | CANCELLED'), 730, 500, 240, 100, PALETTE.store),

  edge('b1', 'bSys', 'bWeb', '1'),
  edge('b2', 'bSys', 'bApi', '1'),
  edge('b3', 'bSys', 'bStore', '1'),
  edge('b4', 'bApi', 'cAuth'),
  edge('b5', 'bApi', 'cEvent'),
  edge('b6', 'bApi', 'cBook'),
  edge('b7', 'bStore', 'mUser'),
  edge('b8', 'bStore', 'mEvent'),
  edge('b9', 'bStore', 'mBook'),
  edge('b10', 'mUser', 'mEvent', 'organises 0..*', dashed + openArrow),
  edge('b11', 'mUser', 'mBook', 'books 0..*', dashed + openArrow),
  edge('b12', 'mEvent', 'mBook', 'has 0..*', dashed + openArrow),

  node('bddNote',
    lines('<b>Why three controllers, not one handler?</b>',
      'The authorisation rules differ per controller:',
      'EventController needs organiser role + event ownership,',
      'BookingController needs attendee role + booking ownership.',
      'Separating them puts each guard at its point of use.'),
    60, 660, 340, 110, PALETTE.store),

  node('bddNote2',
    lines('<b>seatsRemaining is STORED, not derived</b> (decision D-004).',
      'A stored counter can be changed with one conditional atomic',
      'update. A derived count forces read-then-write, which has a',
      'race window. Trade-off: the stored value can drift, so',
      'US-13 AC4 displays a cross-check total.'),
    450, 660, 360, 110, PALETTE.derived),
];

// ---------------------------------------------------------------- page 4: SysML IBD

const ibd = [
  node('iWeb', '«block» WebClient', 60, 60, 260, 250, 'fillColor=none;strokeColor=#6c8ebf;verticalAlign=top;fontStyle=1;'),
  node('iUI', 'UI Components', 90, 100, 200, 40, PALETTE.block),
  node('iCtx', lines('AuthContext', '(holds session token)'), 90, 160, 200, 45, PALETTE.block),
  node('iApiC', lines('ApiClient', '«port» out'), 90, 225, 200, 45, PALETTE.accent),

  node('iSrv', '«block» ApiServer', 400, 60, 300, 480, 'fillColor=none;strokeColor=#82b366;verticalAlign=top;fontStyle=1;'),
  node('pIn', lines('«port» in', 'HTTP :5000'), 440, 100, 220, 40, PALETTE.accent),
  node('mAuth', lines('1. AuthMiddleware', 'verify token -> 401'), 440, 160, 220, 40, PALETTE.block),
  node('mRole', lines('2. RoleGuard', 'requireRole() -> 403'), 440, 215, 220, 40, PALETTE.block),
  node('mOwn', lines('3. OwnershipGuard', 'owner == session user -> 403'), 440, 270, 220, 40, PALETTE.block),
  node('mVal', lines('4. Validator', 'field errors -> 400'), 440, 325, 220, 40, PALETTE.block),
  node('mCtrl', '5. Controllers', 440, 380, 220, 40, PALETTE.block),
  node('pOut', lines('«port» out', 'database driver'), 440, 435, 220, 40, PALETTE.accent),

  node('iDs', '«block» DataStore', 780, 60, 260, 160, 'fillColor=none;strokeColor=#666666;verticalAlign=top;fontStyle=1;'),
  node('iMongo', lines('MongoDB', 'bound to 127.0.0.1:27017'), 810, 110, 200, 60, PALETTE.store),

  edge('i1', 'iUI', 'iCtx', '', noArrow),
  edge('i2', 'iCtx', 'iApiC', '', noArrow),
  edge('i3', 'iApiC', 'pIn', lines('«interface» REST/JSON', 'Authorization: Bearer')),
  edge('i4', 'pIn', 'mAuth'),
  edge('i5', 'mAuth', 'mRole'),
  edge('i6', 'mRole', 'mOwn'),
  edge('i7', 'mOwn', 'mVal'),
  edge('i8', 'mVal', 'mCtrl'),
  edge('i9', 'mCtrl', 'pOut'),
  edge('i10', 'pOut', 'iMongo', '«interface» driver'),

  node('ibdNote',
    lines('<b>The middleware ORDER is the design, not an accident.</b>',
      '1 before 2: there is no role without an identity.',
      '2 before 3: no point loading a resource for a role that cannot touch it.',
      '4 last: a malformed body from an unauthorised caller returns 403,',
      'not 400 - so the caller learns nothing about the payload shape.'),
    60, 360, 300, 130, PALETTE.derived),

  node('ibdNote2',
    lines('<b>Client-side validation is a convenience only.</b>',
      'The server assumes the client may be bypassed entirely',
      '(decision D-007). SC4 and SC5 are tested by calling the',
      'API directly, not through the UI.'),
    780, 260, 300, 100, PALETTE.store),
];

// ---------------------------------------------------------------- page 5: sequence W1

const seq = (() => {
  const cells = [];
  const actors = [
    ['sA', 'Attendee', 60],
    ['sC', 'WebClient', 240],
    ['sG', 'Auth + Guards', 430],
    ['sB', 'BookingController', 640],
    ['sD', 'MongoDB', 870],
  ];
  actors.forEach(([id, label, x]) => {
    cells.push({
      kind: 'node',
      id,
      xml:
        `<mxCell id="${id}" value="${esc(label)}" ` +
        `style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;` +
        `container=0;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;${PALETTE.block}" ` +
        `vertex="1" parent="1"><mxGeometry x="${x}" y="40" width="150" height="640" as="geometry"/></mxCell>`,
    });
  });

  const msgs = [
    ['sA', 'sC', 'select event, quantity = 2', 110],
    ['sC', 'sG', 'POST /api/bookings {eventId, quantity:2}  +  Bearer token', 150],
    ['sG', 'sG', 'verify token   [invalid -> 401]', 195],
    ['sG', 'sG', 'requireRole(ATTENDEE)   [organiser -> 403]', 240],
    ['sG', 'sB', 'forward with req.user', 285],
    ['sB', 'sB', 'validate quantity 1..10   [fail -> 400]', 330],
    ['sB', 'sD', 'findOneAndUpdate({_id, status:PUBLISHED, seatsRemaining >= 2}, {$inc: -2})', 390],
    ['sD', 'sB', 'null  =>  no seats  =>  409 "Only N seats remain"', 440],
    ['sD', 'sB', 'updated event  =>  seats were taken', 485],
    ['sB', 'sD', 'insert Booking{reference, CONFIRMED}', 530],
    ['sB', 'sD', 'on insert failure: COMPENSATE $inc seatsRemaining +2', 575],
    ['sB', 'sC', '201 {reference, quantity}', 620],
    ['sC', 'sA', 'success screen with booking reference', 660],
  ];
  msgs.forEach(([f, t, label, y], i) => {
    const self = f === t;
    const style = self
      ? 'edgeStyle=orthogonalEdgeStyle;html=1;fontSize=9;align=left;verticalAlign=bottom;curved=0;'
      : 'edgeStyle=none;html=1;fontSize=9;align=center;verticalAlign=bottom;';
    const geom = self
      ? `<mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="${
          { sG: 560, sB: 780 }[f] || 560
        }" y="${y}"/><mxPoint x="${{ sG: 560, sB: 780 }[f] || 560}" y="${y + 25}"/></Array></mxGeometry>`
      : `<mxGeometry relative="1" as="geometry"><mxPoint x="0" y="${y}" as="sourcePoint"/><mxPoint x="0" y="${y}" as="targetPoint"/></mxGeometry>`;
    cells.push({
      kind: 'edge',
      id: 'm' + i,
      xml:
        `<mxCell id="m${i}" value="${esc(label)}" style="${style}" edge="1" parent="1" ` +
        `source="${f}" target="${t}">${geom}</mxCell>`,
    });
  });

  cells.push(
    node('seqNote',
      lines('<b>The check and the decrement are ONE operation.</b>',
        'There is no moment between "there is room" and "I took the room"',
        'in which another request can interleave.',
        '',
        'The naive alternative - read seatsRemaining, compare, then write -',
        'has exactly that window, and oversells under US-10 AC4.'),
      60, 700, 420, 120, PALETTE.derived),
    node('seqNote2',
      lines('<b>Why compensate instead of using a transaction?</b>',
        'MongoDB transactions need a replica set; a standalone mongod on one',
        'EC2 instance is not one (decision D-009). Taking the seats FIRST means',
        'the worst case is a temporarily unavailable seat, not an oversold event.'),
      540, 700, 480, 100, PALETTE.store)
  );
  return cells;
})();

// ---------------------------------------------------------------- page 6: activity W2

const activity = [
  ellipse('a0', 'Attendee opens My Bookings', 60, 40, 220, 50, PALETTE.accent),
  node('a1', 'List own bookings', 90, 120, 160, 40, PALETTE.block),
  rhombus('a2', lines('Select booking', 'and confirm cancel?'), 60, 190, 220, 90),
  node('a3', 'No change', 340, 210, 120, 40, PALETTE.store),

  rhombus('a4', lines('booking.attendeeId', '== session user?'), 60, 320, 220, 90),
  node('a5', '403 Forbidden', 340, 340, 130, 40, PALETTE.danger),

  rhombus('a6', lines('booking.status', '== CONFIRMED?'), 60, 450, 220, 90),
  node('a7', lines('409 already cancelled', 'seats NOT returned twice'), 340, 465, 190, 55, PALETTE.danger),

  node('a8', lines('ATOMIC: set status = CANCELLED', 'ONLY IF status is still CONFIRMED'),
    40, 580, 260, 60, PALETTE.derived),
  rhombus('a9', 'matched?', 90, 670, 160, 70),
  node('a10', lines('Increment event.seatsRemaining', 'by booking.quantity'), 340, 680, 220, 50, PALETTE.block),
  ellipse('a11', lines('Booking CANCELLED,', 'seats released'), 620, 675, 200, 60, PALETTE.accent),

  edge('c1', 'a0', 'a1'),
  edge('c2', 'a1', 'a2'),
  edge('c3', 'a2', 'a3', 'dismissed'),
  edge('c4', 'a2', 'a4', 'confirmed'),
  edge('c5', 'a4', 'a5', 'no'),
  edge('c6', 'a4', 'a6', 'yes'),
  edge('c7', 'a6', 'a7', 'no'),
  edge('c8', 'a6', 'a8', 'yes'),
  edge('c9', 'a8', 'a9'),
  edge('c10', 'a9', 'a7', 'no - lost the race'),
  edge('c11', 'a9', 'a10', 'yes'),
  edge('c12', 'a10', 'a11'),

  node('actNote',
    lines('<b>The STATUS TRANSITION is the atomic step, not the arithmetic.</b>',
      'Guarding only the seat maths is not enough: two simultaneous',
      'cancellations of the same booking would each add the seats back,',
      'INFLATING capacity so the event can later oversell.',
      'Making the status change conditional means exactly one wins,',
      'and only the winner increments. This mirrors the booking path -',
      'both derive from R11.1.'),
    600, 300, 400, 150, PALETTE.derived),
];

// ---------------------------------------------------------------- page 7: state machines

const states = [
  node('smTitle1', '<b>Event lifecycle</b>', 60, 40, 200, 30, 'fillColor=none;strokeColor=none;'),
  ellipse('ev0', '', 80, 100, 30, 30, 'fillColor=#000000;'),
  node('ev1', 'PUBLISHED', 170, 95, 140, 45, PALETTE.block),
  node('ev2', 'CANCELLED', 400, 95, 140, 45, PALETTE.danger),
  ellipse('ev3', '', 620, 100, 30, 30, 'fillColor=#000000;strokeWidth=3;'),
  edge('s1', 'ev0', 'ev1', 'organiser creates'),
  edge('s2', 'ev1', 'ev2', 'organiser cancels'),
  edge('s3', 'ev2', 'ev3'),
  edge('s4', 'ev1', 'ev1', 'update details / capacity'),
  node('evNote', lines('Soft delete (D-005): the row is never removed,',
    'because bookings still reference it.'), 170, 165, 320, 50, PALETTE.store),

  node('smTitle2', '<b>Booking lifecycle</b>', 60, 280, 200, 30, 'fillColor=none;strokeColor=none;'),
  ellipse('bk0', '', 80, 340, 30, 30, 'fillColor=#000000;'),
  node('bk1', 'CONFIRMED', 170, 335, 140, 45, PALETTE.block),
  node('bk2', 'CANCELLED', 400, 335, 140, 45, PALETTE.danger),
  ellipse('bk3', '', 620, 340, 30, 30, 'fillColor=#000000;strokeWidth=3;'),
  edge('s5', 'bk0', 'bk1', 'seats decremented atomically'),
  edge('s6', 'bk1', 'bk2', 'attendee cancels; seats returned ONCE'),
  edge('s7', 'bk2', 'bk3'),
  node('bkNote', lines('Only CONFIRMED bookings count toward seats used.',
    'There is no PENDING / PAID / REFUNDED state because',
    'payments are out of scope - every extra state would need',
    'its own guard and its own test.'), 170, 405, 380, 80, PALETTE.store),
];

// ---------------------------------------------------------------- page 8: ER model

const er = [
  node('eUser', lines('<b>USER</b>', '---', 'PK  _id', 'UK  email',
    '      passwordHash  (bcrypt)', '      role  ORGANISER | ATTENDEE', '      createdAt'),
    80, 80, 260, 130, PALETTE.block),
  node('eEvent', lines('<b>EVENT</b>', '---', 'PK  _id', 'FK  organiserId  -> USER',
    '      title  3..120', '      venue  3..160', '      startsAt  (future at create)',
    '      capacity  1..10000', '      seatsRemaining  0..capacity',
    '      price  >= 0', '      status  PUBLISHED | CANCELLED'),
    440, 60, 280, 190, PALETTE.block),
  node('eBooking', lines('<b>BOOKING</b>', '---', 'PK  _id', 'UK  reference',
    'FK  eventId  -> EVENT', 'FK  attendeeId  -> USER', '      quantity  1..10',
    '      status  CONFIRMED | CANCELLED', '      createdAt'),
    440, 340, 280, 160, PALETTE.block),

  edge('r1e', 'eUser', 'eEvent', 'organises  1 : 0..*'),
  edge('r2e', 'eUser', 'eBooking', 'makes  1 : 0..*'),
  edge('r3e', 'eEvent', 'eBooking', 'has  1 : 0..*'),

  node('erNote',
    lines('<b>Indexes that carry a rule, not just performance:</b>',
      '- unique index on USER.email enforces "email already registered"',
      '  in the DATABASE, so a race between two registrations cannot',
      '  create two accounts (US-01 AC2).',
      '- unique index on BOOKING.reference guarantees US-09 AC5.'),
    80, 280, 320, 120, PALETTE.derived),

  node('erNote2',
    lines('<b>seatsRemaining is denormalised on purpose.</b>',
      'It duplicates information derivable from the bookings, which is',
      'normally bad practice. It is done here because it makes the',
      'capacity check and the capacity change a single atomic step.',
      'See D-004 for the trade-off and RSK-06 for the drift risk.'),
    790, 60, 330, 130, PALETTE.derived),
];

// ---------------------------------------------------------------- page 9: deployment

const deployment = [
  node('dNet', 'Internet', 60, 60, 180, 60, PALETTE.store),
  node('dUser', lines('Browser', '(marker / user)'), 80, 150, 140, 50, PALETTE.block),

  node('dAws', 'AWS - single EC2 instance', 350, 40, 620, 460,
    'fillColor=none;strokeColor=#d79b00;verticalAlign=top;fontStyle=1;'),

  node('dSg', 'Security Group - inbound rules', 380, 80, 560, 110,
    'fillColor=none;strokeColor=#b85450;verticalAlign=top;'),
  node('dP80', 'tcp/80  from 0.0.0.0/0', 400, 115, 240, 30, PALETTE.block),
  node('dP22', 'tcp/22  from MY IP ONLY', 670, 115, 250, 30, PALETTE.derived),
  node('dP27', 'tcp/27017  NEVER OPENED', 400, 152, 240, 30, PALETTE.danger),

  node('dNginx', lines('nginx :80', 'serves built client,', 'proxies /api -> :5000'), 400, 230, 220, 70, PALETTE.block),
  node('dNode', lines('Node API :5000', 'under pm2 (restart on boot)'), 680, 230, 240, 70, PALETTE.block),
  node('dMongo', lines('mongod :27017', 'bound to 127.0.0.1'), 680, 350, 240, 60, PALETTE.store),

  edge('d1', 'dUser', 'dP80', 'http'),
  edge('d2', 'dP80', 'dNginx'),
  edge('d3', 'dNginx', 'dNode', '/api/*'),
  edge('d4', 'dNode', 'dMongo'),

  node('depNote',
    lines('<b>Three choices satisfying N6:</b>',
      '1. mongod binds to 127.0.0.1 - unreachable from the internet even',
      '   though it runs on the same host. Port 27017 is never opened.',
      '2. Port 22 restricted to one IP, not 0.0.0.0/0. SSH open to the world',
      '   is the most common finding in student deployments.',
      '3. Only port 80 is public. Node on 5000 is reached only via the nginx',
      '   proxy, so there is ONE public entry point rather than two.'),
    60, 540, 480, 150, PALETTE.derived),

  node('depNote2',
    lines('<b>Deploy a trivial version EARLY (mitigation for RSK-02).</b>',
      'Standing up a "hello world" on this instance during Iteration 1,',
      'before there is anything worth deploying, separates',
      '"my code is broken" from "my deployment is broken" -',
      'two problems that are painful to debug at the same time',
      'under deadline pressure.'),
    580, 540, 440, 130, PALETTE.store),
];

// ---------------------------------------------------------------- assemble

const xml =
  '<mxfile host="app.diagrams.net" agent="generate-drawio.js" type="device">\n' +
  page('1. Use Case', 'p-usecase', useCase) +
  page('2. SysML Requirements', 'p-req', requirements) +
  page('3. SysML BDD', 'p-bdd', bdd) +
  page('4. SysML IBD', 'p-ibd', ibd) +
  page('5. Sequence - W1 Book', 'p-seq', seq) +
  page('6. Activity - W2 Cancel', 'p-act', activity) +
  page('7. State Machines', 'p-state', states) +
  page('8. Data Model', 'p-er', er) +
  page('9. Deployment', 'p-deploy', deployment) +
  '</mxfile>\n';

const out = path.join(__dirname, 'event-ticket-booking.drawio');
fs.writeFileSync(out, xml, 'utf8');
console.log('Wrote ' + out);
console.log('Pages: 9, bytes: ' + xml.length);
