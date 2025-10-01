-- Create story comment likes table
CREATE TABLE IF NOT EXISTS public.story_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.story_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on story_comment_likes
ALTER TABLE public.story_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_comment_likes
CREATE POLICY "Anyone can view story comment likes"
ON public.story_comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own story comment likes"
ON public.story_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story comment likes"
ON public.story_comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create chapter comment likes table
CREATE TABLE IF NOT EXISTS public.chapter_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.chapter_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on chapter_comment_likes
ALTER TABLE public.chapter_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for chapter_comment_likes
CREATE POLICY "Anyone can view chapter comment likes"
ON public.chapter_comment_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own chapter comment likes"
ON public.chapter_comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chapter comment likes"
ON public.chapter_comment_likes
FOR DELETE
USING (auth.uid() = user_id);