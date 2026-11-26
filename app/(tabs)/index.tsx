import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100 px-6">
      <View className="w-full rounded-2xl bg-white p-6">
        <Text className="text-center text-3xl font-bold text-blue-600">
          Realtor Parth
        </Text>

        <Text className="mt-2 text-center text-base text-gray-500">
          Admin Mobile App
        </Text>

        <View className="mt-6 rounded-xl bg-blue-600 p-4">
          <Text className="text-center text-lg font-semibold text-white">
            NativeWind is Working! 🎉
          </Text>
        </View>
      </View>
    </View>
  );
}