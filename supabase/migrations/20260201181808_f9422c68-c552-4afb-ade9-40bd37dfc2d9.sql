DROP POLICY IF EXISTS "Teachers and admins can create courses" ON public.courses;

CREATE POLICY "Teachers and admins can create courses"
ON public.courses
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
