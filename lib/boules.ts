import api from "./api";

export interface Boule {
  id: string;
  numero: number;
  status: "disponible" | "bloquee";
  createdAt: string;
  updatedAt: string;
}

export async function getBoules(): Promise<Boule[]> {
  const { data } = await api.get<Boule[]>("/boules");
  return data;
}

export async function getBoule(numero: number): Promise<Boule> {
  const { data } = await api.get<Boule>(`/boules/${numero}`);
  return data;
}

export async function toggleBoule(numero: number): Promise<Boule> {
  const { data } = await api.patch<Boule>(`/boules/${numero}/toggle`);
  return data;
}

export async function blockMultiple(numeros: number[]): Promise<Boule[]> {
  const { data } = await api.post<Boule[]>("/boules/block-multiple", { numeros });
  return data;
}

export async function unblockAll(): Promise<void> {
  await api.post("/boules/unblock-all");
}

// Limitations
export interface LimitationData {
  id: string;
  bouleNumero: number;
  borlette: string;
  tirage: string;
  montant: number;
  date: string;
  createdAt: string;
}

export async function getLimitations(): Promise<LimitationData[]> {
  const { data } = await api.get<LimitationData[]>("/limitations");
  return data;
}

export async function getLimitationsByBoule(numero: number): Promise<LimitationData[]> {
  const { data } = await api.get<LimitationData[]>(`/limitations/boule/${numero}`);
  return data;
}

export async function createLimitation(dto: {
  bouleNumero: number;
  borlette: string;
  tirage: string;
  montant: number;
  date: string;
}): Promise<LimitationData> {
  const { data } = await api.post<LimitationData>("/limitations", dto);
  return data;
}

export async function createLimitationAll(dto: {
  bouleNumero: number;
  montant: number;
  date: string;
  borlettes: string[];
  tirages: string[];
}): Promise<LimitationData[]> {
  const { data } = await api.post<LimitationData[]>("/limitations/all", dto);
  return data;
}

export async function removeLimitation(id: string): Promise<void> {
  await api.delete(`/limitations/${id}`);
}
