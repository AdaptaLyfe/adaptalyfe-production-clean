CREATE TABLE IF NOT EXISTS public.user_achievements (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id),
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  earned_at timestamp DEFAULT now(),
  category text NOT NULL,
  points integer DEFAULT 0,
  level integer DEFAULT 1
);