export interface DaySchedule {
  enabled: boolean;
  startTime: string; // "HH:MM" format (e.g., "20:00")
  endTime: string; // "HH:MM" format (e.g., "24:00")
}

export interface ServerSchedule {
  enabled: boolean;
  timezone: string; // e.g., "Asia/Tokyo"
  weeklySchedule: {
    [day: number]: DaySchedule; // 0=Sunday, 1=Monday, ..., 6=Saturday
  };
}

export const DEFAULT_DAY_SCHEDULE: DaySchedule = {
  enabled: false,
  startTime: '20:00',
  endTime: '23:00',
};

export const DEFAULT_SERVER_SCHEDULE: ServerSchedule = {
  enabled: false,
  timezone: 'Asia/Tokyo',
  weeklySchedule: {
    0: { ...DEFAULT_DAY_SCHEDULE },
    1: { ...DEFAULT_DAY_SCHEDULE },
    2: { ...DEFAULT_DAY_SCHEDULE },
    3: { ...DEFAULT_DAY_SCHEDULE },
    4: { ...DEFAULT_DAY_SCHEDULE },
    5: { ...DEFAULT_DAY_SCHEDULE },
    6: { ...DEFAULT_DAY_SCHEDULE },
  },
};
