import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Upload, BookOpen, FileText, Eye, Heart, MessageCircle } from "lucide-react";

interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  created_at: string;
  status: string;
  views?: number;
  likes?: number;
  comments?: number;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Profil məlumatları yüklənərkən xəta baş verdi");
      setLoading(false);
      return;
    }

    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        username: data.username || "",
        email: data.email || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
      });
    }

    // Fetch user's stories with stats
    const { data: storiesData, error: storiesError } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (storiesError) {
      toast.error("Hekayələr yüklənərkən xəta baş verdi");
    } else if (storiesData) {
      // Fetch stats for each story
      const storiesWithStats = await Promise.all(
        storiesData.map(async (story) => {
          // Get view count
          const { count: viewCount } = await supabase
            .from("story_views")
            .select("*", { count: "exact", head: true })
            .eq("story_id", story.id);

          // Get like count
          const { count: likeCount } = await supabase
            .from("story_likes")
            .select("*", { count: "exact", head: true })
            .eq("story_id", story.id);

          // Get comment count
          const { count: commentCount } = await supabase
            .from("story_comments")
            .select("*", { count: "exact", head: true })
            .eq("story_id", story.id);

          return {
            ...story,
            views: viewCount || 0,
            likes: likeCount || 0,
            comments: commentCount || 0,
          };
        })
      );
      setStories(storiesWithStats);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Profil yenilənərkən xəta baş verdi");
      return;
    }

    toast.success("Profil uğurla yeniləndi");
    setEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Şəkil yüklənərkən xəta baş verdi");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setProfile({ ...profile, avatar_url: data.publicUrl });
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Profil şəkli yenilənərkən xəta baş verdi");
    } else {
      toast.success("Profil şəkli yükləndi");
    }

    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-4xl">
        <Card className="shadow-inkora-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold text-secondary">
                Mənim Profilim
              </CardTitle>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Redaktə et
                </Button>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                {editing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-inkora"
                  >
                    <Upload className="h-4 w-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder="Ad"
                      />
                      <Input
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder="Soyad"
                      />
                    </div>
                    <Input
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="@istifadəçiadı"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-foreground">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Haqqımda</h3>
              {editing ? (
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Özünüz haqqında bir şeylər yazın..."
                  className="min-h-[120px]"
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile.bio || "Hələ heç nə yazılmayıb"}
                </p>
              )}
            </div>

            {editing && (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    checkUser();
                  }}
                >
                  Ləğv et
                </Button>
                <Button onClick={handleSave}>
                  Yadda saxla
                </Button>
              </div>
            )}

            <Tabs defaultValue="posts" className="mt-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Postlarım
                </TabsTrigger>
                <TabsTrigger value="reading" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Oxuma siyahım
                </TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="mt-6">
                {stories.length > 0 ? (
                  <div className="grid gap-4">
                    {stories.map((story) => (
                      <Card
                        key={story.id}
                        className="cursor-pointer hover:shadow-inkora transition-inkora"
                        onClick={() => navigate(`/story/${story.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {story.cover_image_url && (
                              <img
                                src={story.cover_image_url}
                                alt={story.title}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                              {story.description && (
                                <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                  {story.description}
                                </p>
                              )}
                              {story.tags && story.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {story.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{story.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{story.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{story.comments || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Hələ heç bir hekayə yoxdur</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="reading" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Oxuma siyahınız boşdur</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
