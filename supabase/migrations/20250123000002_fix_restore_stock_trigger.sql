DROP TRIGGER IF EXISTS trg_restore_stock_after_cancel_v5_0 ON reservations;
DROP FUNCTION IF EXISTS restore_stock_after_cancel_v5_0();

CREATE OR REPLACE FUNCTION restore_stock_after_cancel_v5_0()
RETURNS TRIGGER AS $$
DECLARE
  v_bike record;
  v_date date;
BEGIN
  IF OLD.status IN ('reserved', 'in_use', 'dropoff_in_progress')
     AND NEW.status IN ('canceled', 'deleted') THEN
    FOR v_bike IN
      SELECT key AS bike_type, value::int AS qty
      FROM jsonb_each_text(OLD.bikes)
    LOOP
      FOR v_date IN
        SELECT d::date
        FROM generate_series(OLD.start_date, OLD.end_date, interval '1 day') AS gs(d)
      LOOP
        UPDATE stock
           SET reserved = greatest(coalesce(reserved, 0) - v_bike.qty, 0),
               updated_at = now()
         WHERE bike_type = v_bike.bike_type AND date = v_date;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_stock_after_cancel_v5_0
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_after_cancel_v5_0();
