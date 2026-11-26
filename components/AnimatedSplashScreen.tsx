import React, {
  useEffect,
  useRef,
} from "react";

import {
  StyleSheet,
  View,
  StatusBar,
} from "react-native";

import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
} from "expo-av";

// =====================================================
// TYPES
// =====================================================

type AnimatedSplashScreenProps = {
  onFinish: () => void;
};

// =====================================================
// COMPONENT
// =====================================================

export default function AnimatedSplashScreen({
  onFinish,
}: AnimatedSplashScreenProps) {
  const videoRef = useRef<Video>(null);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      videoRef.current?.stopAsync();
    };
  }, []);

  // ===================================================
  // VIDEO STATUS
  // ===================================================

  const handlePlaybackStatusUpdate = (
    status: AVPlaybackStatus
  ) => {
    if (!status.isLoaded) {
      return;
    }

    if (status.didJustFinish) {
      onFinish();
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <View style={styles.container}>

      {/* ============================================= */}
      {/* SPLASH STATUS BAR */}
      {/* ============================================= */}

      <StatusBar
        barStyle="light-content"
        backgroundColor="#996515"
        translucent={false}
      />

      {/* ============================================= */}
      {/* SPLASH VIDEO */}
      {/* ============================================= */}

      <Video
        ref={videoRef}
        source={require(
          "../assets/videos/Realtor_Parth_RP_Splash_Video.mp4"
        )}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted
        onPlaybackStatusUpdate={
          handlePlaybackStatusUpdate
        }
      />

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#996515",
  },

  video: {
    ...StyleSheet.absoluteFillObject,
  },
});


































// import React, { useEffect, useRef } from "react";

// import {
//   StyleSheet,
//   View,
// } from "react-native";

// import {
//   Video,
//   ResizeMode,
//   AVPlaybackStatus,
// } from "expo-av";

// type AnimatedSplashScreenProps = {
//   onFinish: () => void;
// };

// export default function AnimatedSplashScreen({
//   onFinish,
// }: AnimatedSplashScreenProps) {
//   const videoRef = useRef<Video>(null);

//   useEffect(() => {
//     return () => {
//       videoRef.current?.stopAsync();
//     };
//   }, []);

//   const handlePlaybackStatusUpdate = (
//     status: AVPlaybackStatus
//   ) => {
//     if (!status.isLoaded) {
//       return;
//     }

//     if (status.didJustFinish) {
//       onFinish();
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Video
//         ref={videoRef}
//         source={require("../assets/videos/Realtor_Parth_RP_Splash_Video.mp4")}
//         style={styles.video}
//         resizeMode={ResizeMode.COVER}
//         shouldPlay
//         isLooping={false}
//         isMuted
//         onPlaybackStatusUpdate={
//           handlePlaybackStatusUpdate
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#996515",
//   },

//   video: {
//     ...StyleSheet.absoluteFillObject,
//   },
// });