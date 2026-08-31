import React from 'react';
import { Player, Position } from '../types';
import { Trash2, Plus, Users } from 'lucide-react';
import { generateDefaultPlayers } from '../utils/algorithm';
import toast from 'react-hot-toast';

interface PlayerPanelProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  totalQuarters: number;
  playersPerMatch: number;
}

const POSITIONS: Position[] = [
  'ST', 'LW', 'RW', 'AM', 'CM', 'DM', 
  'LCB', 'RCB', 'LB', 'RB', 'LWB', 'RWB', 'GK'
];

const PlayerPanel: React.FC<PlayerPanelProps> = ({ players, setPlayers, totalQuarters, playersPerMatch }) => {
  const addPlayer = () => {
    if (players.length >= 25) {
      alert("선수 명단은 최대 25명까지만 추가할 수 있습니다.");
      return;
    }

    let defaultName = '';
    if (players.length > 0) {
      const lastPlayer = players[players.length - 1];
      const match = lastPlayer.name.match(/^선수\s*(\d+)$/);
      if (match) {
        defaultName = `선수 ${parseInt(match[1]) + 1}`;
      }
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: defaultName,
      pos1: 'CM',
      pos2: '',
      availableQuarters: totalQuarters,
      absentQuarters: []
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, field: keyof Player, value: any) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleAbsentQuarter = (id: string, quarter: number, currentAbsent: number[]) => {
    const newAbsent = currentAbsent.includes(quarter)
      ? currentAbsent.filter(q => q !== quarter)
      : [...currentAbsent, quarter];
    updatePlayer(id, 'absentQuarters', newAbsent);
  };

  const clearPlayerNames = () => {
    setPlayers(players.map(p => ({ ...p, name: '' })));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[400px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          선수 명단 입력 <span className="text-sm font-normal text-slate-400">({players.length}명)</span>
        </h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={clearPlayerNames}
            className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all active:scale-95"
          >
            이름 일괄 지우기
          </button>
          <button 
            onClick={() => {
              setPlayers(generateDefaultPlayers(playersPerMatch, totalQuarters));
              toast.success('명단이 초기화되었습니다.');
            }}
            className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all active:scale-95"
          >
            기본 명단으로 초기화
          </button>
          <button 
            onClick={addPlayer}
            disabled={players.length >= 25}
            className={`flex items-center gap-1.5 text-sm font-medium py-2 px-4 rounded-lg shadow-sm transition-all ${
              players.length >= 25 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
            }`}
          >
            <Plus size={16} /> 선수 추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">1순위</th>
              <th className="px-4 py-3 font-semibold">2순위</th>
              <th className="px-4 py-3 font-semibold text-center">참여 가능</th>
              <th className="px-4 py-3 font-semibold">불참 쿼터</th>
              <th className="px-4 py-3 font-semibold text-center">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-10 h-10 text-slate-200" />
                    <p>등록된 선수가 없습니다.</p>
                    <p className="text-xs text-slate-300">우측 상단의 '선수 추가' 버튼을 눌러 시작하세요.</p>
                  </div>
                </td>
              </tr>
            ) : (
              players.map(player => (
                <tr key={player.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5">
                    <input 
                      type="text" 
                      value={player.name}
                      onChange={e => updatePlayer(player.id, 'name', e.target.value)}
                      placeholder="이름 입력"
                      className="w-full min-w-[100px] p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <select 
                      value={player.pos1}
                      onChange={e => updatePlayer(player.id, 'pos1', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select 
                      value={player.pos2}
                      onChange={e => updatePlayer(player.id, 'pos2', e.target.value)}
                      className="p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="">없음</option>
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center">
                      <input 
                        type="number" 
                        min="1"
                        max={totalQuarters}
                        value={player.availableQuarters}
                        onChange={e => updatePlayer(player.id, 'availableQuarters', parseInt(e.target.value) || 0)}
                        className="w-16 p-2 text-center bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2.5 min-w-[160px]">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalQuarters }, (_, i) => i + 1).map(q => {
                        const isAbsent = player.absentQuarters.includes(q);
                        return (
                          <label 
                            key={q} 
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border cursor-pointer transition-colors ${
                              isAbsent 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isAbsent}
                              onChange={() => toggleAbsentQuarter(player.id, q, player.absentQuarters)}
                              className="w-3.5 h-3.5 text-red-500 rounded border-slate-300 focus:ring-red-500"
                            />
                            {q}Q
                          </label>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center">
                      <button 
                        onClick={() => removePlayer(player.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="선수 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerPanel;
