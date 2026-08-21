-- Atomic monthly request accounting.
--
-- The API previously read requests_count, compared it to the tier limit, and
-- wrote back count + 1. Two requests that overlap both read the same count and
-- both write the same value, so a burst of concurrent requests consumed one
-- unit of quota between them and sailed past the limit.
--
-- consume_request folds the read, the limit check, and the write into a single
-- statement. The ON CONFLICT path takes a row lock, so concurrent callers
-- serialize on it and each one sees the previous increment.

CREATE OR REPLACE FUNCTION public.consume_request(
  p_user_id UUID,
  p_month TEXT,
  p_limit INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- A non-positive limit can never admit a request, and would otherwise be
  -- granted one by the INSERT path below.
  IF p_limit IS NULL OR p_limit <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.usage (user_id, month, requests_count, updated_at)
  VALUES (p_user_id, p_month, 1, NOW())
  ON CONFLICT (user_id, month) DO UPDATE
    SET requests_count = usage.requests_count + 1,
        updated_at = NOW()
    WHERE usage.requests_count < p_limit
  RETURNING requests_count INTO v_count;

  -- The conflict target matched but the WHERE blocked the update, so no row
  -- was returned and v_count is still NULL: the caller is at their limit.
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.consume_request(UUID, TEXT, INTEGER) IS
  'Atomically consume one monthly request. Returns the new count, or NULL when the limit is already reached.';

-- Hand a reserved request back when the work it was reserved for failed, so an
-- upstream outage does not silently burn a user''s monthly quota.
CREATE OR REPLACE FUNCTION public.release_request(
  p_user_id UUID,
  p_month TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.usage
    SET requests_count = requests_count - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND month = p_month
      AND requests_count > 0
  RETURNING requests_count INTO v_count;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.release_request(UUID, TEXT) IS
  'Return one previously consumed request. Returns the new count, or NULL if there was nothing to release.';

-- Both functions are SECURITY DEFINER and take the user id as an argument, so
-- they are only exposed to the service role the API authenticates with.
REVOKE ALL ON FUNCTION public.consume_request(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_request(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_request(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_request(UUID, TEXT) TO service_role;
