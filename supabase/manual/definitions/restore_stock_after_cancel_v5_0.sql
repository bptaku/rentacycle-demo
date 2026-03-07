-- キャンセル UPDATE 時に stock.reserved を減算して在庫を復元するトリガー用関数（Supabase 実機より取得）
-- トリガー: trg_restore_stock_after_cancel_v5_0 (AFTER UPDATE ON reservations)
--
-- ※ 実機では OLD.status IN ('reserved', 'in_use') のみ。migrations 版は 'dropoff_in_progress' も含む。

CREATE OR REPLACE FUNCTION public.restore_stock_after_cancel_v5_0()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_bike record;
  v_date date;
begin
  -- 旧データが存在し、旧ステータスが「reserved」か「in_use」だった場合のみ実行
  if old.status in ('reserved', 'in_use')
     and new.status in ('canceled', 'deleted') then
    for v_bike in
      select key as bike_type, value::int as qty
      from jsonb_each_text(old.bikes)
    loop
      for v_date in
        select d::date
        from generate_series(old.start_date, old.end_date, interval '1 day') as gs(d)
      loop
        update stock
          set reserved = greatest(coalesce(reserved, 0) - v_bike.qty, 0),
              updated_at = now()
          where bike_type = v_bike.bike_type and date = v_date;
      end loop;
    end loop;
  end if;

  return new;
end;
$function$;
