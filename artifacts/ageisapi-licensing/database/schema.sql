-- AegisAPI Licensing — PostgreSQL schema
-- Source of truth for all tables. Apply to a fresh DB with:
--   psql $DATABASE_URL -f database/schema.sql
-- Safe to re-run: all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.app_users (
    id integer NOT NULL,
    clerk_user_id text NOT NULL,
    stripe_customer_id_encrypted text,
    revoked_at timestamp without time zone,
    suspended boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.app_users_id_seq
    AS integer START WITH 1 INCREMENT BY 1
    NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.app_users_id_seq OWNED BY public.app_users.id;
ALTER TABLE ONLY public.app_users ALTER COLUMN id SET DEFAULT nextval('public.app_users_id_seq'::regclass);

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT IF NOT EXISTS app_users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT IF NOT EXISTS app_users_clerk_user_id_unique UNIQUE (clerk_user_id);

-- Migration: add stripe_customer_id_encrypted if it doesn't exist yet
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS stripe_customer_id_encrypted text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false;


CREATE TABLE IF NOT EXISTS public.licensing_license_bindings (
    id integer NOT NULL,
    license_key_encrypted text NOT NULL,
    license_key_lookup_hash text NOT NULL,
    machine_id_encrypted text,
    status text DEFAULT 'unbound'::text NOT NULL,
    pack_call_balance integer DEFAULT 0 NOT NULL,
    bound_at timestamp without time zone,
    released_at timestamp without time zone,
    force_cleared boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.licensing_license_bindings_id_seq
    AS integer START WITH 1 INCREMENT BY 1
    NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.licensing_license_bindings_id_seq OWNED BY public.licensing_license_bindings.id;
ALTER TABLE ONLY public.licensing_license_bindings ALTER COLUMN id SET DEFAULT nextval('public.licensing_license_bindings_id_seq'::regclass);

ALTER TABLE ONLY public.licensing_license_bindings
    ADD CONSTRAINT IF NOT EXISTS licensing_license_bindings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.licensing_license_bindings
    ADD CONSTRAINT IF NOT EXISTS licensing_license_bindings_license_key_lookup_hash_unique UNIQUE (license_key_lookup_hash);


CREATE TABLE IF NOT EXISTS public.licensing_user_licenses (
    id integer NOT NULL,
    clerk_user_id text NOT NULL,
    license_key_lookup_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.licensing_user_licenses_id_seq
    AS integer START WITH 1 INCREMENT BY 1
    NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.licensing_user_licenses_id_seq OWNED BY public.licensing_user_licenses.id;
ALTER TABLE ONLY public.licensing_user_licenses ALTER COLUMN id SET DEFAULT nextval('public.licensing_user_licenses_id_seq'::regclass);

ALTER TABLE ONLY public.licensing_user_licenses
    ADD CONSTRAINT IF NOT EXISTS licensing_user_licenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.licensing_user_licenses
    ADD CONSTRAINT IF NOT EXISTS licensing_user_licenses_license_key_lookup_hash_unique UNIQUE (license_key_lookup_hash);


CREATE TABLE IF NOT EXISTS public.licensing_audit_log (
    id integer NOT NULL,
    license_key_lookup_hash text NOT NULL,
    action text NOT NULL,
    actor text DEFAULT 'system'::text NOT NULL,
    detail text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.licensing_audit_log_id_seq
    AS integer START WITH 1 INCREMENT BY 1
    NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.licensing_audit_log_id_seq OWNED BY public.licensing_audit_log.id;
ALTER TABLE ONLY public.licensing_audit_log ALTER COLUMN id SET DEFAULT nextval('public.licensing_audit_log_id_seq'::regclass);

ALTER TABLE ONLY public.licensing_audit_log
    ADD CONSTRAINT IF NOT EXISTS licensing_audit_log_pkey PRIMARY KEY (id);


CREATE TABLE IF NOT EXISTS public.purchase_tokens (
    id integer NOT NULL,
    clerk_user_id text NOT NULL,
    token text NOT NULL,
    tier text NOT NULL,
    call_balance integer DEFAULT 0 NOT NULL,
    stripe_session_id text,
    price_paid_cents integer DEFAULT 0 NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    redeemed boolean DEFAULT false NOT NULL,
    redeemed_at timestamp without time zone,
    license_expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.purchase_tokens_id_seq
    AS integer START WITH 1 INCREMENT BY 1
    NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.purchase_tokens_id_seq OWNED BY public.purchase_tokens.id;
ALTER TABLE ONLY public.purchase_tokens ALTER COLUMN id SET DEFAULT nextval('public.purchase_tokens_id_seq'::regclass);

ALTER TABLE ONLY public.purchase_tokens
    ADD CONSTRAINT IF NOT EXISTS purchase_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.purchase_tokens
    ADD CONSTRAINT IF NOT EXISTS purchase_tokens_token_unique UNIQUE (token);
ALTER TABLE ONLY public.purchase_tokens
    ADD CONSTRAINT IF NOT EXISTS purchase_tokens_stripe_session_id_unique UNIQUE (stripe_session_id);
