import api from "./api";

export interface ResultatData {
  id: string;
  date: string;
  tirage: string;
  borletteId: string;
  borlette: string;
  lot1: string;
  lot2: string;
  lot3: string;
  createdAt: string;
}

export async function getResultats(): Promise<ResultatData[]> {
  const { data } = await api.get<ResultatData[]>("/resultats");
  return data;
}

export async function createResultat(dto: {
  date: string;
  tirage: string;
  borletteId: string;
  lot1: string;
  lot2: string;
  lot3: string;
}): Promise<ResultatData> {
  const { data } = await api.post<ResultatData>("/resultats", dto);
  return data;
}

export async function updateResultat(id: string, dto: {
  lot1?: string;
  lot2?: string;
  lot3?: string;
}): Promise<ResultatData> {
  const { data } = await api.patch<ResultatData>(`/resultats/${id}`, dto);
  return data;
}
