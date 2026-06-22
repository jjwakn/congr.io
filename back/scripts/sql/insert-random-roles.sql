-- PostgreSQL seed for 100 random active roles, 100 random active users, and 1000 random active persons.
-- Safe cleanup if you want to remove only this batch later:
-- DELETE FROM "user_location" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_congregation" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_role" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user" WHERE "username" LIKE 'seed.user.%';
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
    format('SD%s', lpad(gs::text, 5, '0')) AS code,
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

COMMIT;
