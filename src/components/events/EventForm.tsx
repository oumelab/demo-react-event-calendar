// src/components/events/EventForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEventSchema, UpdateEventSchema, type CreateEventData, type UpdateEventData } from '@shared/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Event } from '@shared/types';

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: Event;
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>;
  isSubmitting?: boolean;
}

// 日付時間の変換ユーティリティ
const formatDateTime = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  
  try {
    // "2024-06-01T08:30" → "2024年6月1日08:30"
    const dateObj = new Date(datetimeLocal);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日${hours}:${minutes}`;
  } catch {
    return datetimeLocal; // フォールバック
  }
};

const parseDateTimeString = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';
  
  // "2025年7月25日14:00" のような形式をパース → "2025-07-25T14:00"
  const match = dateTimeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{2}:\d{2})?/);
  
  if (match) {
    const [, year, month, day, time] = match;
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const formattedTime = time || '00:00';
    return `${formattedDate}T${formattedTime}`;
  }
  
  // パースに失敗した場合のフォールバック
  return '';
};

// 今日の日付をYYYY-MM-DDTHH:mm形式で取得（min属性用）
const getTodayDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EventForm({ mode, initialData, onSubmit, isSubmitting = false }: EventFormProps) {
  const isEdit = mode === 'edit';
  
  // 初期データから日付と時間を抽出してdatetime-local形式に変換
  const initialDateTime = isEdit && initialData?.date 
    ? parseDateTimeString(initialData.date)
    : '';
  
  // 共通スキーマを使用
  const schema = isEdit ? UpdateEventSchema : CreateEventSchema;
  
  const form = useForm<CreateEventData | UpdateEventData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && initialData ? {
      title: initialData.title,
      date: initialData.date,
      location: initialData.location,
      description: initialData.description || '',
      image_url: initialData.image_url || '',
      capacity: initialData.capacity || undefined,
    } : {
      title: '',
      date: '',
      location: '',
      description: '',
      image_url: '',
      capacity: undefined,
    },
  });

  // 内部状態として日時を管理（フォームとは別）
  const [eventDateTime, setEventDateTime] = React.useState(initialDateTime);

  // 日時が変更されたときにフォームのdateフィールドを更新
  React.useEffect(() => {
    const formattedDate = formatDateTime(eventDateTime);
    if (formattedDate) {
      form.setValue('date', formattedDate);
    }
  }, [eventDateTime, form]);

  const handleSubmit = async (data: CreateEventData | UpdateEventData) => {
    try {
      // 空文字列を適切にハンドリング
      const submitData = {
        ...data,
        description: data.description?.trim() || undefined,
        image_url: data.image_url?.trim() || undefined,
      };
      
      await onSubmit(submitData);
    } catch (error) {
      const message = error instanceof Error ? error.message : `イベントの${isEdit ? '更新' : '作成'}に失敗しました`;
      form.setError('root', { type: 'manual', message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* エラーメッセージ表示 */}
        {form.formState.errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{form.formState.errors.root.message}</p>
          </div>
        )}

        {/* タイトル */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                イベントタイトル
                {!isEdit && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="例: React勉強会 - 最新機能を学ぼう"
                  maxLength={100}
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 開催日時 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            開催日時
            {!isEdit && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          <div>
            <Input
              type="datetime-local"
              className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500"
              disabled={form.formState.isSubmitting}
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              min={getTodayDateTime()} // 今日以降の日時のみ選択可能
            />
            {!eventDateTime && !isEdit && (
              <p className="text-red-500 text-sm mt-1">開催日時は必須です</p>
            )}
          </div>
          
          {/* 隠しフィールド - 実際のフォーム値 */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <div className="hidden">
                <input {...field} />
              </div>
            )}
          />
          
          <p className="text-xs text-gray-500">
            開催日時を選択してください。保存時に「2025年7月25日14:00」の形式で統一されます
          </p>
        </div>

        {/* 開催場所 */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                開催場所
                {!isEdit && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="例: 東京都渋谷区〇〇ビル、オンライン（Zoom）"
                  maxLength={100}
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 説明（オプション） */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>イベント説明</FormLabel>
              <FormControl>
                <Textarea
                  className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500 min-h-[120px]"
                  placeholder="イベントの詳細、対象者、持ち物、注意事項などを記載してください"
                  maxLength={1000}
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                1000文字以内（任意）
              </p>
            </FormItem>
          )}
        />

        {/* 画像URL（オプション） */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>画像URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="https://example.com/image.jpg"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                イベントのサムネイル画像のURLを入力してください（任意）
              </p>
            </FormItem>
          )}
        />

        {/* 定員（オプション） */}
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>定員</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  className="border border-gray-300 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="例: 30"
                  disabled={form.formState.isSubmitting}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : parseInt(value, 10));
                  }}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                参加可能人数を設定してください（任意・1人以上）
              </p>
            </FormItem>
          )}
        />

        {/* 送信ボタン */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
            disabled={form.formState.isSubmitting || isSubmitting || (!eventDateTime && !isEdit)}
          >
            {form.formState.isSubmitting || isSubmitting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                {isEdit ? '更新中...' : '作成中...'}
              </>
            ) : (
              isEdit ? 'イベントを更新' : 'イベントを作成'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}