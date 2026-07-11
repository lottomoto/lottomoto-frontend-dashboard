import api from "./api";

export interface TicketLigne {
  id: string;
  numero: string;
  type: string;
  boule1: number;
  boule2: number;
  prefix: number | null;
  option: string;
  prix: number;
  status?: string;
  gain?: number;
}

export interface TicketData {
  id: string;
  ref: string;
  vendeur: string | null;
  borlette: string;
  borletteId: string;
  tirage: string;
  date: string;
  total: number;
  gainTotal?: number;
  status: string;
  lignes: TicketLigne[];
  createdAt: string;
}

export async function getTickets(): Promise<TicketData[]> {
  const { data } = await api.get<TicketData[]>("/tickets");
  return data;
}

export async function getTicket(id: string): Promise<TicketData> {
  const { data } = await api.get<TicketData>(`/tickets/${id}`);
  return data;
}

export async function deleteTicket(id: string): Promise<void> {
  await api.delete(`/tickets/${id}`);
}

export async function payTicket(id: string): Promise<TicketData> {
  const { data } = await api.patch<TicketData>(`/tickets/${id}/pay`);
  return data;
}
