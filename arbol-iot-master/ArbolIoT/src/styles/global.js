import {StyleSheet} from 'react-native';

export default StyleSheet.create({
    headerStyle: {
        backgroundColor: '#2CA06C',
        height: 60,
    },
    headerTitleStyle: { 
        textAlign: 'center',
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    headerLeft: {
        width:60,
        height: 60, 
        justifyContent: "center", 
        alignItems: "center" 
    },
    headerLeftIcon: {
        fontSize:28, 
        color:'white'
    },
    headerRight: {
        marginRight: 30, 
        alignItems:'center'
    },
    headerRightSmallLabel: {
        fontSize: 9, 
        fontWeight: '400', 
        color: '#fff', 
        textAlign:'center'
    },
    text: {
        fontSize: 14,
        color: '#737373',
        lineHeight:25
    },
    imageRound80x: {
        width: 80,
        height: 80,
        borderRadius: 80/2,
        alignSelf: 'center',
        borderColor:'#f7f7f7',
        borderWidth: 1
    },
    imageRound85x:{
        height: 84,
        width: 84, 
        borderRadius: 84/2, 
        shadowOffset: { width: 2, height: 2 },
        shadowColor: "grey",
        shadowOpacity: 0.05,
        shadowRadius: 1,
        borderWidth: 0.5,
        borderColor:'#f7f7f7'
    },
    imageSquare: {
        marginLeft: 20,
        marginRight:20,
        width:81, 
        height:120, 
        marginTop:20, 
        alignSelf:'center',
        borderColor:'#f7f7f7',
        borderWidth: 1
    },
    badge:{
        paddingLeft:5,
        paddingRight:5,
        height:22,
        justifyContent:'center',
        textAlign:'center'
    },
    badgeSuccess:{
        paddingLeft:5,
        paddingRight:5,
        height:22,
        backgroundColor: '#70B855',
        justifyContent:'center',
        textAlign:'center'
    },
    badgeText:{
        color: '#fff',
        fontSize: 12,
        fontWeight: '500'
    },
    alertContainer:{ 
        marginLeft: 40,
        marginRight: 40, 
        maxWidth:200,
        paddingTop: 20,
        paddingBottom:0,
    },
    alertConfirmText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        color: 'white'
    },
    alertConfirmButtonStyle: {
        width: '100%',   
        marginTop: 10,     
        marginBottom: 20,
        paddingHorizontal: 40,
        paddingVertical: 10,
    },
    alertImg:{
        height: 80,
        width: 80,
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    alertTitleMain:{
        marginTop: 20,
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        color: '#737373'
    },
    alertTitle:{
        textAlign: 'center',
        marginTop: 20,
        fontSize: 17,
        fontWeight: '700',
        color: '#737373',
    },
    alertText:{
        textAlign: 'center',
        marginTop: 15,
        fontSize: 15,
        fontWeight: '400',
        color: '#737373',
        lineHeight: 25
    },
});