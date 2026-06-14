
-- 1. Lock down SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Restrict profiles SELECT to authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- 3. Tighten notifications policies to authenticated role only
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Realtime authorization: only allow users to subscribe to their own user-id topic
DROP POLICY IF EXISTS "Users can subscribe to their own realtime topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own realtime topic"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() = auth.uid()::text
  );
