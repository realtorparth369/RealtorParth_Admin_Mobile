import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    useCallback,
    useState,
} from "react";

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import {
    Ionicons,
} from "@expo/vector-icons";

import axios from "axios";

/* =========================================================
   API
========================================================= */

const API_URL = "https://realtorparth.ca";

/* =========================================================
   TYPES
========================================================= */

interface Resource {
    _id: string;
    title: string;
    fileUrl?: string;
    downloads: number;
    createdAt: string;
}

/* =========================================================
   SCREEN
========================================================= */

export default function ResourcesScreen() {
    const router = useRouter();

    /* =====================================================
       STATE
    ===================================================== */

    const [resources, setResources] =
        useState<Resource[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    /* =====================================================
       FETCH RESOURCES
    ===================================================== */

    const fetchResources = async (
        showLoader = true
    ) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            console.log(
                "===================================="
            );

            console.log(
                "Fetching resources..."
            );

            const response = await axios.get(
                `${API_URL}/api/resources`
            );

            console.log(
                "Resources response:",
                response.data
            );

            /* =============================================
               SAFE RESPONSE HANDLING
            ============================================= */

            let resourceData: Resource[] = [];

            if (
                Array.isArray(
                    response.data
                )
            ) {
                resourceData =
                    response.data;
            } else if (
                Array.isArray(
                    response.data?.data
                )
            ) {
                resourceData =
                    response.data.data;
            } else if (
                Array.isArray(
                    response.data?.resources
                )
            ) {
                resourceData =
                    response.data.resources;
            }

            setResources(
                resourceData
            );

            console.log(
                "Resources loaded:",
                resourceData.length
            );

            console.log(
                "===================================="
            );

        } catch (error: any) {
            console.error(
                "===================================="
            );

            console.error(
                "FAILED TO FETCH RESOURCES"
            );

            console.error(
                "Status:",
                error?.response?.status
            );

            console.error(
                "Response:",
                error?.response?.data
            );

            console.error(
                "Message:",
                error?.message
            );

            console.error(
                "===================================="
            );

            setResources([]);

            Alert.alert(
                "Error",
                error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    "Failed to load resources."
            );
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       LOAD WHEN SCREEN APPEARS / GETS FOCUS
       
       IMPORTANT:
       
       When:
       
       index.tsx
            ↓
       new.tsx
            ↓
       upload
            ↓
       router.replace(index)
       
       this runs again and gets the newest data.
    ===================================================== */

    useFocusEffect(
        useCallback(() => {
            console.log(
                "Resources screen focused - refreshing data"
            );

            fetchResources(true);

            return () => {
                console.log(
                    "Resources screen unfocused"
                );
            };
        }, [])
    );

    /* =====================================================
       PULL TO REFRESH
    ===================================================== */

    const onRefresh = async () => {
        try {
            setRefreshing(true);

            await fetchResources(false);

        } finally {
            setRefreshing(false);
        }
    };

    /* =====================================================
       DOWNLOAD
    ===================================================== */

    const handleDownload = async (
        resource: Resource
    ) => {
        try {
            const downloadUrl =
                `${API_URL}/api/resources/download/${resource._id}`;

            console.log(
                "Opening resource:",
                downloadUrl
            );

            const supported =
                await Linking.canOpenURL(
                    downloadUrl
                );

            if (!supported) {
                Alert.alert(
                    "Error",
                    "Unable to open this resource."
                );

                return;
            }

            await Linking.openURL(
                downloadUrl
            );

        } catch (error) {
            console.error(
                "Failed to open resource:",
                error
            );

            Alert.alert(
                "Error",
                "Unable to open this resource."
            );
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = (
        resource: Resource
    ) => {
        Alert.alert(
            "Delete Resource",
            `Are you sure you want to delete "${resource.title}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },

                {
                    text: "Delete",
                    style: "destructive",

                    onPress: async () => {
                        try {
                            console.log(
                                "===================================="
                            );

                            console.log(
                                "Deleting resource:",
                                resource._id
                            );

                            console.log(
                                "===================================="
                            );

                            await axios.delete(
                                `${API_URL}/api/resources/${resource._id}`
                            );

                            /* =================================
                               REMOVE IMMEDIATELY FROM UI
                            ================================= */

                            setResources(
                                (previous) =>
                                    previous.filter(
                                        (item) =>
                                            item._id !==
                                            resource._id
                                    )
                            );

                            Alert.alert(
                                "Success",
                                "Resource deleted successfully."
                            );

                        } catch (error: any) {
                            console.error(
                                "===================================="
                            );

                            console.error(
                                "DELETE RESOURCE FAILED"
                            );

                            console.error(
                                "Status:",
                                error?.response?.status
                            );

                            console.error(
                                "Response:",
                                error?.response?.data
                            );

                            console.error(
                                "Message:",
                                error?.message
                            );

                            console.error(
                                "===================================="
                            );

                            Alert.alert(
                                "Error",
                                error?.response?.data?.error ||
                                    error?.response?.data?.message ||
                                    "Failed to delete resource."
                            );
                        }
                    },
                },
            ]
        );
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-gray-500">
                    Loading resources...
                </Text>
            </View>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <ScrollView
            className="flex-1 bg-gray-100"
            contentContainerStyle={{
                padding: 20,
                paddingBottom: 60,
            }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-2xl font-bold text-gray-900">
                        Resources
                    </Text>

                    <Text className="mt-1 text-gray-500">
                        Manage downloadable guides and PDF resources.
                    </Text>
                </View>

                <Pressable
                    onPress={() =>
                        router.push(
                            "/(admin)/resources/new"
                        )
                    }
                    className="flex-row items-center rounded-xl bg-bronze px-4 py-3"
                >
                    <Ionicons
                        name="add"
                        size={20}
                        color="#ffffff"
                    />

                    <Text className="ml-1 font-bold text-white">
                        New
                    </Text>
                </Pressable>
            </View>

            {/* =================================================
                RESOURCE COUNT
            ================================================= */}

            <View className="mt-5 rounded-xl bg-white px-4 py-3">
                <View className="flex-row items-center">
                    <Ionicons
                        name="documents-outline"
                        size={20}
                        color="#A8794A"
                    />

                    <Text className="ml-2 font-semibold text-gray-700">
                        {resources.length}{" "}
                        {resources.length === 1
                            ? "Resource"
                            : "Resources"}
                    </Text>
                </View>
            </View>

            {/* =================================================
                RESOURCE LIST
            ================================================= */}

            <View className="mt-5">
                {resources.map(
                    (resource) => (
                        <View
                            key={resource._id}
                            className="mb-4 rounded-2xl border border-gray-100 bg-white p-5"
                        >
                            {/* =================================
                                RESOURCE INFORMATION
                            ================================= */}

                            <View className="flex-row">
                                {/* PDF ICON */}

                                <View className="h-14 w-14 items-center justify-center rounded-xl bg-red-50">
                                    <Ionicons
                                        name="document-text"
                                        size={30}
                                        color="#dc2626"
                                    />
                                </View>

                                {/* RESOURCE DETAILS */}

                                <View className="ml-4 flex-1">
                                    <Text
                                        className="text-base font-bold text-gray-900"
                                        numberOfLines={2}
                                    >
                                        {resource.title}
                                    </Text>

                                    <Text className="mt-1 text-sm text-gray-500">
                                        PDF
                                    </Text>

                                    <View className="mt-2 flex-row items-center">
                                        <Ionicons
                                            name="download-outline"
                                            size={15}
                                            color="#9ca3af"
                                        />

                                        <Text className="ml-1 text-xs text-gray-400">
                                            {resource.downloads ||
                                                0}{" "}
                                            Downloads
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* =================================
                                CREATED DATE
                            ================================= */}

                            <View className="mt-4 border-t border-gray-100 pt-3">
                                <Text className="text-xs text-gray-400">
                                    Created:{" "}
                                    {resource.createdAt
                                        ? new Date(
                                              resource.createdAt
                                          ).toLocaleDateString()
                                        : "N/A"}
                                </Text>
                            </View>

                            {/* =================================
                                ACTIONS
                            ================================= */}

                            <View className="mt-4 flex-row justify-end">
                                {/* DOWNLOAD */}

                                <Pressable
                                    onPress={() =>
                                        handleDownload(
                                            resource
                                        )
                                    }
                                    className="mr-3 flex-row items-center rounded-lg bg-blue-50 px-4 py-3"
                                >
                                    <Ionicons
                                        name="download-outline"
                                        size={18}
                                        color="#2563eb"
                                    />

                                    <Text className="ml-2 font-semibold text-blue-600">
                                        Download
                                    </Text>
                                </Pressable>

                                {/* DELETE */}

                                <Pressable
                                    onPress={() =>
                                        handleDelete(
                                            resource
                                        )
                                    }
                                    className="flex-row items-center rounded-lg bg-red-50 px-4 py-3"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={18}
                                        color="#dc2626"
                                    />

                                    <Text className="ml-2 font-semibold text-red-600">
                                        Delete
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )
                )}

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {resources.length === 0 && (
                    <View className="items-center rounded-2xl bg-white p-10">
                        <Ionicons
                            name="documents-outline"
                            size={45}
                            color="#9ca3af"
                        />

                        <Text className="mt-4 text-lg font-bold text-gray-700">
                            No Resources
                        </Text>

                        <Text className="mt-1 text-center text-gray-400">
                            Upload your first PDF resource.
                        </Text>

                        <Pressable
                            onPress={() =>
                                router.push(
                                    "/(admin)/resources/new"
                                )
                            }
                            className="mt-5 flex-row items-center rounded-xl bg-bronze px-5 py-3"
                        >
                            <Ionicons
                                name="add"
                                size={19}
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Upload Resource
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}