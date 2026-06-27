import api from "./api";

export interface TirageData {
  id: string;
  nom: string;
  ouverture: string;
  fermeture: string;
}

export interface BorletteData {
  id: string;
  nom: string;
  code: string;
  isActive: boolean;
  tirages: TirageData[];
  createdAt: string;
}

export async function getBorlettes(): Promise<BorletteData[]> {
  const { data } = await api.get<BorletteData[]>("/borlettes");
  return data;
}

export async function createBorlette(dto: {
  nom: string;
  code: string;
  tirages: { nom: string; ouverture: string; fermeture: string }[];
}): Promise<BorletteData> {
  const { data } = await api.post<BorletteData>("/borlettes", dto);
  return data;
}

export async function updateBorlette(id: string, dto: {
  nom?: string;
  code?: string;
  tirages?: { nom: string; fermeture: string }[];
}): Promise<BorletteData> {
  const { data } = await api.patch<BorletteData>(`/borlettes/${id}`, dto);
  return data;
}

export async function toggleBorletteActive(id: string): Promise<BorletteData> {
  const { data } = await api.patch<BorletteData>(`/borlettes/${id}/toggle-active`);
  return data;
}

export async function deleteBorlette(id: string): Promise<void> {
  await api.delete(`/borlettes/${id}`);
}
