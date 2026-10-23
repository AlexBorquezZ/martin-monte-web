import { useEffect } from 'react';
import { useApp } from '../app/AppContext';
import { MOMENTS } from '../domain/constants';
import { minutesOfDay, parseHHMM, toDateKey } from '../lib/date';
import { showLocalNotification } from './notifications';

const KEY = 'ritmo.reminders.sent';

const MESSAGES: Record<string, string> = {
  manana: 'Un momento para orientar el día: intención, gratitud y una prioridad.',
  cuerpo: '¿Un poco de movimiento? La versión mínima también cuenta.',
  tarde: 'Hora de tu bloque de crecimiento, si te viene bien.',
  relaciones: 'Una propuesta pequeña de conexión te espera, sin presión.',
  noche: 'Cierre tranquilo del día: tres minutos alcanzan.',
};

function readSent(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Revisa cada 30 s si llegó el horario de algún momento con recordatorio activo.
 * Se avisa como máximo una vez por momento y por día, y solo dentro de los 30
 * minutos posteriores al horario (abrir la app tarde no dispara avisos viejos).
 */
export function useReminders(): void {
  const { settings, now } = useApp();
  useEffect(() => {
    if (!settings.reminders.enabled) return;
    const today = toDateKey(now);
    const mins = minutesOfDay(now);
    const sent = readSent();
    let changed = false;
    for (const m of MOMENTS) {
      if (!settings.reminders.moments[m.id] || !settings.moments[m.id].enabled) continue;
      const start = parseHHMM(settings.moments[m.id].start);
      if (start === null) continue;
      if (mins >= start && mins - start <= 30 && sent[m.id] !== today) {
        sent[m.id] = today;
        changed = true;
        void showLocalNotification(`${settings.appName} · ${m.label}`, MESSAGES[m.id], `ritmo-${m.id}`);
      }
    }
    if (changed) {
      try {
        localStorage.setItem(KEY, JSON.stringify(sent));
      } catch {
        /* ignorar */
      }
    }
  }, [now, settings]);
}
