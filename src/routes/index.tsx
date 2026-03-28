import { lazy } from 'react';

import MainLayout from '~/components/Layout/MainLayout';

const HomePage = lazy(() => import('~/pages/home.page'));
const IntroPage = lazy(() => import('~/pages/intro.page'));
const ChatPage = lazy(() => import('~/pages/chat.page'));

const MainRoute = [
  {
    name: 'Home',
    icon: '',
    path: '/',
    component: HomePage,
    Layout: MainLayout,
  },
  {
    name: 'Intro',
    icon: '',
    path: '/intro',
    component: IntroPage,
    Layout: MainLayout,
  },
  {
    name: 'Chat',
    icon: '',
    path: '/chat',
    component: ChatPage,
    Layout: MainLayout,
  },
];

export default MainRoute;
