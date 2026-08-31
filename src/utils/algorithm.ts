import { Player, Position } from '../types';

export const FORMATION_TEMPLATES: Record<string, Position[][]> = {
  // 11인
  "4-4-2": [["LB", "LCB", "RCB", "RB"], ["LW", "CM", "CM", "RW"], ["ST", "ST"]],
  "4-2-3-1": [["LB", "LCB", "RCB", "RB"], ["DM", "DM"], ["LW", "AM", "RW"], ["ST"]],
  "4-3-3": [["LB", "LCB", "RCB", "RB"], ["CM", "DM", "CM"], ["LW", "ST", "RW"]],
  "3-5-2": [["LCB", "CB", "RCB"], ["DM"], ["LWB", "CM", "CM", "RWB"], ["ST", "ST"]],
  "3-4-1-2": [["LCB", "CB", "RCB"], ["LWB", "CM", "CM", "RWB"], ["AM"], ["ST", "ST"]],
  "3-4-3": [["LCB", "CB", "RCB"], ["LWB", "CM", "CM", "RWB"], ["LW", "ST", "RW"]],
  
  // 10인
  "4-4-1": [["LB", "LCB", "RCB", "RB"], ["LW", "CM", "CM", "RW"], ["ST"]],
  "4-3-2": [["LB", "LCB", "RCB", "RB"], ["CM", "DM", "CM"], ["ST", "ST"]],
  "3-4-2": [["LCB", "CB", "RCB"], ["LWB", "CM", "CM", "RWB"], ["ST", "ST"]],
  "3-3-3": [["LCB", "CB", "RCB"], ["CM", "DM", "CM"], ["LW", "ST", "RW"]],
  
  // 9인
  "3-3-2": [["LCB", "CB", "RCB"], ["CM", "DM", "CM"], ["ST", "ST"]],
  "3-4-1": [["LCB", "CB", "RCB"], ["LWB", "CM", "CM", "RWB"], ["ST"]],
  "2-4-2": [["LCB", "RCB"], ["LWB", "CM", "CM", "RWB"], ["ST", "ST"]],
  "3-2-3": [["LCB", "CB", "RCB"], ["CM", "CM"], ["LW", "ST", "RW"]],
  
  // 8인
  "3-3-1": [["LCB", "CB", "RCB"], ["CM", "DM", "CM"], ["ST"]],
  "3-2-2": [["LCB", "CB", "RCB"], ["CM", "CM"], ["ST", "ST"]],
  "2-3-2": [["LCB", "RCB"], ["CM", "DM", "CM"], ["ST", "ST"]],
  
  // 6인
  "2-1-2": [["LCB", "RCB"], ["CM"], ["ST", "ST"]],
  "2-2-1": [["LCB", "RCB"], ["CM", "CM"], ["ST"]],
  "3-2": [["LCB", "CB", "RCB"], ["ST", "ST"]],
  
  // 5인
  "2-2": [["LCB", "RCB"], ["ST", "ST"]],
  "1-2-1": [["CB"], ["CM", "CM"], ["ST"]],
  "3-1": [["LCB", "CB", "RCB"], ["ST"]],
  "1-3": [["CB"], ["LW", "ST", "RW"]]
};

const getFallbackTemplate = (count: number, rowIndex: number, totalRows: number): Position[] => {
  if (count === 1) {
    if (rowIndex === 0) return ["CB"];
    if (rowIndex === totalRows - 1) return ["ST"];
    return ["CM"];
  }
  if (count === 2) {
    if (rowIndex === 0) return ["LCB", "RCB"];
    if (rowIndex === totalRows - 1) return ["ST", "ST"];
    return ["CM", "CM"];
  }
  if (count === 3) {
    if (rowIndex === 0) return ["LCB", "CB", "RCB"];
    if (rowIndex === totalRows - 1) return ["LW", "ST", "RW"];
    return ["CM", "DM", "CM"];
  }
  if (count === 4) {
    if (rowIndex === 0) return ["LB", "LCB", "RCB", "RB"];
    if (rowIndex === totalRows - 1) return ["LW", "ST", "ST", "RW"];
    return ["LW", "CM", "CM", "RW"];
  }
  if (count === 5) {
    if (rowIndex === 0) return ["LWB", "LCB", "CB", "RCB", "RWB"];
    return ["LWB", "CM", "DM", "CM", "RWB"];
  }
  return Array(count).fill(rowIndex === 0 ? "CB" : (rowIndex === totalRows - 1 ? "ST" : "CM"));
};

export const parseFormationToTemplate = (formation: string): Position[][] => {
  if (FORMATION_TEMPLATES[formation]) {
    return FORMATION_TEMPLATES[formation];
  }
  const parsed = formation.split('-').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
  if (parsed.length === 0) return [];
  return parsed.map((count, i) => getFallbackTemplate(count, i, parsed.length));
};

export const parseFormation = (formation: string): number[] => {
  return formation.split('-').map(num => parseInt(num.trim(), 10)).filter(num => !isNaN(num));
};

export interface Slot {
  targetPosition: Position;
  rowIndex: number;
  colIndex: number;
  player: Player | null;
}

export interface QuarterResult {
  quarter: number;
  squad: {
    gk: Player | null;
    field: Slot[][];
  };
  bench: Player[];
}

export const getSimilarityScore = (player: Player, targetPos: Position | 'GOALKEEPER'): number => {
  if (targetPos === 'GOALKEEPER') {
    if (player.pos1 === 'GK') return 100;
    if (player.pos2 === 'GK') return 80;
    return -50;
  }

  const score1 = calculatePositionScore(player.pos1, targetPos, true);
  const score2 = calculatePositionScore(player.pos2, targetPos, false);
  
  return Math.max(score1, score2);
};

export function calculatePositionScore(preferredPos: Position | '', targetPos: Position | 'GOALKEEPER', isFirstChoice: boolean): number {
  if (!preferredPos || targetPos === 'GOALKEEPER') return -50;
  
  if (preferredPos === targetPos) {
    return isFirstChoice ? 100 : 80;
  }

  const baseScore = isFirstChoice ? 0 : -10;

  const similarityMap: Record<string, number> = {
    "ST-AM": 70, "AM-ST": 70,
    "AM-CM": 70, "CM-AM": 70,
    "CM-DM": 70, "DM-CM": 70,
    "LW-LWB": 70, "LWB-LW": 70,
    "RW-RWB": 70, "RWB-RW": 70,
    "LWB-LB": 70, "LB-LWB": 70,
    "RWB-RB": 70, "RB-RWB": 70,
    "LCB-LB": 60, "LB-LCB": 60,
    "RCB-RB": 60, "RB-RCB": 60,
    "CB-DM": 60, "DM-CB": 60,
    
    "ST-LW": 60, "LW-ST": 60,
    "ST-RW": 60, "RW-ST": 60,
    "AM-LW": 60, "LW-AM": 60,
    "AM-RW": 60, "RW-AM": 60,
    "LCB-CB": 70, "CB-LCB": 70,
    "RCB-CB": 70, "CB-RCB": 70,

    "LW-RW": 70, "RW-LW": 70,
    "LWB-RWB": 70, "RWB-LWB": 70,
    "LB-RB": 70, "RB-LB": 70,
    "LCB-RCB": 70, "RCB-LCB": 70
  };

  const pairKey = `${preferredPos}-${targetPos}`;
  if (similarityMap[pairKey]) {
    return similarityMap[pairKey] + baseScore;
  }

  return -50; 
}

export const generateSquads = (
  players: Player[], 
  totalQuarters: number, 
  template: Position[][]
): QuarterResult[] => {
  const results: QuarterResult[] = [];
  
  // 1. 초기 뼈대 및 슬롯 타겟 정보 추출
  const flatTargetPositions: Position[] = template.flat();
  const numFieldSlots = flatTargetPositions.length;
  const totalSlotsPerQuarter = numFieldSlots + 1; // 필드 + GK 1명
  
  // 전체 출전 횟수 트래커
  const playCounts: Record<string, number> = {};
  players.forEach(p => playCounts[p.id] = 0);

  // 독박 희생 방지용 전역 상태 (강제 차출당한 횟수 누적)
  const sacrificeHistory: Record<string, number> = {};
  players.forEach(p => sacrificeHistory[p.id] = 0);

  // Phase 0 & 1: 쿼터별 명단 선발 (GK와 Field 분리)
  const quarterSquads: { gk: Player | null, field: Player[] }[] = [];

  for (let q = 1; q <= totalQuarters; q++) {
    // 1. 해당 쿼터 참여 가능 선수 필터링
    const eligiblePlayers = players.filter(p => 
      !p.absentQuarters.includes(q) && 
      (p.availableQuarters - playCounts[p.id]) > 0
    );

    // 인원이 전체 슬롯 수보다 적으면 쿼터 포기
    if (eligiblePlayers.length < totalSlotsPerQuarter) {
      quarterSquads.push({ gk: null, field: [] });
      continue;
    }

    // Phase 0: GK 독립 선발 (성역화)
    let selectedGk: Player | null = null;
    
    const gkCandidates = eligiblePlayers.filter(p => p.pos1 === 'GK' || p.pos2 === 'GK');
    
    // GK 후보들도 로테이션 공정성을 위해 정렬
    gkCandidates.sort((a, b) => {
      const aRemaining = a.availableQuarters - playCounts[a.id];
      const bRemaining = b.availableQuarters - playCounts[b.id];
      if (aRemaining !== bRemaining) return bRemaining - aRemaining;
      if (playCounts[a.id] !== playCounts[b.id]) return playCounts[a.id] - playCounts[b.id];
      return Math.random() - 0.5;
    });

    if (gkCandidates.length > 0) {
      // 전담 GK가 있으면 최우선 선발
      selectedGk = gkCandidates[0];
    } else {
      // 전담 GK가 아무도 없거나 모두 체력이 소진된 극한 상황: 일반 필드 플레이어 중 차출
      // 이 경우 덜 뛰고 체력 많은 사람을 차출
      eligiblePlayers.sort((a, b) => {
        const aRemaining = a.availableQuarters - playCounts[a.id];
        const bRemaining = b.availableQuarters - playCounts[b.id];
        if (aRemaining !== bRemaining) return bRemaining - aRemaining;
        if (playCounts[a.id] !== playCounts[b.id]) return playCounts[a.id] - playCounts[b.id];
        return Math.random() - 0.5;
      });
      selectedGk = eligiblePlayers[0];
    }

    playCounts[selectedGk.id]++;

    // Phase 1: 남은 필드 플레이어 선발 (선택된 GK 제외)
    const remainingEligible = eligiblePlayers.filter(p => p.id !== selectedGk!.id);
    
    // 체력 및 로테이션 기준으로 정렬
    remainingEligible.sort((a, b) => {
      const aRemaining = a.availableQuarters - playCounts[a.id];
      const bRemaining = b.availableQuarters - playCounts[b.id];
      if (aRemaining !== bRemaining) return bRemaining - aRemaining;
      if (playCounts[a.id] !== playCounts[b.id]) return playCounts[a.id] - playCounts[b.id];
      return Math.random() - 0.5;
    });

    // 필드 슬롯 수만큼 딱 맞춰서 선발
    const selectedField = remainingEligible.slice(0, numFieldSlots);
    selectedField.forEach(p => playCounts[p.id]++);

    quarterSquads.push({ gk: selectedGk, field: selectedField });
  }

  // Phase 2: 확정 인원 내부 '독립 포지션 최적화 (DFS)'
  for (let q = 1; q <= totalQuarters; q++) {
    const squad = quarterSquads[q - 1];
    
    // 벤치 멤버 계산
    const bench: Player[] = players.filter(p => {
      if (p.absentQuarters.includes(q)) return false;
      if (squad.gk?.id === p.id) return false;
      if (squad.field.find(r => r.id === p.id)) return false;
      return true;
    });

    if (!squad.gk) {
      // 쿼터 포기 상태 (전원 공석)
      const emptyFieldSlots: Slot[][] = template.map((row, rowIndex) => 
        row.map((targetPos, colIndex) => ({
          targetPosition: targetPos,
          rowIndex,
          colIndex,
          player: null
        }))
      );
      
      results.push({
        quarter: q,
        squad: { gk: null, field: emptyFieldSlots },
        bench
      });
      continue;
    }

    // DFS (백트래킹)로 필드 N명 -> N자리 최적 매칭 (GK는 이미 확정됨)
    let bestScore = -Infinity;
    let bestAssignment: Player[] = [];
    
    const dfs = (
      slotIndex: number, 
      currentScore: number, 
      usedPlayers: Set<string>, 
      currentAssignment: Player[]
    ) => {
      // 기저 조건: 모든 필드 슬롯에 선수를 배치함
      if (slotIndex === flatTargetPositions.length) {
        if (currentScore > bestScore) {
          bestScore = currentScore;
          bestAssignment = [...currentAssignment];
        }
        return;
      }

      // 가지치기 (Branch & Bound)
      const remainingSlots = flatTargetPositions.length - slotIndex;
      if (currentScore + remainingSlots * 100 <= bestScore) {
        return;
      }

      const targetPos = flatTargetPositions[slotIndex];

      for (let i = 0; i < squad.field.length; i++) {
        const player = squad.field[i];
        if (usedPlayers.has(player.id)) continue;

        let score = getSimilarityScore(player, targetPos);
        
        // [독박 희생 방지 시스템]
        // 강제 차출 기준(-10점 이하)일 때, 과거에 희생한 적이 있다면 거대한 페널티 부여
        if (score <= -10) {
          const penalty = (sacrificeHistory[player.id] || 0) * 500;
          score -= penalty;
        }
        
        usedPlayers.add(player.id);
        currentAssignment.push(player);
        
        dfs(slotIndex + 1, currentScore + score, usedPlayers, currentAssignment);
        
        currentAssignment.pop();
        usedPlayers.delete(player.id);
      }
    };

    dfs(0, 0, new Set(), []);

    // 히스토리 업데이트: 해당 쿼터 배치가 확정된 후, 희생된(강제 차출된) 선수의 카운트 증가
    for (let i = 0; i < bestAssignment.length; i++) {
      const p = bestAssignment[i];
      const targetPos = flatTargetPositions[i];
      const score = getSimilarityScore(p, targetPos);
      if (score <= -10) {
        sacrificeHistory[p.id]++;
      }
    }

    // GK 희생 업데이트 (만약 필드 플레이어가 극한 상황에서 GK로 차출되었다면)
    if (squad.gk) {
      const gkScore = getSimilarityScore(squad.gk, 'GOALKEEPER');
      if (gkScore <= -10) {
        sacrificeHistory[squad.gk.id]++;
      }
    }

    // bestAssignment 를 기반으로 QuarterResult 조립
    let fieldPlayerIndex = 0;
    
    const finalFieldSlots: Slot[][] = template.map((row, rowIndex) => 
      row.map((targetPos, colIndex) => {
        const p = bestAssignment[fieldPlayerIndex++];
        return {
          targetPosition: targetPos,
          rowIndex,
          colIndex,
          player: p
        };
      })
    );

    results.push({
      quarter: q,
      squad: { gk: squad.gk, field: finalFieldSlots },
      bench
    });
  }

  return results;
};

export const generateDefaultPlayers = (count: number, totalQuarters: number, startIndex: number = 0) => {
  const TRADITIONAL_POSITIONS: Position[] = ["GK", "RB", "LB", "RCB", "LCB", "DM", "LW", "CM", "ST", "AM", "RW"];
  return Array.from({ length: count }, (_, i) => {
    const actualIndex = startIndex + i;
    const pos = actualIndex < TRADITIONAL_POSITIONS.length ? TRADITIONAL_POSITIONS[actualIndex] : "CM";
    return {
      id: crypto.randomUUID(),
      name: `선수 ${actualIndex + 1}`,
      pos1: pos,
      pos2: '',
      availableQuarters: totalQuarters,
      absentQuarters: []
    };
  });
};
