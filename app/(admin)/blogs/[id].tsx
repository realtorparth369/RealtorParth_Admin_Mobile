import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import DateTimePicker from "@react-native-community/datetimepicker";

import axios from "axios";

const API_URL = "https://realtorparth.ca";

interface BlogFormData {
  title: string;
  author: string;
  content: string;
  tags: string;
  imageURL: string;
  publishDate: string;
}

export default function BlogEditorScreen() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [imageMode, setImageMode] =
    useState<"upload" | "url">(
      "upload"
    );

  const [imageUri, setImageUri] =
    useState<string | null>(null);

  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(
      null
    );

  /* =========================================================
     DATE PICKER STATE
  ========================================================= */

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [formData, setFormData] =
    useState<BlogFormData>({
      title: "",
      author: "Parth Brahmbhatt",
      content: "",
      tags: "",
      imageURL: "",
      publishDate: "",
    });

  /* =========================================================
     FETCH BLOG
  ========================================================= */

  useEffect(() => {
    if (!id) return;

    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_URL}/api/blogging/blogs`
      );

      const blog = res.data.find(
        (b: any) => b._id === id
      );

      if (!blog) {
        throw new Error(
          "Blog not found"
        );
      }

      const savedPublishDate =
        blog.publishDate || "";

      setFormData({
        title: blog.title || "",
        author:
          blog.author ||
          "Parth Brahmbhatt",
        content: blog.content || "",
        tags: (
          blog.tags || []
        ).join(", "),
        imageURL:
          blog.imageURL || "",
        publishDate:
          savedPublishDate,
      });

      /* =====================================================
         CONVERT SAVED DATE TO DATE OBJECT
      ===================================================== */

      if (savedPublishDate) {

        const parsedDate =
          parsePublishDate(
            savedPublishDate
          );

        if (parsedDate) {
          setSelectedDate(parsedDate);
        }
      }

      /* =====================================================
         IMAGE
      ===================================================== */

      if (blog.imageURL) {

        setImageMode("url");

        setImageUri(
          blog.imageURL
        );

      } else if (blog.image) {

        setImageMode("upload");

        setImageUri(
          `${API_URL}/api/blogging/uploads/${blog.image}`
        );
      }

    } catch (error) {

      console.error(
        "Failed to fetch blog:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to load blog."
      );

      router.replace(
        "/(admin)/blogs"
      );

    } finally {

      setLoading(false);

    }
  };

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  const formatDate = (date: Date) => {

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const year =
      date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const parsePublishDate = (
    value: string
  ): Date | null => {

    if (!value) {
      return null;
    }

    /* =====================================================
       DD/MM/YYYY
    ===================================================== */

    const ddmmyyyy =
      value.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );

    if (ddmmyyyy) {

      const day =
        Number(ddmmyyyy[1]);

      const month =
        Number(ddmmyyyy[2]) - 1;

      const year =
        Number(ddmmyyyy[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    /* =====================================================
       YYYY-MM-DD
    ===================================================== */

    const yyyymmdd =
      value.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      );

    if (yyyymmdd) {

      const year =
        Number(yyyymmdd[1]);

      const month =
        Number(yyyymmdd[2]) - 1;

      const day =
        Number(yyyymmdd[3]);

      const date =
        new Date(
          year,
          month,
          day
        );

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    /* =====================================================
       FALLBACK FOR ISO DATE / OTHER API FORMAT
    ===================================================== */

    const fallback =
      new Date(value);

    if (
      !Number.isNaN(
        fallback.getTime()
      )
    ) {
      return fallback;
    }

    return null;
  };

  /* =========================================================
     DATE PICKER
  ========================================================= */

  const openDatePicker = () => {

    if (saving) {
      return;
    }

    setShowDatePicker(true);
  };

  const handleDateChange = (
    event: any,
    date?: Date
  ) => {

    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (
      event?.type ===
      "dismissed"
    ) {
      return;
    }

    if (date) {

      setSelectedDate(date);

      updateField(
        "publishDate",
        formatDate(date)
      );
    }
  };

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  const updateField = (
    field: keyof BlogFormData,
    value: string
  ) => {

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================================================
     PICK IMAGE
  ========================================================= */

  const pickImage = async () => {

    try {

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {

        Alert.alert(
          "Permission Required",
          "Please allow photo library access."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker.MediaTypeOptions.Images,

            allowsEditing:
              true,

            aspect: [16, 9],

            quality: 0.85,
          }
        );

      if (
        !result.canceled &&
        result.assets.length > 0
      ) {

        const asset =
          result.assets[0];

        setImageAsset(asset);

        setImageUri(
          asset.uri
        );

        setImageMode(
          "upload"
        );
      }

    } catch (error) {

      console.error(
        "Image picker error:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to select image."
      );
    }
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {

    if (!formData.title.trim()) {

      Alert.alert(
        "Validation",
        "Please enter a blog title."
      );

      return;
    }

    if (!formData.content.trim()) {

      Alert.alert(
        "Validation",
        "Please enter blog content."
      );

      return;
    }

    try {

      setSaving(true);

      /* =====================================================
         UPLOAD IMAGE
      ===================================================== */

      if (
        imageMode === "upload" &&
        imageAsset
      ) {

        const data =
          new FormData();

        data.append(
          "title",
          formData.title.trim()
        );

        data.append(
          "author",
          formData.author.trim()
        );

        data.append(
          "content",
          formData.content
        );

        data.append(
          "tags",
          formData.tags
        );

        data.append(
          "publishDate",
          formData.publishDate
        );

        data.append(
          "image",
          {
            uri:
              imageAsset.uri,

            name:
              imageAsset.fileName ||
              `blog-${Date.now()}.jpg`,

            type:
              imageAsset.mimeType ||
              "image/jpeg",

          } as any
        );

        await axios.put(
          `${API_URL}/api/blogging/blogs/${id}`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      } else {

        /* =================================================
           URL / NO IMAGE
        ================================================= */

        await axios.put(
          `${API_URL}/api/blogging/blogs/${id}`,
          {
            title:
              formData.title.trim(),

            author:
              formData.author.trim(),

            content:
              formData.content,

            tags:
              formData.tags,

            imageURL:
              formData.imageURL,

            publishDate:
              formData.publishDate,
          }
        );
      }

      Alert.alert(
        "Success",
        "Blog post updated successfully.",
        [
          {
            text: "OK",
            onPress: () =>
              router.push(
                "/(admin)/blogs"
              ),
          },
        ]
      );

    } catch (error: any) {

      console.error(
        "Failed to update blog:",
        error?.response?.data ||
        error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
        "Failed to update blog."
      );

    } finally {

      setSaving(false);

    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <View className="flex-1 items-center justify-center bg-gray-100">

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text className="mt-3 text-gray-500">
          Loading blog...
        </Text>

      </View>
    );
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToBlogList = () => {

    router.push(
      "/blogs"
    );
  };

  const handleBack = () => {

    if (saving) {
      return;
    }

    goToBlogList();
  };

  /* =========================================================
     UI
  ========================================================= */

  return (

    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        className="flex-1"

        contentContainerClassName="
          p-5
          pb-10
        "

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={false}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View className="flex-row items-center justify-between">

          <View className="flex-row items-center">

            <Pressable
              onPress={handleBack}
              disabled={saving}

              className="
                mr-3
                rounded-xl
                bg-white
                p-3
              "
            >

              <Ionicons
                name="arrow-back"
                size={21}
                color="#374151"
              />

            </Pressable>

            <View>

              <Text
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                Edit Blog Post
              </Text>

              <Text
                className="
                  text-sm
                  text-gray-500
                "
              >
                Update your article
              </Text>

            </View>

          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}

            className="
              rounded-xl
              bg-bronze
              px-4
              py-3
            "
          >

            {saving ? (

              <ActivityIndicator
                color="#ffffff"
              />

            ) : (

              <Text
                className="
                  font-bold
                  text-white
                "
              >
                Update
              </Text>

            )}

          </Pressable>

        </View>

        {/* =================================================
            CONTENT
        ================================================= */}

        <View
          className="
            mt-6
            rounded-2xl
            border
            border-gray-100
            bg-white
            p-5
          "
        >

          <Text
            className="
              mb-2
              font-semibold
              text-gray-800
            "
          >
            Title
          </Text>

          <TextInput
            value={
              formData.title
            }

            onChangeText={(value) =>
              updateField(
                "title",
                value
              )
            }

            placeholder="Blog title"

            placeholderTextColor="#9ca3af"

            editable={!saving}

            className="
              rounded-xl
              border
              border-gray-200
              px-4
              py-3
              text-gray-900
            "
          />

          <Text
            className="
              mb-2
              mt-5
              font-semibold
              text-gray-800
            "
          >
            Content
          </Text>

          <TextInput
            value={
              formData.content
            }

            onChangeText={(value) =>
              updateField(
                "content",
                value
              )
            }

            placeholder="Write your content here..."

            placeholderTextColor="#9ca3af"

            multiline

            textAlignVertical="top"

            editable={!saving}

            className="
              min-h-[300px]
              rounded-xl
              border
              border-gray-200
              px-4
              py-3
              text-gray-900
            "
          />

        </View>

        {/* =================================================
            META
        ================================================= */}

        <View
          className="
            mt-5
            rounded-2xl
            border
            border-gray-100
            bg-white
            p-5
          "
        >

          <Text
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >
            Meta
          </Text>

          {/* AUTHOR */}

          <Text
            className="
              mb-2
              mt-4
              font-semibold
              text-gray-800
            "
          >
            Author
          </Text>

          <TextInput
            value={
              formData.author
            }

            onChangeText={(value) =>
              updateField(
                "author",
                value
              )
            }

            placeholder="Author"

            placeholderTextColor="#9ca3af"

            editable={!saving}

            className="
              rounded-xl
              border
              border-gray-200
              px-4
              py-3
              text-gray-900
            "
          />

          {/* TAGS */}

          <Text
            className="
              mb-2
              mt-4
              font-semibold
              text-gray-800
            "
          >
            Tags
          </Text>

          <TextInput
            value={
              formData.tags
            }

            onChangeText={(value) =>
              updateField(
                "tags",
                value
              )
            }

            placeholder="Tags (comma separated)"

            placeholderTextColor="#9ca3af"

            editable={!saving}

            className="
              rounded-xl
              border
              border-gray-200
              px-4
              py-3
              text-gray-900
            "
          />

          {/* =================================================
              PUBLISH DATE
          ================================================= */}

          <Text
            className="
              mb-2
              mt-4
              font-semibold
              text-gray-800
            "
          >
            Publish Date
          </Text>

          <Pressable
            onPress={
              openDatePicker
            }

            disabled={saving}

            className="
              flex-row
              items-center
              justify-between
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
            "
          >

            <Text
              className={
                formData.publishDate
                  ? "text-gray-900"
                  : "text-gray-400"
              }
            >
              {formData.publishDate ||
                "Select publish date"}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={21}
              color="#A8794A"
            />

          </Pressable>

          {/* =================================================
              DATE PICKER
          ================================================= */}

          {showDatePicker && (

            <DateTimePicker
              value={
                selectedDate ||
                new Date()
              }

              mode="date"

              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }

              onChange={
                handleDateChange
              }

              minimumDate={
                new Date(
                  2000,
                  0,
                  1
                )
              }

              maximumDate={
                new Date(
                  2100,
                  11,
                  31
                )
              }
            />

          )}

          {/* =================================================
              IOS DONE
          ================================================= */}

          {showDatePicker &&
            Platform.OS === "ios" && (

              <Pressable
                onPress={() =>
                  setShowDatePicker(
                    false
                  )
                }

                className="
                  mt-2
                  items-center
                  rounded-xl
                  bg-bronze
                  px-4
                  py-3
                "
              >

                <Text
                  className="
                    font-bold
                    text-white
                  "
                >
                  Done
                </Text>

              </Pressable>

            )}

        </View>

        {/* =================================================
            IMAGE
        ================================================= */}

        <View
          className="
            mt-5
            rounded-2xl
            border
            border-gray-100
            bg-white
            p-5
          "
        >

          <Text
            className="
              text-lg
              font-bold
              text-gray-900
            "
          >
            Cover Image
          </Text>

          <View
            className="
              mt-4
              flex-row
            "
          >

            {/* UPLOAD */}

            <Pressable
              onPress={() =>
                setImageMode(
                  "upload"
                )
              }

              disabled={saving}

              className={`
                flex-1
                items-center
                rounded-xl
                px-4
                py-3
                ${
                  imageMode ===
                  "upload"
                    ? "bg-bronze"
                    : "border border-gray-200 bg-white"
                }
              `}
            >

              <Text
                className={`
                  font-bold
                  ${
                    imageMode ===
                    "upload"
                      ? "text-white"
                      : "text-gray-700"
                  }
                `}
              >
                Upload
              </Text>

            </Pressable>

            {/* URL */}

            <Pressable
              onPress={() =>
                setImageMode(
                  "url"
                )
              }

              disabled={saving}

              className={`
                ml-2
                flex-1
                items-center
                rounded-xl
                px-4
                py-3
                ${
                  imageMode ===
                  "url"
                    ? "bg-bronze"
                    : "border border-gray-200 bg-white"
                }
              `}
            >

              <Text
                className={`
                  font-bold
                  ${
                    imageMode ===
                    "url"
                      ? "text-white"
                      : "text-gray-700"
                  }
                `}
              >
                URL
              </Text>

            </Pressable>

          </View>

          {/* =================================================
              IMAGE UPLOAD
          ================================================= */}

          {imageMode ===
          "upload" ? (

            <Pressable
              onPress={
                pickImage
              }

              disabled={saving}

              className="
                mt-4
                items-center
                rounded-xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                px-4
                py-6
              "
            >

              <Ionicons
                name="cloud-upload-outline"
                size={35}
                color="#A8794A"
              />

              <Text
                className="
                  mt-2
                  font-semibold
                  text-gray-700
                "
              >
                Choose New Image
              </Text>

            </Pressable>

          ) : (

            <TextInput
              value={
                formData.imageURL
              }

              onChangeText={(value) =>
                updateField(
                  "imageURL",
                  value
                )
              }

              placeholder="Image URL"

              placeholderTextColor="#9ca3af"

              autoCapitalize="none"

              autoCorrect={false}

              editable={!saving}

              className="
                mt-4
                rounded-xl
                border
                border-gray-200
                px-4
                py-3
                text-gray-900
              "
            />

          )}

          {/* =================================================
              PREVIEW
          ================================================= */}

          {imageUri && (

            <Image
              source={{
                uri: imageUri,
              }}

              className="
                mt-4
                h-52
                w-full
                rounded-xl
              "

              resizeMode="cover"
            />

          )}

          {imageMode === "url" &&
            formData.imageURL &&
            !imageUri && (

              <Image
                source={{
                  uri:
                    formData.imageURL,
                }}

                className="
                  mt-4
                  h-52
                  w-full
                  rounded-xl
                "

                resizeMode="cover"
              />

            )}

        </View>

        {/* =================================================
            SAVE
        ================================================= */}

        <Pressable
          onPress={
            handleSave
          }

          disabled={saving}

          className="
            mt-6
            items-center
            rounded-xl
            bg-bronze
            px-5
            py-4
          "
        >

          {saving ? (

            <ActivityIndicator
              color="#ffffff"
            />

          ) : (

            <View
              className="
                flex-row
                items-center
              "
            >

              <Ionicons
                name="save-outline"
                size={19}
                color="#ffffff"
              />

              <Text
                className="
                  ml-2
                  font-bold
                  text-white
                "
              >
                Update Blog
              </Text>

            </View>

          )}

        </Pressable>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}


















































// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import { useEffect, useState } from "react";

// import { useLocalSearchParams, useRouter } from "expo-router";

// import { Ionicons } from "@expo/vector-icons";

// import * as ImagePicker from "expo-image-picker";

// import axios from "axios";

// const API_URL = "https://realtorparth.ca";

// interface BlogFormData {
//   title: string;
//   author: string;
//   content: string;
//   tags: string;
//   imageURL: string;
//   publishDate: string;
// }

// export default function BlogEditorScreen() {
//   const router = useRouter();

//   const { id } =
//     useLocalSearchParams<{
//       id: string;
//     }>();

//   const [loading, setLoading] =
//     useState(true);

//   const [saving, setSaving] =
//     useState(false);

//   const [imageMode, setImageMode] =
//     useState<"upload" | "url">(
//       "upload"
//     );

//   const [imageUri, setImageUri] =
//     useState<string | null>(null);

//   const [imageAsset, setImageAsset] =
//     useState<ImagePicker.ImagePickerAsset | null>(
//       null
//     );

//   const [formData, setFormData] =
//     useState<BlogFormData>({
//       title: "",
//       author: "Parth Brahmbhatt",
//       content: "",
//       tags: "",
//       imageURL: "",
//       publishDate: "",
//     });

//   useEffect(() => {
//     if (!id) return;

//     fetchBlog();
//   }, [id]);

//   const fetchBlog = async () => {
//     try {
//       setLoading(true);

//       const res = await axios.get(
//         `${API_URL}/api/blogging/blogs`
//       );

//       const blog = res.data.find(
//         (b: any) => b._id === id
//       );

//       if (!blog) {
//         throw new Error(
//           "Blog not found"
//         );
//       }

//       setFormData({
//         title: blog.title || "",
//         author:
//           blog.author ||
//           "Parth Brahmbhatt",
//         content: blog.content || "",
//         tags: (
//           blog.tags || []
//         ).join(", "),
//         imageURL:
//           blog.imageURL || "",
//         publishDate:
//           blog.publishDate || "",
//       });

//       if (blog.imageURL) {
//         setImageMode("url");
//         setImageUri(
//           blog.imageURL
//         );
//       } else if (blog.image) {
//         setImageMode("upload");

//         setImageUri(
//           `${API_URL}/api/blogging/uploads/${blog.image}`
//         );
//       }
//     } catch (error) {
//       console.error(
//         "Failed to fetch blog:",
//         error
//       );

//       Alert.alert(
//         "Error",
//         "Failed to load blog."
//       );

//       router.replace(
//         "/(admin)/blogs"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateField = (
//     field: keyof BlogFormData,
//     value: string
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const pickImage = async () => {
//     const permission =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (!permission.granted) {
//       Alert.alert(
//         "Permission Required",
//         "Please allow photo library access."
//       );

//       return;
//     }

//     const result =
//       await ImagePicker.launchImageLibraryAsync(
//         {
//           mediaTypes: ImagePicker.MediaTypeOptions.Images,
//           allowsEditing: true,
//           aspect: [16, 9],
//           quality: 0.85,
//         }
//       );

//     if (
//       !result.canceled &&
//       result.assets.length > 0
//     ) {
//       const asset =
//         result.assets[0];

//       setImageAsset(asset);
//       setImageUri(asset.uri);
//       setImageMode("upload");
//     }
//   };

//   const handleSave = async () => {
//     if (!formData.title.trim()) {
//       Alert.alert(
//         "Validation",
//         "Please enter a blog title."
//       );

//       return;
//     }

//     if (!formData.content.trim()) {
//       Alert.alert(
//         "Validation",
//         "Please enter blog content."
//       );

//       return;
//     }

//     try {
//       setSaving(true);

//       if (
//         imageMode === "upload" &&
//         imageAsset
//       ) {
//         const data =
//           new FormData();

//         data.append(
//           "title",
//           formData.title.trim()
//         );

//         data.append(
//           "author",
//           formData.author.trim()
//         );

//         data.append(
//           "content",
//           formData.content
//         );

//         data.append(
//           "tags",
//           formData.tags
//         );

//         data.append(
//           "publishDate",
//           formData.publishDate
//         );

//         data.append(
//           "image",
//           {
//             uri: imageAsset.uri,
//             name:
//               imageAsset.fileName ||
//               `blog-${Date.now()}.jpg`,
//             type:
//               imageAsset.mimeType ||
//               "image/jpeg",
//           } as any
//         );

//         await axios.put(
//           `${API_URL}/api/blogging/blogs/${id}`,
//           data,
//           {
//             headers: {
//               "Content-Type":
//                 "multipart/form-data",
//             },
//           }
//         );
//       } else {
//         await axios.put(
//           `${API_URL}/api/blogging/blogs/${id}`,
//           {
//             title:
//               formData.title.trim(),
//             author:
//               formData.author.trim(),
//             content:
//               formData.content,
//             tags:
//               formData.tags,
//             imageURL:
//               formData.imageURL,
//             publishDate:
//               formData.publishDate,
//           }
//         );
//       }

//       Alert.alert(
//         "Success",
//         "Blog post updated successfully.",
//         [
//           {
//             text: "OK",
//             onPress: () =>
//               router.push(
//                 "/(admin)/blogs"
//               ),
//           },
//         ]
//       );
//     } catch (error: any) {
//       console.error(
//         "Failed to update blog:",
//         error?.response?.data ||
//         error
//       );

//       Alert.alert(
//         "Error",
//         error?.response?.data?.message ||
//         "Failed to update blog."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-100">
//         <ActivityIndicator
//           size="large"
//           color="#A8794A"
//         />

//         <Text className="mt-3 text-gray-500">
//           Loading blog...
//         </Text>
//       </View>
//     );
//   }

//   const goToBlogList = () => {
//     router.push(
//       "/blogs"
//     );
//   };
//   const handleBack = () => {
//     if (saving) {
//       return;
//     }
//     goToBlogList();
//   };

//   return (
//     <KeyboardAvoidingView
//       className="flex-1 bg-gray-100"
//       behavior={
//         Platform.OS === "ios"
//           ? "padding"
//           : undefined
//       }
//     >
//       <ScrollView
//         className="flex-1"
//         contentContainerClassName="p-5 pb-10"
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* HEADER */}

//         <View className="flex-row items-center justify-between">
//           <View className="flex-row items-center">
//             <Pressable
//               onPress={handleBack}
//               className="mr-3 rounded-xl bg-white p-3"
//             >
//               <Ionicons
//                 name="arrow-back"
//                 size={21}
//                 color="#374151"
//               />
//             </Pressable>

//             <View>
//               <Text className="text-xl font-bold text-gray-900">
//                 Edit Blog Post
//               </Text>

//               <Text className="text-sm text-gray-500">
//                 Update your article
//               </Text>
//             </View>
//           </View>

//           <Pressable
//             onPress={handleSave}
//             disabled={saving}
//             className="rounded-xl bg-bronze px-4 py-3"
//           >
//             {saving ? (
//               <ActivityIndicator
//                 color="#ffffff"
//               />
//             ) : (
//               <Text className="font-bold text-white">
//                 Update
//               </Text>
//             )}
//           </Pressable>
//         </View>

//         {/* CONTENT */}

//         <View className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
//           <Text className="mb-2 font-semibold text-gray-800">
//             Title
//           </Text>

//           <TextInput
//             value={formData.title}
//             onChangeText={(value) =>
//               updateField(
//                 "title",
//                 value
//               )
//             }
//             placeholder="Blog title"
//             placeholderTextColor="#9ca3af"
//             className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//           />

//           <Text className="mb-2 mt-5 font-semibold text-gray-800">
//             Content
//           </Text>

//           <TextInput
//             value={formData.content}
//             onChangeText={(value) =>
//               updateField(
//                 "content",
//                 value
//               )
//             }
//             placeholder="Write your content here..."
//             placeholderTextColor="#9ca3af"
//             multiline
//             textAlignVertical="top"
//             className="min-h-[300px] rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//           />
//         </View>

//         {/* META */}

//         <View className="mt-5 rounded-2xl border border-gray-100 bg-white p-5">
//           <Text className="text-lg font-bold text-gray-900">
//             Meta
//           </Text>

//           <Text className="mb-2 mt-4 font-semibold text-gray-800">
//             Author
//           </Text>

//           <TextInput
//             value={formData.author}
//             onChangeText={(value) =>
//               updateField(
//                 "author",
//                 value
//               )
//             }
//             placeholder="Author"
//             placeholderTextColor="#9ca3af"
//             className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//           />

//           <Text className="mb-2 mt-4 font-semibold text-gray-800">
//             Tags
//           </Text>

//           <TextInput
//             value={formData.tags}
//             onChangeText={(value) =>
//               updateField(
//                 "tags",
//                 value
//               )
//             }
//             placeholder="Tags (comma separated)"
//             placeholderTextColor="#9ca3af"
//             className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//           />

//           <Text className="mb-2 mt-4 font-semibold text-gray-800">
//             Publish Date
//           </Text>

//           <TextInput
//             value={
//               formData.publishDate
//             }
//             onChangeText={(value) =>
//               updateField(
//                 "publishDate",
//                 value
//               )
//             }
//             placeholder="DD/MM/YYYY"
//             placeholderTextColor="#9ca3af"
//             className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//           />
//         </View>

//         {/* IMAGE */}

//         <View className="mt-5 rounded-2xl border border-gray-100 bg-white p-5">
//           <Text className="text-lg font-bold text-gray-900">
//             Cover Image
//           </Text>

//           <View className="mt-4 flex-row">
//             <Pressable
//               onPress={() =>
//                 setImageMode(
//                   "upload"
//                 )
//               }
//               className={`flex-1 items-center rounded-xl px-4 py-3 ${imageMode ===
//                   "upload"
//                   ? "bg-bronze"
//                   : "border border-gray-200 bg-white"
//                 }`}
//             >
//               <Text
//                 className={`font-bold ${imageMode ===
//                     "upload"
//                     ? "text-white"
//                     : "text-gray-700"
//                   }`}
//               >
//                 Upload
//               </Text>
//             </Pressable>

//             <Pressable
//               onPress={() =>
//                 setImageMode("url")
//               }
//               className={`ml-2 flex-1 items-center rounded-xl px-4 py-3 ${imageMode === "url"
//                   ? "bg-bronze"
//                   : "border border-gray-200 bg-white"
//                 }`}
//             >
//               <Text
//                 className={`font-bold ${imageMode === "url"
//                     ? "text-white"
//                     : "text-gray-700"
//                   }`}
//               >
//                 URL
//               </Text>
//             </Pressable>
//           </View>

//           {imageMode ===
//             "upload" ? (
//             <Pressable
//               onPress={pickImage}
//               className="mt-4 items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6"
//             >
//               <Ionicons
//                 name="cloud-upload-outline"
//                 size={35}
//                 color="#A8794A"
//               />

//               <Text className="mt-2 font-semibold text-gray-700">
//                 Choose New Image
//               </Text>
//             </Pressable>
//           ) : (
//             <TextInput
//               value={
//                 formData.imageURL
//               }
//               onChangeText={(value) =>
//                 updateField(
//                   "imageURL",
//                   value
//                 )
//               }
//               placeholder="Image URL"
//               placeholderTextColor="#9ca3af"
//               autoCapitalize="none"
//               className="mt-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
//             />
//           )}

//           {/* PREVIEW */}

//           {imageUri && (
//             <Image
//               source={{
//                 uri: imageUri,
//               }}
//               className="mt-4 h-52 w-full rounded-xl"
//               resizeMode="cover"
//             />
//           )}

//           {imageMode === "url" &&
//             formData.imageURL &&
//             !imageUri && (
//               <Image
//                 source={{
//                   uri: formData.imageURL,
//                 }}
//                 className="mt-4 h-52 w-full rounded-xl"
//                 resizeMode="cover"
//               />
//             )}
//         </View>

//         {/* SAVE */}

//         <Pressable
//           onPress={handleSave}
//           disabled={saving}
//           className="mt-6 items-center rounded-xl bg-bronze px-5 py-4"
//         >
//           {saving ? (
//             <ActivityIndicator
//               color="#ffffff"
//             />
//           ) : (
//             <View className="flex-row items-center">
//               <Ionicons
//                 name="save-outline"
//                 size={19}
//                 color="#ffffff"
//               />

//               <Text className="ml-2 font-bold text-white">
//                 Update Blog
//               </Text>
//             </View>
//           )}
//         </Pressable>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }