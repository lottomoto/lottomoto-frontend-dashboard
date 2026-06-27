import api from "./api";

export interface SuccursaleVendeur {
  id: string;
  nom: string;
  username: string;
}

export interface SuccursaleSuperviseur {
  id: string;
  nom: string;
}

export interface Succursale {
  id: string;
  nom: string;
  adresse: string | null;
  materielId: string;
  isActive: boolean;
  superviseur: SuccursaleSuperviseur | null;
  vendeur: SuccursaleVendeur | null;
  createdAt: string;
}

export async function getSuccursales(): Promise<Succursale[]> {
  const { data } = await api.get<Succursale[]>("/succursales");
  return data;
}

export async function getSuccursale(id: string): Promise<Succursale> {
  const { data } = await api.get<Succursale>(`/succursales/${id}`);
  return data;
}

export async function createSuccursale(dto: {
  nom: string;
  adresse?: string;
  materielId: string;
  superviseurId?: string;
  vendeurId?: string;
}): Promise<Succursale> {
  const { data } = await api.post<Succursale>("/succursales", dto);
  return data;
}

export async function updateSuccursale(id: string, dto: {
  nom?: string;
  adresse?: string;
  materielId?: string;
  superviseurId?: string;
  vendeurId?: string;
}): Promise<Succursale> {
  const { data } = await api.patch<Succursale>(`/succursales/${id}`, dto);
  return data;
}

export async function toggleSuccursaleActive(id: string): Promise<Succursale> {
  const { data } = await api.patch<Succursale>(`/succursales/${id}/toggle-active`);
  return data;
}

export async function deleteSuccursale(id: string): Promise<void> {
  await api.delete(`/succursales/${id}`);
}
