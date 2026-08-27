const test = require('node:test');
const assert = require('node:assert/strict');

const {
  bindAuthenticatedActor,
  requireAcademicRole,
  requireSelfParam,
  requireSystemRole,
} = require('../src/middleware/adminAuth');

const responseDouble = () => ({
  statusCode: null,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
});

test('bindAuthenticatedActor replaces forged actor identifiers', () => {
  const req = {
    authUser: { id: 7 },
    body: { user_id: 999, sender_id: 999, message: 'hola' },
  };
  let nextCalled = false;

  bindAuthenticatedActor('user_id', 'sender_id')(req, responseDouble(), () => {
    nextCalled = true;
  });

  assert.equal(req.body.user_id, 7);
  assert.equal(req.body.sender_id, 7);
  assert.equal(req.body.message, 'hola');
  assert.equal(nextCalled, true);
});

test('requireSelfParam rejects access to another account', () => {
  const req = { authUser: { id: 7 }, params: { id: '8' } };
  const res = responseDouble();
  let nextCalled = false;

  requireSelfParam('id')(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('requireSelfParam accepts the authenticated account', () => {
  const req = { authUser: { id: 7 }, params: { id: '7' } };
  let nextCalled = false;

  requireSelfParam('id')(req, responseDouble(), () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('academic and system roles cannot be substituted for each other', () => {
  const student = { authUser: { role: 'student', system_role: 'user' } };
  const teacher = { authUser: { role: 'teacher', system_role: 'user' } };
  const moderator = { authUser: { role: 'student', system_role: 'moderator' } };

  const studentRes = responseDouble();
  requireAcademicRole('teacher')(student, studentRes, () => {});
  assert.equal(studentRes.statusCode, 403);

  let teacherAccepted = false;
  requireAcademicRole('teacher')(teacher, responseDouble(), () => { teacherAccepted = true; });
  assert.equal(teacherAccepted, true);

  let moderatorAccepted = false;
  requireSystemRole('moderator')(moderator, responseDouble(), () => { moderatorAccepted = true; });
  assert.equal(moderatorAccepted, true);
});
