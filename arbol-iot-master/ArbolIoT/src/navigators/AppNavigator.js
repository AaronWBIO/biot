import React from 'react';
import { compose, createStore, applyMiddleware } from 'redux';
import { reduxifyNavigator, createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { connect } from 'react-redux';
import AppRouteConfigs from './AppRouteConfigs';
import reducers from '../redux/reducers';
import { persistStore , persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage';
import getTheme from '../../native-base-theme/components';
import { StyleProvider, Root } from "native-base";
import { LOGOUT } from '../redux/ActionTypes';

const middleware = createReactNavigationReduxMiddleware(
  'root',
  state => state.nav,
);
const App = reduxifyNavigator(AppRouteConfigs, 'root');
const mapStateToProps = state => ({
  state: state.nav
});
const AppWithNavigationState = connect(mapStateToProps)(App);
const loggerMiddleware = createLogger({ predicate: () => __DEV__ });
const enhancer = compose(
  applyMiddleware(
    middleware,
    thunkMiddleware,
    loggerMiddleware,
  )
); 
const persistConfig = { key: 'root',blacklist:['nav'], storage }
// const persistConfig = { key: 'root', storage }
const rootReducer = ( state, action ) => {
  if ( action.type === LOGOUT ) {
    state = undefined;
  }   
  return reducers(state, action)
}
let persistCombineReducer = persistReducer(persistConfig,rootReducer);
let store = createStore(persistCombineReducer,{},enhancer);
let persistor = persistStore(store);
const FinalRoot = () => 
  <Root>
    <StyleProvider  style={getTheme()}>
        <AppWithNavigationState>
        </AppWithNavigationState>
    </StyleProvider>    
  </Root>;
export { store , FinalRoot , persistor };