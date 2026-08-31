import { useState, useEffect, useRef } from 'react';
import { Settings, Player } from './types';
import { parseFormation, parseFormationToTemplate, generateDefaultPlayers, generateSquads, QuarterResult } from './utils/algorithm';
import SettingsPanel from './components/SettingsPanel';
import PlayerPanel from './components/PlayerPanel';
import ResultPanel from './components/ResultPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import toast, { Toaster } from 'react-hot-toast';

const getFormationError = (formation: string, playersPerMatch: number): string | null => {
  if (!formation) return "포메이션을 입력해주세요.";
  if (formation === "custom") return "포메이션을 입력해주세요.";
  
  const fieldPlayers = playersPerMatch - 1;
  const parts = formation.split('-');
  
  if (parts.length < 2) return "올바른 형식이 아닙니다. (예: 4-4-2)";
  
  let sum = 0;
  for (const part of parts) {
    const num = parseInt(part.trim(), 10);
    if (isNaN(num)) return "올바른 형식이 아닙니다. (숫자와 하이픈만 사용)";
    sum += num;
  }
  
  if (sum !== fieldPlayers) {
    return `숫자의 합이 필드 플레이어 수(${fieldPlayers}명)와 다릅니다. 현재 합: ${sum}명`;
  }
  
  return null;
};

const INITIAL_SETTINGS = {
  totalQuarters: 4,
  playersPerMatch: 11,
  formation: '4-2-3-1'
};

function App() {
  const [settingsOriginal, setSettingsOriginal] = useLocalStorage<Settings>('squadBuilderSettings', INITIAL_SETTINGS);

  const [playersOriginal, setPlayersOriginal] = useLocalStorage<Player[]>('squadBuilderPlayers', () => 
    generateDefaultPlayers(INITIAL_SETTINGS.playersPerMatch, INITIAL_SETTINGS.totalQuarters)
  );

  const [needsUpdate, setNeedsUpdate] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const setSettings = (val: any) => {
    setSettingsOriginal(val);
    if (!isFirstRender.current) setNeedsUpdate(true);
  };

  const setPlayers = (val: any) => {
    setPlayersOriginal(val);
    if (!isFirstRender.current) setNeedsUpdate(true);
  };
  
  // Use getters to match original variable names in the rest of the component
  const settings = settingsOriginal;
  const players = playersOriginal;

  const [squadResults, setSquadResults] = useState<QuarterResult[]>([]);
  
  const prevPlayersPerMatchRef = useRef(INITIAL_SETTINGS.playersPerMatch);
  const prevTotalQuartersRef = useRef(INITIAL_SETTINGS.totalQuarters);

  // 경기 인원수 변경 시 사용자 추가 슬롯 보존 및 자동 조절
  useEffect(() => {
    const A = prevPlayersPerMatchRef.current;
    const B = settings.playersPerMatch;

    if (A === B) return;

    setPlayers(prev => {
      // 기본 슬롯과 사용자 추가 슬롯 분리
      // (만약 사용자가 삭제해서 prev.length < A 라면 slice는 알아서 처리됨)
      const baseSlots = prev.slice(0, A);
      const userAddedSlots = prev.slice(A);
      
      if (A < B) {
        // 증가한 경우: 늘어난 숫자(B - A)만큼 생성하여 기본 슬롯 아래(사용자 추가 슬롯 위)에 끼워 넣음
        const diff = B - A;
        const newPlayers = generateDefaultPlayers(diff, settings.totalQuarters, baseSlots.length);
        return [...baseSlots, ...newPlayers, ...userAddedSlots];
      } else {
        // 감소한 경우: 기본 슬롯을 앞에서부터 B명까지만 남기고 자른 뒤 사용자 추가 슬롯 이어 붙임
        const newBaseSlots = baseSlots.slice(0, B);
        return [...newBaseSlots, ...userAddedSlots];
      }
    });

    prevPlayersPerMatchRef.current = B;
  }, [settings.playersPerMatch]);

  // 총 쿼터 수 변경 시 동적 업데이트 로직
  useEffect(() => {
    const oldQ = prevTotalQuartersRef.current;
    const newQ = settings.totalQuarters;

    if (oldQ === newQ) return;

    setPlayers(prev => prev.map(player => {
      // 1. 기존 참여 가능 쿼터가 이전 총 쿼터 수와 동일했다면, 새 총 쿼터 수로 자동 업데이트
      const updatedAvailable = player.availableQuarters === oldQ ? newQ : player.availableQuarters;
      
      // 2. 불참 쿼터 중 새 총 쿼터 수를 초과하는 값(예: 6 -> 4로 줄었을 때 5, 6)을 배열에서 제거
      const updatedAbsent = player.absentQuarters.filter(q => q <= newQ);
      
      if (updatedAvailable === player.availableQuarters && updatedAbsent.length === player.absentQuarters.length) {
        return player;
      }
      
      return {
        ...player,
        availableQuarters: updatedAvailable,
        absentQuarters: updatedAbsent
      };
    }));

    prevTotalQuartersRef.current = newQ;
  }, [settings.totalQuarters]);

  const handleGenerateSquad = () => {
    const template = parseFormationToTemplate(settings.formation);
    const results = generateSquads(players, settings.totalQuarters, template);
    setSquadResults(results);
    setNeedsUpdate(false);
    toast.success('스쿼드 생성 완료!');
  };

  const formationError = getFormationError(settings.formation, settings.playersPerMatch);
  
  const hasGenerated = squadResults.length > 0;

  const getButtonState = () => {
    if (formationError) return { text: "포메이션 오류", className: "bg-slate-300 text-slate-500 cursor-not-allowed" };
    if (!hasGenerated) return { text: "스쿼드 생성", className: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transform hover:-translate-y-0.5" };
    if (needsUpdate) return { text: "변경사항 적용 (스쿼드 재생성)", className: "bg-amber-500 hover:bg-amber-600 text-white animate-pulse" };
    return { text: "스쿼드 재생성", className: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transform hover:-translate-y-0.5" };
  };

  const buttonState = getButtonState();

  return (
    <>
    <Toaster position="top-center" />
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen p-4 lg:p-6 gap-6 bg-slate-100 lg:overflow-hidden text-slate-900 font-sans">
      {/* 좌측: 설정 및 선수 입력 폼 */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col gap-6 lg:overflow-y-auto pr-0 lg:pr-2 pb-4">
        
        <header className="mb-2">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">축구 스쿼드 메이커</h1>
          <p className="text-sm text-slate-500 mt-1">기본 설정과 선수 명단을 입력하고 스쿼드를 생성하세요.</p>
        </header>

        <SettingsPanel settings={settings} setSettings={setSettings} formationError={formationError} />
        <PlayerPanel 
          players={players} 
          setPlayers={setPlayers} 
          totalQuarters={settings.totalQuarters}
          playersPerMatch={settings.playersPerMatch}
        />
        
        <button 
          onClick={handleGenerateSquad}
          disabled={!!formationError}
          className={`mt-2 w-full font-bold py-4 px-6 rounded-xl shadow-md transition-all duration-200 ease-in-out ${buttonState.className}`}
        >
          {buttonState.text}
        </button>
      </div>

      {/* 우측 결과 출력 영역 */}
      <div className="w-full lg:w-1/2 min-h-[600px] flex flex-col">
        {squadResults.length > 0 ? (
          <ResultPanel 
            results={squadResults} 
            template={parseFormationToTemplate(settings.formation)} 
            allPlayers={players} 
          />
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium mb-1">결과 출력 영역</p>
            <p className="text-sm">좌측에서 선수 명단을 입력하고 스쿼드를 생성해보세요.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default App;
