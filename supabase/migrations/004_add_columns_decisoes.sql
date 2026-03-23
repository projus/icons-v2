CREATE TYPE tipo_decisao AS ENUM ('colegiada', 'monocratica');
ALTER TABLE stf_decisoes ADD COLUMN IF NOT EXISTS caso TEXT;
ALTER TABLE stf_decisoes ADD COLUMN IF NOT EXISTS tipo_decisao tipo_decisao;
ALTER TABLE stf_decisoes ADD COLUMN IF NOT EXISTS redator_acordao TEXT;
ALTER TABLE stf_decisoes ADD COLUMN IF NOT EXISTS tema_rg TEXT;
