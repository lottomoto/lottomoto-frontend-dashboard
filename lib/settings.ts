import api from "./api";

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>("/settings");
  return data;
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const { data } = await api.patch<Settings>("/settings", { settings });
  return data;
}
