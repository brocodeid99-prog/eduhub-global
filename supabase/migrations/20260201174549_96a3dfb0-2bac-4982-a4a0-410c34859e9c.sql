-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;

-- Create permissive policy for teachers to create courses
CREATE POLICY "Teachers can create courses" 
ON public.courses 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));