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
import { Card, CardItem, Body, Left, Icon } from 'native-base';
import strings from '../../config/languages';
import AchievementsService from '../../services/achievements';
import globalStyles from '../../styles/global';

class UserLevel extends Component {
    static navigationOptions = ({ navigation}) => ({
        title: strings.userLevels.title,
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
            moreElements: true,
            isLoading: false,
            page: 0,            
            size: 10,
            type: "LEVEL",
            sort: 'weight,asc',
            levelsData: [],
        }  
    }
    componentDidMount(){
        this.loadLevels();
    }
    loadLevels = () => {
        this.setState({ isLoading: true})
        AchievementsService.getProfileAchievementsByType( this.state.type, { page: this.state.page, size: this.state.size})
        .then((res) => {
            if(res.status==200 || res.status == 201){
                let result = JSON.parse(res._bodyText);
                if(result.length > 0){
                    this.setState({
                        levelsData: this.state.page === 0 ? result : [...this.state.levelsData, ...result], 
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
    renderItem = ({ item, index }) => { 
        if (item.empty === true) {
            return <View key={item.id} style={[styles.item, styles.itemInvisible]} />;
        }   
        return (
            <View key={item.id} style={{marginVertical:5}}>
                <Card >
                    <CardItem style={{marginVertical: 10}}>
                        <Left>
                            { item.insignia &&
                                item.acquired ?
                                    <Image  source={{uri: `data:${item.insignia.imageContentType};base64,${item.insignia.image}`}} style={styles.imagesLevel} />
                                    : 
                                    <Image  source={{uri: `data:${item.insignia.imageContentType};base64,${item.insignia.image}`}} style={[styles.imagesLevel, {opacity: 0.3}]} />
                            }
                            <Body>
                                <Text style={styles.levelName}>{item.name} </Text>                                             
                                <Text style={styles.levelDescription}>{item.description}</Text>
                            </Body>
                        </Left>
                    </CardItem>
                </Card>
            </View>
        );
    }
    handleLoadMore = () => {
        if(this.state.moreElements){
            this.setState( state => ({page: state.page + 1}), () => this.loadLevels());
        }
    };
    emptyList = ({}) => {
    return (<View style={{alignItems: 'center', marginTop: 30}}> 
                { !this.state.isLoading &&
                <Text>{strings.insignia.emptyList}</Text>
                }
            </View>);
    }
    renderFooter = () => {
        return  ( this.state.isLoading ? 
                    <View style={styles.loader}> 
                        <ActivityIndicator size='large' />
                    </View> : null);
    }
    render() {
        return ( 
            <SafeAreaView >
                <View style={{ backgroundColor: "#f6f6f9", height:'100%'}}>
                    <FlatList
                        extraData={this.state}
                        data={this.state.levelsData}                          
                        keyExtractor={(item, index) => item.id+''}                   
                        renderItem= {this.renderItem }
                        onEndReached={() => this.handleLoadMore()}
                        onEndReachedThreshold={0.5}
                        ListEmptyComponent={this.emptyList} 
                        style={{paddingVertical: 20, paddingHorizontal: 20}}
                        ListFooterComponent={this.renderFooter}
                    /> 
                </View>                 
            </SafeAreaView>
        )  
    }
}
const styles = StyleSheet.create({
    item: {
        alignSelf: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: 15,
        marginBottom: 15,
        alignSelf: 'baseline',
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    imagesLevel:{
        resizeMode: 'contain',
        width: 95,
        height: 45,
        paddingLeft: 10,
        paddingRight: 10,
    },   
    levelName:{
        color: '#4a4a4a',
        fontSize: 16,
        fontWeight: 'bold'
    },
    levelDescription:{
        color: '#5b5b5b',
        fontSize: 14,
        fontWeight: '400',
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
export default connect(mapStateToProps, mapDispatchToProps)(UserLevel);