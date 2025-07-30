// shared/utils.ts - フロントエンド・バックエンド共通ユーティリティ

/**
 * 日本語形式の日時文字列を Date オブジェクトに変換
 * フロントエンド・バックエンド共通で使用
 * @param dateTimeStr "2025年9月6日20:00" 形式の文字列
 * @param options 設定オプション
 * @returns Date オブジェクト
 */
export function parseEventDate(
  dateTimeStr: string, 
  options: { throwOnError?: boolean } = {}
): Date {
  const { throwOnError = false } = options;

  if (!dateTimeStr) {
    if (throwOnError) {
      throw new Error('Date string is empty');
    }
    console.warn('Date string is empty');
    return new Date();
  }
  
  try {
    // "2025年9月6日20:00" 形式をパース
    const match = dateTimeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2}):(\d{2})/);
    
    if (!match) {
      if (throwOnError) {
        throw new Error(`Invalid date format: ${dateTimeStr}`);
      }
      console.warn('Date format not recognized:', dateTimeStr);
      return new Date();
    }
    
    const [, year, month, day, hours, minutes] = match;
    
    // 日本時間でDateオブジェクト作成
    const eventDate = new Date();
    eventDate.setFullYear(parseInt(year, 10));
    eventDate.setMonth(parseInt(month, 10) - 1); // 月は0ベース
    eventDate.setDate(parseInt(day, 10));
    eventDate.setHours(parseInt(hours, 10));
    eventDate.setMinutes(parseInt(minutes, 10));
    eventDate.setSeconds(0);
    eventDate.setMilliseconds(0);
    
    return eventDate;
  } catch (error) {
    if (throwOnError) {
      throw error;
    }
    console.warn('Date parsing error:', error);
    return new Date();
  }
}

/**
 * イベント開始前かどうかを判定
 * @param dateTimeStr "2025年9月6日20:00" 形式の文字列
 * @returns boolean イベント開始前なら true
 */
export function isEventNotStarted(dateTimeStr: string): boolean {
  try {
    const eventDate = parseEventDate(dateTimeStr);
    return eventDate > new Date();
  } catch (error) {
    console.warn('Event start check error:', error);
    return true; // エラー時は安全側に倒して申し込み可能とする
  }
}


/**
 * バックエンド用の日付パース関数（エラー時throw）
 * @param dateTimeStr 日時文字列
 * @returns Date オブジェクト
 */
export function parseDateTimeString(dateTimeStr: string): Date {
  return parseEventDate(dateTimeStr, { throwOnError: true });
}