import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import MockExam from './pages/MockExam';
import BookCorrelation from './pages/BookCorrelation';
import Analytics from './pages/Analytics';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    path: '/wizard',
    Component: Wizard,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/mock/:topicId',
    Component: MockExam,
  },
  {
    path: '/correlation/:topicId',
    Component: BookCorrelation,
  },
  {
    path: '/analytics',
    Component: Analytics,
  },
]);
