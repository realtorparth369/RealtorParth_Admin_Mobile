import {
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerClassName="p-5"
    >
      <Text className="text-2xl font-bold text-gray-900">
        Settings
      </Text>

      <View className="mt-5 rounded-2xl bg-white p-5">
        <Text className="text-gray-500">
          Settings management will appear here.
        </Text>
      </View>
    </ScrollView>
  );
}