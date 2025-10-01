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
import { ArrowLeft, Save, Upload } from "lucide-react";

const SingleStoryEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Giriş etməlisiniz");
      navigate("/auth");
      return;
    }

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

    setTitle(story.title);
    setDescription(story.description || "");
    setTags(story.tags ? story.tags.join(", ") : "");
    setCurrentCoverUrl(story.cover_image_url);

    const { data: singleStory } = await supabase
      .from("single_stories")
      .select("content")
      .eq("story_id", id)
      .single();

    if (singleStory) {
      setContent(singleStory.content);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Başlıq və məzmun tələb olunur");
      return;
    }

    setSaving(true);

    let coverImageUrl = currentCoverUrl;

    if (coverImage) {
      const fileExt = coverImage.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("story-covers")
        .upload(filePath, coverImage);

      if (uploadError) {
        toast.error("Şəkil yüklənərkən xəta baş verdi");
        setSaving(false);
        return;
      }

      const { data } = supabase.storage.from("story-covers").getPublicUrl(filePath);
      coverImageUrl = data.publicUrl;
    }

    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const { error: storyError } = await supabase
      .from("stories")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        cover_image_url: coverImageUrl,
      })
      .eq("id", id);

    if (storyError) {
      toast.error("Saxlanılarkən xəta baş verdi");
      setSaving(false);
      return;
    }

    const { error: contentError } = await supabase
      .from("single_stories")
      .update({ content: content.trim() })
      .eq("story_id", id);

    if (contentError) {
      toast.error("Məzmun saxlanılarkən xəta baş verdi");
      setSaving(false);
      return;
    }

    toast.success("Uğurla saxlanıldı!");
    navigate(`/story/${id}`);
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
            <CardTitle className="text-3xl">Hekayəni redaktə et</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Başlıq *</Label>
              <Input
                id="title"
                placeholder="Hekayənizin başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıqlama</Label>
              <Textarea
                id="description"
                placeholder="Hekayəniz haqqında qısa açıqlama"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Teqlər (vergüllə ayırın)</Label>
              <Input
                id="tags"
                placeholder="məsələn: macəra, fantastika, dram"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Üz şəkli</Label>
              {currentCoverUrl && (
                <div className="mb-2">
                  <img
                    src={currentCoverUrl}
                    alt="Cover"
                    className="w-48 h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Hekayə məzmunu *</Label>
              <Textarea
                id="content"
                placeholder="Hekayənizi buraya yazın..."
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

export default SingleStoryEdit;
