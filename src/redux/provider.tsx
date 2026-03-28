import React from 'react';
import { Provider } from 'react-redux';
import store from './store';

type ProviderGlobalProps = {
    children: React.ReactNode;
};

const ProviderGlobal: React.FC<ProviderGlobalProps> = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
};
export default ProviderGlobal;
