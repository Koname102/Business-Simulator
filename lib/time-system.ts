export interface TimeConfig {
  tickInterval: number;
  gameSpeedMultiplier: number;
  realSecondsPerGameMinute: number;
}

export const TIME_CONFIG = {
  fintech: {
    tickInterval: 1000,
    realSecondsPerGameMinute: 1,
    realSecondsPerGameHour: 60,
    realSecondsPerGameDay: 1440,
    startHour: 7,  // ADD: Start at 7 AM
  },
  insurance: {
    tickInterval: 1000,
    realSecondsPerGameMinute: 1,
    realSecondsPerGameHour: 60,
    realSecondsPerGameDay: 1440,
    startHour: 7,  // ADD
  },
  investment: {
    tickInterval: 1000,
    realSecondsPerGameMinute: 1,
    realSecondsPerGameHour: 60,
    realSecondsPerGameDay: 1440,
    startHour: 7,  // ADD
  },
} as const;

export function calculateRealInterval(
  gameMinutes: number,
  businessType: 'fintech' | 'insurance' | 'investment',
  speedMultiplier: number = 1
): number {
  const config = TIME_CONFIG[businessType];
  const realSeconds = gameMinutes * config.realSecondsPerGameMinute;
  return (realSeconds * 1000) / speedMultiplier;
}

export function formatGameTime(
  gameTimeInSeconds: number,
  businessType: 'fintech' | 'insurance' | 'investment'
): string {
  const config = TIME_CONFIG[businessType];
  const startHourInSeconds = config.startHour * 3600;
  const adjustedTime = gameTimeInSeconds + startHourInSeconds;
  
  const days = Math.floor(adjustedTime / 86400);
  const hours24 = Math.floor((adjustedTime % 86400) / 3600);
  const minutes = Math.floor((adjustedTime % 3600) / 60);
  
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 < 12 ? 'AM' : 'PM';
  
  const timeString = `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  if (days > 0) {
    return `Day ${days + 1}, ${timeString}`;
  }
  return `Day 1, ${timeString}`;
}

export function convertRealToGameTime(
  realSeconds: number,
  businessType: 'fintech' | 'insurance' | 'investment'
): number {
  const config = TIME_CONFIG[businessType];
  return realSeconds / config.realSecondsPerGameMinute;
}