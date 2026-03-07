-- 在庫確認 RPC（Supabase 実機より取得）
-- 呼び出し元: POST /api/check-availability
-- 戻り値: { "available": boolean, "remaining": number, "error"?: "invalid_date_range" }

CREATE OR REPLACE FUNCTION public.check_availability_with_period_v5_0(
  p_bike_type text,
  p_start_date date,
  p_end_date date,
  p_request_qty integer
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_min_available int;
  v_total_days int;
begin
  -- 期間の長さチェック
  select count(*) into v_total_days
  from generate_series(p_start_date, p_end_date, interval '1 day');

  if v_total_days <= 0 then
    return json_build_object(
      'available', false,
      'remaining', 0,
      'error', 'invalid_date_range'
    );
  end if;

  -- 日毎のavailable最小値を抽出（返却日含む）
  select min(coalesce(s.available, 0))
  into v_min_available
  from generate_series(p_start_date, p_end_date, interval '1 day') as d
  left join stock s
    on s.date = d
   and s.bike_type = p_bike_type;

  -- 在庫未登録時もCOALESCEにより0扱い
  if v_min_available is null then
    v_min_available := 0;
  end if;

  -- 結果返却（MVP: JSONレスポンス）
  if v_min_available >= p_request_qty then
    return json_build_object(
      'available', true,
      'remaining', v_min_available
    );
  else
    return json_build_object(
      'available', false,
      'remaining', v_min_available
    );
  end if;
end;
$function$;
