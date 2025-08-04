import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { IMAGE_CONFIGS } from '@shared/image-config';
import axios from 'axios';

interface ImageUploadProps {
  type: 'avatar' | 'event';
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  maxSize?: number;
  aspectRatio?: number;
  disabled?: boolean;
  showUrlInput?: boolean;
  showLabel?: boolean; // ラベル表示制御
  error?: string; // React Hook Form からのエラー状態
  hideUrlForUploaded?: boolean; // アップロード画像のURL表示制御
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

export function ImageUpload({
  type,
  currentUrl,
  onUploadComplete,
  maxSize,
  aspectRatio,
  disabled = false,
  showUrlInput = true,
  showLabel = true, // デフォルトでラベル表示
  error, // React Hook Form からのエラー
  hideUrlForUploaded = true, // デフォルトでアップロード画像のURL非表示
}: ImageUploadProps) {
  // Zustandストアから認証状態を取得
  const isAuthenticated = useAuthStore((state) => !!state.user);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
  });
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // バックエンドと共有する画像設定を使用
  const config = IMAGE_CONFIGS[type];
  const actualMaxSize = maxSize || config.maxSize;

  // フロントエンド専用の表示設定
  const displayConfig = {
    avatar: {
      description: 'プロフィール画像',
    },
    event: {
      description: 'イベント画像',
    },
  };

  const display = displayConfig[type];

  // URL検証とサニタイズ
  const validateAndSanitizeUrl = (url: string): { isValid: boolean; sanitizedUrl?: string; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, error: 'URLを入力してください' };
    }

    try {
      const urlObj = new URL(url);
      
      // HTTPSのみ許可（セキュリティ対策）
      if (urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'HTTPS URLのみ対応しています' };
      }

      // バックエンド設定と同じ拡張子チェック
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const pathname = urlObj.pathname.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => pathname.endsWith(ext));
      
      if (!hasValidExtension) {
        return { isValid: false, error: '画像ファイル（jpg, png, webp）のURLを入力してください' };
      }

      return { isValid: true, sanitizedUrl: urlObj.toString() };
    } catch {
      return { isValid: false, error: '有効なURLを入力してください' };
    }
  };

  // ファイル検証（バックエンドと同じロジック）
  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return '画像ファイルを選択してください';
    }

    if (!config.allowedTypes.includes(file.type)) {
      return 'JPEG、PNG、WebP形式の画像のみアップロード可能です';
    }

    if (file.size > actualMaxSize) {
      return `ファイルサイズは${Math.round(actualMaxSize / 1024 / 1024)}MB以下にしてください`;
    }

    return null;
  }, [config.allowedTypes, actualMaxSize]);

  // バリデーションエラーの統合管理
  const hasError = !!(uploadProgress.error || error);
  const errorMessage = uploadProgress.error || error;

  // 🆕 アップロード画像かどうかを判定
  const isUploadedImage = useCallback((url?: string) => {
    if (!url) return false;
    return url.startsWith('uploaded:') || 
           url.includes('.r2.dev/') || 
           url.includes('images.') || // カスタムドメイン想定
           url.match(/^[^/]+\/[^/]+\/\d+-[a-z0-9]+\.(jpg|jpeg|png|webp)$/i); // key形式
  }, []);

  // URL入力欄での表示値を決定
  const getDisplayUrl = useCallback((url?: string) => {
    if (!url) return '';
    
    // アップロード画像の場合、ユーザーフレンドリーな表示
    if (hideUrlForUploaded && isUploadedImage(url)) {
      if (url.startsWith('uploaded:')) {
        return ''; // アップロード画像は空表示
      }
      // R2 URLの場合はファイル名のみ表示
      const match = url.match(/([^/]+\.(jpg|jpeg|png|webp))$/i);
      return match ? `📷 ${match[1]}` : '📷 アップロード済み画像';
    }
    
    return url;
  }, [hideUrlForUploaded, isUploadedImage]);

  // currentUrlの変更に対応
  React.useEffect(() => {
    setPreviewUrl(currentUrl || null);
    setUrlInput(getDisplayUrl(currentUrl));
  }, [currentUrl, getDisplayUrl]);

  // 画像プレビュー生成（セキュリティ対策付き）
  const generatePreview = useCallback((file: File) => {
    // 既存のプレビューURLをクリーンアップ
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // セキュアなBlob URLを生成
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
  }, [previewUrl]); // previewUrlは必要（URL.revokeObjectURLで使用）

  // ファイルアップロード処理
  const uploadFile = useCallback(async (file: File) => {
    if (!isAuthenticated) {
      setUploadProgress(prev => ({
        ...prev,
        error: 'ログインが必要です',
      }));
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadProgress(prev => ({
        ...prev,
        error: validationError,
      }));
      // バリデーションエラーの場合、アップロードを中止し、プレビューもクリア
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploadProgress({
      isUploading: true,
      progress: 0,
      error: null,
      success: null,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // axios を使用してリアルタイム進捗監視付きアップロード
      console.log('Starting upload with axios...');
      
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            console.log('Upload progress:', progress);
            setUploadProgress(prev => ({
              ...prev,
              progress,
            }));
          }
        },
      });

      console.log('Axios response received:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      const result = response.data;
      console.log('Parsed result:', result);
      console.log('result.message:', result.message);
      console.log('result.data:', result.data);

      // バックエンドはsuccessフィールドを返さないため、
      // response.status === 200 で成功判定
      if (response.status !== 200) {
        throw new Error(result.error || 'アップロードに失敗しました');
      }

      // デバッグログ追加
      console.log('Upload success:', result);

      setUploadProgress({
        isUploading: false,
        progress: 100,
        error: null,
        success: result.message || 'アップロードが完了しました',
      });

      // バックエンドからのURLまたはkeyを使用
      const uploadedUrlOrKey = result.data?.url;
      if (uploadedUrlOrKey) {
        console.log('Received from backend:', uploadedUrlOrKey);
        
        // URLかkeyかを判定
        const isUrl = uploadedUrlOrKey.startsWith('http');
        
        if (isUrl) {
          // 本番環境：実際のURLを使用
          console.log('Production mode: using actual URL');
          setPreviewUrl(uploadedUrlOrKey);
          onUploadComplete(uploadedUrlOrKey);
        } else {
          // 開発・プレビュー環境：keyが返されるのでblob URLをプレビューに使用
          console.log('Development/Preview mode: using blob URL for preview, special format for form');
          const blobUrl = URL.createObjectURL(file);
          setPreviewUrl(blobUrl);
          // フォームには特別な形式で設定（バリデーション回避）
          onUploadComplete(`uploaded:${uploadedUrlOrKey}`);
        }
      } else {
        throw new Error('アップロードされた画像の情報が取得できませんでした');
      }

      // 成功メッセージを3秒後に消去
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          success: null,
        }));
      }, 3000);

    } catch (error) {
      // アップロードエラー時もプレビューをクリア
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('Upload error caught:', error);
      console.log('Error type:', typeof error);
      console.log('Is Axios Error:', axios.isAxiosError(error));
      
      if (axios.isAxiosError(error)) {
        console.log('Axios error response:', error.response);
        console.log('Axios error status:', error.response?.status);
        console.log('Axios error data:', error.response?.data);
      }

      setUploadProgress({
        isUploading: false,
        progress: 0,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.error || error.message || 'アップロードに失敗しました'
          : error instanceof Error ? error.message : 'アップロードに失敗しました',
        success: null,
      });
      console.error('Upload error:', error);
    }
  }, [isAuthenticated, validateFile, type, onUploadComplete]);

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

    if (disabled || uploadProgress.isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      generatePreview(files[0]);
      uploadFile(files[0]);
    }
  }, [disabled, uploadProgress.isUploading, generatePreview, uploadFile]);

  // ファイル選択ハンドラー
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      generatePreview(files[0]);
      uploadFile(files[0]);
    }
  }, [generatePreview, uploadFile]);

  // URL入力ハンドラー
  const handleUrlSubmit = useCallback(() => {
    // アップロード画像の表示名の場合は何もしない
    if (urlInput.startsWith('📷')) {
      return;
    }

    const validation = validateAndSanitizeUrl(urlInput);
    
    if (!validation.isValid) {
      setUploadProgress(prev => ({
        ...prev,
        error: validation.error || '無効なURLです',
      }));
      return;
    }

    const sanitizedUrl = validation.sanitizedUrl!;
    console.log('Setting URL:', sanitizedUrl);
    setPreviewUrl(sanitizedUrl);
    onUploadComplete(sanitizedUrl);
    setUploadProgress({
      isUploading: false,
      progress: 0,
      error: null,
      success: 'URLが設定されました',
    });

    setTimeout(() => {
      setUploadProgress(prev => ({
        ...prev,
        success: null,
      }));
    }, 3000);
  }, [urlInput, onUploadComplete]);

  // プレビュー削除（メモリリーク対策）
  const handleRemovePreview = useCallback(() => {
    console.log('Removing preview, current URL:', previewUrl);
    
    // Blob URLの場合はメモリを解放
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setUrlInput('');
    onUploadComplete(''); // 空文字列で明示的にクリア
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // エラー状態もクリア
    setUploadProgress(prev => ({
      ...prev,
      error: null,
      success: null,
    }));
    
    console.log('Preview removed, calling onUploadComplete with empty string');
  }, [previewUrl, onUploadComplete]); // previewUrlは必要（URL.revokeObjectURLで使用）

  // エラークリア（自動消去付き）
  const clearError = useCallback(() => {
    setUploadProgress(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // アップロードエラーの自動消去（React Hook Formエラーは自動消去しない）
  React.useEffect(() => {
    if (uploadProgress.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // 5秒後に自動消去

      return () => clearTimeout(timer);
    }
  }, [uploadProgress.error, clearError]);

  // コンポーネントのアンマウント時にBlob URLをクリーンアップ
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-2">
      {/* ラベル（オプショナル） */}
      {showLabel && (
        <div className={`text-sm font-medium ${hasError ? 'text-red-500' : 'text-gray-700'}`}>
          {display.description}
          {type === 'avatar' && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}

      {/* プレビューエリア */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={`${display.description}プレビュー`}
            className={`rounded-lg border-2 border-gray-200 object-cover ${
              type === 'avatar' 
                ? 'w-24 h-24 rounded-full' 
                : 'w-full max-w-sm h-48'
            }`}
            style={aspectRatio ? { aspectRatio } : {}}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            onClick={handleRemovePreview}
            disabled={disabled || uploadProgress.isUploading}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* ファイルアップロードエリア */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !uploadProgress.isUploading) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={config.allowedTypes.join(', ')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploadProgress.isUploading}
        />

        {uploadProgress.isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-600">
              アップロード中... {uploadProgress.progress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                クリックまたはドラッグ&ドロップで画像をアップロード
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, WEBP, 最大{Math.round(actualMaxSize / 1024 / 1024)}MB
              </p>
              {config.resize && (
                <p className="text-xs text-gray-500">
                  推奨サイズ: {config.resize.width}×{config.resize.height}px
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* URL入力（オプション） */}
      {showUrlInput && (
        <div className="pt-2 space-y-2">
          <Label className="text-sm text-gray-600">
            または画像URLを入力
          </Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled || uploadProgress.isUploading}
              className="flex-1 bg-white/70 border border-zinc-400 focus:ring-sky-500 focus:border-sky-500"
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || uploadProgress.isUploading || !urlInput.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
            >
              設定
            </Button>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {hasError && (
        <div className="p-3 rounded-md border bg-red-50 border-red-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{errorMessage}</span>
            </div>
            {uploadProgress.error && (
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

      {/* 成功表示 */}
      {uploadProgress.success && (
        <div className="p-3 rounded-md border bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-700">{uploadProgress.success}</span>
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
      </div>
    </div>
  );
}