import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { profile, user, isTeacher, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    institution: profile?.institution || "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    exam: true,
    assignment: true,
    announcement: false,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.id) throw new Error("Profile not found");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          institution: data.institution,
        })
        .eq("id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profil berhasil diperbarui!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal memperbarui profil");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const getRoleBadge = () => {
    if (isAdmin) return "Admin";
    if (isTeacher) return "Dosen/Guru";
    return "Mahasiswa";
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola profil dan preferensi akun Anda
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profil</CardTitle>
                  <CardDescription>Informasi dasar akun Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {formData.first_name?.[0]}
                      {formData.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <Button variant="outline" type="button">
                      <Camera className="w-4 h-4 mr-2" />
                      Ubah Foto
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG max. 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nama Depan</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nama Belakang</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email tidak dapat diubah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution">Institusi</Label>
                  <Input
                    id="institution"
                    placeholder="Nama universitas atau sekolah"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {getRoleBadge()}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Notifikasi</CardTitle>
                  <CardDescription>
                    Atur preferensi notifikasi Anda
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Notifikasi Email</p>
                  <p className="text-sm text-muted-foreground">
                    Terima notifikasi melalui email
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pengingat Ujian</p>
                  <p className="text-sm text-muted-foreground">
                    Ingatkan sebelum ujian dimulai
                  </p>
                </div>
                <Switch
                  checked={notifications.exam}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, exam: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Deadline Tugas</p>
                  <p className="text-sm text-muted-foreground">
                    Ingatkan sebelum deadline tugas
                  </p>
                </div>
                <Switch
                  checked={notifications.assignment}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, assignment: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pengumuman</p>
                  <p className="text-sm text-muted-foreground">
                    Terima pengumuman dari admin
                  </p>
                </div>
                <Switch
                  checked={notifications.announcement}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, announcement: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Keamanan</CardTitle>
                  <CardDescription>
                    Kelola keamanan akun Anda
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Ubah Password</p>
                  <p className="text-sm text-muted-foreground">
                    Ganti password akun Anda
                  </p>
                </div>
                <Button variant="outline">Ubah Password</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-destructive">
                    Hapus Akun
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hapus akun secara permanen
                  </p>
                </div>
                <Button variant="destructive">Hapus Akun</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
