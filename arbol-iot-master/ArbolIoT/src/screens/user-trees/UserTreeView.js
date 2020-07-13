import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import { Col, Row } from "react-native-easy-grid";
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    Platform
} from 'react-native';
import { Button, Card, Badge, CardItem, Left, Body, Icon } from 'native-base';
import strings from '../../config/languages';
import * as Progress from 'react-native-progress';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import ImagePicker from 'react-native-image-picker';
import AdoptionService from '../../services/adoptions';
import CommunityService from '../../services/community';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import Loader from '../../components/loader/Loader';
import GamificationAlert from '../../components/awesome-alert/GamificationAlert';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';
import Orientation from 'react-native-orientation';
import ImageResizer from 'react-native-image-resizer';
import RNFetchBlob from 'rn-fetch-blob';

class UserTreeView extends Component {  
    static navigationOptions = ({ navigation}) => ({
        title: strings.userTrees.userTreeView.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        this.state = {
            backFunc: () => {},
            gamificationAlertGeneralText: '',
            eventResponseVM: {},
            showErrorAlert: false,
            alertErrorText: '',
            showSuccessAlert: false,
            alertSuccessText: '',
            showSuccessWaterAlert: false,
            showTreeStatusAlert: false,
            showFaceAlert: false,
            faceAlertCustomView: <View></View>,
            faceAlertShowConfirmButton: true,
            item: {},
            photo: {}, 
            daysRemainingForSeasonChange: 0, 
            waterPercent: 0,
            waterDays: 0,
            percentRemainingForSeasonChange: 0,
            treeCarePercent: 0,            
            photos: [],
            perms: {
                treePhotoUpdate: {
                    interact: { status:true }
                },
                treeWatering: {
                    interact: { status:true }
                },
            }      
        }  
        this.state.item =  navigation.getParam('item', null); 
        this.permsMaping();
    }
    permsMaping() {
        this.state.perms.treePhotoUpdate.interact = GeneralHelpers.hasPermission('treePhotoUpdate','interact').remote == true ?
          GeneralHelpers.hasPermission('treePhotoUpdate','interact') :
          this.state.perms.treePhotoUpdate.interact;
        this.state.perms.treeWatering.interact = GeneralHelpers.hasPermission('treeWatering','interact').remote == true ?
          GeneralHelpers.hasPermission('treeWatering','interact') :
          this.state.perms.treeWatering.interact;
    } 
    componentDidMount(){
        Orientation.lockToPortrait();
        if(this.state.item){            
            this.calculateIndicators();
            this.mapTreeGalery();
        }
    }
    calculateIndicators( ){
        if(this.state.item.status != undefined){
            data= this.state.item.status;
            let total = 0;
            let dif = 0;
            let percent= 0;
            total = data.treeWateringPassedDays + data.treeWateringRemainingDays;
            dif= data.treeWateringRemainingDays - data.treeWateringPassedDays;
            percent = (((100 / total) * dif) / 100);
            this.setState({
                waterPercent: percent.toFixed(2),
                waterDays: dif,
                treeCarePercent: 0.90,
            }); 
            let p1 = percent > 0 ? percent : 0;
            var maxSupportDays = 10;
            total = data.photoUpdatePassedDays + data.photoUpdateRemainingDays;
            dif= data.photoUpdateRemainingDays - data.photoUpdatePassedDays;
            if (dif > 0) {
                percent = 1.0;
            } else {
                percent = ((100 / maxSupportDays) * Math.abs(dif)) / 100;
            }
            let p2 = percent > 0 ? percent : 0;
            this.setState({
                percentRemainingForSeasonChange: percent.toFixed(2),
                daysRemainingForSeasonChange: data.photoUpdateRemainingDays,
                currentSupportDays: maxSupportDays - Math.abs(data.photoUpdateRemainingDays),
                treeCarePercent: ( p1 + p2 ) / 2
            });
        }
    }
    mapTreeGalery(){
        let galery=[];
        if(this.state.item.tree.images.length > 0){
            let images = this.state.item.tree.images;
            this.setState({
                photo: images[0]
            })
            for(x = 0; x < 4; x++){
                if( images[x] != null){
                    galery.push(images[x]);
                }
            }
        }
        this.setState({
            photos: galery
        })
    }
    uploadPhoto(){
        this.setState({isLoading:true});
        if (this.state.perms.treePhotoUpdate.interact.status == false) {
            this.setState({ isLoading:false, 
                            showErrorAlert:true,
                            alertErrorText: this.state.perms.treePhotoUpdate.interact.desc });
            return;
        }
        const options = {
            title: strings.imagePicker.changePhoto,
            cancelButtonTitle: strings.imagePicker.cancelPhoto,
            takePhotoButtonTitle: strings.imagePicker.camera,
            chooseFromLibraryButtonTitle: strings.imagePicker.library,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        ImagePicker.showImagePicker(options, (response) => {        
            if (response.didCancel) {
                this.setState({isLoading:false});
            } else if (response.error) {
                this.setState({isLoading:false});
            } else {
                ImageResizer.createResizedImage(response.uri, 1000, 700, 'JPEG', 80)
                .then(({ uri }) => {
                    let filePath = uri;
                    let fileName = GeneralHelpers.getUUID() + ".jpg";
                    let fileType = "image/jpeg";
                    if (Platform.OS === 'ios') {
                        let arr = uri.split('/')
                        const dirs = RNFetchBlob.fs.dirs
                        filePath = `${dirs.CacheDir}/${arr[arr.length - 1]}`
                    } 
                    RNFetchBlob.fs.readFile(filePath, 'base64')
                    .then((data) => {
                        if(this.state.item.tree.id > 0) {
                            AdoptionService.treeUpdatePhoto(this.state.item.tree.id, fileName, data, fileType)
                                .then(this.uploadPhotoResponse)
                            .catch(this.uploadPhotoResponseError);
                        } else { 
                            this.setState({isLoading:false});
                        }
                    });
                })
                .catch(err => {
                    this.setState({isLoading:false});
                });
            }
        });
    }
    uploadPhotoResponse = (resp) => {
        var prevImageId = null;
        if (this.state.photo != undefined && this.state.photo.id != undefined) {
            prevImageId = this.state.photo.id;
        } 
        if (resp.data != null ) {
            var res = JSON.parse(resp.data);
            var eventResponse = res;
            if (res.message != undefined) {
                this.setState({ 
                    isLoading:false, 
                    alertErrorText: strings.imagePicker.error,
                    showErrorAlert:true});
                return;
            }
            if (this.state.item.tree.images == undefined) {
                this.state.item.tree.images = [];
            } 
            if (this.state.item.tree.id > 0) {
                res = res.original.tree.images[0];
            }
            if (prevImageId != res.id) {
                this.state.item.tree.images.unshift(res);
                if (eventResponse.alter == true) {
                    this.setState({ 
                        close: false,
                        backFunc: () => {},
                        gamificationAlertGeneralText: strings.imagePicker.upload,
                        eventResponseVM:eventResponse});
                } else{
                    this.setState({ 
                        isLoading:false, 
                        showSuccessAlert:true,
                        alertSuccessText: strings.imagePicker.upload });
                }
            } else {
                this.state.item.tree.images[0] = res;
                if (eventResponse.alter == true) {
                    this.setState({ 
                        close: false,
                        backFunc: () => {},
                        gamificationAlertGeneralText: strings.imagePicker.update,
                        eventResponseVM:eventResponse});
                } else{
                    this.setState({ isLoading:false, 
                        showSuccessAlert:true,
                        alertSuccessText: strings.imagePicker.update });
                }
                this.mapTreeGalery();

            }
            this.setState({item: eventResponse.original});
            setTimeout(() => { 
                this.calculateIndicators();
                this.setState({isLoading:false});
            },10);
            this.setState({photo:res});
        } 
        this.setState({isLoading:false});
    }
    uploadPhotoResponseError = (err) => {
        this.setState({ 
            isLoading:false, 
            alertErrorText: strings.imagePicker.error,
            showErrorAlert:true});
    }
    treeWatering(){
        this.setState({isLoading:true});
        if (this.state.perms.treeWatering.interact.status == false) {
            this.setState({ isLoading:false, 
                showErrorAlert:true,
                alertErrorText: this.state.perms.treeWatering.interact.desc });
            return;
        }
        AdoptionService.treeWatering(this.state.item.tree.id)
        .then((res) => res.json())
        .then(res =>{
            if(res.status == 200){
                this.setState({
                    item: res.original
                })
                if (res.alter == true) {
                    this.setState({ 
                        close: true,
                        backFunc: () => {
                            this.setState({ 
                                isLoading:false, 
                                showTreeStatusAlert:true });                            
                            setTimeout(() => { 
                                this.calculateIndicators();
                                this.setState({isLoading:false});
                            },10);
                        },
                        gamificationAlertGeneralText: strings.userTrees.userTreeView.treeWatered,
                        eventResponseVM:res}); 
                } else{
                    this.setState({ isLoading:false, 
                                    showSuccessWaterAlert:true });
                    setTimeout(() => { 
                        this.calculateIndicators();
                        this.setState({isLoading:false});
                    },10);
                }
            }            
        })
        .catch((err) =>{ 
            this.setState({isLoading:false});
        });        
    }

    renderItem = ({ item, key }) => {
        if (item.empty === true) {
          return <View key={item.key} style={[styles.item, styles.itemInvisible]} />;
        }
        return (
            <View key={item.id} style={styles.item}>
                <View >
                    <View > 
                        <Image source={item.photo}  style={styles.photoSeason}/>
                    </View>
                </View>
            </View>
        );
    };
    launchFaceAlert(face){    
        var condition ='';   
        switch(face) {
            case 'happy':
                condition = 'good';
            break;
            case 'regular':
                condition = 'regular';
            break;  
            case 'sad':
                condition = 'bad';
                break;      
            default: 
                condition = 'n-a';
        }         
        var realteEntity = {
            bucketName: "tree-module",
            objectName: "status",
            payload: condition,
            relatedEntityId: this.state.item.tree.id
        }
        CommunityService.createEntityRelatedData(
            realteEntity
        )
        .then((res)=> {
            if(res.status == 200 || res.status == 201){
                this.setState({showTreeStatusAlert:false});
                setTimeout(() => {  this.alertFace(face); },100);                    
            }
        }).catch((e) => {
        });
    }
    alertFace(face){       
        this.state.faceAlertCustomView = "";
        switch(face) {
            case 'happy':
                this.state.faceAlertCustomView = ( <View>
                    <Button onPress={ () => this.setState({showFaceAlert:false}) } 
                        style={{padding: 0, backgroundColor: 'transparent', elevation: 0, borderColor: '#f3f3f5'}}>
                        <Icon name="ios-close" style={{ fontSize:24, color:'#737373'}}/>
                    </Button>
                    <Image source={require('../../resources/user-trees/icon-face-happy.png')} style={ globalStyles.alertImg}/> 
                    <Text style={[globalStyles.alertText,{maxWidth:200}]}> {strings.userTrees.userTreeView.messageTank } </Text>            
                </View>);
                this.setState({
                    faceAlertShowConfirmButton: true,
                    showFaceAlert: true
                });
            break;
            case 'regular':
                 this.state.faceAlertCustomView =  ( <View>
                        <Button onPress={ () => this.setState({showFaceAlert:false}) } 
                            style={{padding: 0, backgroundColor: 'transparent', elevation: 0, borderColor: '#f3f3f5'}}>
                            <Icon name="ios-close" style={{ fontSize:24, color:'#737373'}}/>
                        </Button>
                        <Image source={require('../../resources/user-trees/icon-face-regular.png')} style={ globalStyles.alertImg}/> 
                        <Text style={[globalStyles.alertText,{maxWidth:200}]}>  {strings.userTrees.userTreeView.messageTank } </Text>            
                    </View>
                );
                this.setState({
                    faceAlertShowConfirmButton: true,
                    showFaceAlert: true
                });
            break;  
            case 'sad':
                this.state.faceAlertCustomView =  ( <View>
                    <Button onPress={ () => this.setState({showFaceAlert:false}) } 
                        style={{padding: 0, backgroundColor: 'transparent', elevation: 0, borderColor: '#f3f3f5'}}>
                        <Icon name="ios-close" style={{ fontSize:24, color:'#737373'}}/>
                    </Button>
                    <Image source={require('../../resources/user-trees/icon-face-sad.png')} style={ globalStyles.alertImg }/> 
                    <Text style={[globalStyles.alertText,{maxWidth:200, marginBottom:20}]}>  {strings.userTrees.userTreeView.messageReport } </Text>
                    <Button block success style={ styles.faceButton } onPress={() => {
                        this.setState({showFaceAlert: false});
                        setTimeout(()=>{
                            this.props.navigation.navigate('ReportForm'); 
                        },1000);
                    }}>
                        <Text style= { styles.detailCard }>{ strings.userTrees.userTreeView.report }</Text>
                    </Button>         
                </View>);
                this.setState({
                    faceAlertShowConfirmButton: false,
                    showFaceAlert: true
                });
                break;      
            default: 
                condition = 'n-a';
        }   

    }
    render() {
        return ( 
            <SafeAreaView> 
                <ScrollView>                    
                    <View>
                        <Card style= {styles.cardNoMargin}>
                            <CardItem >
                                <Left>
                                    { this.state.item.tree.images != undefined &&
                                        this.state.item.tree.images.length > 0 && 
                                        this.state.item.tree.images[0].id != undefined ?
                                        <ImageWithAuth 
                                        resizeMode="cover" 
                                        style={ [ globalStyles.imageRound85x ] }
                                        source={{ uri: constants.base + this.state.photo.uri + "?last=" + this.state.photo.lastModifiedDate }} />
                                        :
                                        <Image source={require('../../resources/global/default-tree-img.png')}  style={ [ {marginLeft:10}, globalStyles.imageRound85x ]}/>
                                    }
                                    <Body>
                                        {   this.state.item.tree.specie &&
                                            <Text style={[ globalStyles.text, styles.specieName ]}>                                                
                                                {this.state.item.tree.specie.commonName}
                                            </Text>
                                        }
                                        {   this.state.item.tree.specie &&
                                            <Text style={[ globalStyles.text, styles.specieCommon ]}>                                                 
                                                {this.state.item.tree.specie.genus}
                                            </Text>
                                        } 
                                        {   this.state.item.readableDate != null &&
                                            <Text style={[ globalStyles.text, styles.datePlanted ]}>{[strings.userTrees.userTreeView.dateCare, this.state.item.readableDate]} </Text>
                                        }                                            
                                        <Badge style={[ globalStyles.badgeSuccess ]}>
                                            <Text style={ globalStyles.badgeText }> {strings.userTrees.userTreesList.type} </Text>
                                        </Badge>
                                    </Body>
                                </Left>
                            </CardItem>
                        </Card>
                        <View style={styles.content}>
                            <View style={styles.indicatorsSection}>
                                <View style={styles.indicatorItem}>
                                    <Row>
                                        <Col size={65} style={{ marginRight:20}}>
                                            <View style={{marginBottom: 5,}}>
                                                <Row >
                                                    <Col>
                                                        <Text style={[{textAlign: 'left'}, globalStyles.text, {fontWeight:'500'}]}>{strings.userTrees.userTreeView.water}</Text>
                                                    </Col>
                                                    <Col>
                                                        <Text style={[{textAlign: 'right', right: 30,}, globalStyles.text, {fontWeight:'500'}]}>{
                                                            this.state.waterPercent > 0 ? (parseFloat(this.state.waterPercent) * 100).toFixed(0) + '%' : '0%'}
                                                        </Text>
                                                    </Col>
                                                </Row>
                                            </View>
                                            <Progress.Bar progress={parseFloat(this.state.waterPercent)} width={null}  height={13} 
                                                color={"#4AC3E2"} borderColor={'#4AC3E2'} 
                                                borderWidth={0.1} unfilledColor={'#D8D8D8'} borderRadius={50} />
                                            <Text style={[ globalStyles.text , {  marginTop:10, fontSize:13 }]}>
                                                {
                                                    this.state.waterPercent == 1.0 ? strings.userTrees.userTreeView.waterMsg1.replace("{d}",this.state.waterDays) :
                                                        this.state.waterPercent < 1.0 && this.state.waterPercent > 0.0 ? strings.userTrees.userTreeView.waterMsg2.replace("{d}",this.state.waterDays) :
                                                        strings.userTrees.userTreeView.waterMsg3
                                                }
                                            </Text>
                                        </Col>
                                        <Col size={35}>
                                            <TouchableOpacity  disabled={this.state.waterPercent == 1.0} onPress={ () => this.treeWatering()}>
                                                    <Card style={[this.state.waterPercent == 1.0 ? { opacity:0.5}:{}, {alignContent:'center', width:'100%'}]} >
                                                        <CardItem style={{alignContent:'center', justifyContent:'center', flexDirection:'row'}}>
                                                            <Image source={require('../../resources/user-trees/icon-water-r.png')} style={ [styles.icon]}/>
                                                            <Text style={{fontSize: 12, marginLeft:5, color: '#7f7f7f',}}>{strings.userTrees.userTreeView.drop}</Text>
                                                        </CardItem>
                                                    </Card>
                                            </TouchableOpacity>
                                        </Col>
                                    </Row>
                                </View>
                                <View style={styles.indicatorItem}>
                                    <Row>
                                        <Col size={65} style={{ marginRight:20}}>
                                            <View  style={{marginBottom: 5,}}>
                                                <Row>
                                                    <Col><Text style={[{textAlign: 'left'}, globalStyles.text, {fontWeight:'500'}]}>{strings.userTrees.userTreeView.photoSeason}</Text></Col>
                                                </Row>
                                            </View>
                                            <Progress.Bar progress={parseFloat(this.state.percentRemainingForSeasonChange)}  width={null}  height={13} 
                                                color={"#F7AE55"} borderColor={'#F7AE55'} 
                                                borderWidth={0.1} unfilledColor={'#d8d8d8'} borderRadius={50} />
                                            <Text style={[ globalStyles.text , {  marginTop:10, fontSize:13 }]}>
                                                {
                                                    this.state.daysRemainingForSeasonChange > 0 ? strings.userTrees.userTreeView.changeSeason1.replace("{d}", this.state.daysRemainingForSeasonChange):
                                                        this.state.currentSupportDays > 0 ? strings.userTrees.userTreeView.changeSeason2.replace("{d}",  this.state.currentSupportDays):
                                                        strings.userTrees.userTreeView.changeSeason3 
                                                }
                                            </Text>
                                        </Col>
                                        <Col size={35}>
                                            <TouchableOpacity 
                                                disabled={ ( this.state.daysRemainingForSeasonChange > 0)  }
                                                onPress={ () => { this.uploadPhoto() }}>
                                                <Card  style={[  this.state.daysRemainingForSeasonChange > 0 ? { opacity:0.5}:{}, {alignContent:'center', width:'100%'}]} >
                                                    <CardItem style={{alignContent:'center', justifyContent:'center', flexDirection:'row'}}>
                                                        <Image  source={require('../../resources/global/icon-update.png')} style={styles.icon} />
                                                        <Text style={{fontSize: 12,marginLeft:5, color: '#7f7f7f',}}>{strings.userTrees.userTreeView.updatePhoto}</Text>
                                                    </CardItem>
                                                </Card>                                                                                                
                                            </TouchableOpacity>
                                        </Col>
                                    </Row>
                                </View>
                                <View style={styles.indicatorItem}>
                                    <Row>
                                        <Col size={30}>
                                            <Image source={require('../../resources/global/icon-tree.png')} style={[styles.iconTree, { alignSelf:'center'}]}/>
                                        </Col>
                                        <Col size={70} style={{ justifyContent:'center'}}>                            
                                                <View style={{marginBottom: 5,}}>
                                                    <Row>
                                                        <Col><Text style={[{textAlign: 'left'}, globalStyles.text, {fontWeight:'500'}]}>{strings.userTrees.userTreeView.treeCare}</Text></Col>
                                                        <Col><Text style={[{textAlign: 'right'}, globalStyles.text, {fontWeight:'500'}]}>{(parseFloat(this.state.treeCarePercent) * 100).toFixed(0)} %</Text></Col>
                                                    </Row>
                                                </View>
                                                <Progress.Bar progress={parseFloat(this.state.treeCarePercent)} width={null}  height={13} 
                                                    color={"#EA585E"} borderColor={'#EA585E'} 
                                                    borderWidth={0.1} unfilledColor={'#d8d8d8'} borderRadius={50} />
                                                { this.state.treeCarePercent > 0.60 &&
                                                    <Text style={[ globalStyles.text , {  marginTop:10, fontSize:13 }]}>{strings.userTrees.userTreeView.messageTreeCareGood} </Text>  
                                                }                         
                                        </Col>
                                    </Row>
                                </View>
                            </View>
                        </View>
                        <View style={[{backgroundColor: '#41B07C'}, styles.sectionStyle]} >
                            <Text style={styles.sectionTitle}> {strings.userTrees.userTreeView.photoSeason} </Text>
                        </View>
                        <View style={[styles.row , { alignSelf:'center', textAlign:'center', justifyContent:'center'}]}>
                            { this.state.item.tree.images != undefined &&
                                this.state.item.tree.images.length > 0 &&
                                this.state.item.tree.images[0].id != undefined ?
                                    <View style={{ width:'100%'}}>
                                        <FlatList
                                            style={{ alignSelf:'center', textAlign:'center'}}
                                            data={ this.state.photos }
                                            numColumns= {2}
                                            keyExtractor={ (item, index) => item.id }
                                            renderItem= {({ item, key }) => {
                                                if (item.empty === true) {
                                                return <View key={key}/>;
                                                }
                                                return (
                                                    <View style={[globalStyles.imageSquare]}>
                                                        <ImageWithAuth  
                                                            style={{ flex: 1}} 
                                                            source={{ uri: constants.base + item.uri + "?last=" + item.lastModifiedDate }} />
                                                    </View>
                                                );
                                            }}
                                        />                                        
                                    </View>
                                :
                                <TouchableOpacity>
                                    <Image
                                        style={{ height:80, width:80, alignSelf:'center', marginTop:20}}
                                        resizeMode="contain"
                                        source={ require('../../resources/global/icon-photo-add.png')}
                                    />
                                    <Text style={styles.photoChangeText}>{ strings.userTrees.userTreeView.whPhotos}</Text>
                                </TouchableOpacity>
                            }           
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button block success style={ styles.detailCardButton } onPress={() => this.props.navigation.navigate('TreeViewDetail',{ id: 'tree.' + this.state.item.tree.id })}>
                                <Text style= { styles.detailCard }>{ strings.userTrees.userTreeView.detail }</Text>
                            </Button>
                            <Button block transparent style={[ styles.button, { marginTop:20} ]} onPress={() => this.props.navigation.navigate('ReportForm')}>
                                <Text style= {{ color:'#EA585E', fontWeight: '500', fontSize: 14 }}>{ strings.userTrees.userTreeView.report }</Text>
                            </Button>
                        </View>
                    </View>
                </ScrollView>  
                { /* Error alert */}
                <AwesomeAlertPlus
                    show={ this.state.showErrorAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { this.setState({showErrorAlert:false})}}
                    onDismiss={ () => { this.setState({showErrorAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertTitle}> { strings.alertSorry } </Text>       
                                        <Text style={globalStyles.alertText}> { this.state.alertErrorText }  </Text>
                                    </View> 
                                    }
                />    
                { /* Success alert */}
                <AwesomeAlertPlus
                    show={ this.state.showSuccessAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { this.setState({showSuccessAlert:false})}}
                    onDismiss={ () => { this.setState({showSuccessAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-check.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertText}> { this.state.alertSuccessText }  </Text>
                                    </View> 
                                    }
                />   
                 { /* Alert watered */}
                 <AwesomeAlertPlus
                    show={ this.state.showSuccessWaterAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showSuccessWaterAlert:false});                          
                        setTimeout(() => { 
                            this.setState({ 
                                isLoading:false, 
                                showTreeStatusAlert:true });  
                            this.calculateIndicators();
                            this.setState({isLoading:false});
                        },100);
                    }}
                    onDismiss={ () => { this.setState({showSuccessWaterAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/user-trees/icon-reg.png')} style={ globalStyles.alertImg}/> 
                                        <Text style={globalStyles.alertText}> { strings.userTrees.userTreeView.treeWatered }  </Text>
                                    </View> 
                                    }
                ></AwesomeAlertPlus>
                 { /* Alert tree status */}
                 <AwesomeAlertPlus
                    show={ this.state.showTreeStatusAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    onDismiss={ () => { this.setState({showTreeStatusAlert:false})}}
                    customView = { <View style={globalStyles.alertContainer}>                                                                                
                                        <Image source={require('../../resources/global/icon-tree.png')} style={ globalStyles.alertImg}/> 
                                        <Text style={ globalStyles.alertTitle }> {strings.userTrees.userTreeView.treeCondition } </Text>
                                        <Text style={ globalStyles.alertText }> {strings.userTrees.userTreeView.question } </Text>
                                        <View style={ styles.faceOptionContainer } >                                
                                            <TouchableOpacity onPress={ () => {this.launchFaceAlert('happy')}}>
                                                <Image source={require('../../resources/user-trees/icon-face-happy.png')} style={ styles.alertFace} />
                                            </TouchableOpacity>
                                            <TouchableOpacity  onPress={ () => {this.launchFaceAlert('regular')}}>
                                                <Image source={require('../../resources/user-trees/icon-face-regular.png')} style={ styles.alertFace }/>
                                            </TouchableOpacity>
                                            <TouchableOpacity  onPress={ () => {this.launchFaceAlert('sad')}}>
                                                <Image source={require('../../resources/user-trees/icon-face-sad.png')} style={ styles.alertFace }/>
                                            </TouchableOpacity>                    
                                        </View>
                                        <View>
                                            <Button onPress={ () => this.launchFaceAlert('Dont know') } 
                                                style={{ backgroundColor: '#fff', borderColor: '#2CA06C', borderWidth: 1,borderRadius:5, marginVertical:25, justifyContent: 'center', alignSelf:'center'}}>
                                                <Text style={{color:'#2CA06C', fontSize:14, fontWeight: '500', paddingHorizontal: 30, textAlign:'center'}}>{strings.userTrees.userTreeView.dontSee}</Text>
                                            </Button> 
                                        </View>
                                    </View>  
                                }
                ></AwesomeAlertPlus>
                { /* Face alert */}
                <AwesomeAlertPlus
                    show={ this.state.showFaceAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={this.state.faceAlertShowConfirmButton}
                    onConfirmPressed={ () => { this.setState({showFaceAlert:false})}}
                    onDismiss={ () => { this.setState({showFaceAlert:false})}}
                    customView = { this.state.faceAlertCustomView }
                />   
                 { /* Gamification alert */}
                <GamificationAlert 
                    close = {true}
                    backFunc = { this.state.backFunc }
                    generalText = { this.state.gamificationAlertGeneralText }
                    eventResponseVM ={ this.state.eventResponseVM } /> 
                { this.state.isLoading && <Loader></Loader> }
            </SafeAreaView>
        )   
    }
}

const styles = StyleSheet.create({
    content:{
        marginHorizontal: 30,
    },
    cardNoMargin: {
        marginTop:0, 
        marginLeft:0, 
        marginRight:0, 
        marginBottom: 0,
        paddingTop: 15,
        paddingBottom: 15,
    },
    specieName: {
        color: '#696767', 
        fontSize: 16,  
        fontWeight: '500',
        marginBottom: 5,
        lineHeight:15
    },
    specieCommon: {
        color: '#757575', 
        fontSize: 12,  
        fontWeight: '400',
        lineHeight:12
    },
    datePlanted:{
        color: '#2ca06c', 
        fontSize: 12,  
        fontWeight: '500',
        marginBottom: 3,
        lineHeight:25
    },
    indicatorItem:{
        marginBottom: 20,
    },
    sectionStyle: {
        alignItems: 'center', 
        paddingTop: 10, 
        paddingBottom: 10,
        marginBottom: 30, 
    },
    sectionTitle:{
        fontSize: 16,
        fontWeight: '400',
        color:'#fff'
    },
    indicatorsSection:{ 
        marginTop: 25,
        marginBottom: 25,       
    },
    icon:{
        height:20,
        width: 19,
        marginRight:2,
        resizeMode:'contain',
    },
    iconTree:{
        width: 44, 
        height: 64,
        marginRight:20,
        marginTop:10
    },  
    buttonContainer: {
        marginLeft: 60,
        marginRight: 60,
        marginTop: 40,
        marginBottom: 20,
    },
    detailCardButton: {
        backgroundColor:'#41B17C', 
        borderRadius: 5,
    },
    button: {
        fontWeight:'bold',
        color: 'white',
        borderRadius: 5,
        marginTop: 5,
    },
    detailCard: {
        fontWeight:'bold',
        color: 'white',
    },
    item: {
        flex: 1,
        margin: 10,
      },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    photoSeason:{        
        marginBottom: 4,
        width: 80,
        height: 120,
        alignSelf: 'center',
    },
    alertFace:{
        height: 40,
        width: 40,
        alignSelf: 'center',
        marginLeft: 5,
        marginRight: 5,
    },
    faceOptionContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignSelf: 'center',
    },
    photoChangeText:{
        marginTop: 15, 
        marginBottom: 15,
        alignSelf: 'center',
        textAlign: 'center',
        color:'#737373',
        lineHeight: 25
    },
    faceButton:{
        backgroundColor: '#EA585E',
        borderRadius: 5, 
        alignSelf: 'center',
        paddingHorizontal: 40, 
        marginBottom: 40,
    },
});
 
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token,
        param: state.param,
        loggedInStatus: state.loggedInStatus,
        seasonSupportDays: state.config.application.dynamic.userTrees.seasonSupportDays,
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}


export default connect(mapStateToProps, mapDispatchToProps)(UserTreeView);