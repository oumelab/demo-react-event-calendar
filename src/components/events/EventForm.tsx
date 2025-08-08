// src/components/events/EventForm.tsx - Issue #56 対応版
import React from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {CreateEventSchema, UpdateEventSchema} from "@shared/schemas";
import type {CreateEventRequest, UpdateEventRequest} from "@shared/types";
import type {z} from "zod";
import {Button} from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import type {Event} from "@shared/types";
import {ImageUpload} from "../ImageUpload";

interface EventFormProps {
  mode: "create";
  initialData?: never;
  onSubmit: (data: CreateEventRequest | FormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface EventEditFormProps {
  mode: "edit";
  initialData: Event;
  onSubmit: (data: UpdateEventRequest | FormData) => Promise<void>;
  isSubmitting?: boolean;
}

type EventFormAllProps = EventFormProps | EventEditFormProps;

// 🔄 日付変換ユーティリティ（フォーム内部のみで使用）
const formatDateTime = (datetimeLocal: string): string => {
  if (!datetimeLocal) return "";

  try {
    const dateObj = new Date(datetimeLocal);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    return `${year}年${month}月${day}日${hours}:${minutes}`;
  } catch {
    return datetimeLocal;
  }
};

const parseDateTimeString = (dateTimeStr: string): string => {
  if (!dateTimeStr) return "";

  const match = dateTimeStr.match(
    /(\d{4})年(\d{1,2})月(\d{1,2})日(\d{2}:\d{2})?/
  );

  if (match) {
    const [, year, month, day, time] = match;
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
    const formattedTime = time || "00:00";
    return `${formattedDate}T${formattedTime}`;
  }

  return "";
};

const getTodayDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EventForm(props: EventFormAllProps) {
  const {mode, onSubmit, isSubmitting = false} = props;
  const initialData = props.mode === "edit" ? props.initialData : undefined;
  const isEdit = mode === "edit";

  // 🆕 画像ファイル状態管理（Issue #56対応）- デバイスアップロードのみ
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const [isImageDeleted, setIsImageDeleted] = React.useState(false);

  // 🔧 既存のスキーマをそのまま使用（型を増やさない）
  const schema = isEdit ? UpdateEventSchema : CreateEventSchema;
  
  // スキーマから型を動的に生成
  type EventFormData = z.infer<typeof schema>;

  const form = useForm<EventFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      isEdit && initialData
        ? {
            title: initialData.title,
            date: initialData.date,
            location: initialData.location,
            description: initialData.description || "",
            image_url: initialData.image_url || "",
            capacity: initialData.capacity || undefined,
          }
        : {
            title: "",
            date: "",
            location: "",
            description: "",
            image_url: "",
            capacity: undefined,
          },
  });

  // 🔧 フォーム内部でdatetime-local値を管理
  const [localDateTime, setLocalDateTime] = React.useState(() => {
    return isEdit && initialData?.date
      ? parseDateTimeString(initialData.date)
      : "";
  });

  // datetime-localの値が変更されたら、フォームのdateフィールドを更新
  React.useEffect(() => {
    const formattedDate = formatDateTime(localDateTime);
    form.setValue("date", formattedDate);
  }, [localDateTime, form]);

  // 🆕 画像変更ハンドラー（Issue #56対応）- デバイスアップロードのみ
  const handleImageChange = React.useCallback(
    (data: { type: 'none' | 'file'; file?: File }) => {
      if (data.type === 'file' && data.file) {
        setSelectedImageFile(data.file);
        setIsImageDeleted(false);
        form.setValue('image_url', ''); // URLフィールドはクリア
      } else {
        // 画像削除の場合
        setSelectedImageFile(null);
        if (isEdit && initialData?.image_url) {
          // 編集時かつ既存画像がある場合は削除フラグを設定
          setIsImageDeleted(true);
        }
        form.setValue('image_url', '');
      }
    },
    [form, isEdit, initialData?.image_url]
  );

  const handleSubmit = async (data: EventFormData) => {
    try {
      // 🆕 FormData または JSON 形式で送信（Issue #56対応）
      let submitData: CreateEventRequest | UpdateEventRequest | FormData;
      
      if (selectedImageFile) {
        // FormData形式で送信（画像ファイルあり）
        const formData = new FormData();
        
        // イベントデータをJSONとして追加
        const eventData = {
          ...data,
          description: data.description?.trim() || undefined,
          image_url: undefined, // ファイルアップロード時はimage_urlは不要
        };
        
        formData.append('eventData', JSON.stringify(eventData));
        formData.append('imageFile', selectedImageFile);
        
        submitData = formData;
        console.log('📤 FormData送信:', { 
          eventTitle: eventData.title,
          fileName: selectedImageFile.name,
          fileSize: selectedImageFile.size 
        });
        
      } else {
        // JSON形式で送信（画像削除または画像なし）
        submitData = {
          ...data,
          description: data.description?.trim() || undefined,
          image_url: isImageDeleted ? null : undefined,
        };
        
        console.log('📤 JSON送信:', { 
          eventTitle: data.title,
          imageAction: isImageDeleted ? '削除' : '変更なし'
        });
      }

      // 型に応じて適切な関数を呼び出し（mode別に型安全にキャスト）
      if (isEdit) {
        await (onSubmit as (data: UpdateEventRequest | FormData) => Promise<void>)(
          submitData as UpdateEventRequest | FormData
        );
      } else {
        await (onSubmit as (data: CreateEventRequest | FormData) => Promise<void>)(
          submitData as CreateEventRequest | FormData
        );
      }
      
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `イベントの${isEdit ? "更新" : "作成"}に失敗しました`;
      form.setError("root", {type: "manual", message});
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-2 mb-4">
        {form.formState.errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}

        {/* デバッグ用：バリデーションエラーの詳細表示 */}
        {process.env.NODE_ENV === 'development' && Object.keys(form.formState.errors).length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm font-semibold">バリデーションエラー (開発環境のみ):</p>
            <pre className="text-xs text-yellow-700 mt-1">
              {JSON.stringify(form.formState.errors, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-y-8">
          <h3 className="text-xl font-semibold">イベント情報</h3>
        

        {/* タイトル */}
        <FormField
          control={form.control}
          name="title"
          render={({field}) => (
            <FormItem>
              <FormLabel>
                イベントタイトル
                {!isEdit && <span className="text-red-500">*</span>}
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

        {/* 🔧 開催日時 - datetime-localを使うが、フォームフィールドは既存のまま ※ shadcn のフォームコンポーネントは使用しない*/}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            開催日時
            {!isEdit && <span className="text-red-500">*</span>}
          </label>

          <Input
            type="datetime-local"
            className="mb-2 bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
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
          render={({field}) => (
            <FormItem>
              <FormLabel>
                開催場所
                {!isEdit && <span className="text-red-500">*</span>}
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

         {/* 定員 */}
        <FormField
          control={form.control}
          name="capacity"
          render={({field}) => (
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
                    field.onChange(
                      value === "" ? undefined : parseInt(value, 10)
                    );
                  }}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500 mt-1">
                参加可能人数を設定してください（任意・1人以上）
              </p>
            </FormItem>
          )}
        />

        {/* 説明 */}
        <FormField
          control={form.control}
          name="description"
          render={({field}) => (
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
              <p className="text-xs text-gray-500 mt-1">1000文字以内（任意）</p>
            </FormItem>
          )}
        />
        </div>

        <div className="border-t border-blue-200 mt-10 pt-8 space-y-8">
           <h3 className="text-xl font-semibold">イベント画像</h3>

        {/* 画像アップロード - Issue #56対応 */}
        <FormField
          control={form.control}
          name="image_url"
          render={({field, fieldState}) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  type="event"
                  currentUrl={field.value ?? undefined}
                  onImageChange={handleImageChange}
                  showLabel
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormMessage />
              
              {/* デバッグ情報（開発時のみ表示） */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  状態: {selectedImageFile ? 'ファイル選択済み' : '画像なし'}
                  {selectedImageFile && (
                    <span> | ファイル: {selectedImageFile.name} ({Math.round(selectedImageFile.size / 1024)}KB)</span>
                  )}
                  {isImageDeleted && <span> | 削除予定</span>}
                </div>
              )}
            </FormItem>
          )}
        />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            className="flex-1 h-10 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
            disabled={
              form.formState.isSubmitting ||
              isSubmitting ||
              (!localDateTime && !isEdit)
            }
          >
            {form.formState.isSubmitting || isSubmitting ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                {isEdit ? "更新中..." : "作成中..."}
                {selectedImageFile && <span className="text-xs">（画像アップロード含む）</span>}
              </>
            ) : isEdit ? (
              "イベントを更新"
            ) : (
              "イベントを作成"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
