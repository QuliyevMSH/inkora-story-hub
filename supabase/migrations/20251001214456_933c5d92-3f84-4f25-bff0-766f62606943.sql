-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  tags TEXT[],
  is_chapters BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, chapter_number)
);

-- Create single_stories table for non-chapter stories
CREATE TABLE public.single_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.single_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Stories are viewable by everyone" 
ON public.stories 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for chapters
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create chapters for their own stories" 
ON public.chapters 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update chapters for their own stories" 
ON public.chapters 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete chapters for their own stories" 
ON public.chapters 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

-- RLS Policies for single_stories
CREATE POLICY "Single stories are viewable by everyone" 
ON public.single_stories 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create single stories for their own stories" 
ON public.single_stories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update single stories for their own stories" 
ON public.single_stories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete single stories for their own stories" 
ON public.single_stories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_id 
    AND stories.user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_single_stories_updated_at
BEFORE UPDATE ON public.single_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for story cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-covers', 'story-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for story covers
CREATE POLICY "Story cover images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'story-covers');

CREATE POLICY "Users can upload their own story covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'story-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own story covers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'story-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own story covers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'story-covers' AND auth.uid()::text = (storage.foldername(name))[1]);