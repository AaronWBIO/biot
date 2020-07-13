import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Image,
    FlatList
} from 'react-native';
import { Card, CardItem, Body, Icon, Button } from "native-base";
import strings from '../../config/languages';
import { Col, Row, } from "react-native-easy-grid";
import {AsyncStorage} from 'react-native';
import TreeService from '../../services/tree';
import RNFetchBlob from 'rn-fetch-blob';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';

class TreeOfflineDetail extends Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title:params.title || 'Detalles', 
            headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
                            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                        </TouchableOpacity>,        
            headerRight: (<View />),
            headerTintColor: colors.white,
            headerStyle: globalStyles.headerStyle,
            headerTitleStyle: globalStyles.headerTitleStyle,
        }
    };
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        this.state = {
            isLoading: false,
            data: null,
            dataToSync: [],
            isFinished: false,
            synchronized: 0,
            isSync: false,
            stop: false,
            logs: [],
            alert: { show: false, wrapper:false, continueLabel:'Intentar nuevamente', view: <View/>, onConfirmPressed:null, onCancelPressed: null, cancelText:'Cancelar'},
        }
        this.state.item = navigation.getParam('item');  
    }
    async componentDidMount() {
        this.props.navigation.setParams({
            title: this.state.item.name, 
        });   
        this.loadLocalData();
    }
    async loadLocalData() {
        var data = await AsyncStorage.getItem('localBoundariesId'+ this.state.item.id); 
        if (data != null) {
            this.state.data = JSON.parse(data);
        }
        if (this.state.data != undefined && this.state.data.trees != undefined) {
            if (this.state.data.logs == undefined) {
                this.state.data.logs = [];
            }
            for (var tid in this.state.data.trees) {
                if (this.state.data.trees[tid]['synchronized'] != undefined && this.state.data.trees[tid]['synchronized'] == true) {
                    this.state.synchronized += 1;
                }
                if (this.state.item.modifications != undefined && 
                    this.state.item.modifications[tid] != undefined && 
                    ( this.state.data.trees[tid]['synchronized'] == undefined ||
                        this.state.data.trees[tid]['synchronized'] == false
                    )) {
                    this.state.dataToSync.push(this.state.data.trees[tid]);
                } 
            } 
        }
        this.setState({ state: this.state });
    }


    async deleteLocalBoundary(id) {
        this.state.alert.showCancelButton = true;
        this.state.alert.onCancelPressed = () => {
            this.hideAlert();
        }
        this.state.alert.showCancelButton = true;
        this.state.alert.cancelText = "Cancelar";
        this.state.alert.view = 
            <View>
                <Button onPress={ () => this.hideAlert() } style={{ padding: 0, elevation: 0, 
                    justifyContent:'center',
                    backgroundColor:'transparent',
                    alignContent:'center',
                    width:60, height:40,
                    borderColor: '#f3f3f5'}}>
                    <Icon name="ios-close" style={{ fontSize:24, color:'#737373', alignSelf:'center'}}/>
                </Button>
                <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                <Text style={[globalStyles.alertText,{marginHorizontal:20}]}>{ strings.treeOffline.deleteText }</Text>       
            </View>
        this.state.alert.onCancelPressed = () => {  this.hideAlert(); };
        this.state.alert.onConfirmPressed = async () => {
            this.hideAlert();
            this.setState({isLoading:true});
            var localBoundaries = await AsyncStorage.getItem('localBoundaries');        
            if (localBoundaries == undefined || localBoundaries == null) 
                localBoundaries = {};  
            else 
                localBoundaries = JSON.parse(localBoundaries);
            delete localBoundaries[id];
            await AsyncStorage.setItem('localBoundaries',JSON.stringify(localBoundaries));     
            await AsyncStorage.removeItem('localBoundariesId'+id); 
            this.props.navigation.goBack();
            await RNFetchBlob.fs.unlink(RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + this.state.item.id);
            this.setState({isLoading:false});
        };
        this.showAlert();
    }
    showAlert = () => {
        this.state.alert.wrapper = true;
        this.state.alert.show = true;
        this.setState({ alert: this.state.alert });
    };
    hideAlert = () => {
        this.state.alert.show = false;
        this.setState({ alert: this.state.alert });
    };
    async toggleSync() {
        if (this.state.isSync) {
            this.state.stop = true;
        } else {
            this.state.stop = false;
        }
        this.setState({isSync:true});
        while(this.state.dataToSync.length > 0 && !this.state.stop) {
            var element = this.state.dataToSync.pop();
            if (element.id < 0) {
                var idTemp = element.id;
                element.id = null;
                var file = null;
                if (element.images != null && element.images.length > 0) {
                    var moreLocalImages = true;
                    var urlLocalImage = null;
                    while (moreLocalImages) {
                        if (element.images[0] != undefined && element.images[0] != null && element.images[0].subType != undefined && element.images[0].subType =="local") {
                            var image = element.images.shift();
                            if (urlLocalImage == null) {
                                urlLocalImage = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + this.state.item.id + "/" + image.fileName;
                                await RNFetchBlob.fs.readFile(urlLocalImage, 'base64')
                                .then((data) => {
                                    image.data = data;
                                });
                                file = image;
                            }
                        } else {
                            moreLocalImages = false;
                        }
                    }
                }
                var response = await TreeService.saveBulk(element, file);
                if (response.respInfo.status == 200 || response.respInfo.status == 201) {
                    this.state.synchronized += 1;
                    var eventResponse =  JSON.parse(response.data);
                    if (eventResponse.alter && eventResponse.points > 0) {
                        var user = eventResponse.profile;
                        if (user == undefined || user == null) 
                            user = {};
                        user.id_token = this.props.idToken;
                        this.props.updateLocalUser(user);
                    }
                    delete this.state.data.trees[idTemp];
                    this.state.data.trees[eventResponse.original.id] = eventResponse.original;
                    this.state.data.trees[eventResponse.original.id]['synchronized'] = true;
                }
                if (response.respInfo.status == 400) {
                    this.state.synchronized += 1;
                    this.state.data.trees[idTemp]['synchronized'] = true;
                    this.state.data.logs.push("Error: " + response.data + ", id temporal de árbol ("+idTemp+")");
                }
            } else {
                var file = null;
                if (element.images != null && element.images.length > 0) {
                    var moreLocalImages = true;
                    var urlLocalImage = null;
                    while (moreLocalImages) {
                        if (element.images[0] != undefined && element.images[0] != null && element.images[0].subType != undefined && element.images[0].subType =="local") {
                            var image = element.images.shift();
                            if (urlLocalImage == null) {
                                urlLocalImage = RNFetchBlob.fs.dirs.DocumentDir + "/boundary-" + this.state.item.id + "/" + image.fileName;
                                await RNFetchBlob.fs.readFile(urlLocalImage, 'base64')
                                .then((data) => {
                                    image.data = data;
                                });
                                file = image;
                            }
                        } else {
                            moreLocalImages = false;
                        }
                    }
                }
                var response = await TreeService.updateBulk(element, file);
                if (response.respInfo.status == 200 || response.respInfo.status == 201) {
                    this.state.synchronized += 1;
                    var eventResponse =  JSON.parse(response.data);
                    if (eventResponse.alter && eventResponse.points > 0) {
                        var user = eventResponse.profile;
                        if (user == undefined || user == null) 
                            user = {};
                        user.id_token = this.props.idToken;
                        this.props.updateLocalUser(user);
                    }
                    this.state.data.trees[element.id] = eventResponse.original;
                    this.state.data.trees[element.id]['synchronized'] = true;
                }
                if (response.respInfo.status == 400) {
                    this.state.synchronized += 1;
                    this.state.data.logs.push("Error: " + response.data);
                }
            }
            var r = await AsyncStorage.setItem('localBoundariesId' + this.state.item.id,JSON.stringify({ ...this.state.item  , trees: this.state.data.trees, logs: this.state.data.logs}));
            this.setState(this.state);
        }
        this.setState({isSync:false});
    }
    render(){           
        return(
            <SafeAreaView>
                <ScrollView>
                    <View style={{flex:1}}>
                        <View style={{backgroundColor: '#EA585E'}}>
                            <Text style={styles.actionsText}>{strings.treeOffline.actions}</Text>
                        </View>
                        <View style={{marginTop:15, marginHorizontal: 20,}}>
                            <Row >
                                <Col size={30} style={{justifyContent: 'center', alignItems: 'center'}}>
                                    <Image source={require('../../resources/global/icon-tree-gen.png')} style={styles.tree}/>
                                </Col>
                                <Col size={70} style={{ marginTop:10 }}>
                                    <Text style={styles.textLabel}>
                                        {strings.treeOffline.dateLabel}
                                        <Text style={styles.textBlack}> { this.state.item != undefined && this.state.item['downloadDate'] != undefined ? this.state.item['downloadDate']: '' }</Text>
                                    </Text>
                                    <Text style={[styles.textLabel, {marginTop:10}]}>
                                        {strings.treeOffline.modifications}
                                        <Text style={styles.textBlack}> { this.state.item != undefined && this.state.item['modifications']!= undefined ? Object.keys(this.state.item['modifications']).length : '' }</Text>
                                    </Text>
                                    <Text style={[styles.textLabel, {marginTop:10}]}>
                                        {strings.treeOffline.remaining}
                                        <Text style={styles.textBlack}> { this.state.dataToSync.length }</Text>
                                    </Text>
                                    <Text style={[styles.textLabel, {marginTop:10}]}>
                                        {strings.treeOffline.synchronized}
                                        <Text style={styles.textBlack}> { this.state.synchronized - ( this.state.data != null && this.state.data.logs != undefined ? this.state.data.logs.length : 0) }</Text>
                                    </Text>
                                    <Text style={[styles.textLabel, {marginTop:10}]}>
                                        {strings.treeOffline.conflicts}
                                        <Text style={styles.textBlack}> { this.state.data != null && this.state.data.logs != undefined ? this.state.data.logs.length : 0 }</Text>
                                    </Text>
                                </Col> 
                            </Row>
                        </View>
                        <View style={{marginHorizontal: 60, marginTop:20,}}>      
                            { this.state.dataToSync.length > 0 &&                          
                            <TouchableOpacity  style={[ this.state.dataToSync.length == 0 ? { opacity:0.5} : {} ]}  disabled={this.state.dataToSync.length == 0} onPress={() =>{ this.toggleSync(); }}>
                                <Card>
                                    <CardItem>                                    
                                        <Body style={{justifyContent:'center', alignItems:'center'}}>
                                            <View style={{flexDirection:'row', justifyContent: 'center', alignItems:'center'}}>
                                                <Image source={require('../../resources/global/icon-sync.png')} style={styles.syncIcon}/>                                          
                                                <Text style={{color:'#7f7f7f', fontSize: 16, fontWeight: '500'}}>
                                                    { this.state.isSync ? strings.treeOffline.pause : '' }
                                                    { !this.state.isSync && this.state.synchronized == 0 && this.state.dataToSync.length > 0 ? strings.treeOffline.sync : '' }
                                                    { !this.state.isSync && this.state.synchronized > 0 && this.state.dataToSync.length > 0 ? strings.treeOffline.continue : '' }
                                                </Text>
                                            </View>                                
                                        </Body>
                                    </CardItem>
                                </Card>
                            </TouchableOpacity>
                            }
                            <TouchableOpacity disabled={this.state.isSync} style={[ this.state.isSync ? { opacity:0.5} : {} ]}  onPress={() =>{ this.deleteLocalBoundary(this.state.item.id); }}>
                                <Card>
                                    <CardItem>                                    
                                        <Body style={{justifyContent:'center', alignItems:'center'}}>
                                            <View style={{flexDirection:'row', justifyContent: 'center', alignItems:'center'}}>
                                                <Icon name="ios-trash" style={ [styles.syncIcon, { color:'#EA585E'}] }/>
                                                <Text style={{color:'#7f7f7f', fontSize: 16, fontWeight: '500'}}>{ strings.treeOffline.delete }</Text>
                                            </View>                                
                                        </Body>
                                    </CardItem>
                                </Card>
                            </TouchableOpacity>
                        </View>
                        { ((this.state.data != undefined && this.state.data.logs != undefined && this.state.data.logs.length > 0) || (this.state.dataToSync.length == 0 && this.state.synchronized > 0 && this.state.data.logs.length > 0)) &&
                        <View>
                            <Text style={{margin:20, marginBottom:0, marginTop:40, fontSize:14, color:'#737373', fontWeight:'bold'}}>{ strings.treeOffline.conflictLog }</Text>
                            <FlatList
                                style={{ width: '100%', marginTop:10 }}
                                keyExtractor={(item, index) => index + ''}
                                data={this.state.data.logs}
                                renderItem={ ({item, key})  => 
                                    <View key={key} style={{ margin:20, marginBottom:2, paddingBottom:15,borderBottomWidth:1, borderBottomColor:'#d6d9dc'}}>
                                        <Text style={{ fontSize:12, color:'#737373', lineHeight:20}}>{item}</Text>
                                    </View> }
                            />
                        </View>
                        }
                    </View>
                </ScrollView> 
                { /* General alerts */}
                <AwesomeAlertPlus
                        show={ this.state.alert.show }
                        {  ...GeneralHelpers.alertTemplateDefault }
                        closeOnTouchOutside={true}
                        closeOnHardwareBackPress={true}
                        showCancelButton={false}
                        showConfirmButton={true}
                        onCancelPressed={ this.state.alert.onCancelPressed }
                        onConfirmPressed={ this.state.alert.onConfirmPressed }
                        customView = { this.state.alert.view }
                    /> 
            </SafeAreaView>              
        )
    }
}

const styles = StyleSheet.create({
    textBlack:{
        color:'#4a4a4a', 
        fontWeight: 'bold', 
        fontSize: 14
    },
    textLabel:{
        color:'#5b5b5b', 
        fontWeight: '400', 
        fontSize: 14,
    },
    download: {
        height: 33,
        width: 27.55,
    },
    syncButton: {
        alignSelf: 'center', 
        backgroundColor: 'white', 
        borderColor: 'grey', 
        borderWidth: 0.5, 
        marginTop: 60,
    },
    syncIcon: {
        height: 29, 
        width: 26, 
        marginRight: 30,
    },
    actionsText: {
        color: 'white', 
        textAlign: 'center', 
        paddingVertical: 15,  
        fontSize: 16,
        fontWeight: '400',
    },
    tree: {
        height: 55, 
        width: 46, 
        resizeMode:'contain',
    },
});

const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TreeOfflineDetail);