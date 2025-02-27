import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const VideoCall = ({ onClose }) => {
    const jitsiRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const roomName = queryParams.get("roomName");
    const [isInitialized, setIsInitialized] = useState(false);
    let jitsiAPI = null;

    useEffect(() => {
        if (!roomName || !user) {
            console.error("No room name or user provided");
            return;
        }

        const loadJitsiScript = () => {
            return new Promise((resolve) => {
                if (window.JitsiMeetExternalAPI) {
                    resolve();
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://meet.jit.si/external_api.js";
                script.async = true;
                script.onload = resolve;
                document.body.appendChild(script);
            });
        };

        const initJitsi = async () => {
            try {
                await loadJitsiScript();
                
                const domain = 'meet.jit.si';
                const options = {
                    roomName: roomName,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiRef.current,
                    userInfo: {
                        displayName: user?.fullName || sessionStorage.getItem("name"),
                        email: user?.email,
                        moderator: true // Set all users as moderators
                    },
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: false,
                        disableDeepLinking: true,
                        disableInitialGUM: false,
                        enableClosePage: false,
                        enableWelcomePage: false,
                        disableProfile: false,
                        disableAuth: true, // Disable authentication
                        enableLobbyChat: false,
                        requireDisplayName: true,
                        lobby: {
                            autoKnock: true,
                            enableChat: false
                        },
                        security: {
                            enableLobby: false, // Disable lobby
                            lockRoomGuestEnabled: false // Disable guest lock
                        }
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop',
                            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
                            'settings', 'raisehand', 'videoquality', 'filmstrip',
                            'tileview'
                        ],
                        SETTINGS_SECTIONS: ['devices', 'language'],
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        DEFAULT_REMOTE_DISPLAY_NAME: 'User',
                        TOOLBAR_ALWAYS_VISIBLE: true
                    }
                };

                jitsiAPI = new window.JitsiMeetExternalAPI(domain, options);

                // Handle initial setup
                jitsiAPI.addEventListener('videoConferenceJoined', () => {
                    console.log("Conference joined");
                    setIsInitialized(true);
                    // Make everyone moderator
                    jitsiAPI.executeCommand('toggleLobby', false);
                });

                // Handle errors
                jitsiAPI.addEventListener('errorOccurred', (error) => {
                    console.error('Jitsi Error:', error);
                });

                // Handle participant property change
                jitsiAPI.addEventListener('participantRoleChanged', (event) => {
                    if (event.role === 'moderator') {
                        jitsiAPI.executeCommand('toggleLobby', false);
                    }
                });

            } catch (error) {
                console.error("Failed to initialize Jitsi:", error);
            }
        };

        initJitsi();

        return () => {
            if (jitsiAPI) {
                try {
                    jitsiAPI.dispose();
                } catch (error) {
                    console.error("Error disposing Jitsi:", error);
                }
            }
        };
    }, [roomName, user]);

    const handleClose = () => {
        if (jitsiAPI) {
            jitsiAPI.dispose();
        }
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="video-call-container">
            <button className="close-video-call" onClick={handleClose}>
                <FontAwesomeIcon icon={faTimes} />
            </button>
            <div ref={jitsiRef} style={{ width: '100%', height: '100vh' }} />
        </div>
    );
};

export default VideoCall;
