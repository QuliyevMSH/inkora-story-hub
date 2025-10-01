-- Link comments to profiles so nested selects work
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_story_comments_user_id_profiles_id'
  ) THEN
    ALTER TABLE public.story_comments
      ADD CONSTRAINT fk_story_comments_user_id_profiles_id
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chapter_comments_user_id_profiles_id'
  ) THEN
    ALTER TABLE public.chapter_comments
      ADD CONSTRAINT fk_chapter_comments_user_id_profiles_id
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;