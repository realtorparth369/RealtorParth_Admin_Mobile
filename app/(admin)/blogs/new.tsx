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

import {
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "expo-router";

import {
    Ionicons,
} from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import DateTimePicker from "@react-native-community/datetimepicker";

import axios from "axios";

import {
    useAuth,
} from "../../../contexts/AuthContext";

/* =========================================================
   API
========================================================= */

const API_URL = "https://realtorparth.ca";

/* =========================================================
   NEW BLOG SCREEN
========================================================= */

export default function NewBlogScreen() {

    const router = useRouter();

    const {
        user,
        loading: authLoading,
    } = useAuth();

    /* =======================================================
       FORM STATE
    ======================================================= */

    const [title, setTitle] = useState("");

    const [author, setAuthor] =
        useState("Parth Brahmbhatt");

    const [content, setContent] = useState("");

    const [tags, setTags] = useState("");

    const [publishDate, setPublishDate] =
        useState("");

    const [imageURL, setImageURL] =
        useState("");

    /* =======================================================
       DATE PICKER STATE
    ======================================================= */

    const [showDatePicker, setShowDatePicker] =
        useState(false);

    const [selectedDate, setSelectedDate] =
        useState<Date | null>(null);

    /* =======================================================
       IMAGE STATE
    ======================================================= */

    const [imageMode, setImageMode] =
        useState<"upload" | "url">("upload");

    const [imageUri, setImageUri] =
        useState<string | null>(null);

    const [imageAsset, setImageAsset] =
        useState<ImagePicker.ImagePickerAsset | null>(
            null
        );

    /* =======================================================
       UI STATE
    ======================================================= */

    const [saving, setSaving] = useState(false);

    /* =========================================================
       AUTH CHECK
    ========================================================= */

    useEffect(() => {

        if (authLoading) {
            return;
        }

        if (!user) {
            router.replace("/login");
        }

    }, [
        user,
        authLoading,
        router,
    ]);

    /* =========================================================
       NAVIGATION
    ========================================================= */

    const goToBlogList = () => {
        router.push("/blogs");
    };

    const handleBack = () => {

        if (saving) {
            return;
        }

        goToBlogList();
    };

    /* =========================================================
       DATE HELPERS
    ========================================================= */

    const formatDate = (date: Date) => {

        const day =
            String(date.getDate()).padStart(2, "0");

        const month =
            String(date.getMonth() + 1).padStart(2, "0");

        const year =
            date.getFullYear();

        return `${day}/${month}/${year}`;
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

        if (event?.type === "dismissed") {
            return;
        }

        if (date) {

            setSelectedDate(date);

            setPublishDate(
                formatDate(date)
            );
        }
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
                    "Please allow photo library access to select a blog image."
                );

                return;
            }

            const result =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [16, 9],
                    quality: 0.85,
                });

            if (
                !result.canceled &&
                result.assets.length > 0
            ) {

                const asset =
                    result.assets[0];

                setImageAsset(asset);

                setImageUri(asset.uri);
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
       SAVE BLOG
    ========================================================= */

    const handleSave = async () => {

        /* =====================================================
           AUTHENTICATION
        ===================================================== */

        if (!user) {

            Alert.alert(
                "Authentication Required",
                "Please login before creating a blog post."
            );

            router.replace("/login");

            return;
        }

        /* =====================================================
           VALIDATION
        ===================================================== */

        if (!title.trim()) {

            Alert.alert(
                "Validation",
                "Please enter a blog title."
            );

            return;
        }

        if (!content.trim()) {

            Alert.alert(
                "Validation",
                "Please enter blog content."
            );

            return;
        }

        try {

            setSaving(true);

            /* =================================================
               UPLOAD IMAGE
            ================================================= */

            if (
                imageMode === "upload" &&
                imageAsset
            ) {

                const formData =
                    new FormData();

                formData.append(
                    "title",
                    title.trim()
                );

                formData.append(
                    "author",
                    author.trim()
                );

                formData.append(
                    "content",
                    content
                );

                formData.append(
                    "tags",
                    tags
                );

                formData.append(
                    "publishDate",
                    publishDate
                );

                /* =============================================
                   REACT NATIVE IMAGE FILE
                ============================================= */

                formData.append(
                    "image",
                    {
                        uri: imageAsset.uri,

                        name:
                            imageAsset.fileName ||
                            `blog-${Date.now()}.jpg`,

                        type:
                            imageAsset.mimeType ||
                            "image/jpeg",

                    } as any
                );

                await axios.post(
                    `${API_URL}/api/blogging/addblog`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

            }

            /* =================================================
               IMAGE URL / NO IMAGE
            ================================================= */

            else {

                await axios.post(
                    `${API_URL}/api/blogging/addblog`,
                    {
                        title: title.trim(),

                        author: author.trim(),

                        content,

                        tags,

                        imageURL,

                        publishDate,
                    }
                );
            }

            /* =================================================
               SUCCESS
            ================================================= */

            setSaving(false);

            Alert.alert(
                "Success",
                "Blog post created successfully.",
                [
                    {
                        text: "OK",
                        onPress: goToBlogList,
                    },
                ],
                {
                    cancelable: false,
                }
            );

        } catch (error: any) {

            console.error(
                "Failed to create blog:",
                error?.response?.data ||
                error
            );

            setSaving(false);

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                "Failed to create blog post."
            );
        }
    };

    /* =========================================================
       AUTH LOADING
    ========================================================= */

    if (authLoading) {

        return (
            <View className="flex-1 items-center justify-center bg-gray-100">

                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-4 text-gray-500">
                    Checking authentication...
                </Text>

            </View>
        );
    }

    /* =========================================================
       NOT LOGGED IN
    ========================================================= */

    if (!user) {

        return (
            <View className="flex-1 items-center justify-center bg-gray-100">

                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-4 text-gray-500">
                    Redirecting to login...
                </Text>

            </View>
        );
    }

    /* =========================================================
       LOGGED IN
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
                                New Blog Post
                            </Text>

                            <Text
                                className="
                                    text-sm
                                    text-gray-500
                                "
                            >
                                Create a new article
                            </Text>

                        </View>

                    </View>

                    {/* =================================================
                        PUBLISH HEADER BUTTON
                    ================================================= */}

                    <Pressable
                        onPress={handleSave}
                        disabled={saving}

                        className={`
                            rounded-xl
                            px-4
                            py-3
                            ${saving
                                ? "bg-gray-400"
                                : "bg-bronze"
                            }
                        `}
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
                                Publish
                            </Text>

                        )}

                    </Pressable>

                </View>

                {/* =================================================
                    MAIN CONTENT
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

                    {/* TITLE */}

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
                        value={title}
                        onChangeText={setTitle}

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

                    {/* CONTENT */}

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
                        value={content}
                        onChangeText={setContent}

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
                        value={author}
                        onChangeText={setAuthor}

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
                        value={tags}
                        onChangeText={setTags}

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
                        DATE
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
                        onPress={openDatePicker}
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
                                publishDate
                                    ? "text-gray-900"
                                    : "text-gray-400"
                            }
                        >
                            {publishDate || "Select publish date"}
                        </Text>

                        <Ionicons
                            name="calendar-outline"
                            size={21}
                            color="#A8794A"
                        />

                    </Pressable>

                    {/* =================================================
                        NATIVE DATE PICKER
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

                            maximumDate={
                                new Date(2100, 11, 31)
                            }

                            minimumDate={
                                new Date(2000, 0, 1)
                            }
                        />

                    )}

                    {/* iOS DONE BUTTON */}

                    {showDatePicker &&
                        Platform.OS === "ios" && (

                            <Pressable
                                onPress={() =>
                                    setShowDatePicker(false)
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
                    COVER IMAGE
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

                    {/* MODE */}

                    <View className="mt-4 flex-row">

                        {/* UPLOAD */}

                        <Pressable
                            onPress={() =>
                                setImageMode("upload")
                            }

                            disabled={saving}

                            className={`
                                flex-1
                                items-center
                                rounded-xl
                                px-4
                                py-3
                                ${imageMode === "upload"
                                    ? "bg-bronze"
                                    : "border border-gray-200 bg-white"
                                }
                            `}
                        >

                            <Text
                                className={`
                                    font-bold
                                    ${imageMode === "upload"
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
                                setImageMode("url")
                            }

                            disabled={saving}

                            className={`
                                ml-2
                                flex-1
                                items-center
                                rounded-xl
                                px-4
                                py-3
                                ${imageMode === "url"
                                    ? "bg-bronze"
                                    : "border border-gray-200 bg-white"
                                }
                            `}
                        >

                            <Text
                                className={`
                                    font-bold
                                    ${imageMode === "url"
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

                    {imageMode === "upload" ? (

                        <Pressable
                            onPress={pickImage}

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
                                Choose Image
                            </Text>

                            <Text
                                className="
                                    mt-1
                                    text-xs
                                    text-gray-400
                                "
                            >
                                Select an image from your device
                            </Text>

                        </Pressable>

                    ) : (

                        /* =================================================
                           IMAGE URL
                        ================================================= */

                        <TextInput
                            value={imageURL}
                            onChangeText={setImageURL}

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
                        IMAGE PREVIEW
                    ================================================= */}

                    {(
                        imageUri ||
                        (
                            imageMode === "url" &&
                            imageURL
                        )
                    ) && (

                        <Image
                            source={{
                                uri:
                                    imageMode === "upload"
                                        ? imageUri!
                                        : imageURL,
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
                    SAVE BUTTON
                ================================================= */}

                <Pressable
                    onPress={handleSave}

                    disabled={saving}

                    className={`
                        mt-6
                        items-center
                        rounded-xl
                        px-5
                        py-4
                        ${saving
                            ? "bg-gray-400"
                            : "bg-bronze"
                        }
                    `}
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
                                Publish Blog
                            </Text>

                        </View>

                    )}

                </Pressable>

            </ScrollView>

        </KeyboardAvoidingView>
    );
}










































// import {
//     ActivityIndicator,
//     Alert,
//     Image,
//     KeyboardAvoidingView,
//     Platform,
//     Pressable,
//     ScrollView,
//     Text,
//     TextInput,
//     View,
// } from "react-native";

// import {
//     useEffect,
//     useState,
// } from "react";

// import {
//     useRouter,
// } from "expo-router";

// import {
//     Ionicons,
// } from "@expo/vector-icons";

// import * as ImagePicker from "expo-image-picker";

// import axios from "axios";

// import {
//     useAuth,
// } from "../../../contexts/AuthContext";

// /* =========================================================
//    API
// ========================================================= */

// const API_URL = "https://realtorparth.ca";

// /* =========================================================
//    NEW BLOG SCREEN
// ========================================================= */

// export default function NewBlogScreen() {

//     const router = useRouter();

//     const {
//         user,
//         loading: authLoading,
//     } = useAuth();

//     /* =======================================================
//        FORM STATE
//     ======================================================= */

//     const [title, setTitle] = useState("");

//     const [author, setAuthor] =
//         useState("Parth Brahmbhatt");

//     const [content, setContent] = useState("");

//     const [tags, setTags] = useState("");

//     const [publishDate, setPublishDate] =
//         useState("");

//     const [imageURL, setImageURL] =
//         useState("");

//     /* =======================================================
//        IMAGE STATE
//     ======================================================= */

//     const [imageMode, setImageMode] =
//         useState<"upload" | "url">("upload");

//     const [imageUri, setImageUri] =
//         useState<string | null>(null);

//     const [imageAsset, setImageAsset] =
//         useState<ImagePicker.ImagePickerAsset | null>(
//             null
//         );

//     /* =======================================================
//        UI STATE
//     ======================================================= */

//     const [saving, setSaving] = useState(false);

//     /* =========================================================
//        AUTH CHECK
//     ========================================================= */

//     useEffect(() => {

//         if (authLoading) {
//             return;
//         }

//         if (!user) {
//             router.replace("/login");
//         }

//     }, [
//         user,
//         authLoading,
//         router,
//     ]);

//     /* =========================================================
//        NAVIGATION
//     ========================================================= */

//     const goToBlogList = () => {
//         router.push("/blogs");
//     };

//     const handleBack = () => {

//         if (saving) {
//             return;
//         }

//         goToBlogList();
//     };

//     /* =========================================================
//        PICK IMAGE
//     ========================================================= */

//     const pickImage = async () => {

//         try {

//             const permission =
//                 await ImagePicker.requestMediaLibraryPermissionsAsync();

//             if (!permission.granted) {

//                 Alert.alert(
//                     "Permission Required",
//                     "Please allow photo library access to select a blog image."
//                 );

//                 return;
//             }

//             const result =
//                 await ImagePicker.launchImageLibraryAsync({
//                     mediaTypes: ImagePicker.MediaTypeOptions.Images,
//                     allowsEditing: true,
//                     aspect: [16, 9],
//                     quality: 0.85,
//                 });

//             if (
//                 !result.canceled &&
//                 result.assets.length > 0
//             ) {

//                 const asset =
//                     result.assets[0];

//                 setImageAsset(asset);

//                 setImageUri(asset.uri);
//             }

//         } catch (error) {

//             console.error(
//                 "Image picker error:",
//                 error
//             );

//             Alert.alert(
//                 "Error",
//                 "Failed to select image."
//             );
//         }
//     };

//     /* =========================================================
//        SAVE BLOG
//     ========================================================= */

//     const handleSave = async () => {

//         /* =====================================================
//            AUTHENTICATION
//         ===================================================== */

//         if (!user) {

//             Alert.alert(
//                 "Authentication Required",
//                 "Please login before creating a blog post."
//             );

//             router.replace("/login");

//             return;
//         }

//         /* =====================================================
//            VALIDATION
//         ===================================================== */

//         if (!title.trim()) {

//             Alert.alert(
//                 "Validation",
//                 "Please enter a blog title."
//             );

//             return;
//         }

//         if (!content.trim()) {

//             Alert.alert(
//                 "Validation",
//                 "Please enter blog content."
//             );

//             return;
//         }

//         try {

//             setSaving(true);

//             /* =================================================
//                UPLOAD IMAGE
//             ================================================= */

//             if (
//                 imageMode === "upload" &&
//                 imageAsset
//             ) {

//                 const formData =
//                     new FormData();

//                 formData.append(
//                     "title",
//                     title.trim()
//                 );

//                 formData.append(
//                     "author",
//                     author.trim()
//                 );

//                 formData.append(
//                     "content",
//                     content
//                 );

//                 formData.append(
//                     "tags",
//                     tags
//                 );

//                 formData.append(
//                     "publishDate",
//                     publishDate
//                 );

//                 /* =============================================
//                    REACT NATIVE IMAGE FILE
//                 ============================================= */

//                 formData.append(
//                     "image",
//                     {
//                         uri: imageAsset.uri,

//                         name:
//                             imageAsset.fileName ||
//                             `blog-${Date.now()}.jpg`,

//                         type:
//                             imageAsset.mimeType ||
//                             "image/jpeg",

//                     } as any
//                 );

//                 await axios.post(
//                     `${API_URL}/api/blogging/addblog`,
//                     formData,
//                     {
//                         headers: {
//                             "Content-Type":
//                                 "multipart/form-data",
//                         },
//                     }
//                 );

//             }

//             /* =================================================
//                IMAGE URL / NO IMAGE
//             ================================================= */

//             else {

//                 await axios.post(
//                     `${API_URL}/api/blogging/addblog`,
//                     {
//                         title: title.trim(),

//                         author: author.trim(),

//                         content,

//                         tags,

//                         imageURL,

//                         publishDate,
//                     }
//                 );
//             }

//             /* =================================================
//                SUCCESS
//             ================================================= */

//             setSaving(false);

//             Alert.alert(
//                 "Success",
//                 "Blog post created successfully.",
//                 [
//                     {
//                         text: "OK",
//                         onPress: goToBlogList,
//                     },
//                 ],
//                 {
//                     cancelable: false,
//                 }
//             );

//         } catch (error: any) {

//             console.error(
//                 "Failed to create blog:",
//                 error?.response?.data ||
//                 error
//             );

//             setSaving(false);

//             Alert.alert(
//                 "Error",
//                 error?.response?.data?.message ||
//                 "Failed to create blog post."
//             );
//         }
//     };

//     /* =========================================================
//        AUTH LOADING
//     ========================================================= */

//     if (authLoading) {

//         return (
//             <View className="flex-1 items-center justify-center bg-gray-100">

//                 <ActivityIndicator
//                     size="large"
//                     color="#A8794A"
//                 />

//                 <Text className="mt-4 text-gray-500">
//                     Checking authentication...
//                 </Text>

//             </View>
//         );
//     }

//     /* =========================================================
//        NOT LOGGED IN
//     ========================================================= */

//     if (!user) {

//         return (
//             <View className="flex-1 items-center justify-center bg-gray-100">

//                 <ActivityIndicator
//                     size="large"
//                     color="#A8794A"
//                 />

//                 <Text className="mt-4 text-gray-500">
//                     Redirecting to login...
//                 </Text>

//             </View>
//         );
//     }

//     /* =========================================================
//        LOGGED IN
//     ========================================================= */

//     return (

//         <KeyboardAvoidingView
//             className="flex-1 bg-gray-100"

//             behavior={
//                 Platform.OS === "ios"
//                     ? "padding"
//                     : undefined
//             }
//         >

//             <ScrollView
//                 className="flex-1"

//                 contentContainerClassName="
//                     p-5
//                     pb-10
//                 "

//                 keyboardShouldPersistTaps="handled"

//                 showsVerticalScrollIndicator={false}
//             >

//                 {/* =================================================
//                     HEADER
//                 ================================================= */}

//                 <View className="flex-row items-center justify-between">

//                     <View className="flex-row items-center">

//                         <Pressable
//                             onPress={handleBack}
//                             disabled={saving}

//                             className="
//                                 mr-3
//                                 rounded-xl
//                                 bg-white
//                                 p-3
//                             "
//                         >

//                             <Ionicons
//                                 name="arrow-back"
//                                 size={21}
//                                 color="#374151"
//                             />

//                         </Pressable>

//                         <View>

//                             <Text
//                                 className="
//                                     text-xl
//                                     font-bold
//                                     text-gray-900
//                                 "
//                             >
//                                 New Blog Post
//                             </Text>

//                             <Text
//                                 className="
//                                     text-sm
//                                     text-gray-500
//                                 "
//                             >
//                                 Create a new article
//                             </Text>

//                         </View>

//                     </View>

//                     {/* =================================================
//                         PUBLISH HEADER BUTTON
//                     ================================================= */}

//                     <Pressable
//                         onPress={handleSave}
//                         disabled={saving}

//                         className={`
//                             rounded-xl
//                             px-4
//                             py-3
//                             ${saving
//                                 ? "bg-gray-400"
//                                 : "bg-bronze"
//                             }
//                         `}
//                     >

//                         {saving ? (

//                             <ActivityIndicator
//                                 color="#ffffff"
//                             />

//                         ) : (

//                             <Text
//                                 className="
//                                     font-bold
//                                     text-white
//                                 "
//                             >
//                                 Publish
//                             </Text>

//                         )}

//                     </Pressable>

//                 </View>

//                 {/* =================================================
//                     MAIN CONTENT
//                 ================================================= */}

//                 <View
//                     className="
//                         mt-6
//                         rounded-2xl
//                         border
//                         border-gray-100
//                         bg-white
//                         p-5
//                     "
//                 >

//                     {/* TITLE */}

//                     <Text
//                         className="
//                             mb-2
//                             font-semibold
//                             text-gray-800
//                         "
//                     >
//                         Title
//                     </Text>

//                     <TextInput
//                         value={title}
//                         onChangeText={setTitle}

//                         placeholder="Blog title"

//                         placeholderTextColor="#9ca3af"

//                         editable={!saving}

//                         className="
//                             rounded-xl
//                             border
//                             border-gray-200
//                             px-4
//                             py-3
//                             text-gray-900
//                         "
//                     />

//                     {/* CONTENT */}

//                     <Text
//                         className="
//                             mb-2
//                             mt-5
//                             font-semibold
//                             text-gray-800
//                         "
//                     >
//                         Content
//                     </Text>

//                     <TextInput
//                         value={content}
//                         onChangeText={setContent}

//                         placeholder="Write your content here..."

//                         placeholderTextColor="#9ca3af"

//                         multiline

//                         textAlignVertical="top"

//                         editable={!saving}

//                         className="
//                             min-h-[300px]
//                             rounded-xl
//                             border
//                             border-gray-200
//                             px-4
//                             py-3
//                             text-gray-900
//                         "
//                     />

//                 </View>

//                 {/* =================================================
//                     META
//                 ================================================= */}

//                 <View
//                     className="
//                         mt-5
//                         rounded-2xl
//                         border
//                         border-gray-100
//                         bg-white
//                         p-5
//                     "
//                 >

//                     <Text
//                         className="
//                             text-lg
//                             font-bold
//                             text-gray-900
//                         "
//                     >
//                         Meta
//                     </Text>

//                     {/* AUTHOR */}

//                     <Text
//                         className="
//                             mb-2
//                             mt-4
//                             font-semibold
//                             text-gray-800
//                         "
//                     >
//                         Author
//                     </Text>

//                     <TextInput
//                         value={author}
//                         onChangeText={setAuthor}

//                         placeholder="Author"

//                         placeholderTextColor="#9ca3af"

//                         editable={!saving}

//                         className="
//                             rounded-xl
//                             border
//                             border-gray-200
//                             px-4
//                             py-3
//                             text-gray-900
//                         "
//                     />

//                     {/* TAGS */}

//                     <Text
//                         className="
//                             mb-2
//                             mt-4
//                             font-semibold
//                             text-gray-800
//                         "
//                     >
//                         Tags
//                     </Text>

//                     <TextInput
//                         value={tags}
//                         onChangeText={setTags}

//                         placeholder="Tags (comma separated)"

//                         placeholderTextColor="#9ca3af"

//                         editable={!saving}

//                         className="
//                             rounded-xl
//                             border
//                             border-gray-200
//                             px-4
//                             py-3
//                             text-gray-900
//                         "
//                     />

//                     {/* DATE */}

//                     <Text
//                         className="
//                             mb-2
//                             mt-4
//                             font-semibold
//                             text-gray-800
//                         "
//                     >
//                         Publish Date
//                     </Text>

//                     <TextInput
//                         value={publishDate}
//                         onChangeText={setPublishDate}

//                         placeholder="DD/MM/YYYY"

//                         placeholderTextColor="#9ca3af"

//                         editable={!saving}

//                         className="
//                             rounded-xl
//                             border
//                             border-gray-200
//                             px-4
//                             py-3
//                             text-gray-900
//                         "
//                     />

//                 </View>

//                 {/* =================================================
//                     COVER IMAGE
//                 ================================================= */}

//                 <View
//                     className="
//                         mt-5
//                         rounded-2xl
//                         border
//                         border-gray-100
//                         bg-white
//                         p-5
//                     "
//                 >

//                     <Text
//                         className="
//                             text-lg
//                             font-bold
//                             text-gray-900
//                         "
//                     >
//                         Cover Image
//                     </Text>

//                     {/* MODE */}

//                     <View className="mt-4 flex-row">

//                         {/* UPLOAD */}

//                         <Pressable
//                             onPress={() =>
//                                 setImageMode("upload")
//                             }

//                             disabled={saving}

//                             className={`
//                                 flex-1
//                                 items-center
//                                 rounded-xl
//                                 px-4
//                                 py-3
//                                 ${imageMode === "upload"
//                                     ? "bg-bronze"
//                                     : "border border-gray-200 bg-white"
//                                 }
//                             `}
//                         >

//                             <Text
//                                 className={`
//                                     font-bold
//                                     ${imageMode === "upload"
//                                         ? "text-white"
//                                         : "text-gray-700"
//                                     }
//                                 `}
//                             >
//                                 Upload
//                             </Text>

//                         </Pressable>

//                         {/* URL */}

//                         <Pressable
//                             onPress={() =>
//                                 setImageMode("url")
//                             }

//                             disabled={saving}

//                             className={`
//                                 ml-2
//                                 flex-1
//                                 items-center
//                                 rounded-xl
//                                 px-4
//                                 py-3
//                                 ${imageMode === "url"
//                                     ? "bg-bronze"
//                                     : "border border-gray-200 bg-white"
//                                 }
//                             `}
//                         >

//                             <Text
//                                 className={`
//                                     font-bold
//                                     ${imageMode === "url"
//                                         ? "text-white"
//                                         : "text-gray-700"
//                                     }
//                                 `}
//                             >
//                                 URL
//                             </Text>

//                         </Pressable>

//                     </View>

//                     {/* =================================================
//                         IMAGE UPLOAD
//                     ================================================= */}

//                     {imageMode === "upload" ? (

//                         <Pressable
//                             onPress={pickImage}

//                             disabled={saving}

//                             className="
//                                 mt-4
//                                 items-center
//                                 rounded-xl
//                                 border
//                                 border-dashed
//                                 border-gray-300
//                                 bg-gray-50
//                                 px-4
//                                 py-6
//                             "
//                         >

//                             <Ionicons
//                                 name="cloud-upload-outline"
//                                 size={35}
//                                 color="#A8794A"
//                             />

//                             <Text
//                                 className="
//                                     mt-2
//                                     font-semibold
//                                     text-gray-700
//                                 "
//                             >
//                                 Choose Image
//                             </Text>

//                             <Text
//                                 className="
//                                     mt-1
//                                     text-xs
//                                     text-gray-400
//                                 "
//                             >
//                                 Select an image from your device
//                             </Text>

//                         </Pressable>

//                     ) : (

//                         /* =================================================
//                            IMAGE URL
//                         ================================================= */

//                         <TextInput
//                             value={imageURL}
//                             onChangeText={setImageURL}

//                             placeholder="Image URL"

//                             placeholderTextColor="#9ca3af"

//                             autoCapitalize="none"

//                             autoCorrect={false}

//                             editable={!saving}

//                             className="
//                                 mt-4
//                                 rounded-xl
//                                 border
//                                 border-gray-200
//                                 px-4
//                                 py-3
//                                 text-gray-900
//                             "
//                         />

//                     )}

//                     {/* =================================================
//                         IMAGE PREVIEW
//                     ================================================= */}

//                     {(
//                         imageUri ||
//                         (
//                             imageMode === "url" &&
//                             imageURL
//                         )
//                     ) && (

//                             <Image
//                                 source={{
//                                     uri:
//                                         imageMode === "upload"
//                                             ? imageUri!
//                                             : imageURL,
//                                 }}

//                                 className="
//                                 mt-4
//                                 h-52
//                                 w-full
//                                 rounded-xl
//                             "

//                                 resizeMode="cover"
//                             />

//                         )}

//                 </View>

//                 {/* =================================================
//                     SAVE BUTTON
//                 ================================================= */}

//                 <Pressable
//                     onPress={handleSave}

//                     disabled={saving}

//                     className={`
//                         mt-6
//                         items-center
//                         rounded-xl
//                         px-5
//                         py-4
//                         ${saving
//                             ? "bg-gray-400"
//                             : "bg-bronze"
//                         }
//                     `}
//                 >

//                     {saving ? (

//                         <ActivityIndicator
//                             color="#ffffff"
//                         />

//                     ) : (

//                         <View
//                             className="
//                                 flex-row
//                                 items-center
//                             "
//                         >

//                             <Ionicons
//                                 name="save-outline"
//                                 size={19}
//                                 color="#ffffff"
//                             />

//                             <Text
//                                 className="
//                                     ml-2
//                                     font-bold
//                                     text-white
//                                 "
//                             >
//                                 Publish Blog
//                             </Text>

//                         </View>

//                     )}

//                 </Pressable>

//             </ScrollView>

//         </KeyboardAvoidingView>
//     );
// }