--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Ubuntu 16.2-1.pgdg22.04+1)
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS carbon_platform;
--
-- Name: carbon_platform; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE carbon_platform WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


ALTER DATABASE carbon_platform OWNER TO postgres;

\connect carbon_platform

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tbl_account_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_account_documents (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    file_uuid character varying(36) NOT NULL,
    file_format character varying(5) NOT NULL
);


ALTER TABLE public.tbl_account_documents OWNER TO postgres;

--
-- Name: tbl_account_verify_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_account_verify_requests (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reject_reason text,
    status smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.tbl_account_verify_requests OWNER TO postgres;

--
-- Name: tbl_account_verify_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_account_verify_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_account_verify_requests_id_seq OWNER TO postgres;

--
-- Name: tbl_account_verify_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_account_verify_requests_id_seq OWNED BY public.tbl_account_verify_requests.id;


--
-- Name: tbl_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    password text NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    company character varying,
    role smallint DEFAULT 0 NOT NULL,
    verified smallint DEFAULT 0 NOT NULL,
    last_login timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.tbl_users OWNER TO postgres;

--
-- Name: tbl_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_users_id_seq OWNER TO postgres;

--
-- Name: tbl_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_users_id_seq OWNED BY public.tbl_users.id;


--
-- Name: tbl_verify_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_verify_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_verify_documents_id_seq OWNER TO postgres;

--
-- Name: tbl_verify_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_verify_documents_id_seq OWNED BY public.tbl_account_documents.id;


--
-- Name: tbl_wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tbl_wallets (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    wallet_address text NOT NULL
);


ALTER TABLE public.tbl_wallets OWNER TO postgres;

--
-- Name: tbl_wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tbl_wallets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_wallets_id_seq OWNER TO postgres;

--
-- Name: tbl_wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tbl_wallets_id_seq OWNED BY public.tbl_wallets.id;


--
-- Name: tbl_account_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_documents ALTER COLUMN id SET DEFAULT nextval('public.tbl_verify_documents_id_seq'::regclass);


--
-- Name: tbl_account_verify_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_verify_requests ALTER COLUMN id SET DEFAULT nextval('public.tbl_account_verify_requests_id_seq'::regclass);


--
-- Name: tbl_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_users ALTER COLUMN id SET DEFAULT nextval('public.tbl_users_id_seq'::regclass);


--
-- Name: tbl_wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_wallets ALTER COLUMN id SET DEFAULT nextval('public.tbl_wallets_id_seq'::regclass);


--
-- Data for Name: tbl_account_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tbl_account_documents (id, user_id, file_uuid, file_format) FROM stdin;
\.


--
-- Data for Name: tbl_account_verify_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tbl_account_verify_requests (id, user_id, created_date, reject_reason, status) FROM stdin;
\.


--
-- Data for Name: tbl_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tbl_users (id, email, password, first_name, last_name, company, role, verified, last_login, status) FROM stdin;
1	admin@acgcloud.net	$2a$10$5JuhQT5/SfEP.ireHjbBK.p0aNlaxyVDd4oRZo.n2fRQfVG.h01XK	Admin	Admin	Demo Company	3	1	2024-03-26 05:01:52.42	1
\.


--
-- Data for Name: tbl_wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tbl_wallets (id, user_id, wallet_address) FROM stdin;
\.


--
-- Name: tbl_account_verify_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tbl_account_verify_requests_id_seq', 1, false);


--
-- Name: tbl_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tbl_users_id_seq', 1, true);


--
-- Name: tbl_verify_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tbl_verify_documents_id_seq', 1, false);


--
-- Name: tbl_wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tbl_wallets_id_seq', 1, false);


--
-- Name: tbl_account_verify_requests tbl_account_verify_requests_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_verify_requests
    ADD CONSTRAINT tbl_account_verify_requests_pk PRIMARY KEY (id);


--
-- Name: tbl_users tbl_users_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_users
    ADD CONSTRAINT tbl_users_pk PRIMARY KEY (id);


--
-- Name: tbl_account_documents tbl_verify_documents_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_documents
    ADD CONSTRAINT tbl_verify_documents_pk PRIMARY KEY (id);


--
-- Name: tbl_wallets tbl_wallets_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_wallets
    ADD CONSTRAINT tbl_wallets_pk PRIMARY KEY (id);


--
-- Name: tbl_wallets tbl_wallets_pk_2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_wallets
    ADD CONSTRAINT tbl_wallets_pk_2 UNIQUE (user_id);


--
-- Name: tbl_wallets tbl_wallets_pk_3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_wallets
    ADD CONSTRAINT tbl_wallets_pk_3 UNIQUE (wallet_address);


--
-- Name: tbl_account_verify_requests tbl_account_verify_requests_tbl_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_verify_requests
    ADD CONSTRAINT tbl_account_verify_requests_tbl_users_id_fk FOREIGN KEY (user_id) REFERENCES public.tbl_users(id);


--
-- Name: tbl_account_documents tbl_verify_documents_tbl_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_account_documents
    ADD CONSTRAINT tbl_verify_documents_tbl_users_id_fk FOREIGN KEY (user_id) REFERENCES public.tbl_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tbl_wallets tbl_wallets_tbl_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tbl_wallets
    ADD CONSTRAINT tbl_wallets_tbl_users_id_fk FOREIGN KEY (user_id) REFERENCES public.tbl_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

