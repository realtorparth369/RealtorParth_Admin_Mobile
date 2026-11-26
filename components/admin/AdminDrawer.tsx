import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  usePathname,
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  adminMenu,
} from "../../constants/adminMenu";

import AdminMenuItem from "./AdminMenuItem";
import AdminUserCard from "./AdminUserCard";

import {
  useAuth,
} from "../../contexts/AuthContext";

export default function AdminDrawer() {
  const router = useRouter();

  const pathname = usePathname();

  const { user, signOut } =
    useAuth();

  const handleNavigation = (
    path: string
  ) => {
    router.push(path as any);
  };

  const handleSignOut =
    async () => {
      await signOut();

      router.replace("/login");
    };

  return (
    <View className="flex-1 bg-charcoal-dark">
      {/* HEADER */}

      <View className="border-b border-white/10 px-5 pb-5 pt-14">
        <Text className="text-xl font-bold tracking-wider text-white">
          ADMIN
        </Text>

        <Text className="mt-1 text-xs text-gray-400">
          Dashboard Panel
        </Text>
      </View>

      {/* MENU */}

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-4"
        showsVerticalScrollIndicator={false}
      >
        {adminMenu.map((item) => {
          const active =
            item.path === "/(admin)"
              ? pathname === "/"
              : pathname.includes(
                  item.path
                    .replace(
                      "/(admin)",
                      ""
                    )
                );

          return (
            <AdminMenuItem
              key={item.path}
              label={item.label}
              icon={item.icon}
              active={active}
              onPress={() =>
                handleNavigation(
                  item.path
                )
              }
            />
          );
        })}
      </ScrollView>

      {/* FOOTER */}

      <View className="border-t border-white/10 bg-black/10 p-4">
        <AdminUserCard
          email={user?.email}
        />

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          className="mt-3 flex-row items-center rounded-2xl px-4 py-3"
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#f87171"
          />

          <Text className="ml-3 font-medium text-red-400">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}