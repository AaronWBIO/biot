import createReducer from '../helpers/createReducer';
import * as types from '../ActionTypes';
import AppRouteConfigs from '../../navigators/AppRouteConfigs';

const firstAction = AppRouteConfigs.router.getActionForPathAndParams('Splash');

const initialNavState = AppRouteConfigs.router.getStateForAction(firstAction);


export function nav(state = initialNavState, action) {
  const nextState = AppRouteConfigs.router.getStateForAction(action, state);

  return nextState || state;
};