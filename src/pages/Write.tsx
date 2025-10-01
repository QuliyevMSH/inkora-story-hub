import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Write = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Başlıq tələb olunur");
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Giriş etməlisiniz");
      navigate("/auth");
      return;
    }

    let coverImageUrl = "";

    // Upload cover image if exists
    if (coverImageFile) {
      const fileExt = coverImageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("story-covers")
        .upload(filePath, coverImageFile);

      if (uploadError) {
        toast.error("Şəkil yüklənərkən xəta baş verdi");
        setSubmitting(false);
        return;
      }

      const { data } = supabase.storage.from("story-covers").getPublicUrl(filePath);
      coverImageUrl = data.publicUrl;
    }

    // Insert story
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: coverImageUrl || null,
        tags: tags.length > 0 ? tags : null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      toast.error("Hekayə yaradılarkən xəta baş verdi");
      setSubmitting(false);
      return;
    }

    toast.success("Hekayə uğurla yaradıldı!");
    navigate(`/story/${story.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="shadow-inkora-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Yeni Hekayə Yaz</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="cover-image">Üz Qapağı (İstəyə bağlı)</Label>
              {coverImagePreview ? (
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <img
                    src={coverImagePreview}
                    alt="Cover"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setCoverImagePreview("");
                      setCoverImageFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="cover-image"
                  className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-inkora hover:bg-muted/40"
                >
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Şəkil yükləmək üçün klikləyin
                    </p>
                  </div>
                  <input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Başlıq</Label>
              <Input
                id="title"
                placeholder="Hekayənizin başlığını yazın..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tağlar</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Tağ əlavə edin (məs: fantastika)"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag}>
                  Əlavə et
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pl-3 pr-1"
                    >
                      #{tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Açıqlama (İstəyə bağlı)</Label>
              <Textarea
                id="description"
                placeholder="Hekayəniz haqqında qısa məlumat..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={submitting}
              >
                Ləğv et
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Yüklənir..." : "Hekayə Yarat"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Write;
