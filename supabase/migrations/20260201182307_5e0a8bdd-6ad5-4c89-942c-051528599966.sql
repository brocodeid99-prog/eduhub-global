DROP POLICY IF EXISTS "Teachers and admins can create courses" ON public.courses;

CREATE POLICY "Teachers and admins can create courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  -- prevent privilege escalation: must create courses owned by self
  owner_id = public.get_profile_id(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('teacher'::public.app_role, 'admin'::public.app_role)
  )
);
