import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { useState } from "react";

import { useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

/* =========================================================
   API
========================================================= */

const API_URL = "https://realtorparth.ca";

/* =========================================================
   FORM TYPE
========================================================= */

type CommunityFormData = {
    community: string;
    slug: string;
    tagline: string;
    description: string;
    downtown: string;
    airport: string;
    mall: string;
    keyFeatures: string;
    startingPrice: string;
    avgDaysOnMarket: string;
    propertyType: string;
    metaTitle: string;
    metaDescription: string;
    schools: string;
    safety: string;
};

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm: CommunityFormData = {
    community: "",
    slug: "",
    tagline: "",
    description: "",
    downtown: "",
    airport: "",
    mall: "",
    keyFeatures: "",
    startingPrice: "",
    avgDaysOnMarket: "",
    propertyType: "",
    metaTitle: "",
    metaDescription: "",
    schools: "",
    safety: "",
};

/* =========================================================
   INPUT PROPS
========================================================= */

type FormInputProps = {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: "default" | "numeric" | "email-address";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

/* =========================================================
   REUSABLE INPUT
========================================================= */

function FormInput({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    keyboardType = "default",
    autoCapitalize = "sentences",
}: FormInputProps) {
    return (
        <View className="mt-4">
            <Text className="mb-2 font-semibold text-gray-800">
                {label}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                multiline={multiline}
                numberOfLines={multiline ? 6 : 1}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={true}
                spellCheck={true}
                textAlignVertical={
                    multiline ? "top" : "center"
                }
                blurOnSubmit={false}
                returnKeyType={
                    multiline ? "default" : "next"
                }
                className={`rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 ${
                    multiline
                        ? "min-h-[140px]"
                        : "min-h-[50px]"
                }`}
            />
        </View>
    );
}

/* =========================================================
   SCREEN
========================================================= */

export default function NewCommunityScreen() {
    const router = useRouter();

    const [form, setForm] =
        useState<CommunityFormData>(initialForm);

    const [saving, setSaving] = useState(false);

    /* =======================================================
       CHANGE
    ======================================================= */

    const handleChange = (
        field: keyof CommunityFormData,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* =======================================================
       NAVIGATE TO COMMUNITY LIST
    ======================================================= */

    const goToCommunityList = () => {
        // console.log(
        //     "Navigating to community index..."
        // );

        router.push(
            "/community"
        );
    };

    /* =======================================================
       BACK
    ======================================================= */

    const handleBack = () => {
        if (saving) {
            return;
        }

        goToCommunityList();
    };

    /* =======================================================
       SAVE / CREATE
    ======================================================= */

    const handleSubmit = async () => {
        /* ---------------------------------------------------
           VALIDATION
        --------------------------------------------------- */

        if (!form.community.trim()) {
            Alert.alert(
                "Validation",
                "Please enter a community name."
            );

            return;
        }

        if (!form.slug.trim()) {
            Alert.alert(
                "Validation",
                "Please enter a slug."
            );

            return;
        }

        /* ---------------------------------------------------
           SAVE
        --------------------------------------------------- */

        try {
            setSaving(true);

            // console.log(
            //     "===================================="
            // );

            // console.log(
            //     "Creating community:"
            // );

            // console.log(
            //     "Community:",
            //     form.community
            // );

            // console.log(
            //     "Slug:",
            //     form.slug
            // );

            // console.log(
            //     "===================================="
            // );

            /* ------------------------------------------------
               FORM DATA
            ------------------------------------------------ */

            const payload = new FormData();

            Object.entries(form).forEach(
                ([key, value]) => {
                    payload.append(
                        key,
                        value
                    );
                }
            );

            /* ------------------------------------------------
               CREATE COMMUNITY

               POST:
               /api/communityDetails/admin/community-pages
            ------------------------------------------------ */

            const response = await axios.post(
                `${API_URL}/api/communityDetails/admin/community-pages`,
                payload
            );

            // console.log(
            //     "Create response:",
            //     response.data
            // );

            /* ------------------------------------------------
               VERIFY RESPONSE
            ------------------------------------------------ */

            if (!response.data?._id) {
                throw new Error(
                    "Community was not created successfully."
                );
            }

            // console.log(
            //     "Community created successfully:",
            //     response.data._id
            // );

            /* ------------------------------------------------
               SUCCESS + NAVIGATION
            ------------------------------------------------ */

            Alert.alert(
                "Success",
                "Community page created successfully.",
                [
                    {
                        text: "OK",
                        onPress: goToCommunityList,
                    },
                ],
                {
                    cancelable: false,
                }
            );

        } catch (error: any) {
            // console.error(
            //     "===================================="
            // );

            // console.error(
            //     "CREATE COMMUNITY FAILED"
            // );

            // console.error(
            //     "Status:",
            //     error?.response?.status
            // );

            // console.error(
            //     "Response:",
            //     error?.response?.data
            // );

            // console.error(
            //     "Message:",
            //     error?.message
            // );

            // console.error(
            //     "===================================="
            // );

            const status =
                error?.response?.status;

            const serverError =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "";

            /* -----------------------------------------------
               DUPLICATE SLUG
            ----------------------------------------------- */

            if (
                status === 409 ||
                serverError.includes("E11000") ||
                serverError.includes(
                    "duplicate key"
                ) ||
                serverError.includes("slug_1")
            ) {
                Alert.alert(
                    "Slug Already Exists",
                    "This slug is already being used by another community. Please choose a different slug."
                );

                return;
            }

            /* -----------------------------------------------
               VALIDATION ERROR
            ----------------------------------------------- */

            if (status === 400) {
                Alert.alert(
                    "Validation Error",
                    serverError ||
                        "Please check the community information and try again."
                );

                return;
            }

            /* -----------------------------------------------
               GENERIC ERROR
            ----------------------------------------------- */

            Alert.alert(
                "Error",
                serverError ||
                    "Failed to create community page."
            );

        } finally {
            setSaving(false);
        }
    };

    /* =======================================================
       UI
    ======================================================= */

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-100"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : "height"
            }
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 60,
                }}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
                showsVerticalScrollIndicator={false}
            >
                {/* =================================================
                    HEADER
                ================================================= */}

                <View className="flex-row items-center">
                    <Pressable
                        onPress={handleBack}
                        disabled={saving}
                        className="mr-3 rounded-xl bg-white p-3"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={21}
                            color="#374151"
                        />
                    </Pressable>

                    <View>
                        <Text className="text-xl font-bold text-gray-900">
                            New Community
                        </Text>

                        <Text className="text-sm text-gray-500">
                            Create a neighborhood page
                        </Text>
                    </View>
                </View>

                {/* =================================================
                    BASIC INFORMATION
                ================================================= */}

                <View className="mt-6 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Basic Information
                    </Text>

                    <FormInput
                        label="Community Name"
                        value={form.community}
                        onChangeText={(value) =>
                            handleChange(
                                "community",
                                value
                            )
                        }
                        placeholder="Kings Heights"
                        autoCapitalize="words"
                    />

                    <FormInput
                        label="Slug"
                        value={form.slug}
                        onChangeText={(value) =>
                            handleChange(
                                "slug",
                                value
                            )
                        }
                        placeholder="kings-heights"
                        autoCapitalize="none"
                    />

                    <FormInput
                        label="Hero Tagline"
                        value={form.tagline}
                        onChangeText={(value) =>
                            handleChange(
                                "tagline",
                                value
                            )
                        }
                        placeholder="Discover life in Kings Heights"
                    />

                    <FormInput
                        label="Description"
                        value={form.description}
                        onChangeText={(value) =>
                            handleChange(
                                "description",
                                value
                            )
                        }
                        placeholder="Community description..."
                        multiline
                    />
                </View>

                {/* =================================================
                    COMMUTE
                ================================================= */}

                <View className="mt-5 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Commute Times
                    </Text>

                    <FormInput
                        label="Downtown"
                        value={form.downtown}
                        onChangeText={(value) =>
                            handleChange(
                                "downtown",
                                value
                            )
                        }
                        placeholder="30 min"
                    />

                    <FormInput
                        label="Airport"
                        value={form.airport}
                        onChangeText={(value) =>
                            handleChange(
                                "airport",
                                value
                            )
                        }
                        placeholder="20 min"
                    />

                    <FormInput
                        label="Mall"
                        value={form.mall}
                        onChangeText={(value) =>
                            handleChange(
                                "mall",
                                value
                            )
                        }
                        placeholder="10 min"
                    />
                </View>

                {/* =================================================
                    FEATURES
                ================================================= */}

                <View className="mt-5 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Key Features
                    </Text>

                    <FormInput
                        label="Key Features"
                        value={form.keyFeatures}
                        onChangeText={(value) =>
                            handleChange(
                                "keyFeatures",
                                value
                            )
                        }
                        placeholder="Parks, Schools, Transit, Shopping"
                        multiline
                    />

                    <Text className="mt-2 text-xs text-gray-500">
                        Enter features separated by
                        commas.
                    </Text>
                </View>

                {/* =================================================
                    MARKET
                ================================================= */}

                <View className="mt-5 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Market Snapshot
                    </Text>

                    <FormInput
                        label="Starting Price"
                        value={form.startingPrice}
                        onChangeText={(value) =>
                            handleChange(
                                "startingPrice",
                                value
                            )
                        }
                        placeholder="$500,000"
                    />

                    <FormInput
                        label="Average Days on Market"
                        value={
                            form.avgDaysOnMarket
                        }
                        onChangeText={(value) =>
                            handleChange(
                                "avgDaysOnMarket",
                                value
                            )
                        }
                        placeholder="25"
                        keyboardType="numeric"
                    />

                    <FormInput
                        label="Property Type"
                        value={form.propertyType}
                        onChangeText={(value) =>
                            handleChange(
                                "propertyType",
                                value
                            )
                        }
                        placeholder="Detached, Townhouse"
                    />
                </View>

                {/* =================================================
                    RATINGS
                ================================================= */}

                <View className="mt-5 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        Community Ratings
                    </Text>

                    <FormInput
                        label="Schools"
                        value={form.schools}
                        onChangeText={(value) =>
                            handleChange(
                                "schools",
                                value
                            )
                        }
                        placeholder="8.5 / 10"
                    />

                    <FormInput
                        label="Safety"
                        value={form.safety}
                        onChangeText={(value) =>
                            handleChange(
                                "safety",
                                value
                            )
                        }
                        placeholder="9 / 10"
                    />
                </View>

                {/* =================================================
                    SEO
                ================================================= */}

                <View className="mt-5 rounded-2xl bg-white p-5">
                    <Text className="text-lg font-bold text-gray-900">
                        SEO
                    </Text>

                    <FormInput
                        label="SEO Title"
                        value={form.metaTitle}
                        onChangeText={(value) =>
                            handleChange(
                                "metaTitle",
                                value
                            )
                        }
                        placeholder="Kings Heights Calgary"
                    />

                    <FormInput
                        label="SEO Description"
                        value={
                            form.metaDescription
                        }
                        onChangeText={(value) =>
                            handleChange(
                                "metaDescription",
                                value
                            )
                        }
                        placeholder="Learn about Kings Heights..."
                        multiline
                    />
                </View>

                {/* =================================================
                    SAVE
                ================================================= */}

                <Pressable
                    onPress={handleSubmit}
                    disabled={saving}
                    className={`mt-6 items-center rounded-xl px-5 py-4 ${
                        saving
                            ? "bg-gray-400"
                            : "bg-bronze"
                    }`}
                >
                    {saving ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Creating...
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row items-center">
                            <Ionicons
                                name="save-outline"
                                size={19}
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Save Community
                            </Text>
                        </View>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}