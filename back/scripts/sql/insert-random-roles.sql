-- PostgreSQL seed for 100 random active roles and 100 random active users.
-- Safe cleanup if you want to remove only this batch later:
-- DELETE FROM "user_location" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_congregation" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user_role" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "username" LIKE 'seed.user.%');
-- DELETE FROM "user" WHERE "username" LIKE 'seed.user.%';
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
                  FROM unnest(ARRAY['get', 'create', 'update', 'delete']::text[]) AS action
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
          'configuration',
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
  COALESCE(permissions, '{"configuration":["get"]}'),
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

COMMIT;
