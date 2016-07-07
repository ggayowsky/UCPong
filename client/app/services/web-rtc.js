import Ember from 'ember';

export default Ember.Service.extend({
    // Services
    socket: Ember.inject.service(),

    // Lifecycle
    willDestroy() {
        let peerConnection = this.get('peerConnection');
        if(!Ember.isNone(peerConnection)) {
            peerConnection.close();
        }
        this._super();
    },

    // Methods
    setup() {
        // Cross browser fun
        navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
        window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
        let peerConnectionConfig = {
           iceServers: [
               {
                   url: 'stun:stun.services.mozilla.com'
               },
               {
                   url: 'stun:stun.l.google.com:19302'
               }
           ]
        };

        this.set('peerConnectionConfig', peerConnectionConfig);
        this.get('socket').on('sdp-description', this.sdpDescriptionHandler.bind(this));
        this.get('socket').on('ice-candidate', this.iceCandidateHandler.bind(this));
    },

    startConnection(isCaller, challengeData) {
        let peerConnection = new RTCPeerConnection(this.get('peerConnectionConfig'));
        this.set('peerConnection', peerConnection);
        this.set('challengeData', challengeData);
        peerConnection.onicecandidate = this.gotIceCandidate.bind(this);

        var dataChannelOptions = {
            ordered: false, // do not guarantee order
            maxRetransmitTime: 3000, // in milliseconds
        };

        if(isCaller) {
            var dataChannel =
                peerConnection.createDataChannel("myLabel", dataChannelOptions);

            this.gotDataChannel({
                channel: dataChannel
            });

            peerConnection.createOffer(
                this.gotDescription.bind(this),
                (error) => {
                    console.log(error);
                }
            );
        } else {
            peerConnection.ondatachannel = this.gotDataChannel.bind(this);
        }

        return peerConnection;
    },

    send(data) {
        let dataChannel = this._dataChannel;
        if(!Ember.isNone(dataChannel)) {
            dataChannel.send(data);
        } else {
            throw new Error('No data channel to send data with!');
        }
    },

    // RTC event handlers
    gotIceCandidate(event) {
        if(event.candidate != null) {
            this.get('socket').emit('ice-candidate', {
                ice: JSON.stringify(event.candidate),
                challengeData: this.get('challengeData')
            });
        }
    },

    gotDescription(description) {
        let peerConnection = this.get('peerConnection');
        peerConnection.setLocalDescription(description,
            () => {
                this.get('socket').emit('sdp-description', {
                    challengeData: this.get('challengeData'),
                    sdp: JSON.stringify(description)
                });
            },
            () => {
                console.log('set description error');
            });
    },

    gotDataChannel(event) {
        let channel = event.channel;
        this._dataChannel = channel;

        channel.onerror = function (error) {
            console.log("Data Channel Error:", error);
        };

        channel.onmessage = event => {
            console.log("Got Data Channel Message:", event.data);
        };

        channel.onopen = () => {
            console.log('data channel opened!');
        };

        channel.onclose = () => {
            this._dataChannel = null;
            console.log("The Data Channel is Closed");
        };
    },

    // Socket event handlers
    sdpDescriptionHandler(data) {
        let peerConnection = this.get('peerConnection');
        if(Ember.isNone(peerConnection)) {
            peerConnection = this.startConnection(false, data.challengeData);
        }

        peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp), () => {
            if(data.sdp.type === 'offer') {
                peerConnection.createAnswer(
                    this.gotDescription.bind(this),
                    (error) => {
                        console.log(error);
                    }
                );
            }
        });
    },

    iceCandidateHandler(data) {
        let peerConnection = this.get('peerConnection');
        peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    }
});