CREATE TYPE public.app_role AS ENUM ('RH_ADMIN', 'MANAGER', 'COLLABORATEUR');

-- ============ Collaborateurs ============
CREATE TABLE public.collaborateurs (
  id_collaborateur integer PRIMARY KEY CHECK (id_collaborateur > 0),
  user_id uuid UNIQUE,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  date_naissance date NOT NULL,
  date_embauche date NOT NULL,
  type_contrat text NOT NULL CHECK (type_contrat IN ('CDI','CDD','Alternance','Stage','Freelance')),
  code_service text NOT NULL,
  intitule_poste text NOT NULL,
  niveau_classification text NOT NULL,
  salaire_brut_mensuel numeric(12,2) NOT NULL,
  taux_temps_travail numeric(4,2) NOT NULL,
  solde_cp numeric(6,2) NOT NULL DEFAULT 0,
  solde_rtt numeric(6,2) NOT NULL DEFAULT 0,
  id_manager integer,
  profil_acces text NOT NULL CHECK (profil_acces IN ('RH_ADMIN','MANAGER','COLLABORATEUR')),
  niveau_formation text,
  competences_cles text[] NOT NULL DEFAULT '{}',
  date_fin_contrat date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX collaborateurs_id_manager_idx ON public.collaborateurs (id_manager);
CREATE INDEX collaborateurs_code_service_idx ON public.collaborateurs (code_service);
CREATE INDEX collaborateurs_nom_idx ON public.collaborateurs (nom, prenom);

-- user_id is only ever set by the server (service role) when an account is activated.
GRANT SELECT, DELETE ON public.collaborateurs TO authenticated;
GRANT INSERT (id_collaborateur, nom, prenom, email, date_naissance, date_embauche, type_contrat, code_service, intitule_poste, niveau_classification, salaire_brut_mensuel, taux_temps_travail, solde_cp, solde_rtt, id_manager, profil_acces, niveau_formation, competences_cles, date_fin_contrat)
  ON public.collaborateurs TO authenticated;
GRANT UPDATE (nom, prenom, email, date_naissance, date_embauche, type_contrat, code_service, intitule_poste, niveau_classification, salaire_brut_mensuel, taux_temps_travail, solde_cp, solde_rtt, id_manager, profil_acces, niveau_formation, competences_cles, date_fin_contrat, updated_at)
  ON public.collaborateurs TO authenticated;
GRANT ALL ON public.collaborateurs TO service_role;

ALTER TABLE public.collaborateurs ENABLE ROW LEVEL SECURITY;

-- ============ Rôles ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ Journal des imports ============
CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  author_user_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text,
  file_name text,
  encoding text,
  total_rows integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- ============ Fonctions d'accès ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_collaborateur_id()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id_collaborateur FROM public.collaborateurs WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_view_collaborateur(_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'RH_ADMIN')
      OR EXISTS (
        SELECT 1 FROM public.collaborateurs c
        WHERE c.id_collaborateur = _id
          AND (
            c.user_id = auth.uid()
            OR (public.has_role(auth.uid(), 'MANAGER') AND c.id_manager = public.current_collaborateur_id())
          )
      )
    )
$$;

-- 'ok' | 'forbidden' | 'not_found' — lets the UI show a real 403 page.
CREATE OR REPLACE FUNCTION public.collaborateur_access(_id integer)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'forbidden'
    WHEN NOT EXISTS (SELECT 1 FROM public.collaborateurs WHERE id_collaborateur = _id) THEN 'not_found'
    WHEN public.can_view_collaborateur(_id) THEN 'ok'
    ELSE 'forbidden'
  END
$$;

-- Manager name for a fiche the caller is allowed to see (name, title, service only).
CREATE OR REPLACE FUNCTION public.get_manager_of(_id integer)
RETURNS TABLE (id_collaborateur integer, nom text, prenom text, intitule_poste text, code_service text, can_open boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id_collaborateur, m.nom, m.prenom, m.intitule_poste, m.code_service,
         public.can_view_collaborateur(m.id_collaborateur)
  FROM public.collaborateurs c
  JOIN public.collaborateurs m ON m.id_collaborateur = c.id_manager
  WHERE c.id_collaborateur = _id
    AND public.can_view_collaborateur(_id)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_collaborateur_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_collaborateur(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.collaborateur_access(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_manager_of(integer) FROM anon;

-- ============ Policies ============
CREATE POLICY "Lecture selon le rôle"
  ON public.collaborateurs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'RH_ADMIN')
    OR user_id = auth.uid()
    OR (public.has_role(auth.uid(), 'MANAGER') AND id_manager = public.current_collaborateur_id())
  );

CREATE POLICY "RH_ADMIN crée des fiches"
  ON public.collaborateurs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN modifie des fiches"
  ON public.collaborateurs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN supprime des fiches"
  ON public.collaborateurs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "Chacun lit ses rôles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RH_ADMIN lit le journal des imports"
  ON public.import_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN écrit le journal des imports"
  ON public.import_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN') AND author_user_id = auth.uid());

-- ============ Triggers ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER collaborateurs_touch_updated_at
  BEFORE UPDATE ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Keeps user_roles in sync with profil_acces (the CSV column is the source of truth).
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
  END IF;
  IF NEW.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, NEW.profil_acces::public.app_role);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER collaborateurs_sync_role
  AFTER INSERT OR UPDATE OF profil_acces, user_id ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

CREATE OR REPLACE FUNCTION public.remove_user_role_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER collaborateurs_remove_role
  AFTER DELETE ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.remove_user_role_on_delete();