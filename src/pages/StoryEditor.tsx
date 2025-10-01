import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const StoryEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storyType, setStoryType] = useState<"single" | "chapters">("single");
  const [singleContent, setSingleContent] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [isChapters, setIsChapters] = useState(false);

  useEffect(() => {
    checkStoryAndContent();
  }, [id]);

  const checkStoryAndContent = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Giriş etməlisiniz");
      navigate("/auth");
      return;
    }

    // Fetch story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", id)
      .single();

    if (storyError || !story) {
      toast.error("Hekayə tapılmadı");
      navigate("/profile");
      return;
    }

    if (story.user_id !== user.id) {
      toast.error("Bu hekayəni redaktə etmək icazəniz yoxdur");
      navigate("/profile");
      return;
    }

    setIsChapters(story.is_chapters);
    setStoryType(story.is_chapters ? "chapters" : "single");

    // Check if content already exists
    if (story.is_chapters) {
      const { data: chapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("story_id", id)
        .order("chapter_number", { ascending: true });

      if (chapters && chapters.length > 0) {
        // Load latest chapter
        const lastChapter = chapters[chapters.length - 1];
        setChapterTitle(lastChapter.title);
        setChapterContent(lastChapter.content);
      }
    } else {
      const { data: singleStory } = await supabase
        .from("single_stories")
        .select("*")
        .eq("story_id", id)
        .single();

      if (singleStory) {
        setSingleContent(singleStory.content);
      }
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (storyType === "single" && !singleContent.trim()) {
      toast.error("Hekayə məzmunu tələb olunur");
      return;
    }

    if (storyType === "chapters" && (!chapterTitle.trim() || !chapterContent.trim())) {
      toast.error("Bölüm adı və məzmunu tələb olunur");
      return;
    }

    setSaving(true);

    // Update story type if it changed
    if (storyType === "chapters" && !isChapters) {
      const { error } = await supabase
        .from("stories")
        .update({ is_chapters: true })
        .eq("id", id);

      if (error) {
        toast.error("Xəta baş verdi");
        setSaving(false);
        return;
      }
    } else if (storyType === "single" && isChapters) {
      const { error } = await supabase
        .from("stories")
        .update({ is_chapters: false })
        .eq("id", id);

      if (error) {
        toast.error("Xəta baş verdi");
        setSaving(false);
        return;
      }
    }

    if (storyType === "single") {
      // Check if single story exists
      const { data: existing } = await supabase
        .from("single_stories")
        .select("id")
        .eq("story_id", id)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("single_stories")
          .update({ content: singleContent.trim() })
          .eq("story_id", id);

        if (error) {
          toast.error("Saxlanılarkən xəta baş verdi");
          setSaving(false);
          return;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from("single_stories")
          .insert({
            story_id: id,
            content: singleContent.trim(),
          });

        if (error) {
          toast.error("Saxlanılarkən xəta baş verdi");
          setSaving(false);
          return;
        }
      }
    } else {
      // Save chapter
      const { data: chapters } = await supabase
        .from("chapters")
        .select("chapter_number")
        .eq("story_id", id)
        .order("chapter_number", { ascending: false })
        .limit(1);

      const nextChapterNumber = chapters && chapters.length > 0 ? chapters[0].chapter_number + 1 : 1;

      const { error } = await supabase
        .from("chapters")
        .insert({
          story_id: id,
          chapter_number: nextChapterNumber,
          title: chapterTitle.trim(),
          content: chapterContent.trim(),
        });

      if (error) {
        toast.error("Bölüm saxlanılarkən xəta baş verdi");
        setSaving(false);
        return;
      }

      // Clear chapter fields after successful save
      setChapterTitle("");
      setChapterContent("");
    }

    toast.success("Uğurla saxlanıldı!");
    setSaving(false);
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
          onClick={() => navigate(`/story/${id}`)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri qayıt
        </Button>

        <Card className="shadow-inkora-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Hekayə Yaz</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Story Type Selection */}
            <div className="space-y-3">
              <Label>Hekayə növü</Label>
              <RadioGroup
                value={storyType}
                onValueChange={(value) => setStoryType(value as "single" | "chapters")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="cursor-pointer">
                    Hekayə təkdir
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chapters" id="chapters" />
                  <Label htmlFor="chapters" className="cursor-pointer">
                    Hekayə bölümlərlədir
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Single Story Editor */}
            {storyType === "single" && (
              <div className="space-y-2">
                <Label htmlFor="content">Hekayə məzmunu</Label>
                <Textarea
                  id="content"
                  placeholder="Hekayənizi buraya yazın..."
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  rows={20}
                  className="resize-none font-serif text-base"
                />
              </div>
            )}

            {/* Chapter Editor */}
            {storyType === "chapters" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter-title">Bölümün adı</Label>
                  <Input
                    id="chapter-title"
                    placeholder="Məsələn: Birinci bölüm"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chapter-content">Bölüm məzmunu</Label>
                  <Textarea
                    id="chapter-content"
                    placeholder="Bu bölümün məzmununu yazın..."
                    value={chapterContent}
                    onChange={(e) => setChapterContent(e.target.value)}
                    rows={20}
                    className="resize-none font-serif text-base"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
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

export default StoryEditor;
