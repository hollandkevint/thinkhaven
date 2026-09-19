begin;

create schema if not exists "app_auth";

create table "app_auth"."user" (
  "id" uuid default pg_catalog.gen_random_uuid() primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create table "app_auth"."session" (
  "id" uuid default pg_catalog.gen_random_uuid() primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references "app_auth"."user" ("id") on delete cascade
);

create table "app_auth"."account" (
  "id" uuid default pg_catalog.gen_random_uuid() primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references "app_auth"."user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null
);

create table "app_auth"."verification" (
  "id" uuid default pg_catalog.gen_random_uuid() primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create index "session_userId_idx" on "app_auth"."session" ("userId");
create index "account_userId_idx" on "app_auth"."account" ("userId");
create index "verification_identifier_idx" on "app_auth"."verification" ("identifier");

insert into "app_auth"."user" (
  "id",
  "name",
  "email",
  "emailVerified",
  "image",
  "createdAt",
  "updatedAt"
)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    split_part(email, '@', 1),
    'ThinkHaven user'
  ),
  email,
  email_confirmed_at is not null,
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture'),
  created_at,
  updated_at
from auth.users
where email is not null;

-- Supabase password hashes and sessions are intentionally not imported.
-- A password reset creates the Better Auth credential account on first use.
insert into "app_auth"."account" (
  "accountId",
  "providerId",
  "userId",
  "createdAt",
  "updatedAt"
)
select
  provider_id,
  provider,
  user_id,
  coalesce(created_at, current_timestamp),
  coalesce(updated_at, current_timestamp)
from auth.identities
where provider <> 'email';

do $$
begin
  if (select count(*) from "app_auth"."user") <>
     (select count(*) from auth.users where email is not null) then
    raise exception 'app_auth user import count mismatch';
  end if;

  if (select count(*) from "app_auth"."account") <>
     (select count(*) from auth.identities where provider <> 'email') then
    raise exception 'app_auth provider import count mismatch';
  end if;
end
$$;

commit;
