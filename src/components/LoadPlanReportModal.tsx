import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Boxes,
  Container,
  ShieldCheck,
  Compass,
  ArrowUpDown
} from 'lucide-react';
import { ContainerDef, PackingResult, PalletConfig } from '../types/logistics';

interface LoadPlanReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: ContainerDef;
  pallet: PalletConfig;
  pallets?: PalletConfig[];
  packingResult: PackingResult;
}

export const LoadPlanReportModal: React.FC<LoadPlanReportModalProps> = ({
  isOpen,
  onClose,
  container,
  pallet,
  pallets,
  packingResult
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const cog = packingResult.centerOfGravity;
  const axle = packingResult.axleDistribution;
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const palletList = pallets && pallets.length > 0 ? pallets : [pallet];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Phiếu Kế Hoạch Xếp Hàng & Báo Cáo Tải Trọng Container
              </h2>
              <p className="text-xs text-slate-400">
                Container Packing Plan & Axle Weight Balance Manifest (Theo quy chuẩn IMO/CTU)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-800 bg-white print:p-0 print:m-0 print:shadow-none">
          {/* Printable Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                PHIẾU KẾ HOẠCH ĐÓNG PALLET VÀO CONTAINER
              </h1>
              <p className="text-xs font-medium text-slate-600">
                Phần mềm tính toán mô phỏng tối ưu OptiLoad 3D • Hệ thống kiểm soát an toàn tải trọng
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              <div>Số hồ sơ: <span className="font-bold text-slate-900">PLN-{Date.now().toString().slice(-6)}</span></div>
              <div>Ngày lập: <span className="font-semibold">{currentDate}</span></div>
            </div>
          </div>

          {/* Section 1: Overview Summary Cards (5 columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Tổng Số Pallet:</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {packingResult.totalPallets} <span className="text-xs font-normal">kiện</span>
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Tổng Thể Tích:</span>
              <span className="text-base font-bold text-blue-700 font-mono">
                {packingResult.totalVolumeCbm} <span className="text-xs font-normal">m³</span>
              </span>
              <span className="text-[9px] text-slate-500 block">
                {packingResult.volumeUtilizationPct}% thể tích
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Tổng Khối Lượng:</span>
              <span className="text-base font-bold text-amber-700 font-mono">
                {packingResult.totalWeightKg.toLocaleString()} <span className="text-xs font-normal">kg</span>
              </span>
              <span className="text-[9px] text-slate-500 block">
                Tải trọng: {packingResult.payloadUtilizationPct}%
              </span>
            </div>

            {/* Max Loading Height Card */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Chiều Cao Hàng:</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {packingResult.actualMaxCargoHeightMm} <span className="text-[10px] text-slate-500 font-normal">/ {packingResult.maxLoadingHeightMm}mm</span>
              </span>
              <span className={`text-[9px] block font-semibold ${
                packingResult.isHeightExceeded
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}>
                {packingResult.isHeightExceeded ? 'VƯỢT GIỚI HẠN!' : `Hở nóc: ${packingResult.verticalClearanceMm}mm`}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Đánh Giá Cân Bằng:</span>
              <span
                className={`text-xs font-bold block ${
                  cog.status === 'optimal'
                    ? 'text-emerald-700'
                    : cog.status === 'warning'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                }`}
              >
                {cog.status === 'optimal' ? 'CÂN BẰNG TỐT' : 'CẢNH BÁO LỆCH'}
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">
                CoG Dọc: {cog.xPercentage}%
              </span>
            </div>
          </div>

          {/* Section 2: Detailed Specifications Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Container specs */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center gap-1.5">
                <Container className="w-4 h-4 text-blue-600" />
                <span>THÔNG SỐ CONTAINER / PHƯƠNG TIỆN</span>
              </div>
              <div className="p-3 space-y-1.5 font-mono">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-sans">Tên phương tiện:</span>
                  <span className="font-bold text-slate-900">{container.name} ({container.code})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-sans">Kích thước lọt lòng:</span>
                  <span>{container.innerLengthMm} x {container.innerWidthMm} x {container.innerHeightMm} mm</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1 bg-amber-50/60 -mx-3 px-3 py-0.5">
                  <span className="text-slate-700 font-sans font-semibold">Giới hạn chiều cao đóng hàng:</span>
                  <span className="font-bold text-amber-900">{packingResult.maxLoadingHeightMm} mm</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-sans">Đỉnh hàng thực tế / Hở nóc:</span>
                  <span className={packingResult.isHeightExceeded ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                    {packingResult.actualMaxCargoHeightMm} mm (hở {packingResult.verticalClearanceMm} mm)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-sans">Thể tích dung tích (CBM):</span>
                  <span>{container.volumeCbm} m³</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-sans">Tải trọng tối đa cho phép:</span>
                  <span className="text-amber-700 font-bold">{container.maxPayloadKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Tự trọng vỏ container:</span>
                  <span>{container.tareWeightKg.toLocaleString()} kg</span>
                </div>
              </div>
            </div>

            {/* Pallet specs / Multi-pallet Manifest */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>DANH MỤC PALLET ĐÓNG VÀO CONT ({palletList.length} LÔ)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600">
                  Tổng: {packingResult.totalPallets} kiện
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-52 overflow-y-auto">
                {palletList.map((p, idx) => {
                  const summary = packingResult.palletsSummary?.find(s => s.palletId === p.id);
                  const placedQty = summary?.placedQty ?? 0;
                  const priority = p.loadingPriority ?? (idx + 1);
                  return (
                    <div key={p.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-mono">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: p.color }}
                          />
                          <span>{p.name}</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded font-semibold border border-blue-200">
                            Thứ tự đóng #{priority}
                          </span>
                        </div>
                        <span className="text-blue-700">
                          {placedQty} / {p.quantity} kiện
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>KT: {p.lengthMm}x{p.widthMm}x{p.heightMm}mm</span>
                        <span>CBM: {p.cbmPerPallet} m³</span>
                        <span>{p.totalWeightKg} kg/kiện (hàng {p.cargoWeightKg}kg + đế {p.palletTareKg}kg)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Weight Distribution Across Longitudinal Bays (Chart) */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Biểu Đồ Phân Bổ Tải Trọng Dọc Theo Các Khoang (Bays Weight Distribution)</span>
            </h3>

            <div className="grid grid-cols-6 gap-2">
              {packingResult.bayWeights.map(bay => {
                const maxBayWeight = Math.max(1, ...packingResult.bayWeights.map(b => b.weightKg));
                const heightPct = Math.round((bay.weightKg / maxBayWeight) * 100);

                return (
                  <div key={bay.bay} className="flex flex-col items-center">
                    <div className="w-full h-24 bg-slate-100 rounded-lg flex items-end p-1 justify-center relative">
                      <div
                        style={{ height: `${Math.max(10, heightPct)}%` }}
                        className="w-full bg-blue-600/80 rounded transition-all flex items-center justify-center text-[10px] text-white font-mono font-bold"
                      >
                        {bay.weightKg > 0 && `${Math.round(bay.weightKg / 1000 * 10) / 10}T`}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 mt-1">Khoang {bay.bay}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{bay.palletCount} pallet</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Đầu cont (Cầu kéo): {axle.frontAxleKg.toLocaleString()} kg ({axle.frontPercentage}%)</span>
              <span className="text-emerald-700 font-bold">{axle.recommendation}</span>
              <span>Đuôi cont (Cụm trục): {axle.rearAxleKg.toLocaleString()} kg ({axle.rearPercentage}%)</span>
            </div>
          </div>

          {/* Section 4: Dunnage & Cargo Securing Checklist */}
          {packingResult.dunnageRecommendations.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Quy trình chèn lót & chằng buộc hàng an toàn (Dunnage / Lashing):</span>
              </h4>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                {packingResult.dunnageRecommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: Signature Blocks */}
          <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-700 print-break-inside-avoid">
            <div>
              <div className="font-bold text-slate-900 uppercase">Người Lập Kế Hoạch</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-900">OptiLoad Planner</div>
            </div>

            <div>
              <div className="font-bold text-slate-900 uppercase">Thủ Kho / Giám Sát Đóng Hàng</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký xác nhận vị trí CoG)</div>
              <div className="h-16"></div>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>

            <div>
              <div className="font-bold text-slate-900 uppercase">Tài Xế / Đơn Vị Vận Tải</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký nhận tải trọng cầu xe)</div>
              <div className="h-16"></div>
              <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
