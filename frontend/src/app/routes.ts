import { createBrowserRouter } from 'react-router';
import Layout from './pages/Layout';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import MockExam from './pages/MockExam';
import BookCorrelation from './pages/BookCorrelation';
import AdminDashboard from './pages/AdminDashboard';
import AuthGuard from './pages/AuthGuard';
import HelpingResources from './pages/HelpingResources';
import { createElement } from 'react';

// Helper to wrap a component in AuthGuard
const protect = (Component: React.ComponentType) => () =>
  createElement(AuthGuard, null, createElement(Component));

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Landing,
      },
      {
        path: 'wizard',
        Component: protect(Wizard),
      },
      {
        path: 'dashboard',
        Component: protect(Dashboard),
      },
      {
        path: 'displayexam/:topicId',
        Component: protect(MockExam),
      },
      {
        path: 'correlation/:topicId',
        Component: protect(BookCorrelation),
      },
      {
        path: 'resources/:courseId',
        Component: protect(HelpingResources),
      },
      {
        path: 'admin',
        Component: AdminDashboard,
      },
    ],
  },
]);