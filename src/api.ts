import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function getHeaders() {
  const session = (await supabase.auth.getSession()).data.session;
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : '',
  };
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  year?: string;
  department?: string;
}

export interface SubjectExperiment {
  id: string;
  subject: string;
  name: string;
  aim: string;
  formula?: string;
  procedure?: string;
  precautions?: string;
  applications?: string;
  theoryFormal?: string;
  theorySimple?: string;
}

export interface VivaQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface ObservationRow {
  index: number;
  col1Value: number;
  col2Value: number;
  col1Confidence: number;
  col2Confidence: number;
  col1Name: string;
  col2Name: string;
  col1Unit: string;
  col2Unit: string;
}

export interface GraphResult {
  slope: number;
  intercept: number;
  rSquared: number;
  xAxisMin: number;
  xAxisMax: number;
  yAxisMin: number;
  yAxisMax: number;
  suggestedScale: string;
  calculationText: string;
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  imageUrl: string;
  ocrConfidence: number;
  createdAt: string;
  experiment: SubjectExperiment;
}

// --- API Calls ---

export async function getProfile(): Promise<Profile> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/me`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: { fullName: string; year: string; department: string }): Promise<Profile> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/me`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update profile');
  return res.json();
}

export async function getSubjects(): Promise<string[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/subjects`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch subjects');
  return res.json();
}

export async function getExperiments(subject?: string): Promise<SubjectExperiment[]> {
  const headers = await getHeaders();
  const url = subject ? `${API_URL}/experiments?subject=${encodeURIComponent(subject)}` : `${API_URL}/experiments`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch experiments');
  return res.json();
}

export async function getExperiment(id: string): Promise<SubjectExperiment & { vivaQuestions: VivaQuestion[] }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/experiments/${id}`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch experiment details');
  return res.json();
}

export async function uploadPhoto(file: File): Promise<string> {
  const session = (await supabase.auth.getSession()).data.session;
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': session ? `Bearer ${session.access_token}` : '',
    },
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to upload photo');
  return (await res.json()).imageUrl;
}

export async function createRun(experimentId: string, imageUrl: string): Promise<{
  runId: string;
  ocrConfidence: number;
  rows: ObservationRow[];
  col1Config: { name: string; unit: string };
  col2Config: { name: string; unit: string };
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/runs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ experimentId, imageUrl }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'OCR transcription failed');
  return res.json();
}

export async function getRows(runId: string): Promise<{
  rows: ObservationRow[];
  col1Config: { name: string; unit: string };
  col2Config: { name: string; unit: string };
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/runs/${runId}/rows`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch table rows');
  return res.json();
}

export async function saveRows(
  runId: string,
  rows: { index: number; col1Value: number; col2Value: number; col1Confidence?: number; col2Confidence?: number }[],
  col1Config: { name: string; unit: string },
  col2Config: { name: string; unit: string }
): Promise<{ success: boolean }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/runs/${runId}/rows`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ rows, col1Config, col2Config }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to save table rows');
  return res.json();
}

export async function generateGraph(runId: string): Promise<GraphResult> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/runs/${runId}/graph`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to compute regression values');
  return res.json();
}

export async function getTheory(experimentId: string): Promise<{ formal: string; simple: string }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/experiments/${experimentId}/theory`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch theory');
  return res.json();
}

export async function getViva(experimentId: string): Promise<VivaQuestion[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/experiments/${experimentId}/viva`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch viva questions');
  return res.json();
}

export async function generateReport(runId: string): Promise<{ pdfUrl: string }> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/runs/${runId}/report`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate report');
  return res.json();
}

export async function getHistory(): Promise<ExperimentRun[]> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/history`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch run history');
  return res.json();
}

export async function getAdminStats(): Promise<{
  totalUsers: number;
  monthlyActiveUsers: number;
  runsToday: number;
  totalRuns: number;
}> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/admin/stats`, { headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch admin stats');
  return res.json();
}
