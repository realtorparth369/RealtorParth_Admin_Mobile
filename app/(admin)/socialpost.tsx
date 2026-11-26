import React, {
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import axios from "axios";

import {
  CalendarDays,
  Check,
  FileText,
  ImageIcon,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";

import { useRouter } from "expo-router";

/* ========================================================================== */
/* API                                                                       */
/* ========================================================================== */

const API_URL = "https://realtorparth.ca";

/* ========================================================================== */
/* Types                                                                     */
/* ========================================================================== */

interface ResultData {
  topic: string;
  caption: string;
  imageURL: string;
  property?: unknown;
}

interface UploadedImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

/* ========================================================================== */
/* Platform Icon                                                             */
/* ========================================================================== */

function PlatformIcon({
  platform,
  selected,
}: {
  platform: "Instagram" | "Facebook";
  selected: boolean;
}) {
  return (
    <View
      className={`h-9 w-9 items-center justify-center rounded-full ${
        selected ? "bg-[#4b2b2b]" : "bg-gray-200"
      }`}
    >
      <Text
        className={`font-bold ${
          selected
            ? "text-white"
            : "text-gray-700"
        }`}
      >
        {platform === "Instagram" ? "◎" : "f"}
      </Text>
    </View>
  );
}

/* ========================================================================== */
/* Social Post Screen                                                        */
/* ========================================================================== */

export default function SocialPostScreen() {
  const router = useRouter();

  /* ------------------------------------------------------------------------ */
  /* Form State                                                               */
  /* ------------------------------------------------------------------------ */

  const [topic, setTopic] = useState<string>("");

  const [mls, setMls] = useState<string>("");

  const [mode, setMode] = useState<
    "topic" | "mls"
  >("topic");

  /* ------------------------------------------------------------------------ */
  /* Generation State                                                         */
  /* ------------------------------------------------------------------------ */

  const [loading, setLoading] =
    useState<boolean>(false);

  const [result, setResult] =
    useState<ResultData | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Scheduling State                                                         */
  /* ------------------------------------------------------------------------ */

  const [selectedDate, setSelectedDate] =
    useState<Date>(new Date());

  const [platforms, setPlatforms] =
    useState<string[]>([]);

  const [scheduledCount, setScheduledCount] =
    useState<number>(0);

  /* ------------------------------------------------------------------------ */
  /* Images                                                                   */
  /* ------------------------------------------------------------------------ */

  const [images, setImages] =
    useState<string[]>([]);

  /* ------------------------------------------------------------------------ */
  /* Date / Time Picker                                                       */
  /* ------------------------------------------------------------------------ */

  const [showDatePicker, setShowDatePicker] =
    useState<boolean>(false);

  const [showTimePicker, setShowTimePicker] =
    useState<boolean>(false);

  /* ------------------------------------------------------------------------ */
  /* Image Preview                                                            */
  /* ------------------------------------------------------------------------ */

  const [previewImage, setPreviewImage] =
    useState<string | null>(null);

  /* ======================================================================== */
  /* Formatted Date                                                           */
  /* ======================================================================== */

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString(
      "en-CA",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }, [selectedDate]);

  /* ======================================================================== */
  /* Formatted Time                                                           */
  /* ======================================================================== */

  const formattedTime = useMemo(() => {
    return selectedDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }, [selectedDate]);

  /* ======================================================================== */
  /* Toggle Platform                                                          */
  /* ======================================================================== */

  const togglePlatform = (
    platform: string
  ): void => {
    setPlatforms((previous) => {
      if (previous.includes(platform)) {
        return previous.filter(
          (item) => item !== platform
        );
      }

      return [...previous, platform];
    });
  };

  /* ======================================================================== */
  /* Generate Post                                                            */
  /* ======================================================================== */

  const generatePost = async (): Promise<void> => {
    /* ---------------------------------------------------------------------- */
    /* Validation                                                             */
    /* ---------------------------------------------------------------------- */

    if (
      mode === "topic" &&
      !topic.trim()
    ) {
      Alert.alert(
        "Topic Required",
        "Please enter a topic."
      );
      return;
    }

    if (
      mode === "mls" &&
      !mls.trim()
    ) {
      Alert.alert(
        "MLS® Number Required",
        "Please enter an MLS® Number."
      );
      return;
    }

    try {
      setLoading(true);

      setResult(null);

      setImages([]);

      let response;

      /* -------------------------------------------------------------------- */
      /* Topic Generator                                                      */
      /* -------------------------------------------------------------------- */

      if (mode === "topic") {
        response = await axios.post(
          `${API_URL}/api/socialpost/generate`,
          {
            topic: topic.trim(),
          }
        );
      }

      /* -------------------------------------------------------------------- */
      /* MLS Generator                                                        */
      /* -------------------------------------------------------------------- */

      else {
        response = await axios.post(
          `${API_URL}/api/socialpost/generate-property`,
          {
            mls: mls
              .trim()
              .toUpperCase(),
          }
        );
      }

      const data = response.data;

      if (!data) {
        throw new Error(
          "Empty response received from server."
        );
      }

      const generatedResult: ResultData = {
        topic:
          typeof data.topic === "string"
            ? data.topic
            : mode === "topic"
              ? topic.trim()
              : mls
                  .trim()
                  .toUpperCase(),

        caption:
          typeof data.caption === "string"
            ? data.caption
            : "",

        imageURL:
          typeof data.imageURL === "string"
            ? data.imageURL
            : "",

        property: data.property,
      };

      setResult(generatedResult);

      if (
        generatedResult.imageURL
      ) {
        setImages([
          generatedResult.imageURL,
        ]);
      }

      // Alert.alert(
      //   "Success",
      //   "Post generated successfully!"
      // );
    } catch (error: unknown) {
      console.error(
        "Generate post error:",
        error
      );

      const message =
        axios.isAxiosError(error)
          ? error.response?.data
              ?.message ||
            "Failed to generate post."
          : "Failed to generate post.";

      Alert.alert(
        "Generation Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================================== */
  /* Copy Caption                                                             */
  /* ======================================================================== */

  const copyCaption = async (): Promise<void> => {
    if (!result?.caption) {
      return;
    }

    try {
      await Clipboard.setStringAsync(
        result.caption
      );

      Alert.alert(
        "Copied",
        "Caption copied successfully."
      );
    } catch (error: unknown) {
      console.error(
        "Copy caption error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to copy caption."
      );
    }
  };

  /* ======================================================================== */
  /* Pick Images                                                              */
  /* ======================================================================== */

  const handleImageUpload =
    async (): Promise<void> => {
      try {
        const remaining =
          10 - images.length;

        if (remaining <= 0) {
          Alert.alert(
            "Maximum Images",
            "Maximum 10 images allowed."
          );
          return;
        }

        /* ------------------------------------------------------------------ */
        /* Permission                                                         */
        /* ------------------------------------------------------------------ */

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Please allow photo library access to upload images."
          );
          return;
        }

        /* ------------------------------------------------------------------ */
        /* Picker                                                             */
        /* ------------------------------------------------------------------ */

        const pickerResult =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ImagePicker.MediaTypeOptions.Images,

              allowsMultipleSelection:
                true,

              selectionLimit:
                remaining,

              quality: 1,
            }
          );

        if (
          pickerResult.canceled ||
          !pickerResult.assets ||
          pickerResult.assets.length ===
            0
        ) {
          return;
        }

        const selectedAssets: UploadedImageAsset[] =
          pickerResult.assets
            .slice(0, remaining)
            .map((asset) => ({
              uri: asset.uri,
              fileName:
                asset.fileName,
              mimeType:
                asset.mimeType,
              fileSize:
                asset.fileSize,
            }));

        /* ------------------------------------------------------------------ */
        /* Validate 5MB                                                       */
        /* ------------------------------------------------------------------ */

        for (const asset of selectedAssets) {
          if (
            typeof asset.fileSize ===
              "number" &&
            asset.fileSize >
              5 * 1024 * 1024
          ) {
            Alert.alert(
              "File Too Large",
              `${asset.fileName || "Image"} exceeds the 5MB limit.`
            );

            return;
          }
        }

        /* ------------------------------------------------------------------ */
        /* Upload                                                             */
        /* ------------------------------------------------------------------ */

        setLoading(true);

        const formData = new FormData();

        selectedAssets.forEach(
          (asset, index) => {
            const fileName =
              asset.fileName ||
              `social-image-${Date.now()}-${index}.jpg`;

            const mimeType =
              asset.mimeType ||
              "image/jpeg";

            formData.append(
              "images",
              {
                uri: asset.uri,
                name: fileName,
                type: mimeType,
              } as unknown as Blob
            );
          }
        );

        const response =
          await axios.post(
            `${API_URL}/api/socialpost/upload-social-images`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const uploadedUrls =
          response.data?.urls;

        if (
          !Array.isArray(uploadedUrls) ||
          uploadedUrls.length === 0
        ) {
          throw new Error(
            "No image URLs were returned by the server."
          );
        }

        setImages((previous) => [
          ...previous,
          ...uploadedUrls.filter(
            (
              url: unknown
            ): url is string =>
              typeof url === "string" &&
              url.trim().length > 0
          ),
        ]);

        Alert.alert(
          "Success",
          `${uploadedUrls.length} image${
            uploadedUrls.length === 1
              ? ""
              : "s"
          } uploaded successfully.`
        );
      } catch (error: unknown) {
        console.error(
          "Upload image error:",
          error
        );

        const message =
          axios.isAxiosError(error)
            ? error.response?.data
                ?.message ||
              "Failed to upload images."
            : "Failed to upload images.";

        Alert.alert(
          "Upload Failed",
          message
        );
      } finally {
        setLoading(false);
      }
    };

  /* ======================================================================== */
  /* Remove Image                                                             */
  /* ======================================================================== */

  const removeImage = (
    index: number
  ): void => {
    setImages((previous) =>
      previous.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  /* ======================================================================== */
  /* Remove Uploaded Images                                                   */
  /* ======================================================================== */

  const removeUploadedImages =
    (): void => {
      if (images.length <= 1) {
        return;
      }

      Alert.alert(
        "Remove Images",
        "Remove all additional uploaded images?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setImages(
                images.slice(0, 1)
              );
            },
          },
        ]
      );
    };

  /* ======================================================================== */
  /* Date Picker                                                              */
  /* ======================================================================== */

  const handleDateChange = (
    event: DateTimePickerEvent,
    date?: Date
  ): void => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (
      event.type === "dismissed" ||
      !date
    ) {
      return;
    }

    const updatedDate =
      new Date(selectedDate);

    updatedDate.setFullYear(
      date.getFullYear()
    );

    updatedDate.setMonth(
      date.getMonth()
    );

    updatedDate.setDate(
      date.getDate()
    );

    setSelectedDate(updatedDate);

    /* ---------------------------------------------------------------------- */
    /* Android: open time picker after date                                  */
    /* ---------------------------------------------------------------------- */

    if (Platform.OS === "android") {
      setTimeout(() => {
        setShowTimePicker(true);
      }, 250);
    }
  };

  /* ======================================================================== */
  /* Time Picker                                                              */
  /* ======================================================================== */

  const handleTimeChange = (
    event: DateTimePickerEvent,
    date?: Date
  ): void => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (
      event.type === "dismissed" ||
      !date
    ) {
      return;
    }

    const updatedDate =
      new Date(selectedDate);

    updatedDate.setHours(
      date.getHours()
    );

    updatedDate.setMinutes(
      date.getMinutes()
    );

    updatedDate.setSeconds(0);

    updatedDate.setMilliseconds(0);

    setSelectedDate(updatedDate);
  };

  /* ======================================================================== */
  /* Schedule Post                                                            */
  /* ======================================================================== */

  const uploadPost = async (): Promise<void> => {
    /* ---------------------------------------------------------------------- */
    /* Validation                                                             */
    /* ---------------------------------------------------------------------- */

    if (!result) {
      Alert.alert(
        "Generate Post",
        "Please generate a post first."
      );
      return;
    }

    if (!selectedDate) {
      Alert.alert(
        "Publish Date",
        "Please select a publish date and time."
      );
      return;
    }

    if (platforms.length === 0) {
      Alert.alert(
        "Social Platforms",
        "Please select at least one social platform."
      );
      return;
    }

    if (images.length === 0) {
      Alert.alert(
        "Images",
        "Please upload at least one image."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${API_URL}/api/socialpost/schedule`,
          {
            topic: result.topic,

            caption: result.caption,

            images,

            platforms,

            publishDate:
              selectedDate,
          }
        );

      if (response.data?.success) {
        setScheduledCount(
          (previous) =>
            previous + 1
        );

        /* ------------------------------------------------------------------ */
        /* Reset                                                              */
        /* ------------------------------------------------------------------ */

        setResult(null);

        setTopic("");

        setMls("");

        setMode("topic");

        setPlatforms([]);

        setImages([]);

        setSelectedDate(
          new Date()
        );

        Alert.alert(
          "Success",
          "Post scheduled successfully."
        );
      } else {
        Alert.alert(
          "Failed",
          response.data?.message ||
            "Failed to schedule post."
        );
      }
    } catch (error: unknown) {
      console.error(
        "Schedule post error:",
        error
      );

      const message =
        axios.isAxiosError(error)
          ? error.response?.data
              ?.message ||
            "Something went wrong while scheduling the post."
          : "Something went wrong while scheduling the post.";

      Alert.alert(
        "Scheduling Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================================== */
  /* Render                                                                   */
  /* ======================================================================== */

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 50,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================== */}
        {/* HEADER                                                             */}
        {/* ================================================================== */}

        <View className="mb-5">
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                AI Social Post Creator
              </Text>

              <Text className="mt-1 text-sm leading-5 text-gray-500">
                Generate branded real estate
                social media content instantly
              </Text>
            </View>

            {/* Scheduled Posts */}
            <Pressable
              onPress={() =>
                router.push(
                  "/(admin)/scheduledpost"
                )
              }
              className="relative h-11 w-11 items-center justify-center rounded-xl border border-gray-300 bg-white"
            >
              <CalendarDays
                size={20}
                color="#374151"
              />

              {scheduledCount > 0 && (
                <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-[#4b2b2b]">
                  <Text className="text-[10px] font-bold text-white">
                    {scheduledCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={generatePost}
            disabled={loading}
            className={`mt-4 flex-row items-center justify-center rounded-xl px-5 py-4 ${
              loading
                ? "bg-gray-400"
                : "bg-[#B8860B]"
            }`}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Sparkles
                size={19}
                color="#ffffff"
              />
            )}

            <Text className="ml-2 font-bold text-white">
              {loading
                ? "Generating..."
                : "Generate Post"}
            </Text>
          </Pressable>
        </View>

        {/* ================================================================== */}
        {/* INPUT CARD                                                         */}
        {/* ================================================================== */}

        <View className="rounded-2xl border border-gray-200 bg-white p-5">
          {/* Mode Switch */}
          <View className="mb-5 flex-row">
            <Pressable
              onPress={() =>
                setMode("topic")
              }
              className={`mr-2 rounded-xl px-5 py-3 ${
                mode === "topic"
                  ? "bg-[#B8860B]"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  mode === "topic"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Topic
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setMode("mls")
              }
              className={`rounded-xl px-5 py-3 ${
                mode === "mls"
                  ? "bg-[#B8860B]"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  mode === "mls"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                MLS® Number
              </Text>
            </Pressable>
          </View>

          {/* ================================================================ */}
          {/* TOPIC                                                            */}
          {/* ================================================================ */}

          {mode === "topic" ? (
            <View>
              <Text className="mb-3 text-sm font-semibold text-gray-700">
                Post Topic
              </Text>

              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="Example: Calgary luxury condos market update"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                className="min-h-[120px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
              />
            </View>
          ) : (
            /* ================================================================ */
            /* MLS                                                              */
            /* ================================================================ */

            <View>
              <Text className="mb-3 text-sm font-semibold text-gray-700">
                MLS® Number
              </Text>

              <TextInput
                value={mls}
                onChangeText={(value) =>
                  setMls(
                    value.toUpperCase()
                  )
                }
                placeholder="Example: A2234567"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                autoCorrect={false}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
              />

              <Text className="mt-2 text-sm leading-5 text-gray-500">
                Enter an Alberta MLS® Number
                to automatically generate a
                branded property post.
              </Text>
            </View>
          )}
        </View>

        {/* ================================================================== */}
        {/* RESULT                                                             */}
        {/* ================================================================== */}

        {result && (
          <View className="mt-5">
            {/* ================================================================ */}
            {/* GENERATED CREATIVE                                              */}
            {/* ================================================================ */}

            <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
                <View className="flex-1 flex-row items-center">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#4b2b2b]/10">
                    <ImageIcon
                      size={20}
                      color="#4b2b2b"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      Generated Creative
                    </Text>

                    <Text className="mt-0.5 text-xs text-gray-500">
                      AI image + uploaded
                      carousel images
                    </Text>
                  </View>
                </View>

                <View className="rounded-full bg-gray-100 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-gray-600">
                    {images.length}/10
                  </Text>
                </View>
              </View>

              <View className="p-5">
                {/* ============================================================ */}
                {/* MAIN IMAGE                                                     */}
                {/* ============================================================ */}

                {images[0] && (
                  <View className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-100">
                    <Pressable
                      onPress={() =>
                        setPreviewImage(
                          images[0]
                        )
                      }
                    >
                      <Image
                        source={{
                          uri: images[0],
                        }}
                        className="h-[380px] w-full"
                        resizeMode="contain"
                      />
                    </Pressable>

                    {/* AI Badge */}
                    <View className="absolute left-4 top-4 rounded-full bg-[#4b2b2b] px-4 py-2">
                      <Text className="text-[10px] font-bold tracking-wide text-white">
                        AI GENERATED
                      </Text>
                    </View>

                    {/* Change Image */}
                    <Pressable
                      onPress={
                        generatePost
                      }
                      disabled={loading}
                      className="absolute right-4 top-4 flex-row items-center rounded-xl bg-black/75 px-3 py-2"
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color="#ffffff"
                        />
                      ) : (
                        <RefreshCw
                          size={14}
                          color="#ffffff"
                        />
                      )}

                      <Text className="ml-2 text-xs font-semibold text-white">
                        Change Image
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* ============================================================ */}
                {/* CAROUSEL IMAGES                                               */}
                {/* ============================================================ */}

                {images.length > 1 && (
                  <View className="mt-6">
                    <View className="mb-4 flex-row items-center justify-between">
                      <View>
                        <Text className="font-semibold text-gray-900">
                          Carousel Images
                        </Text>

                        <Text className="mt-1 text-xs text-gray-500">
                          Additional uploaded
                          images
                        </Text>
                      </View>

                      <Text className="text-xs font-semibold text-gray-400">
                        {images.length - 1}{" "}
                        Added
                      </Text>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={
                        false
                      }
                    >
                      {images
                        .slice(1)
                        .map(
                          (
                            image,
                            index
                          ) => (
                            <View
                              key={`${image}-${index}`}
                              className="mr-3"
                            >
                              <Pressable
                                onPress={() =>
                                  setPreviewImage(
                                    image
                                  )
                                }
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                              >
                                <Image
                                  source={{
                                    uri: image,
                                  }}
                                  className="h-36 w-36"
                                  resizeMode="cover"
                                />

                                <Pressable
                                  onPress={() =>
                                    removeImage(
                                      index +
                                        1
                                    )
                                  }
                                  className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/75"
                                >
                                  <X
                                    size={15}
                                    color="#ffffff"
                                  />
                                </Pressable>
                              </Pressable>
                            </View>
                          )
                        )}

                      {/* Add More */}
                      {images.length <
                        10 && (
                        <Pressable
                          onPress={
                            handleImageUpload
                          }
                          disabled={loading}
                          className="h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
                        >
                          {loading ? (
                            <ActivityIndicator
                              size="small"
                              color="#9ca3af"
                            />
                          ) : (
                            <Upload
                              size={24}
                              color="#9ca3af"
                            />
                          )}

                          <Text className="mt-2 text-sm font-medium text-gray-500">
                            Add More
                          </Text>
                        </Pressable>
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* ============================================================ */}
                {/* IMAGE BUTTONS                                                  */}
                {/* ============================================================ */}

                <View className="mt-7">
                  <Pressable
                    onPress={
                      handleImageUpload
                    }
                    disabled={loading}
                    className="flex-row items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-4"
                  >
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color="#374151"
                      />
                    ) : (
                      <Upload
                        size={17}
                        color="#374151"
                      />
                    )}

                    <Text className="ml-2 font-semibold text-gray-700">
                      Upload Images
                    </Text>
                  </Pressable>

                  {images.length > 1 && (
                    <Pressable
                      onPress={
                        removeUploadedImages
                      }
                      className="mt-3 flex-row items-center justify-center rounded-xl border border-red-200 px-5 py-4"
                    >
                      <Trash2
                        size={17}
                        color="#dc2626"
                      />

                      <Text className="ml-2 font-semibold text-red-600">
                        Remove All Uploaded
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* ================================================================ */}
            {/* CAPTION                                                          */}
            {/* ================================================================ */}

            <View className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <View className="flex-row items-center border-b border-gray-100 px-5 py-4">
                <FileText
                  size={19}
                  color="#4b2b2b"
                />

                <Text className="ml-2 font-semibold text-gray-900">
                  AI Caption
                </Text>
              </View>

              <View className="p-5">
                <Text className="text-sm leading-7 text-gray-700">
                  {result.caption}
                </Text>
              </View>

              <View className="border-t border-gray-100 px-5 py-4">
                <Pressable
                  onPress={
                    copyCaption
                  }
                  className="self-start rounded-lg bg-gray-100 px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    Copy Caption
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ================================================================ */}
            {/* SCHEDULE                                                         */}
            {/* ================================================================ */}

            <View className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <View className="mb-5 flex-row items-center">
                <CalendarDays
                  size={19}
                  color="#4b2b2b"
                />

                <Text className="ml-2 font-semibold text-gray-900">
                  Schedule & Platforms
                </Text>
              </View>

              {/* -------------------------------------------------------------- */}
              {/* DATE / TIME                                                    */}
              {/* -------------------------------------------------------------- */}

              <Text className="mb-3 text-sm font-semibold text-gray-700">
                Publish Date & Time
              </Text>

              <View className="flex-row">
                {/* Date */}
                <Pressable
                  onPress={() =>
                    setShowDatePicker(
                      true
                    )
                  }
                  className="mr-2 flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <CalendarDays
                    size={18}
                    color="#374151"
                  />

                  <Text className="mt-2 text-xs text-gray-500">
                    Date
                  </Text>

                  <Text className="mt-1 text-sm font-bold text-gray-900">
                    {formattedDate}
                  </Text>
                </Pressable>

                {/* Time */}
                <Pressable
                  onPress={() =>
                    setShowTimePicker(
                      true
                    )
                  }
                  className="ml-2 flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <RefreshCw
                    size={18}
                    color="#374151"
                  />

                  <Text className="mt-2 text-xs text-gray-500">
                    Time
                  </Text>

                  <Text className="mt-1 text-sm font-bold text-gray-900">
                    {formattedTime}
                  </Text>
                </Pressable>
              </View>

              {/* -------------------------------------------------------------- */}
              {/* PLATFORMS                                                      */}
              {/* -------------------------------------------------------------- */}

              <Text className="mb-3 mt-6 text-sm font-semibold text-gray-700">
                Social Platforms
              </Text>

              {/* Instagram */}
              <Pressable
                onPress={() =>
                  togglePlatform(
                    "Instagram"
                  )
                }
                className={`mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4 ${
                  platforms.includes(
                    "Instagram"
                  )
                    ? "border-[#4b2b2b] bg-[#4b2b2b]/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <PlatformIcon
                    platform="Instagram"
                    selected={platforms.includes(
                      "Instagram"
                    )}
                  />

                  <Text className="ml-3 font-medium text-gray-800">
                    Instagram
                  </Text>
                </View>

                {platforms.includes(
                  "Instagram"
                ) && (
                  <Check
                    size={20}
                    color="#4b2b2b"
                  />
                )}
              </Pressable>

              {/* Facebook */}
              <Pressable
                onPress={() =>
                  togglePlatform(
                    "Facebook"
                  )
                }
                className={`mb-3 flex-row items-center justify-between rounded-xl border px-4 py-4 ${
                  platforms.includes(
                    "Facebook"
                  )
                    ? "border-[#4b2b2b] bg-[#4b2b2b]/10"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center">
                  <PlatformIcon
                    platform="Facebook"
                    selected={platforms.includes(
                      "Facebook"
                    )}
                  />

                  <Text className="ml-3 font-medium text-gray-800">
                    Facebook
                  </Text>
                </View>

                {platforms.includes(
                  "Facebook"
                ) && (
                  <Check
                    size={20}
                    color="#4b2b2b"
                  />
                )}
              </Pressable>

              {/* -------------------------------------------------------------- */}
              {/* SCHEDULE BUTTON                                                */}
              {/* -------------------------------------------------------------- */}

              <Pressable
                onPress={
                  uploadPost
                }
                disabled={loading}
                className={`mt-5 flex-row items-center justify-center rounded-xl px-5 py-4 ${
                  loading
                    ? "bg-gray-400"
                    : "bg-[#4b2b2b]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />
                ) : (
                  <Upload
                    size={18}
                    color="#ffffff"
                  />
                )}

                <Text className="ml-2 font-bold text-white">
                  {loading
                    ? "Scheduling..."
                    : "Schedule & Upload Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================================================================== */}
      {/* DATE PICKER                                                          */}
      {/* ==================================================================== */}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          minimumDate={new Date()}
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          onChange={
            handleDateChange
          }
        />
      )}

      {/* ==================================================================== */}
      {/* TIME PICKER                                                          */}
      {/* ==================================================================== */}

      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={
            Platform.OS === "ios"
              ? "spinner"
              : "default"
          }
          onChange={
            handleTimeChange
          }
        />
      )}

      {/* ==================================================================== */}
      {/* IMAGE PREVIEW                                                        */}
      {/* ==================================================================== */}

      <Modal
        visible={
          previewImage !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setPreviewImage(null)
        }
      >
        <View className="flex-1 items-center justify-center bg-black/90 px-5">
          {/* Close */}
          <Pressable
            onPress={() =>
              setPreviewImage(null)
            }
            className="absolute right-5 top-14 z-10 h-11 w-11 items-center justify-center rounded-full bg-white/20"
          >
            <X
              size={22}
              color="#ffffff"
            />
          </Pressable>

          {previewImage && (
            <Image
              source={{
                uri: previewImage,
              }}
              className="h-[75%] w-full"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}