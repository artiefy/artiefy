export interface Activity {
  title: string;
  startDate?: string;
  endDate?: string;
}

export interface SpecificObjective {
  id: string;
  title: string;
  activities: Activity[];
}

export type ObjetivosInput = SpecificObjective[] | string[];
