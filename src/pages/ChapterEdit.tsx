import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const ChapterEdit = () => {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    if (!chapterId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Giriş etməlisiniz");
      navigate("/auth");
      return;
    }

    const { data: chapter, error } = await supabase
      .from("chapters")
      .select("*, stories!inner(user_id)")
      .eq("id", chapterId)
      .single();

    if (error || !chapter) {
      toast.error("Bölüm tapılmadı");
      navigate(`/story/${storyId}`);
      return;
    }

    if (chapter.stories.user_id !== user.id) {
      toast.error("Bu bölümü redaktə etmək icazəniz yoxdur");
      navigate(`/story/${storyId}`);
      return;
    }

    setTitle(chapter.title);
    setContent(chapter.content);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Başlıq və məzmun tələb olunur");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("chapters")
      .update({
        title: title.trim(),
        content: content.trim(),
      })
      .eq("id", chapterId);

    if (error) {
      toast.error("Saxlanılarkən xəta baş verdi");
      setSaving(false);
      return;
    }

    toast.success("Uğurla saxlanıldı!");
    navigate(`/story/${storyId}/chapter/${chapterId}`);
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
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/story/${storyId}/chapter/${chapterId}`)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri qayıt
        </Button>

        <Card className="shadow-inkora-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Bölümü redaktə et</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Bölümün adı *</Label>
              <Input
                id="title"
                placeholder="Bölümün adı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Bölüm məzmunu *</Label>
              <Textarea
                id="content"
                placeholder="Bölümün məzmunu..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="resize-none font-serif text-base"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saxlanılır..." : "Yadda saxla"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChapterEdit;
