// src/components/events/EventForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEventSchema, UpdateEventSchema } from '@shared/schemas';
import type { CreateEventRequest, UpdateEventRequest } from '@shared/types';
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
  mode: 'create';
  initialData?: never;
  onSubmit: (data: CreateEventRequest) => Promise<void>;
  isSubmitting?: boolean;
}

interface EventEditFormProps {
  mode: 'edit';
  initialData: Event;
  onSubmit: (data: UpdateEventRequest) => Promise<void>;
  isSubmitting?: boolean;
}

type EventFormAllProps = EventFormProps | EventEditFormProps;

// 🔄 日付変換ユーティリティ（フォーム内部のみで使用）
const formatDateTime = (datetimeLocal: string): string => {
  if (!datetimeLocal) return '';
  
  try {
    const dateObj = new Date(datetimeLocal);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日${hours}:${minutes}`;
  } catch {
    return datetimeLocal;
  }
};

const parseDateTimeString = (dateTimeStr: string): string => {
  if (!dateTimeStr) return '';
  
  const match = dateTimeStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(\d{2}:\d{2})?/);
  
  if (match) {
    const [, year, month, day, time] = match;
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const formattedTime = time || '00:00';
    return `${formattedDate}T${formattedTime}`;
  }
  
  return '';
};

const getTodayDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EventForm(props: EventFormAllProps) {
  const { mode, onSubmit, isSubmitting = false } = props;
  const initialData = props.mode === 'edit' ? props.initialData : undefined;
  const isEdit = mode === 'edit';
  
  // 🔧 既存のスキーマをそのまま使用（型を増やさない）
  const schema = isEdit ? UpdateEventSchema : CreateEventSchema;
  
  const form = useForm<CreateEventRequest | UpdateEventRequest>({
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

  // 🔧 フォーム内部でdatetime-local値を管理
  const [localDateTime, setLocalDateTime] = React.useState(() => {
    return isEdit && initialData?.date 
      ? parseDateTimeString(initialData.date)
      : '';
  });

  // datetime-localの値が変更されたら、フォームのdateフィールドを更新
  React.useEffect(() => {
    const formattedDate = formatDateTime(localDateTime);
    form.setValue('date', formattedDate);
  }, [localDateTime, form]);

  const handleSubmit = async (data: CreateEventRequest | UpdateEventRequest) => {
    try {
      // 🔧 送信データは既存の型のまま（追加の型定義不要）
      const submitData = {
        ...data,
        description: data.description?.trim() || undefined,
        image_url: data.image_url?.trim() || undefined,
      };
      
      // 型に応じて適切な関数を呼び出し
      if (isEdit) {
        await (onSubmit as (data: UpdateEventRequest) => Promise<void>)(submitData as UpdateEventRequest);
      } else {
        await (onSubmit as (data: CreateEventRequest) => Promise<void>)(submitData as CreateEventRequest);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `イベントの${isEdit ? '更新' : '作成'}に失敗しました`;
      form.setError('root', { type: 'manual', message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
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

        {/* 🔧 開催日時 - datetime-localを使うが、フォームフィールドは既存のまま */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            開催日時
            {!isEdit && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          <Input
            type="datetime-local"
            className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
            disabled={form.formState.isSubmitting}
            value={localDateTime}
            onChange={(e) => setLocalDateTime(e.target.value)}
            min={getTodayDateTime()}
          />
          
          {/* 隠しフィールドとしてバリデーション */}
          <FormField
            control={form.control}
            name="date"
            render={() => (
              <FormItem className="hidden">
                <FormControl>
                  <Input type="hidden" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!localDateTime && form.formState.isSubmitted && (
            <p className="text-red-500 text-sm">開催日時は必須です</p>
          )}
          
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
                  className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
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

        {/* 説明 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>イベント説明</FormLabel>
              <FormControl>
                <Textarea
                  className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500 min-h-[120px]"
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

        {/* 画像URL */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>画像URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
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

        {/* 定員 */}
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
                  className="bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
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
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
            disabled={form.formState.isSubmitting || isSubmitting || (!localDateTime && !isEdit)}
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