"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";

type ReservationInfo = {
  id: string;
  name: string;
  email: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  pickup_time: string | null;
  plan: string;
  status: string;
  cancel_requested: boolean;
  total_price: number;
};

const PLAN_LABELS: Record<string, string> = {
  "6h": "6時間プラン",
  "1d": "1日プラン",
  "2d_plus": "2日以上プラン",
};

const STATUS_LABELS: Record<string, string> = {
  reserved: "予約済み",
  in_use: "貸出中",
  dropoff_in_progress: "ドロップオフ中",
  completed: "返却済み",
  canceled: "キャンセル済み",
};

export default function CancelRequestPage() {
  const params = useParams();
  const reservationId = params?.id as string;

  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!reservationId) return;

    async function fetchReservation() {
      try {
        const res = await fetch(`/api/reservation-info?id=${reservationId}`);
        const json = await res.json();

        if (json.error || !json.reservation) {
          setError(json.message || "予約情報が見つかりません");
          return;
        }

        setReservation(json.reservation);
      } catch (e) {
        setError("予約情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reservationId]);

  const handleSubmit = async () => {
    if (!reservationId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reservationId,
          reason: reason.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.message || "キャンセル申請に失敗しました");
        return;
      }

      setSubmitted(true);
      // 予約情報を再取得
      const infoRes = await fetch(`/api/reservation-info?id=${reservationId}`);
      const infoJson = await infoRes.json();
      if (infoJson.reservation) {
        setReservation(infoJson.reservation);
      }
    } catch (e) {
      setError("キャンセル申請に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-6 w-6" />
            <h1 className="text-lg font-semibold">エラー</h1>
          </div>
          <p className="mt-4 text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  // 既にキャンセル済みの場合
  if (reservation.status === "canceled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <CheckCircle className="h-6 w-6" />
            <h1 className="text-lg font-semibold">キャンセル済み</h1>
          </div>
          <p className="mt-4 text-slate-700">この予約は既にキャンセルされています。</p>
        </div>
      </div>
    );
  }

  // 既にキャンセル申請済みの場合
  if (reservation.cancel_requested || submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600">
            <CheckCircle className="h-6 w-6" />
            <h1 className="text-lg font-semibold">キャンセル申請済み</h1>
          </div>
          <p className="mt-4 text-slate-700">
            キャンセル申請を承りました。お店で承認後、キャンセルが確定します。
          </p>
          <p className="mt-2 text-sm text-slate-500">
            承認までしばらくお待ちください。承認され次第、確認メールをお送りします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">キャンセル申請</h1>
            <p className="mt-2 text-sm text-slate-600">
              予約をキャンセルする場合は、以下の内容をご確認の上、申請してください。
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                予約情報
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">予約番号</dt>
                  <dd className="mt-1 font-mono font-semibold text-slate-900">
                    {reservation.id.slice(0, 8)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">お名前</dt>
                  <dd className="mt-1 text-slate-900">{reservation.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">プラン</dt>
                  <dd className="mt-1 text-slate-900">
                    {PLAN_LABELS[reservation.plan] || reservation.plan}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">貸出日</dt>
                  <dd className="mt-1 text-slate-900">
                    {reservation.start_date}
                    {reservation.start_time
                      ? ` ${reservation.start_time}`
                      : reservation.pickup_time
                      ? ` ${reservation.pickup_time} 来店予定`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">返却日</dt>
                  <dd className="mt-1 text-slate-900">{reservation.end_date}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">状態</dt>
                  <dd className="mt-1 text-slate-900">
                    {STATUS_LABELS[reservation.status] || reservation.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">予約金額</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    ¥{reservation.total_price.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                キャンセル理由（任意）
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="キャンセルの理由をご記入ください（任意）"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-slate-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    申請中...
                  </>
                ) : (
                  "キャンセル申請する"
                )}
              </button>
              <a
                href="/"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                キャンセル
              </a>
            </div>

            <p className="text-xs text-slate-500">
              ※ キャンセル申請後、お店で承認が必要です。承認され次第、確認メールをお送りします。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

