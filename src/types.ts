export type Position = 
  | 'ST' | 'LW' | 'RW' | 'AM' | 'CM' | 'DM' 
  | 'LCB' | 'RCB' | 'LB' | 'RB' | 'LWB' | 'RWB' | 'GK';

export interface Player {
  id: string;
  name: string;
  pos1: Position;
  pos2: Position | '';
  availableQuarters: number;
  absentQuarters: number[]; // Array of quarter numbers (1-indexed)
}

export interface Settings {
  totalQuarters: number;
  playersPerMatch: number;
  formation: string;
}
