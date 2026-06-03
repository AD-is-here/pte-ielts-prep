-- Supabase DB Schema Setup Reference for PTE & IELTS Prep Portal

-- 1. Create Profiles Table (links to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    preferred_exam TEXT DEFAULT 'PTE', -- 'PTE' or 'IELTS'
    target_score NUMERIC DEFAULT 79.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, preferred_exam, target_score)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        'PTE',
        79.0
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create Test Sessions Table
CREATE TABLE public.test_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    exam_type TEXT NOT NULL, -- 'PTE' or 'IELTS'
    section TEXT NOT NULL, -- 'speaking', 'writing', 'reading', 'listening'
    status TEXT DEFAULT 'completed' NOT NULL, -- 'in_progress', 'completed'
    overall_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Test Sessions
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own sessions" 
    ON public.test_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own sessions" 
    ON public.test_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own sessions" 
    ON public.test_sessions FOR UPDATE USING (auth.uid() = user_id);


-- 3. Create Test Responses Table (stores answers & AI grading)
CREATE TABLE public.test_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE NOT NULL,
    question_type TEXT NOT NULL, -- 'Read Aloud', 'Describe Image', 'Essay', etc.
    question_prompt TEXT NOT NULL,
    user_text_response TEXT,
    user_audio_url TEXT, -- storage URL for speaking
    ai_evaluation JSONB, -- stores grading, highlighted mistakes, vocabulary improvements
    score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Test Responses
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view responses of their sessions" 
    ON public.test_responses FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.test_sessions 
            WHERE public.test_sessions.id = public.test_responses.session_id 
            AND public.test_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow users to insert responses to their sessions" 
    ON public.test_responses FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.test_sessions 
            WHERE public.test_sessions.id = public.test_responses.session_id 
            AND public.test_sessions.user_id = auth.uid()
        )
    );


-- 4. Create Vocabulary Deck Table (SRS-friendly tracker)
CREATE TABLE public.vocabulary_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    definition TEXT,
    example_sentence TEXT,
    mastery_level INT DEFAULT 1 NOT NULL, -- 1 to 5
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, word)
);

-- Enable RLS on Vocabulary Deck
ALTER TABLE public.vocabulary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own vocabulary" 
    ON public.vocabulary_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to manage their own vocabulary" 
    ON public.vocabulary_items FOR ALL USING (auth.uid() = user_id);


-- Create performance indexes
CREATE INDEX idx_sessions_user ON public.test_sessions(user_id);
CREATE INDEX idx_responses_session ON public.test_responses(session_id);
CREATE INDEX idx_vocab_user ON public.vocabulary_items(user_id);
CREATE INDEX idx_vocab_review ON public.vocabulary_items(next_review_at);
