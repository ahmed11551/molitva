export type Gender = "male" | "female";
export type CalculationMethod = "manual" | "calculator";
export type Madhab = "hanafi" | "shafii";

export interface PersonalData {
  birth_date: string;
  gender: Gender;
  bulugh_age: number;
  bulugh_date: string;
  prayer_start_date: string;
  today_as_start: boolean;
}

export interface WomenData {
  haid_days_per_month: number;
  childbirth_count: number;
  nifas_days_per_childbirth: number;
}

export interface TravelPeriod {
  start_date: string;
  end_date: string;
  days_count: number;
}

export interface TravelData {
  total_travel_days: number;
  travel_periods: TravelPeriod[];
}

export interface MissedPrayers {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export interface TravelPrayers {
  dhuhr_safar: number;
  asr_safar: number;
  isha_safar: number;
}

export interface DebtCalculation {
  period: {
    start: string;
    end: string;
  };
  total_days: number;
  excluded_days: number;
  effective_days: number;
  missed_prayers: MissedPrayers;
  travel_prayers: TravelPrayers;
}

export interface RepaymentProgress {
  completed_prayers: MissedPrayers;
  completed_travel_prayers: TravelPrayers;
  last_updated: string;
}

export interface UserPrayerDebt {
  user_id: string;
  calc_version: string;
  madhab: Madhab;
  calculation_method: CalculationMethod;
  personal_data: PersonalData;
  women_data?: WomenData;
  travel_data: TravelData;
  debt_calculation: DebtCalculation;
  repayment_progress: RepaymentProgress;
}

export interface ProgressEntry {
  type: keyof MissedPrayers | keyof TravelPrayers;
  amount: number;
}

export interface CalculationInput {
  calculation_method: CalculationMethod;
  madhab?: Madhab;
  personal_data: {
    birth_date: string;
    gender: Gender;
    bulugh_age?: number;
    prayer_start_date?: string;
    today_as_start?: boolean;
  };
  women_data?: Partial<WomenData>;
  travel_data?: {
    total_travel_days?: number;
    travel_periods?: Array<{
      start_date: string;
      end_date: string;
      days_count?: number;
    }>;
  };
}

export interface CalculationJob {
  job_id: string;
  user_id: string;
  status: "pending" | "done" | "error";
  created_at: string;
  updated_at: string;
  payload?: CalculationInput;
  result?: UserPrayerDebt;
  error?: string;
}


