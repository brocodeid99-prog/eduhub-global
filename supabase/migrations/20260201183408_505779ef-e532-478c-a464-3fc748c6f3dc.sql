-- Add DELETE policy for enrollments so teachers can remove students
CREATE POLICY "Course owners can delete enrollments"
ON public.enrollments
FOR DELETE
TO authenticated
USING (
  owns_course(auth.uid(), course_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add INSERT policy for course owners to enroll students
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;

CREATE POLICY "Users can enroll or be enrolled"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Students can enroll themselves
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = enrollments.student_id AND p.user_id = auth.uid()
  ))
  OR
  -- Course owners can enroll any student
  owns_course(auth.uid(), course_id)
  OR
  -- Admins can enroll anyone
  has_role(auth.uid(), 'admin'::app_role)
);