CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "Admins can view user roles" ON public.user_roles;
CREATE POLICY "Admins can view user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage clientes" ON public.clientes;
CREATE POLICY "Admins can manage clientes" ON public.clientes FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage websites" ON public.websites;
CREATE POLICY "Admins can manage websites" ON public.websites FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage planos" ON public.planos;
CREATE POLICY "Admins can manage planos" ON public.planos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage assinaturas" ON public.assinaturas;
CREATE POLICY "Admins can manage assinaturas" ON public.assinaturas FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage pagamentos" ON public.pagamentos;
CREATE POLICY "Admins can manage pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage manutencoes" ON public.manutencoes;
CREATE POLICY "Admins can manage manutencoes" ON public.manutencoes FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can manage faturamentos" ON public.faturamentos;
CREATE POLICY "Admins can manage faturamentos" ON public.faturamentos FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));