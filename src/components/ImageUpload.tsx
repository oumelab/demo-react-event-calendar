// src/components/ImageUpload.tsx - シンプルな環境変数判定版
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, X, Trash2, Camera, Link as LinkIcon } from 'lucide-react';
import { IMAGE_CONFIGS } from '@shared/image-config';
import { useAuthStore } from '@/stores/auth-store';
import axios from 'axios';

type ImageType = 'avatar' | 'event';

interface ImageUploadProps {
  type: ImageType;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  showUrlInput?: boolean;
  showLabel?: boolean;
  disabled?: boolean;
  error?: string;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

export function ImageUpload({
  type,
  currentUrl,
  onUploadComplete,
  showUrlInput = true,
  showLabel = true,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageSource, setImageSource] = useState<'none' | 'uploaded' | 'url'>('none');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = useAuthStore((state) => !!state.user);
  
  // 環境変数の有無で R2 利用可能性を判定
  const r2Available = !!(import.meta.env.VITE_R2_PUBLIC_URL);

  const config = IMAGE_CONFIGS[type];
  const actualMaxSize = config.maxSize;

  // 初期化時に既存の画像を設定
  useEffect(() => {
    if (currentUrl) {
      if (currentUrl.startsWith('uploaded:')) {
        // アップロード済み画像の場合
        const fileName = currentUrl.replace('uploaded:', '');
        setImageSource('uploaded');
        setUploadedFileName(fileName);
        setUrlInput(''); // URL入力欄は空のまま
        
        // R2が利用できない環境（ローカル開発）ではプレビューなし
        if (!r2Available) {
          setPreviewUrl(null);
        } else {
          // プレビュー・本番環境では実際の URL を構築
          if (fileName.startsWith('https://')) {
            setPreviewUrl(fileName);
          } else {
            // R2のkeyの場合、環境変数を使用してURL構築
            setPreviewUrl(`${import.meta.env.VITE_R2_PUBLIC_URL}/${fileName}`);
          }
        }
      } else if (currentUrl.startsWith('https://')) {
        // 通常のURL画像の場合
        setImageSource('url');
        setUrlInput(currentUrl);
        setPreviewUrl(currentUrl);
        setUploadedFileName('');
      }
    } else {
      setImageSource('none');
      setUrlInput('');
      setPreviewUrl(null);
      setUploadedFileName('');
    }
  }, [currentUrl, r2Available]);

  // エラーメッセージの表示制御
  const hasError = !!error || !!uploadProgress.error;
  const errorMessage = error || uploadProgress.error;

  // エラーの自動消去（アップロードエラーのみ）
  useEffect(() => {
    if (uploadProgress.error) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress.error]);

  // エラークリア関数
  const clearError = useCallback(() => {
    setUploadProgress(prev => ({ ...prev, error: null }));
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

  // URLバリデーション
  const validateAndSanitizeUrl = useCallback((url: string): ValidationResult => {
    if (!url.trim()) {
      return { isValid: false, error: 'URLを入力してください' };
    }

    try {
      const urlObj = new URL(url.trim());
      if (urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'HTTPS URLのみ対応しています' };
      }
      return { isValid: true, sanitizedUrl: urlObj.toString() };
    } catch {
      return { isValid: false, error: '有効なURLを入力してください' };
    }
  }, []);

  // ファイルアップロード処理
  const uploadFile = useCallback(async (file: File) => {
    if (!isAuthenticated) {
      setUploadProgress(prev => ({
        ...prev,
        error: 'ログインが必要です',
      }));
      return;
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgress(prev => ({
        ...prev,
        error: validation.error || 'ファイルが無効です',
      }));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setUploadProgress({
      isUploading: true,
      progress: 0,
      error: null,
      success: null,
    });

    try {
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, progress }));
          }
        },
      });

      setUploadProgress({
        isUploading: false,
        progress: 100,
        error: null,
        success: 'アップロードが完了しました',
      });

      const data = response.data?.data;
      const uploadedUrlOrKey = data?.url || data?.key;
      const fileName = data?.fileName || file.name;
      
      if (uploadedUrlOrKey) {
        const isUrl = uploadedUrlOrKey.startsWith('http');
        
        setImageSource('uploaded');
        setUploadedFileName(fileName);
        setUrlInput(''); // アップロード画像の場合はURL入力欄を空にする
        
        if (isUrl) {
          // 本番環境：実際のURLを使用
          setPreviewUrl(uploadedUrlOrKey);
          onUploadComplete(uploadedUrlOrKey);
        } else {
          // ローカル・プレビュー・本番環境での R2 処理
          if (!r2Available) {
            // ローカル環境では R2 エミュレーションを使用
            // keyが返される場合、Blob URL をプレビューに使用
            const blobUrl = URL.createObjectURL(file);
            setPreviewUrl(blobUrl);
          } else {
            // プレビュー・本番環境では環境変数を使用してURL構築  
            const fullUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${uploadedUrlOrKey}`;
            setPreviewUrl(fullUrl);
          }
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
      setImageSource('none');
      setUploadedFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
  }, [isAuthenticated, validateFile, type, onUploadComplete, r2Available]);

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
      uploadFile(files[0]);
    }
  }, [disabled, uploadProgress.isUploading, uploadFile]);

  // ファイル選択ハンドラー
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  }, [uploadFile]);

  // URL入力ハンドラー
  const handleUrlSubmit = useCallback(() => {
    const validation = validateAndSanitizeUrl(urlInput);
    
    if (!validation.isValid) {
      setUploadProgress(prev => ({
        ...prev,
        error: validation.error || '無効なURLです',
      }));
      return;
    }

    const sanitizedUrl = validation.sanitizedUrl!;
    setPreviewUrl(sanitizedUrl);
    setUrlInput(sanitizedUrl);
    setImageSource('url');
    setUploadedFileName('');
    onUploadComplete(sanitizedUrl);
    
    setUploadProgress(prev => ({
      ...prev,
      error: null,
      success: 'URLが設定されました',
    }));

    // 成功メッセージを3秒後に消去
    setTimeout(() => {
      setUploadProgress(prev => ({
        ...prev,
        success: null,
      }));
    }, 3000);
  }, [urlInput, validateAndSanitizeUrl, onUploadComplete]);

  // プレビュー削除
  const handleClearPreview = useCallback(() => {
    setPreviewUrl(null);
    setUrlInput('');
    setImageSource('none');
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
    setUploadProgress(prev => ({
      ...prev,
      error: null,
      success: null,
    }));
  }, [onUploadComplete]);

  return (
    <div className="space-y-4">
      {/* ラベル */}
      {showLabel && (
        <Label className={hasError ? 'text-red-600' : 'text-gray-700'}>
          {type === 'event' ? 'イベント画像' : 'アバター画像'}
        </Label>
      )}

      {/* アップロードエリア */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-sky-500 bg-sky-50' 
            : hasError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-sky-400 hover:bg-sky-50'
          }
          ${disabled || uploadProgress.isUploading ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploadProgress.isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={config.allowedTypes.join(',')}
          onChange={handleFileChange}
          disabled={disabled || uploadProgress.isUploading}
        />

        {/* アップロード中の進捗 */}
        {uploadProgress.isUploading && (
          <div className="space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600">アップロード中...</p>
            <Progress value={uploadProgress.progress} className="w-full" />
            <p className="text-xs text-gray-500">{uploadProgress.progress}%</p>
          </div>
        )}

        {/* プレビュー表示 */}
        {!uploadProgress.isUploading && previewUrl && (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="プレビュー"
                className={`
                  max-w-full max-h-48 object-cover rounded-md shadow-sm
                  ${type === 'avatar' ? 'w-24 h-24 rounded-full' : 'w-auto h-32'}
                `}
                onError={(e) => {
                  console.error('プレビュー画像の読み込みに失敗:', previewUrl);
                  // エラー時は画像を非表示にする（無限ループ防止）
                  e.currentTarget.style.display = 'none';
                }}
              />
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
            
            {/* 画像の種類を示すバッジ */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {imageSource === 'uploaded' ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Camera className="h-4 w-4" />
                  <span>アップロード済み</span>
                  {!r2Available && <span className="text-xs text-gray-500">（ローカル環境）</span>}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-blue-600">
                  <LinkIcon className="h-4 w-4" />
                  <span>外部URL画像</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-green-600">クリックで別の画像を選択</p>
          </div>
        )}

        {/* アップロード済み画像（プレビューなし）の表示 */}
        {!uploadProgress.isUploading && !previewUrl && imageSource === 'uploaded' && uploadedFileName && (
          <div className="space-y-3">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-md flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearPreview();
                }}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                削除
              </Button>
            </div>
            <p className="text-sm text-green-600">クリックで別の画像を選択</p>
          </div>
        )}

        {/* 通常のアップロードエリア */}
        {!uploadProgress.isUploading && !previewUrl && imageSource === 'none' && (
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
            </div>
          </div>
        )}
      </div>

      {/* URL入力（オプション）- アップロード画像の場合は非表示 */}
      {showUrlInput && imageSource !== 'uploaded' && (
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

      {/* アップロード画像の場合のメッセージ */}
      {imageSource === 'uploaded' && showUrlInput && (
        <div className="p-3 rounded-md border bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Camera className="h-4 w-4" />
            <span>
              {!r2Available 
                ? 'アップロード済み画像を使用中です（ローカル環境のため画像プレビューは制限されます）。URLを使用したい場合は、上記の画像を削除してからURL入力してください。' 
                : 'アップロード済み画像を使用中です。URLを使用したい場合は、上記の画像を削除してからURL入力してください。'
              }
            </span>
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
        {!r2Available && (
          <p className="text-yellow-600">• ローカル環境では R2 接続が制限されるため、画像プレビューが制限されます</p>
        )}
      </div>
    </div>
  );
}