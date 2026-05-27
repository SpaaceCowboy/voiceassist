-- Add JSONB metrics column to call_logs for per-call performance tracking.
-- Stores: response_times[], tool_calls[], confidence_scores[]

ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT NULL;

COMMENT ON COLUMN call_logs.metrics IS 'Per-call performance metrics: response_times, tool_calls, confidence_scores';
