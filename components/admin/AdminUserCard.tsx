import {
  Text,
  View,
} from "react-native";

type Props = {
  email?: string;
};

export default function AdminUserCard({
  email,
}: Props) {
  const firstLetter =
    email?.[0]?.toUpperCase() ||
    "A";

  return (
    <View className="flex-row items-center rounded-2xl bg-white/5 px-3 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-bronze/20">
        <Text className="font-bold text-bronze">
          {firstLetter}
        </Text>
      </View>

      <View className="ml-3 flex-1">
        <Text
          numberOfLines={1}
          className="text-sm font-medium text-white"
        >
          {email || "Administrator"}
        </Text>

        <Text className="mt-0.5 text-xs text-gray-400">
          Administrator
        </Text>
      </View>
    </View>
  );
}