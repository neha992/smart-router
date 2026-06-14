
DROP POLICY IF EXISTS "Users can subscribe to their own realtime topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own realtime topic"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    split_part(realtime.topic(), ':', 1) = auth.uid()::text
  );
