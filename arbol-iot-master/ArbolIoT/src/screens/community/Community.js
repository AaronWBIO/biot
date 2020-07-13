import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row, Grid } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import ReactNavigation from 'react-navigation';
import { Tabs, Tab, Icon, Body, Card, CardItem, Left, List, ListItem, } from 'native-base';
import { SearchBar } from 'react-native-elements';
import strings from '../../config/languages';
import { BottomSheet } from 'react-native-btr';
import CommunityService from '../../services/community';
import constants from '../../config/constants';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import ImageWithAuth from '../../components/image';
import _ from 'lodash';
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';

class Community extends Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state; 
        return {
            headerTintColor: colors.white,
            header: 
            <SafeAreaView style={{ backgroundColor: colors.mainColor }}>
                <View style={{ backgroundColor: colors.mainColor ,height: 60}}>
                    <Grid >
                        <Col style={{ width:60,height: 60, justifyContent: "center", alignItems: "center" }}>
                            <TouchableOpacity style={{ width:60, height:60, padding:5, justifyContent:'center'}} 
                                onPress={ () => { 
                                    if (params.customBack !== undefined) {
                                        params.customBack();
                                    }
                                }}>
                                <Icon name="ios-arrow-back" style= {[ globalStyles.headerLeftIcon, { alignSelf:'center'}]}/>
                            </TouchableOpacity>
                        </Col>                    
                        <Col> 
                            { (!params.showSearch == undefined || !params.showSearch) ? 
                                <View style={[styles.centerContent, {flexDirection:'row'}]}>
                                    <Text style={styles.title}> {strings.community.title} </Text>                                
                                </View>
                                :                             
                                <SearchBar 
                                    placeholder={ strings.community.searchPlaceHolder }
                                    style= {{ backgroundColor:'white', size:11}}
                                    leftIconContainerStyle = {{ backgroundColor: 'white'}}
                                    inputContainerStyle={{ backgroundColor:'white', borderRadius:10}}
                                    onChangeText={ (text) => {
                                        navigation.setParams({searchText:text},() => {});
                                        params.updateSearch(text);
                                    }}
                                    value={ params.searchText }
                                    iconStyle = {{ backgroundColor: 'transparent'}}
                                    containerStyle = {{backgroundColor:'transparent', borderTopWidth: 0,
                                    borderBottomWidth: 0}} 
                                    inputStyle = {{backgroundColor:'white', fontSize:14}} 
                                    />                                
                            }                   
                        </Col>
                        <Col style={{ width:80,height: 60, justifyContent: "center", alignItems: "center"}} >
                            <View style={{flexDirection:'row', position:'relative', right: 0,}}>
                                { (!params.showSearch == undefined || !params.showSearch) ?
                                    <TouchableOpacity onPress={ () => params.handleSearchBar()} style={{height:30, width:30,justifyContent:'center'}}>
                                        <Icon name="ios-search" style= {[ globalStyles.headerLeftIcon, { fontSize:25, width:25, height: 25, alignSelf:'center'}]}/>
                                    </TouchableOpacity> : null
                                }
                                <TouchableOpacity onPress={ () => params.handleFilters()} style={{height:30, width:30,justifyContent:'center'}}>
                                    <Image source={require('../../resources/global/icon-filter.png')} style={{ width:17, height: 18, resizeMode: 'contain', alignSelf:'center'}}/>
                                </TouchableOpacity>
                            </View>
                        </Col>
                    </Grid>
                </View>
            </SafeAreaView>
        }
    };   
    constructor(props) {
        super(props)
        this.state = {
            refreshing: false,
            userIsPro: false,
            showSearch: false,
            isProcessingLike: false,
            showBottomSheetOptions: { visible: false, item: null, index: null},
            searchText: '',            
            tabActive: 0,             
            currentUser: false,
            page: 0,
            size: 10,
            tags: '',
            communityData: [],
            isLoading: false,
            moreElements: true,
            filtersData: false,
            perms: {
                community: {
                    toggleSticky: { status:false },
                    toggleClose: { status:false }
                },
                communityComment: {
                    interact: { status:false, desc: strings.community.defaultPerm },
                }
            }
        }
        this.permsMaping();
    }
    permsMaping() {
        this.state.perms.community.toggleSticky = GeneralHelpers.hasPermission('community','toggleSticky').remote == true ?
          GeneralHelpers.hasPermission('community','toggleSticky') :
          this.state.perms.community.toggleSticky;
        this.state.perms.community.toggleClose = GeneralHelpers.hasPermission('community','toggleClose').remote == true ?
          GeneralHelpers.hasPermission('community','toggleClose') :
          this.state.perms.community.toggleClose;
        this.state.perms.communityComment.interact = GeneralHelpers.hasPermission('communityComment','interact').remote == true ?
          GeneralHelpers.hasPermission('communityComment','interact') :
          this.state.perms.communityComment.interact;
    }
    componentDidMount() {     
        Orientation.lockToPortrait();
        this.props.navigation.setParams({
            updateSearch: _.debounce(this.updateSearch, 1000).bind(this),
            customBack: this.customBack.bind(this),
            handleSearchBar: this.handleSearchBar.bind(this),
            handleFilters: this.handleFilters.bind(this),
            showSearch: false,
            searchText: '',
            isLoading: false,
            filters: null
        });
        this.setState({
            searchText: '',
            communityData: null,
            page: 0,
            moreElements: true,
        });
        this.subs = [ 
            this.props.navigation.addListener ('willFocus', () => { this.refreshState()}),
        ];
        this.loadCommunityPublications(null);
        this.setUpUserRole();        
    }    
    componentWillUnmount() {
        this.subs.forEach((sub) => {
          sub.remove();
        });
    }
    refreshState = () => {
        let filters = this.props.navigation.state.params;
        if(filters != undefined){
            if(filters.filters != null){            
                this.setState({
                    currentUser: filters.filters.currentUser,
                    page: filters.filters.page,
                    size: filters.filters.size,
                    tags: filters.filters.tags,
                    filtersData : true,
                    communityData:[],
                    moreElements: true
                });
            }
            this.loadCommunityPublications(filters.filters);
        } else {
            this.loadCommunityPublications(null);
        }
    }
    setUpUserRole(){
        if( this.props.user.authorities != undefined){
            let isPro = this.state.perms.community.toggleClose.status || this.state.perms.community.toggleSticky.status;
            let isAdmin = this.props.user.authorities.findIndex(element => element.name === 'ROLE_ADMIN');
            if(isPro != false || isAdmin != -1){
                this.setState({ userIsPro: true })
            }
        } 
    }
    loadCommunityPublications= (params) => {
        this.setState({isLoading: true});
        var req = this.state.tabActive;
        let filters=[];
        if(params == null){
            filters= {
                search: this.state.searchText, 
                page: this.state.page, 
                size: this.state.size,
                currentUser: this.state.currentUser,
                tags: this.state.tags,
            }
        } else {
            filters = params;
        }
        if(this.state.tabActive == 0){            
            filters['sticky']= false;            
        } else {
            filters['sticky']= true;
        } 
        CommunityService.queryPublications(filters)
        .then(res => res.json())
        .then(res => {
            if (res.length > 0) {
                if ( req == this.state.tabActive) {
                    this.setState({
                        communityData: this.state.page === 0 ? res : [...this.state.communityData, ...res],
                        isRefreshing: false,
                        refreshing: false,
                        isLoading: false,
                    });
                }
            }      
            this.props.navigation.setParams({
                isLoading: false,
                searchText: this.state.searchText
            });          
            this.setState({isLoading: false, refreshing: false, moreElements: false});
        })
        .catch(err => {
            this.setState({isLoading: false, refreshing: false});
            this.props.navigation.setParams({
                isLoading: false,
                searchText: this.state.searchText
            });
        });
    }
    updateSearch(searchText) { 
        let params = {
            page: 0,
            size: 10,
            search: searchText,
            currentUser: this.state.currentUser,
            tags: this.state.tags,
        }
        if(this.state.tabActive == 0){            
            params['sticky']= false;            
        } else {
            params['sticky']= true;
        }
        this.setState({ 
            communityData: [],
            isLoading: true, 
            page: 0,
            moreElements: true,
            searchText });
        this.props.navigation.setParams({
            searchText,
            isLoading: true
        });
        this.loadCommunityPublications(params);
    }
    handleSearchBar(){
        var visible = !this.state.showSearch;
        this.setState({
            showSearch: visible,
        })   
        this.props.navigation.setParams({
            showSearch : visible,
        });
    }
    customBack(){
        if ( this.state.showSearch){
            this.handleSearchBar();
            this.updateSearch('');
        } else {
            this.props.navigation.goBack();
        }
    }  
    actionLike(item, index){
        this.setState({isProcessingLike:true});
        CommunityService.toggleLike(
            item.id
        )
        .then(res => {
            if(res.status == 200 || res.status == 201){         
                var newDataProvider = [];
                newDataProvider = this.state.communityData;
                if( !newDataProvider[index].likedByCurrentUser ) {             
                    newDataProvider[index].likes = newDataProvider[index].likes + 1;
                    newDataProvider[index].likedByCurrentUser = true;
                } else {
                    newDataProvider[index].likes = newDataProvider[index].likes - 1;
                    newDataProvider[index].likedByCurrentUser = false;
                }
                this.setState({ communityData: newDataProvider });
            }
            this.setState({isProcessingLike:false});
        })
        .catch(e => { 
            this.setState({isProcessingLike:false});
        });        
             
    }
    getUserPhoto(item){
        if(item.imageUrl == undefined || item.imageUrl == null) {
            return <Image source={require('../../resources/global/default-user-img.png')} style={ [ styles.userPictureBorder, styles.imageProfile ]} />
        } else {
            if(item.imageUrl.startsWith('http')){
                return <ImageWithAuth style={ [ styles.userPictureBorder, styles.imageProfile ]} source={{uri: item.imageUrl}}/>
            } else {
                return <ImageWithAuth 
                            style={[styles.userPictureBorder, styles.imageProfile ]}
                            source={{  uri: constants.base + item.imageUrl }} 
                        />
            }        
        }
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color={ colors.mainColor } size='large' />
                    </View> : null);
    }
    renderItem = ({ item, index }) => {
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return  <View style={ index == 0 ? [styles.card, {marginTop:20, marginBottom: 20,}] : [styles.card,{marginBottom:20,}]} >
                    <Card style={{borderBottomColor: '#979797', borderBottomWidth: 2}}>
                        { this.state.userIsPro ? 
                                <View style={{ alignItems: 'flex-end', paddingTop:15, paddingBottom:0, paddingRight:20 }}>
                                    <TouchableOpacity  onPress={() => { this.showRecentOptionsComponent(item,index); }} style={{padding:5,}}>
                                        <Image source={require('../../resources/global/icon-dots.png')} style={{ width: 27, height:5, resizeMode:'contain'}}/>
                                    </TouchableOpacity>
                                </View>
                                : 
                                null
                        }
                        <CardItem>                            
                            <Left>
                                {  item.author.id != undefined ?
                                     this.getUserPhoto(item.author) : null
                                }
                                <Body style={{marginLeft:15}}>
                                    <View style={ {flexDirection:'row'}}>
                                        {  item.author.id != undefined ?
                                            <Text style={styles.userName}>{[item.author.firstName, ' ', item.author.lastName]}</Text> 
                                            :
                                            <Text style={styles.userName}>-</Text> 
                                        }
                                        {   item.sticky ?
                                            <Image source={require('../../resources/global/icon-star.png')} style={{ width: 18, height: 18, resizeMode: 'contain', marginLeft: 10, }}/>
                                            :
                                            null
                                        }
                                    </View>
                                    { item.readableDate ?
                                        <Text style={styles.publishDate}>{item.readableDate}</Text>
                                        :
                                        <Text style={styles.publishDate}> --- </Text>
                                    }
                                    { item.status == 'close' ? 
                                        <Text style={styles.publishDate}>{strings.community.threadClose}</Text>
                                        :
                                        null 
                                    }
                                </Body>                                
                            </Left>
                        </CardItem>
                        <CardItem cardBody style={[styles.card, {marginTop: 5, marginBottom:10 }]}>
                            <Text style={styles.message}>{item.body}</Text>
                        </CardItem>
                        <CardItem cardBody style={styles.card}>
                                { item.image &&
                                    <ImageWithAuth                                     
                                        style={{ height: 200, width: '100%', flex: 1, resizeMode: 'contain'}} 
                                        source={{ uri:  constants.base + item.image.uri }} 
                                    />
                                }                                                             
                        </CardItem>
                        { item.tags != undefined && item.tags.length > 0 &&
                        <CardItem style={ [ styles.card, {paddingLeft:0} ] }>
                            <Left style={{alignItems: 'baseline', paddingTop: 5}}>
                                <Text style={styles.tagsLabel}>{strings.community.tags}</Text>
                                <View style={{ flexDirection:'row', flexWrap: 'wrap'}}> 
                                    { this.getTags(item.tags) } 
                                </View>                             
                            </Left>                           
                        </CardItem> 
                        }
                        <CardItem style={{marginTop:10, borderTopColor: "#D2D3D2", borderTopWidth: 1}}>
                            <Row style={{margin: -12, padding: 0, }}>
                                <Col style={{borderRightColor: "#D2D3D2", borderRightWidth: 1, flexDirection:'row', paddingVertical: 15, justifyContent:'center'}}>
                                    <TouchableOpacity onPress={() => this.actionLike(item,index) }  style={{opacity: this.state.isProcessingLike ? 0.5 : 1}} disabled={this.state.isProcessingLike}>
                                        <View style={{ flexDirection:'row',}}>
                                        {   item.likedByCurrentUser ?                                        
                                            <Image source={require('../../resources/community/icon-heart.png') } style={{height:25, width:25, resizeMode:'contain'}}/>
                                            :                                         
                                            <Image source={require('../../resources/community/icon-heart-gray.png') } style={{height:25, width:25, resizeMode:'contain'}}/>
                                        }    
                                        <Text style={styles.counter}>{item.likes}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </Col>
                                <Col style={{flexDirection:'row', paddingVertical: 15, justifyContent:'center'}}>
                                    <TouchableOpacity onPress={() => this.redirectToView(item) }>
                                        <View style={{ flexDirection:'row',}}>
                                            <Image source={require('../../resources/community/icon-msg.png') } style={{height:25, width:25, resizeMode:'contain'}}/>                                            
                                            <Text style={styles.counter}>{item.comments}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </Col>
                            </Row> 
                        </CardItem>
                    </Card> 
                </View>
    }
    getTags(tags) {
        return tags.map(function(item, i){
          return(
            <View key={i} style={[styles.tagContainer,{ marginBottom:10}]}>
              <Text style={styles.tagsText}>{item.tag}</Text>
            </View>
          );
        });
    }
    handleFilters(){
        let filters = this.props.navigation.state.params;              
        if(this.state.filtersData){
            var data = filters.data;
            this.props.navigation.navigate('CommunityFilters',{ data });
        } else {
            this.props.navigation.navigate('CommunityFilters');
        }
        
    }
    handleSticky(item,index){
        CommunityService.toggleSticky(
            item.id
        )
        .then(res => {
            if(res.status == 200 || res.status == 201){         
                var newDataProvider = [];
                newDataProvider = this.state.communityData;
                newDataProvider[index].sticky = !newDataProvider[index].sticky;
                this.setState({ 
                    communityData: newDataProvider,
                    showBottomSheetOptions: {visible: false, item: null, index: null}
                });
            }
        })
        .catch(e => {});        
    }
    handleCloseThread(item,index){
        let id = item.id;
        this.setState({ showBottomSheetOptions: {visible: false, item: null, index: null} });
        this.props.navigation.navigate('CommunityCloseThread',{ id, mode:'view' });
    }    
    showRecentOptionsComponent(item,index) {
        let data = { visible: true, item: item, index:index}
        this.setState({ showBottomSheetOptions : data });
    }
    bottomSheetOptions = () =>         
        (<BottomSheet 
            visible={ this.state.showBottomSheetOptions.visible}
            onBackButtonPress={ () => { this.setState({ showBottomSheetOptions: {visible: false, item: null, index: null} }) }}
            onBackdropPress={ () => { this.setState({ showBottomSheetOptions: {visible: false, item: null, index: null} }) }}>
            <ReactNavigation.SafeAreaView style={ styles.block }>                
                <TouchableOpacity style={ styles.blockCloseButton } onPress={ (e) => { this.setState({showBottomSheetOptions: {visible: false, item: null, index: null } }) }}>
                    <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                </TouchableOpacity>
                { this.state.showBottomSheetOptions.item != null ? 
                        <View>
                        <List>                                                        
                            <ListItem thumbnail style={ {borderBottomColor: "#D2D3D2", borderBottomWidth: 1, marginLeft: 0}}>                                    
                                    <Left style={{paddingLeft:20}}>
                                        <TouchableOpacity onPress={() => this.handleSticky(this.state.showBottomSheetOptions.item,this.state.showBottomSheetOptions.index)}>
                                            { !this.state.showBottomSheetOptions.item.sticky ?
                                                <Image source={require('../../resources/global/icon-star.png')} style={{width: 18, height: 18, resizeMode: 'contain',}} />
                                                :
                                                <Image source={require('../../resources/global/icon-star-gray.png')} style={{width: 18, height: 18, resizeMode: 'contain',}} />
                                            }
                                        </TouchableOpacity>
                                    </Left>
                                    <Body style={{ borderBottomWidth: 0 }}>
                                        <TouchableOpacity onPress={() => this.handleSticky(this.state.showBottomSheetOptions.item,this.state.showBottomSheetOptions.index)}>
                                            { !this.state.showBottomSheetOptions.item.sticky ?
                                                <Text style={globalStyles.text}>{strings.community.bottomOptionLayer.outstanding}</Text>
                                                :
                                                <Text style={globalStyles.text}>{strings.community.bottomOptionLayer.noOutstanding}</Text>
                                            }
                                        </TouchableOpacity>
                                    </Body>                            
                            </ListItem>                             
                            { this.state.showBottomSheetOptions.item.status == 'open'?
                                <ListItem thumbnail style={ {borderBottomColor: "#D2D3D2", borderBottomWidth: 1, marginLeft: 0}}>
                                    <Left style={{paddingLeft:20}}>
                                        <TouchableOpacity onPress={() => this.handleCloseThread(this.state.showBottomSheetOptions.item,this.state.showBottomSheetOptions.index)}>
                                            <Image source={require('../../resources/community/icon-red-close.png')} style={{width: 18, height: 18, resizeMode: 'contain',}}/>
                                        </TouchableOpacity>
                                    </Left>
                                    <Body>
                                        <TouchableOpacity onPress={() => this.handleCloseThread(this.state.showBottomSheetOptions.item,this.state.showBottomSheetOptions.index)}>
                                            <Text style={globalStyles.text}>{strings.community.bottomOptionLayer.close}</Text>
                                        </TouchableOpacity>
                                    </Body>
                                </ListItem>
                                :
                                null
                            }
                        </List>
                    </View>
                :
                    null
                }
                
            </ReactNavigation.SafeAreaView> 
        </BottomSheet>);
        
    handleRefresh = () => {
        this.setState({ isLoading:true, moreElements: true});
        this.setState( state => ({page: 0 }), () => this.loadCommunityPublications(null));
    }
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this.loadCommunityPublications(null));
        }
    };
    emptyList = ({}) => {
        if (!this.state.isLoading) {
            return (<View style={{alignItems: 'center', marginTop: 30}}>
                        <Text style={{color:'#737373'}}>{strings.community.emptyList}</Text>
                    </View>);
        } else {
            return <View></View>;
        }
    }
    redirectToView(item) {
        this.props.navigation.navigate('CommunityThread',{ item, mode:'view' });
    }
    onChangeTab(i) {
        this.state.tabActive = i;
        this.props.navigation.setParams({
            showSearch : false,
            searchText: '',
        });
        this.setState(state => ({
                showSearch: false,
                searchText: '', 
                page: 0, 
                communityData: [], 
                isLoading: false, 
                moreElements: true
            }), 
            () => this.loadCommunityPublications(null));
        
    }
    render() {
        return ( 
            <SafeAreaView style={styles.wrapper}>
                    <Tabs 
                        tabBarUnderlineStyle={styles.tabBarUnderlineStyle}
                        onChangeTab={ ( { i }) => this.onChangeTab(i)}>
                        <Tab heading={strings.community.recent}
                            tabStyle={styles.tabStyle}
                            textStyle={styles.textStyle}
                            activeTextStyle={styles.activeTextStyle}
                            activeTabStyle={styles.activeTabStyle}
                            style={{backgroundColor:'#f6f6f9'}}
                            >
                            <View >
                                <FlatList                                
                                    extraData={this.state}
                                    data={this.state.communityData}
                                    styles= {styles.container}                                
                                    keyExtractor={(item, index) => item.id+''}                        
                                    renderItem= {this.renderItem }
                                    onEndReached={() => this.handleLoadMore()}
                                    onRefresh= {() => this.handleRefresh() }
                                    refreshing = {this.state.refreshing}
                                    onEndReachedThreshold={0.5}
                                    ListEmptyComponent={this.emptyList}
                                    ListFooterComponent={this.renderFooter}
                                />
                            </View>
                        </Tab>
                        <Tab heading={strings.community.outstanding}                            
                             tabStyle={styles.tabStyle}
                             textStyle={styles.textStyle}                            
                             activeTextStyle={styles.activeTextStyle}
                             activeTabStyle={styles.activeTabStyle}
                             style={{backgroundColor:'#f6f6f9'}}
                            >
                            <View style={{marginBottom: 20}}>
                                <FlatList
                                    extraData={this.state}
                                    data={this.state.communityData}
                                    styles= {styles.container}          
                                    refreshing = {this.state.refreshing}                                                            
                                    keyExtractor={(item, index) => item.id+''}                        
                                    renderItem= { this.renderItem }
                                    onEndReached={() => this.handleLoadMore()}
                                    onRefresh= {() => this.handleRefresh() }
                                    onEndReachedThreshold={0.5}
                                    ListEmptyComponent={this.emptyList}
                                    ListFooterComponent={this.renderFooter}
                                />
                            </View>
                        </Tab>
                    </Tabs>   
                    <View style={{position: 'absolute', flex: 1, justifyContent: 'flex-end', right: 25, bottom:20, alignItems:'center'}}>
                        <TouchableOpacity onPress={() => this.props.navigation.navigate("CommunityThreadForm") } style={{ justifyContent: 'center', alignItems:'center'}}>
                            <View style={{backgroundColor:"#2CA06C", width:50, height:50, borderRadius:50,}}>
                                <Image source={require('../../resources/global/icon-pencil.png')} style={{ width:25, height:25, resizeMode:'contain', justifyContent:'center', alignSelf:'center', flex:1}}/>
                            </View>
                        </TouchableOpacity>
                    </View>

                { this.bottomSheetOptions() }
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({    
    container: {
        flex:1,
    },
    centerContent:{
        flex: 1, 
        justifyContent: 'center', 
        alignContent: 'center', 
        alignItems:'center',
    },
    title:{
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    tabBarUnderlineStyle:{
        backgroundColor: '#2CA06C', 
    },
    tabStyle:{
        backgroundColor: '#fff',
    },
    textStyle:{
        color:'#737373',
        fontSize: 14,
        fontWeight: '400',
    },
    activeTextStyle:{
        color:'#2CA06C',
        fontSize: 14,
        fontWeight: '400',
    },
    activeTabStyle:{ 
        backgroundColor: '#fff',
    },
    wrapper: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    card:{
        marginHorizontal: 20,
    },
    userName:{
        color: '#2CA06C', 
        fontSize: 12,
        fontWeight: '700',
    },
    publishDate:{
        color: '#5b5b5b',
        fontSize: 10,
        fontWeight: '400',
    },
    tagsLabel:{
        color: "#737373",
        fontWeight: '500',
        fontSize: 10,        
    },
    tagsText:{
        color: "#9B9B9B",
        fontWeight: '500',
        fontSize: 10,        
    },
    tagContainer:{
        backgroundColor: "#EDEDED",
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginHorizontal: 5,
    },  
    message:{
        color: "#4a4a4a",
        fontWeight: '300',
        fontSize: 13,
        lineHeight:20
    },
    counter:{
        color: "#757575",
        fontWeight: '500',
        fontSize: 12,
        marginLeft: 10,
        paddingTop: 3,
    },
    block: {
        backgroundColor:'#fff',
    },
    blockCloseButton: {
        marginTop:10,
        alignSelf:'flex-end',
        marginHorizontal:20,
        width: 20,
        height: 20
    },
    blockIcon:{
        fontSize:19, 
        color:"#999"
    },
    loader:{
        marginTop: 20,
        alignItems: 'center'
    },
    userPictureBorder: {
        borderColor:'#f7f7f7',
        borderWidth: 1
    },
    imageProfile: {
        width:50,
        borderRadius: 50 / 2,
        height: 50,
    },
});
 
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        user: state.user,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Community);