import {
  Text,
  TouchableOpacity,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
};

export default function AdminMenuItem({
  label,
  icon,
  active = false,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`mb-1 flex-row items-center rounded-2xl px-4 py-3.5 ${
        active
          ? "bg-bronze"
          : "bg-transparent"
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
        className={`ml-3 flex-1 text-base font-medium ${
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