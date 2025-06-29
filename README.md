# Caffe-Run

![logo](https://github.com/user-attachments/assets/aeac4111-073b-433c-8ba0-51f8506ddab1)

カフェインの効果を最適化し、集中力を最大化するためのWebアプリケーションです。科学的根拠に基づいてカフェイン摂取タイミングを計算し、個人の生活リズムに合わせた最適な計画を提案します。  
deploy先 -> https://caffe-run-flax.vercel.app/


技育CAMPハッカソン Vol.5 に出場し、努力賞を受賞しました！
<img width="358" alt="image" src="https://github.com/user-attachments/assets/2fe28879-0509-4f8e-a880-71c44e160c74" />
https://x.com/geek_pjt/status/1936716140849590644


## 主な機能

- **カフェイン効果の予測**: 科学的モデルに基づいてカフェインの血中濃度と集中力への影響を可視化
- **個別最適化**: 睡眠時間、集中時間、既存のカフェイン摂取履歴を考慮した個人向けプラン生成
- **3Dキャラクター表示**: Unity WebGLを使用したリアルタイム集中力可視化
- **履歴管理**: カフェイン摂取記録の自動保存と分析

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **3D表示**: Unity WebGL, react-unity-webgl
- **データ可視化**: Recharts
- **UI コンポーネント**: Headless UI
- **開発ツール**: ESLint, Prettier


## カフェイン最適化アルゴリズム

本アプリケーションは以下の科学的モデルに基づいています：

1. **薬物動態学モデル**: カフェインの吸収・代謝・排出をシミュレーション
2. **概日リズム**: 体内時計に基づく覚醒度の変動を考慮
3. **個人差**: 体重、代謝率、カフェイン耐性を反映
4. **最適化アルゴリズム**: 目標集中力を維持しつつ副作用を最小化

