import { clampDateOnly } from '@/utils/date';

interface TodayMarkerProps {
  viewStart: Date;
  viewEnd: Date;
}

export function TodayMarker({ viewStart, viewEnd }: TodayMarkerProps) {
  const today = clampDateOnly(new Date());
  const totalMs = viewEnd.getTime() - viewStart.getTime();
  if (today.getTime() < viewStart.getTime() || today.getTime() > viewEnd.getTime()) return null;

  const position = ((today.getTime() - viewStart.getTime()) / totalMs) * 100;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
        Today
      </div>
    </div>
  );
}
