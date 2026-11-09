import React, { useState } from 'react';
import {
  X,
  Boxes,
  Plus,
  Scale,
  Maximize2,
  Bookmark,
  Trash2,
  RotateCw,
  Layers,
  Palette,
  Check,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { PalletConfig, PalletStandard, CustomPalletTemplate } from '../types/logistics';
import {
  STANDARD_PALLET_PRESETS,
  calculateCbm,
  loadCustomPalletTemplates,
  saveCustomPalletTemplate,
  deleteCustomPalletTemplate
} from '../utils/containerStorage';

interface CustomPalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomPallet: (pallet: PalletConfig) => void;
  maxLoadingHeightMm?: number;
}

export const CustomPalletModal: React.FC<CustomPalletModalProps> = ({
  isOpen,
  onClose,
  onAddCustomPallet,
  maxLoadingHeightMm = 2393
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'library'>('create');

  // Form State
  const [name, setName] = useState('Pallet Hàng Tùy Chỉnh');
  const [standardType, setStandardType] = useState<PalletStandard>('custom');
  const [lengthMm, setLengthMm] = useState(1200);
  const [widthMm, setWidthMm] = useState(1000);
  const [heightMm, setHeightMm] = useState(1400);

  // Weight State
  const [weightInputMode, setWeightInputMode] = useState<'total' | 'split'>('total');
  const [totalWeightKg, setTotalWeightKg] = useState(500);
  const [palletTareKg, setPalletTareKg] = useState(25);
  const [cargoWeightKg, setCargoWeightKg] = useState(475);

  // Logistics & Quantity State
  const [quantity, setQuantity] = useState(10);
  const [allowRotate, setAllowRotate] = useState(true);
  const [maxTiers, setMaxTiers] = useState(1);
  const [color, setColor] = useState('#10b981');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Templates library state
  const [templates, setTemplates] = useState<CustomPalletTemplate[]>(() => loadCustomPalletTemplates());

  if (!isOpen) return null;

  // Auto calculate CBM
  const computedCbm = calculateCbm(lengthMm, widthMm, heightMm);
  const computedTotalBatchWeightKg = quantity * totalWeightKg;
  const computedTotalBatchVolumeCbm = Math.round(quantity * computedCbm * 1000) / 1000;
  const isHeightExceeded = heightMm > maxLoadingHeightMm;

  // Color options
  const colorOptions = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6'];

  const handleApplyPreset = (key: PalletStandard) => {
    setStandardType(key);
    const p = STANDARD_PALLET_PRESETS[key];
    setLengthMm(p.lengthMm);
    setWidthMm(p.widthMm);
    setHeightMm(p.heightMm);
    setPalletTareKg(p.tareKg);
    if (key !== 'custom') {
      setName(`Pallet ${p.name.split('(')[0].trim()}`);
    }
    // recalculate weights
    if (weightInputMode === 'total') {
      setCargoWeightKg(Math.max(0, totalWeightKg - p.tareKg));
    } else {
      setTotalWeightKg(cargoWeightKg + p.tareKg);
    }
  };

  const handleApplyTemplate = (tpl: CustomPalletTemplate) => {
    setName(tpl.name);
    setStandardType(tpl.standardType || 'custom');
    setLengthMm(tpl.lengthMm);
    setWidthMm(tpl.widthMm);
    setHeightMm(tpl.heightMm);
    setPalletTareKg(tpl.palletTareKg);
    setCargoWeightKg(tpl.cargoWeightKg);
    setTotalWeightKg(tpl.totalWeightKg);
    setAllowRotate(tpl.allowRotate);
    setMaxTiers(tpl.maxTiers);
    setColor(tpl.color);
    setDescription(tpl.description || '');
    setActiveSubTab('create');
  };

  const handleDeleteTemplate = (id: string) => {
    deleteCustomPalletTemplate(id);
    setTemplates(loadCustomPalletTemplates());
  };

  const handleTotalWeightChange = (newTotal: number) => {
    const total = Math.max(0, newTotal);
    setTotalWeightKg(total);
    setCargoWeightKg(Math.max(0, total - palletTareKg));
  };

  const handleCargoWeightChange = (newCargo: number) => {
    const cargo = Math.max(0, newCargo);
    setCargoWeightKg(cargo);
    setTotalWeightKg(cargo + palletTareKg);
  };

  const handleTareWeightChange = (newTare: number) => {
    const tare = Math.max(0, newTare);
    setPalletTareKg(tare);
    if (weightInputMode === 'total') {
      setCargoWeightKg(Math.max(0, totalWeightKg - tare));
    } else {
      setTotalWeightKg(cargoWeightKg + tare);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên loại pallet');
      return;
    }
    if (lengthMm <= 0 || widthMm <= 0 || heightMm <= 0) {
      setErrorMessage('Kích thước dài, rộng, cao phải lớn hơn 0');
      return;
    }
    if (totalWeightKg <= 0) {
      setErrorMessage('Khối lượng tổng pallet phải lớn hơn 0 kg');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('Số lượng kiện pallet phải lớn hơn 0');
      return;
    }

    const finalPalletTare = palletTareKg;
    const finalTotalWeight = totalWeightKg;
    const finalCargoWeight = Math.max(0, finalTotalWeight - finalPalletTare);

    const newPallet: PalletConfig = {
      id: `pallet-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      standardType,
      lengthMm,
      widthMm,
      heightMm,
      palletTareKg: finalPalletTare,
      cargoWeightKg: finalCargoWeight,
      totalWeightKg: finalTotalWeight,
      cbmPerPallet: computedCbm,
      allowRotate,
      maxTiers,
      color,
      quantity
    };

    // Optionally save to library
    if (saveToLibrary) {
      saveCustomPalletTemplate({
        name: name.trim(),
        standardType,
        lengthMm,
        widthMm,
        heightMm,
        palletTareKg: finalPalletTare,
        cargoWeightKg: finalCargoWeight,
        totalWeightKg: finalTotalWeight,
        cbmPerPallet: computedCbm,
        allowRotate,
        maxTiers,
        color,
        description: description.trim()
      });
    }

    onAddCustomPallet(newPallet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Nhập Riêng Loại Pallet Mới
              </h2>
              <p className="text-xs text-slate-400">
                Tự do định nghĩa số đo kích thước (mm) và số kg (khối lượng) cho 1 loại pallet riêng biệt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('create')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeSubTab === 'create'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tạo Loại Mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplates(loadCustomPalletTemplates());
                  setActiveSubTab('library');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'library'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Mẫu Đã Lưu ({templates.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeSubTab === 'library' ? (
            /* Saved Templates Library */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Chọn mẫu pallet có sẵn để điền nhanh thông số hoặc thêm trực tiếp vào container:
                </span>
                <button
                  onClick={() => setActiveSubTab('create')}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tự nhập mới từ đầu</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/40 flex-shrink-0"
                            style={{ backgroundColor: tpl.color }}
                          />
                          <span className="font-bold text-xs text-white">{tpl.name}</span>
                        </div>
                        {tpl.id.startsWith('tpl-user') && (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Xóa mẫu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono mb-2">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Kích thước:</span>
                          <span className="text-slate-200">{tpl.lengthMm}x{tpl.widthMm}x{tpl.heightMm}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Thể tích:</span>
                          <span className="text-cyan-400 font-bold">{tpl.cbmPerPallet} CBM</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Khối lượng:</span>
                          <span className="text-amber-300 font-bold">{tpl.totalWeightKg} kg</span>
                        </div>
                      </div>

                      {tpl.description && (
                        <p className="text-[11px] text-slate-400 italic mb-2 line-clamp-2">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleApplyTemplate(tpl)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sử dụng mẫu này</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Create Custom Pallet Form */
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Tên loại pallet & Mẫu tiêu chuẩn tham chiếu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Tên Loại Pallet Riêng Biệt *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="vd: Pallet Thùng Sữa 1.2x1m, Pallet Hàng Nặng..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Tham Chiếu Mẫu Chuẩn Sẵn Có
                  </label>
                  <select
                    value={standardType}
                    onChange={e => handleApplyPreset(e.target.value as PalletStandard)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {Object.entries(STANDARD_PALLET_PRESETS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. SỐ ĐO KÍCH THƯỚC PALLET (DÀI x RỘNG x CAO mm) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Số Đo Kích Thước Pallet (mm):
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-cyan-300">
                      {computedCbm} CBM / 1 kiện
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Chiều Dài L (mm) *
                    </label>
                    <input
                      type="number"
                      value={lengthMm}
                      onChange={e => setLengthMm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Chiều Rộng W (mm) *
                    </label>
                    <input
                      type="number"
                      value={widthMm}
                      onChange={e => setWidthMm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-400">
                        Chiều Cao H (mm) *
                      </label>
                      {isHeightExceeded && (
                        <span className="text-[10px] text-rose-400 font-bold">Vượt trần cont!</span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={heightMm}
                      onChange={e => setHeightMm(Number(e.target.value))}
                      className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs font-mono focus:border-blue-500 outline-none ${
                        isHeightExceeded
                          ? 'border-rose-500 text-rose-300 bg-rose-950/30'
                          : 'border-slate-700 text-white'
                      }`}
                      required
                    />
                  </div>
                </div>

                {isHeightExceeded && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Chiều cao kiện ({heightMm}mm) cao hơn giới hạn đóng hàng tối đa ({maxLoadingHeightMm}mm). Kiện này sẽ không thể xếp lọt container!
                    </span>
                  </p>
                )}
              </div>

              {/* 3. SỐ KG CHO 1 LOẠI PALLET (KHỐI LƯỢNG) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Số Kg Cho 1 Loại Pallet (Khối Lượng):
                    </span>
                  </div>

                  {/* Switcher: Nhập trực tiếp tổng kg vs Tách riêng */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setWeightInputMode('total')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        weightInputMode === 'total'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Nhập Tổng Số Kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightInputMode('split')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        weightInputMode === 'split'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tách Hàng + Tự Trọng
                    </button>
                  </div>
                </div>

                {weightInputMode === 'total' ? (
                  /* Nhập trực tiếp Tổng số kg */
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-amber-300 font-semibold">
                          Tổng Khối Lượng 1 Pallet Hoàn Chỉnh (kg) *
                        </label>
                        <span className="text-[10px] text-slate-400">
                          (Bao gồm cả hàng hóa & chân pallet)
                        </span>
                      </div>
                      <input
                        type="number"
                        value={totalWeightKg}
                        onChange={e => handleTotalWeightChange(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-amber-600/70 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Ước lượng phân bổ:</span>
                      <span className="font-mono">
                        Hàng hóa: <strong className="text-slate-200">{cargoWeightKg} kg</strong> • Tự trọng pallet rỗng: <strong className="text-slate-200">{palletTareKg} kg</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Tách riêng Hàng hóa kg + Tự trọng pallet rỗng kg */
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Khối Lượng Hàng Trên Pallet (kg) *
                      </label>
                      <input
                        type="number"
                        value={cargoWeightKg}
                        onChange={e => handleCargoWeightChange(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Tự Trọng Pallet Rỗng (kg) *
                      </label>
                      <input
                        type="number"
                        value={palletTareKg}
                        onChange={e => handleTareWeightChange(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 outline-none"
                        required
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <span className="text-slate-400 font-medium">Tổng khối lượng 1 kiện:</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {totalWeightKg.toLocaleString()} kg / kiện
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. SỐ LƯỢNG & QUY TẮC XẾP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Số lượng kiện */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    Số Lượng Kiện Cần Xếp *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                {/* Xoay 90 độ */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
                    <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cho Phép Xoay 90°</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-400">
                      {allowRotate ? 'Được xoay ngang/dọc' : 'Cố định hướng'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAllowRotate(!allowRotate)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        allowRotate ? 'bg-blue-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          allowRotate ? 'transform translate-x-4' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Số tầng xếp chồng */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tối Đa Số Tầng</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMaxTiers(t)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          maxTiers === t
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t} Tầng
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. MÀU SẮC 3D & LƯU VÀO THƯ VIỆN */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Màu nhận diện 3D:</span>
                  <div className="flex items-center gap-1.5 ml-1">
                    {colorOptions.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                          color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToLibrary}
                    onChange={e => setSaveToLibrary(e.target.checked)}
                    className="accent-blue-500 rounded cursor-pointer"
                  />
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lưu mẫu pallet riêng này để dùng lại</span>
                </label>
              </div>

              {/* 6. TỔNG KẾT LÔ HÀNG (LIVE BATCH SUMMARY) */}
              <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Quy mô lô pallet:</span>
                  <span className="font-bold text-white text-sm">{quantity} kiện</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tổng CBM lô hàng:</span>
                  <span className="font-bold text-cyan-300 text-sm">{computedTotalBatchVolumeCbm} m³</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tổng khối lượng lô hàng:</span>
                  <span className="font-bold text-amber-300 text-sm">{computedTotalBatchWeightKg.toLocaleString()} kg</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Pallet Này Vào Container</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
