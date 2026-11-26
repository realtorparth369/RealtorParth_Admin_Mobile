import "../global.css";

import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AuthProvider,
  useAuth,
} from "../contexts/AuthContext";

import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

// =====================================================
// ROOT NAVIGATION
// =====================================================

function RootNavigation() {
  const {
    user,
    loading,
  } = useAuth();

  const segments = useSegments();

  const router = useRouter();

  // ===================================================
  // SPLASH STATE
  // ===================================================

  const [
    splashFinished,
    setSplashFinished,
  ] = useState(false);

  // ===================================================
  // SPLASH FINISHED
  // ===================================================

  const handleSplashFinish =
    useCallback(() => {
      setSplashFinished(true);
    }, []);

  // ===================================================
  // AUTH NAVIGATION
  // ===================================================

  useEffect(() => {
    if (
      loading ||
      !splashFinished
    ) {
      return;
    }

    const firstSegment =
      segments[0];

    const inAdmin =
      firstSegment === "(admin)";

    const inLogin =
      firstSegment === "login";

    if (
      !user &&
      inAdmin
    ) {
      router.replace("/login");

      return;
    }

    if (
      user &&
      inLogin
    ) {
      router.replace("/(admin)");

      return;
    }
  }, [
    user,
    loading,
    splashFinished,
    segments,
    router,
  ]);

  // ===================================================
  // RP VIDEO SPLASH
  // ===================================================

  if (!splashFinished) {
    return (
      <AnimatedSplashScreen
        onFinish={handleSplashFinish}
      />
    );
  }

  // ===================================================
  // AUTH LOADING
  // ===================================================

  if (loading) {
    return null;
  }

  // ===================================================
  // MAIN APP
  // ===================================================

  return (
    <>
      <StatusBar
        style="dark"
        backgroundColor="#fcf2d2"
      />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}








// eas build --platform android --profile preview




















// import "../global.css";

// import {
//   Stack,
//   useRouter,
//   useSegments,
// } from "expo-router";

// import { StatusBar } from "expo-status-bar";

// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import {
//   AuthProvider,
//   useAuth,
// } from "../contexts/AuthContext";

// import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

// function RootNavigation() {
//   const { user, loading } = useAuth();

//   const segments = useSegments();

//   const router = useRouter();

//   const [splashFinished, setSplashFinished] =
//     useState(false);

//   const handleSplashFinish = useCallback(() => {
//     setSplashFinished(true);
//   }, []);

//   // =====================================================
//   // AUTH NAVIGATION
//   // =====================================================
//   useEffect(() => {
//     if (loading || !splashFinished) {
//       return;
//     }

//     const firstSegment = segments[0];

//     const inAdmin = firstSegment === "(admin)";
//     const inLogin = firstSegment === "login";

//     if (!user && inAdmin) {
//       router.replace("/login");
//       return;
//     }

//     if (user && inLogin) {
//       router.replace("/(admin)");
//     }
//   }, [
//     user,
//     loading,
//     splashFinished,
//     segments,
//     router,
//   ]);

//   // =====================================================
//   // RP VIDEO SPLASH
//   // =====================================================
//   if (!splashFinished) {
//     return (
//       <>
//         <StatusBar hidden />

//         <AnimatedSplashScreen
//           onFinish={handleSplashFinish}
//         />
//       </>
//     );
//   }

//   // =====================================================
//   // AUTH LOADING
//   // =====================================================
//   if (loading) {
//     return null;
//   }

//   // =====================================================
//   // APP
//   // =====================================================
//   return (
//     <>
//       <StatusBar
//         style="dark"
//         backgroundColor="#fcf2d2"
//       />

//       <Stack
//         screenOptions={{
//           headerShown: false,
//         }}
//       />
//     </>
//   );
// }

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <RootNavigation />
//     </AuthProvider>
//   );
// }