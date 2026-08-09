require('reflect-metadata');

const commonEntityPath = require.resolve('../../src/common/common.entity');
class TestCommonEntity {}
require.cache[commonEntityPath] = {
  id: commonEntityPath,
  filename: commonEntityPath,
  loaded: true,
  exports: { CommonEntity: TestCommonEntity },
  children: [],
  paths: [],
};

const assert = require('node:assert/strict');
const { promises: fs } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { hash } = require('bcrypt');
const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { getMetadataArgsStorage } = require('typeorm');

const { Feature, ModuleAction } = require('../../src/utils/constants');
const { findWithFilters } = require('../../src/utils/query');
const { enforceRequestBoundaries, applySecurityHeaders } = require('../../src/config/http-security');
const { SetupController } = require('../../src/modules/setup/setup.controller');
const { SetupService } = require('../../src/modules/setup/setup.service');
const { SetupUserDto } = require('../../src/modules/setup/setup.types');
const { AuthService } = require('../../src/modules/auth/auth.service');
const { JwtStrategy } = require('../../src/modules/auth/jwt.strategy');
const { CongregationService } = require('../../src/modules/congregation/congregation.service');
const { EventParticipantService } = require('../../src/modules/event-participant/event-participant.service');
const { EventService } = require('../../src/modules/event/event.service');
const { FilesService } = require('../../src/modules/files/files.service');
const { PersonService } = require('../../src/modules/person/person.service');
const { RoleService } = require('../../src/modules/role/role.service');
const { SecurityRateLimitService } = require('../../src/modules/security/security-rate-limit.service');
const { SecurityRateLimitScope } = require('../../src/modules/security/security.types');
const { User } = require('../../src/modules/user/user.entity');
const { UserService } = require('../../src/modules/user/user.service');
const {
  UserChangeOwnPasswordDto,
  UserCompleteTemporaryPasswordDto,
  UserCreateDto,
  UserSetTemporaryPasswordDto,
} = require('../../src/modules/user/user.types');

const id = (suffix) => `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
const actorId = id(1);
const targetId = id(2);
const congregationAId = id(10);
const congregationBId = id(11);
const roleId = id(20);
const eventId = id(30);
const eventTypeId = id(31);
const personId = id(40);
const fileId = id(50);

const i18n = { t: (key) => key };
const congregationA = {
  id: congregationAId,
  enabled: true,
  deleted_at: null,
  features: [Feature.Users, Feature.EventsCalendar, Feature.PublicEvents],
  timezone: 'America/Guatemala',
};
const congregationB = {
  ...congregationA,
  id: congregationBId,
};
const delegatedRole = {
  id: roleId,
  enabled: true,
  full_access: false,
  permissions: {
    role: [ModuleAction.get, ModuleAction.update],
    user: [ModuleAction.get, ModuleAction.create, ModuleAction.update, ModuleAction.delete],
  },
};
const fullAccessRole = {
  id: id(21),
  enabled: true,
  full_access: true,
  permissions: {},
};
const actor = {
  id: actorId,
  username: 'operator',
  name: 'Operator',
  enabled: true,
  deleted_at: null,
  roles: [delegatedRole],
  congregations: [congregationA],
  locations: [],
};

const setupPayload = {
  role: { name: 'Administrator' },
  user: { username: 'admin', password: 'temporary-password', name: 'Admin' },
  congregation: {
    name: 'Congregation',
    type: 'Church',
    timezone: 'America/Guatemala',
    locations: [{ order: 0, name: 'Main', address: '' }],
    features: [Feature.Users],
  },
};

const makeUserService = ({ userFindOne, roleFindOne, congregationFindOne, locationFindOne, personFindOne } = {}) => {
  const repository = {
    metadata: { columns: [] },
    findOne: userFindOne ?? (async ({ where }) => (where.id === actorId ? actor : null)),
    find: async () => [],
    findAndCount: async () => [[], 0],
    create: (value) => value,
    save: async (value) => value,
    update: async () => ({ affected: 1 }),
    softDelete: async () => ({ affected: 1 }),
  };
  const roleRepository = { findOne: roleFindOne ?? (async () => delegatedRole) };
  const congregationRepository = {
    findOne: congregationFindOne ?? (async ({ where }) => (where.id === congregationAId ? congregationA : congregationB)),
  };
  const locationRepository = { findOne: locationFindOne ?? (async () => null) };
  const personRepository = {
    findOne: personFindOne ?? (async () => null),
    find: async () => [],
    save: async (value) => value,
  };
  return {
    repository,
    service: new UserService(
      repository,
      roleRepository,
      congregationRepository,
      locationRepository,
      personRepository,
      i18n,
    ),
  };
};

const makeParticipantService = ({ participantRepository, event, person } = {}) => {
  const repository = participantRepository ?? {
    findOne: async () => null,
    create: (value) => value,
    save: async (value) => value,
    count: async () => 0,
  };
  const eventRepository = { findOne: async () => event };
  const personRepository = {
    findOne: async () => person ?? null,
    find: async () => [],
    save: async (value) => value,
  };
  const userRepository = { findOne: async () => actor };
  const congregationRepository = { findOne: async () => congregationA };
  return new EventParticipantService(
    repository,
    eventRepository,
    personRepository,
    userRepository,
    congregationRepository,
    i18n,
  );
};

test('SEC-001 rejects setup without the configured bootstrap secret', async () => {
  let called = false;
  const setupService = {
    setup: async () => {
      called = true;
      return { isSetup: true, congregation: congregationA };
    },
  };
  const controller = new SetupController(setupService, i18n);

  await assert.rejects(controller.setup(setupPayload, undefined, 'en'));
  assert.equal(called, false);
});

test('SEC-002 rejects delegated attempts to grant full access', async () => {
  const targetRole = { ...delegatedRole };
  const roleRepository = {
    update: async () => ({ affected: 1 }),
    findOne: async () => targetRole,
  };
  const userRepository = { findOne: async () => actor };
  const service = new RoleService(roleRepository, userRepository, i18n);

  await assert.rejects(
    service.update({ id: roleId, data: { ...targetRole, full_access: true }, userId: actorId }),
  );
});

test('SEC-003 rejects cross-congregation and higher-authority password resets', async () => {
  const target = {
    id: targetId,
    enabled: true,
    password: 'hash',
    roles: [fullAccessRole],
    congregations: [congregationB],
  };
  const { service } = makeUserService({
    userFindOne: async ({ where }) => (where.id === targetId ? target : actor),
  });

  await assert.rejects(
    service.setTemporaryPassword({
      id: targetId,
      userId: actorId,
      data: { password: 'strong-temporary-password', password_confirmation: 'strong-temporary-password' },
    }),
  );
});

test('SEC-004 rejects creating a user with foreign tenant relationships', async () => {
  const { service } = makeUserService({
    userFindOne: async ({ where }) => (where.id === actorId ? actor : null),
    congregationFindOne: async () => congregationB,
  });

  await assert.rejects(
    service.create({
      userId: actorId,
      data: {
        username: 'foreign-user',
        name: 'Foreign User',
        password: 'strong-initial-password',
        roles_ids: [roleId],
        congregations_ids: [congregationBId],
      },
    }),
  );
});

test('SEC-005 rejects reading a user from another congregation', async () => {
  const target = {
    id: targetId,
    username: 'foreign',
    name: 'Foreign User',
    enabled: true,
    roles: [delegatedRole],
    congregations: [congregationB],
    locations: [],
  };
  const { service } = makeUserService({
    userFindOne: async ({ where }) => (where.id === targetId ? target : actor),
    personFindOne: async () => ({ id: personId, congregation_id: congregationBId, user_id: targetId }),
  });

  await assert.rejects(
    service.get({ id: targetId, userId: actorId, congregationId: congregationAId }),
  );
});

test('SEC-006 password hashes are excluded from default User selections', () => {
  const passwordColumn = getMetadataArgsStorage().columns.find(
    (column) => column.target === User && column.propertyName === 'password',
  );

  assert.ok(passwordColumn);
  assert.equal(passwordColumn.options.select, false);
});

test('SEC-007 rejects JWTs whose session version no longer matches the user', async () => {
  const config = { get: () => '0123456789abcdef0123456789abcdef' };
  const userRepository = {
    findOne: async () => ({ ...actor, session_version: 2 }),
  };
  const strategy = Reflect.construct(JwtStrategy, [config, userRepository, i18n]);

  await assert.rejects(
    Promise.resolve(
      strategy.validate({
        sub: actorId,
        username: actor.username,
        sessionVersion: 1,
        passwordChangeRequired: false,
        auth: { fullAccess: false, permissions: delegatedRole.permissions },
      }),
    ),
  );
});

test('SEC-008 bounds multi-term search construction instead of generating permutations', async () => {
  const fields = Array.from({ length: 8 }, (_, index) => `field_${index}`);
  const repository = {
    metadata: {
      columns: fields.map((propertyName) => ({ propertyName })),
      findColumnWithPropertyName: () => ({ type: String }),
    },
    findAndCount: async ({ where }) => {
      assert.ok(!Array.isArray(where) || where.length <= 64, `generated ${where.length} search branches`);
      return [[], 0];
    },
  };

  await findWithFilters({
    repository,
    query: { search: 'one two three four five six seven eight', size: 50, page: 0 },
    searchFields: fields,
  });
});

test('SEC-008 applies bounded pagination when page parameters are omitted', async () => {
  let options;
  const repository = {
    metadata: {
      columns: [{ propertyName: 'name', type: String }],
      primaryColumns: [{ propertyName: 'id' }],
      findColumnWithPropertyName: () => ({ type: String }),
    },
    findAndCount: async (receivedOptions) => {
      options = receivedOptions;
      return [[], 0];
    },
  };

  await findWithFilters({ repository, query: {}, searchFields: ['name'] });

  assert.equal(options.skip, 0);
  assert.equal(options.take, 50);
});

test('SEC-009 production security configuration fails closed without CORS origins', () => {
  const originalEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    SETUP_BOOTSTRAP_SECRET: process.env.SETUP_BOOTSTRAP_SECRET,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_DURATION: process.env.TOKEN_DURATION,
    FILE_STORAGE_PROVIDER: process.env.FILE_STORAGE_PROVIDER,
    FILE_STORAGE_PATH: process.env.FILE_STORAGE_PATH,
  };
  process.env.NODE_ENV = 'production';
  delete process.env.CORS_ORIGIN;
  process.env.SETUP_BOOTSTRAP_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.TOKEN_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.TOKEN_DURATION = '15m';
  process.env.FILE_STORAGE_PROVIDER = 'local';
  process.env.FILE_STORAGE_PATH = '/var/lib/congrio-storage';

  try {
    const { validateSecurityEnvironment } = require('../../src/config/security');
    assert.throws(() => validateSecurityEnvironment(process.env));
  } finally {
    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test('SEC-009 production security configuration rejects example secret placeholders', () => {
  const originalEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    SETUP_BOOTSTRAP_SECRET: process.env.SETUP_BOOTSTRAP_SECRET,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_DURATION: process.env.TOKEN_DURATION,
    FILE_STORAGE_PROVIDER: process.env.FILE_STORAGE_PROVIDER,
    FILE_STORAGE_PATH: process.env.FILE_STORAGE_PATH,
  };
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = 'https://congr.example';
  process.env.SETUP_BOOTSTRAP_SECRET = 'replace_with_a_unique_random_bootstrap_secret';
  process.env.TOKEN_SECRET = 'change_me_to_a_long_random_secret';
  process.env.TOKEN_DURATION = '15m';
  process.env.FILE_STORAGE_PROVIDER = 'local';
  process.env.FILE_STORAGE_PATH = '/var/lib/congrio-storage';

  try {
    const { validateSecurityEnvironment } = require('../../src/config/security');
    assert.throws(() => validateSecurityEnvironment(process.env));
  } finally {
    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test('SECURITY-VERIFY production storage configuration fails closed', () => {
  const originalEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    SETUP_BOOTSTRAP_SECRET: process.env.SETUP_BOOTSTRAP_SECRET,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    TOKEN_DURATION: process.env.TOKEN_DURATION,
    FILE_STORAGE_PROVIDER: process.env.FILE_STORAGE_PROVIDER,
    FILE_STORAGE_PATH: process.env.FILE_STORAGE_PATH,
    FILE_PUBLIC_BASE_URL: process.env.FILE_PUBLIC_BASE_URL,
  };
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = 'https://congr.example';
  process.env.SETUP_BOOTSTRAP_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.TOKEN_SECRET = 'abcdef0123456789abcdef0123456789';
  process.env.TOKEN_DURATION = '15m';
  delete process.env.FILE_STORAGE_PROVIDER;
  delete process.env.FILE_STORAGE_PATH;

  try {
    const { validateSecurityEnvironment } = require('../../src/config/security');
    assert.throws(() => validateSecurityEnvironment(process.env));
    process.env.FILE_STORAGE_PROVIDER = 'local';
    process.env.FILE_STORAGE_PATH = '/';
    assert.throws(() => validateSecurityEnvironment(process.env));
    process.env.FILE_STORAGE_PATH = '/var/lib/congrio-storage';
    assert.doesNotThrow(() => validateSecurityEnvironment(process.env));
    process.env.FILE_STORAGE_PROVIDER = 'url';
    delete process.env.FILE_PUBLIC_BASE_URL;
    assert.throws(() => validateSecurityEnvironment(process.env));
    process.env.FILE_PUBLIC_BASE_URL = 'https://media.congr.example';
    assert.doesNotThrow(() => validateSecurityEnvironment(process.env));
  } finally {
    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test('SEC-010 temporary-password sessions cannot access business routes', () => {
  const { assertSessionRouteAllowed } = require('../../src/modules/auth/session-policy');

  assert.throws(() =>
    assertSessionRouteAllowed({
      passwordChangeRequired: true,
      method: 'GET',
      path: '/event',
      i18n,
    }),
  );
});

test('SEC-011 private file reads verify caller membership, not only the tenant header', async () => {
  const file = {
    id: fileId,
    congregation_id: congregationBId,
    storage_key: 'target.png',
    original_name: 'target.png',
    mime_type: 'image/png',
    public: false,
  };
  const repository = { findOne: async () => file };
  const userRepository = { findOne: async () => actor };
  const congregationRepository = { findOne: async () => congregationB };
  const service = new FilesService(repository, userRepository, congregationRepository, i18n);

  await assert.rejects(service.getFile(fileId, false, congregationBId, actorId));
});

test('SEC-012 rejects active SVG uploads', async () => {
  const storagePath = path.join(process.env.CODEX_SCRATCH_ROOT, 'congr.io', 'security-tests-svg');
  const originalPath = process.env.FILE_STORAGE_PATH;
  process.env.FILE_STORAGE_PATH = storagePath;
  const repository = {
    create: (value) => ({ id: fileId, ...value }),
    save: async (value) => value,
    sum: async () => 0,
  };
  const service = new FilesService(
    repository,
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );

  try {
    await assert.rejects(
      service.uploadImage({
        file: {
          originalname: 'payload.svg',
          mimetype: 'image/svg+xml',
          buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
          size: 75,
        },
        congregationId: congregationAId,
        userId: actorId,
      }),
    );
  } finally {
    await fs.rm(storagePath, { recursive: true, force: true });
    if (originalPath === undefined) delete process.env.FILE_STORAGE_PATH;
    else process.env.FILE_STORAGE_PATH = originalPath;
  }
});

test('SEC-013 rejects an oversized upload before writing it', async () => {
  const storagePath = path.join(process.env.CODEX_SCRATCH_ROOT, 'congr.io', 'security-tests-size');
  const originalPath = process.env.FILE_STORAGE_PATH;
  process.env.FILE_STORAGE_PATH = storagePath;
  const repository = {
    create: (value) => ({ id: fileId, ...value }),
    save: async (value) => value,
    sum: async () => 0,
  };
  const service = new FilesService(
    repository,
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );
  const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
  largeBuffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  try {
    await assert.rejects(
      service.uploadImage({
        file: {
          originalname: 'large.png',
          mimetype: 'image/png',
          buffer: largeBuffer,
          size: largeBuffer.length,
        },
        congregationId: congregationAId,
        userId: actorId,
      }),
    );
  } finally {
    await fs.rm(storagePath, { recursive: true, force: true });
    if (originalPath === undefined) delete process.env.FILE_STORAGE_PATH;
    else process.env.FILE_STORAGE_PATH = originalPath;
  }
});

test('SEC-014 participant-only access cannot mutate arbitrary Person fields', async () => {
  const person = {
    id: personId,
    congregation_id: congregationAId,
    first_name: 'Original',
    last_name: 'Person',
    custom_values: {},
  };
  const event = {
    id: eventId,
    congregation_id: congregationAId,
    custom_fields: [],
    save_attendance_date: false,
  };
  const service = makeParticipantService({ event, person });

  await assert.rejects(
    service.create({
      userId: actorId,
      congregationId: congregationAId,
      data: {
        event_id: eventId,
        person_id: personId,
        person_updates: { first_name: 'Compromised' },
      },
    }),
  );
});

test('SEC-015 enforces a per-event public registration quota before persistence', async () => {
  let saves = 0;
  const repository = {
    count: async () => 1000,
    create: (value) => value,
    save: async (value) => {
      saves += 1;
      return value;
    },
  };
  const event = {
    id: eventId,
    enabled: true,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: congregationA,
    custom_fields: [],
  };
  const service = makeParticipantService({ participantRepository: repository, event });

  await assert.rejects(
    service.publicRegister(
      id(99),
      { submitted_person: { first_name: 'Public', last_name: 'Registrant' }, field_values: {} },
      { ip: '192.0.2.10' },
    ),
  );
  assert.equal(saves, 0);
});

test('SEC-016 expired login backoff recovers automatically', async () => {
  const password = 'correct-long-password';
  const passwordHash = await hash(password, 4);
  const lockedUser = {
    ...actor,
    password: passwordHash,
    password_change_required: false,
    failed_login_attempts: 12,
    locked_at: new Date(Date.now() - 60_000),
  };
  const repository = {
    findOne: async () => lockedUser,
    update: async () => ({ affected: 1 }),
  };
  const service = new AuthService(repository, { sign: () => 'token' }, i18n);

  await assert.doesNotReject(service.login({ username: actor.username, password, ip: '192.0.2.20' }));
});

test('SEC-017 disabled events reject public registration', async () => {
  let saves = 0;
  const repository = {
    count: async () => 0,
    create: (value) => value,
    save: async (value) => {
      saves += 1;
      return value;
    },
  };
  const event = {
    id: eventId,
    enabled: false,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: congregationA,
    custom_fields: [],
  };
  const service = makeParticipantService({ participantRepository: repository, event });

  await assert.rejects(
    service.publicRegister(id(98), {
      submitted_person: { first_name: 'Public', last_name: 'Registrant' },
      field_values: {},
    }),
  );
  assert.equal(saves, 0);
});

test('SEC-018 applies the same minimum password length to every password DTO', () => {
  const cases = [
    [SetupUserDto, { username: 'user', name: 'User', password: 'x' }],
    [
      UserChangeOwnPasswordDto,
      { current_password: 'current-long-password', password: 'x', password_confirmation: 'x' },
    ],
    [UserCompleteTemporaryPasswordDto, { password: 'x', password_confirmation: 'x' }],
    [UserSetTemporaryPasswordDto, { password: 'x', password_confirmation: 'x' }],
  ];

  cases.forEach(([Dto, value]) => {
    const errors = validateSync(plainToInstance(Dto, value));
    assert.ok(errors.some((error) => error.property === 'password'));
  });
});

test('FILE-LIFECYCLE releases an event image after the event is deleted', async () => {
  let releases = 0;
  const event = { id: eventId, congregation_id: congregationAId, image_file_id: fileId };
  const repository = {
    findOne: async () => event,
    save: async (value) => value,
    softDelete: async () => ({ affected: 1 }),
  };
  const filesService = {
    setPublic: async () => undefined,
    releaseIfUnreferenced: async () => {
      releases += 1;
    },
  };
  const service = new EventService(
    repository,
    {},
    {},
    { findOne: async () => actor },
    {},
    { findOne: async () => congregationA },
    filesService,
    i18n,
  );

  await service.remove({ id: eventId, userId: actorId, congregationId: congregationAId });
  assert.equal(releases, 1);
});

test('FILE-LIFECYCLE releases the old image after event image replacement', async () => {
  const replacementFileId = id(51);
  let releases = 0;
  const event = {
    id: eventId,
    congregation_id: congregationAId,
    name: 'Event',
    description: '',
    start_datetime: new Date('2026-08-09T15:00:00.000Z'),
    end_datetime: new Date('2026-08-09T16:00:00.000Z'),
    event_type_id: eventTypeId,
    image_file_id: fileId,
    enabled: true,
    custom_fields: [],
  };
  const repository = {
    findOne: async () => event,
    save: async (value) => value,
  };
  const filesService = {
    setPublic: async () => undefined,
    releaseIfUnreferenced: async (releasedId) => {
      if (releasedId === fileId) releases += 1;
    },
  };
  const service = new EventService(
    repository,
    { findOne: async () => ({ id: eventTypeId, congregation_id: congregationAId }) },
    {},
    { findOne: async () => actor },
    { find: async () => [] },
    { findOne: async () => congregationA },
    filesService,
    i18n,
  );

  await service.update({
    id: eventId,
    userId: actorId,
    congregationId: congregationAId,
    data: {
      name: 'Event',
      description: '',
      start_datetime: '2026-08-09T09:00',
      end_datetime: '2026-08-09T10:00',
      type_id: eventTypeId,
      image_file_id: replacementFileId,
    },
  });
  assert.equal(releases, 1);
});

test('SECURITY-VERIFY rate limits repeated login attempts by source', () => {
  const limiter = new SecurityRateLimitService(i18n);
  for (let index = 0; index < 30; index += 1) {
    limiter.assertAllowed(SecurityRateLimitScope.loginIp, '192.0.2.40');
  }
  assert.throws(() => limiter.assertAllowed(SecurityRateLimitScope.loginIp, '192.0.2.40'));
  assert.doesNotThrow(() => limiter.assertAllowed(SecurityRateLimitScope.loginIp, '192.0.2.41'));
});

test('SEC-009 blocks untrusted cookie origins and permits trusted or bearer clients', () => {
  const run = ({ origin, cookie, method = 'POST' }) => {
    let nextCalls = 0;
    let statusCode = 200;
    const headers = { origin, cookie };
    const request = {
      method,
      originalUrl: '/user',
      get: (name) => headers[name.toLowerCase()],
    };
    const response = {
      status: (value) => {
        statusCode = value;
        return response;
      },
      json: () => response,
    };
    enforceRequestBoundaries(new Set(['https://trusted.example']), i18n)(request, response, () => {
      nextCalls += 1;
    });
    return { nextCalls, statusCode };
  };

  assert.deepEqual(run({ origin: 'https://evil.example', cookie: 'auth_token=value' }), {
    nextCalls: 0,
    statusCode: 403,
  });
  assert.deepEqual(run({ origin: 'https://trusted.example', cookie: 'auth_token=value' }), {
    nextCalls: 1,
    statusCode: 200,
  });
  assert.deepEqual(run({ origin: 'https://evil.example' }), { nextCalls: 1, statusCode: 200 });
});

test('SECURITY-VERIFY applies restrictive API response headers', () => {
  const headers = new Map();
  let nextCalls = 0;
  applySecurityHeaders(true)(
    { path: '/event' },
    { setHeader: (name, value) => headers.set(name, value) },
    () => {
      nextCalls += 1;
    },
  );
  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(headers.get('Content-Security-Policy'), /default-src 'none'/);
  assert.match(headers.get('Strict-Transport-Security'), /max-age=31536000/);
  assert.equal(nextCalls, 1);
});

test('SEC-002 rejects delegated full-access role creation', async () => {
  const roleRepository = {
    create: (value) => value,
    save: async (value) => value,
  };
  const service = new RoleService(roleRepository, { findOne: async () => actor }, i18n);
  await assert.rejects(
    service.create({
      userId: actorId,
      data: { name: 'Escalated', permissions: {}, full_access: true },
    }),
  );
});

test('SEC-002 rejects malformed nested role permissions with a client error', async () => {
  const roleRepository = {
    create: (value) => value,
    save: async (value) => value,
  };
  const service = new RoleService(roleRepository, { findOne: async () => ({ ...actor, roles: [fullAccessRole] }) }, i18n);

  await assert.rejects(
    service.create({
      userId: actorId,
      data: { name: 'Malformed', permissions: { user: { update: true } } },
    }),
    (error) => typeof error.getStatus === 'function' && error.getStatus() === 400,
  );
});

test('SEC-004 permits same-congregation creation with lower authority', async () => {
  const { service } = makeUserService();
  const result = await service.create({
    userId: actorId,
    congregationId: congregationAId,
    data: {
      username: 'local-user',
      name: 'Local User',
      password: 'strong-initial-password',
      roles_ids: [],
      congregations_ids: [congregationAId],
    },
  });
  assert.equal(result.username, 'local-user');
  assert.deepEqual(result.congregations.map(({ id: value }) => value), [congregationAId]);
  assert.equal('password' in result, false);
});

test('SEC-004 rejects reverse Person links to users outside the congregation', async () => {
  const foreignUser = { ...actor, id: targetId, congregations: [congregationB] };
  const repository = {
    find: async () => [],
    findOne: async ({ where }) =>
      where.user_id
        ? null
        : {
            id: personId,
            congregation_id: congregationAId,
            code: 'PE1',
            first_name: 'Person',
            last_name: 'Example',
            user: foreignUser,
          },
    create: (value) => ({ id: personId, ...value }),
    save: async (value) => value,
  };
  const service = new PersonService(
    repository,
    {
      findOne: async ({ where }) => (where.id === actorId ? actor : foreignUser),
    },
    { findOne: async () => congregationA },
    {},
    i18n,
  );

  await assert.rejects(
    service.create({
      userId: actorId,
      congregationId: congregationAId,
      data: {
        first_name: 'Person',
        last_name: 'Example',
        phone: '',
        user_id: targetId,
        custom_values: {},
      },
    }),
  );
});

test('SEC-004 congregation creation does not expose or attach foreign users', async () => {
  const foreignUser = { ...actor, id: targetId, name: 'Foreign', congregations: [congregationB] };
  const userRepository = {
    findOne: async () => actor,
    find: async () => [actor, foreignUser],
    save: async (value) => value,
  };
  const congregationRepository = {
    create: (value) => ({ id: id(12), ...value }),
    save: async (value) => value,
    findOne: async () => ({ id: id(12), locations: [] }),
  };
  const manager = {
    getRepository: (entity) => (entity.name === 'User' ? userRepository : congregationRepository),
    query: async () => [],
  };
  const service = new CongregationService(
    { transaction: async (callback) => callback(manager) },
    congregationRepository,
    userRepository,
    i18n,
  );

  const choices = await service.listCreationUsers(actorId);
  assert.deepEqual(choices.result.map(({ id: value }) => value), [actorId]);
  await assert.rejects(
    service.create({
      userId: actorId,
      data: {
        name: 'New congregation',
        type: 'Church',
        timezone: 'America/Guatemala',
        features: [Feature.Users],
        locations: [],
        user_ids: [targetId],
      },
    }),
  );
});

test('SEC-005 omitting the tenant header does not expose foreign relationships or Person data', async () => {
  const target = {
    id: targetId,
    username: 'shared-user',
    name: 'Shared User',
    enabled: true,
    roles: [delegatedRole],
    congregations: [congregationA, congregationB],
    locations: [],
  };
  const { service } = makeUserService({
    userFindOne: async ({ where }) => (where.id === targetId ? target : actor),
    personFindOne: async ({ where }) => {
      const allowedIds = where.congregation_id?._value ?? [];
      return allowedIds.includes(congregationBId)
        ? { id: personId, congregation_id: congregationBId, user_id: targetId }
        : null;
    },
  });
  const result = await service.get({ id: targetId, userId: actorId });
  assert.deepEqual(result.congregations.map(({ id: value }) => value), [congregationAId]);
  assert.equal(result.person, null);
});

test('SEC-007 replacement sessions use the current token version and permissions', async () => {
  let signedPayload;
  const currentUser = { ...actor, session_version: 7, password_change_required: false };
  const service = new AuthService(
    { findOne: async () => currentUser },
    {
      sign: (payload) => {
        signedPayload = payload;
        return 'replacement-token';
      },
    },
    i18n,
  );
  const result = await service.createSessionForUser(actorId);
  assert.equal(result.token, 'replacement-token');
  assert.equal(signedPayload.sessionVersion, 7);
  assert.deepEqual(signedPayload.auth.permissions, delegatedRole.permissions);
});

test('SEC-007 congregation removal revokes sessions for detached users', async () => {
  const queries = [];
  const manager = {
    getRepository: () => ({
      update: async () => ({ affected: 1 }),
      softDelete: async () => ({ affected: 1 }),
    }),
    query: async (sql, parameters) => {
      queries.push({ sql, parameters });
      if (sql.includes('SELECT "uc"."user_id"')) return [{ user_id: targetId }];
      if (sql.includes('GROUP BY "uc"."user_id"')) return [{ user_id: targetId, count: 2 }];
      if (sql.includes('SELECT "cl"."congregation_location_id"')) return [];
      if (sql.includes('SELECT "id" FROM "process"')) return [];
      if (sql.includes('SELECT "id" FROM "event"')) return [];
      if (sql.includes('COUNT(*)')) return [{ count: 0 }];
      return [];
    },
  };
  const service = new CongregationService(
    { manager, transaction: async (callback) => callback(manager) },
    {},
    {
      findOne: async () => ({ ...actor, congregations: [congregationA] }),
    },
    i18n,
  );

  await service.remove({ id: congregationAId, userId: actorId });

  const revocation = queries.find(({ sql }) =>
    sql.includes('UPDATE "user" SET "session_version" = "session_version" + 1'),
  );
  assert.ok(revocation);
  assert.deepEqual(revocation.parameters, [[targetId]]);
});

test('SEC-010 temporary sessions permit only completion, logout, and current-session reads', () => {
  const { assertSessionRouteAllowed } = require('../../src/modules/auth/session-policy');
  for (const [method, pathName] of [
    ['PUT', '/user/me/temporary-password'],
    ['POST', '/auth/logout'],
    ['GET', '/auth/me'],
  ]) {
    assert.doesNotThrow(() =>
      assertSessionRouteAllowed({ passwordChangeRequired: true, method, path: pathName, i18n }),
    );
  }
  assert.doesNotThrow(() =>
    assertSessionRouteAllowed({ passwordChangeRequired: false, method: 'GET', path: '/event', i18n }),
  );
});

test('SEC-011 permits same-tenant file ownership checks', async () => {
  const file = { id: fileId, congregation_id: congregationAId, deleted_at: null };
  const service = new FilesService(
    { findOne: async () => file },
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );
  assert.equal((await service.assertOwnedFile(fileId, actorId, congregationAId)).id, fileId);
});

test('SEC-012 rejects MIME-spoofed non-image bytes', async () => {
  const service = new FilesService(
    { sum: async () => 0 },
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );
  await assert.rejects(
    service.uploadImage({
      file: {
        originalname: 'spoof.png',
        mimetype: 'image/png',
        buffer: Buffer.from('<html><script>alert(1)</script></html>'),
        size: 38,
      },
      congregationId: congregationAId,
      userId: actorId,
    }),
  );
});

test('SEC-014 persists only event-declared linked Person fields', async () => {
  const fieldId = id(61);
  const person = {
    id: personId,
    congregation_id: congregationAId,
    first_name: 'Allowed',
    last_name: 'Person',
    phone: '',
    custom_values: {},
  };
  const event = {
    id: eventId,
    congregation_id: congregationAId,
    custom_fields: [
      { id: fieldId, type: 'text', person_field_id: 'phone', options: [], allow_multiple: false },
    ],
    save_attendance_date: false,
  };
  let savedPerson;
  const service = new EventParticipantService(
    {
      findOne: async () => null,
      create: (value) => value,
      save: async (value) => value,
    },
    { findOne: async () => event },
    {
      findOne: async () => person,
      find: async () => [],
      save: async (value) => {
        savedPerson = value;
        return value;
      },
    },
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );
  await service.create({
    userId: actorId,
    congregationId: congregationAId,
    data: { event_id: eventId, person_id: personId, field_values: { [fieldId]: '555-0100' } },
  });
  assert.equal(savedPerson.phone, '555-0100');
  assert.deepEqual(savedPerson.custom_values, {});
});

test('SEC-014 matching a public submission updates only event-declared Person fields', async () => {
  const fieldId = id(62);
  const person = {
    id: personId,
    congregation_id: congregationAId,
    first_name: 'Trusted',
    last_name: 'Person',
    phone: '555-0000',
    custom_values: {},
  };
  const event = {
    id: eventId,
    congregation_id: congregationAId,
    custom_fields: [
      { id: fieldId, type: 'text', person_field_id: 'phone', options: [], allow_multiple: false },
    ],
    save_attendance_date: false,
  };
  const participant = {
    id: id(63),
    event_id: eventId,
    event,
    person_id: null,
    attended: false,
    field_values: { [fieldId]: '555-0100' },
    submitted_person: {
      first_name: 'Attacker controlled',
      last_name: 'Replacement',
      phone: '555-9999',
    },
  };
  let participantLookup = 0;
  const service = new EventParticipantService(
    {
      findOne: async () => {
        participantLookup += 1;
        return participantLookup === 1 ? participant : null;
      },
      save: async (value) => value,
      softDelete: async () => ({ affected: 1 }),
    },
    { findOne: async () => event },
    {
      findOne: async () => person,
      find: async () => [],
      save: async (value) => value,
    },
    { findOne: async () => actor },
    { findOne: async () => congregationA },
    i18n,
  );

  await service.match({
    id: participant.id,
    personId: person.id,
    userId: actorId,
    congregationId: congregationAId,
  });

  assert.equal(person.first_name, 'Trusted');
  assert.equal(person.last_name, 'Person');
  assert.equal(person.phone, '555-0100');
});

test('SEC-017 enabled public events in enabled congregations still accept valid registrations', async () => {
  let saves = 0;
  const repository = {
    count: async () => 0,
    create: (value) => value,
    save: async (value) => {
      saves += 1;
      return value;
    },
  };
  const event = {
    id: eventId,
    enabled: true,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: congregationA,
    custom_fields: [],
  };
  const service = makeParticipantService({ participantRepository: repository, event });
  await service.publicRegister(id(97), {
    submitted_person: { first_name: 'Valid', last_name: 'Registrant' },
    field_values: {},
  });
  assert.equal(saves, 1);
});

test('SEC-018 accepts password boundaries consistently', () => {
  const minimum = 'm'.repeat(12);
  const maximum = 'x'.repeat(72);
  for (const password of [minimum, maximum]) {
    const cases = [
      [SetupUserDto, { username: 'user', name: 'User', password }],
      [UserCreateDto, { username: 'user', name: 'User', password }],
      [
        UserChangeOwnPasswordDto,
        { current_password: 'current-long-password', password, password_confirmation: password },
      ],
      [UserCompleteTemporaryPasswordDto, { password, password_confirmation: password }],
      [UserSetTemporaryPasswordDto, { password, password_confirmation: password }],
    ];
    cases.forEach(([Dto, value]) => {
      const errors = validateSync(plainToInstance(Dto, value));
      assert.equal(errors.some((error) => error.property === 'password'), false);
    });
  }
});

test('SEC-018 rejects Unicode passwords that exceed the bcrypt byte boundary', () => {
  const password = '😀'.repeat(24);
  const cases = [
    [SetupUserDto, { username: 'user', name: 'User', password }],
    [UserCreateDto, { username: 'user', name: 'User', password }],
    [
      UserChangeOwnPasswordDto,
      { current_password: 'current-long-password', password, password_confirmation: password },
    ],
    [UserCompleteTemporaryPasswordDto, { password, password_confirmation: password }],
    [UserSetTemporaryPasswordDto, { password, password_confirmation: password }],
  ];

  cases.forEach(([Dto, value]) => {
    const errors = validateSync(plainToInstance(Dto, value));
    assert.ok(errors.some((error) => error.property === 'password'));
  });
});

test('SEC-001 setup uses a database lock and permanently rejects replay', async () => {
  const originalSecret = process.env.SETUP_BOOTSTRAP_SECRET;
  process.env.SETUP_BOOTSTRAP_SECRET = '0123456789abcdef0123456789abcdef';
  let initialized = false;
  let lockCalls = 0;
  let sequence = 70;
  const makeRepository = (kind) => ({
    count: async () => (initialized ? 1 : 0),
    create: (value) => {
      if (Array.isArray(value)) return value.map((item) => ({ id: id(sequence++), ...item }));
      return { id: id(sequence++), ...value };
    },
    save: async (value) => {
      if (kind === 'congregation') initialized = true;
      return value;
    },
    findOne: async () => ({
      id: congregationAId,
      ...congregationA,
      name: 'Congregation',
      type: 'Church',
      locations: [{ id: id(90), order: 0, name: 'Main', address: '' }],
      updated_at: new Date(),
    }),
  });
  const repositories = new Map([
    ['User', makeRepository('user')],
    ['Role', makeRepository('role')],
    ['Congregation', makeRepository('congregation')],
    ['Configuration', makeRepository('configuration')],
    ['Location', makeRepository('location')],
  ]);
  const dataSource = {
    transaction: async (callback) =>
      callback({
        query: async (sql) => {
          assert.match(sql, /pg_advisory_xact_lock/);
          lockCalls += 1;
        },
        getRepository: (Entity) => repositories.get(Entity.name),
      }),
  };
  const service = new SetupService(
    dataSource,
    repositories.get('User'),
    repositories.get('Role'),
    repositories.get('Congregation'),
    repositories.get('Location'),
    {},
    i18n,
  );
  try {
    await service.setup(setupPayload, 'en', process.env.SETUP_BOOTSTRAP_SECRET);
    await assert.rejects(service.setup(setupPayload, 'en', process.env.SETUP_BOOTSTRAP_SECRET));
    assert.equal(lockCalls, 2);
  } finally {
    if (originalSecret === undefined) delete process.env.SETUP_BOOTSTRAP_SECRET;
    else process.env.SETUP_BOOTSTRAP_SECRET = originalSecret;
  }
});

test('SEC-003 permits a subordinate same-congregation reset and revokes existing sessions', async () => {
  const subordinateRole = { id: id(92), enabled: true, full_access: false, permissions: {} };
  const target = {
    id: targetId,
    enabled: true,
    roles: [subordinateRole],
    congregations: [congregationA],
    session_version: 4,
  };
  const { service } = makeUserService({
    userFindOne: async ({ where }) => (where.id === targetId ? target : actor),
  });
  const result = await service.setTemporaryPassword({
    id: targetId,
    userId: actorId,
    congregationId: congregationAId,
    data: { password: 'strong-temporary-password', password_confirmation: 'strong-temporary-password' },
  });
  assert.equal(result.password_change_required, true);
  assert.equal(result.session_version, 5);
  assert.equal('password' in result, false);
});

test('SEC-006 recursively verifies representative auth responses contain no password key', async () => {
  const currentUser = {
    ...actor,
    session_version: 1,
    password_change_required: false,
    created_by: { id: id(93), username: 'creator', name: 'Creator' },
    updated_by: { id: id(94), username: 'updater', name: 'Updater' },
  };
  const service = new AuthService({ findOne: async () => currentUser }, { sign: () => 'token' }, i18n);
  const response = await service.getCurrentSession(actorId);
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    assert.equal(Object.prototype.hasOwnProperty.call(value, 'password'), false);
    Object.values(value).forEach(visit);
  };
  visit(response);
});

test('SEC-008 rejects excessive terms and ignores non-allowlisted password search', async () => {
  let capturedWhere;
  const repository = {
    metadata: {
      columns: [
        { propertyName: 'id', databaseName: 'id', type: 'uuid' },
        { propertyName: 'name', databaseName: 'name', type: String },
        { propertyName: 'password', databaseName: 'password', type: String },
      ],
      primaryColumns: [{ propertyName: 'id' }],
      findColumnWithPropertyName: (field) => ({ databaseName: field, type: String }),
    },
    findAndCount: async ({ where }) => {
      capturedWhere = where;
      return [[], 0];
    },
  };
  await assert.rejects(
    findWithFilters({
      repository,
      query: { search: 'one two three four five six seven eight nine', size: 50, page: 0 },
      searchFields: ['name'],
      allowedSearchFields: ['name'],
    }),
  );
  await findWithFilters({
    repository,
    query: { search: 'hash-fragment', search_columns: 'password', size: 50, page: 0 },
    searchFields: ['name'],
    allowedSearchFields: ['name'],
  });
  const rawCondition = capturedWhere.id;
  assert.doesNotMatch(rawCondition._getSql('"user"."id"'), /password/i);
});

test('SEC-008 Person search does not construct factorial field permutations', async () => {
  const source = await fs.readFile(path.join(__dirname, '../../src/modules/person/person.service.ts'), 'utf8');

  assert.doesNotMatch(source, /appendCombinations|usedFields/);
});

test('SEC-013 enforces congregation quota and preserves shared file references', async () => {
  const storagePath = path.join(process.env.CODEX_SCRATCH_ROOT, 'congr.io', 'security-tests-quota');
  const originalPath = process.env.FILE_STORAGE_PATH;
  process.env.FILE_STORAGE_PATH = storagePath;
  const validPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZrroAAAAASUVORK5CYII=',
    'base64',
  );
  let updates = 0;
  let deletes = 0;
  const repository = {
    sum: async () => 500 * 1024 * 1024,
    findOne: async () => ({ id: fileId, storage_key: 'shared.png' }),
    update: async () => {
      updates += 1;
    },
    softDelete: async () => {
      deletes += 1;
    },
  };
  const service = new FilesService(
    repository,
    { findOne: async () => actor },
    { findOne: async () => congregationA, count: async () => 0 },
    i18n,
    { count: async () => 1 },
  );
  try {
    await assert.rejects(
      service.uploadImage({
        file: { originalname: 'small.png', mimetype: 'image/png', buffer: validPng, size: validPng.length },
        congregationId: congregationAId,
        userId: actorId,
      }),
    );
    await service.releaseIfUnreferenced(fileId);
    assert.equal(updates, 0);
    assert.equal(deletes, 0);
  } finally {
    await fs.rm(storagePath, { recursive: true, force: true });
    if (originalPath === undefined) delete process.env.FILE_STORAGE_PATH;
    else process.env.FILE_STORAGE_PATH = originalPath;
  }
});

test('SEC-015 rejects deeply nested public registration values without writing', async () => {
  let saves = 0;
  const repository = {
    count: async () => 0,
    create: (value) => value,
    save: async (value) => {
      saves += 1;
      return value;
    },
  };
  const fieldId = id(95);
  const event = {
    id: eventId,
    enabled: true,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: congregationA,
    custom_fields: [{ id: fieldId, type: 'text', options: [], allow_multiple: false }],
  };
  const service = makeParticipantService({ participantRepository: repository, event });
  await assert.rejects(
    service.publicRegister(id(96), {
      submitted_person: { first_name: 'Nested', last_name: 'Registrant' },
      field_values: { [fieldId]: { a: { b: { c: { d: { e: 'value' } } } } } },
    }),
  );
  assert.equal(saves, 0);
});

test('SEC-014 public registration rejects values for non-user-fillable fields', async () => {
  let saves = 0;
  const event = {
    id: eventId,
    enabled: true,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: congregationA,
    custom_fields: [
      {
        id: 'internal-note',
        type: 'text',
        options: [],
        allow_multiple: false,
        required: false,
        user_fillable: false,
      },
    ],
  };
  const service = makeParticipantService({
    participantRepository: {
      count: async () => 0,
      create: (value) => value,
      save: async (value) => {
        saves += 1;
        return value;
      },
    },
    event,
  });

  await assert.rejects(
    service.publicRegister(id(96), {
      submitted_person: { first_name: 'Public', last_name: 'Registrant' },
      field_values: { 'internal-note': 'attacker-controlled' },
    }),
  );
  assert.equal(saves, 0);
});

test('SEC-017 disabled congregations reject otherwise valid public registrations', async () => {
  let saves = 0;
  const repository = {
    count: async () => 0,
    create: (value) => value,
    save: async (value) => {
      saves += 1;
      return value;
    },
  };
  const event = {
    id: eventId,
    enabled: true,
    is_public: true,
    self_registration_enabled: true,
    registration_locked: false,
    congregation: { ...congregationA, enabled: false },
    custom_fields: [],
  };
  const service = makeParticipantService({ participantRepository: repository, event });
  await assert.rejects(
    service.publicRegister(id(100), {
      submitted_person: { first_name: 'Public', last_name: 'Registrant' },
      field_values: {},
    }),
  );
  assert.equal(saves, 0);
});
