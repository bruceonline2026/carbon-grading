import { useCallback, useState } from "react";
import { CheckCircle2, ChevronsRight, XCircle } from "lucide-react";

/**
 * 滑块拼图验证弹窗 —— 原压缩产物 oA 组件逐字迁移
 *
 * 阈值算法（原产物）：轨道总长 j=240px，目标位置 x=200px，容差 v=10px
 *   const N = i / 100 * j;            // 滑块百分比 → 像素
 *   Math.abs(N - x) < v → 成功
 *
 * 交互（原产物）：range input，onMouseDown 按下、onMouseUp/onTouchEnd 触发验证
 *   成功：1s 后调 onSuccess，再 500ms 复位；失败：800ms 复位
 */
interface SliderCaptchaProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Status = "idle" | "verifying" | "success" | "fail";

const TRACK_PX = 240; // 轨道总长
const TARGET_PX = 200; // 缺口位置
const TOLERANCE = 10; // 容差

const BG_URL =
  "https://images.unsplash.com/photo-1674916251976-b64824a5f3de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

export default function SliderCaptcha({ open, onClose, onSuccess }: SliderCaptchaProps) {
  const [pos, setPos] = useState(0); // 滑块位置（百分比 0-100）
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const verify = useCallback(() => {
    setDragging(false);
    setStatus("verifying");
    const px = (pos / 100) * TRACK_PX;
    if (Math.abs(px - TARGET_PX) < TOLERANCE) {
      setStatus("success");
      setTimeout(() => {
        onSuccess();
        setTimeout(() => {
          setPos(0);
          setStatus("idle");
        }, 500);
      }, 1000);
    } else {
      setStatus("fail");
      setTimeout(() => {
        setStatus("idle");
        setPos(0);
      }, 800);
    }
  }, [pos, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => status !== "verifying" && onClose()}
      />
      {/* 弹窗 */}
      <div className="relative w-full max-w-sm bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col gap-4">
          {/* 头部 */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#003366]">安全验证</h3>
            <button
              onClick={onClose}
              disabled={status === "verifying"}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500">请拖动滑块完成拼图，以证明您不是机器人。</p>

          {/* 拼图区 */}
          <div className="relative w-full h-[160px] bg-gray-100 rounded-lg overflow-hidden shadow-inner group select-none">
            <img
              src={BG_URL}
              alt="Verification background"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.2";
              }}
            />
            {/* 缺口 */}
            <div
              className="absolute w-10 h-10 bg-black/50 border border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] z-10"
              style={{ top: "60px", left: `${TARGET_PX}px` }}
            />
            {/* 拼图块 */}
            <div
              className="absolute w-10 h-10 z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/80 will-change-transform"
              style={{
                top: "60px",
                left: `${(pos / 100) * TRACK_PX}px`,
                backgroundImage: `url('${BG_URL}')`,
                backgroundPosition: `${-(pos / 100) * TRACK_PX}px -60px`,
                backgroundSize: "336px 160px",
              }}
            />
            {status === "success" && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px] z-30">
                <div className="bg-white text-green-700 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> 验证通过
                </div>
              </div>
            )}
            {status === "fail" && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px] z-30">
                <div className="bg-white text-red-600 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> 验证失败
                </div>
              </div>
            )}
          </div>

          {/* 滑块轨道 */}
          <div className="relative w-full h-10 bg-gray-100 rounded-full mt-2 select-none border border-gray-200">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-medium">
              {status === "idle" ? "拖动滑块完成拼图" : status === "verifying" ? "验证中..." : ""}
            </div>
            {/* 进度条 */}
            <div
              className={
                "absolute left-0 top-0 bottom-0 rounded-full bg-sky-200/50 " +
                (status === "fail" ? "bg-red-200/50" : "") +
                (status === "success" ? "bg-green-200/50" : "")
              }
              style={{ width: `${pos}%` }}
            />
            {/* range input（透明，承载拖动） */}
            <input
              type="range"
              min="0"
              max="100"
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              onMouseDown={() => setDragging(true)}
              onMouseUp={verify}
              onTouchEnd={verify}
              disabled={status === "success" || status === "verifying"}
              className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-40"
              aria-label="滑块验证"
            />
            {/* 滑块按钮 */}
            <div
              className={
                "absolute top-0 bottom-0 w-12 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center pointer-events-none z-30 " +
                (dragging ? "scale-105 bg-[#003366] border-[#003366] " : "") +
                (status === "success" ? "bg-green-600 border-green-600 " : "") +
                (status === "fail" ? "bg-red-600 border-red-600 " : "")
              }
              style={{ left: `calc(${pos}% - 24px)` }}
            >
              {status === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : status === "fail" ? (
                <XCircle className="w-5 h-5 text-white" />
              ) : (
                <ChevronsRight
                  className={"w-5 h-5 text-gray-500 " + (dragging ? "text-white" : "")}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
