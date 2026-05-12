import { ThreeColumnLayout } from './components/Layout/ThreeColumnLayout';
import { SessionPanel } from './components/SessionPanel/SessionPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { ChartPanel } from './components/ChartPanel/ChartPanel';

export default function App() {
  return <ThreeColumnLayout left={<SessionPanel />} center={<ChatPanel />} right={<ChartPanel />} />;
}
