-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  institution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  material_type TEXT NOT NULL DEFAULT 'text', -- text, video, pdf, link
  file_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, dropped
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (course_id, student_id)
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL DEFAULT 'quiz', -- quiz, uts, uas
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_score INTEGER NOT NULL DEFAULT 100,
  passing_score INTEGER DEFAULT 60,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT false,
  show_result BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, essay
  options JSONB, -- for multiple choice: [{"id": "a", "text": "Option A"}, ...]
  correct_answer TEXT, -- for multiple choice: "a", for true_false: "true"/"false"
  points INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exam_attempts table
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, graded
  score NUMERIC(5,2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0
);

-- Create student_answers table
CREATE TABLE public.student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer TEXT,
  is_correct BOOLEAN,
  points_earned NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  final_score NUMERIC(5,2),
  grade_letter TEXT, -- A, B, C, D, E
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create progress_tracking table
CREATE TABLE public.progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE (enrollment_id, material_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create helper function to get profile id from auth user
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id
$$;

-- Create helper function to check if user owns course
CREATE OR REPLACE FUNCTION public.owns_course(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON c.owner_id = p.id
    WHERE c.id = _course_id AND p.user_id = _user_id
  )
$$;

-- Create helper function to check if user is enrolled in course
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.course_id = _course_id 
    AND p.user_id = _user_id 
    AND e.status = 'active'
  )
$$;

-- Create helper function to check if user owns exam attempt
CREATE OR REPLACE FUNCTION public.owns_attempt(_user_id UUID, _attempt_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exam_attempts ea
    JOIN public.profiles p ON ea.student_id = p.id
    WHERE ea.id = _attempt_id AND p.user_id = _user_id
  )
$$;

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_answers_updated_at BEFORE UPDATE ON public.student_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Default role is student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT TO authenticated USING (is_published = true OR public.owns_course(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update courses" ON public.courses FOR UPDATE TO authenticated USING (public.owns_course(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.owns_course(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for modules
CREATE POLICY "Enrolled users can view modules" ON public.modules FOR SELECT TO authenticated USING (public.is_enrolled(auth.uid(), course_id) OR public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course owners can manage modules" ON public.modules FOR INSERT TO authenticated WITH CHECK (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course owners can update modules" ON public.modules FOR UPDATE TO authenticated USING (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course owners can delete modules" ON public.modules FOR DELETE TO authenticated USING (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for materials
CREATE POLICY "Enrolled users can view materials" ON public.materials FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.modules m 
    WHERE m.id = materials.module_id 
    AND (public.is_enrolled(auth.uid(), m.course_id) OR public.owns_course(auth.uid(), m.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Course owners can manage materials" ON public.materials FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.modules m 
    WHERE m.id = materials.module_id 
    AND (public.owns_course(auth.uid(), m.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Course owners can update materials" ON public.materials FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.modules m 
    WHERE m.id = materials.module_id 
    AND (public.owns_course(auth.uid(), m.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Course owners can delete materials" ON public.materials FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.modules m 
    WHERE m.id = materials.module_id 
    AND (public.owns_course(auth.uid(), m.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- RLS Policies for enrollments
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = enrollments.student_id AND p.user_id = auth.uid())
  OR public.owns_course(auth.uid(), course_id)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = enrollments.student_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can update own enrollment" ON public.enrollments FOR UPDATE TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = enrollments.student_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for exams
CREATE POLICY "Enrolled users can view exams" ON public.exams FOR SELECT TO authenticated 
USING (
  (is_published = true AND public.is_enrolled(auth.uid(), course_id))
  OR public.owns_course(auth.uid(), course_id)
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Course owners can manage exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course owners can update exams" ON public.exams FOR UPDATE TO authenticated USING (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Course owners can delete exams" ON public.exams FOR DELETE TO authenticated USING (public.owns_course(auth.uid(), course_id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questions
CREATE POLICY "Enrolled users can view questions during exam" ON public.questions FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id 
    AND (
      public.is_enrolled(auth.uid(), e.course_id)
      OR public.owns_course(auth.uid(), e.course_id)
      OR public.has_role(auth.uid(), 'admin')
    )
  )
);
CREATE POLICY "Course owners can manage questions" ON public.questions FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id 
    AND (public.owns_course(auth.uid(), e.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Course owners can update questions" ON public.questions FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id 
    AND (public.owns_course(auth.uid(), e.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Course owners can delete questions" ON public.questions FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = questions.exam_id 
    AND (public.owns_course(auth.uid(), e.course_id) OR public.has_role(auth.uid(), 'admin'))
  )
);

-- RLS Policies for exam_attempts
CREATE POLICY "Users can view own attempts" ON public.exam_attempts FOR SELECT TO authenticated 
USING (
  public.owns_attempt(auth.uid(), id)
  OR EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_attempts.exam_id 
    AND public.owns_course(auth.uid(), e.course_id)
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Students can create attempts" ON public.exam_attempts FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = exam_attempts.student_id AND p.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exams e 
    WHERE e.id = exam_attempts.exam_id 
    AND public.is_enrolled(auth.uid(), e.course_id)
  )
);
CREATE POLICY "Users can update own attempts" ON public.exam_attempts FOR UPDATE TO authenticated 
USING (public.owns_attempt(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_answers
CREATE POLICY "Users can view own answers" ON public.student_answers FOR SELECT TO authenticated 
USING (
  public.owns_attempt(auth.uid(), attempt_id)
  OR EXISTS (
    SELECT 1 FROM public.exam_attempts ea
    JOIN public.exams e ON ea.exam_id = e.id
    WHERE ea.id = student_answers.attempt_id 
    AND public.owns_course(auth.uid(), e.course_id)
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Students can insert own answers" ON public.student_answers FOR INSERT TO authenticated 
WITH CHECK (public.owns_attempt(auth.uid(), attempt_id));
CREATE POLICY "Students can update own answers" ON public.student_answers FOR UPDATE TO authenticated 
USING (public.owns_attempt(auth.uid(), attempt_id));

-- RLS Policies for grades
CREATE POLICY "Users can view own grades" ON public.grades FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.id = grades.enrollment_id AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = grades.enrollment_id AND public.owns_course(auth.uid(), e.course_id)
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Teachers can manage grades" ON public.grades FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = grades.enrollment_id AND public.owns_course(auth.uid(), e.course_id)
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for progress_tracking
CREATE POLICY "Users can view own progress" ON public.progress_tracking FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.id = progress_tracking.enrollment_id AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Students can manage own progress" ON public.progress_tracking FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.id = progress_tracking.enrollment_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Students can update own progress" ON public.progress_tracking FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.profiles p ON e.student_id = p.id
    WHERE e.id = progress_tracking.enrollment_id AND p.user_id = auth.uid()
  )
);