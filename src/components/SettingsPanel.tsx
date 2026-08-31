import React, { useState } from 'react';
import { Settings } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  formationError: string | null;
}

const FORMATION_OPTIONS: Record<number, string[]> = {
  11: ["4-4-2", "4-2-3-1", "4-3-3", "3-5-2", "3-4-1-2", "3-4-3"],
  10: ["4-4-1", "4-3-2", "3-4-2", "3-3-3"],
  9: ["3-3-2", "3-4-1", "2-4-2", "3-2-3"],
  8: ["3-3-1", "3-2-2", "2-3-2"],
  6: ["2-1-2", "2-2-1", "3-2"],
  5: ["2-2", "1-2-1", "3-1", "1-3"]
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, formationError }) => {
  const [quarterWarning, setQuarterWarning] = useState<string | null>(null);

  const handleQuartersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 8) {
      val = 8;
      setQuarterWarning("최적화 연산 과부하를 막기 위해 최대 8쿼터까지만 설정할 수 있습니다.");
    } else {
      setQuarterWarning(null);
    }
    if (val < 1) val = 1;
    
    setSettings(prev => ({ ...prev, totalQuarters: val }));
  };

  const handlePlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPlayers = parseInt(e.target.value) || 0;
    
    if (newPlayers > 11) {
      newPlayers = 11;
      alert("경기 인원은 최대 11명까지 설정할 수 있습니다.");
    } else if (newPlayers > 0 && newPlayers < 5) {
      newPlayers = 5;
      alert("최소 5명 이상의 경기 인원이 필요합니다.");
    }
    
    const availableFormations = FORMATION_OPTIONS[newPlayers] || [];
    
    setSettings(prev => ({ 
      ...prev, 
      playersPerMatch: newPlayers,
      formation: availableFormations.length > 0 ? availableFormations[0] : ""
    }));
  };

  const currentFormations = FORMATION_OPTIONS[settings.playersPerMatch] || [];
  const isCustom = settings.formation === "" || !currentFormations.includes(settings.formation);

  const handleFormationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setSettings(prev => ({ ...prev, formation: "" }));
    } else {
      setSettings(prev => ({ ...prev, formation: val }));
    }
  };

  // 인원수에 따른 커스텀 플레이스홀더 동적 생성
  const getCustomPlaceholder = (playersPerMatch: number) => {
    const fieldPlayers = playersPerMatch - 1;
    if (fieldPlayers <= 0) return "예: 0";
    if (fieldPlayers === 10) return "예: 4-1-4-1";
    if (fieldPlayers === 6) return "예: 2-3-1";
    if (fieldPlayers > 2) {
      const d = Math.floor(fieldPlayers / 3);
      const m = Math.floor((fieldPlayers - d) / 2);
      const f = fieldPlayers - d - m;
      return `예: ${d}-${m}-${f}`;
    }
    return `예: ${fieldPlayers}`;
  };
  
  const customPlaceholder = getCustomPlaceholder(settings.playersPerMatch);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold mb-5 text-slate-800 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        기본 설정
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">총 쿼터 수</label>
          <div className="relative">
            <input 
              type="number" 
              min="1"
              max="8"
              value={settings.totalQuarters}
              onChange={handleQuartersChange}
              className={`w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                quarterWarning ? 'border-amber-400 focus:ring-amber-500 focus:border-amber-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">경기 인원수</label>
          <div className="relative">
            <input 
              type="number" 
              min="5"
              max="11"
              value={settings.playersPerMatch}
              onChange={handlePlayersChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">포메이션</label>
          <div className="relative flex flex-col gap-2">
            <div className="relative">
              <select
                value={isCustom ? "custom" : settings.formation}
                onChange={handleFormationSelect}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
              >
                {currentFormations.map(fmt => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
                <option value="custom">직접 입력</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {isCustom && (
              <div className="flex flex-col gap-1 mt-1">
                <input 
                  type="text"
                  value={settings.formation}
                  onChange={(e) => setSettings(prev => ({ ...prev, formation: e.target.value }))}
                  placeholder={customPlaceholder}
                  className={`w-full p-2.5 bg-white border rounded-lg focus:ring-2 focus:outline-none transition-all ${
                    formationError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 에러 메시지는 전체 폼 아래에 배치하여 공간을 덜 차지하도록 함 */}
      {isCustom && formationError && settings.formation !== "" && (
        <div className="mt-3 text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {formationError}
        </div>
      )}
      
      {quarterWarning && (
        <div className="mt-3 text-sm text-amber-600 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          {quarterWarning}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
