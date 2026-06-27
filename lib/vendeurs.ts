import api from "./api";

export interface Vendeur {
  id: string;
  userId: string;
  username: string;
  firstname: string;
  lastname: string;
  phone: string;
  adresse: string | null;
  commission: number | null;
  isActive: boolean;
  createdAt: string;
}

export async function getVendeurs(): Promise<Vendeur[]> {
  const { data } = await api.get<Vendeur[]>("/vendeurs");
  return data;
}

export async function getVendeur(id: string): Promise<Vendeur> {
  const { data } = await api.get<Vendeur>(`/vendeurs/${id}`);
  return data;
}

export async function createVendeur(dto: {
  firstname: string;
  lastname: string;
  phone: string;
  username: string;
  pin: string;
  adresse?: string;
  commission?: number;
}): Promise<Vendeur> {
  const { data } = await api.post<Vendeur>("/vendeurs", dto);
  return data;
}

export async function updateVendeur(id: string, dto: {
  firstname?: string;
  lastname?: string;
  phone?: string;
  username?: string;
  pin?: string;
  adresse?: string;
  commission?: number;
}): Promise<Vendeur> {
  const { data } = await api.patch<Vendeur>(`/vendeurs/${id}`, dto);
  return data;
}

export async function toggleVendeurActive(id: string): Promise<Vendeur> {
  const { data } = await api.patch<Vendeur>(`/vendeurs/${id}/toggle-active`);
  return data;
}

export async function deleteVendeur(id: string): Promise<void> {
  await api.delete(`/vendeurs/${id}`);
}
