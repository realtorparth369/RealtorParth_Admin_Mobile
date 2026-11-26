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

import { useEffect, useState } from "react";

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

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
   EMPTY FORM
========================================================= */

const emptyForm: CommunityFormData = {
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

export default function EditCommunityScreen() {
    const router = useRouter();

    const { id } = useLocalSearchParams<{
        id: string;
    }>();

    const [form, setForm] =
        useState<CommunityFormData>(emptyForm);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

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
       FETCH COMMUNITY
    ======================================================= */

    useEffect(() => {
        if (!id) {
            // console.log(
            //     "No community ID provided"
            // );

            setLoading(false);

            return;
        }

        const fetchCommunity = async () => {
            try {
                // console.log(
                //     "Loading community:",
                //     id
                // );

                const response =
                    await axios.get(
                        `${API_URL}/api/communityDetails/admin/community-pages/${id}`
                    );

                const d = response.data;

                // console.log(
                //     "Community response:",
                //     d
                // );

                setForm({
                    community:
                        d.community || "",

                    slug:
                        d.slug || "",

                    tagline:
                        d.tagline || "",

                    description:
                        d.description || "",

                    downtown:
                        d.commute?.downtown || "",

                    airport:
                        d.commute?.airport || "",

                    mall:
                        d.commute?.mall || "",

                    keyFeatures:
                        Array.isArray(
                            d.keyFeatures
                        )
                            ? d.keyFeatures.join(
                                  ", "
                              )
                            : d.keyFeatures || "",

                    startingPrice:
                        d.marketSnapshot
                            ?.startingPrice || "",

                    avgDaysOnMarket:
                        d.marketSnapshot
                            ?.avgDaysOnMarket || "",

                    propertyType:
                        d.marketSnapshot
                            ?.propertyType || "",

                    metaTitle:
                        d.seo?.metaTitle || "",

                    metaDescription:
                        d.seo
                            ?.metaDescription || "",

                    schools:
                        d.schools || "",

                    safety:
                        d.safety || "",
                });
            } catch (error: any) {
                // console.error(
                //     "Failed to load community:",
                //     error?.response?.data ||
                //         error
                // );

                Alert.alert(
                    "Error",
                    error?.response?.data?.error ||
                        "Failed to load community page."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCommunity();
    }, [id]);

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
       SAVE / UPDATE
    ======================================================= */

    const handleSave = async () => {
        /* ---------------------------------------------------
           VALIDATION
        --------------------------------------------------- */

        if (!form.community.trim()) {
            Alert.alert(
                "Validation",
                "Community name is required."
            );

            return;
        }

        if (!form.slug.trim()) {
            Alert.alert(
                "Validation",
                "Slug is required."
            );

            return;
        }

        if (!id) {
            Alert.alert(
                "Error",
                "Community ID is missing."
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
            //     "Updating community"
            // );

            // console.log(
            //     "Community ID:",
            //     id
            // );

            // console.log(
            //     "Community name:",
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

            payload.append(
                "community",
                form.community.trim()
            );

            payload.append(
                "slug",
                form.slug.trim()
            );

            payload.append(
                "tagline",
                form.tagline
            );

            payload.append(
                "description",
                form.description
            );

            payload.append(
                "downtown",
                form.downtown
            );

            payload.append(
                "airport",
                form.airport
            );

            payload.append(
                "mall",
                form.mall
            );

            payload.append(
                "keyFeatures",
                form.keyFeatures
            );

            payload.append(
                "startingPrice",
                form.startingPrice
            );

            payload.append(
                "avgDaysOnMarket",
                form.avgDaysOnMarket
            );

            payload.append(
                "propertyType",
                form.propertyType
            );

            payload.append(
                "metaTitle",
                form.metaTitle
            );

            payload.append(
                "metaDescription",
                form.metaDescription
            );

            payload.append(
                "schools",
                form.schools
            );

            payload.append(
                "safety",
                form.safety
            );

            /* ------------------------------------------------
               UPDATE BY MONGODB ID

               PUT:
               /api/communityDetails/admin/community-pages/:id
            ------------------------------------------------ */

            const response =
                await axios.put(
                    `${API_URL}/api/communityDetails/admin/community-pages/${id}`,
                    payload
                );

            // console.log(
            //     "Update response:",
            //     response.data
            // );

            /* ------------------------------------------------
               VERIFY RESPONSE
            ------------------------------------------------ */

            if (!response.data?._id) {
                throw new Error(
                    "Community was not updated successfully."
                );
            }

            // console.log(
            //     "Community updated successfully:",
            //     response.data._id
            // );

            /* ------------------------------------------------
               SUCCESS

               OK -> COMMUNITY INDEX
            ------------------------------------------------ */

            Alert.alert(
                "Success",
                "Community page updated successfully.",
                [
                    {
                        text: "OK",
                        onPress:
                            goToCommunityList,
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
            //     "UPDATE COMMUNITY FAILED"
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
                serverError.includes(
                    "E11000"
                ) ||
                serverError.includes(
                    "duplicate key"
                ) ||
                serverError.includes(
                    "slug_1"
                )
            ) {
                Alert.alert(
                    "Slug Already Exists",
                    "This slug is already being used by another community. Please choose a different slug."
                );

                return;
            }

            /* -----------------------------------------------
               COMMUNITY NOT FOUND
            ----------------------------------------------- */

            if (status === 404) {
                Alert.alert(
                    "Not Found",
                    "This community could not be found. It may have been deleted."
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
                    "Failed to update community page."
            );

        } finally {
            setSaving(false);
        }
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
       LOADING
    ======================================================= */

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-gray-500">
                    Loading community...
                </Text>
            </View>
        );
    }

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
                            Edit Community
                        </Text>

                        <Text className="text-sm text-gray-500">
                            Update neighborhood information
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
                        placeholder="Community name"
                        autoCapitalize="words"
                    />

                    <Text className="mt-2 text-xs text-gray-500">
                        You can change the community
                        name. The record is updated
                        using its MongoDB ID.
                    </Text>

                    <FormInput
                        label="Slug"
                        value={form.slug}
                        onChangeText={(value) =>
                            handleChange(
                                "slug",
                                value
                            )
                        }
                        placeholder="community-slug"
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
                        placeholder="Hero tagline"
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
                        placeholder="Parks, Schools, Transit"
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
                        value={
                            form.startingPrice
                        }
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
                        value={
                            form.propertyType
                        }
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
                        value={
                            form.metaTitle
                        }
                        onChangeText={(value) =>
                            handleChange(
                                "metaTitle",
                                value
                            )
                        }
                        placeholder="SEO title"
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
                        placeholder="SEO description..."
                        multiline
                    />
                </View>

                {/* =================================================
                    SAVE BUTTON
                ================================================= */}

                <Pressable
                    onPress={handleSave}
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
                                Saving...
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
                                Save Changes
                            </Text>
                        </View>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
