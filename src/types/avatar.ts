export type Gender = 'female' | 'male';
export type HairStyle = 'bald' | 'short' | 'long';
export type BottomType = 'pants';
export type DevoteePose = 'pray' | 'bow' | 'meditate' | 'incense';

export interface DevoteeConfig {
  name: string;
  gender: Gender;
  hairStyle: HairStyle;
  bottomType: BottomType;
  robeColor: string; // Hex color
  robeName: string; // e.g. "Áo Lam", "Áo Nâu", "Bạch Y"
}

export const PRESET_ROBES = [
  { id: 'lam', name: 'Áo Lam Cư Sĩ', hex: '#4B6B88', desc: 'Sắc phục truyền thống nhẫn nhục & khiêm cung' },
  { id: 'nau', name: 'Áo Tràng Nâu', hex: '#633B1E', desc: 'Mộc mạc, tượng trưng đức tính cần kiệm' },
  { id: 'trang', name: 'Bạch Y Cư Sĩ', hex: '#E2E8F0', desc: 'Áo trắng thanh tịnh giữ gìn thiện pháp' },
  { id: 'vang', name: 'Hoàng Y Tu Sĩ', hex: '#B8860B', desc: 'Sắc vàng giải thoát của người xuất gia' },
  { id: 'khoi', name: 'Áo Khói Trầm', hex: '#475569', desc: 'Màu xám trầm tĩnh lặng chốn thiền môn' },
];

export const DEFAULT_DEVOTEE: DevoteeConfig = {
  name: 'Diệu Tâm',
  gender: 'female',
  hairStyle: 'long',
  bottomType: 'pants',
  robeColor: '#4B6B88',
  robeName: 'Áo Lam Cư Sĩ',
};
