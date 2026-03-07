/**
 * 予約フォーム用の日本語・英語翻訳
 * 管理画面は対象外（日本語のみ）
 */

export type ReservationLocale = "ja" | "en";

const BIKE_TYPE_IDS = [
  "クロスバイク XS",
  "クロスバイク S",
  "クロスバイク M",
  "クロスバイク XL",
  "ロードバイク S",
  "ロードバイク M",
  "ロードバイク L",
  "電動A S",
  "電動A M",
  "電動B M",
  "電動B チャイルドシート",
  "電動C S",
  "電動C M",
  "キッズ20インチ",
  "キッズ24インチ",
  "キッズ26インチ",
] as const;

export type BikeTypeId = (typeof BIKE_TYPE_IDS)[number];

/** 車種ID → 表示ラベル（言語別） */
export function getBikeTypeLabels(locale: ReservationLocale): Record<string, string> {
  const labels: Record<string, string> = {};
  const map = locale === "en" ? BIKE_LABELS_EN : BIKE_LABELS_JA;
  for (const id of BIKE_TYPE_IDS) {
    labels[id] = map[id] ?? id;
  }
  return labels;
}

const BIKE_LABELS_JA: Record<string, string> = {
  "クロスバイク XS": "クロスバイク XS（150〜163cm）",
  "クロスバイク S": "クロスバイク S（157〜170cm）",
  "クロスバイク M": "クロスバイク M（165〜177cm）",
  "クロスバイク XL": "クロスバイク XL（180〜195cm）",
  "ロードバイク S": "ロードバイク S（165〜172cm）",
  "ロードバイク M": "ロードバイク M（170〜180cm）",
  "ロードバイク L": "ロードバイク L（177〜193cm）",
  "電動A S": "電動A S（146cm〜170cm）",
  "電動A M": "電動A M（153cm〜185cm）",
  "電動B M": "電動B M（156cm〜180cm）",
  "電動B チャイルドシート": "電動B チャイルドシート付き",
  "電動C S": "電動C S（162〜172cm）",
  "電動C M": "電動C M（170〜182cm）",
  "キッズ20インチ": "キッズ 20インチ（約115cm〜）",
  "キッズ24インチ": "キッズ 24インチ（約130cm〜）",
  "キッズ26インチ": "キッズ 26インチ（約140cm〜）",
};

const BIKE_LABELS_EN: Record<string, string> = {
  "クロスバイク XS": "Cross bike XS (150–163cm)",
  "クロスバイク S": "Cross bike S (157–170cm)",
  "クロスバイク M": "Cross bike M (165–177cm)",
  "クロスバイク XL": "Cross bike XL (180–195cm)",
  "ロードバイク S": "Road bike S (165–172cm)",
  "ロードバイク M": "Road bike M (170–180cm)",
  "ロードバイク L": "Road bike L (177–193cm)",
  "電動A S": "E-bike A S (146–170cm)",
  "電動A M": "E-bike A M (153–185cm)",
  "電動B M": "E-bike B M (156–180cm)",
  "電動B チャイルドシート": "E-bike B with child seat",
  "電動C S": "E-bike C S (162–172cm)",
  "電動C M": "E-bike C M (170–182cm)",
  "キッズ20インチ": "Kids 20\" (approx. 115cm+)",
  "キッズ24インチ": "Kids 24\" (approx. 130cm+)",
  "キッズ26インチ": "Kids 26\" (approx. 140cm+)",
};

export type ReservationTranslations = {
  locale: ReservationLocale;
  shopName: string;
  title: string;
  subtitle: string;
  hoursLabel: string;
  closedLabel: string;
  dropoffLabel: string;
  dropoffNote: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  step5Title: string;
  step5Desc: string;
  selectPlan: string;
  plan6hTitle: string;
  plan6hSubtitle: string;
  plan6hNote: string;
  plan1dTitle: string;
  plan1dSubtitle: string;
  plan2dTitle: string;
  plan2dSubtitle: string;
  plan2dNote: string;
  pickupDate: string;
  /** 予約は2日後以降である旨の案内 */
  minBookingDateNotice: string;
  rentalDays: string;
  returnDate: string;
  returnTime: string;
  returnBy: string;
  pickupTime: string;
  pickupTimeNote6h: string;
  pickupTimeNoteOther: string;
  closedMessageSingle: string;
  closedMessageBoth: string;
  closedMessageStart: string;
  closedMessageEnd: string;
  busyThreeDayNote: string;
  priceGuide: string;
  price6h: string;
  price1d: string;
  price2d: string;
  priceAddDay: string;
  bikeType: string;
  availableCount: string;
  unitBikes: string;
  reserveCount: string;
  shortageMessage: string;
  scrollPhotos: string;
  pannierLimit: string;
  pannierLimitNone: string;
  pannierOverflow: string;
  pannierRemaining: string;
  addonsAndInsurance: string;
  dropoffService: string;
  dropoffOption: string;
  dropoffFeeNote: string;
  dropoffBusyNote: string;
  dropoffNormalNote: string;
  insuranceSection: string;
  insuranceNote: string;
  insuranceLiability: string;
  reviewAndBook: string;
  repName: string;
  repEmail: string;
  repNamePlaceholder: string;
  repEmailPlaceholder: string;
  emailInvalid: string;
  emailNote: string;
  subtotal: string;
  options: string;
  dropoff: string;
  insurance: string;
  totalLabel: string;
  totalNote: string;
  confirmButton: string;
  modalTitle: string;
  closeButton: string;
  planLabel: string;
  pickupDateTime: string;
  contactLabel: string;
  bikesLabel: string;
  editButton: string;
  submitButton: string;
  submittingButton: string;
  successBadge: string;
  successTitle: string;
  successMessage: string;
  reservationNumber: string;
  repLabel: string;
  pickupDateLabel: string;
  returnDateLabel: string;
  bookedBikes: string;
  optionsAndInsurance: string;
  noOptions: string;
  insuranceLabel: string;
  insuranceNone: string;
  dropoffLabelResult: string;
  dropoffNo: string;
  paymentLabel: string;
  paymentBreakdown: string;
  emailSentNote: string;
  cancelNote: string;
  anotherBooking: string;
  noStockAlert: string;
  bookFailed: string;
  planNotSet: string;
  groupDiscountLabel: string;
  weekdayNames: string; // "日月火水木金土"
  closedWeekday: string; // "水曜日" / "Wednesday"
  calendarClosedDayNotice: string;
};

const JA: ReservationTranslations = {
  locale: "ja",
  shopName: "木曽サイクル",
  title: "レンタサイクル予約フォーム",
  subtitle: "ご利用日時・車種・オプションを選択し、予約内容をご確認ください。",
  hoursLabel: "営業時間",
  closedLabel: "定休日",
  dropoffLabel: "ドロップオフ",
  dropoffNote: "今治で返却可能（繁忙期除く）",
  step1Title: "プランを選ぶ",
  step1Desc: "ご利用予定の時間帯・日数にあわせてプランをお選びください。",
  step2Title: "日時を選ぶ",
  step2Desc: "水曜日は定休日のため、貸出日・返却日に選択できません。",
  step3Title: "車種と台数を選ぶ",
  step3Desc: "空き状況を確認しながら、ご希望の台数を入力してください。",
  step4Title: "オプションと補償",
  step4Desc: "各自転車ごとに必要なオプションと補償プランをお選びください。",
  step5Title: "料金を確認して予約する",
  step5Desc: "選択内容を確認し、予約内容確認ボタンから最終確認へ進みます。",
  selectPlan: "選択する",
  plan6hTitle: "6時間プラン",
  plan6hSubtitle: "半日で向島・しまなみ海道を満喫したい方に",
  plan6hNote: "ご出発は 8:00 / 8:30 / 9:00 からお選びいただけます",
  plan1dTitle: "1日プラン",
  plan1dSubtitle: "朝から夕方まで自由にサイクリング",
  plan2dTitle: "2日以上プラン",
  plan2dSubtitle: "泊まりがけ・ロングライドにおすすめ",
  plan2dNote: "2日目以降は1日ごとに追加料金が発生します",
  pickupDate: "貸出日",
  minBookingDateNotice: "ご予約は2日後以降の日付から承っております。",
  rentalDays: "ご利用日数",
  returnDate: "返却予定日",
  returnTime: "返却予定",
  returnBy: "最終返却",
  pickupTime: "来店時間",
  pickupTimeNote6h: "出発時間を選ぶと、返却時間が自動で計算されます。",
  pickupTimeNoteOther: "ご来店予定時間は目安で構いません。",
  closedMessageSingle: "定休日（水曜）は予約できません。",
  closedMessageBoth: "貸出日と返却日が定休日（水曜）に当たるためご利用いただけません",
  closedMessageStart: "貸出日が定休日（水曜）に当たるためご利用いただけません",
  closedMessageEnd: "返却日が定休日（水曜）に当たるためご利用いただけません",
  busyThreeDayNote: "※繁忙期の三連休は6時間プランの予約ができません",
  priceGuide: "料金の目安",
  price6h: "6時間",
  price1d: "1日",
  price2d: "2日以上",
  priceAddDay: "追加1日ごとに",
  bikeType: "車種",
  availableCount: "空き台数",
  unitBikes: "台",
  reserveCount: "予約台数",
  shortageMessage: "空き台数が不足しています。台数を調整するか別の日程をご検討ください。",
  scrollPhotos: "← 左右にスクロールで写真をすべてご覧いただけます",
  pannierLimit: "パニアバッグは1日あたり・全予約合計で最大10個までです。この予約ではあと{remaining}個まで選択できます。（現在 {current}個）",
  pannierLimitNone: "パニアバッグは1日あたり・全予約合計で最大10個までです。現在、他のご予約で枠がいっぱいのため、この予約では追加できません。",
  pannierOverflow: "パニアバッグは1日あたり・全予約合計で最大10個までです。この予約では最大{max}個までです。現在{current}個選択されています。オプションを減らしてください。",
  pannierRemaining: "この予約ではあと{remaining}個まで選択できます。（現在 {current}個）",
  addonsAndInsurance: "オプションと補償",
  dropoffService: "ドロップオフサービス",
  dropoffOption: "今治で返却する（1台につき ¥{price}）",
  dropoffFeeNote: "ドロップオフ料金：¥{total}（{count}台 × ¥{per}）",
  dropoffBusyNote: "繁忙期（3〜5月／9〜11月）のためオンラインではご予約できません。ご希望の場合は店舗に直接お問い合わせください。",
  dropoffNormalNote: "台数分の料金が追加されます。返却後は翌日の貸出ができない場合があります。",
  insuranceSection: "車両補償プラン",
  insuranceNote: "※貸出時と異なる重大な破損が確認された場合、補償内容に応じて修理費等を請求いたします。",
  insuranceLiability: "※全てのレンタル自転車に上限１億円までの対人賠償保険を付帯しております。",
  reviewAndBook: "料金を確認して予約する",
  repName: "代表者氏名（必須）",
  repEmail: "メールアドレス（必須）",
  repNamePlaceholder: "例：木曽 太郎",
  repEmailPlaceholder: "例：example@kisoscycle.jp",
  emailInvalid: "メールアドレスの形式をご確認ください。",
  emailNote: "ご予約内容はこのメールアドレスに自動送信されます。お間違いのないようご入力ください。",
  subtotal: "基本料金",
  options: "オプション",
  dropoff: "ドロップオフ",
  insurance: "車両補償",
  totalLabel: "お支払い予定金額",
  totalNote: "税込・店頭でお支払いください。",
  confirmButton: "予約内容を確認",
  modalTitle: "ご予約内容の最終確認",
  closeButton: "閉じる",
  planLabel: "プラン",
  pickupDateTime: "貸出日時",
  contactLabel: "ご連絡先",
  bikesLabel: "自転車",
  editButton: "修正する",
  submitButton: "この内容で予約する",
  submittingButton: "予約中...",
  successBadge: "ご予約が完了しました",
  successTitle: "木曽サイクルへのご予約ありがとうございます",
  successMessage: "ご入力いただいた内容で予約を承りました。ご来店当日は受付でご予約番号をお伝えください。",
  reservationNumber: "予約番号",
  repLabel: "代表者",
  pickupDateLabel: "貸出日",
  returnDateLabel: "返却日",
  bookedBikes: "ご予約の車両",
  optionsAndInsurance: "オプション・補償",
  noOptions: "オプションの追加はありません。",
  insuranceLabel: "車両補償",
  insuranceNone: "加入なし",
  dropoffLabelResult: "ドロップオフ",
  dropoffNo: "利用なし",
  paymentLabel: "お支払い予定金額",
  paymentBreakdown: "料金内訳",
  emailSentNote: "ご予約内容はご登録のメールアドレスにも送信されています。確認メールが届かない場合は迷惑メールフォルダーもご確認ください。",
  cancelNote: "変更・キャンセルをご希望の際は、予約完了メール内のキャンセル申請リンクからお手続きをお願いいたします。",
  anotherBooking: "別の予約を入力する",
  noStockAlert: "の在庫が足りません。別の日または台数を変更してください。",
  bookFailed: "予約に失敗しました",
  planNotSet: "プランが未設定です",
  groupDiscountLabel: "グループ割 10%OFF 適用",
  weekdayNames: "日月火水木金土",
  closedWeekday: "水曜日",
  /** カレンダーエリア用：貸出・返却に水曜を選べない旨 */
  calendarClosedDayNotice: "水曜日は定休日のため、貸出日・返却日に選択できません。",
};

const EN: ReservationTranslations = {
  locale: "en",
  shopName: "Kiso Cycle",
  title: "Bike Rental Reservation",
  subtitle: "Select date, bike types and options, then review your reservation.",
  hoursLabel: "Hours",
  closedLabel: "Closed",
  dropoffLabel: "Drop-off",
  dropoffNote: "Return in Imabari (except peak season)",
  step1Title: "Choose a plan",
  step1Desc: "Select the plan that matches your schedule.",
  step2Title: "Select date & time",
  step2Desc: "Wednesdays are closed; please do not select Wednesday as pick-up or return date.",
  step3Title: "Choose bikes",
  step3Desc: "Enter the number of bikes you need. Availability is shown in real time.",
  step4Title: "Options & insurance",
  step4Desc: "Add options and insurance for each bike.",
  step5Title: "Review & book",
  step5Desc: "Check your selection and proceed to confirm.",
  selectPlan: "Select",
  plan6hTitle: "6-hour plan",
  plan6hSubtitle: "Half-day around Mukushima & Shimanami",
  plan6hNote: "Departure at 8:00, 8:30 or 9:00",
  plan1dTitle: "1-day plan",
  plan1dSubtitle: "Full-day cycling",
  plan2dTitle: "2+ days plan",
  plan2dSubtitle: "Multi-day and long rides",
  plan2dNote: "Additional charge per extra day",
  pickupDate: "Pick-up date",
  minBookingDateNotice: "Reservations are available from 2 days ahead.",
  rentalDays: "Rental days",
  returnDate: "Return date",
  returnTime: "Return by",
  returnBy: "Latest return",
  pickupTime: "Pick-up time",
  pickupTimeNote6h: "Return time is calculated automatically.",
  pickupTimeNoteOther: "Pick-up time is approximate.",
  closedMessageSingle: "We are closed on Wednesdays.",
  closedMessageBoth: "Pick-up and return fall on our closed day (Wednesday).",
  closedMessageStart: "Pick-up date is our closed day (Wednesday).",
  closedMessageEnd: "Return date is our closed day (Wednesday).",
  busyThreeDayNote: "6-hour plan is not available on busy 3-day weekends.",
  priceGuide: "Price guide",
  price6h: "6h",
  price1d: "1 day",
  price2d: "2+ days",
  priceAddDay: "Per extra day",
  bikeType: "Bike type",
  availableCount: "Available",
  unitBikes: "bikes",
  reserveCount: "Quantity",
  shortageMessage: "Not enough bikes available. Reduce quantity or choose another date.",
  scrollPhotos: "Scroll for more photos",
  pannierLimit: "Pannier bags: max 10 per day across all reservations. You can add up to {remaining} for this booking (current: {current}).",
  pannierLimitNone: "Pannier bags: max 10 per day. Other reservations have reached the limit on some days, so you cannot add more for this booking.",
  pannierOverflow: "Pannier bags: max 10 per day. For this booking you can add up to {max}. You have selected {current}. Please reduce options.",
  pannierRemaining: "You can add up to {remaining} for this booking (current: {current}).",
  addonsAndInsurance: "Options & insurance",
  dropoffService: "Drop-off service",
  dropoffOption: "Return in Imabari (¥{price} per bike)",
  dropoffFeeNote: "Drop-off: ¥{total} ({count} bikes × ¥{per})",
  dropoffBusyNote: "Drop-off is not available online in peak season (Mar–May, Sep–Nov). Please contact us directly.",
  dropoffNormalNote: "Fee is per bike. Returned bikes may not be available the next day.",
  insuranceSection: "Damage waiver",
  insuranceNote: "If damage beyond normal wear is found, repair costs may be charged according to the plan.",
  insuranceLiability: "All rentals include liability insurance up to ¥100,000,000.",
  reviewAndBook: "Review & book",
  repName: "Name (required)",
  repEmail: "Email (required)",
  repNamePlaceholder: "e.g. Taro Kiso",
  repEmailPlaceholder: "e.g. example@email.com",
  emailInvalid: "Please enter a valid email address.",
  emailNote: "Your confirmation will be sent to this email.",
  subtotal: "Subtotal",
  options: "Options",
  dropoff: "Drop-off",
  insurance: "Insurance",
  totalLabel: "Total (pay at shop)",
  totalNote: "Tax included. Payment at pickup.",
  confirmButton: "Review reservation",
  modalTitle: "Confirm your reservation",
  closeButton: "Close",
  planLabel: "Plan",
  pickupDateTime: "Pick-up",
  contactLabel: "Contact",
  bikesLabel: "Bikes",
  editButton: "Edit",
  submitButton: "Confirm booking",
  submittingButton: "Booking...",
  successBadge: "Booking complete",
  successTitle: "Thank you for your reservation",
  successMessage: "Your reservation has been confirmed. Please quote your reservation number at the counter.",
  reservationNumber: "Reservation #",
  repLabel: "Contact",
  pickupDateLabel: "Pick-up date",
  returnDateLabel: "Return date",
  bookedBikes: "Your bikes",
  optionsAndInsurance: "Options & insurance",
  noOptions: "No options.",
  insuranceLabel: "Damage waiver",
  insuranceNone: "None",
  dropoffLabelResult: "Drop-off",
  dropoffNo: "No",
  paymentLabel: "Total",
  paymentBreakdown: "Breakdown",
  emailSentNote: "A confirmation email has been sent. Check spam if you don’t see it.",
  cancelNote: "To change or cancel, use the link in the confirmation email.",
  anotherBooking: "Make another booking",
  noStockAlert: " is not available. Please choose another date or reduce quantity.",
  bookFailed: "Booking failed",
  planNotSet: "Plan is not set.",
  groupDiscountLabel: "Group discount 10% off",
  weekdayNames: "SunMonTueWedThuFriSat",
  closedWeekday: "Wednesday",
  calendarClosedDayNotice: "Wednesdays are closed; please do not select Wednesday as pick-up or return date.",
};

/** プラン詳細（id, title, subtitle, note）の言語別 */
export function getPlanDetails(locale: ReservationLocale) {
  const t = locale === "en" ? EN : JA;
  return [
    {
      id: "6h" as const,
      title: t.plan6hTitle,
      subtitle: t.plan6hSubtitle,
      note: t.plan6hNote,
    },
    {
      id: "1d" as const,
      title: t.plan1dTitle,
      subtitle: t.plan1dSubtitle,
      note: undefined,
    },
    {
      id: "2d_plus" as const,
      title: t.plan2dTitle,
      subtitle: t.plan2dSubtitle,
      note: t.plan2dNote,
    },
  ];
}

/** プランラベル（6h/1d/2d_plus → 表示） */
export function getPlanLabels(locale: ReservationLocale): Record<"6h" | "1d" | "2d_plus", string> {
  const t = locale === "en" ? EN : JA;
  return {
    "6h": t.plan6hTitle,
    "1d": t.plan1dTitle,
    "2d_plus": t.plan2dTitle,
  };
}

/** 車種グループ（title, description）の言語別 */
export function getBikeGroups(locale: ReservationLocale) {
  const groups = [
    {
      id: "cross",
      titleJa: "クロスバイク",
      titleEn: "Cross bikes",
      descJa: "軽快に走れるスタンダードモデル。身長に合わせてサイズをお選びください。",
      descEn: "Standard hybrid bikes. Choose by height.",
      types: ["クロスバイク XS", "クロスバイク S", "クロスバイク M", "クロスバイク XL"],
    },
    {
      id: "road",
      titleJa: "ロードバイク",
      titleEn: "Road bikes",
      descJa: "スピード重視のロードバイク。",
      descEn: "Built for speed.",
      types: ["ロードバイク S", "ロードバイク M", "ロードバイク L"],
    },
    {
      id: "electricA",
      titleJa: "電動アシスト A",
      titleEn: "E-bike A",
      descJa: "坂道やロングライドも楽な電動アシスト車です。",
      descEn: "E-assist for hills and long rides.",
      types: ["電動A S", "電動A M"],
    },
    {
      id: "electricB",
      titleJa: "電動アシスト B",
      titleEn: "E-bike B",
      descJa: "電動アシスト車。チャイルドシート付きもご用意しています。",
      descEn: "E-assist. Child seat option available.",
      types: ["電動B M", "電動B チャイルドシート"],
    },
    {
      id: "electricC",
      titleJa: "電動アシスト C",
      titleEn: "E-bike C",
      descJa: "電動アシスト車。",
      descEn: "E-assist.",
      types: ["電動C S", "電動C M"],
    },
    {
      id: "kids",
      titleJa: "キッズバイク",
      titleEn: "Kids bikes",
      descJa: "お子さまの身長に合わせてサイズをお選びください。",
      descEn: "Choose by child’s height.",
      types: ["キッズ20インチ", "キッズ24インチ", "キッズ26インチ"],
    },
  ];
  return groups.map((g) => ({
    id: g.id,
    title: locale === "en" ? g.titleEn : g.titleJa,
    description: locale === "en" ? g.descEn : g.descJa,
    types: g.types,
  }));
}

/** オプション名（id → 表示名） */
export function getAddonNames(locale: ReservationLocale): Record<string, string> {
  if (locale === "en") {
    return {
      "A-HOLDER": "Phone holder",
      "A-BATTERY": "Extra battery",
      "A-PANNIER-SET": "Pannier set (pair)",
      "A-PANNIER-SINGLE": "Pannier (single)",
    };
  }
  return {
    "A-HOLDER": "スマホホルダー",
    "A-BATTERY": "予備バッテリー",
    "A-PANNIER-SET": "パニアバッグ左右セット",
    "A-PANNIER-SINGLE": "パニアバッグ片側",
  };
}

/** 保険プラン（name, description, price）の言語別 */
export function getInsurancePlans(locale: ReservationLocale) {
  const plans = [
    { id: "none" as const, nameJa: "補償なし", nameEn: "No coverage", descJa: "補償は付帯しません", descEn: "No damage waiver", price: 0 },
    { id: "A" as const, nameJa: "Aプラン", nameEn: "Plan A", descJa: "1万円までの修理代を保障", descEn: "Up to ¥10,000 repair", price: 500 },
    { id: "B" as const, nameJa: "Bプラン", nameEn: "Plan B", descJa: "車両価格の30%まで保障", descEn: "Up to 30% of bike value", price: 1000 },
    { id: "C" as const, nameJa: "Cプラン", nameEn: "Plan C", descJa: "車両価格の50%まで保障", descEn: "Up to 50% of bike value", price: 2000 },
  ];
  const t = locale === "en";
  return plans.map((p) => ({
    ...p,
    name: t ? p.nameEn : p.nameJa,
    description: t ? p.descEn : p.descJa,
  }));
}

export function getReservationTranslations(locale: ReservationLocale): ReservationTranslations {
  return locale === "en" ? { ...EN } : { ...JA };
}

/** 曜日短縮表示（0=日〜6=土） */
export function getWeekdayShort(locale: ReservationLocale, dayIndex: number): string {
  if (locale === "en") {
    const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return en[dayIndex] ?? "";
  }
  return "日月火水木金土"[dayIndex] ?? "";
}

/** 補間: "あと{remaining}個" → replace {key} with value */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}
