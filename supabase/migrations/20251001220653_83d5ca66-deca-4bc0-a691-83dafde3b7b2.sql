-- Create story interactions tables
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapter interactions tables
CREATE TABLE public.chapter_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chapter_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chapter_id, user_id)
);

CREATE TABLE public.chapter_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_views
CREATE POLICY "Anyone can view story views" ON public.story_views FOR SELECT USING (true);
CREATE POLICY "Anyone can create story views" ON public.story_views FOR INSERT WITH CHECK (true);

-- RLS Policies for story_likes
CREATE POLICY "Anyone can view story likes" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own story likes" ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own story likes" ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for story_comments
CREATE POLICY "Anyone can view story comments" ON public.story_comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own story comments" ON public.story_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own story comments" ON public.story_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own story comments" ON public.story_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chapter_views
CREATE POLICY "Anyone can view chapter views" ON public.chapter_views FOR SELECT USING (true);
CREATE POLICY "Anyone can create chapter views" ON public.chapter_views FOR INSERT WITH CHECK (true);

-- RLS Policies for chapter_likes
CREATE POLICY "Anyone can view chapter likes" ON public.chapter_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own chapter likes" ON public.chapter_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapter likes" ON public.chapter_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chapter_comments
CREATE POLICY "Anyone can view chapter comments" ON public.chapter_comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own chapter comments" ON public.chapter_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chapter comments" ON public.chapter_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chapter comments" ON public.chapter_comments FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_story_comments_updated_at
BEFORE UPDATE ON public.story_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapter_comments_updated_at
BEFORE UPDATE ON public.chapter_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();