/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { SidebarConfig } from './components/SidebarConfig';
import { ThreeScene, CameraPreset, ContainerViewMode } from './components/ThreeCanvas/ThreeScene';
import { ControlDock } from './components/ControlDock';
import { ContainerManagerModal } from './components/ContainerManagerModal';
import { LoadPlanReportModal } from './components/LoadPlanReportModal';
import { GuideModal } from './components/GuideModal';
import { GitExportModal } from './components/GitExportModal';
import { ContainerDef, PalletConfig, PalletStandard, PlacedPallet } from './types/logistics';
import {
  loadAllContainers,
  saveCustomContainer,
  deleteCustomContainer,
  resetContainersToDefault,
  loadSavedPalletList,
  savePalletList,
  createDefaultPalletItem
} from './utils/containerStorage';
import { optimizePalletPacking } from './utils/packingOptimizer';

export default function App() {
  // 1. Container & Pallet State
  const [containers, setContainers] = useState<ContainerDef[]>(() => loadAllContainers());
  const [activeContainerId, setActiveContainerId] = useState<string>(() => {
    const list = loadAllContainers();
    return list[0]?.id || 'cont-20gp';
  });

  const activeContainer = useMemo(() => {
    return containers.find(c => c.id === activeContainerId) || containers[0];
  }, [containers, activeContainerId]);

  // Multi-Pallet List State
  const [pallets, setPallets] = useState<PalletConfig[]>(() => loadSavedPalletList());
  const [activePalletId, setActivePalletId] = useState<string>(() => {
    const list = loadSavedPalletList();
    return list[0]?.id || 'pallet-1';
  });

  const activePallet = useMemo(() => {
    return pallets.find(p => p.id === activePalletId) || pallets[0];
  }, [pallets, activePalletId]);

  // Maximum cargo loading height override (mm)
  const [customMaxHeightMm, setCustomMaxHeightMm] = useState<number | undefined>(undefined);

  // 2. Compute Packing Optimization & Balance Result across all pallets
  const packingResult = useMemo(() => {
    if (!activeContainer) {
      return optimizePalletPacking(pallets, containers[0], customMaxHeightMm);
    }
    return optimizePalletPacking(pallets, activeContainer, customMaxHeightMm);
  }, [pallets, activeContainer, customMaxHeightMm]);

  // 3. UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContainerManagerOpen, setIsContainerManagerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);

  // 4. 3D View Controls
  const [viewMode, setViewMode] = useState<ContainerViewMode>('translucent');
  const [showCoG, setShowCoG] = useState(true);
  const [showMaxHeightPlane, setShowMaxHeightPlane] = useState(true);
  const [doorsOpen, setDoorsOpen] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [visiblePalletCount, setVisiblePalletCount] = useState<number>(packingResult.totalPallets);
  const [hoveredPallet, setHoveredPallet] = useState<PlacedPallet | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<PlacedPallet | null>(null);

  // Sync visible pallet count when totalPallets changes
  useEffect(() => {
    setVisiblePalletCount(packingResult.totalPallets);
  }, [packingResult.totalPallets]);

  // Save pallets changes to local storage
  const updatePalletsList = useCallback((newList: PalletConfig[]) => {
    setPallets(newList);
    savePalletList(newList);
  }, []);

  const handleUpdatePallet = useCallback((updated: PalletConfig) => {
    setPallets(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        savePalletList(next);
        return next;
      }
      return prev;
    });
  }, []);

  // Add new pallet batch
  const handleAddPallet = useCallback((standardType: PalletStandard = 'eur1') => {
    const nextIdx = pallets.length + 1;
    const newItem = createDefaultPalletItem(standardType, nextIdx);
    const updated = [...pallets, newItem];
    updatePalletsList(updated);
    setActivePalletId(newItem.id);
    setIsSidebarOpen(true);
  }, [pallets, updatePalletsList]);

  // Delete pallet batch
  const handleDeletePallet = useCallback((id: string) => {
    if (pallets.length <= 1) return;
    const updated = pallets.filter(p => p.id !== id);
    updatePalletsList(updated);
    if (activePalletId === id) {
      setActivePalletId(updated[0]?.id || '');
    }
  }, [pallets, activePalletId, updatePalletsList]);

  // Duplicate pallet batch
  const handleDuplicatePallet = useCallback((id: string) => {
    const target = pallets.find(p => p.id === id);
    if (!target) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const newColor = colors[pallets.length % colors.length];

    const copyItem: PalletConfig = {
      ...target,
      id: `pallet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${target.name} (Bản sao)`,
      color: newColor
    };
    const updated = [...pallets, copyItem];
    updatePalletsList(updated);
    setActivePalletId(copyItem.id);
  }, [pallets, updatePalletsList]);

  // Quick change quantity (+1, -1)
  const handleQuickChangeQuantity = useCallback((id: string, delta: number) => {
    setPallets(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx >= 0) {
        const next = [...prev];
        const nextQty = Math.max(0, next[idx].quantity + delta);
        next[idx] = { ...next[idx], quantity: nextQty };
        savePalletList(next);
        return next;
      }
      return prev;
    });
  }, []);

  // Auto Fill / Maximize Pallets in Container
  const handleAutoFillContainer = useCallback(() => {
    if (!activeContainer || pallets.length === 0) return;

    // Calculate maximum floor capacity estimation
    const cL = activeContainer.innerLengthMm;
    const cW = activeContainer.innerWidthMm;
    const cH = activeContainer.innerHeightMm;
    const maxWeight = activeContainer.maxPayloadKg;

    // Estimate total pallets that could fit
    const activeP = activePallet || pallets[0];
    const tiers = Math.max(1, Math.min(activeP.maxTiers, Math.floor(cH / activeP.heightMm)));
    const rows = Math.floor(cL / activeP.lengthMm);
    const cols = Math.floor(cW / activeP.widthMm);
    const floorEst = Math.max(8, rows * cols);
    const maxEst = Math.min(floorEst * tiers, Math.floor(maxWeight / Math.max(10, activeP.totalWeightKg)));

    // Distribute among pallets
    const share = Math.max(1, Math.floor(maxEst / pallets.length));
    const updated = pallets.map((p, i) => {
      const extra = i === 0 ? maxEst - share * (pallets.length - 1) : share;
      return {
        ...p,
        quantity: Math.max(1, extra)
      };
    });

    updatePalletsList(updated);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch {
      // ignore
    }
  }, [activeContainer, pallets, activePallet, updatePalletsList]);

  // Container management handlers
  const handleSelectContainer = useCallback((container: ContainerDef) => {
    setActiveContainerId(container.id);
  }, []);

  const handleSaveContainer = useCallback((newCont: Omit<ContainerDef, 'id' | 'type'> & { id?: string }) => {
    const saved = saveCustomContainer(newCont);
    const updatedList = loadAllContainers();
    setContainers(updatedList);
    setActiveContainerId(saved.id);
  }, []);

  const handleDeleteContainer = useCallback((id: string) => {
    deleteCustomContainer(id);
    const updatedList = loadAllContainers();
    setContainers(updatedList);
    if (activeContainerId === id) {
      setActiveContainerId(updatedList[0]?.id || 'cont-20gp');
    }
  }, [activeContainerId]);

  const handleResetDefaults = useCallback(() => {
    resetContainersToDefault();
    const defaultList = loadAllContainers();
    setContainers(defaultList);
    setActiveContainerId(defaultList[0]?.id || 'cont-20gp');
  }, []);

  const handleResetCamera = useCallback(() => {
    setCameraPreset('iso');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f19] select-none">
      {/* Top Navigation Header */}
      <Header
        container={activeContainer}
        pallet={activePallet}
        packingResult={packingResult}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenContainerManager={() => setIsContainerManagerOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenGitModal={() => setIsGitModalOpen(true)}
        onAddPallet={() => handleAddPallet('eur1')}
        onAutoFillContainer={handleAutoFillContainer}
      />

      {/* Main Full-Bleed 3D Viewport */}
      <main className="absolute inset-0 pt-16 z-0">
        <ThreeScene
          container={activeContainer}
          packingResult={packingResult}
          viewMode={viewMode}
          showCoG={showCoG}
          showMaxHeightPlane={showMaxHeightPlane}
          doorsOpen={doorsOpen}
          visiblePalletCount={visiblePalletCount}
          cameraPreset={cameraPreset}
          selectedPallet={selectedPallet}
          onHoverPallet={setHoveredPallet}
          onSelectPallet={setSelectedPallet}
        />
      </main>

      {/* Collapsible Left Configuration Drawer (Multi-Pallet Manifest) */}
      <SidebarConfig
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        containers={containers}
        activeContainer={activeContainer}
        onSelectContainer={handleSelectContainer}
        pallets={pallets}
        activePalletId={activePalletId}
        onSelectActivePallet={setActivePalletId}
        onUpdatePallet={handleUpdatePallet}
        onAddPallet={handleAddPallet}
        onDeletePallet={handleDeletePallet}
        onDuplicatePallet={handleDuplicatePallet}
        onQuickChangeQuantity={handleQuickChangeQuantity}
        onAutoFillContainer={handleAutoFillContainer}
        packingResult={packingResult}
        onOpenContainerManager={() => setIsContainerManagerOpen(true)}
        customMaxHeightMm={customMaxHeightMm}
        onCustomMaxHeightChange={setCustomMaxHeightMm}
      />

      {/* Sleek Collapsible Bottom Control Dock (Three.js skill directive) */}
      <ControlDock
        totalPallets={packingResult.totalPallets}
        visiblePalletCount={visiblePalletCount}
        onVisiblePalletChange={setVisiblePalletCount}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showCoG={showCoG}
        onToggleCoG={() => setShowCoG(!showCoG)}
        showMaxHeightPlane={showMaxHeightPlane}
        onToggleMaxHeightPlane={() => setShowMaxHeightPlane(!showMaxHeightPlane)}
        doorsOpen={doorsOpen}
        onToggleDoors={() => setDoorsOpen(!doorsOpen)}
        hoveredPallet={hoveredPallet}
        selectedPallet={selectedPallet}
        onResetCamera={handleResetCamera}
      />

      {/* Modal 1: Container Manager & Creator */}
      <ContainerManagerModal
        isOpen={isContainerManagerOpen}
        onClose={() => setIsContainerManagerOpen(false)}
        containers={containers}
        activeContainerId={activeContainerId}
        onSelectContainer={handleSelectContainer}
        onSaveContainer={handleSaveContainer}
        onDeleteContainer={handleDeleteContainer}
        onResetDefaults={handleResetDefaults}
      />

      {/* Modal 2: Packing Plan & Weight Balance Report Manifest */}
      <LoadPlanReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        container={activeContainer}
        pallet={activePallet}
        pallets={pallets}
        packingResult={packingResult}
      />

      {/* Modal 3: Logistics Guidelines & User Guide */}
      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Modal 4: Git Export & Troubleshooting Modal */}
      <GitExportModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
      />
    </div>
  );
}
