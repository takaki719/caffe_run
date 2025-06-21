"use client";
import React, { useEffect, useRef, useState } from "react";
import { Unity } from "react-unity-webgl";

interface UnityModelProps {
  unityProvider: ReturnType<
    typeof import("react-unity-webgl").useUnityContext
  >["unityProvider"];
}

const UnityModel: React.FC<UnityModelProps> = ({ unityProvider }) => {
  const unityRef = useRef<HTMLDivElement>(null);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [hasContextError, setHasContextError] = useState(false);

  // WebGLサポート確認
  useEffect(() => {
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!gl;
      } catch {
        return false;
      }
    };

    if (!checkWebGLSupport()) {
      setIsWebGLSupported(false);
    }
  }, []);

  // Unity WebGLコンテキストエラーの予防
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setHasContextError(true);
    };

    const handleContextRestored = () => {
      setHasContextError(false);
    };

    // Unityのcanvasを見つける（遅延して見つかる場合もある）
    const findUnityCanvas = () => {
      const canvas = unityRef.current?.querySelector("canvas");
      if (canvas) {
        canvas.addEventListener("webglcontextlost", handleContextLost);
        canvas.addEventListener("webglcontextrestored", handleContextRestored);
        return canvas;
      }
      return null;
    };

    // 初期チェック
    let canvas = findUnityCanvas();

    // canvasが見つからない場合は少し待ってから再試行
    let retryCount = 0;
    const retryInterval = setInterval(() => {
      if (!canvas && retryCount < 5) {
        canvas = findUnityCanvas();
        retryCount++;
      } else {
        clearInterval(retryInterval);
      }
    }, 500);

    return () => {
      clearInterval(retryInterval);
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener(
          "webglcontextrestored",
          handleContextRestored,
        );
      }
    };
  }, [unityProvider]);

  // WebGLサポートなしの場合
  if (!isWebGLSupported) {
    return (
      <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
        <div className="text-gray-500 text-center">
          <div className="mb-2">⚠️</div>
          <div>WebGLがサポートされていません</div>
          <div className="text-sm mt-1">モダンなブラウザをご利用ください</div>
        </div>
      </div>
    );
  }

  // WebGLコンテキストエラーの場合
  if (hasContextError) {
    return (
      <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
        <div className="text-gray-500 text-center">
          <div className="mb-2">🔄</div>
          <div>WebGLコンテキストが失われました</div>
          <button
            onClick={() => {
              setHasContextError(false);
              window.location.reload();
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!unityProvider) {
    return (
      <div className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
        <div className="text-gray-500">Unity読み込み中...</div>
      </div>
    );
  }

  return (
    <div
      ref={unityRef}
      className="flex-1 bg-gray-200 rounded-2xl flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full"
    >
      <Unity
        unityProvider={unityProvider}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "1rem",
          display: "block",
        }}
        className="unity-canvas"
        devicePixelRatio={1} // ピクセル比を固定してパフォーマンス安定化
      />
    </div>
  );
};

export default UnityModel;
