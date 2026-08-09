-- PostgreSQL seed for 100 random active roles, 100 random active users, 1000 random active persons, and monthly events.
-- Safe cleanup if you want to remove only this batch later:
-- DELETE FROM "user_location" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_congregation" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_role" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user" WHERE "username" LIKE 'seed.user.%';
-- DELETE FROM "event" WHERE "description" LIKE 'Seed event generated for %';
-- DELETE FROM "person" WHERE "code" LIKE 'SD%';
-- DELETE FROM "role" WHERE "name" LIKE 'Seed Role %';

BEGIN;

WITH name_parts AS (
  SELECT
    ARRAY[
      'Alpha',
      'Beacon',
      'Bridge',
      'Cedar',
      'Cornerstone',
      'Covenant',
      'Eden',
      'Faith',
      'Grace',
      'Harbor',
      'Hope',
      'Legacy',
      'Mercy',
      'New',
      'North',
      'Pathway',
      'Promise',
      'River',
      'Solid',
      'Summit'
    ]::text[] AS adjectives,
    ARRAY[
      'Coordinators',
      'Leaders',
      'Guides',
      'Hosts',
      'Builders',
      'Shepherds',
      'Partners',
      'Planners',
      'Support',
      'Admins',
      'Care',
      'Crew',
      'Team',
      'Network',
      'Collective',
      'Operators',
      'Mentors',
      'Stewards',
      'Facilitators',
      'Champions'
    ]::text[] AS groups
),
generated_roles AS (
  SELECT
    gs,
    format(
      'Seed Role %s - %s %s',
      lpad(gs::text, 3, '0'),
      adjectives[1 + floor(random() * array_length(adjectives, 1))::int],
      groups[1 + floor(random() * array_length(groups, 1))::int]
    ) AS name,
    NULLIF(
      jsonb_strip_nulls(
        jsonb_build_object(
          'user',
          CASE
            WHEN random() > 0.30 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete', 'change_password']::text[]) AS action
                  WHERE random() > 0.45
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'role',
          CASE
            WHEN random() > 0.40 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.52
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'congregation',
          CASE
            WHEN random() > 0.25 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.50
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'process',
          CASE
            WHEN random() > 0.35 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.50
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'event',
          CASE
            WHEN random() > 0.30 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.48
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'event_type',
          CASE
            WHEN random() > 0.40 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.55
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END,
          'event_field',
          CASE
            WHEN random() > 0.40 THEN to_jsonb(
              COALESCE(
                (
                  SELECT array_agg(action)
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
                  WHERE random() > 0.55
                ),
                ARRAY['get']::text[]
              )
            )
            ELSE NULL
          END
        )
      )::text,
      '{}'
    ) AS permissions
  FROM generate_series(1, 100) AS gs
  CROSS JOIN name_parts
)
INSERT INTO "role" ("name", "permissions", "full_access", "enabled")
SELECT
  name,
  COALESCE(permissions, '{"congregation":["get"]}'),
  FALSE,
  TRUE
FROM generated_roles
ORDER BY gs;

WITH name_parts AS (
  SELECT
    ARRAY[
      'Aaron',
      'Abigail',
      'Benjamin',
      'Clara',
      'Daniel',
      'Elena',
      'Gabriel',
      'Hannah',
      'Isaac',
      'Julia',
      'Lucas',
      'Marta',
      'Nathan',
      'Olivia',
      'Samuel',
      'Sofia',
      'Thomas',
      'Valeria',
      'Victor',
      'Zoe'
    ]::text[] AS first_names,
    ARRAY[
      'Alvarez',
      'Bennett',
      'Castillo',
      'Diaz',
      'Evans',
      'Flores',
      'Garcia',
      'Herrera',
      'Johnson',
      'Lopez',
      'Martinez',
      'Nelson',
      'Ortega',
      'Perez',
      'Rivera',
      'Santos',
      'Torres',
      'Vargas',
      'Williams',
      'Young'
    ]::text[] AS last_names
),
generated_users AS (
  SELECT
    gs,
    format('seed.user.%s', lpad(gs::text, 3, '0')) AS username,
    format(
      '%s %s',
      first_names[1 + floor(random() * array_length(first_names, 1))::int],
      last_names[1 + floor(random() * array_length(last_names, 1))::int]
    ) AS name
  FROM generate_series(1, 100) AS gs
  CROSS JOIN name_parts
)
INSERT INTO "user" ("username", "password", "name", "enabled")
SELECT
  username,
  '$2b$10$KAnNAmt507pjdawpGflzA.YPsD3u8SLeg991r5LWF08rLWrEIqQkC',
  name,
  random() > 0.08
FROM generated_users
ORDER BY gs;

WITH seed_users AS (
  SELECT "id"
  FROM "user"
  WHERE "username" LIKE 'seed.user.%'
),
seed_roles AS (
  SELECT "id"
  FROM "role"
  WHERE "name" LIKE 'Seed Role %'
)
INSERT INTO "user_role" ("user_id", "role_id")
SELECT
  seed_users."id",
  selected_roles."id"
FROM seed_users
JOIN LATERAL (
  SELECT seed_roles."id"
  FROM seed_roles
  WHERE seed_users."id" IS NOT NULL
  ORDER BY random()
  LIMIT (1 + floor(random() * 3)::int)
) AS selected_roles ON TRUE
ON CONFLICT DO NOTHING;

WITH seed_users AS (
  SELECT "id"
  FROM "user"
  WHERE "username" LIKE 'seed.user.%'
),
active_congregations AS (
  SELECT "id"
  FROM "congregation"
  WHERE "deleted_at" IS NULL
)
INSERT INTO "user_congregation" ("user_id", "congregation_id")
SELECT
  seed_users."id",
  selected_congregations."id"
FROM seed_users
JOIN LATERAL (
  SELECT active_congregations."id"
  FROM active_congregations
  WHERE seed_users."id" IS NOT NULL
  ORDER BY random()
  LIMIT 1
) AS selected_congregations ON TRUE
ON CONFLICT DO NOTHING;

WITH seed_users AS (
  SELECT "id"
  FROM "user"
  WHERE "username" LIKE 'seed.user.%'
),
active_locations AS (
  SELECT "id"
  FROM "location"
  WHERE "deleted_at" IS NULL
)
INSERT INTO "user_location" ("user_id", "location_id")
SELECT
  seed_users."id",
  selected_locations."id"
FROM seed_users
JOIN LATERAL (
  SELECT active_locations."id"
  FROM active_locations
  WHERE seed_users."id" IS NOT NULL
  ORDER BY random()
  LIMIT (1 + floor(random() * 2)::int)
) AS selected_locations ON TRUE
ON CONFLICT DO NOTHING;

WITH name_parts AS (
  SELECT
    ARRAY[
      'Aaron',
      'Abigail',
      'Benjamin',
      'Clara',
      'Daniel',
      'Elena',
      'Gabriel',
      'Hannah',
      'Isaac',
      'Julia',
      'Lucas',
      'Marta',
      'Nathan',
      'Olivia',
      'Samuel',
      'Sofia',
      'Thomas',
      'Valeria',
      'Victor',
      'Zoe'
    ]::text[] AS first_names,
    ARRAY[
      'Alvarez',
      'Bennett',
      'Castillo',
      'Diaz',
      'Evans',
      'Flores',
      'Garcia',
      'Herrera',
      'Johnson',
      'Lopez',
      'Martinez',
      'Nelson',
      'Ortega',
      'Perez',
      'Rivera',
      'Santos',
      'Torres',
      'Vargas',
      'Williams',
      'Young'
    ]::text[] AS last_names
),
active_congregations AS (
  SELECT
    "id",
    row_number() OVER (ORDER BY "name", "id") AS rn,
    count(*) OVER () AS total
  FROM "congregation"
  WHERE "deleted_at" IS NULL
),
generated_persons AS (
  SELECT
    gs,
    format('SD%s', gs::text) AS code,
    first_names[1 + floor(random() * array_length(first_names, 1))::int] AS first_name,
    last_names[1 + floor(random() * array_length(last_names, 1))::int] AS last_name,
    CASE
      WHEN random() > 0.35 THEN format(
        '555-%s',
        lpad(floor(random() * 10000)::int::text, 4, '0')
      )
      ELSE ''
    END AS phone,
    CASE
      WHEN random() > 0.30 THEN (
        date '1940-01-01' + floor(random() * 28000)::int
      )::date
      ELSE NULL
    END AS birthdate
  FROM generate_series(1, 1000) AS gs
  CROSS JOIN name_parts
)
INSERT INTO "person" (
  "congregation_id",
  "code",
  "code_history",
  "first_name",
  "last_name",
  "phone",
  "birthdate",
  "registered_age",
  "age_recorded_at",
  "email",
  "custom_values",
  "enabled"
)
SELECT
  active_congregations."id",
  generated_persons.code,
  jsonb_build_array(
    jsonb_build_object('code', generated_persons.code, 'generated_at', now())
  )::text,
  generated_persons.first_name,
  generated_persons.last_name,
  generated_persons.phone,
  generated_persons.birthdate,
  CASE
    WHEN generated_persons.birthdate IS NULL THEN 18 + floor(random() * 65)::int
    ELSE NULL
  END,
  CASE
    WHEN generated_persons.birthdate IS NULL THEN current_date
    ELSE NULL
  END,
  lower(format(
    'seed.person.%s@example.test',
    lpad(generated_persons.gs::text, 4, '0')
  )),
  '{}'::text,
  TRUE
FROM generated_persons
JOIN active_congregations
  ON active_congregations.rn = ((generated_persons.gs - 1) % active_congregations.total) + 1
ON CONFLICT DO NOTHING;

WITH seed_users AS (
  SELECT
    "id",
    row_number() OVER (ORDER BY "username") AS rn
  FROM "user"
  WHERE "username" LIKE 'seed.user.%'
),
seed_persons AS (
  SELECT
    "id",
    row_number() OVER (ORDER BY substring("code" from 3)::int) AS rn
  FROM "person"
  WHERE "email" LIKE 'seed.person.%@example.test'
    AND "user_id" IS NULL
)
UPDATE "person"
SET "user_id" = seed_users."id"
FROM seed_users
JOIN seed_persons
  ON seed_persons.rn = seed_users.rn
WHERE "person"."id" = seed_persons."id"
  AND seed_users.rn <= 75;

WITH target_months AS (
  SELECT generate_series(
    date_trunc('year', current_date)::date,
    (date_trunc('year', current_date)::date + interval '11 months')::date,
    interval '1 month'
  )::date AS month_start
),
month_sundays AS (
  SELECT
    target_months.month_start,
    sunday_dates.sunday_date::date,
    row_number() OVER (
      PARTITION BY target_months.month_start
      ORDER BY sunday_dates.sunday_date
    ) AS sunday_position,
    count(*) OVER (PARTITION BY target_months.month_start) AS sunday_count
  FROM target_months
  CROSS JOIN LATERAL generate_series(
    target_months.month_start,
    (target_months.month_start + interval '1 month' - interval '1 day')::date,
    interval '1 day'
  ) AS sunday_dates(sunday_date)
  WHERE extract(dow FROM sunday_dates.sunday_date) = 0
),
active_event_types AS (
  SELECT
    event_type."id",
    event_type."congregation_id",
    event_type."name",
    event_type."attendance_enabled",
    event_type."default_public",
    event_type."default_self_registration",
    event_type."custom_fields",
    event_type."save_attendance_date",
    event_type."default_start_time",
    event_type."default_duration_minutes",
    event_type."attendance_date_person_field_id",
    congregation."timezone"
  FROM "event_type" AS event_type
  INNER JOIN "congregation" AS congregation
    ON congregation."id" = event_type."congregation_id"
    AND congregation."deleted_at" IS NULL
  WHERE event_type."enabled" = TRUE
    AND event_type."deleted_at" IS NULL
),
monthly_event_types AS (
  SELECT
    target_months.month_start,
    active_event_types.*,
    row_number() OVER (
      PARTITION BY target_months.month_start, active_event_types."congregation_id"
      ORDER BY random(), active_event_types."name", active_event_types."id"
    ) AS event_type_position
  FROM target_months
  CROSS JOIN active_event_types
),
scheduled_events AS (
  SELECT
    monthly_event_types.*,
    month_sundays.sunday_date,
    COALESCE(monthly_event_types."default_start_time", time '10:00') AS start_time,
    GREATEST(COALESCE(monthly_event_types."default_duration_minutes", 60), 15) AS duration_minutes,
    md5(
      monthly_event_types."id"::text ||
      monthly_event_types.month_start::text ||
      random()::text ||
      clock_timestamp()::text
    ) AS public_uuid_seed
  FROM monthly_event_types
  INNER JOIN month_sundays
    ON month_sundays.month_start = monthly_event_types.month_start
    AND month_sundays.sunday_position = (
      ((monthly_event_types.event_type_position - 1) % month_sundays.sunday_count) + 1
    )
)
INSERT INTO "event" (
  "congregation_id",
  "name",
  "description",
  "start_datetime",
  "end_datetime",
  "event_type_id",
  "all_day",
  "is_public",
  "public_id",
  "attendance_enabled",
  "self_registration_enabled",
  "registration_locked",
  "custom_fields",
  "save_attendance_date",
  "attendance_date_person_field_id",
  "enabled"
)
SELECT
  scheduled_events."congregation_id",
  scheduled_events."name",
  format(
    'Seed event generated for %s on %s.',
    scheduled_events."name",
    to_char(scheduled_events.sunday_date, 'YYYY-MM-DD')
  ),
  ((scheduled_events.sunday_date + scheduled_events.start_time) AT TIME ZONE scheduled_events."timezone"),
  (
    (
      scheduled_events.sunday_date +
      scheduled_events.start_time +
      (scheduled_events.duration_minutes::text || ' minutes')::interval
    ) AT TIME ZONE scheduled_events."timezone"
  ),
  scheduled_events."id",
  FALSE,
  scheduled_events."default_public",
  CASE
    WHEN scheduled_events."default_public" THEN (
      substr(scheduled_events.public_uuid_seed, 1, 8) || '-' ||
      substr(scheduled_events.public_uuid_seed, 9, 4) || '-' ||
      substr(scheduled_events.public_uuid_seed, 13, 4) || '-' ||
      substr(scheduled_events.public_uuid_seed, 17, 4) || '-' ||
      substr(scheduled_events.public_uuid_seed, 21, 12)
    )::uuid
    ELSE NULL
  END,
  scheduled_events."attendance_enabled",
  scheduled_events."default_self_registration",
  FALSE,
  scheduled_events."custom_fields",
  scheduled_events."save_attendance_date",
  scheduled_events."attendance_date_person_field_id",
  TRUE
FROM scheduled_events
WHERE NOT EXISTS (
  SELECT 1
  FROM "event" AS existing_event
  WHERE existing_event."event_type_id" = scheduled_events."id"
    AND existing_event."deleted_at" IS NULL
    AND date_trunc(
      'month',
      existing_event."start_datetime" AT TIME ZONE scheduled_events."timezone"
    ) = scheduled_events.month_start::timestamp
)
ORDER BY scheduled_events.month_start, scheduled_events.sunday_date, scheduled_events."name"
ON CONFLICT DO NOTHING;

COMMIT;
