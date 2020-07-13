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
import { Button, Tabs, Tab, Icon } from "native-base";
import strings from '../../config/languages';
import { Col, Row, Grid } from "react-native-easy-grid";
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import * as Progress from 'react-native-progress';
import { SearchBar } from 'react-native-elements';
import UserService from '../../services/user';
import _ from 'lodash';
import constants from '../../config/constants';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ImageWithAuth from '../../components/image';

class PromoteUsers extends Component {
    static navigationOptions = ({ navigation }) => {
        const {params = {}} = navigation.state;
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={ [ { backgroundColor: '#2CA06C'}, Platform.OS == "android" ? { height:60} : {}] }>
                <Grid >
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity 
                            style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}
                            onPress={ () => { 
                                if (params.customBack !== undefined) {
                                    params.customBack();
                                }
                            }}>
                            <Icon name="ios-arrow-back" style= {{ fontSize:28, color:'white',height:30, width: 10, alignSelf:'center', textAlign:'center'}}/>
                        </TouchableOpacity>
                    </Col>
                    <Col style={{ flex:1, textAlign:'center', justifyContent:'center'}}>
                        { params.searchActivated &&
                        <SearchBar round placeholder={strings.promoteUsers.search}
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
                            <Text style={{ alignSelf:'center', color:'white', fontSize:15, fontWeight:'500'}}>{strings.promoteUsers.promoteUsers}</Text>
                        }
                    </Col>
                    <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center", alignSelf:'center' }}>
                        <TouchableOpacity style={{marginLeft: 10}} onPress={ () => { 
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
            pro: false,
            search: "",
            pageSize: 10,
            tabActive: 0,
            searchActivated: false,
            candidateData: [],
            candidateDataIsLoading: false,
            candidateDataPage: 0,
            candidateDataMoreElements: true,
            proUsers: [],
            proUsersIsLoading: false,
            proUsersPage: 0,
            proUsersMoreElements: true,
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
        this.loadCandidateUsers();
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => { 
                this.handleSearch(this.state.search);
                this.handleDebounceSearch(this.state.search); 
            }),
        ];
    }
    componentWillUnmount() {
        this.subs.forEach((sub) => {
          sub.remove();
        });
    }
    showAlert = () => {
        this.state.alert.show = true;
        this.setState({ alert: this.state.alert });
    };
    hideAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });
    };
    alertPromotion(id,index){
        this.state.alert.view =  
            <View style={{backgroundColor: '#fff'}}>
                <View style={{width: '100%', alginItems: 'center', marginBottom: 10}}>
                    <Text style={styles.promotionTitle}>{strings.promoteUsers.promotionConfirmation}</Text>
                    <Text style={styles.permissions}>{strings.promoteUsers.PROPermissions}</Text>
                    { this.props.attributions.length > 0 && 
                        <View style={{marginVertical:10, alignItems: 'center'}}>
                            {this.props.attributions.map((b,i )=> 
                            <Text key={i} style={{ color: '#737373', fontSize: 13, paddingBottom: 5, lineHeight: 25}}> - {b}</Text>)}
                        </View>
                    }
                </View>
                <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity style={[styles.confirmButtons,{borderRightColor: 'grey', borderRightWidth: 1, width: '50%'}]} 
                        onPress={() => this.hideAlert()}>
                        <Text style={styles.confirmText}>{strings.friends.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.confirmButtons,{width: '50%'}]} onPress={() => this.promote(id,index)}>
                        <Text style={styles.confirmText}>{strings.friends.confirm}</Text>
                    </TouchableOpacity>
                </View>
            </View>;
        this.state.alert.showConfirmButton= false; 
        this.state.alert.closeOnTouchOutside= true;
        this.state.alert.closeOnHardwareBackPress= true;
        this.setState({ alert: this.state.alert });
        this.showAlert();
    }
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
            <View style={{width: '100%', padding: 0, margin: 0}}>
                <View style={{backgroundColor:'#f3f3f5'}}>
                    <View>
                        <Button onPress={ () => this.hideAlert() } style={styles.alertCloseButton}>
                            <Icon name="ios-close" style={[styles.closeIcon, { fontSize:24, color:'#737373', alignSelf:'center'}]}/>
                        </Button>
                        <View style={{alignItems: 'center'}}>
                            { this.getUserPhoto(item.user,2) }
                            { this.state.pro ? 
                                <Image source={require('../../resources/global/icon-star.png')} style= {styles.alertStar}/>
                                : 
                                null
                            }
                            <Text style={[styles.userName,{marginTop:20,color:'#5b5b5b'}]}>{[item.user.firstName, ' ',item.user.lastName]}</Text>
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
                    <View style={{marginTop: 10, marginBottom: 10}}>
                        <Text style={styles.achievements}>{strings.promoteUsers.userAchievements}</Text>
                    </View>
                    <View style={{flexDirection: 'row', borderTopColor: 'gray', borderTopWidth: 0.5, borderBottomColor: 'gray', borderBottomWidth: 0.5}}>
                        <View style={styles.followers}>
                            <Text style={{color: '#2ca06c', fontSize: 20, fontWeight: '700',alignSelf: 'center',}}>{item.followers}</Text>
                            <Text style={{color: '#828382', fontSize: 12, fontWeight: '400',alignSelf: 'center',}}>{strings.promoteUsers.followers}</Text>
                        </View>
                        <View style={{width: '50%', paddingTop: 20, paddingBottom: 20}}>
                            <Text style={{color: '#2ca06c', fontSize: 20, fontWeight: '700',alignSelf: 'center',}}>{item.publications}</Text>
                            <Text style={{color: '#828382', fontSize: 12, fontWeight: '400',alignSelf: 'center',}}>{strings.promoteUsers.posts}</Text>
                        </View>
                    </View>
                    <Button style={this.state.pro ? 
                        styles.alertButtonTrue : styles.alertButtonFalse} 
                        onPress={() => this.promoteOrDemote(item.user.id, index)}>
                        <Text style={this.state.pro ? styles.alertButtonTextTrue : styles.alertButtonTextFalse}>
                            {this.state.pro ? strings.promoteUsers.demote : strings.promoteUsers.promoteToPro}</Text>
                    </Button>
                </View>
            </View>;
        this.state.alert.showConfirmButton= false; 
        this.state.alert.closeOnTouchOutside= true;
        this.state.alert.closeOnHardwareBackPress= true;
        this.setState({ alert: this.state.alert });
        this.showAlert();    
    }
    promoteOrDemote(id, index) {
        this.hideAlert();
        if(this.state.pro){
            this.props.navigation.navigate('PromoteUserCancel',{ id, mode:'view' });
        }
        else{
            this.alertPromotion(id,index);
        }                            
    }
    promote(id, index) {
        this.hideAlert();
        UserService.togglePRO(id)
        .then((res) =>{
            var change = null;
            if (this.state.tabActive == 0) {
                change = this.state.candidateData;
                change.splice(index, 1);
                this.setState({
                    candidateData: change
                });
            } else if (this.state.tabActive == 1) {
                change = this.state.proUsers;
                change.splice(index, 1);
                this.setState({
                    proUsers: change
                });
            }
        }).catch((res) => { })        
    }
    searchActivatedToggle() {
        var searchActivated = !this.state.searchActivated;
        this.setState({searchActivated: searchActivated}, () => {if(this.state.searchActivated == false){
            switch(this.state.tabActive) {
                case 0:
                    this.loadCandidateUsers();
                    break;
                case 1:
                    this.loadProUsers();
                    break;
            }
        }})
        this.props.navigation.setParams({searchActivated: searchActivated, search: ""})
    }
    loadCandidateUsers = async () => {
        this.setState({candidateDataIsLoading: true});        
        UserService.findNoPRO({ search: this.state.search, page: this.state.candidateDataPage, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            res.forEach((element,i) => {
                res[i]['points'] = GeneralHelpers.getUserPointsByWallet(element,'default-xp');
            });
            if (res.length > 0) {
                this.setState({ 
                    candidateData: this.state.candidateDataPage === 0 ? res : [...this.state.candidateData, ...res],
                    candidateDataIsLoading: false,
                    pro: false
                });
            } else{
                this.setState({ candidateDataMoreElements: false, candidateDataIsLoading: false, pro: false})
            }
        })
        .catch(err => {
            this.setState({ candidateDataIsLoading: false, pro: false})
        });
    }
    loadProUsers = async () => {
        this.setState({proUsersIsLoading: true});        
        UserService.findPRO({ search: this.state.search, page: this.state.proUsersPage, size: this.state.pageSize})
        .then(res => res.json())
        .then(res => {
            res.forEach((element,i) => {
                res[i]['points'] = GeneralHelpers.getUserPointsByWallet(element,'default-xp');
            });
            if (res.length > 0) {
                this.setState({ 
                    proUsers: this.state.proUsersPage === 0 ? res : [...this.state.proUsers, ...res],
                    proUsersIsLoading: false,
                    pro: true,
                });
            } else{
                this.setState({ proUsersMoreElements: false, proUsersIsLoading: false, pro: true,})
            }
        })
        .catch(err => {
            this.setState({ proUsersIsLoading: false, pro: true,})
        });
    }
    handleSearch(text) {
        this.props.navigation.setParams({search: text})
    }
    handleDebounceSearch(text) {
        this.setState({ 
            proUsersPage: 0, 
            candidateDataPage:0, 
            proUsersMoreElements: true, 
            candidateDataMoreElements: true,
            candidateData: [],
            proUsers: [],
            search: text},
            () => {
                switch(this.state.tabActive) {
                    case 0:
                        this.loadCandidateUsers();
                        break;
                    case 1:
                        this.loadProUsers();
                        break;
                }
            })
    }
    onChangeTab(i) {
        this.state.tabActive = i;
        this.props.navigation.setParams({
            searchActivated : false,
            search: '',
        });
        if (this.state.tabActive == 0) {
            this.setState(state => ({
                searchActivated: false,
                search: '', 
                candidateDataPage: 0, 
                candidateData: [], 
                candidateDataMoreElements: true,
                proUsersPage: 0, 
                proUsers: [], 
                proUsersMoreElements: true,
            }), 
            () => this.loadCandidateUsers());   
        } else if (this.state.tabActive == 1) {
            this.setState(state => ({
                searchActivated: false,
                search: '', 
                proUsersPage: 0, 
                proUsers: [], 
                proUsersMoreElements: true,
                candidateDataPage: 0, 
                candidateData: [], 
                candidateDataMoreElements: true
            }), 
            () => this.loadProUsers());   
        }
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
        return(
            <View style={styles.cardView}>
                <Row style={{paddingHorizontal:20}}>
                    <Col size={25} >            
                        <View >
                            { this.getUserPhoto(item.user,1) }
                        </View>
                    </Col>
                    <Col size={45}>
                        <View>                            
                            <Text style={{color: '#4A4A4A', fontSize: 14, fontWeight: '700'}}>
                                {[ item.user.firstName, ' ',item.user.lastName]}
                            </Text>
                            {   item.currentLevel &&
                                <Text style={{fontSize:12, color:'#5b5b5b', fontWeight: '400'}}>                                     
                                    { item.currentLevel.name != null && 
                                        item.currentLevel.name 
                                    }
                                </Text>
                            }
                            { item.points != undefined ?
                                <View style={{ flexDirection: 'row', paddingTop: 5}}>
                                    <Image source={require('../../resources/global/icon-medal.png')} 
                                        style={{width:15, height:23, resizeMode: 'contain'}} />
                                    <Text style={{marginLeft:10, color:'#5b5b5b', fontSize:12, fontWeight: '700'}}>{item.points}</Text>
                                </View> : null
                            }
                        </View>
                    </Col>
                    <Col size={30} style={{justifyContent:'center'}} >
                        <Button style={styles.buttonFalse} onPress={() => this.alertViewUser(item,index)}>
                            <Text style={[styles.buttonTextFalse, { fontSize: 12}]}>{strings.promoteUsers.seeCard}</Text>
                        </Button>
                    </Col>
                </Row>
            </View>
        )

    }
    render(){
        return(
            <SafeAreaView style={{flex: 1}}>
                <Tabs onChangeTab={({ i }) => this.onChangeTab(i)}
                    tabBarUnderlineStyle={{backgroundColor: '#2CA06C'}}>
                    <Tab heading={strings.promoteUsers.candidates}                            
                        tabStyle={{backgroundColor: '#fff'}}
                        textStyle={{color:'#4a4a4a', fontSize: 14,fontWeight: '400'}}                            
                        activeTextStyle={{color:'#2CA06C', fontSize: 14, fontWeight: '400'}}
                        activeTabStyle={{backgroundColor: '#fff'}}
                        >                                             
                        <FlatList
                            extraData={this.state}
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.candidateData}
                            onEndReached={ async () => {
                                this.state.tabActive = 0;
                                if(this.state.candidateDataMoreElements && !this.state.candidateDataIsLoading){
                                    this.setState({ candidateDataPage: this.state.candidateDataPage + 1, }, () => { this.loadCandidateUsers(); });
                                }
                            }}
                            renderItem={this.renderItem}
                            ListEmptyComponent={ () =>{
                                if (this.state.candidateDataIsLoading == true) 
                                    return <View></View>;
                                if(this.state.searchActivated){
                                    return (<View style={{alignItems: 'center', marginTop: 30}}>
                                                <Text style={{color:'#5b5b5b'}}>{strings.friends.emptySearchResult}</Text>
                                            </View>)
                                }
                                return (<View style={{alignItems: 'center', marginTop: 30}}>
                                            <Text style={{color:'#5b5b5b', textAlign: 'center'}}>{strings.promoteUsers.emptyNoPro}</Text>
                                        </View>);
                            }}
                            ListFooterComponent={ () => {
                                if ( !this.state.candidateDataIsLoading)
                                    return <View></View>;
                                else 
                                    return  <View style={{paddingVertical: 20}}>
                                                <ActivityIndicator style={{alignSelf:'center'}} size="large" color="#32AA77" />
                                            </View>;           
                            }}
                            onEndReachedThreshold={0.5}
                        />
                    </Tab>
                    <Tab heading={strings.promoteUsers.proUsers}                            
                        tabStyle={{backgroundColor: '#fff'}}
                        textStyle={{color:'#4a4a4a', fontSize: 14,fontWeight: '400'}}                            
                        activeTextStyle={{color:'#2CA06C', fontSize: 14, fontWeight: '400'}}
                        activeTabStyle={{backgroundColor: '#fff'}}
                        >                       
                        <FlatList
                            extraData={this.state}
                            style={{ width: '100%' }}
                            keyExtractor={(item, index) => index + ''}
                            data={this.state.proUsers}
                            onEndReached={ async () => {
                                this.state.tabActive = 1;
                                if(this.state.proUsersMoreElements && !this.state.proUsersIsLoading){
                                    this.setState({ proUsersPage: this.state.proUsersPage + 1, }, () => { this.loadProUsers(); });
                                }
                            }}
                            renderItem={this.renderItem}
                            ListEmptyComponent={ () =>{
                                if (this.state.proUsersIsLoading == true) 
                                    return <View></View>;
                                if(this.state.searchActivated){
                                    return (<View style={{alignItems: 'center', marginTop: 30}}>
                                                <Text style={{color:'#5b5b5b'}}>{strings.friends.emptySearchResult}</Text>
                                            </View>)
                                }
                                return (<View style={{alignItems: 'center', marginTop: 30}}>
                                            <Text style={{color:'#5b5b5b', textAlign: 'center'}}>{strings.promoteUsers.emptyPro}</Text>
                                        </View>);
                            }}
                            ListFooterComponent={ () => {
                                if ( !this.state.proUsersIsLoading )
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
        width:50,
        height:50,
        borderRadius: 50/2,     
        borderWidth:1,
        borderColor:'#f7f7f7',   
    },
    circleBig:{
        width:100,
        height:100,
        borderRadius: 100/2,
        borderWidth:1,
        borderColor:'#f7f7f7',
    },
    userName: {        
        fontWeight: '500', 
        fontSize: 16,
        paddingTop: 0,
        color:'#737373',
    },
    buttonFalse: {
      backgroundColor: '#2CA06C',
      margin:0,
      padding:10,
      height:30,
      alignItems: 'center',
      alignSelf: 'center',
      justifyContent: 'center',
    },
    buttonTextFalse: {
        color: 'white',
        fontSize:12.
    },
    closeIcon: {
        height:20, 
        width: 20,
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
        left: -60,
        fontSize: 15,
    },
    progressBar: {
        position: 'absolute',
        left: -70,
    },
    barView: {
        marginBottom: 20,
        marginTop: 10,
    },
    alertButtonTrue: {
        backgroundColor: 'white',
        width: 220,
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
        fontSize:12
    },
    alertButtonFalse: {
        backgroundColor: '#41B17C',
        width: 220,
        height: 40,
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        borderColor: '#41B17C',
        borderWidth: 1,
        marginBottom: 30,
        marginTop: 20,
        borderRadius: 5,
    },
    alertButtonTextFalse: {
        color: 'white',
        fontSize:12
    },
    alertStar: {
        position: 'absolute',
        height: 30,
        width: 30,
        top: 84
    },
    confirmText: {
        color: '#208d5c',
        fontSize: 13,
        fontWeight: '400',
        alignSelf: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 30,
        paddingRight: 30,
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
        marginLeft: 12, 
        padding: 0, 
        backgroundColor: 'transparent', 
        elevation: 0, 
        borderColor: '#f3f3f5'
    },
    followers: {
        borderRightColor: 'gray', 
        borderRightWidth: 0.5, 
        width: '50%', 
        paddingTop: 20, 
        paddingBottom: 20,
    },
    achievements: {
        fontWeight: '500',
        color:'#5b5b5b',
        alignSelf: 'center', 
        fontSize: 16,
    },
    promotionTitle: {
        fontWeight: '400', 
        fontSize: 18, 
        marginTop: 20, 
        marginBottom: 10, 
        marginLeft: 30, 
        marginRight: 30, 
        alignSelf: 'center', 
        textAlign: 'center',
        color:'#737373'
    },
    permissions: {
        fontSize: 13, 
        marginTop: 0, 
        marginBottom: 0, 
        marginLeft: 30, 
        marginRight: 30, 
        alignSelf: 'center', 
        textAlign: 'center',
        color: '#737373',
        fontWeight: '400',
        lineHeight: 25
    },
  });

const mapStateToProps = (state) => {
    return {
        attributions: state.config.application.dynamic.userPolicyModule.policyNewAtributions,
        user: state.user,
        idToken: state.user.id_token,
    }
  }
  
  const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
  }
  
  export default connect(mapStateToProps, mapDispatchToProps)(PromoteUsers);