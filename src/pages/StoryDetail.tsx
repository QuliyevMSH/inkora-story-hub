import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PenLine, ArrowLeft } from "lucide-react";

interface Story {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  is_chapters: boolean;
  status: string;
  created_at: string;
}

const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Hekayə tapılmadı");
      navigate("/profile");
      return;
    }

    if (data) {
      setStory(data);
      setIsOwner(user?.id === data.user_id);
    }

    setLoading(false);
  };

  const handleStartWriting = () => {
    navigate(`/story/${id}/write`);
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

  if (!story) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Hekayə tapılmadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Profilə qayıt
        </Button>

        <Card className="shadow-inkora-lg">
          <CardHeader>
            <CardTitle className="text-3xl">{story.title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {story.cover_image_url && (
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={story.cover_image_url}
                  alt={story.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {story.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Açıqlama</h3>
                <p className="text-muted-foreground">{story.description}</p>
              </div>
            )}

            {story.tags && story.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tağlar</h3>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isOwner && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleStartWriting}
                  className="w-full gap-2"
                  size="lg"
                >
                  <PenLine className="h-5 w-5" />
                  Hekayəni yazmağa başla
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoryDetail;
