import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PenLine, ArrowLeft, Eye, Heart, MessageCircle, MoreVertical, Trash, ThumbsUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

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
  content_type: string;
}

interface Chapter {
  id: string;
  title: string;
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
  likes?: number;
  isLiked?: boolean;
}

const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [singleStoryContent, setSingleStoryContent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "most-liked">("newest");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const commentsPerPage = 5;

  useEffect(() => {
    fetchStory();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

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

      // Track view
      if (user) {
        await supabase.from("story_views").insert({
          story_id: id,
          user_id: user.id,
        });
      }

      // Fetch chapters if story has chapters
      if (data.is_chapters) {
        const { data: chaptersData } = await supabase
          .from("chapters")
          .select("id, title, chapter_number")
          .eq("story_id", id)
          .order("chapter_number", { ascending: true });

        if (chaptersData) {
          setChapters(chaptersData);
        }

        // For chapter-based stories, calculate total stats from all chapters
        const { data: allChapters } = await supabase
          .from("chapters")
          .select("id")
          .eq("story_id", id);

        if (allChapters && allChapters.length > 0) {
          const chapterIds = allChapters.map((ch) => ch.id);

          const { count: viewCount } = await supabase
            .from("chapter_views")
            .select("*", { count: "exact", head: true })
            .in("chapter_id", chapterIds);

          const { count: likeCount } = await supabase
            .from("chapter_likes")
            .select("*", { count: "exact", head: true })
            .in("chapter_id", chapterIds);

          const { count: commentCount } = await supabase
            .from("chapter_comments")
            .select("*", { count: "exact", head: true })
            .in("chapter_id", chapterIds);

          setStats({
            views: viewCount || 0,
            likes: likeCount || 0,
            comments: commentCount || 0,
          });
        }
      } else {
        // For single stories, get story-level stats
        const { count: viewCount } = await supabase
          .from("story_views")
          .select("*", { count: "exact", head: true })
          .eq("story_id", id);

        const { count: likeCount } = await supabase
          .from("story_likes")
          .select("*", { count: "exact", head: true })
          .eq("story_id", id);

        const { count: commentCount } = await supabase
          .from("story_comments")
          .select("*", { count: "exact", head: true })
          .eq("story_id", id);

        setStats({
          views: viewCount || 0,
          likes: likeCount || 0,
          comments: commentCount || 0,
        });

        // Check if user liked
        if (user) {
          const { data: likeData } = await supabase
            .from("story_likes")
            .select("*")
            .eq("story_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

          setIsLiked(!!likeData);
        }

        // Fetch story comments (for single stories)
        const { data: commentsData } = await supabase
          .from("story_comments")
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              username,
              avatar_url
            )
          `)
          .eq("story_id", id)
          .order("created_at", { ascending: false });

        if (commentsData && user) {
          const commentsWithLikes = await Promise.all(
            commentsData.map(async (comment) => {
              const { count: likesCount } = await supabase
                .from("story_comment_likes")
                .select("*", { count: "exact", head: true })
                .eq("comment_id", comment.id);

              const { data: userLike } = await supabase
                .from("story_comment_likes")
                .select("*")
                .eq("comment_id", comment.id)
                .eq("user_id", user.id)
                .maybeSingle();

              return {
                ...comment,
                likes: likesCount || 0,
                isLiked: !!userLike,
              };
            })
          );
          setComments(commentsWithLikes as any);
        } else if (commentsData) {
          const commentsWithLikes = await Promise.all(
            commentsData.map(async (comment) => {
              const { count: likesCount } = await supabase
                .from("story_comment_likes")
                .select("*", { count: "exact", head: true })
                .eq("comment_id", comment.id);

              return {
                ...comment,
                likes: likesCount || 0,
                isLiked: false,
              };
            })
          );
          setComments(commentsWithLikes as any);
        }
      }

      // For chapter-based stories, fetch story-level comments separately
      if (data.is_chapters) {
        const { data: storyCommentsData } = await supabase
          .from("story_comments")
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              username,
              avatar_url
            )
          `)
          .eq("story_id", id)
          .order("created_at", { ascending: false });

        if (storyCommentsData && user) {
          const commentsWithLikes = await Promise.all(
            storyCommentsData.map(async (comment) => {
              const { count: likesCount } = await supabase
                .from("story_comment_likes")
                .select("*", { count: "exact", head: true })
                .eq("comment_id", comment.id);

              const { data: userLike } = await supabase
                .from("story_comment_likes")
                .select("*")
                .eq("comment_id", comment.id)
                .eq("user_id", user.id)
                .maybeSingle();

              return {
                ...comment,
                likes: likesCount || 0,
                isLiked: !!userLike,
              };
            })
          );
          setComments(commentsWithLikes as any);
        } else if (storyCommentsData) {
          const commentsWithLikes = await Promise.all(
            storyCommentsData.map(async (comment) => {
              const { count: likesCount } = await supabase
                .from("story_comment_likes")
                .select("*", { count: "exact", head: true })
                .eq("comment_id", comment.id);

              return {
                ...comment,
                likes: likesCount || 0,
                isLiked: false,
              };
            })
          );
          setComments(commentsWithLikes as any);
        }
      }

      // Fetch single story content if not chapters
      if (!data.is_chapters) {
        const { data: singleStory } = await supabase
          .from("single_stories")
          .select("content")
          .eq("story_id", id)
          .maybeSingle();

        if (singleStory) {
          setSingleStoryContent(singleStory.content);
        }
      }
    }

    setLoading(false);
  };

  const handleEdit = () => {
    if (story?.is_chapters) {
      navigate(`/story/${id}/edit-metadata`);
    } else {
      navigate(`/story/${id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      // Delete associated records first
      if (story?.is_chapters) {
        // Delete chapter-related data
        const { data: chapters } = await supabase
          .from("chapters")
          .select("id")
          .eq("story_id", id);

        if (chapters) {
          const chapterIds = chapters.map((c) => c.id);

          await supabase.from("chapter_comments").delete().in("chapter_id", chapterIds);
          await supabase.from("chapter_likes").delete().in("chapter_id", chapterIds);
          await supabase.from("chapter_views").delete().in("chapter_id", chapterIds);
          await supabase.from("chapters").delete().eq("story_id", id);
        }
      } else {
        // Delete single story data
        await supabase.from("single_stories").delete().eq("story_id", id);
      }

      // Delete story-level data
      await supabase.from("story_comments").delete().eq("story_id", id);
      await supabase.from("story_likes").delete().eq("story_id", id);
      await supabase.from("story_views").delete().eq("story_id", id);

      // Finally delete the story itself
      const { error } = await supabase.from("stories").delete().eq("id", id);

      if (error) throw error;

      toast.success("Post uğurla silindi");
      navigate("/profile");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Post silinərkən xəta baş verdi");
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Bəyənmək üçün daxil olun");
      return;
    }

    if (story?.is_chapters) {
      toast.info("Bölümləri bəyənə bilərsiniz");
      return;
    }

    if (isLiked) {
      await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", id)
        .eq("user_id", user.id);
      setIsLiked(false);
      setStats({ ...stats, likes: stats.likes - 1 });
    } else {
      await supabase.from("story_likes").insert({
        story_id: id,
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

    const { error } = await supabase.from("story_comments").insert({
      story_id: id,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      toast.error("Şərh əlavə edilərkən xəta baş verdi");
      return;
    }

    setNewComment("");
    toast.success("Şərh əlavə edildi");
    fetchStory();
  };

  const handleCommentLike = async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Bəyənmək üçün daxil olun");
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    if (comment.isLiked) {
      await supabase
        .from("story_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      setComments(
        comments.map((c) =>
          c.id === commentId
            ? { ...c, likes: (c.likes || 0) - 1, isLiked: false }
            : c
        )
      );
    } else {
      await supabase.from("story_comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      });

      setComments(
        comments.map((c) =>
          c.id === commentId
            ? { ...c, likes: (c.likes || 0) + 1, isLiked: true }
            : c
        )
      );
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "most-liked") {
      return (b.likes || 0) - (a.likes || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("story_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Şərh silinərkən xəta baş verdi");
      return;
    }

    toast.success("Şərh silindi");
    fetchStory();
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      toast.error("Şərh boş ola bilməz");
      return;
    }

    const { error } = await supabase
      .from("story_comments")
      .update({ content: editingCommentText })
      .eq("id", commentId);

    if (error) {
      toast.error("Şərh yenilənərkən xəta baş verdi");
      return;
    }

    setEditingCommentId(null);
    setEditingCommentText("");
    toast.success("Şərh yeniləndi");
    fetchStory();
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
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
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu postu silmək istədiyinizə əminsiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu əməliyyat geri alına bilməz. Post və bütün əlaqəli məlumatlar silinəcək.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Profilə qayıt
        </Button>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mb-4 float-right"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <PenLine className="mr-2 h-4 w-4" />
                Redaktə et
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteAlert(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Card className="shadow-inkora-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {story.cover_image_url && (
                <div className="md:w-64 flex-shrink-0">
                  <img
                    src={story.cover_image_url}
                    alt={story.title}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex-1 space-y-4">
                <h1 className="text-3xl font-bold">{story.title}</h1>

                {story.description && (
                  <p className="text-muted-foreground">{story.description}</p>
                )}

                {story.tags && story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span>{stats.views}</span>
                  </div>
                  
                  {!story.is_chapters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{stats.likes}</span>
                    </Button>
                  )}

                  {story.is_chapters && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <span>{stats.likes}</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="gap-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{stats.comments}</span>
                  </Button>
                </div>
              </div>
            </div>

            {showComments && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">
                      {story.is_chapters ? "Hekayə haqqında şərhlər" : "Şərhlər"}
                    </h3>
                    <Select value={sortBy} onValueChange={(value: "newest" | "most-liked") => setSortBy(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Ən yeni</SelectItem>
                        <SelectItem value="most-liked">Ən çox bəyənilən</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                    {sortedComments
                      .slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage)
                      .map((comment) => {
                        const isCommentOwner = currentUserId && comment.user_id === currentUserId;
                        const isStoryOwner = story && currentUserId && story.user_id === currentUserId;
                        const canModify = isCommentOwner || isStoryOwner;

                        return (
                          <Card key={comment.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar 
                                  className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => navigate(`/user/${comment.user_id}`)}
                                >
                                  <AvatarImage src={comment.profiles.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {comment.profiles.first_name?.[0]}{comment.profiles.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p 
                                        className="font-semibold cursor-pointer hover:underline"
                                        onClick={() => navigate(`/user/${comment.user_id}`)}
                                      >
                                        {comment.profiles.first_name} {comment.profiles.last_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        @{comment.profiles.username}
                                      </p>
                                    </div>
                                    {canModify && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {isCommentOwner && (
                                            <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                              <PenLine className="mr-2 h-4 w-4" />
                                              Redaktə et
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem 
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Sil
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                  
                                  {editingCommentId === comment.id ? (
                                    <div className="mt-2 space-y-2">
                                      <Input
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        className="w-full"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                          Yadda saxla
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                          Ləğv et
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="mt-2">{comment.content}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(comment.created_at).toLocaleDateString("az-AZ")} • {new Date(comment.created_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCommentLike(comment.id)}
                                      className={`gap-1 h-8 ${comment.isLiked ? "text-primary" : ""}`}
                                    >
                                      <ThumbsUp className={`h-4 w-4 ${comment.isLiked ? "fill-current" : ""}`} />
                                      <span className="text-xs">{comment.likes || 0}</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
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

            {!story.is_chapters && singleStoryContent && singleStoryContent.trim() && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{story.content_type === 'şeir' ? 'Şeir' : 'Hekayə'}</h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="whitespace-pre-wrap">{singleStoryContent}</p>
                  </div>
                  <Button onClick={() => navigate(`/story/${id}/read`)}>
                    Hamısını oxu
                  </Button>
                </div>
              </>
            )}

            {story.is_chapters && chapters.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Bölümlər</h3>
                  <div className="grid gap-3">
                    {chapters.map((chapter) => (
                      <Card
                        key={chapter.id}
                        className="cursor-pointer hover:shadow-inkora transition-inkora"
                        onClick={() => navigate(`/story/${id}/chapter/${chapter.id}`)}
                      >
                        <CardContent className="p-4">
                          <p className="font-semibold">
                            Bölüm {chapter.chapter_number}: {chapter.title}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoryDetail;
