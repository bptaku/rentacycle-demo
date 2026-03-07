-- 予約 INSERT 時に stock.reserved を加算するトリガー用関数（Supabase 実機より取得）
-- トリガー: trg_decrease_stock_after_reservation_v5_0 (AFTER INSERT ON reservations)

CREATE OR REPLACE FUNCTION public.decrease_stock_after_reservation_v5_0()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  r record;
  b record;
  v_date date;
begin
  -- 予約レコードを取得
  r := NEW;

  -- 期間内の日付を1日ずつループ（返却日含む）
  for v_date in select * from generate_series(r.start_date, r.end_date, interval '1 day') loop

    -- bikes(JSONB)を展開して車種ごとにreservedを加算
    for b in select * from jsonb_each_text(r.bikes) loop
      update stock
        set reserved = coalesce(reserved, 0) + (b.value)::int,
            updated_at = now()
        where bike_type = b.key
          and date = v_date;
    end loop;

  end loop;

  return NEW;
end;
$function$;
