import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  DrawerActions,
} from "@react-navigation/native";

import {
  useNavigation,
} from "expo-router";

type Props = {
  title: string;
};

export default function AdminHeader({
  title,
}: Props) {
  const navigation =
    useNavigation();

  const openDrawer = () => {
    navigation.dispatch(
      DrawerActions.openDrawer()
    );
  };

  return (
    <View className="h-16 flex-row items-center border-b border-gray-200 bg-white px-4">
      <TouchableOpacity
        onPress={openDrawer}
        activeOpacity={0.7}
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        <Ionicons
          name="menu-outline"
          size={26}
          color="#1f2937"
        />
      </TouchableOpacity>

      <View className="flex-1 items-center">
        <Text className="text-base font-bold text-gray-900">
          {title}
        </Text>
      </View>

      <View className="h-10 w-10" />
    </View>
  );
}