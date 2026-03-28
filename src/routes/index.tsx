import { lazy } from 'react';

import MainLayout from '~/components/Layout/MainLayout';

const HomePage = lazy(() => import('~/pages/home.page'));
const IntroPage = lazy(() => import('~/pages/intro.page'));
const CryptoPage = lazy(() => import('~/pages/crypto.page'));
const ForexPage = lazy(() => import('~/pages/forex.page'));
const MemecoinPage = lazy(() => import('~/pages/memecoin.page'));
const NewstradePage = lazy(() => import('~/pages/newstrade.page'));

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
    name: 'Crypto',
    icon: '',
    path: '/crypto',
    component: CryptoPage,
    Layout: MainLayout,
  },
  {
    name: 'Forex',
    icon: '',
    path: '/forex',
    component: ForexPage,
    Layout: MainLayout,
  },
  {
    name: 'Memecoin',
    icon: '',
    path: '/memecoin',
    component: MemecoinPage,
    Layout: MainLayout,
  },
  {
    name: 'NewsTrade',
    icon: '',
    path: '/newstrade',
    component: NewstradePage,
    Layout: MainLayout,
  },
];

export default MainRoute;
