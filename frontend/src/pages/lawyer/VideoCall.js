import React, { useEffect, useRef } from 'react';


const VideoCall = () => {
    const jitsiRef = useRef(null);
    const roomName = "lawyer-client-call"; // You can generate a unique room name as needed

    useEffect(() => {
        // Load Jitsi script
        const loadJitsiScript = () => {
            let resolveLoadJitsiScriptPromise = null;

            const loadJitsiScriptPromise = new Promise((resolve) => {
                resolveLoadJitsiScriptPromise = resolve;
            });

            const script = document.createElement("script");
            script.src = "https://meet.jit.si/external_api.js";
            script.async = true;
            script.onload = resolveLoadJitsiScriptPromise;
            document.body.appendChild(script);

            return loadJitsiScriptPromise;
        };

        // Initialize meeting
        const initJitsi = async () => {
            if (!window.JitsiMeetExternalAPI) {
                await loadJitsiScript();
            }

            const domain = 'meet.jit.si';
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiRef.current,
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                },
                interfaceConfigOverwrite: {
                    filmStripOnly: false,
                },
            };

            const jitsiAPI = new window.JitsiMeetExternalAPI(domain, options);

            jitsiAPI.addEventListener('videoConferenceLeft', () => {
                // Handle call end
                console.log("Call ended");
            });

            return jitsiAPI;
        };

        let jitsiAPI = null;

        // Start the meeting
        initJitsi()
            .then(api => {
                jitsiAPI = api;
            })
            .catch(error => {
                console.error("Failed to initialize Jitsi", error);
            });

        // Cleanup
        return () => {
            if (jitsiAPI) {
                jitsiAPI.dispose();
            }
        };
    }, [roomName]);

    return <div ref={jitsiRef} style={{ width: '100%', height: '100vh' }} />;
};

export default VideoCall; 