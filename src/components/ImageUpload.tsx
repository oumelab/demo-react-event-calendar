// src/components/ImageUpload.tsx - プレビュー高速化版
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { IMAGE_CONFIGS } from '@shared/image-config';
import { AlertCircle, Camera, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type ImageType = 'avatar' | 'event';

interface ImageUploadProps {
  type: ImageType;
  currentUrl?: string;
  onImageChange: (data: { type: 'none' | 'file'; file?: File }) => void;
  showLabel?: boolean;
  disabled?: boolean;
  error?: string;
}

interface PreviewProgress {
  isCreating: boolean;
  progress: number;
  error: string | null;
}


export function ImageUpload({
  type,
  currentUrl,
  onImageChange,
  showLabel = true,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageSource, setImageSource] = useState<'none' | 'uploaded'>('none');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [tempBlobUrl, setTempBlobUrl] = useState<string | null>(null); // 🚀 一時的なBlob URLを保持
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<PreviewProgress>({
    isCreating: false,
    progress: 0,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = useAuthStore((state) => !!state.user);
  
  // 環境変数の有無で R2 利用可能性を判定
  const r2Available = !!(import.meta.env.VITE_R2_PUBLIC_URL);

  const config = IMAGE_CONFIGS[type];
  const actualMaxSize = config.maxSize;

  // 🚀 Blob URLのクリーンアップ
  useEffect(() => {
    return () => {
      if (tempBlobUrl) {
        URL.revokeObjectURL(tempBlobUrl);
      }
    };
  }, [tempBlobUrl]);

  // 初期化時に既存の画像を設定（編集時のアップロード済み画像表示用）
  useEffect(() => {
    if (currentUrl) {
      // アップロード済み画像の表示
      setImageSource('uploaded');
      
      if (currentUrl.startsWith('https://')) {
        // 実際のHTTPS URLの場合（本番環境）
        setPreviewUrl(currentUrl);
        setUploadedFileName('uploaded-image');
        setShowDeleteButton(true);
      } else {
        // R2キーの場合（ローカル開発または本番のキー）
        setUploadedFileName(currentUrl);
        
        if (!r2Available) {
          // ローカル開発：プレビューなし
          setPreviewUrl(null);
          setShowDeleteButton(true); // 削除は可能
        } else {
          // 本番環境：URL構築してプレビュー
          setPreviewUrl(`${import.meta.env.VITE_R2_PUBLIC_URL}/${currentUrl}`);
          setShowDeleteButton(true);
        }
      }
    } else {
      // 画像なし
      setImageSource('none');
      setPreviewUrl(null);
      setUploadedFileName('');
      setShowDeleteButton(false);
    }
  }, [currentUrl, r2Available]);

  // エラーメッセージの表示制御
  const hasError = !!error || !!validationError || !!previewProgress.error;
  const errorMessage = error || validationError || previewProgress.error;

  // エラーの自動消去（プレビューエラーのみ）
  useEffect(() => {
    if (previewProgress.error) {
      const timer = setTimeout(() => {
        setPreviewProgress(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [previewProgress.error]);

  // エラークリア関数
  const clearError = useCallback(() => {
    setValidationError(null);
    setPreviewProgress(prev => ({ ...prev, error: null }));
  }, []);

  // ファイルバリデーション
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!config.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `対応していないファイル形式です。${config.allowedTypes.map(type => type.split('/')[1]).join(', ')}形式のファイルを選択してください。`
      };
    }

    if (file.size > actualMaxSize) {
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます。${Math.round(actualMaxSize / 1024 / 1024)}MB以下のファイルを選択してください。`
      };
    }

    return { isValid: true };
  }, [config, actualMaxSize]);


  // ファイル処理（プレビュー専用）
  const processFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      // バリデーションエラー時はプレビューをクリア
      if (tempBlobUrl) {
        URL.revokeObjectURL(tempBlobUrl);
        setTempBlobUrl(null);
      }
      setPreviewUrl(null);
      setImageSource('none');
      setUploadedFileName('');
      setShowDeleteButton(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setValidationError(validation.error || 'ファイルが無効です');
      onImageChange({ type: 'none' });
      return;
    }

    // プレビュー作成進捗を開始
    setPreviewProgress({ isCreating: true, progress: 0, error: null });
    setValidationError(null);

    // FileReaderでプログレス付きでファイルを読み込み
    const reader = new FileReader();
    
    reader.onprogress = (e: ProgressEvent<FileReader>) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setPreviewProgress(prev => ({ ...prev, progress }));
      }
    };
    
    reader.onload = () => {
      // プレビュー表示とファイル保存
      const blobUrl = URL.createObjectURL(file);
      setTempBlobUrl(blobUrl);
      setPreviewUrl(blobUrl);
      setImageSource('uploaded');
      setUploadedFileName(file.name);
      setShowDeleteButton(true);
      setPreviewProgress({ isCreating: false, progress: 100, error: null });
      
      // 親コンポーネントに通知
      onImageChange({ type: 'file', file });
      console.log('📁 プレビュー作成完了:', { name: file.name, size: file.size, type: file.type });
    };
    
    reader.onerror = () => {
      setPreviewProgress({ isCreating: false, progress: 0, error: 'ファイルの読み込みに失敗しました' });
    };
    
    // ファイル読み込み開始
    reader.readAsArrayBuffer(file);
  }, [validateFile, onImageChange, tempBlobUrl]);

  // ドラッグ&ドロップハンドラー
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || previewProgress.isCreating) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // 🚀 ドロップ時はprocessFileを使用してプレビュー進捗表示
      processFile(files[0]);
    }
  }, [disabled, previewProgress.isCreating, processFile]);

  // ファイル選択ハンドラー
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      // 🚀 ファイル選択時はprocessFileを使用してプレビュー進捗表示
      processFile(files[0]);
    }
  }, [processFile]);


  // プレビュー削除
  const handleClearPreview = useCallback(() => {
    // 🚀 Blob URLのクリーンアップ
    if (tempBlobUrl) {
      URL.revokeObjectURL(tempBlobUrl);
      setTempBlobUrl(null);
    }
    
    setPreviewUrl(null);
    setImageSource('none');
    setUploadedFileName('');
    setShowDeleteButton(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange({ type: 'none' });
    setPreviewProgress(prev => ({
      ...prev,
      error: null,
    }));
  }, [onImageChange, tempBlobUrl]);

  return (
    <div className="space-y-4">
      {/* ラベル */}
      {showLabel && (
        <Label className={hasError ? 'text-red-600' : 'text-gray-700'}>
          {type === 'event' ? '画像アップロード' : 'アバター画像'}
        </Label>
      )}

      {/* アップロードエリア - 固定高さでレイアウトシフト防止 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          min-h-[240px] flex flex-col items-center justify-center
          ${dragActive 
            ? 'border-sky-500 bg-sky-50' 
            : hasError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-sky-400 hover:bg-sky-50'
          }
          ${disabled || previewProgress.isCreating ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !previewProgress.isCreating && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={config.allowedTypes.join(',')}
          onChange={handleFileChange}
          disabled={disabled}
        />

        {/* 🚀 プレビュー表示（シンプル版） */}
        {!previewProgress.isCreating && previewUrl && (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="プレビュー"
                className={`
                  object-cover rounded-md shadow-sm
                  ${type === 'avatar' 
                    ? 'w-24 h-24 rounded-full' 
                    : 'w-48 h-32 aspect-[3/2]'
                  }
                `}
                onError={(e) => {
                  console.error('プレビュー画像の読み込みに失敗:', previewUrl);
                  // エラー時は画像を非表示にする（無限ループ防止）
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* 削除ボタン */}
              {showDeleteButton && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearPreview();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
           
            <p className="text-sm text-green-600">クリックで別の画像を選択</p>
          </div>
        )}

        {/* プレビュー作成中の進捗 */}
        {previewProgress.isCreating && (
          <div className="space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600">プレビュー作成中...</p>
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${previewProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">{previewProgress.progress}%</p>
            </div>
          </div>
        )}

        {/* アップロード済み画像（プレビューなし）の表示 - ローカル環境専用 */}
        {!previewProgress.isCreating && !previewUrl && imageSource === 'uploaded' && uploadedFileName && (
          <div className="space-y-3">
            <div className="relative inline-block">
              <div className="w-48 h-32 bg-gray-100 rounded-md flex items-center justify-center aspect-[3/2]">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearPreview();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <Camera className="h-4 w-4" />
                <span>アップロード済み</span>
                {!r2Available && <span className="text-xs text-gray-500">（ローカル環境）</span>}
              </div>
              <p className="text-xs text-gray-500 truncate max-w-xs mx-auto">
                {uploadedFileName}
              </p>
            </div>
            <p className="text-sm text-green-600">クリックで別の画像を選択</p>
          </div>
        )}

        {/* 通常のアップロードエリア */}
        {!previewProgress.isCreating && !previewUrl && imageSource === 'none' && (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                画像をドラッグ&ドロップまたはクリックして選択
              </p>
              <p className="text-xs text-gray-500">
                {config.allowedTypes.map(type => type.split('/')[1]).join(', ')} / 
                最大{Math.round(actualMaxSize / 1024 / 1024)}MB
              </p>
              {!r2Available && (
                <p className="text-xs text-yellow-600">
                  ローカル環境では画像プレビューが制限されます
                </p>
              )}
              {!isAuthenticated && (
                <p className="text-xs text-orange-600">
                  ⚠️ 画像をアップロードするにはログインが必要です
                </p>
              )}
            </div>
          </div>
        )}
      </div>


      {/* エラー表示 */}
      {hasError && (
        <div className="p-3 rounded-md border bg-red-50 border-red-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{errorMessage}</span>
            </div>
            {(previewProgress.error || validationError) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• ファイルサイズ上限: {Math.round(actualMaxSize / 1024 / 1024)}MB</p>
        <p>• 対応形式: JPEG、PNG、WebP</p>
        {config.resize && (
          <p>• 推奨比率: {type === 'event' ? '16:9 または 4:3' : '1:1（正方形）'}</p>
        )}
        {!r2Available && (
          <p className="text-yellow-600">• ローカル環境では R2 接続が制限されるため、画像プレビューが制限されます</p>
        )}
      </div>
    </div>
  );
}