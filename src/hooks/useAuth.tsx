import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  institution: string | null;
}

interface UserRole {
  role: "admin" | "teacher" | "student";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, institution: string, role: "student" | "teacher") => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesData) {
      setRoles(rolesData as UserRole[]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    institution: string,
    role: "student" | "teacher"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName,
          last_name: lastName,
          institution,
          requested_role: role,
        },
      },
    });

    if (error) throw error;

    // Wait for profile to be created by trigger, then update it
    if (data.user) {
      // Poll for profile creation (trigger is async)
      let attempts = 0;
      let profileData = null;
      
      while (attempts < 10 && !profileData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        profileData = profile;
        attempts++;
      }

      if (profileData) {
        // Update profile with institution
        await supabase
          .from("profiles")
          .update({ institution })
          .eq("id", profileData.id);

        // Add teacher role if selected (update existing student role)
        if (role === "teacher") {
          await supabase
            .from("user_roles")
            .update({ role: "teacher" })
            .eq("user_id", data.user.id);
        }
      }
    }

    toast.success("Registrasi berhasil! Silakan login.");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    toast.success("Login berhasil!");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success("Logout berhasil!");
  };

  const isAdmin = roles.some((r) => r.role === "admin");
  const isTeacher = roles.some((r) => r.role === "teacher");
  const isStudent = roles.some((r) => r.role === "student");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
        isTeacher,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
