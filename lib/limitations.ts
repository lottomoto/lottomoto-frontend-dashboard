import api from "./api";

export interface Limitation {
  id: string;
  bouleNumero: number;
  borlette: string;
  tirage: string;
  montant: number;
  date: string;
  createdAt: string;
}

export async function getLimitations(): Promise<Limitation[]> {
  const { data } = await api.get<Limitation[]>("/limitations");
  return data;
}

export async function getLimitationsByBoule(numero: number): Promise<Limitation[]> {
  const { data } = await api.get<Limitation[]>(`/limitations/boule/${numero}`);
  return data;
}

export async function createLimitation(dto: {
  bouleNumero: number;
  borlette: string;
  tirage: string;
  montant: number;
  date: string;
}): Promise<Limitation> {
  const { data } = await api.post<Limitation>("/limitations", dto);
  return data;
}

export async function createLimitationAll(dto: {
  bouleNumero: number;
  montant: number;
  date: string;
  borlettes: string[];
  tirages: string[];
}): Promise<Limitation[]> {
  const { data } = await api.post<Limitation[]>("/limitations/all", dto);
  return data;
}

export async function deleteLimitation(id: string): Promise<void> {
  await api.delete(`/limitations/${id}`);
}
