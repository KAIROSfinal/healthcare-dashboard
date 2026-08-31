export interface EmergencyIncident {
  patientId: string;
  location: {
    lat: number;
    lng: number;
  };
  hospitalName: string;
  etaMinutes: number | null;
  status?: string;
  timestamp?: string;
}