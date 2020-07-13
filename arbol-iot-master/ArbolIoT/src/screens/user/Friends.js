import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    Text,
    View,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Platform,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Button, Icon, Tabs, Tab, Thumbnail } from "native-base";
import strings from '../../config/languages';
import { Col, Row, Grid } from "react-native-easy-grid";
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import { SearchBar } from 'react-native-elements';
import * as Progress from 'react-native-progress';
import UserService from '../../services/user';
import _ from 'lodash';
import constants from '../../config/constants';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ImageWithAuth from '../../components/image';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';

class Friends extends Component {
    static navigationOptions = ({ navigation }) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={ [ { backgroundColor: colors.mainColor }, Platform.OS == "android" ? { height:60} : {}] }>
                <Grid>
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity 
                            style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}
                            onPress={ () => { 
                                if (params.customBack !== undefined) {
                                    params.customBack();
                                }
                            }}>
                            <Icon name="ios-arrow-back" style= {{ fontSize:28, color:'white',height:35, width: 10, alignSelf:'center', textAlign:'center'}}/>
                        </TouchableOpacity>
                    </Col>
                    <Col style={{ flex:1, textAlign:'center', justifyContent:'center'}}>
                        { params.searchActivated &&
                        <SearchBar round placeholder={strings.friends.search} 
                        style= {{ backgroundColor:'white'}}
                        leftIconContainerStyle = {{ backgroundColor: 'white'}}
                        inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                        onChangeText={ (text) => {
                            navigation.setParams({search:text},() => {});
                            params.handleSearch(text);
                        }}
                        value={ params.search }
                        iconStyle = {{ backgroundColor: 'transparent'}}
                        containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0,
                        borderBottomWidth: 0}} 
                        inputStyle = {{backgroundColor:'white', fontSize:14}} />
                        }
                        {
                            !params.searchActivated &&
                            <Text style={{ alignSelf:'center', color:'white', fontSize:15, fontWeight:'500'}}>{strings.friends.friends}</Text>
                        }
                    </Col>
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity 
                                style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}
                                onPress={ () => { 
                                params.searchActivatedToggle();
                            }}>
                            <Icon name="ios-search" style={{ fontSize:20, color:"white", marginLeft: 10, marginRight:10}}/>
                        </TouchableOpacity>
                    </Col>
                </Grid>
            </SafeAreaView>
        }
    };
    constructor(props) {
        super(props)
        this.state = {
            close: true,
            backFunc: () => {},
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            search: "",
            pageSize: 15,
            tabActive: 0,
            searchActivated: false,
            typingTimeout: 1500,
            followers: [],
            followersIsLoading: false,
            followersPage: 0,
            followersMoreElements: true,
            followersRefreshing: false,
            following: [],
            followingIsLoading: false,
            followingPage: 0,
            followingMoreElements: true,
            followingRefreshing: false,
            global: [],
            globalIsLoading: false,
            globalPage:0,
            globalMoreElements: true,
            globalRefreshing: false,
            alert: { show: false, confirmText: null,  view: <View/>, onConfirmPressed:null, onCancelPressed: null, 
                closeOnHardwareBackPress: null, closeOnTouchOutside: null, showConfirmButton: false},
        }  
        this.props.navigation.setParams({
            searchActivated: false,
            search: "",
            handleSearch: _.debounce(this.handleDebounceSearch, 1000).bind(this),
            searchActivatedToggle: this.searchActivatedToggle.bind(this),
            customBack: this.customBack.bind(this),
            currentIndex: -1,
        });
    }
    customBack(){
        if ( this.state.searchActivated){
            this.searchActivatedToggle();
            this.handleSearch('');
        } else {
            this.props.navigation.goBack();
        }
    }  
    componentDidMount() {
        this.loadFollowers();
    }
    searchActivatedToggle() {
        var searchActivated = !this.state.searchActivated;
        this.setState({searchActivated: searchActivated}, () => {if(this.state.searchActivated == false){
            switch(this.state.tabActive) {
                case 0:
                    this.loadFollowers();
                    break;
                case 1:
                    this.loadFollowing();
                    break;
                case 1:
                    this.loadGlobal();
                    break;
            }
        }})
        this.props.navigation.setParams({searchActivated: searchActivated, search: ""})
    }
    loadFollowers = () => {
        this.setState({followersIsLoading: true});
        UserService.findUsersInFollowedRepository({ search: this.state.search, page: this.state.followersPage, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            if (res.length > 0) {                        
                res.forEach((element,i) => {
                    res[i]['points'] = GeneralHelpers.getUserPointsByWallet(element,'default-xp');
                });
                this.setState({
                    followers: this.state.followersPage === 0 ? res : [...this.state.followers, ...res],
                    followersIsLoading: false,
                    followersRefreshing: false, 
                });      
            } else {
                this.setState({ followersIsLoading: false, followersMoreElements: false, followersRefreshing: false });
            }
        })
        .catch(err => {
            this.setState({ followersIsLoading: false, followersRefreshing: false, });
        });
    }
    loadFollowing = () => {
        this.setState({followingIsLoading: true});
        UserService.findUsersInFollowingRepository({ search: this.state.search, page: this.state.followingPage, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            if (res.length > 0) {
                res.forEach((element,i) => {
                    res[i]['points'] = GeneralHelpers.getUserPointsByWallet(element,'default-xp');
                });
                this.setState({
                    following: this.state.followingPage === 0 ? res : [...this.state.following, ...res],
                    followingIsLoading: false, 
                });                        
            } else {
                this.setState({ followingIsLoading: false, followingMoreElements: false });
            }
        })
        .catch(err => {
            this.setState({ followingIsLoading: false, });
        });
    }
    loadGlobal = () => {
        this.setState({globalIsLoading: true});
        UserService.findUsersInGlobalRepository({ search: this.state.search, page: this.state.globalPage, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            if (res.length > 0) {
                res.forEach((element,i) => {
                    res[i]['points'] = GeneralHelpers.getUserPointsByWallet(element,'default-xp');
                });
                this.setState({
                    global: this.state.globalPage === 0 ? res : [...this.state.global, ...res],
                    globalIsLoading: false, 
                });                        
            } else {
                this.setState({ globalIsLoading: false, globalMoreElements: false, });
            }
        })
        .catch(err => {
            this.setState({ globalIsLoading: false, });
        });
    }
    handleSearch(text) {
        this.props.navigation.setParams({search: text});
    }
    handleDebounceSearch(text) {
        this.setState({ 
            followersPage: 0, 
            followingPage:0,
            globalPage: 0, 
            followersMoreElements: true, 
            followingMoreElements: true,
            globalMoreElements: true,
            followers: [],
            following: [],
            global: [],
            search: text },
            () => {
                switch(this.state.tabActive) {
                    case 0:
                        this.loadFollowers();
                        break;
                    case 1:
                        this.loadFollowing();
                        break;
                    case 2:
                        this.loadGlobal();
                        break;
                }
            })
    }
    componentWillUnmount() {
        clearTimeout(this.state.typingTimeout);
    }
    confirm(item,index) {
        this.hideAlert();
        var change = null;
        switch(this.state.tabActive) {
            case 0:
                change = this.state.followers;
                break;
            case 1:
                change = this.state.following;
                break;
            case 2:
                change = this.state.global;
                break;
        }
        UserService.follow(item.user.id)
        .then((res) => res.json())
        .then((res) => {
            change[index].isFollowedByLoggedUser = !change[index].isFollowedByLoggedUser;
            switch(this.state.tabActive) {
                case 0:
                    this.setState({ followers: change});
                    break;
                case 1:
                    this.setState({ following: change});
                    break;
                case 2:
                    this.setState({ global: change});
                    break;
            }
            if (res.alter == true) {
                this.setState({ 
                    close: true,
                    backFunc: () => {
                    },
                    gamificationAlertGeneralText: strings.friends.messageFriendAdded,
                    eventResponseVM:res});
            } else {
            }
        })
        .catch(e =>{
        })
    }
    showAlert = () => {
        this.state.alert.show = true;
        this.setState({ alert: this.state.alert });
    };
    hideAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });
    };
    alertViewUser(item, index){
        let gamification = null;
        let levelProgress = null;
        if(item.currentLevel && item.currentLevel.payload){
            gamification = JSON.parse(item.currentLevel.payload);
            if(gamification.min > 0 && gamification.max > 0 && item.points > 0) {
                var p = (( 1 / gamification.max) * item.points);
                levelProgress = p <= 0.20 ? 0.30 : p;
              } else {
                levelProgress = 0.30;
              }
        }
        this.state.alert.view = 
            <View style={{ width:'100%', padding: 0, margin: 0}}>
                <View style={{backgroundColor:'#f3f3f5'}}>
                    <View>
                        <Button onPress={ () => this.hideAlert() } style={styles.alertCloseButton}>
                            <Icon name="ios-close" style={{ fontSize:24, color:'#737373', alignSelf:'center'}}/>
                        </Button>
                        <View style={{alignItems: 'center'}}>
                            { this.getUserPhoto(item.user,2) }
                            <Text style={[styles.userName, {marginTop: 5}]}>{[item.user.firstName ,' ',item.user.lastName]}</Text>
                            { item.organization != undefined && item.organization != null && item.organization.length > 0 &&
                                <Text style={{fontSize:12, color:'#737373', fontWeight: '400', marginVertical:2 }}>{item.organization}</Text>
                            }
                            {   item.currentLevel &&
                                <Text style={{fontSize:12, color:'#4a4a4a', fontWeight: '700', marginTop:5}}>                                     
                                    { item.currentLevel.name != null && 
                                        item.currentLevel.name 
                                    }
                                </Text>
                            }   
                            { item.currentLevel &&
                                item.currentLevel.payload &&
                                <View style={styles.barView}>
                                    <Image source={require('../../resources/global/xp-tail.png')} style={styles.tail}/>
                                    <Progress.Bar progress={levelProgress} width={140} height={18} style={styles.progressBar}
                                                        color={"#EA585E"} borderColor={'#1E8D5D'} 
                                                        borderWidth={1.2} unfilledColor={'white'} borderRadius={50} />
                                    <Image source={require('../../resources/global/xp-circle.png')} style={styles.levelCircle}/>
                                    <Text style={styles.barLevel}>{gamification.levelNumber}</Text>
                                </View>
                            }
                            
                            { item.points != undefined ?
                                <View style={{marginVertical: 15,  alignContent: 'center'}}>
                                    <Text style={{ color:'#5b5b5b', fontSize: 12,}}>{strings.friends.xp}</Text>
                                    <View style={{ flexDirection: 'row', paddingTop: 5, alignSelf:'center'}}>
                                        <Image source={require('../../resources/global/icon-medal.png')} 
                                            style={{width:15, height:23, resizeMode: 'contain'}} />
                                        <Text style={{marginLeft:10, color:'#5b5b5b', fontSize:15, fontWeight: '700'}}>{item.points}</Text>
                                    </View>
                                </View> : null
                            } 
                        </View>
                    </View>
                </View>
                <View style={{backgroundColor:'#fff'}}>
                    <View style={{marginVertical:20}}>
                        <View style={{marginBottom: 5, marginTop: 5, paddingLeft: 30, paddingRight: 30, flexDirection:'row'}}>
                            <View style={{marginHorizontal:10}}>
                                <Text style={styles.cardTitles}>{strings.friends.followers}</Text>
                                <Text style={styles.cardData}>{item.followers}</Text>
                            </View>
                            <View style={{marginHorizontal:10}}>
                                <Text style={styles.cardTitles}>{strings.friends.trees}</Text>
                                <Text style={styles.cardData}>{item.trees}</Text>
                            </View>
                            <View style={{marginHorizontal:10}}>
                                <Text style={styles.cardTitles}>{strings.friends.achievements}</Text>
                                <Text style={styles.cardData}>{item.achievements}</Text>
                            </View>
                        </View>   
                        <Button style={item.isFollowedByLoggedUser ? styles.alertButtonTrue : styles.alertButtonFalse} 
                            onPress={() => this.handleFolow(item,index)}>
                            <Text style={item.isFollowedByLoggedUser ? styles.alertButtonTextTrue : styles.alertButtonTextFalse}>
                                {item.isFollowedByLoggedUser ? strings.friends.unfollow : strings.friends.follow}
                            </Text>
                        </Button>
                    </View>
                </View>
            </View>;
        this.state.alert.showConfirmButton= false; 
        this.state.alert.closeOnTouchOutside= true;
        this.state.alert.closeOnHardwareBackPress= true;
        this.setState({ alert: this.state.alert });
        this.showAlert();
    }
    alertHandleFollow(item,index){
        this.state.alert.view = 
            <View style={{ width:'100%', padding: 0, margin: 0}}>                
                <View style={{backgroundColor: 'rgba(255, 255, 255, 0.9)'}}>
                    <View>
                        <Text style={styles.stopFollowing}>
                            {item.isFollowedByLoggedUser ? strings.friends.stopFollowing : strings.friends.follow}
                        </Text>
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity style={[styles.confirmButtons,{borderRightColor: 'grey', borderRightWidth: 1}]} 
                            onPress={() => this.hideAlert()}>
                            <Text style={styles.confirmText}>{strings.friends.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButtons} onPress={() => this.confirm(item,index)}>
                            <Text style={styles.confirmText}>{strings.friends.confirm}</Text>
                        </TouchableOpacity>
                    </View>
                </View>             
            </View>;
        this.state.alert.showConfirmButton= false; 
        this.state.alert.closeOnTouchOutside= false;
        this.state.alert.closeOnHardwareBackPress= false;
        this.setState({ alert: this.state.alert });
        this.showAlert();
    }
    handleFolow(item, index){
        this.hideAlert();
        this.alertHandleFollow(item,index);
    }
    onChangeTab(i) {
        this.state.tabActive = i;
        this.props.navigation.setParams({
            searchActivated : false,
            search: '',
        });
        this.setState(state => ({
            searchActivated: false,
            search: '', 
            followersPage: 0, 
            followers: [], 
            followersMoreElements: true,
            followingPage: 0, 
            following: [], 
            followingMoreElements: true,
            globalPage: 0,
            global: [],
            globalMoreElements: true
        }), 
        () => {
            switch(this.state.tabActive) {
                case 0:
                    this.loadFollowers();
                    break;
                case 1:
                    this.loadFollowing();
                    break;
                case 2:
                    this.loadGlobal();
                    break;
            }
        });   
    }
    getUserPhoto(item,type){
        if(item.imageUrl != null && item.imageUrl != ''){
            if(item.imageUrl != undefined && item.imageUrl.length > 0 && item.imageUrl.startsWith('http')){
                return <View style={{alignItems:'center'}}>
                            <Image style={ type==1 ? styles.circle : styles.circleBig } source={{uri: item.imageUrl}}/>
                        </View>
            } else {                
                return  <View style={{alignItems:'center'}}>
                            <ImageWithAuth style={ type==1 ? styles.circle : styles.circleBig }
                                source={{ uri: constants.base + item.imageUrl }} 
                            />
                        </View>                
            }   
        } else {            
            return  <View style={{alignItems:'center'}}>
                        <Image style={ type==1 ? styles.circle : styles.circleBig } source={require('../../resources/global/default-user-img.png')} />
                    </View>
        }             
    }
    renderItem = ({ item, index }) => {
        return <View key={item.id + ''} style={styles.cardView}>    
                    <Row style={{paddingHorizontal:20}}>
                        <Col size={25}>
                            <TouchableOpacity onPress={() => this.alertViewUser(item)}>
                                { this.getUserPhoto(item.user,1) }
                            </TouchableOpacity>
                        </Col>
                        <Col size={45}>
                            <TouchableOpacity onPress={() => this.alertViewUser(item, index)}>
                                <Text style={{color: '#4A4A4A', fontSize: 14, fontWeight: '700'}}>
                                    {[ item.user.firstName, ' ', item.user.lastName]}
                                </Text>
                                {   item.currentLevel &&
                                    <Text style={{fontSize:12, color:'#5b5b5b', fontWeight: '400'}}>                                     
                                        { item.currentLevel.name != null && 
                                            item.currentLevel.name 
                                        }
                                    </Text>
                                }                                    
                                {item.followingToLoggedUser ? 
                                    <View style={styles.followsYouView}>
                                        <Text style={styles.followsYou}>
                                            {strings.friends.followsYou}
                                        </Text>
                                        <Image source={require('../../resources/global/icon-check-green.png')} style= {styles.check}/>
                                    </View>
                                    :                                     
                                    null
                                }
                                { item.points != undefined ?
                                    <View style={{ flexDirection: 'row', paddingTop: 5}}>
                                        <Image source={require('../../resources/global/icon-medal.png')} 
                                            style={{width:15, height:23, resizeMode: 'contain'}} />
                                        <Text style={{marginLeft:10, color:'#5b5b5b', fontSize:12, fontWeight: '700'}}>{item.points}</Text>
                                    </View> : null
                                }                                
                            </TouchableOpacity>
                        </Col>
                        <Col size={30} style={{ margin:5, paddingRight:0, marginRight:0}}>
                            <Button disabled={!(this.props.user == undefined || this.props.user.id != item.user.id)} style={[ item.isFollowedByLoggedUser ? styles.buttonTrue : styles.buttonFalse, 
                                             (this.props.user == undefined || this.props.user.id != item.user.id) ? { opacity:1 } : {opacity:0.5}]} 
                                onPress={() => this.alertHandleFollow(item,index)}>
                                <Text style={item.isFollowedByLoggedUser ? styles.buttonTextTrue : styles.buttonTextFalse}>
                                    {item.isFollowedByLoggedUser ? strings.friends.unfollow : strings.friends.follow}
                                </Text>
                            </Button>
                        </Col>
                    </Row>        
                </View>
    }
    render(){
        return(
            <SafeAreaView style={{flex: 1}} >
                <Tabs tabBarUnderlineStyle={{backgroundColor: '#2CA06C'}} onChangeTab={({ i }) => this.onChangeTab(i)}
                >
                    <Tab heading={strings.friends.followers}
                        tabStyle={{backgroundColor: '#fff'}}
                        textStyle={{color:'#4a4a4a', fontSize: 14,fontWeight: '400'}}
                        activeTextStyle={{color:'#2CA06C', fontSize: 14, fontWeight: '400'}}
                        activeTabStyle={{backgroundColor: '#fff'}}
                        style={[ {backgroundColor:'#fff'}]}
                        >
                        <FlatList
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.followers}
                            onEndReached={ async () => {
                                this.state.tabActive = 0;
                                if(this.state.followersMoreElements && !this.state.followersIsLoading){
                                    this.setState({ followersPage: this.state.followersPage + 1, }, () => { this.loadFollowers(); });
                                }
                            }}
                            renderItem={this.renderItem}
                            ListEmptyComponent={ () =>{
                                if (this.state.followersIsLoading == true) 
                                    return <View></View>;
                                if(this.state.searchActivated){
                                    return (<View style={{alignItems: 'center', marginTop: 30}}>
                                                <Text style={{color:'#5b5b5b'}}>{strings.friends.emptySearchResult}</Text>
                                            </View>)
                                }
                                return (<View style={{alignItems: 'center', marginTop: 30}}>
                                            <Text style={{ color:'#5b5b5b' }}>{strings.friends.emptyListFollowers}</Text>
                                        </View>);
                            }}
                            ListFooterComponent={ () => {
                                if ( !this.state.followersIsLoading )
                                    return <View></View>;
                                else 
                                    return  <View style={{paddingVertical: 20}}>
                                                <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                                            </View>;           
                            }}
                            refreshing = {this.state.followersRefreshing}
                            onRefresh= {() => {
                                this.setState({ followersIsLoading:true, followersMoreElements: true});
                                this.setState( state => ({followersPage: 0, followers:[] }), () => this.loadFollowers());
                            }}
                            onEndReachedThreshold={0.5}
                        />
                    </Tab>
                    <Tab heading={strings.friends.following}
                        tabStyle={{backgroundColor: '#fff'}}
                        textStyle={{color:'#4a4a4a', fontSize: 14,fontWeight: '400'}}
                        activeTextStyle={{color:'#2CA06C', fontSize: 14, fontWeight: '400'}}
                        activeTabStyle={{backgroundColor: '#fff'}}
                        style={[ {backgroundColor:'#fff'}]}
                        >
                        <FlatList
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.following}
                            onEndReached={ async () => {
                                this.state.tabActive = 1;
                                if(this.state.followingMoreElements && !this.state.followingIsLoading){
                                    this.setState({ followingPage: this.state.followingPage + 1, }, () => { this.loadFollowing(); });
                                }
                            }}
                            renderItem={this.renderItem}
                            ListEmptyComponent={ () =>{
                                if (this.state.followingIsLoading == true) 
                                    return <View></View>;
                                if(this.state.searchActivated){
                                    return (<View style={{alignItems: 'center', marginTop: 30}}>
                                                <Text style={{color:'#5b5b5b'}}>{strings.friends.emptySearchResult}</Text>
                                            </View>)
                                }
                                return (<View style={{alignItems: 'center', marginTop: 30}}>
                                            <Text style={{color:'#5b5b5b', width:'80%', textAlign: 'center'}}>{strings.friends.emptyListFollowing}</Text>
                                        </View>);
                            }}
                            ListFooterComponent={ () => {
                                if ( !this.state.followingIsLoading )
                                    return <View></View>;
                                else 
                                    return  <View style={{paddingVertical: 20}}>
                                                <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                                            </View>;           
                            }}
                            refreshing = {this.state.followingRefreshing}
                            onRefresh= {() => {
                                this.setState({ followingIsLoading:true, followersMoreElements: true});
                                this.setState( state => ({followingPage: 0, following:[] }), () => this.loadFollowing());
                            }}
                            onEndReachedThreshold={0.5}
                        />
                    </Tab>
                    <Tab heading={strings.friends.global}
                        tabStyle={{backgroundColor: '#fff'}}
                        textStyle={{color:'#4a4a4a', fontSize: 14,fontWeight: '400'}}
                        activeTextStyle={{color:'#2CA06C', fontSize: 14, fontWeight: '400'}}
                        activeTabStyle={{backgroundColor: '#fff'}}
                        style={[ {backgroundColor:'#fff'}]}
                        >
                        <FlatList
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.global}
                            onEndReached={ async () => {
                                this.state.tabActive = 2;
                                if(this.state.globalMoreElements && !this.state.globalIsLoading){
                                    this.setState({ globalPage: this.state.globalPage + 1, }, () => { this.loadGlobal(); });
                                }
                            }}
                            renderItem={this.renderItem}
                            onRefresh= {() => {
                                this.setState({ globalIsLoading:true, globalMoreElements: true});
                                this.setState( state => ({globalPage: 0, global:[] }), () => this.loadGlobal());
                            }}
                            refreshing = {this.state.globalRefreshing}
                            ListEmptyComponent={ () =>{
                                if (this.state.globalIsLoading == true) 
                                    return <View></View>;
                                if(this.state.searchActivated){
                                    return (<View style={{alignItems: 'center', marginTop: 30}}>
                                                <Text style={{color:'#5b5b5b'}}>{strings.friends.emptySearchResult}</Text>
                                            </View>)
                                }
                                return (<View style={{alignItems: 'center', marginTop: 30}}>
                                            <Text style={{color:'#5b5b5b'}}>{strings.friends.emptyListGlobal}</Text>
                                        </View>);
                            }}
                            ListFooterComponent={ () => {
                                if ( !this.state.globalIsLoading )
                                    return <View></View>;
                                else 
                                    return  <View style={{paddingVertical: 20}}>
                                                <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                                            </View>;           
                            }}
                            onEndReachedThreshold={0.5}
                        />
                    </Tab>
                </Tabs>
                <GamificationAlert 
                    close = { this.state.close }
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } />
                <AwesomeAlertPlus
                    alertContainerStyle = { { padding: 0, } }
                    overlayStyle= { {padding: 0, position: 'absolute', } }
                    contentContainerStyle= { { borderWidth: 0, borderRadius: 0, padding: 0, margin: 0, backgroundColor: 'transparent',} }
                    messageStyle= { {padding: 0, margin:0} }
                    show={ this.state.alert.show }
                    showProgress={false}
                    closeOnTouchOutside={this.state.alert.closeOnTouchOutside}
                    closeOnHardwareBackPress={this.state.alert.closeOnHardwareBackPress}
                    showCancelButton={false}
                    showConfirmButton={this.state.alert.showConfirmButton}
                    confirmText= {this.state.alert.confirmText}
                    confirmButtonTextStyle= { styles.alertConfirmText }
                    confirmButtonColor="#2CA06C"
                    confirmButtonStyle = { styles.alertButton }
                    onCancelPressed={ this.state.alert.onCancelPressed }
                    onConfirmPressed={ this.state.alert.onConfirmPressed }
                    onDismiss={() => this.hideAlert()}
                    customView = { this.state.alert.view }
                />  
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    circle:{
        borderWidth:1,
        borderColor:'#f7f7f7',
        width:50,
        height:50,
        borderRadius: 50/2,        
    },
    circleBig:{
        borderWidth:1,
        borderColor:'#f7f7f7',
        width:100,
        height:100,
        borderRadius: 100/2,
    },
    followsYou: {
      color: '#41B17C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    followsYouView: {
      flexDirection: 'row',
    },
    userName: {
      fontWeight: '500', 
      fontSize: 16,
      paddingTop: 5,
      color:'#737373',
    },
    check: {
      height: 12,
      width: 12,
      alignSelf: 'center',
      marginLeft: 6,
      resizeMode:'contain'
    },
    buttonFalse: {
      backgroundColor: '#2CA06C',
      width: 100,
      height: 30,
      alignItems: 'center',
      alignSelf: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    buttonTextFalse: {
        color: 'white',
        fontSize: 12,
    },
    buttonTrue: {
      backgroundColor: 'white',
      width: 100,
      height: 30,
      alignItems: 'center',
      alignSelf: 'center',
      justifyContent: 'center',
      borderColor: '#2CA06C',
      borderWidth: 1,
      marginTop: 10,
    },
    buttonTextTrue: {
        color: '#2CA06C',
        fontSize: 12,
    },
    tail: {
        position: 'absolute',
        left: -83,
        height: 20,
        width: 30,
      },
    levelCircle: {
        position: 'absolute',
        top: -5,
        left: -70,
        height: 30,
        width: 30,
      },
    barLevel: {        
        position: 'absolute',
        fontWeight: 'bold',
        color: 'white',
        fontSize: 15,
        left: -60,
        justifyContent:'center',
      },
    progressBar: {
        position: 'absolute',
        left: -70,
      },
    barView: {
        marginBottom: 20,
        marginTop: 15,
      },
    contentContainerStyle: {
        borderWidth: 0, 
        borderRadius: 0, 
        padding: 0, 
        margin: 0, 
        backgroundColor: 'transparent', 
        width: '80%', 
        height: '100%',
    },
    alertButtonTrue: {
        backgroundColor: 'white',
        width: 140,
        height: 40,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        borderColor: '#41B17C',
        borderWidth: 1,
        marginBottom: 30,
        marginTop: 20,
    },
    alertButtonTextTrue: {
        color: '#41B17C',
    },
    alertButtonFalse: {
        backgroundColor: '#41B17C',
        width: 140,
        height: 40,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        borderColor: '#41B17C',
        borderWidth: 1,
        marginBottom: 30,
        marginTop: 20,
    },
    alertButtonTextFalse: {
        color: 'white',
    },
    confirmText: {
        color: '#41B17C',
        fontSize: 18,
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 30,
        paddingRight: 30,
    },
    stopFollowing: {
        fontSize: 18,
        paddingTop: 30,
        paddingBottom: 30,
        paddingLeft: 50,
        paddingRight: 50,
        color: '#828382',
        alignSelf: 'center',
    },
    confirmButtons: {
        borderTopColor: 'grey',
        borderTopWidth: 1,
    },
    cardView: {
        paddingTop: 20, 
        paddingBottom: 20, 
        borderBottomColor: '#D2D3D2', 
        borderBottomWidth: 1,
    },
    alertCloseButton: {
        backgroundColor: 'transparent',
        borderColor: "#f3f3f5",
        elevation: 0,
        width:50,
        height:50,
        justifyContent:'center'
    },
    cardData: {
        alignSelf: 'center', 
        color: '#2CA06C', 
        fontWeight: '500', 
        fontSize: 18
    },
    cardTitles: {
        alignSelf: 'center', 
        fontSize: 14,
        color:'#828382'
    },   
  });

const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        user: state.user.user,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Friends);