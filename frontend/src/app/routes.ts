import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import MockExam from './pages/MockExam';
import BookCorrelation from './pages/BookCorrelation';
import AdminDashboard from './pages/AdminDashboard';

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
    path: '/displayexam/:topicId',
    Component: MockExam,
  },
  {
    path: '/correlation/:topicId',
    Component: BookCorrelation,
  },

  {
    path: '/admin',
    Component: AdminDashboard,
  },
]);