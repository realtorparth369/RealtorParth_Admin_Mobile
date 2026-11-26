import React from "react";

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";

import {
  Drawer,
} from "expo-router/drawer";

import {
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useAuth,
} from "../../contexts/AuthContext";

/* =========================================================
   TYPES
========================================================= */

type MenuItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

/* =========================================================
   MENU ITEM
========================================================= */

function MenuItem({
  label,
  icon,
  active,
  onPress,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`mb-1 flex-row items-center rounded-xl px-4 py-3 ${
        active
          ? "bg-bronze"
          : ""
      }`}
    >
      <Ionicons
        name={icon}
        size={21}
        color={
          active
            ? "#ffffff"
            : "#9ca3af"
        }
      />

      <Text
        className={`ml-4 text-[15px] font-medium ${
          active
            ? "text-white"
            : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   CUSTOM DRAWER CONTENT
========================================================= */

function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const {
    signOut,
  } = useAuth();

  const router = useRouter();

  /* =======================================================
     CURRENT ADMIN ROUTE
  ======================================================= */

  const currentRoute =
    props.state.routes[
      props.state.index
    ]?.name;

  /* =======================================================
     ACTIVE ROUTE HELPER
  ======================================================= */

  const isActive = (
    route: string
  ): boolean => {

    /* -----------------------------------------------------
       BLOG ROUTES

       blogs/index
       blogs/new
       blogs/[id]
    ----------------------------------------------------- */

    if (
      route ===
      "blogs/index"
    ) {
      return (
        currentRoute ===
          "blogs/index" ||
        currentRoute ===
          "blogs/new" ||
        currentRoute ===
          "blogs/[id]"
      );
    }

    /* -----------------------------------------------------
       COMMUNITY ROUTES

       community/index
       community/new
       community/[id]
    ----------------------------------------------------- */

    if (
      route ===
      "community/index"
    ) {
      return (
        currentRoute ===
          "community/index" ||
        currentRoute ===
          "community/new" ||
        currentRoute ===
          "community/[id]"
      );
    }

    /* -----------------------------------------------------
       RESOURCE ROUTES

       resources/index
       resources/new
    ----------------------------------------------------- */

    if (
      route ===
      "resources/index"
    ) {
      return (
        currentRoute ===
          "resources/index" ||
        currentRoute ===
          "resources/new"
      );
    }

    /* -----------------------------------------------------
       NORMAL ADMIN ROUTES
    ----------------------------------------------------- */

    return (
      currentRoute === route
    );
  };

  /* =======================================================
     ADMIN NAVIGATION
  ======================================================= */

  const navigateTo = (
    route: string
  ): void => {
    props.navigation.navigate(
      route as never
    );
  };

  /* =======================================================
     TRANSACTION PANEL
     
     IMPORTANT:
     Transaction Panel is outside the Admin Drawer.
     
     Your structure:
     
     app/
       (admin)/
       (transactions)/
     
     Therefore we use Expo Router here instead
     of props.navigation.navigate().
  ======================================================= */

  const navigateToTransactionPanel =
    (): void => {
      router.push(
        "/(transactions)"
      );
    };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    async (): Promise<void> => {
      try {
        await signOut();
      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View className="flex-1 bg-gray-900">

      {/* ===================================================
          HEADER
      =================================================== */}

      <View className="items-center border-b border-gray-700 px-6 pb-6 pt-14">

        <Text className="text-center text-3xl font-semibold uppercase tracking-widest text-white">
          Admin
        </Text>

        <Text className="mt-3 text-center text-xs font-medium uppercase tracking-widest text-gray-400">
          Panel
        </Text>

      </View>

      {/* ===================================================
          MENU
      =================================================== */}

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 12,
        }}
        showsVerticalScrollIndicator={
          false
        }
      >

        <View className="px-3">

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <MenuItem
            label="Dashboard"
            icon="grid-outline"
            active={isActive(
              "index"
            )}
            onPress={() =>
              navigateTo(
                "index"
              )
            }
          />

          {/* =================================================
              TRANSACTION PANEL
              
              This opens:
              
              app/(transactions)/index.tsx
              
              It does NOT use the Admin Drawer.
          ================================================= */}

          <MenuItem
            label="Transaction Panel"
            icon="swap-horizontal-outline"
            active={false}
            onPress={
              navigateToTransactionPanel
            }
          />

          {/* =================================================
              BLOGS
          ================================================= */}

          <MenuItem
            label="Blog Posts"
            icon="document-text-outline"
            active={isActive(
              "blogs/index"
            )}
            onPress={() =>
              navigateTo(
                "blogs/index"
              )
            }
          />

          {/* =================================================
              COMMUNITY
          ================================================= */}

          <MenuItem
            label="Neighborhoods"
            icon="business-outline"
            active={isActive(
              "community/index"
            )}
            onPress={() =>
              navigateTo(
                "community/index"
              )
            }
          />

          {/* =================================================
              RESOURCES
          ================================================= */}

          <MenuItem
            label="Resources"
            icon="book-outline"
            active={isActive(
              "resources/index"
            )}
            onPress={() =>
              navigateTo(
                "resources/index"
              )
            }
          />

          {/* =================================================
              LISTINGS
          ================================================= */}

          <MenuItem
            label="Listings"
            icon="home-outline"
            active={isActive(
              "listings"
            )}
            onPress={() =>
              navigateTo(
                "listings"
              )
            }
          />

          {/* =================================================
              LEADS
          ================================================= */}

          <MenuItem
            label="Leads"
            icon="people-outline"
            active={isActive(
              "leads"
            )}
            onPress={() =>
              navigateTo(
                "leads"
              )
            }
          />

          {/* =================================================
              HOME VALUATIONS
          ================================================= */}

          <MenuItem
            label="Home Valuations"
            icon="calculator-outline"
            active={isActive(
              "home-valuations"
            )}
            onPress={() =>
              navigateTo(
                "home-valuations"
              )
            }
          />

          {/* =================================================
              FAQS
          ================================================= */}

          <MenuItem
            label="FAQs"
            icon="help-circle-outline"
            active={isActive(
              "faqs"
            )}
            onPress={() =>
              navigateTo(
                "faqs"
              )
            }
          />

          {/* =================================================
              TESTIMONIALS
          ================================================= */}

          <MenuItem
            label="Testimonials"
            icon="star-outline"
            active={isActive(
              "testimonials"
            )}
            onPress={() =>
              navigateTo(
                "testimonials"
              )
            }
          />

          {/* =================================================
              SOCIAL POST
          ================================================= */}

          <MenuItem
            label="Social Post"
            icon="image-outline"
            active={isActive(
              "socialpost"
            )}
            onPress={() =>
              navigateTo(
                "socialpost"
              )
            }
          />

          {/* =================================================
              SCHEDULED POSTS
          ================================================= */}

          <MenuItem
            label="Scheduled Posts"
            icon="calendar-outline"
            active={isActive(
              "scheduledpost"
            )}
            onPress={() =>
              navigateTo(
                "scheduledpost"
              )
            }
          />

          {/* =================================================
              IMAGE DESIGN
          ================================================= */}

          <MenuItem
            label="Image Design"
            icon="color-wand-outline"
            active={isActive(
              "createimage"
            )}
            onPress={() =>
              navigateTo(
                "createimage"
              )
            }
          />

          {/* =================================================
              NEWSLETTER
          ================================================= */}

          <MenuItem
            label="Newsletter"
            icon="mail-outline"
            active={isActive(
              "subscriptions"
            )}
            onPress={() =>
              navigateTo(
                "subscriptions"
              )
            }
          />

          {/* =================================================
              SETTINGS
          ================================================= */}

          <MenuItem
            label="Settings"
            icon="settings-outline"
            active={isActive(
              "settings"
            )}
            onPress={() =>
              navigateTo(
                "settings"
              )
            }
          />

        </View>

      </DrawerContentScrollView>

      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <View className="border-t border-gray-700 px-3 pb-8 pt-4">

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="flex-row items-center rounded-xl px-4 py-3"
        >

          <Ionicons
            name="log-out-outline"
            size={22}
            color="#ef4444"
          />

          <Text className="ml-4 text-[15px] font-semibold text-red-400">
            Logout
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
}

/* =========================================================
   ADMIN DRAWER
========================================================= */

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
        />
      )}

      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor:
            "#ffffff",
        },

        headerTintColor:
          "#1f2937",

        headerTitleStyle: {
          fontWeight: "700",
        },

        drawerStyle: {
          width: 300,
          backgroundColor:
            "#1f2937",
        },

        drawerActiveTintColor:
          "#ffffff",

        drawerInactiveTintColor:
          "#9ca3af",

        drawerActiveBackgroundColor:
          "#A8794A",

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "500",
        },
      }}
    >

      {/* ===================================================
          DASHBOARD
      =================================================== */}

      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerLabel:
            "Dashboard",
        }}
      />

      {/* ===================================================
          BLOG INDEX
      =================================================== */}

      <Drawer.Screen
        name="blogs/index"
        options={{
          title:
            "Blog Posts",
          drawerLabel:
            "Blog Posts",
        }}
      />

      {/* ===================================================
          BLOG NEW
      =================================================== */}

      <Drawer.Screen
        name="blogs/new"
        options={{
          title:
            "New Blog Post",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* ===================================================
          BLOG EDIT
      =================================================== */}

      <Drawer.Screen
        name="blogs/[id]"
        options={{
          title:
            "Edit Blog Post",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* ===================================================
          COMMUNITY INDEX
      =================================================== */}

      <Drawer.Screen
        name="community/index"
        options={{
          title:
            "Neighborhoods",
          drawerLabel:
            "Neighborhoods",
        }}
      />

      {/* ===================================================
          COMMUNITY NEW
      =================================================== */}

      <Drawer.Screen
        name="community/new"
        options={{
          title:
            "New Community",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* ===================================================
          COMMUNITY EDIT
      =================================================== */}

      <Drawer.Screen
        name="community/[id]"
        options={{
          title:
            "Edit Community",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* ===================================================
          RESOURCE INDEX
      =================================================== */}

      <Drawer.Screen
        name="resources/index"
        options={{
          title:
            "Resources",
          drawerLabel:
            "Resources",
        }}
      />

      {/* ===================================================
          RESOURCE NEW
      =================================================== */}

      <Drawer.Screen
        name="resources/new"
        options={{
          title:
            "New Resource",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* ===================================================
          LISTINGS
      =================================================== */}

      <Drawer.Screen
        name="listings"
        options={{
          title:
            "Listings",
          drawerLabel:
            "Listings",
        }}
      />

      {/* ===================================================
          LEADS
      =================================================== */}

      <Drawer.Screen
        name="leads"
        options={{
          title:
            "Leads",
          drawerLabel:
            "Leads",
        }}
      />

      {/* ===================================================
          HOME VALUATIONS
      =================================================== */}

      <Drawer.Screen
        name="home-valuations"
        options={{
          title:
            "Home Valuations",
          drawerLabel:
            "Home Valuations",
        }}
      />

      {/* ===================================================
          FAQS
      =================================================== */}

      <Drawer.Screen
        name="faqs"
        options={{
          title:
            "FAQs",
          drawerLabel:
            "FAQs",
        }}
      />

      {/* ===================================================
          TESTIMONIALS
      =================================================== */}

      <Drawer.Screen
        name="testimonials"
        options={{
          title:
            "Testimonials",
          drawerLabel:
            "Testimonials",
        }}
      />

      {/* ===================================================
          SOCIAL POST
      =================================================== */}

      <Drawer.Screen
        name="socialpost"
        options={{
          title:
            "Social Post",
          drawerLabel:
            "Social Post",
        }}
      />

      {/* ===================================================
          SCHEDULED POSTS
      =================================================== */}

      <Drawer.Screen
        name="scheduledpost"
        options={{
          title:
            "Scheduled Posts",
          drawerLabel:
            "Scheduled Posts",
        }}
      />

      {/* ===================================================
          IMAGE DESIGN
      =================================================== */}

      <Drawer.Screen
        name="createimage"
        options={{
          title:
            "Image Design",
          drawerLabel:
            "Image Design",
        }}
      />

      {/* ===================================================
          NEWSLETTER
      =================================================== */}

      <Drawer.Screen
        name="subscriptions"
        options={{
          title:
            "Newsletter",
          drawerLabel:
            "Newsletter",
        }}
      />

      {/* ===================================================
          SETTINGS
      =================================================== */}

      <Drawer.Screen
        name="settings"
        options={{
          title:
            "Settings",
          drawerLabel:
            "Settings",
        }}
      />

    </Drawer>
  );
}
































// import React from "react";

// import {
//   DrawerContentComponentProps,
//   DrawerContentScrollView,
// } from "@react-navigation/drawer";

// import { Drawer } from "expo-router/drawer";

// import { Ionicons } from "@expo/vector-icons";

// import {
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { useAuth } from "../../contexts/AuthContext";


// /* =========================================================
//    TYPES
// ========================================================= */

// type MenuItemProps = {
//   label: string;
//   icon: keyof typeof Ionicons.glyphMap;
//   route: string;
//   active: boolean;
//   onPress: () => void;
// };


// /* =========================================================
//    MENU ITEM
// ========================================================= */

// function MenuItem({
//   label,
//   icon,
//   active,
//   onPress,
// }: MenuItemProps) {
//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       activeOpacity={0.7}
//       className={`mb-1 flex-row items-center rounded-xl px-4 py-3 ${
//         active ? "bg-bronze" : ""
//       }`}
//     >
//       <Ionicons
//         name={icon}
//         size={21}
//         color={
//           active
//             ? "#ffffff"
//             : "#9ca3af"
//         }
//       />

//       <Text
//         className={`ml-4 text-[15px] font-medium ${
//           active
//             ? "text-white"
//             : "text-gray-400"
//         }`}
//       >
//         {label}
//       </Text>
//     </TouchableOpacity>
//   );
// }


// /* =========================================================
//    CUSTOM DRAWER CONTENT
// ========================================================= */

// function CustomDrawerContent(
//   props: DrawerContentComponentProps
// ) {
//   const { signOut } = useAuth();


//   /* =======================================================
//      CURRENT ROUTE
//   ======================================================= */

//   const currentRoute =
//     props.state.routes[
//       props.state.index
//     ]?.name;


//   /* =======================================================
//      ACTIVE ROUTE HELPER
//   ======================================================= */

//   const isActive = (
//     route: string
//   ) => {

//     /* -----------------------------------------------------
//        BLOG ROUTES

//        blogs/index
//        blogs/new
//        blogs/[id]
//     ----------------------------------------------------- */

//     if (
//       route ===
//       "blogs/index"
//     ) {
//       return (
//         currentRoute ===
//           "blogs/index" ||
//         currentRoute ===
//           "blogs/new" ||
//         currentRoute ===
//           "blogs/[id]"
//       );
//     }


//     /* -----------------------------------------------------
//        COMMUNITY ROUTES

//        community/index
//        community/new
//        community/[id]
//     ----------------------------------------------------- */

//     if (
//       route ===
//       "community/index"
//     ) {
//       return (
//         currentRoute ===
//           "community/index" ||
//         currentRoute ===
//           "community/new" ||
//         currentRoute ===
//           "community/[id]"
//       );
//     }


//     /* -----------------------------------------------------
//        RESOURCE ROUTES

//        resources/index
//        resources/new
//     ----------------------------------------------------- */

//     if (
//       route ===
//       "resources/index"
//     ) {
//       return (
//         currentRoute ===
//           "resources/index" ||
//         currentRoute ===
//           "resources/new"
//       );
//     }


//     return (
//       currentRoute === route
//     );
//   };


//   /* =======================================================
//      NAVIGATION
//   ======================================================= */

//   const navigateTo = (
//     route: string
//   ) => {
//     props.navigation.navigate(
//       route as never
//     );
//   };


//   /* =======================================================
//      LOGOUT
//   ======================================================= */

//   const handleLogout =
//     async () => {
//       try {
//         await signOut();
//       } catch (error) {
//         console.error(
//           "Logout failed:",
//           error
//         );
//       }
//     };


//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <View className="flex-1 bg-gray-900">

//       {/* ===================================================
//           HEADER
//       =================================================== */}

//       <View className="items-center border-b border-gray-700 px-6 pb-6 pt-14">

//         <Text className="text-center text-3xl font-semibold uppercase tracking-widest text-white">
//           Admin
//         </Text>

//         <Text className="mt-3 text-center text-xs font-medium uppercase tracking-widest text-gray-400">
//           Panel
//         </Text>

//       </View>


//       {/* ===================================================
//           MENU
//       =================================================== */}

//       <DrawerContentScrollView
//         {...props}
//         contentContainerStyle={{
//           paddingTop: 12,
//           paddingBottom: 12,
//         }}
//         showsVerticalScrollIndicator={
//           false
//         }
//       >

//         <View className="px-3">

//           {/* =================================================
//               DASHBOARD
//           ================================================= */}

//           <MenuItem
//             label="Dashboard"
//             icon="grid-outline"
//             route="index"
//             active={isActive(
//               "index"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "index"
//               )
//             }
//           />


//           {/* =================================================
//               BLOGS
//           ================================================= */}

//           <MenuItem
//             label="Blog Posts"
//             icon="document-text-outline"
//             route="blogs/index"
//             active={isActive(
//               "blogs/index"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "blogs/index"
//               )
//             }
//           />


//           {/* =================================================
//               COMMUNITY
//           ================================================= */}

//           <MenuItem
//             label="Neighborhoods"
//             icon="business-outline"
//             route="community/index"
//             active={isActive(
//               "community/index"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "community/index"
//               )
//             }
//           />


//           {/* =================================================
//               RESOURCES
//           ================================================= */}

//           <MenuItem
//             label="Resources"
//             icon="book-outline"
//             route="resources/index"
//             active={isActive(
//               "resources/index"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "resources/index"
//               )
//             }
//           />


//           {/* =================================================
//               LISTINGS
//           ================================================= */}

//           <MenuItem
//             label="Listings"
//             icon="home-outline"
//             route="listings"
//             active={isActive(
//               "listings"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "listings"
//               )
//             }
//           />


//           {/* =================================================
//               LEADS
//           ================================================= */}

//           <MenuItem
//             label="Leads"
//             icon="people-outline"
//             route="leads"
//             active={isActive(
//               "leads"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "leads"
//               )
//             }
//           />


//           {/* =================================================
//               HOME VALUATIONS
//           ================================================= */}

//           <MenuItem
//             label="Home Valuations"
//             icon="calculator-outline"
//             route="home-valuations"
//             active={isActive(
//               "home-valuations"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "home-valuations"
//               )
//             }
//           />


//           {/* =================================================
//               FAQS
//           ================================================= */}

//           <MenuItem
//             label="FAQs"
//             icon="help-circle-outline"
//             route="faqs"
//             active={isActive(
//               "faqs"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "faqs"
//               )
//             }
//           />


//           {/* =================================================
//               TESTIMONIALS
//           ================================================= */}

//           <MenuItem
//             label="Testimonials"
//             icon="star-outline"
//             route="testimonials"
//             active={isActive(
//               "testimonials"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "testimonials"
//               )
//             }
//           />


//           {/* =================================================
//               SOCIAL POST
//           ================================================= */}

//           <MenuItem
//             label="Social Post"
//             icon="image-outline"
//             route="socialpost"
//             active={isActive(
//               "socialpost"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "socialpost"
//               )
//             }
//           />


//           {/* =================================================
//               SCHEDULED POSTS
//           ================================================= */}

//           <MenuItem
//             label="Scheduled Posts"
//             icon="calendar-outline"
//             route="scheduledpost"
//             active={isActive(
//               "scheduledpost"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "scheduledpost"
//               )
//             }
//           />


//           {/* =================================================
//               IMAGE DESIGN
//           ================================================= */}

//           <MenuItem
//             label="Image Design"
//             icon="color-wand-outline"
//             route="createimage"
//             active={isActive(
//               "createimage"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "createimage"
//               )
//             }
//           />


//           {/* =================================================
//               NEWSLETTER
//           ================================================= */}

//           <MenuItem
//             label="Newsletter"
//             icon="mail-outline"
//             route="subscriptions"
//             active={isActive(
//               "subscriptions"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "subscriptions"
//               )
//             }
//           />


//           {/* =================================================
//               SETTINGS
//           ================================================= */}

//           <MenuItem
//             label="Settings"
//             icon="settings-outline"
//             route="settings"
//             active={isActive(
//               "settings"
//             )}
//             onPress={() =>
//               navigateTo(
//                 "settings"
//               )
//             }
//           />

//         </View>

//       </DrawerContentScrollView>


//       {/* =====================================================
//           LOGOUT
//       ===================================================== */}

//       <View className="border-t border-gray-700 px-3 pb-8 pt-4">

//         <TouchableOpacity
//           onPress={handleLogout}
//           activeOpacity={0.7}
//           className="flex-row items-center rounded-xl px-4 py-3"
//         >

//           <Ionicons
//             name="log-out-outline"
//             size={22}
//             color="#ef4444"
//           />

//           <Text className="ml-4 text-[15px] font-semibold text-red-400">
//             Logout
//           </Text>

//         </TouchableOpacity>

//       </View>

//     </View>
//   );
// }


// /* =========================================================
//    ADMIN DRAWER
// ========================================================= */

// export default function AdminLayout() {
//   return (
//     <Drawer
//       drawerContent={(props) => (
//         <CustomDrawerContent
//           {...props}
//         />
//       )}

//       screenOptions={{
//         headerShown: true,

//         headerStyle: {
//           backgroundColor:
//             "#ffffff",
//         },

//         headerTintColor:
//           "#1f2937",

//         headerTitleStyle: {
//           fontWeight: "700",
//         },

//         drawerStyle: {
//           width: 300,
//           backgroundColor:
//             "#1f2937",
//         },

//         drawerActiveTintColor:
//           "#ffffff",

//         drawerInactiveTintColor:
//           "#9ca3af",

//         drawerActiveBackgroundColor:
//           "#A8794A",

//         drawerLabelStyle: {
//           fontSize: 15,
//           fontWeight: "500",
//         },
//       }}
//     >

//       {/* ===================================================
//           DASHBOARD
//       =================================================== */}

//       <Drawer.Screen
//         name="index"
//         options={{
//           title: "Dashboard",
//           drawerLabel:
//             "Dashboard",
//         }}
//       />


//       {/* ===================================================
//           BLOG INDEX
//       =================================================== */}

//       <Drawer.Screen
//         name="blogs/index"
//         options={{
//           title:
//             "Blog Posts",
//           drawerLabel:
//             "Blog Posts",
//         }}
//       />


//       {/* ===================================================
//           BLOG NEW
//       =================================================== */}

//       <Drawer.Screen
//         name="blogs/new"
//         options={{
//           title:
//             "New Blog Post",
//           drawerItemStyle: {
//             display: "none",
//           },
//         }}
//       />


//       {/* ===================================================
//           BLOG EDIT
//       =================================================== */}

//       <Drawer.Screen
//         name="blogs/[id]"
//         options={{
//           title:
//             "Edit Blog Post",
//           drawerItemStyle: {
//             display: "none",
//           },
//         }}
//       />


//       {/* ===================================================
//           COMMUNITY INDEX
//       =================================================== */}

//       <Drawer.Screen
//         name="community/index"
//         options={{
//           title:
//             "Neighborhoods",
//           drawerLabel:
//             "Neighborhoods",
//         }}
//       />


//       {/* ===================================================
//           COMMUNITY NEW
//       =================================================== */}

//       <Drawer.Screen
//         name="community/new"
//         options={{
//           title:
//             "New Community",
//           drawerItemStyle: {
//             display: "none",
//           },
//         }}
//       />


//       {/* ===================================================
//           COMMUNITY EDIT
//       =================================================== */}

//       <Drawer.Screen
//         name="community/[id]"
//         options={{
//           title:
//             "Edit Community",
//           drawerItemStyle: {
//             display: "none",
//           },
//         }}
//       />


//       {/* ===================================================
//           RESOURCE INDEX
//       =================================================== */}

//       <Drawer.Screen
//         name="resources/index"
//         options={{
//           title:
//             "Resources",
//           drawerLabel:
//             "Resources",
//         }}
//       />


//       {/* ===================================================
//           RESOURCE NEW
//       =================================================== */}

//       <Drawer.Screen
//         name="resources/new"
//         options={{
//           title:
//             "New Resource",
//           drawerItemStyle: {
//             display: "none",
//           },
//         }}
//       />


//       {/* ===================================================
//           LISTINGS
//       =================================================== */}

//       <Drawer.Screen
//         name="listings"
//         options={{
//           title:
//             "Listings",
//           drawerLabel:
//             "Listings",
//         }}
//       />


//       {/* ===================================================
//           LEADS
//       =================================================== */}

//       <Drawer.Screen
//         name="leads"
//         options={{
//           title:
//             "Leads",
//           drawerLabel:
//             "Leads",
//         }}
//       />


//       {/* ===================================================
//           HOME VALUATIONS
//       =================================================== */}

//       <Drawer.Screen
//         name="home-valuations"
//         options={{
//           title:
//             "Home Valuations",
//           drawerLabel:
//             "Home Valuations",
//         }}
//       />


//       {/* ===================================================
//           FAQS
//       =================================================== */}

//       <Drawer.Screen
//         name="faqs"
//         options={{
//           title:
//             "FAQs",
//           drawerLabel:
//             "FAQs",
//         }}
//       />


//       {/* ===================================================
//           TESTIMONIALS
//       =================================================== */}

//       <Drawer.Screen
//         name="testimonials"
//         options={{
//           title:
//             "Testimonials",
//           drawerLabel:
//             "Testimonials",
//         }}
//       />


//       {/* ===================================================
//           SOCIAL POST
//       =================================================== */}

//       <Drawer.Screen
//         name="socialpost"
//         options={{
//           title:
//             "Social Post",
//           drawerLabel:
//             "Social Post",
//         }}
//       />
      

//       {/* ===================================================
//           SCHEDULED POSTS
//       =================================================== */}

//       <Drawer.Screen
//         name="scheduledpost"
//         options={{
//           title:
//             "Scheduled Posts",
//           drawerLabel:
//             "Scheduled Posts",
//         }}
//       />


//       {/* ===================================================
//           IMAGE DESIGN
//       =================================================== */}

//       <Drawer.Screen
//         name="createimage"
//         options={{
//           title:
//             "Image Design",
//           drawerLabel:
//             "Image Design",
//         }}
//       />



//       {/* ===================================================
//           NEWSLETTER
//       =================================================== */}

//       <Drawer.Screen
//         name="subscriptions"
//         options={{
//           title:
//             "Newsletter",
//           drawerLabel:
//             "Newsletter",
//         }}
//       />


//       {/* ===================================================
//           SETTINGS
//       =================================================== */}

//       <Drawer.Screen
//         name="settings"
//         options={{
//           title:
//             "Settings",
//           drawerLabel:
//             "Settings",
//         }}
//       />

//     </Drawer>
//   );
// }