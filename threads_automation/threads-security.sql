-- Threads Automation Security Policies
-- ChoiGPT Corp. Strategic Security Asset

-- 1. Enable RLS for all related tables
ALTER TABLE public.thread_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posting_history ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies
-- Since these are backend-only tables managed by the Service Role, 
-- we restrict ALL access for 'anon' and 'authenticated' roles.
-- Service Role bypasses RLS by default.

-- Optional: Allow Read-Only access for authenticated users (Admin Dashboard future-proofing)
-- For now, we keep it fully locked down for safety.

-- Drop existing if any
DROP POLICY IF EXISTS "Service Role Only" ON public.thread_contents;
DROP POLICY IF EXISTS "Service Role Only" ON public.affiliate_links;
DROP POLICY IF EXISTS "Service Role Only" ON public.topic_rotation;
DROP POLICY IF EXISTS "Service Role Only" ON public.posting_history;

-- Create restrictive policies (though Service Role bypasses them, it's good to be explicit or just leave it as is after ENABLE RLS)
-- Actually, just enabling RLS with no policies denies all anon/auth access, which is exactly what we want.
