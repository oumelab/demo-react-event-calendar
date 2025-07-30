// src/hooks/useEventUtils.ts - イベント関連のユーティリティ関数とフック
import { useMemo } from 'react';
import type { EventWithAttendees } from '@shared/types';
// 🆕 共通ユーティリティをインポート
import { parseEventDate, isEventNotStarted } from '@shared/utils';

// 共通ユーティリティ関数を再エクスポート（後方互換性のため）
export { parseEventDate, isEventNotStarted } from '@shared/utils';

// ========== イベントソート関連フック ==========

/**
 * イベント一覧を開催日時順でソートするフック
 * @param events イベント配列
 * @param order 'asc' | 'desc' - 昇順(近い順) | 降順(遠い順)
 * @returns ソート済みイベント配列
 */
export function useEventsSortedByDate(
  events: EventWithAttendees[] | undefined,
  order: 'asc' | 'desc' = 'desc'
) {
  return useMemo(() => {
    if (!events) return [];
    
    return [...events].sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);
      
      if (order === 'asc') {
        return dateA.getTime() - dateB.getTime(); // 昇順（近い順）
      } else {
        return dateB.getTime() - dateA.getTime(); // 降順（遠い順）
      }
    });
  }, [events, order]);
}

/**
 * イベント一覧を複数条件でソートするフック
 * 未来のイベント -> 過去のイベント の順で、それぞれ日付順
 */
export function useEventsSmartSort(events: EventWithAttendees[] | undefined) {
  return useMemo(() => {
    if (!events) return [];
    
    const now = new Date();
    const futureEvents: EventWithAttendees[] = [];
    const pastEvents: EventWithAttendees[] = [];
    
    // イベントを未来・過去に分類
    events.forEach(event => {
      const eventDate = parseEventDate(event.date);
      if (eventDate > now) {
        futureEvents.push(event);
      } else {
        pastEvents.push(event);
      }
    });
    
    // 未来のイベント: 近い順
    futureEvents.sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    
    // 過去のイベント: 新しい順
    pastEvents.sort((a, b) => {
      const dateA = parseEventDate(a.date);
      const dateB = parseEventDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    // 未来のイベント -> 過去のイベント の順で結合
    return [...futureEvents, ...pastEvents];
  }, [events]);
}

// ========== イベント状態チェック関連フック ==========

/**
 * イベントの各種状態を判定するフック
 * @param event イベントオブジェクト
 * @returns イベントの状態情報
 */
export function useEventStatus(event: EventWithAttendees | undefined) {
  return useMemo(() => {
    if (!event) {
      return {
        isStarted: false,
        isEnded: false,
        isFull: false,
        canApply: false,
        statusText: '不明',
      };
    }
    
    const isStarted = !isEventNotStarted(event.date);
    const isEnded = isStarted; // 現在の実装では開始=終了
    const isFull = event.capacity ? event.attendees >= event.capacity : false;
    const canApply = !isStarted && !isFull;
    
    let statusText = '募集中';
    if (isFull) statusText = '満員';
    else if (isEnded) statusText = '終了';
    
    return {
      isStarted,
      isEnded,
      isFull,
      canApply,
      statusText,
    };
  }, [event]);
}