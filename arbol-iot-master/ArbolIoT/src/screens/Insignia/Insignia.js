import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from "redux";
import  ActionCreators  from "../../redux/actions";
import colors from '../../styles/colors';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    Image,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Icon, Badge } from 'native-base';
import strings from '../../config/languages';
import { BottomSheet } from 'react-native-btr';
import AchievementsService from '../../services/achievements';
import globalStyles from '../../styles/global';

class Insignia extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.insignia.title,
        headerLeft: <TouchableOpacity style={globalStyles.headerLeft} onPress={ () => { navigation.goBack() }}>
            <Icon name="ios-arrow-back" style={globalStyles.headerLeftIcon}/>
        </TouchableOpacity>,        
        headerRight: (<View />),
        headerTintColor: colors.white,
        headerStyle: globalStyles.headerStyle,
        headerTitleStyle: globalStyles.headerTitleStyle,
    });    
    deviceLocale = 'es';    
    constructor(props) {
        super(props)
        this.state = {            
            insgniasData: [],
            moreElements: true,
            isLoading: false,
            page: 0,            
            size: 10,
            type: "INSIGNIA",
            sort: 'weight,asc',
            showBottomSheetOptions: { visible: false, item: null, index: null},
        }  
    }
    componentDidMount(){ 
        this.loadInsignias();
    }
    loadInsignias = () =>{
        this.setState({ isLoading: true})   
        AchievementsService.getProfileAchievementsByType( this.state.type, { page: this.state.page, size: this.state.size})
        .then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                if(result.length > 0){
                    this.setState({
                        insgniasData: this.state.page === 0 ? result : [...this.state.insgniasData, ...result], 
                        isLoading: false,                     
                    });
                } else{
                    this.setState({ moreElements: false, isLoading: false });
                }
            }         
        })
        .catch((e) => {
            this.setState({ isLoading: false});
        });
    }

    showOptionsComponent(item, index) {
        let data = { visible: true, item: item, index: index}
        this.setState({ showBottomSheetOptions : data });
    }
    bottomSheetOptions = () =>         
        (<BottomSheet 
            visible={ this.state.showBottomSheetOptions.visible}
            onBackButtonPress={ () => { this.setState({ showBottomSheetOptions: {visible: false, item: null, index: null} }) }}
            onBackdropPress={ () => { this.setState({ showBottomSheetOptions: {visible: false, item: null, index: null} }) }}>
            <View style={ styles.block }>                
                <TouchableOpacity style={ styles.blockCloseButton } onPress={ (e) => { this.setState({showBottomSheetOptions: {visible: false, item: null, index: null } }) }}>
                    <Icon name="ios-close-circle" style={ styles.blockIcon }/>
                </TouchableOpacity>
                { this.state.showBottomSheetOptions.item != null ? 
                    <View>
                        { this.state.showBottomSheetOptions.item.description &&
                            <Text style={styles.blockText}>{this.state.showBottomSheetOptions.item.description}</Text>
                        }                        
                        {   this.state.showBottomSheetOptions.index != 0 ?
                                this.state.showBottomSheetOptions.item.acquired ?
                                    <Badge style={{backgroundColor:'#70B855', alignSelf: 'center', justifyContent: 'center', marginTop: 15,}}>
                                        <Text style={styles.statusText}>{strings.insignia.unlocked}</Text>
                                    </Badge>  
                                :
                                <Badge style={{backgroundColor:'#A7A7A7', alignSelf: 'center', justifyContent: 'center', marginTop: 15,}}>
                                    <Text style={styles.statusText}>{strings.insignia.locked}</Text>
                                </Badge>
                            :
                            <Badge style={{backgroundColor:'#70B855', alignSelf: 'center', justifyContent: 'center', marginTop: 15,}}>
                                <Text style={styles.statusText}>{strings.insignia.unlocked}</Text>
                            </Badge>  
                        }
                    </View> 
                :   null 
                } 
            </View> 
        </BottomSheet>);

    headerInsignias= () =>{ 
        if(this.props.user.lastInsignia){
            let lastInsignia = this.props.user.lastInsignia;
            return  (
                <View style={{marginTop:30,}}>
                    <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                        <Image source={require('../../resources/insignia/marker-right.png')} style={ {height: 30, width:46.7, resizeMode:'contain'}}/>                             
                        <Text style={[styles.labelText, {paddingTop:6}]}> {strings.insignia.lastAchievement}</Text>
                        <Image source={require('../../resources/insignia/marker-left.png')} style={ {height: 30, width:46.7, resizeMode:'contain', marginLeft: -1}}/> 
                    </View>
                    <View>
                        <TouchableOpacity onPress={() => this.showOptionsComponent(lastInsignia, 0)} style={{width:'100%'}}>
                            <View style={{marginTop:20, justifyContent: 'center', alignItems: 'center',}}>
                                {   lastInsignia.insignia &&
                                    <Image source={{uri: `data:${lastInsignia.insignia.imageContentType};base64,${lastInsignia.insignia.image}`}} style={styles.lastAchievement} />
                                }
                                {   lastInsignia.name &&
                                    <Text style={styles.lastAchievementName} > {lastInsignia.name} </Text>
                                }                                
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        } else {
            return <View></View>;
        } 
    }
    renderItem = ({ item, index }) => { 
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (            
                <View key={item.id} style={ styles.item}>
                    <TouchableOpacity onPress={() => this.showOptionsComponent(item, 1)} style={{width:'100%'}}>  
                        <View style={{justifyContent: 'center', alignItems: 'center',}}>
                            { item.insignia &&
                                item.acquired ?
                                    <Image source={{uri: `data:${item.insignia.imageContentType};base64,${item.insignia.image}`}} style={styles.insignia} />                                 
                                    :                                                                                                                                
                                    <Image source={{uri: `data:${item.insignia.imageContentType};base64,${item.insignia.image}`}} 
                                        style={[styles.insignia, { opacity: 0.3}]} />
                            }
                            { item.name &&
                                <Text style={styles.insigniaName} > {item.name} </Text>
                            }
                        </View>
                    </TouchableOpacity>
                </View>
        );
    };
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this.loadInsignias());
        }
    };
    emptyList = ({}) => {
        if (this.state.isLoading)
            return <View></View>;
        else
            return (<View style={{alignItems: 'center', marginTop: 30}}>
                        <Text>{strings.insignia.emptyList}</Text>
                    </View>);
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator color='#2CA06C' size='large' />
                    </View> : null);
    }
    render() {
        return ( 
            <SafeAreaView>                                         
                <View>
                    <FlatList
                        extraData={this.state}
                        data={this.state.insgniasData}
                        numColumns= {3}
                        styles= {styles.container}                                
                        keyExtractor={(item, index) => item.id+''}
                        ListHeaderComponent={this.headerInsignias} 
                        ListHeaderComponentStyle={{ marginBottom:15}}                       
                        renderItem= {this.renderItem }
                        onEndReached={() => this.handleLoadMore()}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={this.emptyList} 
                        columnWrapperStyle={{marginHorizontal:20}}
                        rowWrapperStyle={{marginHorizontal:20}}
                        ListFooterComponent={this.renderFooter}
                    />
                </View>
                { this.bottomSheetOptions() }
            </SafeAreaView>
        )   
    }
}
const styles = StyleSheet.create({
    labelText:{
        backgroundColor: '#2DA16C',
        paddingHorizontal: 10, 
        height:30,
        color:'#fff',
        fontSize: 15,
        fontWeight: '700',
        paddingTop:4,
    },
    lastAchievement:{
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    lastAchievementName:{
        color: '#696767',
        fontSize: 14,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 10,        
    },     
    container: {
        flex:1,
        paddingBottom:30,
        marginBottom: 30,
    },
    item: {
        alignSelf: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: 15,
        marginBottom: 15,
        alignSelf: 'baseline',
    },
    insignia:{
        width: 65,
        height: 65,
        resizeMode: 'contain',        
    },
    insigniaName:{
        color: '#696767',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 15,
        marginBottom: 15,
        textAlign: 'center',
    }, 
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    statusText:{
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 15
    },
    block: {
        backgroundColor:'#fff',
        paddingBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
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
    blockText:{
        color: '#4a4a4a',
        fontSize: 16,
        fontWeight: '500',
    }
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
export default connect(mapStateToProps, mapDispatchToProps)(Insignia);