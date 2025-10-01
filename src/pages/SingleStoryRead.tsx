import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, PenLine } from "lucide-react";

interface SingleStory {
  id: string;
  story_id: string;
  content: string;
}

const SingleStoryRead = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<SingleStory | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data: storyData } = await supabase
      .from("stories")
      .select("title, user_id")
      .eq("id", id)
      .single();

    if (storyData) {
      setStoryTitle(storyData.title);
      setIsOwner(user?.id === storyData.user_id);
    }

    const { data, error } = await supabase
      .from("single_stories")
      .select("*")
      .eq("story_id", id)
      .single();

    if (error || !data) {
      toast.error("Hekayə tapılmadı");
      navigate(`/story/${id}`);
      return;
    }

    setStory(data);
    setLoading(false);
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

  if (!story) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/story/${id}`)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri qayıt
        </Button>

        {isOwner && (
          <Button
            onClick={() => navigate(`/story/${id}/edit`)}
            className="mb-4 gap-2 float-right"
          >
            <PenLine className="h-4 w-4" />
            Redaktə et
          </Button>
        )}

        <Card className="shadow-inkora-lg">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-6">{storyTitle}</h1>
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap">{story.content}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SingleStoryRead;
