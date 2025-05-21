
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

import Index from './pages/Index';
import Chat from './pages/Chat';
import Database from './pages/Database';
import Documents from './pages/Documents';
import Timetable from './pages/Timetable';
import History from './pages/History';
import NotFound from './pages/NotFound';
import References from './pages/References';
import AnnouncementVetting from './pages/AnnouncementVetting';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/database" element={<Database />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/references" element={<References />} />
          <Route path="/vetting" element={<AnnouncementVetting />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ThemeProvider>
    </Router>
  );
}

export default App;
