-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;

-- Create a new PERMISSIVE INSERT policy (default behavior)
CREATE POLICY "Teachers and admins can create courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);