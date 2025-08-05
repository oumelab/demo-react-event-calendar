// src/components/ImageUpload.tsx - シンプルな環境変数判定版
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { IMAGE_CONFIGS } from '@shared/image-config';
import axios from 'axios';
import { AlertCircle, Camera, CheckCircle, Link as LinkIcon, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const [showDeleteButton, setShowDeleteButton] = useState(false); // 🎨 削除ボタン表示制御
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
        const actualUrl = currentUrl.replace('uploaded:', '');
        setImageSource('uploaded');
        setUrlInput(''); // URL入力欄は空のまま
        
        if (actualUrl.startsWith('https://')) {
          // 実際のHTTPS URLの場合
          setPreviewUrl(actualUrl);
          setUploadedFileName('uploaded-image'); // ファイル名を推定
          setShowDeleteButton(true); // 🎨 既存画像には削除ボタンを即表示
        } else {
          // キーのみの場合
          setUploadedFileName(actualUrl);
          
          // R2が利用できない環境（ローカル開発）ではプレビューなし
          if (!r2Available) {
            setPreviewUrl(null);
            setShowDeleteButton(false);
          } else {
            // プレビュー・本番環境では環境変数を使用してURL構築
            setPreviewUrl(`${import.meta.env.VITE_R2_PUBLIC_URL}/${actualUrl}`);
            setShowDeleteButton(true); // 🎨 既存画像には削除ボタンを即表示
          }
        }
      } else if (currentUrl.startsWith('https://')) {
        // 通常のURL画像の場合
        setImageSource('url');
        setUrlInput(currentUrl);
        setPreviewUrl(currentUrl);
        setUploadedFileName('');
        setShowDeleteButton(true); // 🎨 既存画像には削除ボタンを即表示
      }
    } else {
      setImageSource('none');
      setUrlInput('');
      setPreviewUrl(null);
      setUploadedFileName('');
      setShowDeleteButton(false); // 🎨 初期状態では削除ボタンなし
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

    console.log('🚀 アップロード開始:', { isUploading: true, progress: 0 });

    try {
      const response = await axios.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // 🐛 修正: 計算順序を正しく修正
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            console.log('📊 アップロード進捗:', progress + '%');
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
        
        // 🎨 即座にプレビュー設定（遅延を削除）
        if (isUrl) {
          // プレビュー・本番環境：実際のURLが返される場合
          setPreviewUrl(uploadedUrlOrKey);
          setShowDeleteButton(false); // 画像読み込み完了まで削除ボタンは非表示
          // ⚠️ 修正: 実際のURLが返されてもアップロード画像として扱う
          onUploadComplete(`uploaded:${uploadedUrlOrKey}`);
        } else {
          // ローカル環境：keyが返される場合
          if (!r2Available) {
            // ローカル環境では Blob URL をプレビューに使用
            const blobUrl = URL.createObjectURL(file);
            setPreviewUrl(blobUrl);
            setShowDeleteButton(false); // 画像読み込み完了まで削除ボタンは非表示
            console.log('ローカル R2 キー:', uploadedUrlOrKey);
          } else {
            // この分岐は通常発生しないが、念のため
            const fullUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${uploadedUrlOrKey}`;
            setPreviewUrl(fullUrl);
            setShowDeleteButton(false); // 画像読み込み完了まで削除ボタンは非表示
          }
          // フォームには特別な形式で設定（バリデーション回避）
          onUploadComplete(`uploaded:${uploadedUrlOrKey}`);
        }
      } else {
        throw new Error('アップロードされた画像の情報が取得できませんでした');
      }

      // 🎨 改善: 成功メッセージとプログレスバーを段階的に消去
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: 0, // プログレスをリセット
        }));
      }, 1000); // 1秒後にプログレスをリセット

      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          success: null,
        }));
      }, 3000); // 3秒後に成功メッセージを消去

    } catch (error) {
      // アップロードエラー時もプレビューをクリア
      setPreviewUrl(null);
      setImageSource('none');
      setUploadedFileName('');
      setShowDeleteButton(false); // 🎨 エラー時は削除ボタンも非表示
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
    setShowDeleteButton(true); // 🎨 URL画像にも削除ボタンを表示
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
    setShowDeleteButton(false); // 🎨 削除ボタンも非表示
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
          <div className="space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600">アップロード中...</p>
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">{uploadProgress.progress}%</p>
            </div>
          </div>
        )}

        {/* プレビュー表示 */}
        {!uploadProgress.isUploading && previewUrl && (
          <div className="space-y-3">
            <div className="relative inline-block">
              {/* 🎨 ローディング表示（画像読み込み中） */}
              {!showDeleteButton && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                  <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" />
                </div>
              )}
              
              <img
                src={previewUrl}
                alt="プレビュー"
                className={`
                  object-cover rounded-md shadow-sm transition-opacity duration-300
                  ${showDeleteButton ? 'opacity-100' : 'opacity-0'}
                  ${type === 'avatar' 
                    ? 'w-24 h-24 rounded-full' 
                    : 'w-48 h-32 aspect-[3/2]' // 🎨 固定サイズ（3:2比率）
                  }
                `}
                onLoad={() => {
                  // 🎨 画像読み込み完了後に削除ボタンを表示
                  console.log('画像読み込み完了');
                  setShowDeleteButton(true);
                }}
                onError={(e) => {
                  console.error('プレビュー画像の読み込みに失敗:', previewUrl);
                  setShowDeleteButton(true); // エラー時も削除ボタンを表示
                  // エラー時は画像を非表示にする（無限ループ防止）
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* 🎨 削除ボタンを画像読み込み後に表示 */}
              {showDeleteButton && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 animate-in fade-in duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearPreview();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
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

        {/* アップロード済み画像（プレビューなし）の表示 - ローカル環境専用 */}
        {!uploadProgress.isUploading && !previewUrl && imageSource === 'uploaded' && uploadedFileName && (
          <div className="space-y-3">
            <div className="relative inline-block">
              {/* 🎨 ローカル環境でもプレビュー環境と同じサイズのプレースホルダー */}
              <div className="w-48 h-32 bg-gray-100 rounded-md flex items-center justify-center aspect-[3/2]">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              
              {/* 🎨 ローカル環境でも削除ボタンを同じ位置に表示 */}
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
          <div className="flex gap-2 text-sm">
            <Camera className="size-5 text-gray-500" />
            <span className="flex-1 text-gray-700">
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