import { AppState, AppStateStatus, View } from 'react-native';
import React from 'react';
//import { ZegoMenuBarButtonName, ZegoUIKitPrebuiltCall } from '@zegocloud/zego-uikit-prebuilt-call-rn';
const ZegoUi = require('@zegocloud/zego-uikit-prebuilt-call-rn');
import { ZegoLayoutMode, } from '@zegocloud/zego-uikit-rn';
import { ZegoMediaOptions } from '../../firebase/ZegoExpressManager/index.entity';
import ZegoExpressEngine from 'zego-express-engine-reactnative';
import { ZEGO_APP_ID, ZEGO_APP_SIGN, NOTIFY_CALL, FCM_CALL } from '../../global/const';
import { displayOngoingNotification, endCall } from '../../firebase/notify';
import { ZegoExpressManager } from '../../firebase/ZegoExpressManager';

const VideoCallView = ({ route, navigation }: { route: any, navigation: any }) => {
    const { userID } = route.params;
    const { userName } = route.params;
    const { token } = route.params;
    const { room } = route.params;
    const currentRoom = room;

    React.useEffect(() => {
        //const a = AppState.addEventListener('change', _handleAppStateChange);
        displayOngoingNotification({
            notId: NOTIFY_CALL,
            title: 'Video Call',
            msg: 'Calling',
            answered: true,
            record: { type: FCM_CALL, id: token, navigator: room, time: userName }
        })
        /*return () => {
            a.remove()
            endCall(NOTIFY_CALL)
        }*/
    }, [])

    const renewToken = (roomID: string, remainTimeInSecond: number) => {
        console.warn('out roomTokenWillExpire', roomID, remainTimeInSecond);
        ZegoExpressEngine.instance().renewToken(roomID, token);
    }

    React.useEffect(() => {
        ZegoExpressManager.createEngine({
            appID: ZEGO_APP_ID,
            appSign: ZEGO_APP_SIGN,
            scenario: 0,
        })
        ZegoExpressManager.instance().joinRoom(currentRoom, token, { userID: userID, userName: userName },
            [ZegoMediaOptions.PublishLocalAudio, ZegoMediaOptions.PublishLocalVideo, ZegoMediaOptions.AutoPlayAudio, ZegoMediaOptions.AutoPlayVideo]).then(result => {
                if (result) {
                    console.warn('Login successful');
                } else {
                    console.warn('Login failed!', result)
                }
            });
        ZegoExpressManager.instance().onRoomTokenWillExpire(renewToken)
    }, []);
    return <View style={{ flex: 1 }}>
        <ZegoUi.ZegoUIKitPrebuiltCall
            appID={ZEGO_APP_ID}
            appSign={ZEGO_APP_SIGN}
            userID={userID}
            userName={userName}
            callID={currentRoom}
            token={token}
            config={{
                turnOnCameraWhenJoining: false,
                turnOnMicrophoneWhenJoining: true,
                useSpeakerWhenJoining: true,
                layout: {
                    mode: ZegoLayoutMode.pictureInPicture,
                },
                bottomMenuBarConfig: {
                    buttons: [
                        ZegoUi.ZegoMenuBarButtonName.toggleCameraButton,
                        ZegoUi.ZegoMenuBarButtonName.switchCameraButton,
                        ZegoUi.ZegoMenuBarButtonName.hangUpButton,
                        ZegoUi.ZegoMenuBarButtonName.toggleMicrophoneButton,
                        ZegoUi.ZegoMenuBarButtonName.switchAudioOutputButton,
                    ],
                },
                topMenuBarConfig: {
                    buttons: [ZegoUi.ZegoMenuBarButtonName.showMemberListButton],
                },
                audioVideoViewConfig: {
                    turnOnCameraWhenJoining: false,
                    turnOnMicrophoneWhenJoining: true,
                    useSpeakerWhenJoining: true,
                    showMicrophoneStateOnView: true,
                    showCameraStateOnView: true,
                    showUserNameOnView: true,
                    showSoundWavesInAudioMode: true,
                    useVideoViewAspectFill: true,
                },
                memberListConfig: {
                    showMicrophoneState: true,
                    showCameraState: true,
                },
                onHangUp: () => {
                    endCall(NOTIFY_CALL)
                    navigation.goBack()
                },
            }}
            onRequireNewToken={() => renewToken('', 0)}
        />
    </View>;
};

export default VideoCallView;