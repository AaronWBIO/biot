import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import { Icon } from 'native-base';
import Lightbox from 'react-native-lightbox';
import strings from '../../config/languages';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import TreeService from '../../services/tree';
import _ from 'lodash';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import Loader from '../../components/loader/Loader';
import globalStyles from '../../styles/global';
import GeneralHelpers from '../../helpers/GeneralHelpers';
const WINDOW_WIDTH = Dimensions.get('window').width;
const BASE_PADDING = 10;

class TreePhotos extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: 'Foto estacional',
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });   
    constructor(props) {
        super(props);
        const { navigation } = this.props;
        this.state = {
            showErrorAlert: false,
            alertErrorText: '',
            loadingImage:  false,
            treePhoto: null,
            treeEntity: null,
            treeImages: {},
            seasons: [],
            years: [],
            defaultAlertTemplate: { 
                show: false, 
                showAButton:true, 
                showCButton:false, 
                view: <View/>, 
                onCancelPressed: () => {},                                 
                onConfirmPressed: () => {
                    this.props.navigation.goBack();
                }, 
            },
        }  
        const id = navigation.getParam('id', null);
        if (id != null) {
            this.state.id =  id.replace("tree.","");
        }
        /* to drop -> */
        this.state.alert = { ...this.state.defaultAlertTemplate };
        this.state.onConfirmCloseAlertTemplate = { ...this.state.defaultAlertTemplate, onConfirmPressed: () => {
            this.setState({ alert: { ...this.state.alert.defaultAlertTemplate }})
        }};
    }
    componentDidMount() {
        this._loadEntity();
    }
    _loadEntity() {
        TreeService.get(this.state.id, false)
        .then(res => {
            if (res.id != undefined && res.id == this.state.id) {
                this.setState({treeEntity: res});
                var imagesInObject = {};
                if (res.images != undefined && res.images.length > 0) {
                    this.setState({treePhoto: res.images[0]});
                    if (this.state.treePhoto.tags != undefined && this.state.treePhoto.tags.length == 1) {
                        this.state.treePhoto.season = this.state.treePhoto.tags[0].split("-")[2];
                        this.setState({treePhoto:this.state.treePhoto});
                    }
                    for(let x=0; x <res.images.length; x++) {
                        if (res.images[x].tags != undefined && res.images[x].tags.length == 1) {
                            var components = res.images[x].tags[0].split("-");
                            if (imagesInObject[components[2]] == undefined) {
                                imagesInObject[components[2]] = {};
                                this.state.seasons.push(components[2]);
                            }
                            if (this.state.years.indexOf(components[1]) < 0) {
                                this.state.years.push(components[1]);
                            }
                            imagesInObject[components[2]][components[1]] =  res.images[x];
                        } 
                    } 
                    this.setState({treeImages: imagesInObject});
                }
            } else {
                this.setState({
                    showErrorAlert: true,
                    alertErrorText:  strings.general.error
                });
            }
        }).catch((e) => {
            this.setState({
                showErrorAlert: true,
                alertErrorText:  strings.general.error
            });
        });
    }
    render() {
        return ( 
            <SafeAreaView>
                { (this.state.treeEntity != undefined && this.state.treeEntity.id != undefined)   &&               
                <ScrollView ref='_scrollView'>    
                    { this.state.treePhoto != null &&
                    <View>
                        <View style={[{backgroundColor: '#F5A623' }, styles.sectionStyle]}>
                            { _.has(this.state.treePhoto,"season") &&  
                                <Text style={styles.sectionTitle}>{ strings.seasons[this.state.treePhoto.season] }</Text>
                            }
                        </View>
                        <View style={{ 
                            alignSelf: 'center',
                            justifyContent:'center',
                            alignItems: 'center',
                            marginBottom: 30,
                            marginTop: 30}}>
                            <ImageWithAuth  
                                style={styles.mainImage} 
                                source={{ uri: constants.base + this.state.treePhoto.uri + "?last=" + 
                                this.state.treePhoto.lastModifiedDate  }} />
                            <Text style={{ backgroundColor: '#00AE84', color:'white', justifyContent:'center', padding:10, textAlign:'center', height:40, width: WINDOW_WIDTH - 100 }}>{strings.treePhotos.currentPhoto}</Text>
                            <View style={{ width: WINDOW_WIDTH - 100, marginTop:20}}>
                            <Text style={styles.specieName}>
                            { _.has(this.state, 'treeEntity.specie.commonName') ? 
                                this.state.treeEntity.specie.commonName : strings.noSpecie
                            }
                            </Text>
                            <Text style={styles.specieCommon}>
                            { _.has(this.state, 'treeEntity.specie.genus') ? 
                                this.state.treeEntity.specie.genus : strings.noSpecie
                            }
                            </Text>
                            </View>
                        </View>
                    </View>
                    }
                    { this.state.treeImages != {} && this.state.seasons.map((season) => {
                        return(
                        <View key={season}>
                            <View style={[{backgroundColor: '#9b9b9b' }, styles.sectionStyle]}>
                                <Text style={styles.sectionTitle}>{ strings.seasons[season] }</Text>
                            </View>
                            <View style={{ flexDirection:'row' , flexWrap: 'wrap'}}>
                            {
                                this.state.years.map((year) => {
                                    if (this.state.treeImages[season][year] != undefined) {
                                        return (
                                        <View key={year} style={ styles.squareWrapper }>
                                            <ImageWithAuth  
                                                style={styles.square} 
                                                source={{ uri: constants.base + this.state.treeImages[season][year].uri + "?last=" + 
                                                this.state.treeImages[season][year].lastModifiedDate  }} />
                                            <Text style={{ color:'#696767', marginTop:10}}>{year}</Text>
                                        </View> ) 
                                    }
                                })
                            }
                            </View>
                        </View>)}
                        )
                    }
                </ScrollView>
                }
                { /* Error alert */}
                <AwesomeAlertPlus
                    show={ this.state.showErrorAlert }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    onConfirmPressed={ () => { 
                        this.setState({showErrorAlert:false});
                        this.props.navigation.goBack();
                    }}
                    onDismiss={ () => { 
                        this.setState({showErrorAlert:false});
                        this.props.navigation.goBack();
                    }}
                    customView = { <View style={globalStyles.alertContainer}>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={globalStyles.alertTitle}> { strings.alertSorry } </Text>       
                                        <Text style={globalStyles.alertText}> { this.state.alertErrorText }  </Text>
                                    </View> 
                                    }
                />  
                 { /* Loader */}
                { this.state.isLoading &&
                    <Loader></Loader>
                }
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({
    specieName: {
        color: '#696767', 
        fontSize: 16,  
        fontWeight: '500',
        marginBottom: 3,
    },
    specieCommon: {
        color: '#757575', 
        fontSize: 12,  
        fontWeight: '400',
        marginBottom: 3,
    },
    sectionStyle: {
        alignItems: 'center', 
        paddingTop: 10, 
        paddingBottom: 10
    },
    sectionTitle:{
        fontSize: 16,
        fontWeight: '400',
        color:'#fff'
    },
    input: { 
        color: '#737373', 
        fontSize: 14,
        padding: 0,
        margin: 0,
        height: 40,
        lineHeight: 17,
    },
    mainImage: {
        width: WINDOW_WIDTH - 100,
        height: WINDOW_WIDTH - 100,
        borderWidth:1,
        borderColor:'#f7f7f7',
    },
    square: {
        width: 100,
        height: 120,
        borderWidth:1,
        borderColor:'#f7f7f7',
        justifyContent: 'center',
        alignSelf: 'center',
        alignItems:'center'
    },
    squareWrapper: {
        width: WINDOW_WIDTH / 2,
        height: 140,
        justifyContent: 'center',
        alignSelf: 'center',
        alignItems:'center',
        marginBottom:20,
        marginTop:20
    },
    squareText: {
        justifyContent: 'center',
    },
    photoContainer: {
        marginTop: 20,
        justifyContent: 'center',
    }, 
});
 
const mapStateToProps = (state) => {
    return {
        idToken: state.user.id_token
    }
}

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(TreePhotos);