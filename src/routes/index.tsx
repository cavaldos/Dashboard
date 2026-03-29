import { lazy } from 'react';

import MainLayout from '~/components/Layout/MainLayout';

const HomePage = lazy(() => import('~/pages/home.page'));
const IntroPage = lazy(() => import('~/pages/intro.page'));

const MainRoute = [
  {
    name: 'Home',
    icon: '',
    path: '/',
    component: HomePage,
    Layout: MainLayout,
    nav: true, 
  },
  {
    name: 'Intro',
    icon: '',
    path: '/intro',
    component: IntroPage,
    Layout: MainLayout,
    nav: true,
  },
];

export default MainRoute;
