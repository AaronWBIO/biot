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
    FlatList
} from 'react-native';
import { Badge, Button, Icon } from 'native-base';
import strings from '../../config/languages';
import ReportService from '../../services/report';
import AwesomeAlertPlus from '../../components/awesome-alert/AwesomeAlertPlus';
import constants from '../../config/constants';
import ImageWithAuth from '../../components/image';
import GeneralHelpers from '../../helpers/GeneralHelpers';
import globalStyles from '../../styles/global';
import Loader from '../../components/loader/Loader';

const numColumns = 4;
const formatData = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);
    let numberOfElementsLastRow = data.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      data.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return data;
};

class ReportDetailView extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.report.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
                        <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
                    </TouchableOpacity>,           
        headerRight: <View></View>,             
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    deviceLocale = 'es';    
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        this.state = {
            showAlertRetry: false,
            reportData:[],
            isLoading:  true
        }
        this.state.id =  navigation.getParam('id', null);  
    }
    componentDidMount() {
        this.loadEntity();
    }
    exitAlert = () => {
        this.setState({showAlertRetry:false});
        this.props.navigation.goBack();
    }
    retryAlert =() => {
        this.setState({showAlertRetry:false});
        this.loadEntity()
    }
    loadEntity() {
        this.setState({isLoading:true});
        ReportService.getReport(this.state.id)
        .then((res) => res.json() )
        .then(res => {
            if(res.id != undefined){
                this.setState({
                    isLoading:false,
                    reportData: res,
                });
            } else {
                this.setState({isLoading:false});
                this.setState({showAlertRetry:true});
            }            
        }).catch((e) => {
            this.setState({isLoading:false});
            this.setState({showAlertRetry:true});
        });
    }
    renderItem = ({ item, index }) => {
        if (item.empty === true) {  
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return ( 
            <View key={item.id} style={styles.tagContainer}>
              <Text style={styles.tagsText}>{item.tag}</Text>
            </View>
        );
    }
    render() {
        const { goBack } = this.props.navigation;  
        return ( 
            <SafeAreaView> 
                <ScrollView>                    
                    <View > 
                        <View style={{backgroundColor: "#9B9B9B", height: 40, flex:1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{color: '#fff', fontSize: 16, fontWeight:'400', }}>{this.state.reportData.title}</Text>
                        </View>
                        <View style={styles.content}>
                            { this.state.reportData.image ?
                                <ImageWithAuth                                     
                                    style={{ height: 200, width: '100%', resizeMode: 'contain', marginBottom: 15,}} 
                                    source={{  uri: constants.base + this.state.reportData.image.uri }} 
                                /> :
                                <Image source={require('../../resources/global/default-tree-img.png')}  style={{ height: 200, width: '100%', resizeMode: 'contain', marginBottom: 15,}}   />
                            }
                            <View style={{ marginTop: 15, }}>
                                {   this.state.reportData.status &&
                                        this.state.reportData.status == "open" ?  
                                        <Badge style={[ globalStyles.badge, {backgroundColor:'#F7AE55', alignSelf:'center'}]}>
                                            <Text style={[globalStyles.badgeText,{paddingHorizontal:5}]}>{ strings.report.open }</Text>
                                        </Badge> 
                                        :
                                        <Badge style={[ globalStyles.badge, {backgroundColor:'#ea585e', alignSelf:'center'}]}>
                                            <Text style={[globalStyles.badgeText,{paddingHorizontal:5}]}>{ strings.report.close }</Text>
                                        </Badge>
                                }
                            </View>
                        </View>
                        <View style={{backgroundColor: "#41B07C", height: 40, flex:1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{color: '#fff', fontSize: 14, fontWeight:'400', }}>{strings.report.description}</Text>
                        </View>
                        <View style={styles.content}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Detalles:</Text>
                                <Text style={{ color:'#4a4a4a', fontSize:13 }}>{this.state.reportData.body}</Text>
                            </View>
                            { this.state.reportData.boundary && 
                                <View style={styles.field}>
                                    <Text style={styles.label}>{strings.report.boundary}:</Text>
                                    <Text style={{ color:'#4a4a4a', fontSize:13 }} >{ this.capitalize(this.state.reportData.boundary.name)}</Text>
                                </View>
                            }
                            { this.state.reportData.readableDate &&
                                <View style={styles.field}>
                                    <Text style={styles.label}>{strings.report.publishDate}:</Text>
                                    <Text style={{ color:'#4a4a4a', fontSize:13 }}>{this.state.reportData.readableDate}</Text>
                                </View>
                            }
                            { this.state.reportData.tags && this.state.reportData.tags.length > 0 &&
                                <View style={[styles.field]}>
                                    <Text style={styles.label}>{strings.report.tags}:</Text>
                                    <View style={{flexDirection: 'row', marginTop:5}}>                                    
                                        <FlatList
                                            extraData={this.state}
                                            data={formatData(this.state.reportData.tags, numColumns)}
                                            keyExtractor={(item, index) => item.id+''}
                                            styles= {styles.container}
                                            numColumns= {numColumns}
                                            renderItem= {this.renderItem}
                                        />
                                    </View>
                                </View>
                            }
                        </View>

                    </View> 
                </ScrollView>
                { /* Error alert with retry */}
                <AwesomeAlertPlus
                    show={ this.state.showAlertRetry }
                    {  ...GeneralHelpers.alertTemplateDefault }
                    showConfirmButton={false}
                    customView = {  <View style={ globalStyles.alertContainer }>
                                        <Image source={require('../../resources/global/icon-remove.png')} style={ globalStyles.alertImg}/>                             
                                        <Text style={ globalStyles.alertText }> {strings.general.error} </Text>
                                        <View style={{ marginTop: 20}}>
                                            <Button  style={[styles.retryButton,]} onPress={ () => this.retryAlert()} >
                                                <Text style={styles.next}> {strings.triviaCreateForm.retry}</Text>
                                            </Button>
                                            <Button style={styles.exitButton} onPress={ () => { this.exitAlert()} } >
                                                <Text style={styles.next}> {strings.triviaCreateForm.exit}</Text>
                                            </Button>
                                        </View>
                                    </View>
                                }
                />    
                { this.state.isLoading && <Loader></Loader>}
            </SafeAreaView>
        )   
    }
    capitalize = (s) => {
        s = s.toLowerCase();
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
    }
}
const styles = StyleSheet.create({
    content:{ 
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 30,
        marginRight: 30,
    }, 
    field:{
        marginBottom: 20,
    },
    label:{
        color: "#4a4a4a",
        fontWeight: '700',
        fontSize: 14,
        paddingBottom: 5,    
    },
    tagsText:{
        color: "#9B9B9B",
        fontWeight: '500',
        fontSize: 11,        
    },
    tagContainer:{
        backgroundColor: "#EDEDED",
        paddingVertical: 7,
        paddingHorizontal: 25, 
        marginRight: 10,
        marginBottom: 10,
    },  
    next: {
        fontWeight:'bold',
        color: 'white',
    },
    retryButton: {
        backgroundColor:'#41B07C', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%',
        textAlign:'center',
        justifyContent:'center'
    },
    exitButton: {
        backgroundColor:'#EA585E', 
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%', 
        textAlign:'center',
        justifyContent:'center'
    },
});
const mapStateToProps = (state) => {
    return {
        param: state.param,
        idToken: state.user.id_token,
        loggedInStatus: state.loggedInStatus
    }
}
const mapDispatchToProps = (dispatch) => {
    return bindActionCreators(ActionCreators,dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(ReportDetailView);