import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Eye, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
}

interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  created_at: string;
  content_type: string;
  views?: number;
  likes?: number;
  comments?: number;
}

const UserPublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        toast.error("İstifadəçi tapılmadı");
        navigate("/");
        return;
      }

      setProfile(profileData);

      const { data: storiesData } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (storiesData) {
        const storiesWithStats = await Promise.all(
          storiesData.map(async (story) => {
            const { count: viewCount } = await supabase
              .from("story_views")
              .select("*", { count: "exact", head: true })
              .eq("story_id", story.id);

            const { count: likeCount } = await supabase
              .from("story_likes")
              .select("*", { count: "exact", head: true })
              .eq("story_id", story.id);

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
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">İstifadəçi tapılmadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>

        <div className="flex flex-col items-center gap-4 mb-8">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Postlar</h2>
          {stories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Hələ ki post yoxdur
            </p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="cursor-pointer hover:shadow-inkora transition-inkora"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                {story.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{story.title}</h3>
                  {story.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {story.description}
                    </p>
                  )}
                  {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {story.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-secondary px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {story.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {story.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {story.comments || 0}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserPublicProfile;
