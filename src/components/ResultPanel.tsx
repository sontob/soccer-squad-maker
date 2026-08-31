import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { QuarterResult, getSimilarityScore } from '../utils/algorithm';
import { Player } from '../types';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResultPanelProps {
  results: QuarterResult[];
  template: any; // unused now, but keeping for compatibility if needed
  allPlayers: Player[];
}

const ResultPanel: React.FC<ResultPanelProps> = ({ results, allPlayers }) => {
  const [activeTab, setActiveTab] = useState<number | 'STATISTICS'>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'totalPlayed', direction: 'desc' });
  
  const captureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Refs for off-screen rendering
  const offscreenRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!results || results.length === 0) return null;

  const stats = allPlayers.map(p => {
    let totalPlayed = 0;
    let gkPlayed = 0;
    let fieldPlayed = 0;
    let rested = 0;
    
    results.forEach(res => {
      let isPlaying = false;
      if (res.squad.gk && res.squad.gk.id === p.id) {
        totalPlayed++;
        gkPlayed++;
        isPlaying = true;
      } else {
        const inField = res.squad.field.flat().find(s => s.player && s.player.id === p.id);
        if (inField) {
          totalPlayed++;
          fieldPlayed++;
          isPlaying = true;
        }
      }
      
      const inBench = res.bench.find(b => b.id === p.id);
      if (inBench && !isPlaying) {
        rested++;
      }
    });
    
    return {
      ...p,
      totalPlayed,
      gkPlayed,
      fieldPlayed,
      rested
    };
  });

  const sortedStats = useMemo(() => {
    return [...stats].sort((a: any, b: any) => {
      if (sortConfig.key === 'name') {
        const comp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? comp : -comp;
      } else {
        const valA = a[sortConfig.key] || 0;
        const valB = b[sortConfig.key] || 0;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
    });
  }, [stats, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = key === 'name' ? 'asc' : 'desc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return <span className="ml-1 text-indigo-500 inline-block text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500 text-white border-green-600';
    if (score >= 50) return 'bg-yellow-500 text-white border-yellow-600';
    return 'bg-red-500 text-white border-red-600';
  };

  const getPositionOffsetClass = (pos: string) => {
    if (!pos) return "";
    if (["DM", "LDM", "RDM"].includes(pos)) return "translate-y-6"; // 아래로
    if (["CB", "LCB", "RCB"].includes(pos)) return "translate-y-2"; // 살짝 아래로
    if (["ST", "CF"].includes(pos)) return "-translate-y-2"; // 톱은 살짝 위로
    return "";
  };

  const captureElement = async (element: HTMLDivElement, filename: string) => {
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null,
        windowHeight: element.scrollHeight
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (e) {
      console.error("이미지 저장 실패", e);
      throw e;
    }
  };

  const handleDownloadSingle = async () => {
    setIsDownloadMenuOpen(false);
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);
    setDownloadProgress("저장 중...");
    
    try {
      await captureElement(
        captureRef.current, 
        `스쿼드_${activeTab === 'STATISTICS' ? '종합' : `${activeTab}쿼터`}.png`
      );
      toast.success("이미지 저장 완료!");
    } catch (e) {
      alert("이미지 캡처에 실패했습니다.");
    } finally {
      setIsCapturing(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadAllFiles = async () => {
    setIsDownloadMenuOpen(false);
    if (isCapturing) return;
    setIsCapturing(true);
    
    const tabsToCapture = [...results.map(r => r.quarter.toString()), 'STATISTICS'];
    
    try {
      for (let i = 0; i < tabsToCapture.length; i++) {
        const tab = tabsToCapture[i];
        setDownloadProgress(`저장 중 (${i + 1}/${tabsToCapture.length})...`);
        
        const el = offscreenRefs.current[tab];
        if (el) {
          const filename = `스쿼드_${tab === 'STATISTICS' ? '종합' : `${tab}쿼터`}.png`;
          await captureElement(el, filename);
          // 브라우저 멈춤을 방지하기 위한 지연 시간
          await new Promise(res => setTimeout(res, 300));
        }
      }
      toast.success("이미지 저장 완료!");
    } catch (e) {
      alert("일괄 캡처 중 오류가 발생했습니다.");
    } finally {
      setIsCapturing(false);
      setDownloadProgress(null);
    }
  };

  const renderStatsView = (isOffscreen = false) => (
    <div className={`flex-1 bg-white ${isOffscreen ? 'h-auto overflow-visible' : 'overflow-x-auto h-full'}`}>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b select-none">
          <tr>
            <th onClick={() => handleSort('name')} className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors">이름{getSortIcon('name')}</th>
            <th onClick={() => handleSort('totalPlayed')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors">총 출전{getSortIcon('totalPlayed')}</th>
            <th onClick={() => handleSort('fieldPlayed')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors">필드 출전{getSortIcon('fieldPlayed')}</th>
            <th onClick={() => handleSort('gkPlayed')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors">GK 출전{getSortIcon('gkPlayed')}</th>
            <th onClick={() => handleSort('rested')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors">휴식{getSortIcon('rested')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedStats.map(s => (
            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                {s.name}
                <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded">{s.pos1}</span>
              </td>
              <td className="px-4 py-3 text-center font-bold text-indigo-600">{s.totalPlayed}</td>
              <td className="px-4 py-3 text-center text-slate-600">{s.fieldPlayed}</td>
              <td className="px-4 py-3 text-center text-slate-600">{s.gkPlayed}</td>
              <td className="px-4 py-3 text-center text-slate-400">{s.rested}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPitchView = (result: QuarterResult) => (
    <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0 bg-white h-full">
      <div className="flex-1 w-full max-w-[500px] mx-auto h-[550px] sm:h-[600px] bg-green-600 rounded-xl border-2 sm:border-4 border-white shadow-lg relative p-2 sm:p-4 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-b-2 border-l-2 border-r-2 border-white/30"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[15%] border-t-2 border-l-2 border-r-2 border-white/30"></div>
        <div className="absolute top-1/2 left-0 w-full border-b-2 border-white/30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full border-2 border-white/30"></div>
        
        <div className="flex flex-col justify-around flex-1 z-10 py-4 gap-4 px-2 w-full max-w-full">
          {[...result.squad.field].reverse().map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-row justify-center items-center w-full max-w-full flex-wrap gap-x-2 gap-y-4">
              {row.map((slot, colIndex) => {
                const hasPlayer = slot.player !== null;
                const score = hasPlayer ? getSimilarityScore(slot.player!, slot.targetPosition) : 0;
                const colorClass = hasPlayer ? getBadgeColor(score) : 'bg-slate-300/50 border-slate-400/50 text-transparent';

                return (
                  <div key={colIndex} className={`flex flex-col items-center gap-1.5 transition-transform duration-300 shrink ${hasPlayer ? 'hover:scale-105' : 'opacity-70'} ${getPositionOffsetClass(slot.targetPosition)}`}>
                    <span className="inline-block text-[10px] text-white/80 font-bold tracking-wider mb-0.5 shrink-0 leading-normal pb-0.5">
                      {slot.targetPosition}
                    </span>
                    <div className={`px-2 pt-1.5 pb-2 min-h-[2rem] rounded-full text-xs font-bold border-2 shadow-md flex items-center justify-center min-w-[60px] max-w-[5rem] shrink ${colorClass}`}>
                      <span className="truncate inline-block w-full text-center leading-normal pb-0.5">
                        {hasPlayer ? slot.player!.name : '공석'}
                      </span>
                    </div>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 pt-0.5 pb-1 rounded shadow-sm shrink-0 leading-normal ${hasPlayer ? 'text-white/90 bg-black/40' : 'text-transparent bg-transparent'}`}>
                      {hasPlayer ? slot.player!.pos1 : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-center z-10 pb-2 pt-4 shrink-0">
          <div className={`flex flex-col items-center gap-1.5 transition-transform ${result.squad.gk ? 'hover:scale-105' : 'opacity-70'}`}>
            <span className="inline-block text-[10px] text-white/80 font-bold tracking-wider mb-0.5 leading-normal pb-0.5">GK</span>
            <div className={`px-2 pt-1.5 pb-2 min-h-[2rem] rounded-full text-xs font-bold border-2 shadow-md flex items-center justify-center min-w-[60px] max-w-[5rem] shrink ${result.squad.gk ? getBadgeColor(getSimilarityScore(result.squad.gk, 'GOALKEEPER')) : 'bg-slate-300/50 border-slate-400/50 text-transparent'}`}>
              <span className="truncate inline-block w-full text-center leading-normal pb-0.5">
                {result.squad.gk ? result.squad.gk.name : '공석'}
              </span>
            </div>
            <span className={`inline-block text-[10px] font-semibold px-1.5 pt-0.5 pb-1 rounded shadow-sm leading-normal ${result.squad.gk ? 'text-white/90 bg-black/40' : 'text-transparent bg-transparent'}`}>
              {result.squad.gk ? 'GK' : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-64 flex flex-col gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex-1">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-xs">{result.bench.length}</span>
            이번 쿼터 벤치
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.bench.length > 0 ? result.bench.map(bp => (
              <div key={bp.id} className="bg-white border border-slate-300 text-slate-600 px-3 pt-1.5 pb-2 min-h-[2rem] rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                <span className="inline-block leading-normal pb-0.5">{bp.name}</span>
              </div>
            )) : (
              <div className="w-full text-center py-6 text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-lg">
                휴식 멤버가 없습니다.
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
           <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">뱃지 색상 안내</h3>
           <ul className="text-xs text-slate-600 space-y-2.5">
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm border border-green-600"></span> 
               <span>1·2순위와 일치 (만족)</span>
             </li>
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm border border-yellow-600"></span> 
               <span>유사 포지션 배치 (보통)</span>
             </li>
             <li className="flex items-center gap-3">
               <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm border border-red-600"></span> 
               <span>강제 차출 / 불일치 (불만족)</span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );

  const activeResult = results.find(r => r.quarter === activeTab);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[600px] h-full relative">
      <div className="flex flex-col md:flex-row gap-3 md:gap-2 mb-4 overflow-visible pb-2 border-b border-slate-100 md:items-center">
        <div className="flex flex-wrap gap-2">
        {results.map(res => (
          <button
            key={res.quarter}
            onClick={() => setActiveTab(res.quarter)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === res.quarter 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {res.quarter}쿼터
          </button>
        ))}
        </div>
        
        <div className="md:ml-auto flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <button
            onClick={() => setActiveTab('STATISTICS')}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'STATISTICS' 
                ? 'bg-indigo-800 text-white shadow-md' 
                : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
            }`}
          >
            종합 통계
          </button>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
              disabled={isCapturing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors border shadow-sm ${
                isCapturing 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 active:scale-95'
              }`}
            >
              {isCapturing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {downloadProgress || '저장 중...'}</>
              ) : (
                <><Download className="w-4 h-4" /> 이미지로 저장 <ChevronDown className="w-4 h-4 opacity-70" /></>
              )}
            </button>
            
            {isDownloadMenuOpen && !isCapturing && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-[9999] overflow-visible">
                <button
                  onClick={handleDownloadSingle}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  현재 탭만 저장
                </button>
                <button
                  onClick={handleDownloadAllFiles}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors border-t border-slate-100"
                >
                  모든 탭 일괄 저장
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={captureRef} className="flex-1 flex flex-col pt-2 -mx-4 px-4 bg-white overflow-hidden">
        {activeTab === 'STATISTICS' ? renderStatsView() : (activeResult ? renderPitchView(activeResult) : null)}
      </div>

      {/* Hidden Off-screen rendering for all tabs (for batch capture) */}
      <div className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none flex flex-col gap-8">
        {results.map(res => (
          <div 
            key={`hidden-quarter-${res.quarter}`}
            ref={el => { offscreenRefs.current[res.quarter.toString()] = el; }}
            className="p-6 bg-white w-[1000px] h-[700px] flex flex-col overflow-visible"
          >
            {renderPitchView(res)}
          </div>
        ))}
        <div 
          key="hidden-statistics"
          ref={el => { offscreenRefs.current['STATISTICS'] = el; }}
          className="p-6 bg-white w-[1000px] h-auto flex flex-col overflow-visible"
        >
          {renderStatsView(true)}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
