// components/UnityLoading.tsx
interface UnityLoadingProps {
  loadingProgression: number;
}

const UnityLoading: React.FC<UnityLoadingProps> = ({ loadingProgression }) => {
  const percentage = Math.round(loadingProgression * 100);

  return (
    <div className="flex-1 bg-gray-200 rounded-2xl flex flex-col items-center justify-center h-[240px] sm:h-[320px] lg:h-[420px] w-full">
      <div className="text-gray-500 mb-3">
        Unityモデル読み込み中... {percentage}%
      </div>
      <div className="w-3/4 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default UnityLoading;
