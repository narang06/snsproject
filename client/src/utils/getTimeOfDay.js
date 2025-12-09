export function getTimeOfDay() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "morning";   // 05:00 ~ 10:59
  if (hour >= 11 && hour < 17) return "day";      // 11:00 ~ 16:59
  if (hour >= 17 && hour < 20) return "evening";  // 17:00 ~ 19:59
  return "night";                                 // 20:00 ~ 04:59
}
