import { AppProvider, useApp } from './app/AppContext';
import { useRoute } from './app/router';
import { Layout } from './components/Layout';
import { useReminders } from './pwa/reminders';
import { TodayScreen } from './screens/TodayScreen';
import { HabitsScreen } from './screens/habits/HabitsScreen';
import { HabitEditorScreen } from './screens/habits/HabitEditorScreen';
import { HabitHistoryScreen } from './screens/habits/HabitHistoryScreen';
import { MorningScreen } from './screens/moments/MorningScreen';
import { BodyScreen } from './screens/moments/BodyScreen';
import { GrowthScreen } from './screens/moments/GrowthScreen';
import { ConnectionScreen } from './screens/moments/ConnectionScreen';
import { NightScreen } from './screens/moments/NightScreen';
import { PauseScreen } from './screens/PauseScreen';
import { FocusScreen } from './screens/FocusScreen';
import { FinanceScreen } from './screens/finance/FinanceScreen';
import { KnowledgeScreen, KnowledgeCardScreen } from './screens/KnowledgeScreen';
import { ProgressScreen } from './screens/progress/ProgressScreen';
import { WeeklyReviewScreen } from './screens/progress/WeeklyReviewScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { PrivacyScreen } from './screens/settings/PrivacyScreen';
import { MoreScreen } from './screens/MoreScreen';
import { NotFound } from './screens/NotFound';

function Screen({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean);
  const [a, b, c] = parts;
  if (!a) return <TodayScreen />;
  switch (a) {
    case 'habitos':
      if (!b) return <HabitsScreen />;
      if (b === 'nuevo') return <HabitEditorScreen />;
      if (c === 'historial') return <HabitHistoryScreen id={b} />;
      return <HabitEditorScreen id={b} />;
    case 'momento':
      if (b === 'manana') return <MorningScreen />;
      if (b === 'cuerpo') return <BodyScreen />;
      if (b === 'tarde') return <GrowthScreen />;
      if (b === 'relaciones') return <ConnectionScreen />;
      if (b === 'noche') return <NightScreen />;
      return <NotFound />;
    case 'pausa':
      return <PauseScreen />;
    case 'foco':
      return <FocusScreen />;
    case 'finanzas':
      return <FinanceScreen />;
    case 'cultura':
      return b ? <KnowledgeCardScreen id={b} /> : <KnowledgeScreen />;
    case 'progreso':
      return b === 'semana' ? <WeeklyReviewScreen /> : <ProgressScreen />;
    case 'ajustes':
      return <SettingsScreen />;
    case 'privacidad':
      return <PrivacyScreen />;
    case 'mas':
      return <MoreScreen />;
    default:
      return <NotFound />;
  }
}

function Shell() {
  const path = useRoute();
  const { ready, error } = useApp();
  useReminders();
  return (
    <Layout path={path}>
      {error ? (
        <div className="banner banner--warn" role="alert">
          {error}
        </div>
      ) : ready ? (
        <Screen path={path} />
      ) : (
        <p className="muted" aria-busy="true">
          Cargando…
        </p>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
