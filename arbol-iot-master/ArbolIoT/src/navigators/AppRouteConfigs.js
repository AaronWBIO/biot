import { createStackNavigator } from 'react-navigation';
import Splash from '../screens/splash/Splash';
import LogIn from '../screens/user/LogIn';
import Main from '../screens/main/Main';
import Register from '../screens/user/Register';
import ForgotPassword from '../screens/user/ForgotPassword';
import UserProfile from '../screens/user/UserProfile';
import UserEdit from '../screens/user/UserEdit';
import UserLevel from '../screens/user/UserLevel';
import UserContribution from '../screens/contextual-reports/UserContribution';
import TreeViewDetail from '../screens/trees/TreeViewDetail';
import TreeFilters from '../screens/trees/TreeFilters';
import TreeEditForm from '../screens/trees/TreeEditForm';
import Boundary from '../screens/boundary/Boundary';
import Trivia from '../screens/trivia/Trivia';
import TriviaAnswer from '../screens/trivia/TriviaAnswer';
import TriviaCreate from '../screens/trivia/TriviaCreate';
import TriviaCreateForm from '../screens/trivia/TriviaCreateForm';
import LegalAgreements from '../screens/user/RegisterLegalAgreements';
import TermsAndConditions from '../screens/user/TermsAndConditions';
import SuccessfulRegistration from '../screens/user/SuccessfulRegistration';
import Notifications from '../screens/notifications/Notifications';
import Trees from '../screens/trees/Trees';
import Friends from '../screens/user/Friends';
import SpeciesList from '../screens/species/SpeciesList';
import SpecieAssistant from '../screens/species/SpecieAssistant';
import CameraAssistant from '../screens/trees/CameraAssistant';
import Benefits from '../screens/contextual-reports/Benefits';
import Community from '../screens/community/Community';
import CommunityFilters from '../screens/community/CommunityFilters';
import CommunityThread from '../screens/community/CommunityThread';
import CommunityThreadForm from '../screens/community/CommunityThreadForm';
import CommunityCloseThread from '../screens/community/CommunityCloseThread';
import Insignia from '../screens/insignia/insignia';
import UserReports from '../screens/reports/UserReports';
import ReportDetailView from '../screens/reports/ReportDetailView';
import ReportForm from '../screens/reports/ReportForm';
import TreesValidation from '../screens/trees/TreesValidation';
import TreesEditedByCurrentUser from '../screens/trees/TreesEditedByCurrentUser';
import TreePhotos from '../screens/trees/TreePhotos';
import TreeComments from '../screens/trees/TreeComments';
import TreeOffline from '../screens/trees/TreeOffline';
import TreeOfflineDetail from '../screens/trees/TreeOfflineDetail';
import PromoteUsers from '../screens/user/PromoteUsers';
import PromoteUserCancel from '../screens/user/PromoteUserCancel';
import UserTreeList from '../screens/user-trees/UserTreeList';
import UserTreeView from '../screens/user-trees/UserTreeView';
import OnBoard from '../screens/on-board/OnBoard';

const AppRouteConfigs = createStackNavigator({
  UserTreeList: {screen: UserTreeList},
  UserTreeView: {screen: UserTreeView},
  LogIn: {screen: LogIn},
  Main: {screen: Main},
  Register: {screen: Register},
  ForgotPassword: {screen: ForgotPassword},
  UserProfile: {screen: UserProfile},
  UserEdit: {screen: UserEdit},
  UserLevel: {screen: UserLevel},
  UserContribution: {screen: UserContribution},
  LegalAgreements: {screen: LegalAgreements},
  TermsAndConditions: {screen: TermsAndConditions},
  SuccessfulRegistration: {screen: SuccessfulRegistration},
  Notifications: {screen: Notifications},
  Trees: {screen: Trees},
  TreeViewDetail: {screen: TreeViewDetail},
  TreeFilters: {screen: TreeFilters},
  TreeEditForm: {screen: TreeEditForm},
  Boundary: {screen: Boundary},
  Trivia: {screen: Trivia},
  TriviaCreate: {screen: TriviaCreate},
  TriviaCreateForm: {screen: TriviaCreateForm},
  TriviaAnswer: {screen: TriviaAnswer},
  Friends: {screen: Friends},
  SpeciesList: {screen: SpeciesList},
  SpecieAssistant: {screen: SpecieAssistant},
  CameraAssistant: {screen: CameraAssistant},
  Benefits: {screen: Benefits},
  Community: {screen: Community},
  CommunityFilters: {screen: CommunityFilters},
  CommunityThread: {screen: CommunityThread},
  CommunityThreadForm: {screen: CommunityThreadForm},
  CommunityCloseThread: {screen: CommunityCloseThread},
  Insignia: {screen: Insignia},
  UserReports: {screen: UserReports},
  ReportForm: {screen: ReportForm},
  TreesValidation: {screen: TreesValidation},
  ReportDetailView: {screen: ReportDetailView},
  TreePhotos: { screen: TreePhotos},
  TreeComments: { screen: TreeComments},
  TreeOffline: {screen: TreeOffline},
  TreeOfflineDetail: {screen: TreeOfflineDetail},
  PromoteUsers: {screen: PromoteUsers},
  PromoteUserCancel: {screen: PromoteUserCancel},
  TreesEditedByCurrentUser: {screen: TreesEditedByCurrentUser},
  OnBoard: {screen: OnBoard},
  Splash: {screen: Splash},
});

export default AppRouteConfigs;