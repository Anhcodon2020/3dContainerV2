import {
  AxleDistribution,
  BayWeight,
  CenterOfGravity,
  ContainerDef,
  PackingResult,
  PalletConfig,
  PalletTypeSummary,
  PlacedPallet,
  LoadingSequenceStrategy
} from '../types/logistics';
import { calculateCbm } from './containerStorage';

interface CandidateArrangement {
  name: string;
  palletsPerTier: {
    lengthMm: number;
    widthMm: number;
    rotated: boolean;
    rowLength: number;
    rowIndex: number;
    colIndex: number;
    xMm: number;
    zMm: number;
  }[];
  totalFloorCount: number;
}

/**
 * Optimizes packing of either a single pallet type or a list of multiple pallet types into a container.
 */
export function optimizePalletPacking(
  palletInput: PalletConfig | PalletConfig[],
  container: ContainerDef,
  customMaxHeightMm?: number,
  targetPalletCount?: number,
  loadingStrategy: LoadingSequenceStrategy = 'priority_order'
): PackingResult {
  const palletList: PalletConfig[] = Array.isArray(palletInput)
    ? palletInput.filter(p => p.quantity > 0 || palletInput.length === 1)
    : [palletInput];

  // If only 1 pallet type is provided, use high-efficiency homogeneous pattern solver
  if (palletList.length === 1) {
    return optimizeSinglePalletType(palletList[0], container, customMaxHeightMm, targetPalletCount);
  }

  // Multi-Pallet Mixed Cargo Solver
  return optimizeMultiPalletTypes(palletList, container, customMaxHeightMm, loadingStrategy);
}

/**
 * Homogeneous Single Pallet Type Packing
 */
function optimizeSinglePalletType(
  pallet: PalletConfig,
  container: ContainerDef,
  customMaxHeightMm?: number,
  targetPalletCount?: number
): PackingResult {
  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;
  const cHeight = container.innerHeightMm;
  const effectiveMaxH = (customMaxHeightMm && customMaxHeightMm > 0)
    ? Math.min(cHeight, customMaxHeightMm)
    : (container.maxLoadingHeightMm || cHeight);

  const pLength = pallet.lengthMm;
  const pWidth = pallet.widthMm;
  const pHeight = pallet.heightMm;
  const singleWeightKg = Math.max(1, pallet.totalWeightKg);

  const isHeightExceeded = pHeight > effectiveMaxH;

  // Determine vertical tier count
  const maxPossibleTiers = isHeightExceeded ? 0 : Math.max(0, Math.floor(effectiveMaxH / pHeight));
  const effectiveTiers = Math.min(pallet.maxTiers, maxPossibleTiers);

  // Maximum pallets allowed by payload weight
  const maxPalletsByWeight = Math.max(1, Math.floor(container.maxPayloadKg / singleWeightKg));

  // Generate candidate floor layouts
  const candidates: CandidateArrangement[] = [];

  // Layout 1: Pure Longitudinal (Length along X)
  const longCols = Math.floor(cWidth / pWidth);
  const longRows = Math.floor(cLength / pLength);
  if (longCols > 0 && longRows > 0) {
    const list: CandidateArrangement['palletsPerTier'] = [];
    const xGap = (cLength - longRows * pLength) / (longRows + 1);
    const zGap = (cWidth - longCols * pWidth) / (longCols + 1);

    for (let r = 0; r < longRows; r++) {
      const x = (r + 1) * xGap + r * pLength + pLength / 2;
      for (let c = 0; c < longCols; c++) {
        const z = (c + 1) * zGap + c * pWidth + pWidth / 2;
        list.push({
          lengthMm: pLength,
          widthMm: pWidth,
          rotated: false,
          rowLength: pLength,
          rowIndex: r,
          colIndex: c,
          xMm: x,
          zMm: z
        });
      }
    }
    candidates.push({
      name: `Xếp dọc (Longitudinal - ${longRows} hàng x ${longCols} dãy)`,
      palletsPerTier: list,
      totalFloorCount: list.length
    });
  }

  // Layout 2: Pure Transverse (Width along X, 90 deg rotated)
  if (pallet.allowRotate) {
    const transCols = Math.floor(cWidth / pLength);
    const transRows = Math.floor(cLength / pWidth);
    if (transCols > 0 && transRows > 0) {
      const list: CandidateArrangement['palletsPerTier'] = [];
      const xGap = (cLength - transRows * pWidth) / (transRows + 1);
      const zGap = (cWidth - transCols * pLength) / (transCols + 1);

      for (let r = 0; r < transRows; r++) {
        const x = (r + 1) * xGap + r * pWidth + pWidth / 2;
        for (let c = 0; c < transCols; c++) {
          const z = (c + 1) * zGap + c * pLength + pLength / 2;
          list.push({
            lengthMm: pWidth,
            widthMm: pLength,
            rotated: true,
            rowLength: pWidth,
            rowIndex: r,
            colIndex: c,
            xMm: x,
            zMm: z
          });
        }
      }
      candidates.push({
        name: `Xếp xoay ngang (Transverse - ${transRows} hàng x ${transCols} dãy)`,
        palletsPerTier: list,
        totalFloorCount: list.length
      });
    }

    // Layout 3: Hybrid / Combination (Mix of longitudinal and transverse rows)
    let bestHybridCount = 0;
    let bestA = 0;
    let bestB = 0;

    const maxA = Math.floor(cLength / pLength);
    for (let a = 1; a <= maxA; a++) {
      const remLength = cLength - a * pLength;
      if (remLength >= pWidth) {
        const b = Math.floor(remLength / pWidth);
        const count = a * longCols + b * transCols;
        if (count > bestHybridCount) {
          bestHybridCount = count;
          bestA = a;
          bestB = b;
        }
      }
    }

    if (bestHybridCount > 0 && (bestHybridCount > (longCols * longRows) || bestHybridCount > (transCols * transRows))) {
      const list: CandidateArrangement['palletsPerTier'] = [];
      let currentX = 0;
      const totalUsedX = bestA * pLength + bestB * pWidth;
      const xSlack = Math.max(0, cLength - totalUsedX) / 2;
      currentX += xSlack;

      let rIndex = 0;
      const zGapLong = (cWidth - longCols * pWidth) / (longCols + 1);
      for (let i = 0; i < bestA; i++) {
        const xCenter = currentX + pLength / 2;
        for (let c = 0; c < longCols; c++) {
          const z = (c + 1) * zGapLong + c * pWidth + pWidth / 2;
          list.push({
            lengthMm: pLength,
            widthMm: pWidth,
            rotated: false,
            rowLength: pLength,
            rowIndex: rIndex,
            colIndex: c,
            xMm: xCenter,
            zMm: z
          });
        }
        currentX += pLength;
        rIndex++;
      }

      const zGapTrans = (cWidth - transCols * pLength) / (transCols + 1);
      for (let j = 0; j < bestB; j++) {
        const xCenter = currentX + pWidth / 2;
        for (let c = 0; c < transCols; c++) {
          const z = (c + 1) * zGapTrans + c * pLength + pLength / 2;
          list.push({
            lengthMm: pWidth,
            widthMm: pLength,
            rotated: true,
            rowLength: pWidth,
            rowIndex: rIndex,
            colIndex: c,
            xMm: xCenter,
            zMm: z
          });
        }
        currentX += pWidth;
        rIndex++;
      }

      candidates.push({
        name: `Xếp kết hợp tối ưu (Hybrid Pinwheel: ${bestA} dọc + ${bestB} ngang)`,
        palletsPerTier: list,
        totalFloorCount: list.length
      });
    }
  }

  if (candidates.length === 0) {
    candidates.push({
      name: 'Kích thước vượt quá lòng container',
      palletsPerTier: [],
      totalFloorCount: 0
    });
  }

  candidates.sort((a, b) => b.totalFloorCount - a.totalFloorCount);
  const bestCandidate = candidates[0];

  const theoreticalMaxPallets = bestCandidate.totalFloorCount * effectiveTiers;
  let actualPalletsCount = Math.min(theoreticalMaxPallets, maxPalletsByWeight);

  // If quantity specified in pallet or user passed targetPalletCount
  const userRequestedLimit = targetPalletCount ?? (pallet.quantity > 0 ? pallet.quantity : undefined);
  if (userRequestedLimit !== undefined && userRequestedLimit > 0) {
    actualPalletsCount = Math.min(userRequestedLimit, actualPalletsCount);
  }

  const placedPallets: PlacedPallet[] = [];
  const floorList = [...bestCandidate.palletsPerTier];

  // Symmetrical placement: center around container midpoint
  floorList.sort((a, b) => {
    const distA = Math.abs(a.xMm - cLength / 2);
    const distB = Math.abs(b.xMm - cLength / 2);
    if (Math.abs(distA - distB) < 1) {
      return Math.abs(a.zMm - cWidth / 2) - Math.abs(b.zMm - cWidth / 2);
    }
    return distA - distB;
  });

  let remainingToPlace = actualPalletsCount;
  let globalIndex = 0;

  for (let tier = 0; tier < effectiveTiers && remainingToPlace > 0; tier++) {
    const yCenter = tier * pHeight + pHeight / 2;

    for (let i = 0; i < floorList.length && remainingToPlace > 0; i++) {
      const pos = floorList[i];
      const bay = Math.min(8, Math.max(1, Math.floor((pos.xMm / cLength) * 8) + 1));

      placedPallets.push({
        id: `pallet-${globalIndex + 1}`,
        palletTypeId: pallet.id,
        palletTypeName: pallet.name,
        index: globalIndex + 1,
        bayIndex: bay,
        rowIndex: pos.rowIndex,
        tierIndex: tier + 1,
        xMm: Math.round(pos.xMm),
        yMm: Math.round(yCenter),
        zMm: Math.round(pos.zMm),
        lengthMm: pos.lengthMm,
        widthMm: pos.widthMm,
        heightMm: pHeight,
        weightKg: singleWeightKg,
        rotated: pos.rotated,
        color: pallet.color || '#3b82f6'
      });

      globalIndex++;
      remainingToPlace--;
    }
  }

  placedPallets.sort((a, b) => {
    if (a.tierIndex !== b.tierIndex) return a.tierIndex - b.tierIndex;
    if (Math.abs(a.xMm - b.xMm) > 20) return a.xMm - b.xMm;
    return a.zMm - b.zMm;
  });

  placedPallets.forEach((p, idx) => {
    p.index = idx + 1;
  });

  const totalPallets = placedPallets.length;
  const singleCbm = pallet.cbmPerPallet > 0 ? pallet.cbmPerPallet : calculateCbm(pLength, pWidth, pHeight);
  const totalVolumeCbm = Math.round(totalPallets * singleCbm * 1000) / 1000;
  const totalWeightKg = totalPallets * singleWeightKg;
  const grossCombinedWeightKg = totalWeightKg + container.tareWeightKg;

  const volumeUtilizationPct = container.volumeCbm > 0
    ? Math.min(100, Math.round((totalVolumeCbm / container.volumeCbm) * 1000) / 10)
    : 0;
  const payloadUtilizationPct = container.maxPayloadKg > 0
    ? Math.min(100, Math.round((totalWeightKg / container.maxPayloadKg) * 1000) / 10)
    : 0;

  const remainingPayloadKg = Math.max(0, container.maxPayloadKg - totalWeightKg);
  const remainingVolumeCbm = Math.max(0, Math.round((container.volumeCbm - totalVolumeCbm) * 100) / 100);

  const centerOfGravity = calculateCenterOfGravity(placedPallets, container);
  const axleDistribution = calculateAxleDistribution(placedPallets, container, centerOfGravity);
  const bayWeights = calculateBayWeights(placedPallets, container);
  const dunnageRecommendations = generateDunnageAdvice(placedPallets, container, pallet, centerOfGravity);

  const palletsSummary: PalletTypeSummary[] = [
    {
      palletId: pallet.id,
      name: pallet.name,
      color: pallet.color,
      requestedQty: userRequestedLimit ?? theoreticalMaxPallets,
      placedQty: totalPallets,
      cbm: totalVolumeCbm,
      weightKg: totalWeightKg
    }
  ];

  const actualMaxCargoHeightMm = placedPallets.length > 0 ? (effectiveTiers * pHeight) : 0;
  const verticalClearanceMm = Math.max(0, effectiveMaxH - actualMaxCargoHeightMm);

  if (isHeightExceeded) {
    dunnageRecommendations.unshift(
      `CẢNH BÁO CHIỀU CAO: Chiều cao kiện hàng (${pHeight}mm) vượt quá chiều cao đóng hàng tối đa cho phép (${effectiveMaxH}mm)! Không thể xếp lọt container.`
    );
  } else if (pallet.heightMm > container.doorHeightMm) {
    dunnageRecommendations.unshift(
      `LƯU Ý CỬA: Chiều cao kiện hàng (${pHeight}mm) cao hơn mép cửa container (${container.doorHeightMm}mm), cần dùng xe nâng chuyên dụng hoặc cont mở nóc.`
    );
  } else if (verticalClearanceMm < 80 && placedPallets.length > 0) {
    dunnageRecommendations.unshift(
      `Khoảng sáng nóc chỉ còn ${verticalClearanceMm}mm so với giới hạn (${effectiveMaxH}mm): Cần cẩn trọng thao tác xe nâng chống va chạm trần cont.`
    );
  }

  return {
    placedPallets,
    palletsSummary,
    totalPallets,
    totalVolumeCbm,
    totalWeightKg,
    grossCombinedWeightKg,
    volumeUtilizationPct,
    payloadUtilizationPct,
    remainingPayloadKg,
    remainingVolumeCbm,
    centerOfGravity,
    axleDistribution,
    bayWeights,
    unplacedCount: Math.max(0, (userRequestedLimit ?? theoreticalMaxPallets) - totalPallets),
    arrangementName: isHeightExceeded ? 'Vượt quá chiều cao đóng hàng tối đa' : bestCandidate.name,
    dunnageRecommendations,
    maxLoadingHeightMm: effectiveMaxH,
    actualMaxCargoHeightMm,
    verticalClearanceMm,
    isHeightExceeded,
    loadingStrategy: 'priority_order'
  };
}

/**
 * Multi-Pallet Mixed Cargo Stowing Optimizer
 */
function optimizeMultiPalletTypes(
  palletList: PalletConfig[],
  container: ContainerDef,
  customMaxHeightMm?: number,
  loadingStrategy: LoadingSequenceStrategy = 'priority_order'
): PackingResult {
  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;
  const cHeight = container.innerHeightMm;
  const maxPayload = container.maxPayloadKg;
  const effectiveMaxH = (customMaxHeightMm && customMaxHeightMm > 0)
    ? Math.min(cHeight, customMaxHeightMm)
    : (container.maxLoadingHeightMm || cHeight);

  // Flatten items into unit queues, tracking loading priority
  const itemsToPack: {
    config: PalletConfig;
    unitIndex: number;
    weightKg: number;
    cbm: number;
    priority: number;
  }[] = [];

  palletList.forEach((p, idx) => {
    const qty = Math.max(1, p.quantity);
    const priority = p.loadingPriority ?? (idx + 1);
    for (let q = 0; q < qty; q++) {
      itemsToPack.push({
        config: p,
        unitIndex: q + 1,
        weightKg: Math.max(1, p.totalWeightKg),
        cbm: p.cbmPerPallet > 0 ? p.cbmPerPallet : calculateCbm(p.lengthMm, p.widthMm, p.heightMm),
        priority
      });
    }
  });

  // Sort queue according to chosen loading strategy
  if (loadingStrategy === 'priority_order') {
    // 1, 2, 3... - Priority 1 goes deepest into the cont first!
    itemsToPack.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.weightKg - a.weightKg;
    });
  } else if (loadingStrategy === 'lifo_reverse') {
    // LIFO (Dỡ hàng trước): Priority 1 dỡ trước nên được xếp sau cùng (gần cửa cont)
    itemsToPack.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.weightKg - a.weightKg;
    });
  } else if (loadingStrategy === 'volume_first') {
    itemsToPack.sort((a, b) => b.cbm - a.cbm);
  } else {
    // heavy_first
    itemsToPack.sort((a, b) => b.weightKg - a.weightKg);
  }

  const placedPallets: PlacedPallet[] = [];
  let currentTotalWeight = 0;

  // Floor 2D shelf / row packing with tier stacking
  let curX = 0;
  let globalIdx = 1;
  let itemQueueIndex = 0;

  // Floor tracking for stacking tier 2 on top of tier 1
  interface FloorSlot {
    pallet: PlacedPallet;
    xStart: number;
    xEnd: number;
    zStart: number;
    zEnd: number;
    topY: number;
    tier: number;
  }
  const placedSlots: FloorSlot[] = [];

  while (curX < cLength && itemQueueIndex < itemsToPack.length) {
    const currentItem = itemsToPack[itemQueueIndex];
    const cfg = currentItem.config;

    // Check payload limit
    if (currentTotalWeight + currentItem.weightKg > maxPayload) {
      break;
    }

    // Try normal (length along X, width along Z) or rotated (width along X, length along Z)
    let bestOrient: { lMm: number; wMm: number; rotated: boolean } | null = null;
    const canRotate = cfg.allowRotate;

    const orientNormal = { lMm: cfg.lengthMm, wMm: cfg.widthMm, rotated: false };
    const orientRot = { lMm: cfg.widthMm, wMm: cfg.lengthMm, rotated: true };

    const candidates = [orientNormal];
    if (canRotate && cfg.lengthMm !== cfg.widthMm) {
      candidates.push(orientRot);
    }

    // Test row packing across container width
    let bestRowFit: {
      orient: { lMm: number; wMm: number; rotated: boolean };
      colsCount: number;
    } | null = null;

    for (const cand of candidates) {
      if (curX + cand.lMm <= cLength && cand.wMm <= cWidth) {
        const cols = Math.floor(cWidth / cand.wMm);
        if (cols > 0) {
          if (!bestRowFit || cols > bestRowFit.colsCount || cand.lMm <= bestRowFit.orient.lMm) {
            bestRowFit = { orient: cand, colsCount: cols };
          }
        }
      }
    }

    if (!bestRowFit) {
      // Cannot fit any more rows along length
      break;
    }

    const rowL = bestRowFit.orient.lMm;
    const colW = bestRowFit.orient.wMm;
    const cols = bestRowFit.colsCount;
    const zGap = (cWidth - cols * colW) / (cols + 1);

    // Place pallets in this row across the width
    for (let c = 0; c < cols && itemQueueIndex < itemsToPack.length; c++) {
      const item = itemsToPack[itemQueueIndex];
      if (currentTotalWeight + item.weightKg > maxPayload) break;
      if (item.config.heightMm > effectiveMaxH) {
        // Exceeds max loading height, skip this item
        itemQueueIndex++;
        continue;
      }

      const pCenterL = bestRowFit.orient.lMm;
      const pCenterW = bestRowFit.orient.wMm;
      const xMid = curX + pCenterL / 2;
      const zMid = (c + 1) * zGap + c * colW + colW / 2;
      const yMid = item.config.heightMm / 2;
      const bay = Math.min(8, Math.max(1, Math.floor((xMid / cLength) * 8) + 1));

      const placed: PlacedPallet = {
        id: `pallet-${globalIdx}`,
        palletTypeId: item.config.id,
        palletTypeName: item.config.name,
        index: globalIdx,
        bayIndex: bay,
        rowIndex: Math.floor(curX / 1000),
        tierIndex: 1,
        xMm: Math.round(xMid),
        yMm: Math.round(yMid),
        zMm: Math.round(zMid),
        lengthMm: pCenterL,
        widthMm: pCenterW,
        heightMm: item.config.heightMm,
        weightKg: item.weightKg,
        rotated: bestRowFit.orient.rotated,
        color: item.config.color || '#3b82f6',
        loadingPriority: item.priority
      };

      placedPallets.push(placed);
      placedSlots.push({
        pallet: placed,
        xStart: curX,
        xEnd: curX + pCenterL,
        zStart: zMid - pCenterW / 2,
        zEnd: zMid + pCenterW / 2,
        topY: item.config.heightMm,
        tier: 1
      });

      currentTotalWeight += item.weightKg;
      globalIdx++;
      itemQueueIndex++;
    }

    curX += rowL;
  }

  // Tier 2 Stacking for stackable items if height and payload allow
  if (itemQueueIndex < itemsToPack.length) {
    for (const slot of placedSlots) {
      if (itemQueueIndex >= itemsToPack.length) break;
      const item = itemsToPack[itemQueueIndex];
      const cfg = item.config;

      if (cfg.maxTiers >= 2 && slot.topY + cfg.heightMm <= effectiveMaxH) {
        if (currentTotalWeight + item.weightKg <= maxPayload) {
          const xMid = (slot.xStart + slot.xEnd) / 2;
          const zMid = (slot.zStart + slot.zEnd) / 2;
          const yMid = slot.topY + cfg.heightMm / 2;
          const bay = Math.min(8, Math.max(1, Math.floor((xMid / cLength) * 8) + 1));

          const placed2: PlacedPallet = {
            id: `pallet-${globalIdx}`,
            palletTypeId: cfg.id,
            palletTypeName: cfg.name,
            index: globalIdx,
            bayIndex: bay,
            rowIndex: slot.pallet.rowIndex,
            tierIndex: 2,
            xMm: Math.round(xMid),
            yMm: Math.round(yMid),
            zMm: Math.round(zMid),
            lengthMm: slot.pallet.lengthMm,
            widthMm: slot.pallet.widthMm,
            heightMm: cfg.heightMm,
            weightKg: item.weightKg,
            rotated: slot.pallet.rotated,
            color: cfg.color || '#10b981',
            loadingPriority: item.priority
          };

          placedPallets.push(placed2);
          currentTotalWeight += item.weightKg;
          globalIdx++;
          itemQueueIndex++;
        }
      }
    }
  }

  // Symmetrical longitudinal centering:
  // If placed items take less than container length, shift them so cargo center aligns with container center!
  if (placedPallets.length > 0 && curX < cLength) {
    const maxX = Math.max(...placedPallets.map(p => p.xMm + p.lengthMm / 2));
    const minX = Math.min(...placedPallets.map(p => p.xMm - p.lengthMm / 2));
    const cargoSpan = maxX - minX;
    const idealStart = Math.max(0, (cLength - cargoSpan) / 2);
    const shift = idealStart - minX;

    if (Math.abs(shift) > 50) {
      placedPallets.forEach(p => {
        p.xMm = Math.round(p.xMm + shift);
        p.bayIndex = Math.min(8, Math.max(1, Math.floor((p.xMm / cLength) * 8) + 1));
      });
    }
  }

  // Sort loading sequence from front to door
  placedPallets.sort((a, b) => {
    if (a.tierIndex !== b.tierIndex) return a.tierIndex - b.tierIndex;
    if (Math.abs(a.xMm - b.xMm) > 20) return a.xMm - b.xMm;
    return a.zMm - b.zMm;
  });

  placedPallets.forEach((p, idx) => {
    p.index = idx + 1;
  });

  // Calculate summaries for each pallet batch
  const palletsSummary: PalletTypeSummary[] = palletList.map((p, idx) => {
    const placedThisType = placedPallets.filter(item => item.palletTypeId === p.id);
    const cbmOne = p.cbmPerPallet > 0 ? p.cbmPerPallet : calculateCbm(p.lengthMm, p.widthMm, p.heightMm);
    return {
      palletId: p.id,
      name: p.name,
      color: p.color,
      requestedQty: p.quantity,
      placedQty: placedThisType.length,
      cbm: Math.round(placedThisType.length * cbmOne * 1000) / 1000,
      weightKg: placedThisType.reduce((sum, item) => sum + item.weightKg, 0),
      loadingPriority: p.loadingPriority ?? (idx + 1)
    };
  });

  const totalPallets = placedPallets.length;
  const totalVolumeCbm = Math.round(palletsSummary.reduce((sum, s) => sum + s.cbm, 0) * 1000) / 1000;
  const totalWeightKg = palletsSummary.reduce((sum, s) => sum + s.weightKg, 0);
  const grossCombinedWeightKg = totalWeightKg + container.tareWeightKg;

  const volumeUtilizationPct = container.volumeCbm > 0
    ? Math.min(100, Math.round((totalVolumeCbm / container.volumeCbm) * 1000) / 10)
    : 0;
  const payloadUtilizationPct = container.maxPayloadKg > 0
    ? Math.min(100, Math.round((totalWeightKg / container.maxPayloadKg) * 1000) / 10)
    : 0;

  const remainingPayloadKg = Math.max(0, container.maxPayloadKg - totalWeightKg);
  const remainingVolumeCbm = Math.max(0, Math.round((container.volumeCbm - totalVolumeCbm) * 100) / 100);

  const centerOfGravity = calculateCenterOfGravity(placedPallets, container);
  const axleDistribution = calculateAxleDistribution(placedPallets, container, centerOfGravity);
  const bayWeights = calculateBayWeights(placedPallets, container);
  const dunnageRecommendations = generateDunnageAdvice(placedPallets, container, palletList[0], centerOfGravity);
  const isHeightExceeded = palletList.some(p => p.heightMm > effectiveMaxH);
  const actualMaxCargoHeightMm = placedPallets.length > 0
    ? Math.max(...placedPallets.map(p => p.yMm + p.heightMm / 2))
    : 0;
  const verticalClearanceMm = Math.max(0, effectiveMaxH - actualMaxCargoHeightMm);

  if (isHeightExceeded) {
    dunnageRecommendations.unshift(
      `CẢNH BÁO: Có lô hàng vượt quá chiều cao đóng hàng tối đa (${effectiveMaxH}mm), những pallet này đã bị từ chối xếp.`
    );
  } else if (verticalClearanceMm < 80 && placedPallets.length > 0) {
    dunnageRecommendations.unshift(
      `Khoảng sáng nóc chỉ còn ${verticalClearanceMm}mm so với giới hạn (${effectiveMaxH}mm): Cần cẩn trọng khi xe nâng rút hàng.`
    );
  }

  const totalRequested = palletList.reduce((sum, p) => sum + p.quantity, 0);

  const strategyLabel = loadingStrategy === 'priority_order'
    ? `Theo thứ tự ưu tiên 1, 2, 3... (${palletList.length} lô)`
    : loadingStrategy === 'lifo_reverse'
      ? `Theo thứ tự dỡ hàng LIFO (${palletList.length} lô)`
      : loadingStrategy === 'volume_first'
        ? `Ưu tiên kiện lớn trước (${palletList.length} lô)`
        : `Ưu tiên nặng xếp trước (${palletList.length} lô)`;

  return {
    placedPallets,
    palletsSummary,
    totalPallets,
    totalVolumeCbm,
    totalWeightKg,
    grossCombinedWeightKg,
    volumeUtilizationPct,
    payloadUtilizationPct,
    remainingPayloadKg,
    remainingVolumeCbm,
    centerOfGravity,
    axleDistribution,
    bayWeights,
    unplacedCount: Math.max(0, totalRequested - totalPallets),
    arrangementName: `Xếp ${strategyLabel}`,
    dunnageRecommendations,
    maxLoadingHeightMm: effectiveMaxH,
    actualMaxCargoHeightMm,
    verticalClearanceMm,
    isHeightExceeded,
    loadingStrategy
  };
}

function calculateCenterOfGravity(
  pallets: PlacedPallet[],
  container: ContainerDef
): CenterOfGravity {
  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;

  if (pallets.length === 0) {
    return {
      xMm: cLength / 2,
      yMm: 0,
      zMm: cWidth / 2,
      xPercentage: 50,
      zPercentage: 50,
      status: 'optimal',
      longitudinalBalance: 'optimal',
      lateralBalance: 'balanced',
      message: 'Container trống'
    };
  }

  let totalWeight = 0;
  let sumWeightX = 0;
  let sumWeightY = 0;
  let sumWeightZ = 0;

  for (const p of pallets) {
    totalWeight += p.weightKg;
    sumWeightX += p.weightKg * p.xMm;
    sumWeightY += p.weightKg * p.yMm;
    sumWeightZ += p.weightKg * p.zMm;
  }

  const cogX = sumWeightX / totalWeight;
  const cogY = sumWeightY / totalWeight;
  const cogZ = sumWeightZ / totalWeight;

  const xPercentage = Math.round((cogX / cLength) * 1000) / 10;
  const zPercentage = Math.round((cogZ / cWidth) * 1000) / 10;

  let longitudinalBalance: CenterOfGravity['longitudinalBalance'] = 'optimal';
  if (xPercentage < 44) {
    longitudinalBalance = 'front_heavy';
  } else if (xPercentage > 56) {
    longitudinalBalance = 'rear_heavy';
  }

  let lateralBalance: CenterOfGravity['lateralBalance'] = 'balanced';
  if (zPercentage < 47) {
    lateralBalance = 'left_heavy';
  } else if (zPercentage > 53) {
    lateralBalance = 'right_heavy';
  }

  let status: CenterOfGravity['status'] = 'optimal';
  let message = 'Trọng tâm container cân bằng lý tưởng theo tiêu chuẩn an toàn IMO/CTU';

  if (longitudinalBalance !== 'optimal' || lateralBalance !== 'balanced') {
    if (Math.abs(xPercentage - 50) > 10 || Math.abs(zPercentage - 50) > 5) {
      status = 'danger';
      message = 'Cảnh báo nguy hiểm: Trọng tâm lệch nghiêm trọng, nguy cơ mất lái hoặc quá tải trục xe!';
    } else {
      status = 'warning';
      message = 'Cảnh báo: Trọng tâm lệch nhẹ so với tâm hình học container, cần chèn lót hoặc cân chỉnh vị trí';
    }
  }

  return {
    xMm: Math.round(cogX),
    yMm: Math.round(cogY),
    zMm: Math.round(cogZ),
    xPercentage,
    zPercentage,
    status,
    longitudinalBalance,
    lateralBalance,
    message
  };
}

function calculateAxleDistribution(
  pallets: PlacedPallet[],
  container: ContainerDef,
  cog: CenterOfGravity
): AxleDistribution {
  const cLength = container.innerLengthMm;
  const totalCargoWeight = pallets.reduce((sum, p) => sum + p.weightKg, 0);

  if (totalCargoWeight === 0) {
    return {
      frontAxleKg: 0,
      rearAxleKg: 0,
      frontPercentage: 50,
      rearPercentage: 50,
      isSafe: true,
      recommendation: 'Trống'
    };
  }

  const normalizedX = cog.xMm / cLength;
  const cargoFront = totalCargoWeight * (1 - normalizedX);
  const cargoRear = totalCargoWeight * normalizedX;

  const frontTotal = Math.round(cargoFront + container.tareWeightKg * 0.48);
  const rearTotal = Math.round(cargoRear + container.tareWeightKg * 0.52);
  const combinedTotal = frontTotal + rearTotal;

  const frontPct = Math.round((frontTotal / combinedTotal) * 1000) / 10;
  const rearPct = Math.round((rearTotal / combinedTotal) * 1000) / 10;

  const isSafe = frontPct >= 42 && frontPct <= 58 && rearPct >= 42 && rearPct <= 58;
  const recommendation = isSafe
    ? 'Phân bổ cầu xe an toàn, tuân thủ tải trọng cầu trước và cụm trục sau rơ-moóc'
    : frontPct > 58
      ? 'Cảnh báo tải trọng dồn về đầu kéo (Kingpin), nên chuyển bớt pallet nặng về phía đuôi container'
      : 'Cảnh báo tải trọng dồn về cầu sau (Tandem axle), nguy cơ hẫng đầu kéo khi phanh gấp!';

  return {
    frontAxleKg: frontTotal,
    rearAxleKg: rearTotal,
    frontPercentage: frontPct,
    rearPercentage: rearPct,
    isSafe,
    recommendation
  };
}

function calculateBayWeights(
  pallets: PlacedPallet[],
  container: ContainerDef
): BayWeight[] {
  const bayCount = 6;
  const bayLength = container.innerLengthMm / bayCount;
  const bays: BayWeight[] = [];

  for (let b = 0; b < bayCount; b++) {
    const xStart = b * bayLength;
    const xEnd = (b + 1) * bayLength;

    const palletsInBay = pallets.filter(p => p.xMm >= xStart && p.xMm < xEnd);
    const weight = palletsInBay.reduce((sum, p) => sum + p.weightKg, 0);

    bays.push({
      bay: b + 1,
      xStartMm: Math.round(xStart),
      xEndMm: Math.round(xEnd),
      weightKg: weight,
      palletCount: palletsInBay.length
    });
  }

  return bays;
}

function generateDunnageAdvice(
  pallets: PlacedPallet[],
  container: ContainerDef,
  pallet: PalletConfig,
  cog: CenterOfGravity
): string[] {
  const advice: string[] = [];
  if (pallets.length === 0) return advice;

  const cLength = container.innerLengthMm;
  const cWidth = container.innerWidthMm;

  const maxPalletX = Math.max(...pallets.map(p => p.xMm + p.lengthMm / 2));
  const rearGap = cLength - maxPalletX;
  if (rearGap > 250) {
    advice.push(
      `Khoảng trống đuôi cont còn ${Math.round(rearGap)}mm: Cần lắp giằng gỗ chịu lực (Chocking/Bracing) hoặc lưới chắn cửa chống đổ khi mở cont.`
    );
  }

  const maxPalletZ = Math.max(...pallets.map(p => p.zMm + p.widthMm / 2));
  const minPalletZ = Math.min(...pallets.map(p => p.zMm - p.widthMm / 2));
  const sideGap = (cWidth - (maxPalletZ - minPalletZ)) / 2;
  if (sideGap > 120) {
    advice.push(
      `Khoảng hở hai bên vách là ${Math.round(sideGap)}mm: Khuyến nghị chèn túi khí chống xô lệch (Dunnage Air Bags) giữa các pallet.`
    );
  }

  const hasTier2 = pallets.some(p => p.tierIndex > 1);
  if (hasTier2) {
    advice.push(
      `Hàng đóng 2 tầng: Cần lót tấm phân bổ lực (Slip sheets / Plywood divider) giữa tầng 1 và tầng 2, quấn màng co PE căng chắc.`
    );
  }

  if (cog.status !== 'optimal') {
    advice.push(
      `Cân chỉnh trọng tâm: Hãy phân bổ các pallet nặng nhất vào khu vực khoang giữa (Bay 3, Bay 4) để đạt phân bổ 50/50.`
    );
  }

  return advice;
}
