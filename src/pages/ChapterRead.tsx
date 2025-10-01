import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Heart, MessageCircle, Eye, PenLine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Chapter {
  id: string;
  story_id: string;
  title: string;
  content: string;
  chapter_number: number;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string | null;
  };
}

const ChapterRead = () => {
  const { storyId, chapterId } = useParams<{ storyId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const commentsPerPage = 10;

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    if (!chapterId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapterId)
      .single();

    if (error || !data) {
      toast.error("Bölüm tapılmadı");
      navigate(`/story/${storyId}`);
      return;
    }

    setChapter(data);

    // Check ownership
    const { data: storyData } = await supabase
      .from("stories")
      .select("user_id")
      .eq("id", data.story_id)
      .single();

    if (storyData && user) {
      setIsOwner(storyData.user_id === user.id);
    }

    // Track view
    if (user) {
      await supabase.from("chapter_views").insert({
        chapter_id: chapterId,
        user_id: user.id,
      });
    }

    // Fetch stats
    const { count: viewCount } = await supabase
      .from("chapter_views")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", chapterId);

    const { count: likeCount } = await supabase
      .from("chapter_likes")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", chapterId);

    const { count: commentCount } = await supabase
      .from("chapter_comments")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", chapterId);

    setStats({
      views: viewCount || 0,
      likes: likeCount || 0,
      comments: commentCount || 0,
    });

    // Check if user liked
    if (user) {
      const { data: likeData } = await supabase
        .from("chapter_likes")
        .select("*")
        .eq("chapter_id", chapterId)
        .eq("user_id", user.id)
        .single();

      setIsLiked(!!likeData);
    }

    // Fetch comments
    const { data: commentsData } = await supabase
      .from("chapter_comments")
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: false });

    if (commentsData) {
      setComments(commentsData as any);
    }

    setLoading(false);
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Bəyənmək üçün daxil olun");
      return;
    }

    if (isLiked) {
      await supabase
        .from("chapter_likes")
        .delete()
        .eq("chapter_id", chapterId)
        .eq("user_id", user.id);
      setIsLiked(false);
      setStats({ ...stats, likes: stats.likes - 1 });
    } else {
      await supabase.from("chapter_likes").insert({
        chapter_id: chapterId,
        user_id: user.id,
      });
      setIsLiked(true);
      setStats({ ...stats, likes: stats.likes + 1 });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Şərh yazmaq üçün daxil olun");
      return;
    }

    const { error } = await supabase.from("chapter_comments").insert({
      chapter_id: chapterId,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast.error("Şərh əlavə edilərkən xəta baş verdi");
      return;
    }

    setNewComment("");
    toast.success("Şərh əlavə edildi");
    fetchChapter();
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

  if (!chapter) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/story/${storyId}`)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Hekayəyə qayıt
        </Button>

        {isOwner && (
          <Button
            onClick={() => navigate(`/story/${storyId}/chapter/${chapterId}/edit`)}
            className="mb-4 gap-2 float-right"
          >
            <PenLine className="h-4 w-4" />
            Bölümü redaktə et
          </Button>
        )}

        <Card className="shadow-inkora-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">
                Bölüm {chapter.chapter_number}: {chapter.title}
              </h1>
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                  <span className="ml-1">{stats.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="ml-1">{stats.comments}</span>
                </Button>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-5 w-5" />
                  <span>{stats.views}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap">{chapter.content}</p>
            </div>

            {showComments && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Şərhlər</h3>
                  
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Şərh yazın..."
                      className="min-h-[100px]"
                    />
                    <Button onClick={handleAddComment}>
                      Şərh əlavə et
                    </Button>
                  </div>

                  <div className="space-y-4 mt-6">
                    {comments
                      .slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage)
                      .map((comment) => (
                        <Card key={comment.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="font-semibold">
                                  {comment.profiles.first_name} {comment.profiles.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  @{comment.profiles.username}
                                </p>
                                <p className="mt-2">{comment.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(comment.created_at).toLocaleDateString("az-AZ")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {comments.length > commentsPerPage && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Əvvəlki
                      </Button>
                      <span className="flex items-center px-4">
                        {currentPage} / {Math.ceil(comments.length / commentsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(comments.length / commentsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(comments.length / commentsPerPage)}
                      >
                        Növbəti
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChapterRead;
