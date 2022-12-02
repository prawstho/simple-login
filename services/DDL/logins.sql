CREATE TABLE IF NOT EXISTS public."Logins"
(
    id serial NOT NULL,
    username character varying(12) NOT NULL,
    password character varying(80) NOT NULL,
    email character varying(128) NOT NULL,
    uuid uuid NOT NULL,
    CONSTRAINT "Logins_pkey" PRIMARY KEY (id)
)

ALTER TABLE IF EXISTS public."Logins"
    ADD CONSTRAINT unique_username UNIQUE (username);