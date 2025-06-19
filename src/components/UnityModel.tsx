"use client";
import React, { useRef } from 'react';
import Script from 'next/script';

// Unityインスタンスの型（anyでも可）
type UnityInstance = any;

interface UnityModelProps {
  // Unityインスタンスを親コンポーネントに渡すためのコールバック関数
  onUnityInstance: (instance: UnityInstance) => void;
}

const UnityModel: React.FC<UnityModelProps> = ({ onUnityInstance }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Unityのローダースクリプトが読み込まれた後に実行される関数
  const handleScriptLoad = () => {
    if (!canvasRef.current) return;

    // `src/unity/index.html` に記載のUnity設定をここに移植します
    const config = {
      dataUrl: "/unity/Build/Downloads.data.br",
      frameworkUrl: "/unity/Build/Downloads.framework.js.br",
      codeUrl: "/unity/Build/Downloads.wasm.br",
      streamingAssetsUrl: "/unity/StreamingAssets",
      companyName: "DefaultCompany",
      productName: "ハッカソン",
      productVersion: "0.1.0",
      showBanner: (msg: string, type: string) => {
        console.log(`Unity Banner: [${type}] ${msg}`);
      },
    };

    // `createUnityInstance` はローダースクリプトによってグローバルに定義されます
    if (typeof (window as any).createUnityInstance === 'function') {
      (window as any).createUnityInstance(canvasRef.current, config, (progress: number) => {
        console.log(`Unity Loading... ${Math.round(progress * 100)}%`);
      }).then((unityInstance: UnityInstance) => {
        // 生成されたインスタンスを親コンポーネント(page.tsx)に渡します
        onUnityInstance(unityInstance);
      }).catch((message: string) => {
        console.error(message);
      });
    }
  };

  return (
    <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
      {/* Unityのローダースクリプトを読み込み、完了時に handleScriptLoad を実行します */}
      <Script
        src="/unity/Build/Downloads.loader.js"
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
      />
      {/* Unityが描画するためのcanvas要素 */}
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl"></canvas>
    </div>
  );
};

export default UnityModel;