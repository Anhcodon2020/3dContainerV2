import React, { useState } from 'react';
import {
  Boxes,
  Container,
  Scale,
  Sparkles,
  RotateCw,
  Layers,
  Palette,
  Package,
  Plus,
  Trash2,
  Copy,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Maximize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListOrdered
} from 'lucide-react';
import {
  ContainerDef,
  PackingResult,
  PalletConfig,
  PalletStandard,
  LoadingSequenceStrategy
} from '../types/logistics';
import { STANDARD_PALLET_PRESETS, calculateCbm } from '../utils/containerStorage';

interface SidebarConfigProps {
  isOpen: boolean;
  onClose: () => void;
  containers: ContainerDef[];
  activeContainer: ContainerDef;
  onSelectContainer: (container: ContainerDef) => void;
  pallets: PalletConfig[];
  activePalletId: string;
  onSelectActivePallet: (id: string) => void;
  onUpdatePallet: (updated: PalletConfig) => void;
  onAddPallet: (standardType?: PalletStandard) => void;
  onDeletePallet: (id: string) => void;
  onDuplicatePallet: (id: string) => void;
  onQuickChangeQuantity: (id: string, delta: number) => void;
  onAutoFillContainer: () => void;
  packingResult: PackingResult;
  onOpenContainerManager: () => void;
  customMaxHeightMm?: number;
  onCustomMaxHeightChange: (heightMm: number | undefined) => void;
  onOpenCustomPalletModal?: () => void;
  loadingStrategy?: LoadingSequenceStrategy;
  onChangeLoadingStrategy?: (strategy: LoadingSequenceStrategy) => void;
  onReorderPallets?: (fromIndex: number, toIndex: number) => void;
  onChangePalletPriority?: (palletId: string, priority: number) => void;
}

export const SidebarConfig: React.FC<SidebarConfigProps> = ({
  isOpen,
  onClose,
  containers,
  activeContainer,
  onSelectContainer,
  pallets,
  activePalletId,
  onSelectActivePallet,
  onUpdatePallet,
  onAddPallet,
  onDeletePallet,
  onDuplicatePallet,
  onQuickChangeQuantity,
  onAutoFillContainer,
  packingResult,
  onOpenContainerManager,
  customMaxHeightMm,
  onCustomMaxHeightChange,
  onOpenCustomPalletModal,
  loadingStrategy = 'priority_order',
  onChangeLoadingStrategy,
  onReorderPallets,
  onChangePalletPriority
}) => {
  const [activeTab, setActiveTab] = useState<'pallets' | 'container' | 'balance'>('pallets');

  const currentPallet = pallets.find(p => p.id === activePalletId) || pallets[0];

  // Handle standard preset selection for active pallet
  const handlePresetChange = (presetKey: PalletStandard) => {
    if (!currentPallet) return;
    const preset = STANDARD_PALLET_PRESETS[presetKey];
    const newL = preset.lengthMm;
    const newW = preset.widthMm;
    const newH = preset.heightMm;
    const newTare = preset.tareKg;
    const newCbm = calculateCbm(newL, newW, newH);

    onUpdatePallet({
      ...currentPallet,
      standardType: presetKey,
      name: `${preset.name}`,
      lengthMm: newL,
      widthMm: newW,
      heightMm: newH,
      palletTareKg: newTare,
      totalWeightKg: newTare + currentPallet.cargoWeightKg,
      cbmPerPallet: newCbm
    });
  };

  // Update specific dimension
  const handleDimensionChange = (
    key: 'lengthMm' | 'widthMm' | 'heightMm' | 'palletTareKg' | 'cargoWeightKg' | 'quantity',
    value: number
  ) => {
    if (!currentPallet) return;
    const nextVal = Math.max(0, value);
    const updated = { ...currentPallet, [key]: nextVal };

    if (key === 'lengthMm' || key === 'widthMm' || key === 'heightMm') {
      updated.cbmPerPallet = calculateCbm(updated.lengthMm, updated.widthMm, updated.heightMm);
    }
    if (key === 'palletTareKg' || key === 'cargoWeightKg') {
      updated.totalWeightKg = updated.palletTareKg + updated.cargoWeightKg;
    }
    onUpdatePallet(updated);
  };

  // Direct total weight (kg) change with two-way sync to cargoWeightKg
  const handleTotalWeightChange = (newTotal: number) => {
    if (!currentPallet) return;
    const total = Math.max(0, newTotal);
    const tare = currentPallet.palletTareKg || 25;
    const newCargo = Math.max(0, total - tare);
    onUpdatePallet({
      ...currentPallet,
      totalWeightKg: total,
      cargoWeightKg: newCargo
    });
  };

  const cog = packingResult.centerOfGravity;
  const axle = packingResult.axleDistribution;

  if (!isOpen) return null;

  return (
    <aside className="fixed top-16 left-0 bottom-0 z-20 w-full sm:w-[440px] bg-slate-950/95 border-r border-slate-800/80 shadow-2xl flex flex-col text-slate-200 select-none overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('pallets')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'pallets'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Danh Sách Pallet ({pallets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('container')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'container'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Container className="w-3.5 h-3.5" />
          <span>Container</span>
        </button>

        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'balance'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Cân Bằng CoG</span>
        </button>
      </div>

      {/* Tab Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
        {/* ================= TAB 1: PALLET CARGO MANIFEST ================= */}
        {activeTab === 'pallets' && (
          <div className="space-y-4">
            {/* Quick Multi-Pallet Action Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                {onOpenCustomPalletModal ? (
                  <button
                    onClick={onOpenCustomPalletModal}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                    title="Nhập riêng một loại pallet mới với số đo và số kg tự chọn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nhập Riêng Loại Pallet Mới</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onAddPallet('eur1')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                    title="Thêm một loại / lô pallet mới vào container"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Loại Pallet Mới</span>
                  </button>
                )}

                <button
                  onClick={onAutoFillContainer}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  title="Tự động tăng số lượng pallet để lấp kín không gian sàn hoặc 2 tầng container"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" />
                  <span>Xếp Kín Cont</span>
                </button>
              </div>
            </div>

            {/* Loading Strategy Selector Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <span>Thứ Tự Đóng Hàng Vào Container:</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  {loadingStrategy === 'priority_order' ? 'Chỉ định 1, 2, 3' : loadingStrategy === 'heavy_first' ? 'Nặng trước' : loadingStrategy === 'volume_first' ? 'To trước' : 'LIFO dỡ trước'}
                </span>
              </div>

              {onChangeLoadingStrategy && (
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onChangeLoadingStrategy('priority_order')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      loadingStrategy === 'priority_order'
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Theo thứ tự 1, 2, 3</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Lô 1 vào vách đầu, Lô 2, 3 dần ra cửa</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeLoadingStrategy('heavy_first')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      loadingStrategy === 'heavy_first'
                        ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Hàng nặng trước</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Tải nặng sâu vách đầu, nhẹ xếp sau</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeLoadingStrategy('lifo_reverse')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      loadingStrategy === 'lifo_reverse'
                        ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200 shadow ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Dỡ hàng LIFO</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Lô dỡ hàng trước xếp sát cửa cont</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeLoadingStrategy('volume_first')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      loadingStrategy === 'volume_first'
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>Kiện lớn trước</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">CBM lớn xếp trước, nhỏ chèn lấp sau</div>
                  </button>
                </div>
              )}
            </div>

            {/* List of Pallet Batches (Multi-Pallet Manifest) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Các Lô Pallet Trong Container ({pallets.length}):</span>
                <span className="font-mono text-cyan-400">
                  Đã xếp: {packingResult.totalPallets} kiện
                </span>
              </div>

              {pallets.map((p, idx) => {
                const isSelected = p.id === currentPallet?.id;
                const summary = packingResult.palletsSummary?.find(s => s.palletId === p.id);
                const placedQty = summary?.placedQty ?? 0;
                const priorityNum = p.loadingPriority ?? (idx + 1);

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectActivePallet(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-blue-500/90 shadow-lg ring-1 ring-blue-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Priority Badge & Reorder buttons */}
                        <div
                          className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800 flex-shrink-0"
                          onClick={e => e.stopPropagation()}
                          title={`Thứ tự đóng hàng: Lô #${priorityNum}`}
                        >
                          <span className="font-mono font-bold text-cyan-400 text-[10px]">
                            #{priorityNum}
                          </span>
                          {onReorderPallets && pallets.length > 1 && (
                            <div className="flex flex-col ml-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => onReorderPallets(idx, idx - 1)}
                                className="text-slate-400 hover:text-white disabled:opacity-20 hover:scale-110 p-0.5 cursor-pointer leading-none"
                                title="Đóng trước (chuyển lên đầu cont)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === pallets.length - 1}
                                onClick={() => onReorderPallets(idx, idx + 1)}
                                className="text-slate-400 hover:text-white disabled:opacity-20 hover:scale-110 p-0.5 cursor-pointer leading-none"
                                title="Đóng sau (chuyển về phía cửa)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/40"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-xs text-white truncate">
                          {p.name}
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onQuickChangeQuantity(p.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs"
                          title="Giảm 1 pallet"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={p.quantity}
                          onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            onUpdatePallet({ ...p, quantity: val });
                          }}
                          className="w-10 text-center bg-transparent text-white font-mono font-bold text-xs outline-none"
                        />
                        <button
                          onClick={() => onQuickChangeQuantity(p.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                          title="Tăng thêm 1 pallet"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Specs & Placement stats */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>
                        {p.lengthMm} x {p.widthMm} x {p.heightMm} mm
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {p.cbmPerPallet} CBM
                      </span>
                      <span className="text-amber-300">
                        {p.totalWeightKg.toLocaleString()} kg
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Trạng thái xếp:</span>
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            placedQty >= p.quantity
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {placedQty} / {p.quantity} kiện
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDuplicatePallet(p.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Nhân bản lô pallet này"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {pallets.length > 1 && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeletePallet(p.id);
                            }}
                            className="p-1 rounded text-rose-400 hover:text-rose-200"
                            title="Xóa lô pallet này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editing Active Pallet Specifications */}
            {currentPallet && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Chi Tiết Lô Pallet Đang Chọn</span>
                  </span>
                  <span
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: currentPallet.color }}
                  />
                </div>

                {/* 1. Tên loại pallet riêng biệt */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Tên Loại Pallet Riêng Biệt:
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      {currentPallet.lengthMm}x{currentPallet.widthMm}x{currentPallet.heightMm}mm
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentPallet.name}
                    onChange={e => onUpdatePallet({ ...currentPallet, name: e.target.value })}
                    placeholder="Nhập tên riêng (vd: Pallet Thùng Sữa, Pallet Linh Kiện...)"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:border-blue-500 outline-none"
                  />
                </div>

                {/* 1.5 Thứ tự đóng hàng của lô này */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Thứ Tự Đóng Hàng Vào Cont (1, 2, 3...):</span>
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Ưu tiên #{currentPallet.loadingPriority ?? 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-1">
                      <span className="text-[10px] text-slate-400 mr-2">Vị trí:</span>
                      <select
                        value={currentPallet.loadingPriority ?? 1}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          onUpdatePallet({ ...currentPallet, loadingPriority: val });
                          if (onChangePalletPriority) {
                            onChangePalletPriority(currentPallet.id, val);
                          }
                        }}
                        className="flex-1 bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer"
                      >
                        {Array.from({ length: Math.max(pallets.length, 10) }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num} className="bg-slate-900 text-white">
                            Thứ tự #{num} {num === 1 ? '— Xếp sâu vào vách đầu cont trước' : num === 2 ? '— Xếp khoang giữa' : num >= 3 ? '— Xếp dần ra cửa cont' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {onReorderPallets && (
                      <div className="flex items-center gap-1">
                        {(() => {
                          const currIdx = pallets.findIndex(p => p.id === currentPallet.id);
                          return (
                            <>
                              <button
                                type="button"
                                disabled={currIdx <= 0}
                                onClick={() => onReorderPallets(currIdx, currIdx - 1)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Đóng sớm hơn (chuyển lên đầu cont)"
                              >
                                <ArrowUp className="w-3 h-3 text-cyan-400" />
                                <span>Lên</span>
                              </button>
                              <button
                                type="button"
                                disabled={currIdx < 0 || currIdx >= pallets.length - 1}
                                onClick={() => onReorderPallets(currIdx, currIdx + 1)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                title="Đóng trễ hơn (chuyển về phía cửa)"
                              >
                                <ArrowDown className="w-3 h-3 text-cyan-400" />
                                <span>Xuống</span>
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    💡 Quy tắc: Lô có thứ tự #1 sẽ được xếp sâu nhất vào vách đầu xe/cont (Khoang 1). Các lô #2, #3... lần lượt xếp kế tiếp dần ra phía cửa cont.
                  </p>
                </div>

                {/* 2. Quy chuẩn tham chiếu */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Tham chiếu quy chuẩn tiêu chuẩn:
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentPallet.standardType}
                    </span>
                  </div>
                  <select
                    value={currentPallet.standardType}
                    onChange={e => handlePresetChange(e.target.value as PalletStandard)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {Object.entries(STANDARD_PALLET_PRESETS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. SỐ ĐO KÍCH THƯỚC PALLET (Dài, Rộng, Cao mm) */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">
                      Số Đo Kích Thước Pallet (mm):
                    </span>
                    <div className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-cyan-300 font-mono text-xs font-bold">
                      {currentPallet.cbmPerPallet} CBM / kiện
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Dài L (mm)</label>
                      <input
                        type="number"
                        value={currentPallet.lengthMm}
                        onChange={e => handleDimensionChange('lengthMm', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Rộng W (mm)</label>
                      <input
                        type="number"
                        value={currentPallet.widthMm}
                        onChange={e => handleDimensionChange('widthMm', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-slate-400">Cao H (mm)</label>
                        {currentPallet.heightMm > packingResult.maxLoadingHeightMm && (
                          <span className="text-[9px] text-rose-400 font-bold">Vượt trần!</span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={currentPallet.heightMm}
                        onChange={e => handleDimensionChange('heightMm', Number(e.target.value))}
                        className={`w-full bg-slate-950 border rounded-xl px-2 py-1.5 text-xs font-mono focus:border-blue-500 outline-none ${
                          currentPallet.heightMm > packingResult.maxLoadingHeightMm
                            ? 'border-rose-500 text-rose-300 bg-rose-950/30'
                            : 'border-slate-700 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons for Dimensions */}
                  <div className="flex items-center gap-1 pt-1 overflow-x-auto text-[10px] font-mono">
                    <span className="text-slate-500 text-[10px] font-sans mr-1">Mẫu nhanh:</span>
                    {[
                      { l: 1200, w: 800, label: '1200x800' },
                      { l: 1200, w: 1000, label: '1200x1000' },
                      { l: 1100, w: 1100, label: '1100x1100' },
                      { l: 1219, w: 1016, label: '1219x1016' }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          const newCbm = calculateCbm(btn.l, btn.w, currentPallet.heightMm);
                          onUpdatePallet({
                            ...currentPallet,
                            lengthMm: btn.l,
                            widthMm: btn.w,
                            cbmPerPallet: newCbm
                          });
                        }}
                        className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          currentPallet.lengthMm === btn.l && currentPallet.widthMm === btn.w
                            ? 'bg-blue-900/60 border-blue-600 text-blue-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. SỐ KG CHO 1 LOẠI PALLET (Khối lượng riêng) */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Số Kg Cho 1 Loại Pallet (Khối Lượng):</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      Cả lô: {(currentPallet.quantity * currentPallet.totalWeightKg).toLocaleString()} kg
                    </span>
                  </div>

                  {/* Direct editable input for Total Weight */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-600/60">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-amber-300 font-bold">
                        Tổng khối lượng 1 pallet hoàn chỉnh (kg):
                      </label>
                      <span className="text-[10px] text-slate-400">
                        (Hàng + Chân đế)
                      </span>
                    </div>
                    <input
                      type="number"
                      value={currentPallet.totalWeightKg}
                      onChange={e => handleTotalWeightChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-amber-600/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                    />
                  </div>

                  {/* Separate details for cargo and tare */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Khối lượng hàng trên pallet (kg)
                      </label>
                      <input
                        type="number"
                        value={currentPallet.cargoWeightKg}
                        onChange={e => handleDimensionChange('cargoWeightKg', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Tự trọng pallet rỗng (kg)
                      </label>
                      <input
                        type="number"
                        value={currentPallet.palletTareKg}
                        onChange={e => handleDimensionChange('palletTareKg', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation, Stacking & Color */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cho phép xoay 90°:</span>
                    </div>
                    <button
                      onClick={() =>
                        onUpdatePallet({
                          ...currentPallet,
                          allowRotate: !currentPallet.allowRotate
                        })
                      }
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                        currentPallet.allowRotate ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          currentPallet.allowRotate ? 'transform translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Tối đa số tầng xếp chồng:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(tier => (
                        <button
                          key={tier}
                          onClick={() =>
                            onUpdatePallet({ ...currentPallet, maxTiers: tier })
                          }
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPallet.maxTiers === tier
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {tier} Tầng
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Màu sắc 3D:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'].map(c => (
                        <button
                          key={c}
                          onClick={() => onUpdatePallet({ ...currentPallet, color: c })}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                            currentPallet.color === c
                              ? 'border-white scale-110'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CONTAINER SELECTION ================= */}
        {activeTab === 'container' && (
          <div className="space-y-4">
            {/* Card: Max Cargo Loading Height Setting */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ArrowUpDown className="w-4 h-4 text-amber-400" />
                  <span>Chiều Cao Đóng Hàng Tối Đa</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    packingResult.isHeightExceeded
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : packingResult.verticalClearanceMm < 80
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {packingResult.isHeightExceeded
                    ? 'VƯỢT QUÁ CHIỀU CAO'
                    : `Sáng nóc: ${packingResult.verticalClearanceMm} mm`}
                </span>
              </div>

              {/* Input for custom loading height */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="500"
                    max={activeContainer.innerHeightMm}
                    value={customMaxHeightMm ?? activeContainer.innerHeightMm}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      onCustomMaxHeightChange(isNaN(val) ? undefined : val);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                    placeholder={`${activeContainer.innerHeightMm} mm`}
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                    mm
                  </span>
                </div>

                <button
                  onClick={() => onCustomMaxHeightChange(activeContainer.innerHeightMm)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Đặt lại bằng chiều cao trần lọt lòng cont"
                >
                  Mặc định
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => onCustomMaxHeightChange(activeContainer.innerHeightMm)}
                  className={`py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer border ${
                    (customMaxHeightMm ?? activeContainer.innerHeightMm) === activeContainer.innerHeightMm
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold truncate">Trần cont (100%)</div>
                  <div className="font-mono text-[10px] opacity-80">{activeContainer.innerHeightMm} mm</div>
                </button>

                <button
                  onClick={() => onCustomMaxHeightChange(activeContainer.doorHeightMm)}
                  className={`py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer border ${
                    customMaxHeightMm === activeContainer.doorHeightMm
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold truncate">Mép cửa cont</div>
                  <div className="font-mono text-[10px] opacity-80">{activeContainer.doorHeightMm} mm</div>
                </button>

                <button
                  onClick={() => onCustomMaxHeightChange(activeContainer.innerHeightMm - 100)}
                  className={`py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer border ${
                    customMaxHeightMm === (activeContainer.innerHeightMm - 100)
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold truncate">Chừa nóc 100mm</div>
                  <div className="font-mono text-[10px] opacity-80">{activeContainer.innerHeightMm - 100} mm</div>
                </button>

                <button
                  onClick={() => onCustomMaxHeightChange(activeContainer.innerHeightMm - 150)}
                  className={`py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer border ${
                    customMaxHeightMm === (activeContainer.innerHeightMm - 150)
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold truncate">Chừa nóc 150mm</div>
                  <div className="font-mono text-[10px] opacity-80">{activeContainer.innerHeightMm - 150} mm</div>
                </button>
              </div>

              {/* Real-time Vertical Clearance Bar */}
              <div className="pt-2 border-t border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Đỉnh hàng cao nhất:</span>
                  <span className="text-white font-bold">{packingResult.actualMaxCargoHeightMm} mm</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Khoảng lưu không nóc:</span>
                  <span className={packingResult.verticalClearanceMm < 80 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {packingResult.verticalClearanceMm} mm
                  </span>
                </div>

                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    style={{
                      width: `${Math.min(100, (packingResult.actualMaxCargoHeightMm / (packingResult.maxLoadingHeightMm || 1)) * 100)}%`
                    }}
                    className={`h-full transition-all ${
                      packingResult.isHeightExceeded
                        ? 'bg-rose-500'
                        : packingResult.verticalClearanceMm < 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Chọn Loại Container / Xe:</span>
              <button
                onClick={onOpenContainerManager}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo cont mới</span>
              </button>
            </div>

            <div className="space-y-2">
              {containers.map(cont => {
                const isSelected = cont.id === activeContainer.id;
                return (
                  <div
                    key={cont.id}
                    onClick={() => onSelectContainer(cont)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Container
                          className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}
                        />
                        <span className="font-semibold text-xs text-white">{cont.name}</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {cont.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400 font-mono">
                      <div>
                        Dài:{' '}
                        <span className="text-slate-200">
                          {(cont.innerLengthMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                      <div>
                        Rộng:{' '}
                        <span className="text-slate-200">
                          {(cont.innerWidthMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                      <div>
                        Cao:{' '}
                        <span className="text-slate-200">
                          {(cont.innerHeightMm / 1000).toFixed(2)}m
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-mono">
                        Dung tích: {cont.volumeCbm} CBM
                      </span>
                      <span className="text-amber-400 font-mono">
                        Tải trọng: {cont.maxPayloadKg.toLocaleString()} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CONTAINER BALANCE & COG ================= */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border ${
                cog.status === 'optimal'
                  ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-200'
                  : cog.status === 'warning'
                    ? 'bg-amber-950/50 border-amber-800/70 text-amber-200'
                    : 'bg-rose-950/50 border-rose-800/70 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {cog.status === 'optimal' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span className="font-bold text-xs uppercase tracking-wider">
                  {cog.status === 'optimal'
                    ? 'Độ Cân Bằng Chuẩn IMO / CTU Code'
                    : 'Cảnh Báo Phân Bổ Trọng Lượng'}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{cog.message}</p>
            </div>

            {/* Longitudinal Balance Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Trọng Tâm Dọc (Longitudinal CoG):</span>
                <span className="font-mono font-bold text-cyan-400">{cog.xPercentage}%</span>
              </div>

              <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/60"
                  style={{ left: '44%', width: '12%' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                  style={{ left: '50%' }}
                />
                <div
                  className={`absolute top-0.5 bottom-0.5 w-3 rounded-full transition-all -ml-1.5 shadow ${
                    cog.status === 'optimal'
                      ? 'bg-emerald-400'
                      : cog.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                  }`}
                  style={{ left: `${Math.min(98, Math.max(2, cog.xPercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% (Đầu Cont)</span>
                <span className="text-emerald-400">Vùng An Toàn [45% - 55%]</span>
                <span>100% (Cửa Sau)</span>
              </div>
            </div>

            {/* Lateral Balance Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Trọng Tâm Ngang (Lateral CoG):</span>
                <span className="font-mono font-bold text-cyan-400">{cog.zPercentage}%</span>
              </div>

              <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/60"
                  style={{ left: '47%', width: '6%' }}
                />
                <div
                  className="absolute top-0.5 bottom-0.5 w-3 rounded-full transition-all -ml-1.5 bg-emerald-400"
                  style={{ left: `${Math.min(98, Math.max(2, cog.zPercentage))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Trái ({cog.zPercentage}%)</span>
                <span className="text-emerald-400">Tâm Đối Xứng 50%</span>
                <span>Phải ({Math.round((100 - cog.zPercentage) * 10) / 10}%)</span>
              </div>
            </div>

            {/* Axle Load Distribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Phân Bổ Tải Trọng Lên Cầu Xe:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Cầu Trước / Chốt Kéo</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {axle.frontAxleKg.toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tỉ lệ: {axle.frontPercentage}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Cụm Trục Sau (Tandem)</div>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {axle.rearAxleKg.toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Tỉ lệ: {axle.rearPercentage}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic leading-relaxed">
                {axle.recommendation}
              </p>
            </div>

            {/* Dunnage Advice */}
            {packingResult.dunnageRecommendations.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Khuyến Nghị Chằng Buộc & Chèn Lót (Dunnage):</span>
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {packingResult.dunnageRecommendations.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Optimization Summary */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-[11px]">Sơ đồ bố trí:</div>
          <div className="font-semibold text-white truncate max-w-[220px]">
            {packingResult.arrangementName}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-[11px]">Tổng số pallet xếp:</div>
          <div className="font-mono font-bold text-emerald-400 text-sm">
            {packingResult.totalPallets} kiện
          </div>
        </div>
      </div>
    </aside>
  );
};
