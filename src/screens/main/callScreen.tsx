//npm i react-native-webrtc
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { TextInput } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import InCallManager from 'react-native-incall-manager';

import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    MediaStreamTrack,
    mediaDevices,
    registerGlobals,
} from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RTCSessionDescriptionInit } from 'react-native-webrtc/lib/typescript/RTCSessionDescription';
import { intiFirebase } from '../../firebase/fireAuth';

export default function CallScreen({ route, navigation }: { route: any, navigation: any }) {
    let name: any;
    let connectedUser: any;
    const [userId, setUserId] = useState('');
    const [socketActive, setSocketActive] = useState(false);
    const [calling, setCalling] = useState(false);
    // Video Scrs
    const [localStream, setLocalStream] = useState({ toURL: () => null });
    const [remoteStream, setRemoteStream] = useState({ toURL: () => null });
    const [conn, setConn] = useState(new WebSocket(''));
    const [yourConn, setYourConn] = useState<RTCPeerConnection>(
        //change the config as you need
        new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                }, {
                    urls: 'stun:stun1.l.google.com:19302',
                }, {
                    urls: 'stun:stun2.l.google.com:19302',
                },
            ],
        }),
    );

    const [offer, setOffer] = useState<any>(null);

    const [callToUsername, setCallToUsername] = useState<string | null>(null);
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem('userId').then(id => {
                console.log(id);
                if (id) {
                    setUserId(id);
                } else {
                    setUserId('');
                    navigation.push('Login');
                }
            });
        }, [userId]),
    );

    useEffect(() => {
        navigation.setOptions({
            title: 'Your ID - ' + userId,
            headerRight: () => (
                <Button mode="text" onPress={onLogout} style={{ paddingRight: 10 }}>
                    Logout
                </Button>
            ),
        });
    }, [userId]);

    useEffect(() => {
        if (socketActive && userId.length > 0) {
            try {
                InCallManager.start({ media: 'audio' });
                InCallManager.setForceSpeakerphoneOn(true);
                InCallManager.setSpeakerphoneOn(true);
            } catch (err) {
                console.log('InApp Caller ---------------------->', err);
            }

            console.log(InCallManager);

            send({
                type: 'login',
                name: userId,
            });
        }
    }, [socketActive, userId]);

    const onLogin = () => { };

    useEffect(() => {
        conn.onopen = () => {
            console.log('Connected to the signaling server');
            setSocketActive(true);
        };
        //when we got a message from a signaling server
        conn.onmessage = msg => {
            let data;
            if (msg.data === 'Hello world') {
                data = {};
            } else {
                data = JSON.parse(msg.data);
                console.log('Data --------------------->', data);
                switch (data.type) {
                    case 'login':
                        console.log('Login');
                        break;
                    //when somebody wants to call us
                    case 'offer':
                        handleOffer(data.offer, data.name);
                        console.log('Offer');
                        break;
                    case 'answer':
                        handleAnswer(data.answer);
                        console.log('Answer');
                        break;
                    //when a remote peer sends an ice candidate to us
                    case 'candidate':
                        handleCandidate(data.candidate);
                        console.log('Candidate');
                        break;
                    case 'leave':
                        handleLeave();
                        console.log('Leave');
                        break;
                    default:
                        break;
                }
            }
        };
        conn.onerror = function (err) {
            console.log('Got error', err);
        };

        let isFront = false;
        mediaDevices.enumerateDevices().then((sourceInfos: any) => {
            let videoSourceId;
            for (let i = 0; i < sourceInfos.length; i++) {
                const sourceInfo = sourceInfos[i];
                if (
                    sourceInfo.kind === 'videoinput' &&
                    sourceInfo.facing === (isFront ? 'front' : 'environment')
                ) {
                    videoSourceId = sourceInfo.deviceId;
                }
            }
            mediaDevices
                .getUserMedia({
                    audio: true,
                    video: {
                        mandatory: {
                            minWidth: 500, // Provide your own width, height and frame rate here
                            minHeight: 300,
                            minFrameRate: 30,
                        },
                        facingMode: isFront ? 'user' : 'environment',
                        optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
                    },
                })
                .then((stream: any) => {
                    // Got stream!
                    setLocalStream(stream);

                    // setup stream listening
                    //yourConn.addTrack(stream);
                    stream?.getTracks().forEach((track: any) => {
                        yourConn.addTrack(track, stream);
                    });
                })
                .catch(error => {
                    // Log error
                });
        });

        yourConn.onaddstream = (event: any) => {
            console.log('On Add Stream', event);
            setRemoteStream(event.stream);
        };

        // Setup ice handling
        yourConn.onicecandidate = (event: any) => {
            if (event.candidate) {
                send({
                    type: 'candidate',
                    candidate: event.candidate,
                });
            }
        };
    }, []);

    const send = (message: any) => {
        //attach the other peer username to our messages
        if (connectedUser) {
            message.name = connectedUser;
            console.log('Connected iser in end----------', message);
        }

        conn.send(JSON.stringify(message));
    };

    const onCall = () => {
        setCalling(true);

        connectedUser = callToUsername;
        console.log('Caling to', callToUsername);
        // create an offer

        yourConn.createOffer({}).then((offerT: any) => {
            yourConn.setLocalDescription(offerT).then(() => {
                console.log('Sending Ofer');
                console.log(offerT);
                send({
                    type: 'offer',
                    offer: offerT,
                });
                // Send pc.localDescription to peer
            });
        });
    };

    //when somebody sends us an offer
    const handleOffer = async (offerT: any, nameT: string) => {
        console.log(nameT + ' is calling you.');

        console.log('Accepting Call===========>', offerT);
        connectedUser = nameT;

        try {
            await yourConn.setRemoteDescription(new RTCSessionDescription(offerT));

            const answer = await yourConn.createAnswer();

            await yourConn.setLocalDescription(answer);
            send({
                type: 'answer',
                answer: answer,
            });
        } catch (err) {
            console.log('Offerr Error', err);
        }
    };

    //when we got an answer from a remote user
    const handleAnswer = (answer: RTCSessionDescriptionInit | undefined) => {
        yourConn.setRemoteDescription(new RTCSessionDescription(answer));
    };

    //when we got an ice candidate from a remote user
    const handleCandidate = (candidate: { candidate?: string | undefined; sdpMLineIndex?: null | undefined; sdpMid?: null | undefined; }) => {
        setCalling(false);
        console.log('Candidate ----------------->', candidate);
        yourConn.addIceCandidate(new RTCIceCandidate(candidate));
    };

    //hang up
    const hangUp = () => {
        send({
            type: 'leave',
        });

        handleLeave();
    };

    const handleLeave = () => {
        connectedUser = null;
        setRemoteStream({ toURL: () => null });

        yourConn.close();
        // yourConn.onicecandidate = null;
        // yourConn.onaddstream = null;
    };

    const onLogout = () => {
        // hangUp();

        AsyncStorage.removeItem('userId').then(res => {
            navigation.push('Login');
        });
    };

    const acceptCall = async () => {
        console.log('Accepting Call===========>', offer);
        connectedUser = offer?.name;

        try {
            await yourConn.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await yourConn.createAnswer();

            await yourConn.setLocalDescription(answer);

            send({
                type: 'answer',
                answer: answer,
            });
        } catch (err) {
            console.log('Offerr Error', err);
        }
    };
    const rejectCall = async () => {
        send({
            type: 'leave',
        });
        '';
        setOffer(null);

        handleLeave();
    };

    return (
        <View style={styles.root}>
            <View style={styles.inputField}>
                <TextInput
                    label="Enter Friends Id"
                    mode="outlined"
                    style={{ marginBottom: 7 }}
                    onChangeText={text => setCallToUsername(text)}
                />
                <Button
                    mode="contained"
                    onPress={onCall}
                    loading={calling}
                    //   style={styles.btn}
                    contentStyle={styles.btnContent}
                    disabled={!(socketActive && userId.length > 0)}>
                    Call
                </Button>
            </View>

            <View style={styles.videoContainer}>
                <View style={[styles.videos, styles.localVideos]}>
                    <Text>Your Video</Text>
                    <RTCView streamURL={localStream?.toURL() ? String(localStream.toURL()) : ''} style={styles.localVideo} />
                </View>
                <View style={[styles.videos, styles.remoteVideos]}>
                    <Text>Friends Video</Text>
                    <RTCView
                        streamURL={remoteStream?.toURL() !== null ? String(remoteStream?.toURL()) : ''}
                        style={styles.remoteVideo}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: '#fff',
        flex: 1,
        padding: 20,
    },
    inputField: {
        marginBottom: 10,
        flexDirection: 'column',
    },
    videoContainer: {
        flex: 1,
        minHeight: 450,
    },
    videos: {
        width: '100%',
        flex: 1,
        position: 'relative',
        overflow: 'hidden',

        borderRadius: 6,
    },
    localVideos: {
        height: 100,
        marginBottom: 10,
    },
    remoteVideos: {
        height: 400,
    },
    localVideo: {
        backgroundColor: '#f2f2f2',
        height: '100%',
        width: '100%',
    },
    remoteVideo: {
        backgroundColor: '#f2f2f2',
        height: '100%',
        width: '100%',
    },
    btnContent: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
});
*/