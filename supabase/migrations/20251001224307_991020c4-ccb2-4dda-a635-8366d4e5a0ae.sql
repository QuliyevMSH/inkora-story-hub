-- Add content_type and categories to stories table
ALTER TABLE public.stories
ADD COLUMN content_type text NOT NULL DEFAULT 'hekayə',
ADD COLUMN categories text[] NULL;

-- Add check constraint for content_type
ALTER TABLE public.stories
ADD CONSTRAINT stories_content_type_check 
CHECK (content_type IN ('hekayə', 'şeir'));