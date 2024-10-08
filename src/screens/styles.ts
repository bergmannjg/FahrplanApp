
import { StyleSheet } from "react-native";
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const stylesPortrait = StyleSheet.create({
  containerButtons: {
    flexDirection: 'column',
    padding: 10,
    borderWidth: 0,
  },
  containerHeaderText: {
    flexDirection: 'column',
    paddingTop: 0,
    paddingBottom: 0,
    padding: 10,
  },
  containerInfo: {
    flexDirection: 'column',
  },
});

export const stylesLandscape = StyleSheet.create({
  containerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10
  },
  containerHeaderText: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10
  },
  containerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    flexDirection: 'column',
  },
  containerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 0,
    borderWidth: 0,
  },
  containerText: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 0,
    borderWidth: 0,
  },
  containerDateTime: {
    alignSelf: 'stretch',
    minWidth: 200,
    padding: 10,
    backgroundColor: '#F5FCFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  containerSearch: {
    padding: 10,
    backgroundColor: '#F5FCFF',
  },
  autocompleteContainerFrom: {
    flexDirection: 'row',
    paddingBottom: 5,
  },
  autocompleteContainerVia: {
    flexDirection: 'row',
    paddingBottom: 5,
  },
  autocompleteContainerTo: {
    flexDirection: 'row',
  },
  switchText: {
    fontSize: 18,
    margin: 2
  },
  itemText: {
    fontSize: 18,
    margin: 2
  },
  buttonContained: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10
  },
  buttonOutlined: {
    alignItems: 'center',
    borderWidth: 1,
    padding: 10
  },
  switchbutton: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    width: 40
  },
  buttonDateTime: {
    backgroundColor: '#DDDDDD',
    padding: 10,
    flexGrow: 1
  },
  subtitleViewColumn: {
    flexDirection: 'column',
    paddingLeft: 10,
    paddingTop: 5,
    borderWidth: 0
  },
  containerPriceText: {
    borderWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingHorizontal: 10,
    paddingLeft: 30
  },
  priceText: {
    textDecorationLine: 'underline',
    borderWidth: 0,
  },
  subtitleConnectionsColumn: {
    flexDirection: 'column',
    paddingLeft: 30,
    paddingTop: 0,
    borderWidth: 0
  },
  routeViewColumn: {
    flexDirection: 'column',
    paddingLeft: 18,
    paddingTop: 5,
    borderWidth: 0,
  },
  routeTunnelColumn: {
    flexDirection: 'column',
    paddingLeft: 30,
    paddingTop: 5,
    borderWidth: 0
  },
  routeViewMaxSpeedColumn: {
    flexDirection: 'column',
    paddingLeft: 18,
    paddingTop: 0,
    borderWidth: 0
  },
  routeViewColumnNoPaddingTop: {
    flexDirection: 'column',
    paddingLeft: 18,
    paddingTop: 0,
    borderWidth: 0
  },
  maxSpeedColumn: {
    flexDirection: 'column',
    paddingLeft: 30,
    paddingTop: 5,
    borderWidth: 0
  },
  distanceColumn: {
    flexDirection: 'column',
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 5,
    borderWidth: 0
  },
  distanceText: {
  },
  maxSpeedLinkText: {
    fontWeight: 'bold',
    paddingTop: 5,
    paddingLeft: 10,
  },
  subtitleButtonColumn: {
    flexDirection: 'column',
    borderWidth: 0,
    padding: 0,
    paddingBottom: 4
  },
  itemInfoText: {
  },
  itemWarningText: {
    color: 'red',
  },
  buttonConnection: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 2,
    minWidth: 100,
    borderWidth: 0,
  },
  itemButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  itemButtonTextPressed: {
    fontSize: 18,
    textAlign: 'center',
    color: 'grey',
  },
  itemHeaderText: {
    fontSize: 14,
    paddingBottom: 10,
  },
  itemHeaderTextLeft: {
    fontSize: 14,
    paddingBottom: 10,
    paddingLeft: 10
  },
  infoText: {
    fontWeight: "normal",
    fontSize: 14,
    paddingLeft: 18,
  },
  summaryText: {
    fontWeight: 'bold',
    fontSize: 14,
    paddingLeft: 10,
  },
  summaryTextWarning: {
    fontWeight: "normal",
    fontSize: 14,
    paddingLeft: 10,
    color: 'red'
  },
  contentText: {
    paddingLeft: 20,
  },
  itemView: {
    flexDirection: 'column',
    paddingLeft: 35,
    paddingTop: 10,
    paddingBottom: 0,
    margin: 0,
    width: '100%',
    backgroundColor: Colors.white
  },
  itemWarningTextJourneyPlan: {
    color: 'red',
    paddingLeft: 50,
  },
  itemDelayText: {
    color: 'green',
  },
  itemStationText: {
    fontWeight: 'bold',
  },
  itemDetailsText: {
    paddingLeft: 50,
  },
  itemHintText: {
    paddingLeft: 30,
  },
  itemDetailsTextTransit: {
    paddingLeft: 50,
  },
  buttonJourneyPlan: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 8,
    margin: 2,
    minWidth: 200
  },
  buttonRoute: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 0,
    margin: 0,
    minWidth: 300
  },
  buttonNearby: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    margin: 2,
  },
  itemHeaderTextNearby: {
    fontSize: 15,
    padding: 10,
    paddingTop: 15,
    paddingLeft: 15,
  },
  titleView: {
    flexDirection: 'row'
  },
  myJourneyItem: {
    flexDirection: 'row',
    justifyContent: "space-between"
  },
  subtitleViewRow: {
    flexDirection: 'row',
    paddingLeft: 10,
    paddingTop: 5
  },
  itemHeaderTextTrainformation: {
    fontSize: 15,
    padding: 2,
    paddingLeft: 15,
  },
  itemDelayTextTrip: {
    paddingLeft: 50,
    color: 'green',
  },
  buttonTrip: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 8,
    margin: 2,
  },
  subtitleViewTrip: {
    flexDirection: 'column',
    paddingLeft: 10,
    paddingTop: 5,
    margin: 10,
    width: '100%'
  },
  itemButtonTextRouteOfTrip: {
    paddingLeft: 10,
    fontWeight: 'bold',
    textAlign: 'left'
  },
  itemButtonTextMaxSpeed: {
    paddingLeft: 10,
    fontWeight: "bold",
    textAlign: 'left'
  },
});



